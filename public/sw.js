const CACHE_NAME = "idle-miner-assets-v1";
const PRECACHE_ASSETS_MESSAGE = "IDLE_MINER_PRECACHE_ASSETS";
const CACHEABLE_DESTINATIONS = new Set(["audio", "font", "image", "manifest", "script", "style", "video", "worker"]);
const CACHEABLE_PATH_PATTERN = /\.(?:avif|css|gif|html|ico|jpeg|jpg|js|json|mp3|ogg|png|svg|ttf|wasm|wav|webm|webp|woff2?)$/i;

function createScopeUrl(path) {
  return new URL(path, self.registration.scope).toString();
}

function isSameOriginRequest(request) {
  return new URL(request.url).origin === self.location.origin;
}

function shouldCacheRequest(request) {
  if (request.method !== "GET" || !isSameOriginRequest(request)) {
    return false;
  }

  const url = new URL(request.url);

  return CACHEABLE_DESTINATIONS.has(request.destination) || CACHEABLE_PATH_PATTERN.test(url.pathname);
}

async function putSuccessfulResponse(cache, request, response) {
  if (response.ok) {
    await cache.put(request, response.clone());
  }

  return response;
}

async function cacheFirst(request) {
  const cache = await caches.open(CACHE_NAME);
  const cachedResponse = await cache.match(request);

  if (cachedResponse) {
    return cachedResponse;
  }

  const response = await fetch(request);
  return putSuccessfulResponse(cache, request, response);
}

async function networkFirst(request) {
  const cache = await caches.open(CACHE_NAME);

  try {
    const response = await fetch(request);
    return putSuccessfulResponse(cache, request, response);
  } catch (error) {
    const cachedResponse = await cache.match(request);
    const cachedIndex = await cache.match(createScopeUrl("index.html"));

    if (cachedResponse) {
      return cachedResponse;
    }

    if (cachedIndex) {
      return cachedIndex;
    }

    throw error;
  }
}

async function precacheUrls(urls) {
  const cache = await caches.open(CACHE_NAME);
  const requests = [...new Set(urls)]
    .map((url) => new URL(url, self.registration.scope))
    .filter((url) => url.origin === self.location.origin)
    .map((url) => new Request(url, { cache: "reload" }));

  await Promise.allSettled(
    requests.map(async (request) => {
      const response = await fetch(request);
      await putSuccessfulResponse(cache, request, response);
    })
  );
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    Promise.all([
      precacheUrls([createScopeUrl("."), createScopeUrl("index.html")]),
      self.skipWaiting()
    ])
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    Promise.all([
      caches
        .keys()
        .then((cacheNames) =>
          Promise.all(
            cacheNames
              .filter((cacheName) => cacheName.startsWith("idle-miner-") && cacheName !== CACHE_NAME)
              .map((cacheName) => caches.delete(cacheName))
          )
        ),
      self.clients.claim()
    ])
  );
});

self.addEventListener("message", (event) => {
  if (event.data?.type !== PRECACHE_ASSETS_MESSAGE || !Array.isArray(event.data.urls)) {
    return;
  }

  event.waitUntil(precacheUrls(event.data.urls));
});

self.addEventListener("fetch", (event) => {
  const { request } = event;

  if (request.mode === "navigate" && isSameOriginRequest(request)) {
    event.respondWith(networkFirst(request));
    return;
  }

  if (shouldCacheRequest(request)) {
    event.respondWith(cacheFirst(request));
  }
});
