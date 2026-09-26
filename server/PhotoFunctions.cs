using Azure.Storage.Blobs;
using Elysian.Application.Exceptions;
using Elysian.Application.Features.Photos.Commands;
using Elysian.Application.Features.Photos.Queries;
using Elysian.Domain.Data;
using ElysianFunctions.Middleware;
using ElysianFunctions.Services;
using Finbuckle.MultiTenant.Abstractions;
using MediatR;
using Microsoft.Azure.Functions.Worker;
using Microsoft.Azure.Functions.Worker.Http;
using Microsoft.Extensions.Logging;

namespace ElysianFunctions
{
    public class PhotoFunctions(ILogger<PhotoFunctions> logger, IMediator mediator, PortfolioCache portfolioCache,
        IMultiTenantContextAccessor<ElysianTenantInfo> multiTenantContextAccessor)
    {
        /// <summary>
        /// Must match PhotoStorageSettings:OriginalsContainer
        /// </summary>
        private const string OriginalsContainer = "photo-originals";

        /// <summary>
        /// Short enough that edits show up quickly, with a long stale window so the CDN/browser
        /// never block a page load on this endpoint (cold starts, SQL)
        /// </summary>
        private const string PortfolioCacheControl = "public, max-age=300, stale-while-revalidate=86400";

        [Function("Portfolio")]
        public async Task<HttpResponseData> Portfolio([HttpTrigger(AuthorizationLevel.Anonymous, "get", Route = "portfolio")] HttpRequestData req)
        {
            var category = req.Query["category"];
            var tenantIdentifier = multiTenantContextAccessor.MultiTenantContext.TenantInfo!.Identifier!;

            var photos = await portfolioCache.GetOrCreateAsync(tenantIdentifier, category,
                () => mediator.Send(new GetPortfolioQuery(category)));

            var response = await req.WriteJsonResponseAsync(photos);
            response.Headers.Add("Cache-Control", PortfolioCacheControl);
            return response;
        }

        // Admin endpoints live under /api/manage ("admin" is a reserved Functions route prefix).
        // Authorization is enforced by the [Authorize] policies on each Elysian request.

        [Function("GetManagedPhotos")]
        public async Task<HttpResponseData> GetManagedPhotos([HttpTrigger(AuthorizationLevel.Anonymous, "get", Route = "manage/photos")] HttpRequestData req)
        {
            var photos = await mediator.Send(new GetPhotosQuery());
            return await req.WriteJsonResponseAsync(photos);
        }

        [Function("CreatePhotoUpload")]
        public async Task<HttpResponseData> CreatePhotoUpload([HttpTrigger(AuthorizationLevel.Anonymous, "post", Route = "manage/photos/upload")] HttpRequestData req)
        {
            var command = await req.DeserializeBodyAsync<CreatePhotoUploadCommand>() ?? throw new CustomValidationException();
            var upload = await mediator.Send(command);
            return await req.WriteJsonResponseAsync(upload);
        }

        [Function("UpdatePhoto")]
        public async Task<HttpResponseData> UpdatePhoto([HttpTrigger(AuthorizationLevel.Anonymous, "post", Route = "manage/photos/update")] HttpRequestData req)
        {
            var command = await req.DeserializeBodyAsync<UpdatePhotoCommand>() ?? throw new CustomValidationException();
            var photo = await mediator.Send(command);
            portfolioCache.Invalidate();
            return await req.WriteJsonResponseAsync(photo);
        }

        [Function("ReorderPhotos")]
        public async Task<HttpResponseData> ReorderPhotos([HttpTrigger(AuthorizationLevel.Anonymous, "post", Route = "manage/photos/reorder")] HttpRequestData req)
        {
            var command = await req.DeserializeBodyAsync<ReorderPhotosCommand>() ?? throw new CustomValidationException();
            await mediator.Send(command);
            portfolioCache.Invalidate();
            return await req.WriteJsonResponseAsync(new { success = true });
        }

        [Function("DeletePhoto")]
        public async Task<HttpResponseData> DeletePhoto([HttpTrigger(AuthorizationLevel.Anonymous, "post", Route = "manage/photos/delete")] HttpRequestData req)
        {
            var command = await req.DeserializeBodyAsync<DeletePhotoCommand>() ?? throw new CustomValidationException();
            await mediator.Send(command);
            portfolioCache.Invalidate();
            return await req.WriteJsonResponseAsync(new { success = true });
        }

        [Function("SetPlacement")]
        public async Task<HttpResponseData> SetPlacement([HttpTrigger(AuthorizationLevel.Anonymous, "post", Route = "manage/placements/set")] HttpRequestData req)
        {
            var command = await req.DeserializeBodyAsync<SetPlacementCommand>() ?? throw new CustomValidationException();
            await mediator.Send(command);
            portfolioCache.Invalidate();
            return await req.WriteJsonResponseAsync(new { success = true });
        }

        [Function("ReprocessPhoto")]
        public async Task<HttpResponseData> ReprocessPhoto([HttpTrigger(AuthorizationLevel.Anonymous, "post", Route = "manage/photos/reprocess")] HttpRequestData req)
        {
            var command = await req.DeserializeBodyAsync<ReprocessPhotoCommand>() ?? throw new CustomValidationException();
            var photo = await mediator.Send(command);
            portfolioCache.Invalidate();
            return await req.WriteJsonResponseAsync(photo);
        }

        /// <summary>
        /// Runs when the browser finishes uploading an original. {tenant} is read by
        /// MuliTenantFunctionsWorkerMiddleware to set the tenant, since there's no request header here.
        /// Event Grid source: needs a BlobCreated Event Grid subscription on the storage account pointing at
        /// this function's blobs extension webhook, and doesn't fire against Azurite, so use Reprocess locally.
        /// </summary>
        [Function("ProcessPhoto")]
        public async Task ProcessPhoto(
            [BlobTrigger($"{OriginalsContainer}/{{tenant}}/{{photoId}}/{{name}}", Source = BlobTriggerSource.EventGrid,
                Connection = "AzureStorageSettings:ConnectionString")] BlobClient blob,
            string tenant)
        {
            logger.LogInformation("Processing photo original {BlobName} for tenant {Tenant}", blob.Name, tenant);

            var status = await mediator.Send(new ProcessPhotoCommand(blob.Name));
            portfolioCache.Invalidate();

            logger.LogInformation("Photo original {BlobName} finished with status {Status}", blob.Name, status);
        }
    }
}
