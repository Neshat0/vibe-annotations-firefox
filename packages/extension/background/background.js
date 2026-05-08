// Vibe Annotations Background Service Worker (ES module)

import { ext, supportsDynamicContentScriptRegistration } from './ext.js';
import { isEnabledSite, isSupportedUrl } from './url-filter.js';
import { updateBadge, clearBadge, updateBadgeForUrl, updateAllBadges } from './badge.js';
import { isConnected, checkConnection, syncAll, saveOne, deleteOne, smartSync, fetchAnnotations } from './api-sync.js';
import { formatExport } from './export.js';
import { migrateSyncFlags } from './utils.js';

const CONTENT_SCRIPT_FILES = [
  'content/modules/ext-shim.js',
  'content/modules/event-bus.js',
  'content/modules/styles.js',
  'content/modules/shadow-host.js',
  'content/modules/theme-manager.js',
  'content/modules/api-bridge.js',
  'content/modules/shadow-dom-utils.js',
  'content/modules/element-context.js',
  'content/modules/badge-manager.js',
  'content/modules/inspection-mode.js',
  'content/modules/popover-panels.js',
  'content/modules/annotation-popover.js',
  'content/modules/toolbar-docs.js',
  'content/modules/floating-toolbar.js',
  'content/modules/bridge-handler.js',
  'content/content.js'
];

class VibeAnnotationsBackground {
  constructor() {
    this._storageQueue = Promise.resolve();
    this._injectedTabUrls = new Map();
    this.init();
  }

  _withStorageLock(fn) {
    this._storageQueue = this._storageQueue.then(fn, fn);
    return this._storageQueue;
  }

  init() {
    this.setupInstallListener();
    this.setupMessageListener();
    this.setupTabListener();
    this.setupStorageListener();
    this.restoreEnabledSites();
    migrateSyncFlags();
    this.startConnectionMonitoring();
  }

  // --- Lifecycle ---

  setupInstallListener() {
    ext.runtime.onInstalled.addListener((details) => {
      if (details.reason === 'install') this.handleFirstInstall();
      else if (details.reason === 'update') this.handleUpdate(details.previousVersion);
    });
  }

  async handleFirstInstall() {
    try {
      await ext.storage.local.set({
        annotations: [],
        settings: { version: '0.1.0', firstInstall: Date.now(), apiEnabled: false }
      });
    } catch (error) {
      console.error('Error setting up initial storage:', error);
    }
  }

  async handleUpdate(previousVersion) {
    try {
      const currentVersion = ext.runtime.getManifest().version;
      await ext.storage.local.set({
        updateInfo: {
          hasUpdate: true, previousVersion, currentVersion,
          timestamp: Date.now(),
          releaseUrl: `https://github.com/Neshat0/vibe-annotations-firefox/releases/tag/v${currentVersion}`
        }
      });
      ext.action.setBadgeText({ text: 'NEW' });
      ext.action.setBadgeBackgroundColor({ color: '#D03D68' });

      const result = await ext.storage.local.get(['settings']);
      const settings = result.settings || {};
      settings.lastUpdate = Date.now();
      settings.previousVersion = previousVersion;
      await ext.storage.local.set({ settings });
    } catch (error) {
      console.error('Error during update migration:', error);
    }
  }

  // --- Message routing ---

