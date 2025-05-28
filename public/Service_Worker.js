const CACHE_NAME = 'compost-controller-cache-v1';
const URLS_TO_CACHE = [
  '/',
  '/manifest.json',
  // Puedes añadir aquí rutas a assets estáticos clave si los tienes fuera del build de Next.js
  // Por ejemplo: '/images/logo.png', '/styles/global.css'
  // Los assets de Next.js (/_next/static/...) son más complejos de cachear manualmente
  // debido a los hashes en sus nombres. Una estrategia más robusta es necesaria para ellos.
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png'
];

self.addEventListener('install', (event) => {
  console.log('[Service Worker] Install event');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[Service Worker] Opened cache:', CACHE_NAME);
        return cache.addAll(URLS_TO_CACHE);
      })
      .then(() => {
        console.log('[Service Worker] All resources have been cached.');
        return self.skipWaiting(); // Forza la activación del nuevo SW
      })
      .catch((error) => {
        console.error('[Service Worker] Cache.addAll error:', error);
      })
  );
});

self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activate event');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[Service Worker] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('[Service Worker] Claiming clients.');
      return self.clients.claim(); // Toma control inmediato de las páginas
    })
  );
});

self.addEventListener('fetch', (event) => {
  // Solo interceptamos peticiones GET
  if (event.request.method !== 'GET') {
    return;
  }

  // Estrategia: Cache First para los elementos en URLS_TO_CACHE
  // Para todo lo demás (especialmente chunks de Next.js), Network First
  // Esta es una simplificación. Un PWA robusto en Next.js requiere una estrategia más sofisticada.

  const requestUrl = new URL(event.request.url);

  // Si es una URL que sabemos que debe estar en caché (p.ej. assets estáticos o el shell)
  if (URLS_TO_CACHE.includes(requestUrl.pathname) || requestUrl.pathname.startsWith('/icons/')) {
    event.respondWith(
      caches.match(event.request)
        .then((response) => {
          if (response) {
            console.log('[Service Worker] Serving from cache:', event.request.url);
            return response;
          }
          console.log('[Service Worker] Fetching from network (and caching):', event.request.url);
          return fetch(event.request).then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              const responseToCache = networkResponse.clone();
              caches.open(CACHE_NAME)
                .then((cache) => {
                  cache.put(event.request, responseToCache);
                });
            }
            return networkResponse;
          });
        })
        .catch((error) => {
          console.error('[Service Worker] Fetch error:', error);
          // Podrías devolver una página offline aquí si la tienes cacheada
        })
    );
  } else {
    // Para otras peticiones (especialmente las de Next.js como _next/...),
    // es mejor ir a la red primero para asegurar el contenido más reciente.
    // Una estrategia "Stale-While-Revalidate" sería incluso mejor aquí.
    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => {
          // Si la petición a la red tiene éxito, la cacheamos para futuras visitas offline (opcional)
          if (networkResponse && networkResponse.status === 200 && requestUrl.protocol.startsWith('http')) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              })
              .catch(err => console.warn('[Service Worker] Failed to cache network response:', event.request.url, err));
          }
          return networkResponse;
        })
        .catch(() => {
          // Si la red falla, intentamos servir desde la caché si existe
          console.log('[Service Worker] Network fetch failed, trying cache for:', event.request.url);
          return caches.match(event.request);
          // Aquí podrías devolver una página offline genérica si `caches.match` falla.
        })
    );
  }
});
