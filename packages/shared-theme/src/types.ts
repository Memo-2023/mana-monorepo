/**
 * Theme mode - user preference for light/dark appearance
 */
export type ThemeMode = 'light' | 'dark' | 'system';

/**
 * Theme variant - visual style/color scheme
 * Default variants (shown in PillNav): lume, nature, stone, ocean
 * Extended variants (only on themes page, can be pinned): sunset, midnight, rose, lavender
 */
export type ThemeVariant =
	| 'lume'
	| 'nature'
	| 'stone'
	| 'ocean'
	| 'sunset'
	| 'midnight'
	| 'rose'
	| 'lavender';

/**
 * Default theme variants - always visible in PillNav
 */
export const DEFAULT_THEME_VARIANTS: ThemeVariant[] = ['lume', 'nature', 'stone', 'ocean'];

/**
 * Extended theme variants - only on themes page, can be pinned
 */
export const EXTENDED_THEME_VARIANTS: ThemeVariant[] = ['sunset', 'midnight', 'rose', 'lavender'];

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
	/**
	 * Optional "paper grain" texture for workbench page surfaces.
	 * Each theme can ship its own tileable texture applied via
	 * background-blend-mode on the page-shell card so pages gain a
	 * distinct tactile character. The consuming app is responsible for
	 * serving the asset at the given URL (typically under `/textures/`).
	 * When undefined, no paper texture is applied for this theme.
	 *
	 * Note: in dark mode, `multiply` auto-falls-back to `overlay` since
	 * dark × dark is practically invisible. Other blend modes are kept
	 * as-is for both modes.
	 */
	paper?: {
		/** URL / absolute path to a seamless tileable texture */
		url: string;
		/** CSS background-blend-mode against the card color */
		blendMode?:
			| 'multiply'
			| 'overlay'
			| 'soft-light'
			| 'hard-light'
			| 'screen'
			| 'darken'
			| 'lighten'
			| 'color-burn';
		/** CSS background-size (default "240px 240px") */
		size?: string;
	};
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

// ============================================================================
// Global User Settings Types (synced via mana-auth)
// ============================================================================

/**
 * Navigation position for desktop (mobile always at bottom)
 */
export type NavPosition = 'top' | 'bottom';

/**
 * Navigation settings
 */
export interface NavSettings {
	/** Desktop navigation position */
	desktopPosition: NavPosition;
	/** Whether sidebar is collapsed */
	sidebarCollapsed: boolean;
	/** Hidden navigation items per app (appId -> list of hidden paths) */
	hiddenNavItems?: Record<string, string[]>;
}

/**
 * Start page configuration per app
 * Keys are app IDs, values are route paths
 */
export type StartPageConfig = Record<string, string>;

/**
 * Day of week for calendar/week starts
 */
export type WeekStartDay = 'monday' | 'sunday';

/**
 * General settings (global preferences)
 */
export interface GeneralSettings {
	/** Start page per app (e.g., { clock: '/stopwatch', calendar: '/week' }) */
	startPages: StartPageConfig;
	/** First day of week */
	weekStartsOn: WeekStartDay;
	/** Master toggle for all app sounds */
	soundsEnabled: boolean;
	/** Show confirmation dialog before deleting items */
	confirmOnDelete: boolean;
	/** Enable keyboard shortcuts globally */
	keyboardShortcutsEnabled: boolean;
}

/**
 * Theme settings (synced to server)
 */
export interface ThemeSettings {
	/** Theme mode preference */
	mode: ThemeMode;
	/** Color scheme / variant */
	colorScheme: string;
	/** Pinned themes to show in PillNav (extended themes only) */
	pinnedThemes?: ThemeVariant[];
}

/**
 * Global settings that apply to all apps by default
 */
export interface GlobalSettings {
	nav: NavSettings;
	theme: ThemeSettings;
	locale: string;
	/** General preferences (start pages, sounds, etc.) */
	general: GeneralSettings;
	/** Recently used emojis (shared across all apps) - max 16 */
	recentEmojis?: string[];
}

/**
 * Per-app override settings (partial, only overridden values)
 */
export interface AppOverride {
	nav?: Partial<NavSettings>;
	theme?: Partial<ThemeSettings>;
}

/**
 * Device type for device-specific settings
 */
export type DeviceType = 'desktop' | 'mobile' | 'tablet';

