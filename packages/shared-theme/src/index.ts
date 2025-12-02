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
} from './types';

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
