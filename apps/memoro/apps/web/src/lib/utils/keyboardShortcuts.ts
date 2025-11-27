/**
 * Memoro Keyboard Shortcuts
 * Re-exports shared utilities and adds Memoro-specific shortcuts
 */

// Re-export all keyboard shortcut utilities from shared package
export {
	type ShortcutAction,
	type ShortcutGroup,
	matchesShortcut,
	formatShortcut,
	formatShortcutMac,
	createShortcutHandler,
	createShortcuts,
	shortcuts,
	isMac,
	getPlatformShortcut,
} from '@manacore/shared-utils';

import type { ShortcutAction, ShortcutGroup } from '@manacore/shared-utils';

/**
 * Memoro-specific memo panel shortcuts
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
