/**
 * UI Store - Svelte 5 Runes Version
 */

import { browser } from '$app/environment';

const UI_VISIBLE_KEY = 'picture_ui_visible';

function loadInitialState(): boolean {
  if (!browser) return true;
  const saved = localStorage.getItem(UI_VISIBLE_KEY);
  return saved !== 'false'; // Default to true
}

let isUIVisible = $state(loadInitialState());
let showKeyboardShortcuts = $state(false);

export const uiStore = {
  get isVisible() {
    return isUIVisible;
  },
  get showKeyboardShortcuts() {
    return showKeyboardShortcuts;
  },

  toggle() {
    isUIVisible = !isUIVisible;
    if (browser) {
      localStorage.setItem(UI_VISIBLE_KEY, String(isUIVisible));
    }
  },

  setVisible(visible: boolean) {
    isUIVisible = visible;
    if (browser) {
      localStorage.setItem(UI_VISIBLE_KEY, String(visible));
    }
  },

  show() {
    isUIVisible = true;
    if (browser) {
      localStorage.setItem(UI_VISIBLE_KEY, 'true');
    }
  },

  hide() {
    isUIVisible = false;
    if (browser) {
      localStorage.setItem(UI_VISIBLE_KEY, 'false');
    }
  },

  setShowKeyboardShortcuts(show: boolean) {
    showKeyboardShortcuts = show;
  },

  toggleKeyboardShortcuts() {
    showKeyboardShortcuts = !showKeyboardShortcuts;
  },
};

// Export for backwards compatibility
export function toggleUI() {
  uiStore.toggle();
}

export function getIsUIVisible() {
  return isUIVisible;
}

// Re-export for compatibility
export { isUIVisible, showKeyboardShortcuts };