  setupMessageListener() {
    ext.runtime.onMessage.addListener((request, sender, sendResponse) => {
      switch (request.action) {
        case 'getAnnotations':
          fetchAnnotations(request.url)
            .then(annotations => sendResponse({ success: true, annotations }))
            .catch(error => sendResponse({ success: false, error: error.message }));
          break;
        case 'saveAnnotation':
          this.saveAnnotation(request.annotation)
            .then(() => sendResponse({ success: true }))
            .catch(error => sendResponse({ success: false, error: error.message }));
          break;
        case 'deleteAnnotation':
          this.deleteAnnotation(request.id)
            .then(() => sendResponse({ success: true }))
            .catch(error => sendResponse({ success: false, error: error.message }));
          break;
        case 'deleteAnnotationsByUrl':
          this.deleteAnnotationsByUrl(request.url)
            .then(({ count }) => sendResponse({ success: true, count }))
            .catch(error => sendResponse({ success: false, error: error.message }));
          break;
        case 'updateAnnotation':
          this.updateAnnotation(request.id, request.updates)
            .then(() => sendResponse({ success: true }))
            .catch(error => sendResponse({ success: false, error: error.message }));
          break;
        case 'exportAnnotations':
          formatExport(request.format)
            .then(data => sendResponse({ success: true, data }))
            .catch(error => sendResponse({ success: false, error: error.message }));
          break;
        case 'checkMCPStatus':
          checkConnection()
            .then(status => sendResponse({ success: true, status }))
            .catch(error => sendResponse({ success: false, error: error.message }));
          break;
        case 'enableSite':
          this.enableSite(request.originPattern, request.tabId)
            .then(() => sendResponse({ success: true }))
            .catch(error => sendResponse({ success: false, error: error.message }));
          break;
        case 'openPopupWithFocus':
          sendResponse({ success: true });
          break;
        case 'importAnnotations':
          this.importAnnotations(request.annotations)
            .then(result => sendResponse({ success: true, ...result }))
            .catch(error => sendResponse({ success: false, error: error.message }));
          break;
        case 'forceMCPSync':
          this.forceAPISync()
            .then(result => sendResponse({ success: true, ...result }))
            .catch(error => sendResponse({ success: false, error: error.message }));
          break;
        default:
          sendResponse({ success: false, error: 'Unknown action' });
      }
      return true;
    });
  }

  // --- Tab & storage listeners ---

