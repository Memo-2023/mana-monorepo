/**
 * UnifiedBar Store - Manages the new unified bottom bar system
 * Replaces multiple individual bars with a layered, cohesive interface
 */

import type { CalendarViewType } from '@calendar/shared';
import { createAppSettingsStore } from '@manacore/shared-stores';
import { userSettings } from './user-settings.svelte';

// UnifiedBar modes and layers
export type UnifiedBarMode = 'collapsed' | 'expanded' | 'overlay';
export type UnifiedBarLayer = 'input' | 'date' | 'tag' | 'toolbar' | 'settings';

// Store interface
export interface UnifiedBarSettings extends Record<string, unknown> {
  // UnifiedBar mode control
  unifiedBarMode: UnifiedBarMode;
  unifiedBarActiveLayer: UnifiedBarLayer;

  // Legacy compatibility (keep existing settings working)
  dateStripCollapsed: boolean;
  tagStripCollapsed: boolean;
  calendarToolbarCollapsed: boolean;

  // New UnifiedBar-specific settings
  showQuickInput: boolean;
  showDateStrip: boolean;
  showTagStrip: boolean;
  showCalendarToolbar: boolean;
  overlayMenuOpen: boolean;

  // Animation and interaction preferences
  barAnimationDuration: number;
  enableHapticFeedback: boolean;
  autoCollapseBars: boolean;

  // Quick access toggles
  quickAccessActions: string[];
}

const DEFAULT_SETTINGS: UnifiedBarSettings = {
  // Default to collapsed mode with only input bar visible
  unifiedBarMode: 'collapsed',
  unifiedBarActiveLayer: 'input',

  // Legacy compatibility
  dateStripCollapsed: false,
  tagStripCollapsed: true,
  calendarToolbarCollapsed: true,

  // New settings
  showQuickInput: true,
  showDateStrip: true,
  showTagStrip: false,
  showCalendarToolbar: false,
  overlayMenuOpen: false,

  // Interaction preferences
  barAnimationDuration: 300,
  enableHapticFeedback: true,
  autoCollapseBars: false,

  // Quick actions
  quickAccessActions: ['new-event', 'search', 'today', 'calendar-toggle'],
};

// Cloud sync state
let cloudSyncEnabled = $state(false);
let initialSyncDone = $state(false);

// Sync to cloud callback
async function syncToCloud(settings: UnifiedBarSettings) {
  if (!cloudSyncEnabled || typeof window === 'undefined') return;
  try {
    await userSettings.updateDeviceAppSettings(settings as unknown as Record<string, unknown>);
  } catch (e) {
    console.error('Failed to sync unified bar settings to cloud:', e);
  }
}

// Create base store
const baseStore = createAppSettingsStore<UnifiedBarSettings>(
  'unified-bar-settings',
  DEFAULT_SETTINGS,
  {
    onSettingsChange: syncToCloud,
  }
);

// Load settings from cloud
function loadFromCloud(): Partial<UnifiedBarSettings> | null {
  if (!userSettings.loaded) return null;
  const cloudSettings = userSettings.currentDeviceAppSettings;
  if (cloudSettings && Object.keys(cloudSettings).length > 0) {
    return cloudSettings as unknown as Partial<UnifiedBarSettings>;
  }
  return null;
}

