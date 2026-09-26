using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Primitives;

namespace ElysianFunctions.Services
{
    /// <summary>
    /// Keeps the public portfolio response in memory so page loads don't hit SQL. Admin writes and
    /// finished processing call <see cref="Invalidate"/>; other instances catch up when their entry expires.
    /// </summary>
    public class PortfolioCache(IMemoryCache cache)
    {
        private static readonly TimeSpan Lifetime = TimeSpan.FromMinutes(5);

        private CancellationTokenSource _reset = new();

        public async Task<T> GetOrCreateAsync<T>(string tenantIdentifier, string? category, Func<Task<T>> factory)
        {
            var key = $"portfolio:{tenantIdentifier}:{category}";
            if (cache.TryGetValue(key, out T? cached) && cached != null)
            {
                return cached;
            }

            var value = await factory();
            cache.Set(key, value, new MemoryCacheEntryOptions { AbsoluteExpirationRelativeToNow = Lifetime }
                .AddExpirationToken(new CancellationChangeToken(_reset.Token)));

            return value;
        }

        public void Invalidate()
        {
            var previous = Interlocked.Exchange(ref _reset, new CancellationTokenSource());
            previous.Cancel();
            previous.Dispose();
        }
    }
}
