const CACHE_VERSION = 'recipe-flow-v4'
const APP_SHELL_CACHE = `app-shell-${CACHE_VERSION}`
const RUNTIME_CACHE = `runtime-${CACHE_VERSION}`
const BASE_PATH = '/recepies'
const OFFLINE_FALLBACK_URL = `${BASE_PATH}/index.html`

const APP_SHELL_FILES = [
  `${BASE_PATH}/`,
  OFFLINE_FALLBACK_URL,
  `${BASE_PATH}/manifest.webmanifest`,
  `${BASE_PATH}/icons/icon-192.svg`,
  `${BASE_PATH}/icons/icon-512.svg`,
  `${BASE_PATH}/icons/icon-maskable-512.svg`,
]

async function cacheResponse(cacheName, request, response) {
  if (!response || !response.ok || response.type === 'opaque') {
    return response
  }

  const cache = await caches.open(cacheName)
  await cache.put(request, response.clone())
  return response
}

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(APP_SHELL_CACHE).then((cache) => cache.addAll(APP_SHELL_FILES)))
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheKeys) =>
        Promise.all(
          cacheKeys
            .filter((cacheName) => ![APP_SHELL_CACHE, RUNTIME_CACHE].includes(cacheName))
            .map((cacheName) => caches.delete(cacheName)),
        ),
      )
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') {
    return
  }

  const requestUrl = new URL(event.request.url)

  if (requestUrl.origin !== self.location.origin) {
    return
  }

  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((response) => cacheResponse(RUNTIME_CACHE, event.request, response))
        .catch(async () => (await caches.match(event.request)) || caches.match(OFFLINE_FALLBACK_URL)),
    )
    return
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const fetchPromise = fetch(event.request)
        .then((response) => cacheResponse(RUNTIME_CACHE, event.request, response))
        .catch(() => null)

      if (cachedResponse) {
        return cachedResponse
      }

      return fetchPromise.then((response) => response || caches.match(OFFLINE_FALLBACK_URL))
    }),
  )
})
