import type { ThemeVariant, ThemeMode } from '@manacore/shared-theme';

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
