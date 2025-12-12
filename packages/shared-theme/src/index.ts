// Types
export type {
	ThemeMode,
	ThemeVariant,
	EffectiveMode,
	ThemeState,
	ThemeColors,
	ThemeVariantDefinition,
	AppThemeConfig,
	ThemeStore,
	HSLValue,
	// A11y Types
	ContrastLevel,
	ColorblindMode,
	A11ySettings,
	A11yStore,
	A11yStoreConfig,
	// User Settings Types (synced via mana-core-auth)
	NavPosition,
	NavSettings,
	ThemeSettings,
	GlobalSettings,
	AppOverride,
	UserSettingsResponse,
	UserSettingsStore,
	UserSettingsStoreConfig,
	// General Settings Types
	StartPageConfig,
	WeekStartDay,
	GeneralSettings,
} from './types';

// User Settings Constants
export { DEFAULT_GLOBAL_SETTINGS, DEFAULT_GENERAL_SETTINGS } from './types';

// Theme Variant Categories
export { DEFAULT_THEME_VARIANTS, EXTENDED_THEME_VARIANTS } from './types';

// Constants
export {
	THEME_VARIANTS,
	THEME_DEFINITIONS,
	DEFAULT_MODE,
	DEFAULT_VARIANT,
	CSS_VAR_PREFIX,
	STORAGE_KEY_SUFFIX,
} from './constants';

// A11y Constants
export {
	A11Y_STORAGE_KEY_SUFFIX,
	DEFAULT_A11Y_SETTINGS,
	COLORBLIND_OPTIONS,
	CONTRAST_OPTIONS,
	HIGH_CONTRAST_CONFIG,
	COLORBLIND_TRANSFORMS,
	MOTION_DEFAULTS,
} from './a11y-constants';

// Store
export { createThemeStore, APP_THEME_CONFIGS } from './store.svelte';

// A11y Store
export { createA11yStore } from './a11y-store.svelte';

// User Settings Store
export { createUserSettingsStore } from './user-settings-store.svelte';

// Utils
export {
	isBrowser,
	getSystemPreference,
	createSystemPreferenceListener,
	getThemeColors,
	colorsToCssVars,
	applyThemeToDocument,
	loadThemeFromStorage,
	saveThemeToStorage,
	parseHSL,
	createHSL,
	adjustLightness,
	adjustSaturation,
	getContrastColor,
	generateThemeCSS,
} from './utils';

// A11y Utils
export {
	getSystemReducedMotion,
	createReducedMotionListener,
	applyMotionSettings,
	applyHighContrast,
	applyColorblindTransform,
	applyA11yTransformations,
	applyA11yAttributes,
	loadA11yFromStorage,
	saveA11yToStorage,
} from './a11y-utils';

// App Routes
export type { AppRoute, AppRouteConfig } from './app-routes';
export {
	APP_ROUTES,
	getStartPage,
	getAvailableRoutes,
	getDefaultRoute,
	filterHiddenNavItems,
	getHideableRoutes,
	isRouteHidden,
} from './app-routes';
