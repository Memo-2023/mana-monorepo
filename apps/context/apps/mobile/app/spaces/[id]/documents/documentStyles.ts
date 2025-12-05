import { StyleSheet } from 'react-native';
import { colors } from '~/utils/theme';
import { useTheme } from '~/utils/theme/theme';

/**
 * Styles für die Dokumentenseite
 * Verwendet das zentrale Theme-System für konsistente Farben
 */
export const documentStyles = StyleSheet.create({
	noFocusRing: {
		// On React Native, focus rings are not rendered - no styles needed
	},
	input: {
		borderWidth: 1,
		borderColor: colors.gray[100],
	},
	fullHeightContent: {
		flexGrow: 1,
	},
});

/**
 * NativeWind-Klassen für die Dokumentenseite
 * Ermöglicht eine einfache Verwendung des Theme-Systems mit NativeWind
 */
export const getDocumentClasses = (themeName = 'blue') => {
	return {
		// Container und Layout
		container: 'flex-1 flex-col',
		contentContainer: 'flex-1 px-4',

		// Hintergrundfarben
		background: 'bg-white dark:bg-gray-900',
		backgroundSecondary: 'bg-gray-50 dark:bg-gray-800',

		// Breadcrumbs-Container
		breadcrumbsContainer:
			'px-4 py-2 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 w-full',

		// Toolbars und Aktionsleisten
		toolbar:
			'flex-row justify-between items-center px-4 py-2 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700',

		// Editoren und Textfelder
		editor: 'p-4 bg-white dark:bg-gray-900 min-h-[200px]',
		editorBorder: 'border border-gray-200 dark:border-gray-700 rounded-md',

		// Vorschau
		preview: 'p-4 bg-white dark:bg-gray-900',
		previewBorder: 'border border-gray-200 dark:border-gray-700 rounded-md',

		// Buttons und interaktive Elemente
		button: `bg-${themeName}-500 hover:bg-${themeName}-600 text-white py-2 px-4 rounded-md`,
		buttonSecondary:
			'bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 py-2 px-4 rounded-md',

		// Text
		text: 'text-gray-900 dark:text-gray-100',
		textSecondary: 'text-gray-600 dark:text-gray-400',

		// Formular-Elemente
		input: `bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md p-2 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-${themeName}-500 focus:border-${themeName}-500`,

		// Zustände
		active: `bg-${themeName}-500 text-white`,
		inactive: 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200',
	};
};

/**
 * Hook zum Abrufen der Dokumenten-Klassen basierend auf dem aktuellen Theme
 * @returns Ein Objekt mit vordefinierten Tailwind-Klassen für das aktuelle Theme
 */
export function useDocumentClasses() {
	const { themeName } = useTheme();
	return getDocumentClasses(themeName);
}

// Für Abwärtskompatibilität
export const documentClasses = getDocumentClasses();
