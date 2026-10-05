using System.Threading.RateLimiting;

namespace ElysianFunctions.Services
{
    /// <summary>
    /// Per-client limits for the public booking endpoints, applied directly in the functions like
    /// <see cref="ContactRateLimiter"/>. Bookings allow 5 per 10 minutes; availability (each call reads Google Calendar)
    /// allows 60 per 10 minutes, plenty for paging through months. State is in memory per Functions instance.
    /// </summary>
    public sealed class BookingRateLimiter : IDisposable
    {
        private readonly PartitionedRateLimiter<string> _bookings = Create(5);
        private readonly PartitionedRateLimiter<string> _availability = Create(60);

        public bool TryAcquireBooking(string clientKey) => TryAcquire(_bookings, clientKey);

        public bool TryAcquireAvailability(string clientKey) => TryAcquire(_availability, clientKey);

        public void Dispose()
        {
            _bookings.Dispose();
            _availability.Dispose();
        }

        private static bool TryAcquire(PartitionedRateLimiter<string> limiter, string clientKey)
        {
            using var lease = limiter.AttemptAcquire(clientKey);
            return lease.IsAcquired;
        }

        private static PartitionedRateLimiter<string> Create(int permitLimit) =>
            PartitionedRateLimiter.Create<string, string>(clientKey =>
                RateLimitPartition.GetSlidingWindowLimiter(clientKey, _ => new SlidingWindowRateLimiterOptions
                {
                    PermitLimit = permitLimit,
                    Window = TimeSpan.FromMinutes(10),
                    SegmentsPerWindow = 5,
                    QueueLimit = 0,
                }));
    }
}
