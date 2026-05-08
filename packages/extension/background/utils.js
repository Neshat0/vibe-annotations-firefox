// Background utilities — ID generation, changelog, migrations
import { ext } from './ext.js';

export function generateId() {
  return 'vibe_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

export async function migrateSyncFlags() {
  const result = await ext.storage.local.get(['annotations', '_syncFlagsMigrated']);
  if (result._syncFlagsMigrated) return;
  const annotations = result.annotations || [];
  if (annotations.length) {
    let changed = false;
    for (const a of annotations) { if (!a._synced) { a._synced = true; changed = true; } }
    if (changed) await ext.storage.local.set({ annotations });
  }
  await ext.storage.local.set({ _syncFlagsMigrated: true });
}
