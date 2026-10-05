using Elysian.Application.Exceptions;
using Elysian.Application.Features.GoogleCalendar.Commands;
using Elysian.Application.Features.GoogleCalendar.Queries;
using ElysianFunctions.Middleware;
using MediatR;
using Microsoft.Azure.Functions.Worker;
using Microsoft.Azure.Functions.Worker.Http;
using Microsoft.Extensions.Logging;

namespace ElysianFunctions
{
    /// <summary>
    /// Google Calendar connection for online booking. Timers run for the tenant in the TenantIdentifier app setting
    /// (see MuliTenantFunctionsWorkerMiddleware). To run a timer locally: POST http://localhost:7071/admin/functions/{name} with body {}
    /// </summary>
    public class GoogleCalendarFunctions(ILogger<GoogleCalendarFunctions> logger, IMediator mediator)
    {
        /// <summary>
        /// Daily at 09:15 UTC. Google refresh tokens don't expire on a schedule, so this proves access still works,
        /// saves a rotated refresh token if Google issues one, and emails the photographer if access has been lost.
        /// </summary>
        [Function("CheckGoogleCalendarHealth")]
        public async Task CheckHealth([TimerTrigger("0 15 9 * * *")] TimerInfo timer)
        {
            var result = await mediator.Send(new CheckGoogleCalendarHealthCommand());
            logger.LogInformation("Google Calendar health check finished: {Result}", result);
        }

        // Admin endpoints live under /api/manage ("admin" is a reserved Functions route prefix).
        // Authorization is enforced by the [Authorize] policies on each Elysian request.

        [Function("GetGoogleCalendarConnection")]
        public async Task<HttpResponseData> GetConnection([HttpTrigger(AuthorizationLevel.Anonymous, "get", Route = "manage/google-calendar")] HttpRequestData req)
        {
            var connection = await mediator.Send(new GetGoogleCalendarConnectionQuery());
            return await req.WriteJsonResponseAsync(connection);
        }

        /// <summary>
        /// Verifies and stores a refresh token. The token is accepted here and never returned.
        /// </summary>
        [Function("ConnectGoogleCalendar")]
        public async Task<HttpResponseData> Connect([HttpTrigger(AuthorizationLevel.Anonymous, "post", Route = "manage/google-calendar/token")] HttpRequestData req)
        {
            var command = await req.DeserializeBodyAsync<ConnectGoogleCalendarCommand>() ?? throw new CustomValidationException();
            var connection = await mediator.Send(command);
            return await req.WriteJsonResponseAsync(connection);
        }
    }
}
