import type { ThemeVariant, ThemeMode } from '@mana/shared-theme';

/**
 * Theme availability status for store integration
 */
export type ThemeStatus = 'available' | 'locked' | 'coming_soon' | 'premium';

/**
 * Theme card data for displaying in grid/list
 */
export interface ThemeCardData {
	variant: ThemeVariant;
	status: ThemeStatus;
	isPremium?: boolean;
	price?: number;
	releaseDate?: string;
}

/**
 * Props for ThemePage component
 */
export interface ThemePageProps {
	// Theme Store Integration
	currentVariant: ThemeVariant;
	onSelectTheme: (variant: ThemeVariant) => void;

	// Theme Data (for store extension)
	themes?: ThemeCardData[];

	// UI Customization
	title?: string;
	subtitle?: string;
	showModeSelector?: boolean;
	currentMode?: ThemeMode;
	onModeChange?: (mode: ThemeMode) => void;

	// Back navigation
	showBackButton?: boolean;
	onBack?: () => void;

	// Store Features (preparation)
	showLockedThemes?: boolean;
	onUnlockTheme?: (variant: ThemeVariant) => void;

	// Translations
	translations?: Partial<ThemePageTranslations>;
}

/**
 * Translations for ThemePage
 */
export interface ThemePageTranslations {
	title: string;
	subtitle: string;
	modeLabel: string;
	lightMode: string;
	darkMode: string;
	systemMode: string;
	currentTheme: string;
	selectTheme: string;
	locked: string;
	comingSoon: string;
	premium: string;
	unlock: string;
	lightPreview: string;
	darkPreview: string;
}

/**
 * Default German translations
 */
export const defaultTranslations: ThemePageTranslations = {
	title: 'Theme-Einstellungen',
	subtitle: 'Wähle dein bevorzugtes Farbschema',
	modeLabel: 'Modus',
	lightMode: 'Hell',
	darkMode: 'Dunkel',
	systemMode: 'System',
	currentTheme: 'Aktuelles Theme',
	selectTheme: 'Auswählen',
	locked: 'Gesperrt',
	comingSoon: 'Bald verfügbar',
	premium: 'Premium',
	unlock: 'Freischalten',
	lightPreview: 'Hell',
	darkPreview: 'Dunkel',
};

// ============================================================================
// A11y (Accessibility) Types
// ============================================================================

/**
 * Translations for A11y settings
 */
export interface A11yTranslations {
	/** Section title */
	a11yTitle: string;
	/** Contrast setting label */
	contrastLabel: string;
	/** Normal contrast option */
	contrastNormal: string;
	/** High contrast option */
	contrastHigh: string;
	/** Colorblind setting label */
	colorblindLabel: string;
	/** No colorblind adaptation */
	colorblindNone: string;
	/** Deuteranopia option */
	colorblindDeuteranopia: string;
	/** Protanopia option */
	colorblindProtanopia: string;
	/** Monochrome option */
	colorblindMonochrome: string;
	/** Reduce motion label */
	reduceMotionLabel: string;
	/** Reduce motion description */
	reduceMotionDescription: string;
	/** System default label */
	systemDefault: string;
	/** Reset button */
	reset: string;
}

/**
 * Default German A11y translations
 */
export const defaultA11yTranslations: A11yTranslations = {
	a11yTitle: 'Barrierefreiheit',
	contrastLabel: 'Kontrast',
	contrastNormal: 'Normal',
	contrastHigh: 'Hoch',
	colorblindLabel: 'Farbsehschwäche',
	colorblindNone: 'Keine',
	colorblindDeuteranopia: 'Rot-Grün (Deuteranopie)',
	colorblindProtanopia: 'Rot-Blindheit (Protanopie)',
	colorblindMonochrome: 'Monochrom',
	reduceMotionLabel: 'Animationen reduzieren',
	reduceMotionDescription: 'Deaktiviert Animationen und Übergänge',
	systemDefault: 'System',
	reset: 'Zurücksetzen',
};
