const CACHE_VERSION = 'v1';
const ASSETS = [
  '/',
  '/index.html',
  '/styles.css',
  '/application.js',
  '/chat-application.js',
  '/worker.js',
  '/manifest.json',
  '/icon.svg',
  '/favicon.ico',
  '/404.html',
  '/framework/index.js',
  '/framework/event-bus.js',
  '/framework/logger.js',
  '/framework/network-monitor.js',
  '/framework/service-worker-adapter.js',
  '/framework/install-manager.js',
  '/framework/notification-manager.js',
  '/framework/app-manager.js',
  '/framework/commands.js',
  '/worker/cache-manager.js',
  '/worker/network-manager.js',
  '/worker/message-manager.js',
];

export class CacheManager {
  constructor(cacheVersion = CACHE_VERSION) {
    this.cacheVersion = cacheVersion;
    this.assets = [...ASSETS];
  }

  async install() {
    console.log('CacheManager: Installing cache...');
    try {
      await this.updateCache();
      console.log('CacheManager: All assets cached successfully');
    } catch (error) {
      console.error('CacheManager: Failed to cache assets:', error);
      throw error;
    }
  }

  async updateCache() {
    const cache = await caches.open(this.cacheVersion);
    console.log('CacheManager: Updating cache...');
    
    for (const asset of this.assets) {
      try {
        await cache.add(asset);
        console.log('CacheManager: Cached:', asset);
      } catch (error) {
        console.error('CacheManager: Failed to cache:', asset, error);
      }
    }
  }

  async get(request) {
    const cache = await caches.open(this.cacheVersion);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      console.log('CacheManager: Serving from cache:', request.url);
      return cachedResponse;
    }
    
    return null;
  }

  async put(request, response) {
    if (response.status === 200) {
      console.log('CacheManager: Caching response:', request.url);
      const cache = await caches.open(this.cacheVersion);
      await cache.put(request, response.clone());
    }
    return response;
  }

  async cleanup() {
    const cacheNames = await caches.keys();
    const deletePromises = cacheNames
      .filter((cacheName) => cacheName !== this.cacheVersion)
      .map(async (cacheName) => {
        console.log('CacheManager: Deleting old cache:', cacheName);
        await caches.delete(cacheName);
      });
    
    await Promise.all(deletePromises);
  }

  async getFallback(request) {
    console.log('CacheManager: Getting fallback for:', request.url);
    
    const cachedResponse = await this.get(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    if (request.mode === 'navigate') {
      const cache = await caches.open(this.cacheVersion);
      const fallbackResponse = await cache.match('/index.html');
      if (fallbackResponse) {
        return fallbackResponse;
      }
    }

    return new Response('Offline - Content not available', {
      status: 503,
      statusText: 'Service Unavailable',
      headers: { 'Content-Type': 'text/plain' },
    });
  }
}
