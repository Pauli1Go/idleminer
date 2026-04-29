const cacheableAssetModules = import.meta.glob("../assets/**/*", {
  eager: true,
  import: "default",
  query: "?url"
}) as Record<string, string>;

export const cacheableAssetUrls = Object.values(cacheableAssetModules);
