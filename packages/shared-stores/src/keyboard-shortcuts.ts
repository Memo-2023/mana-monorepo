/**
 * Keyboard Shortcuts Registry
 *
 * Centralized keyboard shortcut handler. Modules register shortcuts,
 * the registry listens for keydown events and dispatches to handlers.
 *
 * @example
 * ```typescript
 * import { keyboardShortcuts } from '@mana/shared-stores';
 *
 * // Register shortcuts (typically in onMount)
 * const unsubscribe = keyboardShortcuts.register([
 *   { key: 'n', ctrl: true, handler: () => createNew(), description: 'Neu erstellen' },
 *   { key: 'Escape', handler: () => closeModal(), description: 'Schließen' },
 *   { key: '/', handler: () => focusSearch(), description: 'Suchen' },
 * ]);
 *
 * // Cleanup (in onDestroy)
 * unsubscribe();
 * ```
 */

export interface ShortcutBinding {
	/** Key to match (e.g. 'n', 'Escape', '/') */
	key: string;
	/** Require Ctrl (or Cmd on Mac) */
	ctrl?: boolean;
	/** Require Shift */
	shift?: boolean;
	/** Require Alt */
	alt?: boolean;
	/** Handler function */
	handler: () => void;
	/** Description (for help modal) */
	description?: string;
	/** Only fire when no input/textarea is focused (default: true) */
	ignoreInputs?: boolean;
}

export interface KeyboardShortcutRegistry {
	/** Register shortcuts, returns unsubscribe function */
	register(bindings: ShortcutBinding[]): () => void;
	/** Start listening for keyboard events */
	start(): void;
	/** Stop listening */
	stop(): void;
	/** Get all registered shortcuts (for help display) */
	getAll(): ShortcutBinding[];
}

export function createKeyboardShortcuts(): KeyboardShortcutRegistry {
	const allBindings: Set<ShortcutBinding> = new Set();
	let listening = false;

	function isInputFocused(): boolean {
		const el = document.activeElement;
		if (!el) return false;
		const tag = el.tagName.toLowerCase();
		return (
			tag === 'input' ||
			tag === 'textarea' ||
			tag === 'select' ||
			(el as HTMLElement).isContentEditable
		);
	}

	function handleKeyDown(e: KeyboardEvent) {
		const isMac = navigator.platform.includes('Mac');
		const ctrlKey = isMac ? e.metaKey : e.ctrlKey;

		for (const binding of allBindings) {
			if (binding.key.toLowerCase() !== e.key.toLowerCase()) continue;
			if (binding.ctrl && !ctrlKey) continue;
			if (binding.shift && !e.shiftKey) continue;
			if (binding.alt && !e.altKey) continue;
			if (!binding.ctrl && ctrlKey && binding.key.length === 1) continue; // Don't fire 'n' on Ctrl+N
			if (binding.ignoreInputs !== false && isInputFocused()) continue;

			e.preventDefault();
			binding.handler();
			return;
		}
	}

	return {
		register(bindings: ShortcutBinding[]): () => void {
			for (const b of bindings) {
				allBindings.add(b);
			}
			return () => {
				for (const b of bindings) {
					allBindings.delete(b);
				}
			};
		},

		start() {
			if (listening) return;
			document.addEventListener('keydown', handleKeyDown);
			listening = true;
		},

		stop() {
			document.removeEventListener('keydown', handleKeyDown);
			listening = false;
		},

		getAll(): ShortcutBinding[] {
			return [...allBindings];
		},
	};
}

/** Singleton instance for the app */
export const keyboardShortcuts = createKeyboardShortcuts();
