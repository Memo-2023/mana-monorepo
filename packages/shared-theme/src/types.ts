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
// Global User Settings Types (synced via mana-core-auth)
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
}

/**
 * Per-app override settings (partial, only overridden values)
 */
export interface AppOverride {
	nav?: Partial<NavSettings>;
	theme?: Partial<ThemeSettings>;
}

/**
 * Full user settings response from API
 */
export interface UserSettingsResponse {
	globalSettings: GlobalSettings;
	appOverrides: Record<string, AppOverride>;
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
	nav: { desktopPosition: 'top', sidebarCollapsed: false },
	theme: { mode: 'system', colorScheme: 'ocean', pinnedThemes: [] },
	locale: 'de',
	general: DEFAULT_GENERAL_SETTINGS,
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
}

/**
 * User settings store configuration
 */
export interface UserSettingsStoreConfig {
	/** App identifier (e.g., 'calendar', 'chat') */
	appId: string;
	/** Auth service base URL */
	authUrl: string;
	/** Function to get current access token */
	getAccessToken: () => Promise<string | null>;
}

// ============================================================================
// Custom & Community Themes Types
// ============================================================================

/**
 * Partial theme colors for API DTOs (some fields optional)
 */
export interface ThemeColorsInput {
	primary: HSLValue;
	primaryForeground?: HSLValue;
	background: HSLValue;
	foreground: HSLValue;
	surface: HSLValue;
	surfaceHover?: HSLValue;
	surfaceElevated?: HSLValue;
	muted?: HSLValue;
	mutedForeground?: HSLValue;
	border?: HSLValue;
	borderStrong?: HSLValue;
	secondary?: HSLValue;
	secondaryForeground?: HSLValue;
	input?: HSLValue;
	ring?: HSLValue;
	error: HSLValue;
	success: HSLValue;
	warning: HSLValue;
}

/**
 * User-created custom theme
 */
export interface CustomTheme {
	id: string;
	userId: string;
	name: string;
	description?: string;
	emoji: string;
	icon: string;
	lightColors: ThemeColors;
	darkColors: ThemeColors;
	baseVariant?: ThemeVariant;
	isPublished: boolean;
	createdAt: Date;
	updatedAt: Date;
}

/**
 * Input for creating a new custom theme
 */
export interface CreateCustomThemeInput {
	name: string;
	description?: string;
	emoji?: string;
	icon?: string;
	lightColors: ThemeColorsInput;
	darkColors: ThemeColorsInput;
	baseVariant?: ThemeVariant;
}

/**
 * Input for updating a custom theme
 */
export interface UpdateCustomThemeInput {
	name?: string;
	description?: string;
	emoji?: string;
	icon?: string;
	lightColors?: ThemeColorsInput;
	darkColors?: ThemeColorsInput;
	baseVariant?: ThemeVariant;
}

/**
 * Community theme shared publicly
 */
export interface CommunityTheme {
	id: string;
	authorId?: string;
	authorName?: string;
	name: string;
	description?: string;
	emoji: string;
	icon: string;
	lightColors: ThemeColors;
	darkColors: ThemeColors;
	baseVariant?: ThemeVariant;
	downloadCount: number;
	averageRating: number;
	ratingCount: number;
	status: 'pending' | 'approved' | 'rejected' | 'featured';
	isFeatured: boolean;
	tags: string[];
	createdAt: Date;
	publishedAt?: Date;
	/** User-specific fields (when authenticated) */
	isFavorited?: boolean;
	isDownloaded?: boolean;
	userRating?: number;
}

/**
 * Query parameters for browsing community themes
 */
export interface CommunityThemeQuery {
	page?: number;
	limit?: number;
	sort?: 'popular' | 'recent' | 'rating' | 'downloads';
	search?: string;
	tags?: string[];
	authorId?: string;
	featuredOnly?: boolean;
}

/**
 * Paginated response for community themes
 */
export interface PaginatedCommunityThemes {
	themes: CommunityTheme[];
	total: number;
	page: number;
	limit: number;
	totalPages: number;
}

