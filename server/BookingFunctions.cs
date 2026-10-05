using System.Globalization;
using System.Net;
using System.Text.Json;
using Elysian.Application.Exceptions;
using Elysian.Application.Features.Booking.Commands;
using Elysian.Application.Features.Booking.Models;
using Elysian.Application.Features.Booking.Queries;
using ElysianFunctions.Middleware;
using ElysianFunctions.Services;
using MediatR;
using Microsoft.Azure.Functions.Worker;
using Microsoft.Azure.Functions.Worker.Http;

namespace ElysianFunctions
{
    /// <summary>
    /// Public session list and online booking. Availability rules, the calendar re-check, Turnstile and the emails all
    /// happen in Elysian; these functions map results to status codes (409 conflict, 503 booking unavailable).
    /// </summary>
    public class BookingFunctions(IMediator mediator, BookingRateLimiter rateLimiter)
    {
        /// <summary>
        /// Sessions change only when edited on the products page, so a few minutes of caching is plenty
        /// </summary>
        private const string SessionsCacheControl = "public, max-age=300, stale-while-revalidate=86400";

        private const string UnavailableKey = "BOOKING_UNAVAILABLE";
        private const string UnavailableMessage = "Online booking is temporarily unavailable. Please reach out through the Contact page and we'll find a time together.";

        [Function("BookingSessions")]
        public async Task<HttpResponseData> Sessions([HttpTrigger(AuthorizationLevel.Anonymous, "get", Route = "booking/sessions")] HttpRequestData req)
        {
            var sessions = await mediator.Send(new GetBookingSessionsQuery());

            var response = await req.WriteJsonResponseAsync(sessions);
            response.Headers.Add("Cache-Control", SessionsCacheControl);
            return response;
        }

        [Function("BookingSession")]
        public async Task<HttpResponseData> Session([HttpTrigger(AuthorizationLevel.Anonymous, "get", Route = "booking/sessions/{slug}")] HttpRequestData req,
            string slug)
        {
            var session = await mediator.Send(new GetBookingSessionQuery(slug));

            var response = await req.WriteJsonResponseAsync(session);
            response.Headers.Add("Cache-Control", SessionsCacheControl);
            return response;
        }

        /// <summary>
        /// Start times for one month, e.g. ?month=2026-10. Never cached: times disappear as they're booked.
        /// </summary>
        [Function("BookingAvailability")]
        public async Task<HttpResponseData> Availability(
            [HttpTrigger(AuthorizationLevel.Anonymous, "get", Route = "booking/sessions/{slug}/availability")] HttpRequestData req, string slug)
        {
            if (!rateLimiter.TryAcquireAvailability(req.GetClientIp() ?? "unknown"))
            {
                return await RateLimitedAsync(req);
            }

            if (!DateOnly.TryParseExact(req.Query["month"] + "-01", "yyyy-MM-dd", CultureInfo.InvariantCulture, DateTimeStyles.None, out var month))
            {
                throw new CustomValidationException([new("month", "Please choose a valid month.")]);
            }

            var result = await mediator.Send(new GetBookingAvailabilityQuery(slug, month.Year, month.Month));

            var response = result.Status == BookingAvailabilityStatus.Available
                ? await req.WriteJsonResponseAsync(result.Availability)
                : await UnavailableAsync(req);
            response.Headers.Add("Cache-Control", "no-store");
            return response;
        }

        [Function("CreateBooking")]
        public async Task<HttpResponseData> Book([HttpTrigger(AuthorizationLevel.Anonymous, "post", Route = "booking/sessions/{slug}")] HttpRequestData req,
            string slug)
        {
            var clientIp = req.GetClientIp();

            if (!rateLimiter.TryAcquireBooking(clientIp ?? "unknown"))
            {
                return await RateLimitedAsync(req);
            }

            CreateBookingCommand? command;
            try
            {
                command = await req.DeserializeBodyAsync<CreateBookingCommand>();
            }
            catch (JsonException)
            {
                command = null;
            }

            if (command == null)
            {
                throw new CustomValidationException();
            }

            var result = await mediator.Send(command with { Slug = slug, RemoteIp = clientIp });

            return result.Status switch
            {
                BookingStatus.Booked => await req.WriteJsonResponseAsync(result.Booking),
                BookingStatus.Conflict => await req.WriteJsonResponseAsync(new Dictionary<string, string[]>
                {
                    ["SLOT_UNAVAILABLE"] = ["Sorry, that time was just booked or is no longer available. Please choose another time."]
                }, HttpStatusCode.Conflict),
                _ => await UnavailableAsync(req),
            };
        }

        private static Task<HttpResponseData> UnavailableAsync(HttpRequestData req) =>
            req.WriteJsonResponseAsync(new Dictionary<string, string[]> { [UnavailableKey] = [UnavailableMessage] }, HttpStatusCode.ServiceUnavailable);

        private static Task<HttpResponseData> RateLimitedAsync(HttpRequestData req) =>
            req.WriteJsonResponseAsync(new Dictionary<string, string[]>
            {
                ["RATE_LIMIT"] = ["You've made a lot of requests in a short time. Please wait a few minutes and try again."]
            }, HttpStatusCode.TooManyRequests);
    }
}
