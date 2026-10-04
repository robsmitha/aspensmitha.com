using Elysian.Application.Exceptions;
using Elysian.Application.Features.Instagram.Commands;
using Elysian.Application.Features.Instagram.Queries;
using ElysianFunctions.Middleware;
using MediatR;
using Microsoft.Azure.Functions.Worker;
using Microsoft.Azure.Functions.Worker.Http;
using Microsoft.Extensions.Logging;

namespace ElysianFunctions
{
    /// <summary>
    /// Instagram feed. Timers run for the tenant in the TenantIdentifier app setting (see MuliTenantFunctionsWorkerMiddleware).
    /// To run a timer locally: POST http://localhost:7071/admin/functions/{name} with body {}
    /// </summary>
    public class InstagramFunctions(ILogger<InstagramFunctions> logger, IMediator mediator)
    {
        /// <summary>
        /// Posts only change when the sync timer runs, so a few minutes of caching is plenty
        /// </summary>
        private const string PostsCacheControl = "public, max-age=300, stale-while-revalidate=86400";

        /// <summary>
        /// Mirrored posts for the home page feed. Reads the database only, never Instagram.
        /// </summary>
        [Function("InstagramPosts")]
        public async Task<HttpResponseData> Posts([HttpTrigger(AuthorizationLevel.Anonymous, "get", Route = "instagram/posts")] HttpRequestData req)
        {
            var posts = await mediator.Send(new GetInstagramPostsQuery());

            var response = await req.WriteJsonResponseAsync(posts);
            response.Headers.Add("Cache-Control", PostsCacheControl);
            return response;
        }

        /// <summary>
        /// Every 30 minutes: mirrors new posts (making thumbnails) and drops ones that left the feed
        /// </summary>
        [Function("SyncInstagramPosts")]
        public async Task SyncPosts([TimerTrigger("0 */30 * * * *")] TimerInfo timer)
        {
            var result = await mediator.Send(new SyncInstagramPostsCommand());
            logger.LogInformation("Instagram sync finished: {Result}", result);
        }

        /// <summary>
        /// Daily at 09:00 UTC. The command only refreshes once the token is Instagram:RefreshIntervalDays old,
        /// so running daily keeps refreshes on schedule even if the app was idle or restarted.
        /// </summary>
        [Function("RefreshInstagramToken")]
        public async Task RefreshToken([TimerTrigger("0 0 9 * * *")] TimerInfo timer)
        {
            var result = await mediator.Send(new RefreshInstagramTokenCommand());
            logger.LogInformation("Instagram token refresh check finished: {Result}", result);
        }

        // Admin endpoints live under /api/manage ("admin" is a reserved Functions route prefix).
        // Authorization is enforced by the [Authorize] policies on each Elysian request.

        [Function("GetInstagramConnection")]
        public async Task<HttpResponseData> GetConnection([HttpTrigger(AuthorizationLevel.Anonymous, "get", Route = "manage/instagram")] HttpRequestData req)
        {
            var connection = await mediator.Send(new GetInstagramConnectionQuery());
            return await req.WriteJsonResponseAsync(connection);
        }

        /// <summary>
        /// Verifies and stores a long-lived token, then syncs. The token is accepted here and never returned.
        /// </summary>
        [Function("ConnectInstagram")]
        public async Task<HttpResponseData> Connect([HttpTrigger(AuthorizationLevel.Anonymous, "post", Route = "manage/instagram/token")] HttpRequestData req)
        {
            var command = await req.DeserializeBodyAsync<ConnectInstagramCommand>() ?? throw new CustomValidationException();
            var connection = await mediator.Send(command);
            return await req.WriteJsonResponseAsync(connection);
        }
    }
}
