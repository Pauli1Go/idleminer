import { cacheableAssetUrls } from "./cacheableAssets.ts";

const PRECACHE_ASSETS_MESSAGE = "IDLE_MINER_PRECACHE_ASSETS";

function getBaseUrl(): URL {
  return new URL(import.meta.env.BASE_URL, window.location.origin);
}

function normalizeCacheUrl(url: string): string | undefined {
  if (url.startsWith("blob:") || url.startsWith("data:")) {
    return undefined;
  }

  const resolvedUrl = new URL(url, window.location.href);

  if (resolvedUrl.origin !== window.location.origin) {
    return undefined;
  }

  return `${resolvedUrl.pathname}${resolvedUrl.search}`;
}

function getAppShellUrls(): string[] {
  const baseUrl = getBaseUrl();

  return [baseUrl.pathname, new URL("index.html", baseUrl).pathname, new URL("sw.js", baseUrl).pathname];
}

function getLoadedResourceUrls(): string[] {
  const resourceElements = document.querySelectorAll<HTMLLinkElement | HTMLScriptElement>("link[href], script[src]");

  return Array.from(resourceElements, (element) => {
    if (element instanceof HTMLLinkElement) {
      return element.href;
    }

    return element.src;
  });
}

function getPrecacheUrls(): string[] {
  const urls = [...getAppShellUrls(), ...getLoadedResourceUrls(), ...cacheableAssetUrls]
    .map(normalizeCacheUrl)
    .filter((url): url is string => Boolean(url));

  return [...new Set(urls)];
}

export async function registerAssetCache(): Promise<void> {
  if (!import.meta.env.PROD || !("serviceWorker" in navigator) || !("caches" in window)) {
    return;
  }

  const baseUrl = getBaseUrl();
  const registration = await navigator.serviceWorker.register(new URL("sw.js", baseUrl), {
    scope: baseUrl.pathname
  });
  const readyRegistration = await navigator.serviceWorker.ready;
  const worker = readyRegistration.active ?? registration.active ?? registration.waiting ?? registration.installing;

  worker?.postMessage({
    type: PRECACHE_ASSETS_MESSAGE,
    urls: getPrecacheUrls()
  });
}
