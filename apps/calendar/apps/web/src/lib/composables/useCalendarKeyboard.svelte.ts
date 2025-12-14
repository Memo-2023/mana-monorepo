/**
 * Calendar Keyboard Handling Composable
 * Handles keyboard shortcuts for calendar views (e.g., Escape to cancel drag/resize)
 */

export interface CancellableOperation {
	/** Check if operation is active */
	isActive: () => boolean;
	/** Cancel the operation */
	cancel: () => void;
}

/**
 * Creates a keyboard handler that cancels operations on Escape key
 * Automatically sets up and cleans up the event listener via $effect
 *
 * @param operations - Array of operations that can be cancelled (e.g., drag/drop, resize)
 */
export function useCalendarKeyboard(operations: CancellableOperation[]) {
	function handleKeyDown(e: KeyboardEvent) {
		if (e.key === 'Escape') {
			// Check if any operation is active
			const activeOperation = operations.find((op) => op.isActive());
			if (activeOperation) {
				e.preventDefault();
				activeOperation.cancel();
			}
		}
	}

	// Setup listener - call this in $effect
	function setup() {
		document.addEventListener('keydown', handleKeyDown);
		return () => document.removeEventListener('keydown', handleKeyDown);
	}

	return {
		setup,
		handleKeyDown,
	};
}
