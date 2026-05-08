# Firefox Developer Edition setup

## Load as a temporary add-on

1. Open `about:debugging#/runtime/this-firefox` in Firefox Developer Edition.
2. Click **Load Temporary Add-on…**.
3. Select `packages/extension/manifest.json` from your cloned repository.
4. Pin the extension and open the popup from the toolbar.

## Troubleshooting: background service worker disabled

If loading the add-on shows `background.service_worker is currently disabled. Add background.scripts`, enable MV3 service workers:

1. Open `about:config`.
2. Set `extensions.manifestV3.enabled` to `true`.
3. Set `extensions.backgroundServiceWorker.enabled` to `true`.
4. Restart Firefox and load the add-on again.

If those prefs are missing or locked, use Firefox Developer Edition or Nightly (MV3 service workers are not fully supported in stable releases).

## Permissions and behavior notes

- The extension auto-runs on localhost-style URLs declared in `host_permissions`.
- Non-local sites require permission grant from the popup (`Enable for this site` / `Enable for all sites`).
- `file:///*` access in Firefox requires enabling local file access for the extension in `about:addons` after loading.
- Firefox may behave differently for dynamic content-script registration; this extension includes a fallback injector for enabled sites.

## Quick test checklist

1. Open a localhost page (for example `http://localhost:3000`).
2. Open popup and toggle Vibe Annotations.
3. Reload the page and confirm overlay hidden/visible state persists.
4. Open Browser Console (`Ctrl+Shift+J`) and verify background/content scripts have no uncaught extension errors.

## Package zip for testing

From the repo root:

```bash
cd packages/extension
zip -r /tmp/vibe-annotations-firefox.zip . -x "*.DS_Store" -x "__MACOSX/*"
```
