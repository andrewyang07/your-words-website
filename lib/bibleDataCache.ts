/**
 * Cache API wrapper for Bible JSON data
 * Caches fetched Bible data to avoid re-downloading on subsequent visits
 */

const CACHE_NAME = 'bible-data-v1';

export async function fetchWithCache(url: string): Promise<unknown> {
  // Try Cache API first (only in browser with Cache API support)
  if (typeof window !== 'undefined' && 'caches' in window) {
    try {
      const cache = await caches.open(CACHE_NAME);
      const cached = await cache.match(url);
      if (cached) {
        return cached.json();
      }

      const response = await fetch(url);
      if (response.ok) {
        // Clone response before consuming (can only read body once)
        cache.put(url, response.clone());
        return response.json();
      }
    } catch {
      // Fall through to regular fetch
    }
  }

  // Fallback: regular fetch
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status}`);
  }
  return response.json();
}
