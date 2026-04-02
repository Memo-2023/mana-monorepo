import { createThemeStore, APP_THEME_CONFIGS } from '@manacore/shared-theme';

/**
 * Picture theme store using the global shared theme system
 *
 * Usage:
 * - theme.mode: 'light' | 'dark' | 'system'
 * - theme.variant: 'lume' | 'nature' | 'stone' | 'ocean'
 * - theme.effectiveMode: 'light' | 'dark' (resolved from system if needed)
 * - theme.isDark: boolean
 * - theme.setMode(mode): Set theme mode
 * - theme.setVariant(variant): Set theme variant
 * - theme.toggleMode(): Toggle between light/dark
 * - theme.cycleMode(): Cycle through light → dark → system
 * - theme.initialize(): Initialize and apply theme (call in onMount)
 *
 * CSS Variables applied automatically:
 * --color-primary, --color-background, --color-foreground, etc.
 */
export const theme = createThemeStore(APP_THEME_CONFIGS.picture);

// Export theme types for convenience
export type { ThemeMode, ThemeVariant } from '@manacore/shared-theme';
