(function initExtShim() {
  const webExtensionsApi = globalThis.browser ?? globalThis.chrome;
  if (!webExtensionsApi) {
    throw new Error('WebExtensions API is unavailable');
  }
  globalThis.ext = webExtensionsApi;
})();
