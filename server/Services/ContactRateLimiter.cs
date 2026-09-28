using System.Threading.RateLimiting;

namespace ElysianFunctions.Services
{
    /// <summary>
    /// Per-client limit on contact submissions (5 per 10 minutes). The isolated worker uses HttpRequestData
    /// rather than the ASP.NET Core pipeline, so this is applied directly in the function. State is in memory,
    /// so each Functions instance counts separately, which is fine for a low-volume form behind Turnstile.
    /// </summary>
    public sealed class ContactRateLimiter : IDisposable
    {
        private readonly PartitionedRateLimiter<string> _limiter = PartitionedRateLimiter.Create<string, string>(clientKey =>
            RateLimitPartition.GetSlidingWindowLimiter(clientKey, _ => new SlidingWindowRateLimiterOptions
            {
                PermitLimit = 5,
                Window = TimeSpan.FromMinutes(10),
                SegmentsPerWindow = 5,
                QueueLimit = 0,
            }));

        public bool TryAcquire(string clientKey)
        {
            using var lease = _limiter.AttemptAcquire(clientKey);
            return lease.IsAcquired;
        }

        public void Dispose() => _limiter.Dispose();
    }
}
