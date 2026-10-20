using Elysian.Application.Exceptions;
using Elysian.Application.Features.Stories.Commands;
using Elysian.Application.Features.Stories.Queries;
using Elysian.Domain.Data;
using ElysianFunctions.Middleware;
using ElysianFunctions.Services;
using Finbuckle.MultiTenant.Abstractions;
using MediatR;
using Microsoft.Azure.Functions.Worker;
using Microsoft.Azure.Functions.Worker.Http;

namespace ElysianFunctions
{
    /// <summary>
    /// Stories: a wedding, event or other session told as a page. Photo uploads, reordering and edits for a
    /// story's photos go through the photo endpoints (upload takes a storyId).
    /// </summary>
    public class StoryFunctions(IMediator mediator, PortfolioCache portfolioCache,
        IMultiTenantContextAccessor<ElysianTenantInfo> multiTenantContextAccessor)
    {
        [Function("Stories")]
        public async Task<HttpResponseData> Stories([HttpTrigger(AuthorizationLevel.Anonymous, "get", Route = "stories")] HttpRequestData req)
        {
            var category = req.Query["category"];
            var tenantIdentifier = multiTenantContextAccessor.MultiTenantContext.TenantInfo!.Identifier!;

            var stories = await portfolioCache.GetOrCreateAsync("stories", tenantIdentifier, category,
                () => mediator.Send(new GetStoriesQuery(category)));

            var response = await req.WriteJsonResponseAsync(stories);
            response.Headers.Add("Cache-Control", PhotoFunctions.PortfolioCacheControl);
            return response;
        }

        [Function("Story")]
        public async Task<HttpResponseData> Story([HttpTrigger(AuthorizationLevel.Anonymous, "get", Route = "stories/{slug}")] HttpRequestData req,
            string slug)
        {
            var tenantIdentifier = multiTenantContextAccessor.MultiTenantContext.TenantInfo!.Identifier!;

            var story = await portfolioCache.GetOrCreateAsync("story", tenantIdentifier, slug,
                () => mediator.Send(new GetStoryQuery(slug)));

            var response = await req.WriteJsonResponseAsync(story);
            response.Headers.Add("Cache-Control", PhotoFunctions.PortfolioCacheControl);
            return response;
        }

        // Admin endpoints live under /api/manage ("admin" is a reserved Functions route prefix).
        // Authorization is enforced by the [Authorize] policies on each Elysian request.

        [Function("GetManagedStories")]
        public async Task<HttpResponseData> GetManagedStories([HttpTrigger(AuthorizationLevel.Anonymous, "get", Route = "manage/stories")] HttpRequestData req)
        {
            var stories = await mediator.Send(new GetManagedStoriesQuery());
            return await req.WriteJsonResponseAsync(stories);
        }

        [Function("GetManagedStory")]
        public async Task<HttpResponseData> GetManagedStory([HttpTrigger(AuthorizationLevel.Anonymous, "get", Route = "manage/stories/{storyId:guid}")] HttpRequestData req,
            Guid storyId)
        {
            var story = await mediator.Send(new GetManagedStoryQuery(storyId));
            return await req.WriteJsonResponseAsync(story);
        }

        [Function("CreateStory")]
        public async Task<HttpResponseData> CreateStory([HttpTrigger(AuthorizationLevel.Anonymous, "post", Route = "manage/stories/create")] HttpRequestData req)
        {
            var command = await req.DeserializeBodyAsync<CreateStoryCommand>() ?? throw new CustomValidationException();
            var story = await mediator.Send(command);
            portfolioCache.Invalidate();
            return await req.WriteJsonResponseAsync(story);
        }

        [Function("UpdateStory")]
        public async Task<HttpResponseData> UpdateStory([HttpTrigger(AuthorizationLevel.Anonymous, "post", Route = "manage/stories/update")] HttpRequestData req)
        {
            var command = await req.DeserializeBodyAsync<UpdateStoryCommand>() ?? throw new CustomValidationException();
            var story = await mediator.Send(command);
            portfolioCache.Invalidate();
            return await req.WriteJsonResponseAsync(story);
        }

        [Function("SetStoryStatus")]
        public async Task<HttpResponseData> SetStoryStatus([HttpTrigger(AuthorizationLevel.Anonymous, "post", Route = "manage/stories/status")] HttpRequestData req)
        {
            var command = await req.DeserializeBodyAsync<SetStoryStatusCommand>() ?? throw new CustomValidationException();
            var story = await mediator.Send(command);
            portfolioCache.Invalidate();
            return await req.WriteJsonResponseAsync(story);
        }

        [Function("DeleteStory")]
        public async Task<HttpResponseData> DeleteStory([HttpTrigger(AuthorizationLevel.Anonymous, "post", Route = "manage/stories/delete")] HttpRequestData req)
        {
            var command = await req.DeserializeBodyAsync<DeleteStoryCommand>() ?? throw new CustomValidationException();
            await mediator.Send(command);
            portfolioCache.Invalidate();
            return await req.WriteJsonResponseAsync(new { success = true });
        }
    }
}
