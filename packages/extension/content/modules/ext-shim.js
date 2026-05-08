(function initExtShim() {
  const webExtensionsApi = globalThis.browser ?? globalThis.chrome;
  if (!webExtensionsApi) {
    throw new Error('WebExtensions API is unavailable');
  }
  if (!webExtensionsApi.action && webExtensionsApi.browserAction) {
    webExtensionsApi.action = webExtensionsApi.browserAction;
  }
  globalThis.ext = webExtensionsApi;
})();
