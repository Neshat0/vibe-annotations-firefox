(function initExtShim() {
  const webExtensionsApi = globalThis.browser ?? globalThis.chrome;
  if (!webExtensionsApi) {
    throw new Error('WebExtensions API is unavailable');
  }
  if (!webExtensionsApi.action && webExtensionsApi.browserAction) {
    webExtensionsApi.action = webExtensionsApi.browserAction;
  }
  globalThis.ext = webExtensionsApi;

  globalThis.vibeSetHTML = (el, html) => {
    if (!el) return;
    const parsed = new DOMParser().parseFromString(String(html), 'text/html');
    const frag = document.createDocumentFragment();
    for (const node of parsed.body.childNodes) {
      frag.appendChild(node.cloneNode(true));
    }
    el.replaceChildren(frag);
  };
})();
