/**
 * Theme System Type Definitions
 */

export type ThemeVariant = 'default' | 'sunset' | 'ocean';
export type ThemeMode = 'light' | 'dark' | 'system';

export interface ThemeColors {
	// Backgrounds
	background: string; // Main app background
	surface: string; // Cards, containers
	elevated: string; // Modals, dropdowns
	overlay: string; // Overlays, backdrops (with opacity)

	// Borders & Dividers
	border: string;
	divider: string;

	// Interactive Elements
	input: {
		background: string;
		border: string;
		text: string;
		placeholder: string;
	};

	// Text
	text: {
		primary: string; // Main text
		secondary: string; // Secondary text
		tertiary: string; // Hints, captions
		disabled: string; // Disabled state
		inverse: string; // Text on colored background
	};

	// Brand/Primary Color
	primary: {
		default: string; // Main brand color
		hover: string; // Hover state
		active: string; // Active/pressed state
		light: string; // Light variant
		dark: string; // Dark variant
		contrast: string; // Text on primary background
	};

	// Secondary Color (for accents)
	secondary: {
		default: string;
		light: string;
		dark: string;
		contrast: string;
	};

	// Status Colors
	success: string;
	warning: string;
	error: string;
	info: string;

	// Semantic Colors
	favorite: string; // Heart/favorite icon
	like: string; // Like button
	tag: string; // Default tag color

	// Special
	skeleton: string; // Loading skeletons
	shimmer: string; // Shimmer effect
}

export interface Theme {
	name: ThemeVariant;
	displayName: string;
	mode: 'light' | 'dark'; // Actual resolved mode (not 'system')
	colors: ThemeColors;

	// Shadows
	shadows: {
		sm: {
			shadowColor: string;
			shadowOffset: { width: number; height: number };
			shadowOpacity: number;
			shadowRadius: number;
			elevation: number;
		};
		md: {
			shadowColor: string;
			shadowOffset: { width: number; height: number };
			shadowOpacity: number;
			shadowRadius: number;
			elevation: number;
		};
		lg: {
			shadowColor: string;
			shadowOffset: { width: number; height: number };
			shadowOpacity: number;
			shadowRadius: number;
			elevation: number;
		};
	};

	// Opacity values
	opacity: {
		disabled: number;
		overlay: number;
		hover: number;
		pressed: number;
	};
}

export interface ThemeDefinition {
	name: ThemeVariant;
	displayName: string;
	light: Omit<Theme, 'name' | 'displayName'>;
	dark: Omit<Theme, 'name' | 'displayName'>;
}
