export const ext = globalThis.browser ?? globalThis.chrome;
if (ext && !ext.action && ext.browserAction) {
  ext.action = ext.browserAction;
}

export function supportsDynamicContentScriptRegistration() {
  return typeof ext?.scripting?.registerContentScripts === 'function'
    && typeof ext?.scripting?.unregisterContentScripts === 'function';
}
