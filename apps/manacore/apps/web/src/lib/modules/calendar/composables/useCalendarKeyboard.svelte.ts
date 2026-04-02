/**
 * Calendar Keyboard Handling Composable
 */

export interface CancellableOperation {
	isActive: () => boolean;
	cancel: () => void;
}

export function useCalendarKeyboard(operations: CancellableOperation[]) {
	function handleKeyDown(e: KeyboardEvent) {
		if (e.key === 'Escape') {
			const activeOperation = operations.find((op) => op.isActive());
			if (activeOperation) {
				e.preventDefault();
				activeOperation.cancel();
			}
		}
	}

	function setup() {
		document.addEventListener('keydown', handleKeyDown);
		return () => document.removeEventListener('keydown', handleKeyDown);
	}

	return { setup, handleKeyDown };
}
