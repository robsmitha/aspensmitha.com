using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Primitives;

namespace ElysianFunctions.Services
{
    /// <summary>
    /// Keeps public photo responses (portfolio, story lists, story pages) in memory so page loads don't hit SQL.
    /// Any photo or story write and finished processing call <see cref="Invalidate"/>, which clears every scope,
    /// since a photo change can show up in any of them; other instances catch up when their entry expires.
    /// </summary>
    public class PortfolioCache(IMemoryCache cache)
    {
        private static readonly TimeSpan Lifetime = TimeSpan.FromMinutes(5);

        private CancellationTokenSource _reset = new();

        /// <param name="scope">What's cached, e.g. "portfolio" or "story"</param>
        /// <param name="key">Narrows the scope, e.g. a category or slug</param>
        public async Task<T> GetOrCreateAsync<T>(string scope, string tenantIdentifier, string? key, Func<Task<T>> factory)
        {
            key = $"{scope}:{tenantIdentifier}:{key}";
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
