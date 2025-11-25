/**
 * Toast Notification Store
 *
 * A simple toast notification system using Svelte 5 runes.
 */

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
	id: string;
	message: string;
	type: ToastType;
	duration: number;
}

interface ToastOptions {
	duration?: number;
}

// Toast state
let toasts = $state<Toast[]>([]);

// Generate unique ID
function generateId(): string {
	return `toast-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

// Add a toast
function addToast(message: string, type: ToastType, options: ToastOptions = {}): string {
	const id = generateId();
	const duration = options.duration ?? 4000;

	const toast: Toast = { id, message, type, duration };
	toasts = [...toasts, toast];

	// Auto-remove after duration
	if (duration > 0) {
		setTimeout(() => {
			removeToast(id);
		}, duration);
	}

	return id;
}

// Remove a toast
function removeToast(id: string): void {
	toasts = toasts.filter((t) => t.id !== id);
}

// Clear all toasts
function clearToasts(): void {
	toasts = [];
}

// Toast store with methods
export const toastStore = {
	get toasts() {
		return toasts;
	},

	success(message: string, options?: ToastOptions) {
		return addToast(message, 'success', options);
	},

	error(message: string, options?: ToastOptions) {
		return addToast(message, 'error', { duration: 6000, ...options });
	},

	warning(message: string, options?: ToastOptions) {
		return addToast(message, 'warning', options);
	},

	info(message: string, options?: ToastOptions) {
		return addToast(message, 'info', options);
	},

	remove: removeToast,
	clear: clearToasts
};