  setupTabListener() {
    ext.tabs.onActivated.addListener(async (activeInfo) => {
      try {
        const tab = await ext.tabs.get(activeInfo.tabId);
        if (await isSupportedUrl(tab.url)) await updateBadge(tab.id, tab.url);
        else await clearBadge(tab.id);
      } catch (error) {
        console.error('Error updating badge on tab activation:', error);
      }
    });

    ext.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
      if (changeInfo.status === 'complete' && tab.url) {
        if (await isSupportedUrl(tab.url)) await updateBadge(tabId, tab.url);
        else await clearBadge(tabId);
        if (!supportsDynamicContentScriptRegistration() && await isEnabledSite(tab.url)) {
          await this.injectEnabledSiteScripts(tabId, tab.url);
        } else {
          this._injectedTabUrls.delete(tabId);
        }
      }
    });

    ext.tabs.onRemoved.addListener((tabId) => {
      this._injectedTabUrls.delete(tabId);
    });
  }

  setupStorageListener() {
    ext.storage.onChanged.addListener(async (changes, namespace) => {
      if (namespace === 'local' && changes.annotations) {
        try {
          const tabs = await ext.tabs.query({});
          for (const tab of tabs) {
            if (await isSupportedUrl(tab.url)) await updateBadge(tab.id, tab.url);
          }
        } catch (error) {
          console.error('Error updating badges after storage change:', error);
        }
      }
    });
  }

  // --- Storage CRUD ---

  async saveAnnotation(annotation) {
    return this._withStorageLock(async () => {
      try {
        const result = await ext.storage.local.get(['annotations']);
        const annotations = result.annotations || [];
        const idx = annotations.findIndex(a => a.id === annotation.id);
        if (idx >= 0) annotations[idx] = annotation; else annotations.push(annotation);
        await ext.storage.local.set({ annotations });

        saveOne(annotation).then(async () => {
          const fresh = await ext.storage.local.get(['annotations']);
          const arr = fresh.annotations || [];
          const target = arr.find(a => a.id === annotation.id);
          if (target && !target._synced) {
            target._synced = true;
            await ext.storage.local.set({ annotations: arr });
          }
        }).catch(() => {});
        updateBadgeForUrl(annotation.url).catch(() => {});
      } catch (error) {
        console.error('Error saving annotation:', error);
        throw error;
      }
    });
  }

  async deleteAnnotation(id) {
    return this._withStorageLock(async () => {
      try {
        const result = await ext.storage.local.get(['annotations', 'deletedAnnotationIds']);
        const annotations = result.annotations || [];
        const deletedIds = result.deletedAnnotationIds || [];
        const filtered = annotations.filter(a => a.id !== id);
        if (!deletedIds.includes(id)) deletedIds.push(id);
        await ext.storage.local.set({ annotations: filtered, deletedAnnotationIds: deletedIds });
        try { await deleteOne(id); } catch {}
        const deleted = annotations.find(a => a.id === id);
        if (deleted) await updateBadgeForUrl(deleted.url);
        await updateAllBadges();
      } catch (error) {
        console.error('Error deleting annotation:', error);
        throw error;
      }
    });
  }

  async deleteAnnotationsByUrl(url) {
    return this._withStorageLock(async () => {
      const result = await ext.storage.local.get(['annotations', 'deletedAnnotationIds']);
      const all = result.annotations || [];
      const deletedIds = result.deletedAnnotationIds || [];
      const toDelete = all.filter(a => a.url === url);
      const remaining = all.filter(a => a.url !== url);
      for (const a of toDelete) { if (!deletedIds.includes(a.id)) deletedIds.push(a.id); }
      await ext.storage.local.set({ annotations: remaining, deletedAnnotationIds: deletedIds });
      for (const a of toDelete) deleteOne(a.id).catch(() => {});
      await updateBadgeForUrl(url);
      await updateAllBadges();
      return { count: toDelete.length };
    });
  }

  async updateAnnotation(id, updates) {
    return this._withStorageLock(async () => {
      try {
        const result = await ext.storage.local.get(['annotations']);
        const annotations = result.annotations || [];
        const idx = annotations.findIndex(a => a.id === id);
        if (idx === -1) throw new Error('Annotation not found');
        annotations[idx] = { ...annotations[idx], ...updates, updated_at: new Date().toISOString() };
        await ext.storage.local.set({ annotations });
        updateBadgeForUrl(annotations[idx].url).catch(() => {});
      } catch (error) {
        console.error('Error updating annotation:', error);
        throw error;
      }
    });
  }

  async importAnnotations(newAnnotations) {
    if (!Array.isArray(newAnnotations) || !newAnnotations.length) return { imported: 0 };
    return this._withStorageLock(async () => {
      const result = await ext.storage.local.get(['annotations', 'deletedAnnotationIds']);
      const all = result.annotations || [];
      const deletedIds = result.deletedAnnotationIds || [];
      const existingIds = new Set(all.map(a => a.id));
      let imported = 0;
      const importedIds = [];
      for (const a of newAnnotations) {
        if (!existingIds.has(a.id)) { all.push(a); existingIds.add(a.id); importedIds.push(a.id); imported++; }
      }
      if (imported > 0) {
        const cleanedTombstones = deletedIds.filter(id => !importedIds.includes(id));
        await ext.storage.local.set({ annotations: all, deletedAnnotationIds: cleanedTombstones });
        try {
          await syncAll(all);
          let flagsChanged = false;
          for (const a of all) { if (!a._synced) { a._synced = true; flagsChanged = true; } }
          if (flagsChanged) await ext.storage.local.set({ annotations: all });
        } catch (e) { console.warn('Failed to sync imported annotations to server:', e.message); }
        await updateAllBadges();
      }
      return { imported, total: all.length };
    });
  }

  async forceAPISync() {
    try {
      const result = await ext.storage.local.get(['annotations']);
      const annotations = result.annotations || [];
      await syncAll(annotations);
      return { count: annotations.length, message: `Synced ${annotations.length} annotations to API server` };
    } catch (error) {
      console.error('Error in forced API sync:', error);
      throw error;
    }
  }

  // --- Connection monitoring ---

  startConnectionMonitoring() {
    checkConnection().then(() => updateAllBadges());
    setInterval(async () => {
      const wasConnected = isConnected();
      await checkConnection();
      if (wasConnected !== isConnected()) await updateAllBadges();
      if (isConnected()) await smartSync(fn => this._withStorageLock(fn));
    }, 10000);
  }

  // --- Content script registration ---

  async restoreEnabledSites() {
    try {
      const result = await ext.storage.local.get(['vibeEnabledSites']);
      const sites = result.vibeEnabledSites || [];
      for (const originPattern of sites) {
        const has = await ext.permissions.contains({ origins: [originPattern] });
        if (has) await this.enableSite(originPattern, null);
      }
    } catch (err) {
      console.error('Error restoring enabled sites:', err);
    }
  }

  async enableSite(originPattern, tabId) {
    const scriptId = 'vibe-' + originPattern.replace(/[^a-zA-Z0-9]/g, '_');
    if (supportsDynamicContentScriptRegistration()) {
      try {
        await ext.scripting.unregisterContentScripts({ ids: [scriptId] }).catch(() => {});
        await ext.scripting.registerContentScripts([{
          id: scriptId,
          matches: [originPattern],
          js: CONTENT_SCRIPT_FILES,
          runAt: 'document_idle',
          persistAcrossSessions: true
        }]);
        const bridgeScriptId = scriptId + '_bridge';
        await ext.scripting.unregisterContentScripts({ ids: [bridgeScriptId] }).catch(() => {});
        await ext.scripting.registerContentScripts([{
          id: bridgeScriptId,
          matches: [originPattern],
          js: ['content/bridge-api.js'],
          world: 'MAIN',
          runAt: 'document_start',
          persistAcrossSessions: true
        }]);
      } catch (err) {
        console.error('Failed to register content scripts:', err);
      }
    } else {
      console.info('Dynamic content script registration unavailable, using executeScript fallback');
    }
    if (tabId) await ext.tabs.reload(tabId);
  }

  async injectEnabledSiteScripts(tabId, url) {
    if (this._injectedTabUrls.get(tabId) === url) return;
    try {
      if (ext.scripting?.executeScript) {
        await ext.scripting.executeScript({ target: { tabId }, files: CONTENT_SCRIPT_FILES });
        try {
          await ext.scripting.executeScript({ target: { tabId }, files: ['content/bridge-api.js'], world: 'MAIN' });
        } catch (worldError) {
          console.warn('MAIN world bridge injection failed, retrying isolated world:', worldError);
          await ext.scripting.executeScript({ target: { tabId }, files: ['content/bridge-api.js'] });
        }
      } else if (ext.tabs?.executeScript) {
        for (const file of CONTENT_SCRIPT_FILES) {
          await ext.tabs.executeScript(tabId, { file, allFrames: true });
        }
        const bridgeUrl = ext.runtime.getURL('content/bridge-api.js');
        try {
          await ext.tabs.executeScript(tabId, {
            allFrames: true,
            code: `
              (function() {
                if (document.getElementById('vibe-bridge-api')) return;
                const script = document.createElement('script');
                script.id = 'vibe-bridge-api';
                script.src = ${JSON.stringify(bridgeUrl)};
                script.type = 'text/javascript';
                (document.head || document.documentElement).appendChild(script);
              })();
            `
          });
        } catch (worldError) {
          console.warn('MAIN world bridge injection failed, retrying isolated world:', worldError);
          await ext.tabs.executeScript(tabId, { file: 'content/bridge-api.js', allFrames: true });
        }
      } else {
        return;
      }
      this._injectedTabUrls.set(tabId, url);
    } catch (err) {
      this._injectedTabUrls.delete(tabId);
      console.error('Failed to inject content scripts:', err);
    }
  }
}

// Initialize
const bg = new VibeAnnotationsBackground();

// Keyboard shortcut commands
ext.commands.onCommand.addListener(async (command, tab) => {
  if (command === 'toggle-annotate' && tab?.id && await isSupportedUrl(tab.url)) {
    try { await ext.tabs.sendMessage(tab.id, { action: 'toggleAnnotate' }); }
    catch { /* Content script not loaded */ }
  }
});
