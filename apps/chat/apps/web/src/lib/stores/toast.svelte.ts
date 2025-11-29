/**
 * Toast Store - Centralized notification system using Svelte 5 runes
 */

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
	id: string;
	type: ToastType;
	message: string;
	duration: number;
}

// State
let toasts = $state<Toast[]>([]);

// Auto-incrementing ID
let nextId = 0;

function generateId(): string {
	return `toast-${++nextId}-${Date.now()}`;
}

export const toastStore = {
	// Getter for reading toasts
	get toasts() {
		return toasts;
	},

	/**
	 * Show a toast notification
	 */
	show(message: string, type: ToastType = 'info', duration: number = 4000) {
		const id = generateId();
		const toast: Toast = { id, type, message, duration };

		toasts = [...toasts, toast];

		// Auto-remove after duration
		if (duration > 0) {
			setTimeout(() => {
				this.dismiss(id);
			}, duration);
		}

		return id;
	},

	/**
	 * Show success toast
	 */
	success(message: string, duration?: number) {
		return this.show(message, 'success', duration);
	},

	/**
	 * Show error toast
	 */
	error(message: string, duration: number = 6000) {
		return this.show(message, 'error', duration);
	},

	/**
	 * Show warning toast
	 */
	warning(message: string, duration?: number) {
		return this.show(message, 'warning', duration);
	},

	/**
	 * Show info toast
	 */
	info(message: string, duration?: number) {
		return this.show(message, 'info', duration);
	},

	/**
	 * Dismiss a specific toast
	 */
	dismiss(id: string) {
		toasts = toasts.filter((t) => t.id !== id);
	},

	/**
	 * Dismiss all toasts
	 */
	dismissAll() {
		toasts = [];
	},
};

/**
 * Helper function for API error handling
 * Use this in services/stores to show user-friendly error messages
 */
export function handleApiError(error: unknown, fallbackMessage: string = 'Ein Fehler ist aufgetreten'): string {
	const message = error instanceof Error ? error.message : fallbackMessage;
	toastStore.error(message);
	return message;
}
