/**
 * Toast Store - Svelte 5 Runes version
 * Manages toast notifications
 */

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
	id: string;
	type: ToastType;
	message: string;
	duration?: number;
}

// State
let toasts = $state<Toast[]>([]);

function add(message: string, type: ToastType = 'info', duration: number = 4000): string {
	const id = crypto.randomUUID();
	const toast: Toast = { id, type, message, duration };

	toasts = [...toasts, toast];

	if (duration > 0) {
		setTimeout(() => {
			remove(id);
		}, duration);
	}

	return id;
}

function remove(id: string) {
	toasts = toasts.filter((t) => t.id !== id);
}

function clear() {
	toasts = [];
}

export const toastStore = {
	get toasts() {
		return toasts;
	},

	add,
	remove,
	clear,

	success: (message: string, duration?: number) => add(message, 'success', duration),
	error: (message: string, duration?: number) => add(message, 'error', duration ?? 6000),
	warning: (message: string, duration?: number) => add(message, 'warning', duration),
	info: (message: string, duration?: number) => add(message, 'info', duration),
};

// Keep old export for backwards compatibility
export const toast = toastStore;
