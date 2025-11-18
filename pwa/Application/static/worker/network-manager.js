export class NetworkManager {
  constructor(cacheManager) {
    this.cacheManager = cacheManager;
  }

  async fetch(request) {
    console.log('NetworkManager: Fetching from network:', request.url);
    
    try {
      const networkResponse = await fetch(request);
      
      if (networkResponse.status === 200) {
        await this.cacheManager.put(request, networkResponse.clone());
      }
      
      return networkResponse;
    } catch (error) {
      console.log('NetworkManager: Network failed for:', request.url);
      throw error;
    }
  }

  async cacheFirst(request) {
    const cachedResponse = await this.cacheManager.get(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    try {
      return await this.fetch(request);
    } catch (error) {
      return await this.cacheManager.getFallback(request);
    }
  }

  async networkFirst(request) {
    try {
      return await this.fetch(request);
    } catch (error) {
      const cachedResponse = await this.cacheManager.get(request);
      if (cachedResponse) {
        return cachedResponse;
      }
      
      return await this.cacheManager.getFallback(request);
    }
  }

  async handleFetch(request) {
    if (request.method !== 'GET') {
      return fetch(request);
    }

    if (!request.url.startsWith('http')) {
      return fetch(request);
    }

    return await this.cacheFirst(request);
  }
}
