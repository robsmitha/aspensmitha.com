using System.Net;
using System.Text.Json;
using Elysian.Application.Exceptions;
using Elysian.Application.Features.Contact.Commands;
using ElysianFunctions.Middleware;
using ElysianFunctions.Services;
using MediatR;
using Microsoft.Azure.Functions.Worker;
using Microsoft.Azure.Functions.Worker.Http;

namespace ElysianFunctions
{
    public class ContactFunctions(IMediator mediator, ContactRateLimiter rateLimiter)
    {
        /// <summary>
        /// Validation, the honeypot, Turnstile verification and the email all happen in Elysian's
        /// <see cref="SendContactMessageCommand"/>; failures surface as 400s via ExceptionHandlingMiddleware.
        /// </summary>
        [Function("Contact")]
        public async Task<HttpResponseData> Contact([HttpTrigger(AuthorizationLevel.Anonymous, "post", Route = "contact")] HttpRequestData req)
        {
            var clientIp = GetClientIp(req);

            if (!rateLimiter.TryAcquire(clientIp ?? "unknown"))
            {
                return await req.WriteJsonResponseAsync(new Dictionary<string, string[]>
                {
                    ["RATE_LIMIT"] = ["You've sent a few messages in a short time. Please wait a few minutes and try again."]
                }, HttpStatusCode.TooManyRequests);
            }

            SendContactMessageCommand? command;
            try
            {
                command = await req.DeserializeBodyAsync<SendContactMessageCommand>();
            }
            catch (JsonException)
            {
                command = null;
            }

            if (command == null)
            {
                throw new CustomValidationException();
            }

            await mediator.Send(command with { RemoteIp = clientIp });
            return await req.WriteJsonResponseAsync(new { success = true });
        }

        /// <summary>
        /// Static Web Apps and the Functions front end pass the caller's address in X-Forwarded-For,
        /// sometimes with a port attached
        /// </summary>
        private static string? GetClientIp(HttpRequestData req)
        {
            if (!req.Headers.TryGetValues("X-Forwarded-For", out var values))
            {
                return null;
            }

            var first = values.FirstOrDefault()?.Split(',')[0].Trim();
            if (string.IsNullOrEmpty(first))
            {
                return null;
            }

            return IPEndPoint.TryParse(first, out var endpoint) ? endpoint.Address.ToString() : first;
        }
    }
}
