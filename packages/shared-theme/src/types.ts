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
	emoji: string;
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
