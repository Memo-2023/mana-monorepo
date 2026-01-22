import { writable } from 'svelte/store';

export interface Toast {
	id: string;
	type: 'success' | 'error' | 'info' | 'warning';
	message: string;
	duration?: number;
}

function createToastStore() {
	const { subscribe, update } = writable<Toast[]>([]);

	function addToast(toast: Omit<Toast, 'id'>) {
		const id = crypto.randomUUID();
		const newToast = { ...toast, id };

		update((toasts) => [...toasts, newToast]);

		// Auto-remove after duration
		const duration = toast.duration || 5000;
		setTimeout(() => {
			removeToast(id);
		}, duration);

		return id;
	}

	function removeToast(id: string) {
		update((toasts) => toasts.filter((t) => t.id !== id));
	}

	return {
		subscribe,
		success: (message: string, duration?: number) =>
			addToast({ type: 'success', message, duration }),
		error: (message: string, duration?: number) => addToast({ type: 'error', message, duration }),
		info: (message: string, duration?: number) => addToast({ type: 'info', message, duration }),
		warning: (message: string, duration?: number) =>
			addToast({ type: 'warning', message, duration }),
		remove: removeToast,
	};
}

export const toasts = createToastStore();
