export const ext = globalThis.browser ?? globalThis.chrome;

export function supportsDynamicContentScriptRegistration() {
  return typeof ext?.scripting?.registerContentScripts === 'function'
    && typeof ext?.scripting?.unregisterContentScripts === 'function';
}
