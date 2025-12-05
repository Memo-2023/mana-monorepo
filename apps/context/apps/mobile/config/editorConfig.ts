/**
 * Konfiguration für den Dokumenten-Editor
 * Zentralisiert alle Magic Numbers und Einstellungen
 */

export const EDITOR_CONFIG = {
	// Auto-Save Einstellungen
	AUTO_SAVE_DELAY: 3000, // 3 Sekunden nach dem letzten Keystroke
	NEW_DOC_SAVE_DELAY: 2000, // 2 Sekunden für neue Dokumente
	BACKUP_INTERVAL: 15000, // 15 Sekunden für lokale Backups
	MIN_CONTENT_LENGTH: 50, // Mindestlänge für Auto-Save
	LARGE_TEXT_THRESHOLD: 100, // Sofortiges Speichern ab 100 Zeichen

	// Editor Einstellungen
	DEBOUNCE_DELAY: 300, // Debounce für Eingaben
	SAVE_LOCK_TIMEOUT: 30000, // 30 Sekunden Save-Lock-Timeout

	// Local Storage Keys
	LOCAL_STORAGE_KEYS: {
		BACKUP_PREFIX: 'doc_backup_',
		DRAFT_PREFIX: 'doc_draft_',
		EDITOR_STATE: 'editor_state',
	},

	// UI Einstellungen
	FADE_DURATION: 300, // Fade-Animationen
	PREVIEW_PADDING: {
		TOP: 50,
		BOTTOM: 200,
	},

	// Keyboard Shortcuts
	KEYBOARD_SHORTCUTS: {
		SAVE: ['Control+s', 'Meta+s'],
		TOGGLE_PREVIEW: ['Control+p', 'Meta+p'],
		FOCUS_CONTENT: ['Control+k', 'Meta+k'],
		NEW_DOCUMENT: ['Control+n', 'Meta+n'],
	},
} as const;

export type EditorConfig = typeof EDITOR_CONFIG;
