/**
 * Global Spotlight State
 *
 * Manages open/close state for the Cmd+K command palette.
 * Registers a global keydown listener.
 */
export function createGlobalSpotlightState() {
	let isOpen = $state(false);

	$effect(() => {
		function handleKeydown(e: KeyboardEvent) {
			if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
				e.preventDefault();
				isOpen = !isOpen;
			}
			if (e.key === 'Escape' && isOpen) {
				isOpen = false;
			}
		}

		window.addEventListener('keydown', handleKeydown);
		return () => window.removeEventListener('keydown', handleKeydown);
	});

	return {
		get isOpen() {
			return isOpen;
		},
		open() {
			isOpen = true;
		},
		close() {
			isOpen = false;
		},
		toggle() {
			isOpen = !isOpen;
		},
	};
}
