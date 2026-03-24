/**
 * Svelte action that traps focus within an element.
 * Useful for modals and dialogs to prevent tabbing outside.
 */
export function focusTrap(node: HTMLElement) {
	const focusableSelectors = [
		'a[href]',
		'button:not([disabled])',
		'input:not([disabled])',
		'select:not([disabled])',
		'textarea:not([disabled])',
		'[tabindex]:not([tabindex="-1"])',
	].join(', ');

	let previouslyFocused: HTMLElement | null = null;

	function getFocusableElements(): HTMLElement[] {
		return Array.from(node.querySelectorAll<HTMLElement>(focusableSelectors)).filter(
			(el) => !el.hasAttribute('disabled') && el.offsetParent !== null
		);
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key !== 'Tab') return;

		const focusable = getFocusableElements();
		if (focusable.length === 0) return;

		const first = focusable[0];
		const last = focusable[focusable.length - 1];

		if (e.shiftKey) {
			if (document.activeElement === first) {
				e.preventDefault();
				last.focus();
			}
		} else {
			if (document.activeElement === last) {
				e.preventDefault();
				first.focus();
			}
		}
	}

	// Save currently focused element and focus first focusable in trap
	previouslyFocused = document.activeElement as HTMLElement;

	// Use requestAnimationFrame to ensure the DOM is ready
	requestAnimationFrame(() => {
		const focusable = getFocusableElements();
		if (focusable.length > 0) {
			focusable[0].focus();
		} else {
			node.focus();
		}
	});

	node.addEventListener('keydown', handleKeydown);

	return {
		destroy() {
			node.removeEventListener('keydown', handleKeydown);
			// Restore focus to previously focused element
			if (previouslyFocused && typeof previouslyFocused.focus === 'function') {
				previouslyFocused.focus();
			}
		},
	};
}
