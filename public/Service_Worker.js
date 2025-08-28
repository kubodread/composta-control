// Define un nombre de caché único y versionado.
// Cambia este nombre cada vez que publiques una nueva versión de la app
// para forzar al Service Worker a actualizarse y cachear los nuevos archivos.
const CACHE_NAME = 'compost-controller-cache-v1.3';

// El Service Worker necesita acceso a la lista de archivos generados por Next.js.
// Next.js expone esto en una variable global `self.__BUILD_MANIFEST`.
const buildManifest = self.__BUILD_MANIFEST;

// Extraemos las URLs de los archivos JS, CSS y otros assets del manifiesto.
// Esto incluye chunks de la app, páginas, etc.
const urlsToCache = [
  '/', // La página de inicio
  '/manifest.json',
  '/icons/192x192.png',
  '/icons/512x512.png',
  ...Object.values(buildManifest.pages).flat(), // Archivos JS de las páginas
  ...buildManifest.lowPriorityFiles.flat(), // Otros assets
  ...build_manifest.root.flat(), // Archivos raiz
];


// Evento 'install': Se dispara cuando el Service Worker se instala por primera vez.
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Instalando...');
  // Espera a que la promesa de abrir la caché y añadir todos los assets se resuelva.
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[Service Worker] Abriendo caché y añadiendo assets al precache:', urlsToCache);
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        console.log('[Service Worker] Todos los assets han sido cacheados. ¡Instalación completa!');
        // Forzar al nuevo Service Worker a activarse inmediatamente.
        return self.skipWaiting();
      })
      .catch(error => {
        console.error('[Service Worker] Fallo al cachear assets durante la instalación:', error);
      })
  );
});

// Evento 'activate': Se dispara después de la instalación, cuando el SW se activa.
// Es un buen lugar para limpiar cachés antiguas.
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activando...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          // Si el nombre de la caché no coincide con el actual, la eliminamos.
          if (cacheName !== CACHE_NAME) {
            console.log(`[Service Worker] Limpiando caché antigua: ${cacheName}`);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('[Service Worker] Activación completa. Reclamando clientes...');
      // Permite que el SW activo tome control inmediato de las páginas en su scope.
      return self.clients.claim();
    })
  );
});

// Evento 'fetch': Se dispara cada vez que la aplicación realiza una petición de red.
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Ignorar peticiones que no son GET.
  if (request.method !== 'GET') {
    return;
  }

  // Estrategia Stale-While-Revalidate para las navegaciones (peticiones de HTML).
  if (request.mode === 'navigate') {
    event.respondWith(
      caches.open(CACHE_NAME).then(async (cache) => {
        // Intenta obtener la respuesta desde la red primero.
        try {
          const networkResponse = await fetch(request);
          // Si tiene éxito, actualiza la caché y devuelve la respuesta de la red.
          cache.put(request, networkResponse.clone());
          return networkResponse;
        } catch (error) {
          // Si la red falla, busca en la caché.
          console.log('[Service Worker] Red falló, sirviendo desde caché para:', request.url);
          return cache.match(request);
        }
      })
    );
    return;
  }

  // Estrategia Cache First para otros assets (JS, CSS, fuentes, imágenes locales).
  // Estos archivos fueron pre-cacheados durante la instalación.
  if (urlsToCache.includes(url.pathname)) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        // Si la respuesta está en la caché, la devolvemos.
        if (cachedResponse) {
          return cachedResponse;
        }
        // Si no, intentamos obtenerla de la red (como fallback, aunque no debería ser necesario si el precacheo fue exitoso).
        return fetch(request).then((networkResponse) => {
          return networkResponse;
        });
      })
    );
    return;
  }

  // Estrategia Cache First, then Network para imágenes de placehold.co
  if (url.hostname === 'placehold.co') {
    event.respondWith(
      caches.open(CACHE_NAME).then(async (cache) => {
        const cachedResponse = await cache.match(request);
        if (cachedResponse) {
          return cachedResponse;
        }
        try {
          const networkResponse = await fetch(request);
          cache.put(request, networkResponse.clone());
          return networkResponse;
        } catch (error) {
          console.error('[Service Worker] No se pudo obtener la imagen de placehold.co desde la red ni desde la caché:', error);
          // Opcional: devolver una imagen de fallback si la red y la caché fallan.
        }
      })
    );
    return;
  }


  // Para cualquier otra petición, simplemente déjala pasar a la red.
  event.respondWith(fetch(request));
});
