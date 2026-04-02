/**
 * Keyboard Shortcuts Utility
 * Provides centralized keyboard shortcut handling for the application
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
	const ctrlMatches = shortcut.ctrl
		? event.ctrlKey || event.metaKey
		: !event.ctrlKey && !event.metaKey;
	const shiftMatches = shortcut.shift ? event.shiftKey : !event.shiftKey;
	const altMatches = shortcut.alt ? event.altKey : !event.altKey;

	return keyMatches && ctrlMatches && shiftMatches && altMatches;
}

/**
 * Format shortcut for display
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
 * Create keyboard shortcut handler
 */
export function createShortcutHandler(shortcuts: ShortcutAction[]) {
	return (event: KeyboardEvent) => {
		// Don't handle shortcuts if user is typing in an input
		const target = event.target as HTMLElement;
		if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
			return;
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
 * Default memo panel shortcuts
 */
export function getMemoPanelShortcuts(actions: {
	onEdit?: () => void;
	onSave?: () => void;
	onCancel?: () => void;
	onDelete?: () => void;
	onSearch?: () => void;
	onShare?: () => void;
	onCopy?: () => void;
	onPin?: () => void;
	onCreateMemory?: () => void;
	onAskQuestion?: () => void;
}): ShortcutGroup[] {
	const shortcuts: ShortcutGroup[] = [];

	// General Actions
	const generalShortcuts: ShortcutAction[] = [];

	if (actions.onSearch) {
		generalShortcuts.push({
			key: 'f',
			ctrl: true,
			description: 'Search in memo',
			action: actions.onSearch,
		});
	}

	if (actions.onEdit) {
		generalShortcuts.push({
			key: 'e',
			ctrl: true,
			description: 'Edit memo',
			action: actions.onEdit,
		});
	}

	if (actions.onSave) {
		generalShortcuts.push({
			key: 's',
			ctrl: true,
			description: 'Save changes',
			action: actions.onSave,
		});
	}

	if (actions.onCancel) {
		generalShortcuts.push({
			key: 'Escape',
			description: 'Cancel edit',
			action: actions.onCancel,
		});
	}

	if (generalShortcuts.length > 0) {
		shortcuts.push({
			name: 'General',
			shortcuts: generalShortcuts,
		});
	}

	// Memo Actions
	const memoShortcuts: ShortcutAction[] = [];

	if (actions.onPin) {
		memoShortcuts.push({
			key: 'p',
			ctrl: true,
			description: 'Toggle pin',
			action: actions.onPin,
		});
	}

	if (actions.onCopy) {
		memoShortcuts.push({
			key: 'c',
			ctrl: true,
			shift: true,
			description: 'Copy transcript',
			action: actions.onCopy,
		});
	}

	if (actions.onShare) {
		memoShortcuts.push({
			key: 's',
			ctrl: true,
			shift: true,
			description: 'Share memo',
			action: actions.onShare,
		});
	}

	if (actions.onDelete) {
		memoShortcuts.push({
			key: 'Delete',
			ctrl: true,
			description: 'Delete memo',
			action: actions.onDelete,
		});
	}

	if (memoShortcuts.length > 0) {
		shortcuts.push({
			name: 'Memo Actions',
			shortcuts: memoShortcuts,
		});
	}

	// AI Actions
	const aiShortcuts: ShortcutAction[] = [];

	if (actions.onCreateMemory) {
		aiShortcuts.push({
			key: 'm',
			ctrl: true,
			description: 'Create memory',
			action: actions.onCreateMemory,
		});
	}

	if (actions.onAskQuestion) {
		aiShortcuts.push({
			key: 'q',
			ctrl: true,
			description: 'Ask question',
			action: actions.onAskQuestion,
		});
	}

	if (aiShortcuts.length > 0) {
		shortcuts.push({
			name: 'AI Features',
			shortcuts: aiShortcuts,
		});
	}

	return shortcuts;
}

/**
 * Svelte action for keyboard shortcuts
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
		},
	};
}
