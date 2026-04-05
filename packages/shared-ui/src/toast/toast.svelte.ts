/**
 * Toast Store - Centralized notification system using Svelte 5 runes
 *
 * Usage:
 * ```ts
 * import { toastStore } from '@mana/shared-ui';
 *
 * // Show notifications
 * toastStore.success('Saved successfully');
 * toastStore.error('Something went wrong');
 * toastStore.warning('Please check your input');
 * toastStore.info('New update available');
 *
 * // Manual control
 * const id = toastStore.show('Custom message', 'info', 5000);
 * toastStore.dismiss(id);
 * toastStore.dismissAll();
 * ```
 */

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastAction {
	label: string;
	onClick: () => void;
}

export interface Toast {
	id: string;
	type: ToastType;
	message: string;
	duration: number;
	action?: ToastAction;
}

// State
let toasts = $state<Toast[]>([]);

// Auto-incrementing ID with timestamp for uniqueness
let nextId = 0;

function generateId(): string {
	return `toast-${++nextId}-${Date.now()}`;
}

export const toastStore = {
	/**
	 * Get all active toasts (reactive)
	 */
	get toasts() {
		return toasts;
	},

	/**
	 * Show a toast notification
	 * @param message - The message to display
	 * @param type - Toast type: 'success' | 'error' | 'warning' | 'info'
	 * @param duration - Duration in ms (0 = permanent, default: 4000)
	 * @param action - Optional action button { label, onClick }
	 * @returns The toast ID for manual dismissal
	 */
	show(message: string, type: ToastType = 'info', duration = 4000, action?: ToastAction): string {
		const id = generateId();
		const toast: Toast = { id, type, message, duration, action };

		toasts = [...toasts, toast];

		// Auto-remove after duration (unless permanent)
		if (duration > 0) {
			setTimeout(() => {
				this.dismiss(id);
			}, duration);
		}

		return id;
	},

	/**
	 * Show a success toast (green)
	 * @param message - The message to display
	 * @param duration - Duration in ms (default: 4000)
	 */
	success(message: string, duration?: number): string {
		return this.show(message, 'success', duration);
	},

	/**
	 * Show an error toast (red) - longer default duration
	 * @param message - The message to display
	 * @param duration - Duration in ms (default: 6000)
	 */
	error(message: string, duration = 6000): string {
		return this.show(message, 'error', duration);
	},

	/**
	 * Show a warning toast (amber)
	 * @param message - The message to display
	 * @param duration - Duration in ms (default: 4000)
	 */
	warning(message: string, duration?: number): string {
		return this.show(message, 'warning', duration);
	},

	/**
	 * Show an info toast (blue)
	 * @param message - The message to display
	 * @param duration - Duration in ms (default: 4000)
	 */
	info(message: string, duration?: number): string {
		return this.show(message, 'info', duration);
	},

	/**
	 * Show a success toast with an undo action button.
	 * @param message - The message to display
	 * @param onUndo - Callback when "Rückgängig" is clicked
	 * @param duration - Duration in ms (default: 5000)
	 */
	undo(message: string, onUndo: () => void, duration = 5000): string {
		return this.show(message, 'success', duration, {
			label: 'Rückgängig',
			onClick: () => {
				onUndo();
				// Find and dismiss this toast after undo
				const id = toasts.find((t) => t.action?.onClick === onUndo)?.id;
				if (id) this.dismiss(id);
			},
		});
	},

	/**
	 * Dismiss a specific toast by ID
	 * @param id - The toast ID to dismiss
	 */
	dismiss(id: string): void {
		toasts = toasts.filter((t) => t.id !== id);
	},

	/**
	 * Dismiss all active toasts
	 */
	dismissAll(): void {
		toasts = [];
	},
};

/**
 * Helper function for API error handling
 * Shows an error toast and returns the error message
 *
 * @example
 * ```ts
 * try {
 *   await api.save(data);
 * } catch (error) {
 *   handleApiError(error, 'Could not save data');
 * }
 * ```
 */
export function handleApiError(
	error: unknown,
	fallbackMessage = 'Ein Fehler ist aufgetreten'
): string {
	const message = error instanceof Error ? error.message : fallbackMessage;
	toastStore.error(message);
	return message;
}

// Backwards compatible alias
export const toast = toastStore;
