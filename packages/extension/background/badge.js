// Extension icon badge management
import { isSupportedUrl } from './url-filter.js';
import { ext } from './ext.js';

export async function updateBadge(tabId, url) {
  try {
    const result = await ext.storage.local.get(['annotations']);
    const annotations = result.annotations || [];
    let origin;
    try { origin = new URL(url).origin; } catch { origin = null; }
    const projectAnnotations = origin
      ? annotations.filter(a => { try { return new URL(a.url).origin === origin; } catch { return false; } })
      : annotations.filter(a => a.url === url);
    const pendingCount = projectAnnotations.filter(a => a.status === 'pending').length;

    if (pendingCount > 0) {
      await ext.action.setBadgeText({ tabId, text: pendingCount.toString() });
      await ext.action.setBadgeBackgroundColor({ tabId, color: '#D03D68' });
      await ext.action.setTitle({ tabId, title: `Vibe Annotations - ${pendingCount} pending annotation${pendingCount === 1 ? '' : 's'}` });
    } else {
      await clearBadge(tabId);
    }
  } catch (error) {
    console.error('Error updating badge:', error);
  }
}

export async function clearBadge(tabId) {
  try {
    await ext.action.setBadgeText({ tabId, text: '' });
    await ext.action.setTitle({ tabId, title: 'Vibe Annotations' });
  } catch (error) {
    console.error('Error clearing badge:', error);
  }
}

export async function updateBadgeForUrl(url) {
  try {
    const tabs = await ext.tabs.query({ url });
    for (const tab of tabs) await updateBadge(tab.id, url);
  } catch (error) {
    console.error('Error updating badge for URL:', url, error);
  }
}

export async function updateAllBadges() {
  try {
    const tabs = await ext.tabs.query({});
    for (const tab of tabs) {
      if (await isSupportedUrl(tab.url)) await updateBadge(tab.id, tab.url);
    }
  } catch (error) {
    console.error('Error updating all badges:', error);
  }
}
