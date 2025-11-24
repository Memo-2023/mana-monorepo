/**
 * Keyboard Shortcuts Utility
 * Provides centralized keyboard shortcut handling for applications
 */

export interface ShortcutAction {
	key: string;
	ctrl?: boolean;
	shift?: boolean;
	alt?: boolean;
	meta?: boolean; // Command key on Mac
	description: string;
	action: () => void;
	preventDefault?: boolean;
}

export interface ShortcutGroup {
	name: string;
	shortcuts: ShortcutAction[];
}

/**
 * Check if a keyboard event matches a shortcut
 */
export function matchesShortcut(event: KeyboardEvent, shortcut: ShortcutAction): boolean {
	const keyMatches = event.key.toLowerCase() === shortcut.key.toLowerCase();
	const ctrlMatches = shortcut.ctrl ? event.ctrlKey || event.metaKey : !event.ctrlKey && !event.metaKey;
	const shiftMatches = shortcut.shift ? event.shiftKey : !event.shiftKey;
	const altMatches = shortcut.alt ? event.altKey : !event.altKey;

	return keyMatches && ctrlMatches && shiftMatches && altMatches;
}

/**
 * Format shortcut for display (e.g., "Ctrl+S")
 */
export function formatShortcut(shortcut: ShortcutAction): string {
	const parts: string[] = [];

	if (shortcut.ctrl) parts.push('Ctrl');
	if (shortcut.shift) parts.push('Shift');
	if (shortcut.alt) parts.push('Alt');
	parts.push(shortcut.key.toUpperCase());

	return parts.join('+');
}

/**
 * Format shortcut for Mac display (e.g., "⌘S")
 */
export function formatShortcutMac(shortcut: ShortcutAction): string {
	const parts: string[] = [];

	if (shortcut.ctrl) parts.push('⌘');
	if (shortcut.shift) parts.push('⇧');
	if (shortcut.alt) parts.push('⌥');
	parts.push(shortcut.key.toUpperCase());

	return parts.join('');
}

/**
 * Create keyboard shortcut handler
 * @param shortcuts - Array of shortcuts to handle
 * @param options - Options for the handler
 */
export function createShortcutHandler(
	shortcuts: ShortcutAction[],
	options?: {
		/** Allow shortcuts in input fields */
		allowInInputs?: boolean;
	}
) {
	return (event: KeyboardEvent) => {
		// Don't handle shortcuts if user is typing in an input (unless explicitly allowed)
		if (!options?.allowInInputs) {
			const target = event.target as HTMLElement;
			if (
				target.tagName === 'INPUT' ||
				target.tagName === 'TEXTAREA' ||
				target.isContentEditable
			) {
				return;
			}
		}

		for (const shortcut of shortcuts) {
			if (matchesShortcut(event, shortcut)) {
				if (shortcut.preventDefault !== false) {
					event.preventDefault();
				}
				shortcut.action();
				break;
			}
		}
	};
}

/**
 * Create common shortcuts builder
 * Helps create consistent shortcut definitions
 */
export function createShortcuts(actions: {
	onSearch?: () => void;
	onSave?: () => void;
	onEdit?: () => void;
	onCancel?: () => void;
	onDelete?: () => void;
	onNew?: () => void;
	onCopy?: () => void;
	onPaste?: () => void;
	onUndo?: () => void;
	onRedo?: () => void;
}): ShortcutGroup[] {
	const shortcuts: ShortcutGroup[] = [];
	const generalShortcuts: ShortcutAction[] = [];

	if (actions.onSearch) {
		generalShortcuts.push({
			key: 'f',
			ctrl: true,
			description: 'Search',
			action: actions.onSearch
		});
	}

	if (actions.onSave) {
		generalShortcuts.push({
			key: 's',
			ctrl: true,
			description: 'Save',
			action: actions.onSave
		});
	}

	if (actions.onEdit) {
		generalShortcuts.push({
			key: 'e',
			ctrl: true,
			description: 'Edit',
			action: actions.onEdit
		});
	}

	if (actions.onCancel) {
		generalShortcuts.push({
			key: 'Escape',
			description: 'Cancel',
			action: actions.onCancel
		});
	}

	if (actions.onNew) {
		generalShortcuts.push({
			key: 'n',
			ctrl: true,
			description: 'New',
			action: actions.onNew
		});
	}

	if (actions.onDelete) {
		generalShortcuts.push({
			key: 'Delete',
			ctrl: true,
			description: 'Delete',
			action: actions.onDelete
		});
	}

	if (actions.onCopy) {
		generalShortcuts.push({
			key: 'c',
			ctrl: true,
			shift: true,
			description: 'Copy',
			action: actions.onCopy
		});
	}

	if (actions.onUndo) {
		generalShortcuts.push({
			key: 'z',
			ctrl: true,
			description: 'Undo',
			action: actions.onUndo
		});
	}

	if (actions.onRedo) {
		generalShortcuts.push({
			key: 'z',
			ctrl: true,
			shift: true,
			description: 'Redo',
			action: actions.onRedo
		});
	}

	if (generalShortcuts.length > 0) {
		shortcuts.push({
			name: 'General',
			shortcuts: generalShortcuts
		});
	}

	return shortcuts;
}

/**
 * Svelte action for keyboard shortcuts
 * Usage: <div use:shortcuts={shortcutActions}>
 */
export function shortcuts(node: HTMLElement, shortcutActions: ShortcutAction[]) {
	const handler = createShortcutHandler(shortcutActions);

	node.addEventListener('keydown', handler);

	return {
		destroy() {
			node.removeEventListener('keydown', handler);
		},
		update(newShortcutActions: ShortcutAction[]) {
			node.removeEventListener('keydown', handler);
			const newHandler = createShortcutHandler(newShortcutActions);
			node.addEventListener('keydown', newHandler);
		}
	};
}

/**
 * Check if running on Mac
 */
export function isMac(): boolean {
	if (typeof navigator === 'undefined') return false;
	return navigator.platform.toUpperCase().indexOf('MAC') >= 0;
}

/**
 * Get platform-aware shortcut display
 */
export function getPlatformShortcut(shortcut: ShortcutAction): string {
	return isMac() ? formatShortcutMac(shortcut) : formatShortcut(shortcut);
}
