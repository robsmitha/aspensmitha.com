using System.Net;
using Elysian.Application.Features.Placements;
using Elysian.Application.Features.Placements.Commands;
using Elysian.Application.Features.Placements.Queries;
using ElysianFunctions.Middleware;
using MediatR;
using Microsoft.Azure.Functions.Worker;
using Microsoft.Azure.Functions.Worker.Http;
using Microsoft.Extensions.Logging;

namespace ElysianFunctions
{
    /// <summary>
    /// Reserved Home/Portfolio images on images.aspensmithaphotography.com/placements (Elysian placement features;
    /// see docs/plans/placement-images-cdn.md). Photo and story changes enqueue a publish; this trigger runs it.
    /// </summary>
    public class PlacementFunctions(ILogger<PlacementFunctions> logger, IMediator mediator)
    {
        /// <summary>
        /// The message's "tenant" property becomes trigger binding data, which MuliTenantFunctionsWorkerMiddleware reads
        /// </summary>
        [Function("PublishPlacements")]
        public async Task PublishPlacements(
            [QueueTrigger(PlacementQueue.QueueName, Connection = PlacementQueue.ConnectionName)] string body,
            FunctionContext context)
        {
            var message = PlacementQueue.Deserialize(body);
            var result = await mediator.Send(new PublishPlacementsCommand(message), context.CancellationToken);

            logger.LogInformation("Placement publish ({Reason}): {Outcome}, {Slots} slots, {Urls} URLs purged",
                message.Reason, result.Outcome, result.ChangedSlots, result.PurgedUrls);
        }

        // Admin endpoints live under /api/manage ("admin" is a reserved Functions route prefix).
        // Authorization is enforced by the [Authorize] policies on each Elysian request.

        /// <summary>
        /// Rebuilds every slot regardless of fingerprints: initial backfill and recovery
        /// </summary>
        [Function("RepublishPlacements")]
        public async Task<HttpResponseData> RepublishPlacements(
            [HttpTrigger(AuthorizationLevel.Anonymous, "post", Route = "manage/placements/publish")] HttpRequestData req)
        {
            if (!await mediator.Send(new RepublishPlacementsCommand()))
            {
                return await req.WriteFailureResponseAsync(HttpStatusCode.Conflict, "Placement publishing is disabled.");
            }

            return await req.WriteJsonResponseAsync(new { queued = true }, HttpStatusCode.Accepted);
        }

        [Function("GetPlacementStatus")]
        public async Task<HttpResponseData> GetPlacementStatus(
            [HttpTrigger(AuthorizationLevel.Anonymous, "get", Route = "manage/placements/status")] HttpRequestData req)
        {
            var status = await mediator.Send(new GetPlacementStatusQuery());
            return await req.WriteJsonResponseAsync(status);
        }
    }
}
