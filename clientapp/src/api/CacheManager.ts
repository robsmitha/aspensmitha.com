// Define interface for cache item structure
interface CacheItem<T> {
    json: T;
    cached_at: number;
}
  
  // Create a better typed cache manager
class CacheManager {
    private cache: Map<string, CacheItem<any>>;
    private readonly storageKey: string = 'cache';
  
    constructor(storageKey: string = 'cache') {
      this.storageKey = storageKey;
      this.cache = this.loadFromStorage();
    }
  
    private loadFromStorage(): Map<string, CacheItem<any>> {
      try {
        const storedCache = sessionStorage.getItem(this.storageKey);
        if (storedCache !== null) {
          return new Map(JSON.parse(storedCache));
        }
      } catch (error) {
        console.error('Failed to load cache from storage:', error);
      }
      return new Map();
    }
  
    private saveToStorage(): void {
      try {
        sessionStorage.setItem(
          this.storageKey,
          JSON.stringify(Array.from(this.cache.entries()))
        );
      } catch (error) {
        console.error('Failed to save cache to storage:', error);
      }
    }
  
    public has(url: string): boolean {
      return this.cache.has(url);
    }
  
    public get<T>(url: string): CacheItem<T> | undefined {
      return this.cache.get(url) as CacheItem<T> | undefined;
    }
  
    public set<T>(url: string, item: CacheItem<T>): void {
      this.cache.set(url, item);
      this.saveToStorage();
    }
  
    public clear(): void {
      this.cache.clear();
      this.saveToStorage();
    }
}

const cacheManager = new CacheManager();
  
export async function get<T>(url: string): Promise<T | null> {
    // Check cache
    if (cacheManager.has(url)) {
        const item = cacheManager.get<T>(url);
        if (item) {
        return item.json;
        }
    }

    // Do request
    try {
        const response = await fetch(url);
        if (response !== undefined && response.ok) {
            const json: T = await response.json();
            
            cacheManager.set<T>(url, {
                json: json,
                cached_at: new Date().getTime()
            });
            
            return json;
        }
    } catch (error) {
        console.error('Error fetching data:', error);
    }

    return null;
}