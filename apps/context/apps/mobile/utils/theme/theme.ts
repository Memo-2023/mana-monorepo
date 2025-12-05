import { colors, ColorTheme, themes, ThemeNames } from './colors';
import { useAppTheme, ThemeMode } from '~/components/theme/ThemeProvider';

/**
 * Theme-Utility für die Anwendung
 * Bietet Funktionen und Hooks für die einfache Verwendung des Themes
 */

/**
 * Hook zum Abrufen des aktuellen Themes
 * @returns Das aktuelle Theme-Objekt mit Farben und Funktionen
 */
export function useTheme() {
	const appTheme = useAppTheme();
	const currentThemeColors = themes[appTheme.themeName] || themes.blue;

	return {
		...appTheme,
		colors: {
			...colors,
			...currentThemeColors,
		},
	};
}

/**
 * Hilfsfunktion zum Abrufen einer Farbe basierend auf dem aktuellen Farbschema
 * @param lightColor Die Farbe im Light-Modus
 * @param darkColor Die Farbe im Dark-Modus
 * @returns Die entsprechende Farbe basierend auf dem aktuellen Farbschema
 */
export function useColorModeValue(lightColor: string, darkColor: string): string {
	const { isDark } = useTheme();
	return isDark ? darkColor : lightColor;
}

/**
 * Hilfsfunktion zum Generieren von Tailwind-Klassen basierend auf dem Farbschema
 * @param lightClasses Die Tailwind-Klassen im Light-Modus
 * @param darkClasses Die Tailwind-Klassen im Dark-Modus
 * @returns Die kombinierten Tailwind-Klassen
 */
export function tw(lightClasses: string, darkClasses: string): string {
	const { isDark } = useTheme();
	return isDark ? darkClasses : lightClasses;
}

/**
 * Hilfsfunktion zum Generieren von Tailwind-Klassen mit automatischer Dark-Mode-Unterstützung
 * Beispiel: twMerge('bg-white dark:bg-gray-900', 'text-gray-800 dark:text-gray-200')
 * @param classes Die Tailwind-Klassen
 * @returns Die kombinierten Tailwind-Klassen
 */
export function twMerge(...classes: string[]): string {
	return classes.filter(Boolean).join(' ');
}

/**
 * Generiere Theme-Klassen basierend auf dem aktuellen Theme
 * @param themeName Der Name des Themes
 * @returns Ein Objekt mit vordefinierten Tailwind-Klassen für das angegebene Theme
 */
export function getThemeClasses(themeName: ThemeNames = 'blue') {
	const theme = themes[themeName] || themes.blue;

	return {
		// Hintergrundfarben
		background: 'bg-white dark:bg-gray-900',
		backgroundSecondary: 'bg-gray-50 dark:bg-gray-800',
		backgroundTertiary: 'bg-gray-100 dark:bg-gray-700',

		// Textfarben
		text: 'text-gray-800 dark:text-gray-200',
		textSecondary: 'text-gray-600 dark:text-gray-400',
		textTertiary: 'text-gray-500 dark:text-gray-500',
		textAccent: `text-${theme.name}-600 dark:text-${theme.name}-400`,

		// Randfarben
		border: 'border-gray-200 dark:border-gray-700',
		borderAccent: `border-${theme.name}-500 dark:border-${theme.name}-400`,

		// Interaktive Elemente
		button: `bg-${theme.name}-500 hover:bg-${theme.name}-600 text-white`,
		buttonSecondary:
			'bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200',

		// Karten und Container
		card: 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm',

		// Formulare
		input: `bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-${theme.name}-500 focus:border-${theme.name}-500`,
	};
}

/**
 * Hook zum Abrufen der Theme-Klassen basierend auf dem aktuellen Theme
 * @returns Ein Objekt mit vordefinierten Tailwind-Klassen für das aktuelle Theme
 */
export function useThemeClasses() {
	const { themeName } = useTheme();
	return getThemeClasses(themeName);
}

// Vordefinierte Theme-Klassen für häufig verwendete UI-Elemente (für Abwärtskompatibilität)
export const themeClasses = getThemeClasses();

// Export aller Theme-Funktionen und -Konstanten
export default {
	colors,
	themes,
	useTheme,
	useColorModeValue,
	tw,
	twMerge,
	getThemeClasses,
	useThemeClasses,
};
