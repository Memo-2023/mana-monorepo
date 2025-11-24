import type {
  ThemeMode,
  ThemeVariant,
  EffectiveMode,
  ThemeStore,
  AppThemeConfig,
  HSLValue,
} from './types';
import {
  THEME_VARIANTS,
  DEFAULT_MODE,
  DEFAULT_VARIANT,
  STORAGE_KEY_SUFFIX,
} from './constants';
import {
  isBrowser,
  getSystemPreference,
  createSystemPreferenceListener,
  applyThemeToDocument,
  loadThemeFromStorage,
  saveThemeToStorage,
} from './utils';

/**
 * Create a theme store for your app
 *
 * @example
 * ```typescript
 * // Basic usage
 * import { createThemeStore } from '@manacore/shared-theme';
 *
 * export const theme = createThemeStore({ appId: 'myapp' });
 *
 * // With custom primary color
 * export const theme = createThemeStore({
 *   appId: 'memoro',
 *   primaryColor: {
 *     light: '47 95% 58%',  // Gold
 *     dark: '47 95% 58%',
 *   },
 * });
 * ```
 */
export function createThemeStore(config: AppThemeConfig): ThemeStore {
  const {
    appId,
    defaultMode = DEFAULT_MODE,
    defaultVariant = DEFAULT_VARIANT,
    primaryColor,
  } = config;

  const storageKey = `${appId}${STORAGE_KEY_SUFFIX}`;

  // Svelte 5 runes state
  let mode = $state<ThemeMode>(defaultMode);
  let variant = $state<ThemeVariant>(defaultVariant);
  let effectiveMode = $state<EffectiveMode>('light');

  // Derived state
  const isDark = $derived(effectiveMode === 'dark');

  /**
   * Calculate effective mode from current mode and system preference
   */
  function calculateEffectiveMode(currentMode: ThemeMode): EffectiveMode {
    if (currentMode === 'system') {
      return getSystemPreference();
    }
    return currentMode;
  }

  /**
   * Apply current theme to document and save to storage
   */
  function applyTheme(): void {
    const newEffectiveMode = calculateEffectiveMode(mode);
    effectiveMode = newEffectiveMode;

    applyThemeToDocument(variant, newEffectiveMode, primaryColor);
    saveThemeToStorage(storageKey, mode, variant);
  }

  /**
   * Set theme mode
   */
  function setMode(newMode: ThemeMode): void {
    if (newMode === mode) return;
    mode = newMode;
    applyTheme();
  }

  /**
   * Set theme variant
   */
  function setVariant(newVariant: ThemeVariant): void {
    if (!THEME_VARIANTS.includes(newVariant)) {
      console.warn(`Invalid theme variant: ${newVariant}`);
      return;
    }
    if (newVariant === variant) return;
    variant = newVariant;
    applyTheme();
  }

  /**
   * Toggle between light and dark mode
   * If currently on system, switches to opposite of effective mode
   */
  function toggleMode(): void {
    if (mode === 'system') {
      // Switch to opposite of current effective mode
      setMode(effectiveMode === 'dark' ? 'light' : 'dark');
    } else {
      setMode(mode === 'dark' ? 'light' : 'dark');
    }
  }

  /**
   * Cycle through modes: light → dark → system → light
   */
  function cycleMode(): void {
    const modes: ThemeMode[] = ['light', 'dark', 'system'];
    const currentIndex = modes.indexOf(mode);
    const nextIndex = (currentIndex + 1) % modes.length;
    setMode(modes[nextIndex]);
  }

  /**
   * Initialize theme store
   * - Loads saved preferences from localStorage
   * - Sets up system preference listener
   * - Applies initial theme
   *
   * @returns Cleanup function to remove listeners
   */
  function initialize(): () => void {
    if (!isBrowser()) {
      return () => {};
    }

    // Load saved preferences
    const saved = loadThemeFromStorage(storageKey);
    if (saved) {
      if (saved.mode && ['light', 'dark', 'system'].includes(saved.mode)) {
        mode = saved.mode as ThemeMode;
      }
      if (saved.variant && THEME_VARIANTS.includes(saved.variant as ThemeVariant)) {
        variant = saved.variant as ThemeVariant;
      }
    }

    // Apply initial theme
    applyTheme();

    // Listen for system preference changes
    const cleanup = createSystemPreferenceListener((isDark) => {
      if (mode === 'system') {
        effectiveMode = isDark ? 'dark' : 'light';
        applyThemeToDocument(variant, effectiveMode, primaryColor);
      }
    });

    return cleanup;
  }

  return {
    get mode() {
      return mode;
    },
    get variant() {
      return variant;
    },
    get effectiveMode() {
      return effectiveMode;
    },
    get isDark() {
      return isDark;
    },
    get variants() {
      return THEME_VARIANTS;
    },

    setMode,
    setVariant,
    toggleMode,
    cycleMode,
    initialize,
  };
}

/**
 * Pre-defined app configurations for convenience
 */
export const APP_THEME_CONFIGS = {
  memoro: {
    appId: 'memoro',
    defaultVariant: 'lume' as ThemeVariant,
    primaryColor: {
      light: '47 95% 58%' as HSLValue,  // Gold #f8d62b
      dark: '47 95% 58%' as HSLValue,
    },
  },
  manacore: {
    appId: 'manacore',
    defaultVariant: 'ocean' as ThemeVariant,
    primaryColor: {
      light: '239 84% 67%' as HSLValue,  // Indigo #6366f1
      dark: '239 84% 67%' as HSLValue,
    },
  },
  manadeck: {
    appId: 'manadeck',
    defaultVariant: 'ocean' as ThemeVariant,
    primaryColor: {
      light: '239 84% 67%' as HSLValue,  // Indigo #6366f1
      dark: '239 84% 67%' as HSLValue,
    },
  },
  maerchenzauber: {
    appId: 'maerchenzauber',
    defaultVariant: 'nature' as ThemeVariant,
    primaryColor: {
      light: '280 60% 55%' as HSLValue,  // Purple (storytelling magic)
      dark: '280 60% 60%' as HSLValue,
    },
  },
} as const;
