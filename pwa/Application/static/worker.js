import { CacheManager } from './worker/cache-manager.js';
import { NetworkManager } from './worker/network-manager.js';
import { MessageManager } from './worker/message-manager.js';

const cacheManager = new CacheManager();
const networkManager = new NetworkManager(cacheManager);
const messageManager = new MessageManager();

self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...');
  event.waitUntil(
    (async () => {
      await cacheManager.install();
      await self.skipWaiting();
    })()
  );
});

self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...');
  event.waitUntil(
    (async () => {
      await cacheManager.cleanup();
      await self.clients.claim();
      console.log('Service Worker: Activated successfully');
    })()
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(networkManager.handleFetch(event.request));
});

const messageHandlers = {
  connect: () => {
    messageManager.connect();
  },
  disconnect: () => {
    messageManager.disconnect();
  },
  online: () => {
    messageManager.connect();
  },
  offline: () => {
    messageManager.disconnect();
  },
  message: (event) => {
    const packet = { type: 'message', content: event.data.content };
    const sent = messageManager.send(packet);
    
    // Broadcast всім крім відправника
    if (sent) {
      self.clients.matchAll({ includeUncontrolled: true }).then((clients) => {
        clients.forEach((client) => {
          if (client !== event.source) {
            client.postMessage(packet);
          }
        });
      });
    }
  },
  ping: (event) => {
    event.source.postMessage({ type: 'pong' });
  },
  updateCache: async (event) => {
    console.log('Service Worker: Manual cache update requested');
    try {
      await cacheManager.updateCache();
      event.source.postMessage({ type: 'cacheUpdated' });
    } catch (error) {
      event.source.postMessage({
        type: 'cacheUpdateFailed',
        error: error.message,
      });
    }
  },
};

self.addEventListener('message', (event) => {
  console.log('Service Worker: received message', event.data);
  
  const { type } = event.data;
  const handler = messageHandlers[type];
  
  if (handler) {
    handler(event);
  } else {
    console.warn('Service Worker: Unknown message type:', type);
  }
});

messageManager.connect();
