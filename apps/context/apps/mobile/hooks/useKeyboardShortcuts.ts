import { useEffect } from 'react';
import { Platform } from 'react-native';
import { EDITOR_CONFIG } from '~/config/editorConfig';

export interface KeyboardActions {
	save: () => void;
	togglePreview: () => void;
	focusContent: () => void;
	navigateToSpace: () => void;
	newDocument?: () => void;
	deleteDocument?: () => void;
	showTags?: () => void;
}

export interface UseKeyboardShortcutsOptions {
	enabled?: boolean;
	preventDefault?: boolean;
}

/**
 * Custom Hook für Keyboard Shortcuts im Dokumenten-Editor
 * Unterstützt sowohl Mac (Cmd) als auch Windows/Linux (Ctrl)
 */
export const useKeyboardShortcuts = (
	actions: KeyboardActions,
	options: UseKeyboardShortcutsOptions = {}
) => {
	const { enabled = true, preventDefault = true } = options;

	useEffect(() => {
		// Nur auf Web-Plattformen aktivieren
		if (Platform.OS !== 'web' || !enabled) {
			return;
		}

		const handleKeyPress = (e: KeyboardEvent) => {
			// Prüfe ob Modifier-Key (Ctrl oder Cmd) gedrückt ist
			const isModifierPressed = e.ctrlKey || e.metaKey;

			if (!isModifierPressed) {
				return;
			}

			// Ignoriere Shortcuts wenn in Input-Feldern (außer unserem Editor)
			const target = e.target as HTMLElement;
			const isInInput =
				target.tagName === 'INPUT' ||
				target.tagName === 'TEXTAREA' ||
				target.contentEditable === 'true';

			// Erlaube Shortcuts nur in unserem Editor oder wenn nicht in Input-Feldern
			const isInEditor = target.closest('[data-editor="true"]') !== null;

			if (isInInput && !isInEditor) {
				return;
			}

			switch (e.key.toLowerCase()) {
				case 's':
					if (preventDefault) e.preventDefault();
					actions.save();
					break;

				case 'p':
					if (preventDefault) e.preventDefault();
					actions.togglePreview();
					break;

				case 'k':
					if (preventDefault) e.preventDefault();
					actions.focusContent();
					break;

				case 'n':
					if (preventDefault) e.preventDefault();
					actions.newDocument?.();
					break;

				case 'backspace':
				case 'delete':
					// Nur wenn Shift auch gedrückt ist
					if (e.shiftKey) {
						if (preventDefault) e.preventDefault();
						actions.deleteDocument?.();
					}
					break;

				case 't':
					if (preventDefault) e.preventDefault();
					actions.showTags?.();
					break;

				case 'escape':
					// Escape schließt Modals/Dropdowns
					if (preventDefault) e.preventDefault();
					// Implementierung abhängig von der Verwendung
					break;
			}
		};

		document.addEventListener('keydown', handleKeyPress);

		return () => {
			document.removeEventListener('keydown', handleKeyPress);
		};
	}, [actions, enabled, preventDefault]);

	// Hilfsfunktion für Shortcut-Anzeige
	const getShortcutText = (key: string): string => {
		const isMac = Platform.OS === 'web' && navigator.platform.toUpperCase().includes('MAC');
		const modifier = isMac ? '⌘' : 'Ctrl';

		const keyMap: Record<string, string> = {
			s: `${modifier}+S`,
			p: `${modifier}+P`,
			k: `${modifier}+K`,
			n: `${modifier}+N`,
			t: `${modifier}+T`,
			delete: `${modifier}+Shift+⌫`,
		};

		return keyMap[key] || key;
	};

	// Verfügbare Shortcuts für UI-Anzeige
	const shortcuts = {
		save: getShortcutText('s'),
		togglePreview: getShortcutText('p'),
		focusContent: getShortcutText('k'),
		newDocument: getShortcutText('n'),
		showTags: getShortcutText('t'),
		deleteDocument: getShortcutText('delete'),
	};

	return {
		shortcuts,
		getShortcutText,
		isWebPlatform: Platform.OS === 'web',
	};
};