/**
 * Device-specific app settings
 */
export interface DeviceAppSettings {
	deviceName: string;
	deviceType: DeviceType;
	lastSeen: string;
	apps: Record<string, Record<string, unknown>>;
}

/**
 * Device info for listing
 */
export interface DeviceInfo {
	deviceId: string;
	deviceName: string;
	deviceType: DeviceType;
	lastSeen: string;
	appCount: number;
}

/**
 * Full user settings response from API
 */
export interface UserSettingsResponse {
	globalSettings: GlobalSettings;
	appOverrides: Record<string, AppOverride>;
	deviceSettings: Record<string, DeviceAppSettings>;
}

/**
 * Devices list response
 */
export interface DevicesListResponse {
	devices: DeviceInfo[];
}

/**
 * Default general settings
 */
export const DEFAULT_GENERAL_SETTINGS: GeneralSettings = {
	startPages: {}, // Empty = use app defaults
	weekStartsOn: 'monday',
	soundsEnabled: true,
	confirmOnDelete: true,
	keyboardShortcutsEnabled: true,
};

/**
 * Default global settings
 */
export const DEFAULT_GLOBAL_SETTINGS: GlobalSettings = {
	nav: { desktopPosition: 'bottom', sidebarCollapsed: false, hiddenNavItems: {} },
	theme: { mode: 'system', colorScheme: 'ocean', pinnedThemes: [] },
	locale: 'de',
	general: DEFAULT_GENERAL_SETTINGS,
	recentEmojis: [],
};

/**
 * User settings store interface
 */
export interface UserSettingsStore {
	/** Resolved navigation settings (global + app override) */
	readonly nav: NavSettings;
	/** Resolved theme settings (global + app override) */
	readonly theme: ThemeSettings;
	/** Current locale */
	readonly locale: string;
	/** Resolved general settings */
	readonly general: GeneralSettings;
	/** Start page for current app (resolved from settings or default) */
	readonly startPage: string;
	/** Raw global settings */
	readonly globalSettings: GlobalSettings;
	/** Whether current app has an override */
	readonly hasAppOverride: boolean;
	/** Whether settings are being synced */
	readonly syncing: boolean;
	/** Whether settings are loaded */
	readonly loaded: boolean;
	/** Current device ID */
	readonly deviceId: string;
	/** All device settings */
	readonly deviceSettings: Record<string, DeviceAppSettings>;
	/** Current device's app settings */
	readonly currentDeviceAppSettings: Record<string, unknown>;

	/** Load settings from server */
	load: () => Promise<void>;
	/** Update global settings */
	updateGlobal: (settings: Partial<GlobalSettings>) => Promise<void>;
	/** Update app-specific override */
	updateAppOverride: (settings: AppOverride) => Promise<void>;
	/** Remove app override (revert to global) */
	removeAppOverride: () => Promise<void>;
	/** Set start page for a specific app */
	setStartPage: (appId: string, path: string) => Promise<void>;
	/** Update general settings */
	updateGeneral: (settings: Partial<GeneralSettings>) => Promise<void>;
	/** Get hidden nav items for a specific app */
	getHiddenNavItemsForApp: (appId: string) => string[];
	/** Toggle visibility of a navigation item */
	toggleNavItemVisibility: (appId: string, href: string) => Promise<void>;
	/** Set hidden nav items for an app */
	setHiddenNavItems: (appId: string, hiddenHrefs: string[]) => Promise<void>;
	/** Update device-specific app settings */
	updateDeviceAppSettings: (settings: Record<string, unknown>) => Promise<void>;
	/** Get device-specific app settings */
	getDeviceAppSettings: () => Record<string, unknown>;
	/** List all devices */
	getDevices: () => Promise<DeviceInfo[]>;
	/** Remove a device */
	removeDevice: (deviceId: string) => Promise<void>;
}

/**
 * User settings store configuration
 */
export interface UserSettingsStoreConfig {
	/** App identifier (e.g., 'calendar', 'chat') */
	appId: string;
	/** Auth service base URL (string or getter function for lazy resolution) */
	authUrl: string | (() => string);
	/** Function to get current access token */
	getAccessToken: () => Promise<string | null>;
	/** Optional device name (auto-detected if not provided) */
	deviceName?: string;
	/** Optional device type (auto-detected if not provided) */
	deviceType?: DeviceType;
}