/**
 * Input for publishing a theme to the community
 */
export interface PublishThemeInput {
	tags?: string[];
	description?: string;
}

/**
 * Theme editor state for UI
 */
export interface ThemeEditorState {
	/** Theme being edited */
	theme: Partial<CreateCustomThemeInput>;
	/** Currently editing light or dark colors */
	editingMode: EffectiveMode;
	/** Currently selected color key */
	selectedColorKey: keyof ThemeColors | null;
	/** Is preview mode active */
	isPreviewing: boolean;
	/** Has unsaved changes */
	isDirty: boolean;
}

/**
 * Custom themes store interface
 */
export interface CustomThemesStore {
	/** User's custom themes */
	readonly customThemes: CustomTheme[];
	/** Community themes (from current query) */
	readonly communityThemes: CommunityTheme[];
	/** User's favorited themes */
	readonly favorites: CommunityTheme[];
	/** User's downloaded themes */
	readonly downloaded: CommunityTheme[];
	/** Pagination info */
	readonly pagination: { page: number; totalPages: number; total: number };
	/** Loading state */
	readonly loading: boolean;
	/** Error state */
	readonly error: string | null;

	// Custom theme operations
	loadCustomThemes: () => Promise<void>;
	createTheme: (input: CreateCustomThemeInput) => Promise<CustomTheme>;
	updateTheme: (id: string, input: UpdateCustomThemeInput) => Promise<CustomTheme>;
	deleteTheme: (id: string) => Promise<void>;
	publishTheme: (id: string, input?: PublishThemeInput) => Promise<CommunityTheme>;

	// Community theme operations
	browseCommunity: (query?: CommunityThemeQuery) => Promise<void>;
	downloadTheme: (id: string) => Promise<CommunityTheme>;
	rateTheme: (
		id: string,
		rating: number
	) => Promise<{ averageRating: number; ratingCount: number }>;
	toggleFavorite: (id: string) => Promise<{ isFavorited: boolean }>;
	loadFavorites: () => Promise<void>;
	loadDownloaded: () => Promise<void>;

	// Apply theme
	applyCustomTheme: (theme: CustomTheme | CommunityTheme) => void;
	clearCustomTheme: () => void;
}

/**
 * Custom themes store configuration
 */
export interface CustomThemesStoreConfig {
	/** Auth service base URL */
	authUrl: string;
	/** Function to get current access token */
	getAccessToken: () => Promise<string | null>;
	/** Theme store to apply custom themes to */
	themeStore?: ThemeStore;
}

/**
 * Main colors for the simplified editor view
 * These are the 7 most important colors users typically want to customize
 */
export const MAIN_THEME_COLORS: (keyof ThemeColors)[] = [
	'primary',
	'background',
	'surface',
	'foreground',
	'error',
	'success',
	'warning',
];

/**
 * Extended/advanced colors (collapsed by default in editor)
 */
export const EXTENDED_THEME_COLORS: (keyof ThemeColors)[] = [
	'primaryForeground',
	'secondary',
	'secondaryForeground',
	'surfaceHover',
	'surfaceElevated',
	'muted',
	'mutedForeground',
	'border',
	'borderStrong',
	'input',
	'ring',
];

/**
 * Color labels for the editor UI
 */
export const THEME_COLOR_LABELS: Record<keyof ThemeColors, string> = {
	primary: 'Primary',
	primaryForeground: 'Primary Text',
	secondary: 'Secondary',
	secondaryForeground: 'Secondary Text',
	background: 'Background',
	foreground: 'Text',
	surface: 'Surface',
	surfaceHover: 'Surface Hover',
	surfaceElevated: 'Elevated Surface',
	muted: 'Muted',
	mutedForeground: 'Muted Text',
	border: 'Border',
	borderStrong: 'Border Strong',
	error: 'Error',
	success: 'Success',
	warning: 'Warning',
	input: 'Input',
	ring: 'Focus Ring',
};
