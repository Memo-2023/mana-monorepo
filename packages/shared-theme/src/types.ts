/**
 * Theme mode - user preference for light/dark appearance
 */
export type ThemeMode = 'light' | 'dark' | 'system';

/**
 * Theme variant - visual style/color scheme
 * All apps share the same 4 variants
 */
export type ThemeVariant = 'lume' | 'nature' | 'stone' | 'ocean';

/**
 * Effective mode - the actual rendered mode (resolved from system preference)
 */
export type EffectiveMode = 'light' | 'dark';

/**
 * Complete theme state
 */
export interface ThemeState {
	mode: ThemeMode;
	variant: ThemeVariant;
	effectiveMode: EffectiveMode;
}

/**
 * HSL color value (without hsl() wrapper)
 * Format: "H S% L%" e.g. "47 95% 58%"
 */
export type HSLValue = string;

/**
 * Theme color definition using HSL values
 */
export interface ThemeColors {
	/** Primary brand color */
	primary: HSLValue;
	/** Primary color for text on primary background */
	primaryForeground: HSLValue;
	/** Secondary accent color */
	secondary: HSLValue;
	/** Secondary foreground */
	secondaryForeground: HSLValue;
	/** Page background */
	background: HSLValue;
	/** Main text color */
	foreground: HSLValue;
	/** Card/content surface */
	surface: HSLValue;
	/** Surface hover state */
	surfaceHover: HSLValue;
	/** Elevated surface (modals, dropdowns) */
	surfaceElevated: HSLValue;
	/** Muted/disabled elements */
	muted: HSLValue;
	/** Muted text */
	mutedForeground: HSLValue;
	/** Border color */
	border: HSLValue;
	/** Strong border (focus, active) */
	borderStrong: HSLValue;
	/** Error/destructive color */
	error: HSLValue;
	/** Success color */
	success: HSLValue;
	/** Warning color */
	warning: HSLValue;
	/** Input background */
	input: HSLValue;
	/** Focus ring color */
	ring: HSLValue;
}

/**
 * Theme variant definition with light and dark mode colors
 */
export interface ThemeVariantDefinition {
	name: string;
	label: string;
	/** Emoji representation of the theme */
	emoji: string;
	/** Icon name for the theme (e.g., 'sparkle', 'leaf', 'hexagon', 'waves') */
	icon: string;
	/** The primary hue for this variant (used for accent colors) */
	hue: number;
	light: ThemeColors;
	dark: ThemeColors;
}

/**
 * App-specific theme configuration
 */
export interface AppThemeConfig {
	/** App identifier for localStorage key */
	appId: string;
	/** Default theme mode */
	defaultMode?: ThemeMode;
	/** Default theme variant */
	defaultVariant?: ThemeVariant;
	/**
	 * App-specific primary color override (HSL value)
	 * This allows each app to have its own brand color
	 * while sharing the same theme variants
	 */
	primaryColor?: {
		light: HSLValue;
		dark: HSLValue;
	};
}

/**
 * Theme store interface
 */
export interface ThemeStore {
	/** Current theme mode (user preference) */
	readonly mode: ThemeMode;
	/** Current theme variant */
	readonly variant: ThemeVariant;
	/** Effective mode (resolved from system) */
	readonly effectiveMode: EffectiveMode;
	/** Whether dark mode is active */
	readonly isDark: boolean;
	/** All available variants */
	readonly variants: readonly ThemeVariant[];

	/** Set theme mode */
	setMode: (mode: ThemeMode) => void;
	/** Set theme variant */
	setVariant: (variant: ThemeVariant) => void;
	/** Toggle between light and dark mode */
	toggleMode: () => void;
	/** Cycle through modes: light → dark → system → light */
	cycleMode: () => void;
	/** Initialize theme (call on mount) */
	initialize: () => () => void;
}

// ============================================================================
// Accessibility (A11y) Types
// ============================================================================

/**
 * Contrast level for accessibility
 * - 'normal': Default contrast (WCAG AA 4.5:1 minimum)
 * - 'high': Enhanced contrast (WCAG AAA 7:1 minimum)
 */
export type ContrastLevel = 'normal' | 'high';

/**
 * Colorblind mode simulation/adaptation
 * - 'none': No colorblind adaptation
 * - 'deuteranopia': Green-blind (most common, ~6% of males)
 * - 'protanopia': Red-blind (~1% of males)
 * - 'monochrome': Full grayscale (achromatopsia)
 */
export type ColorblindMode = 'none' | 'deuteranopia' | 'protanopia' | 'monochrome';

/**
 * A11y settings state
 */
export interface A11ySettings {
	/** Contrast level */
	contrast: ContrastLevel;
	/** Colorblind adaptation mode */
	colorblind: ColorblindMode;
	/** Reduce motion preference */
	reduceMotion: boolean;
}

/**
 * A11y store interface (separate from ThemeStore)
 */
export interface A11yStore {
	/** Current contrast level */
	readonly contrast: ContrastLevel;
	/** Current colorblind mode */
	readonly colorblind: ColorblindMode;
	/** Effective reduce motion (user setting OR system preference) */
	readonly reduceMotion: boolean;
	/** Whether user has explicitly set reduce motion (vs system default) */
	readonly reduceMotionExplicit: boolean;

	/** Set contrast level */
	setContrast: (level: ContrastLevel) => void;
	/** Set colorblind mode */
	setColorblind: (mode: ColorblindMode) => void;
	/** Set reduce motion preference */
	setReduceMotion: (reduce: boolean) => void;
	/** Reset to system default for reduce motion */
	resetReduceMotion: () => void;
	/** Reset all A11y settings to defaults */
	resetAll: () => void;
	/** Initialize (call on mount) */
	initialize: () => () => void;
}

/**
 * A11y store configuration
 */
export interface A11yStoreConfig {
	/** App identifier for localStorage key */
	appId: string;
	/** Default settings override */
	defaults?: Partial<A11ySettings>;
}