export const unifiedBarStore = {
  // Base store methods
  get settings() {
    return baseStore.settings;
  },
  initialize: baseStore.initialize,
  set: baseStore.set,
  update: baseStore.update,
  reset: baseStore.reset,
  getDefaults: baseStore.getDefaults,

  // Mode management
  get mode() {
    return baseStore.settings.unifiedBarMode;
  },

  get activeLayer() {
    return baseStore.settings.unifiedBarActiveLayer;
  },

  get isOverlayOpen() {
    return baseStore.settings.overlayMenuOpen;
  },

  // Layer visibility helpers
  get showQuickInput() {
    return baseStore.settings.showQuickInput;
  },

  get showDateStrip() {
    return baseStore.settings.showDateStrip && !baseStore.settings.dateStripCollapsed;
  },

  get showTagStrip() {
    return baseStore.settings.showTagStrip && !baseStore.settings.tagStripCollapsed;
  },

  get showCalendarToolbar() {
    return baseStore.settings.showCalendarToolbar && !baseStore.settings.calendarToolbarCollapsed;
  },

  // Mode switching
  setMode(mode: UnifiedBarMode) {
    baseStore.set('unifiedBarMode', mode);
  },

  toggleOverlay() {
    const isOpen = baseStore.settings.overlayMenuOpen;
    baseStore.set('overlayMenuOpen', !isOpen);
    if (!isOpen) {
      baseStore.set('unifiedBarMode', 'overlay');
    } else {
      baseStore.set('unifiedBarMode', 'collapsed');
    }
  },

  setActiveLayer(layer: UnifiedBarLayer) {
    baseStore.set('unifiedBarActiveLayer', layer);
  },

  // Layer toggles
  toggleQuickInput() {
    baseStore.set('showQuickInput', !baseStore.settings.showQuickInput);
  },

  toggleDateStrip() {
    const newValue = !baseStore.settings.showDateStrip;
    baseStore.set('showDateStrip', newValue);
    baseStore.set('dateStripCollapsed', !newValue);
  },

  toggleTagStrip() {
    const newValue = !baseStore.settings.showTagStrip;
    baseStore.set('showTagStrip', newValue);
    baseStore.set('tagStripCollapsed', !newValue);
  },

  toggleCalendarToolbar() {
    const newValue = !baseStore.settings.showCalendarToolbar;
    baseStore.set('showCalendarToolbar', newValue);
    baseStore.set('calendarToolbarCollapsed', !newValue);
  },

  // Quick actions
  expandToLayer(layer: UnifiedBarLayer) {
    baseStore.set('unifiedBarMode', 'expanded');
    baseStore.set('unifiedBarActiveLayer', layer);

    // Auto-show the layer if hidden
    switch (layer) {
      case 'date':
        if (!baseStore.settings.showDateStrip) {
          baseStore.set('showDateStrip', true);
          baseStore.set('dateStripCollapsed', false);
        }
        break;
      case 'tag':
        if (!baseStore.settings.showTagStrip) {
          baseStore.set('showTagStrip', true);
          baseStore.set('tagStripCollapsed', false);
        }
        break;
      case 'toolbar':
        if (!baseStore.settings.showCalendarToolbar) {
          baseStore.set('showCalendarToolbar', true);
          baseStore.set('calendarToolbarCollapsed', false);
        }
        break;
    }
  },

  collapseAll() {
    baseStore.set('unifiedBarMode', 'collapsed');
    baseStore.set('unifiedBarActiveLayer', 'input');
    if (baseStore.settings.autoCollapseBars) {
      baseStore.set('showDateStrip', false);
      baseStore.set('showTagStrip', false);
      baseStore.set('showCalendarToolbar', false);
    }
  },

  // Cloud sync methods
  enableCloudSync() {
    cloudSyncEnabled = true;
    if (!initialSyncDone) {
      const cloudSettings = loadFromCloud();
      if (cloudSettings && Object.keys(cloudSettings).length > 0) {
        baseStore.update(cloudSettings);
      } else {
        syncToCloud(baseStore.settings);
      }
      initialSyncDone = true;
    }
  },

  disableCloudSync() {
    cloudSyncEnabled = false;
  },

  // Legacy compatibility helpers (for gradual migration)
  get legacyDateStripCollapsed() {
    return baseStore.settings.dateStripCollapsed;
  },

  get legacyTagStripCollapsed() {
    return baseStore.settings.tagStripCollapsed;
  },

  // Sync from legacy settings (migration helper)
  syncFromLegacySettings(legacy: { dateStripCollapsed?: boolean; tagStripCollapsed?: boolean }) {
    const updates: Partial<UnifiedBarSettings> = {};

    if (legacy.dateStripCollapsed !== undefined) {
      updates.dateStripCollapsed = legacy.dateStripCollapsed;
      updates.showDateStrip = !legacy.dateStripCollapsed;
    }

    if (legacy.tagStripCollapsed !== undefined) {
      updates.tagStripCollapsed = legacy.tagStripCollapsed;
      updates.showTagStrip = !legacy.tagStripCollapsed;
    }

    if (Object.keys(updates).length > 0) {
      baseStore.update(updates);
    }
  },
};
