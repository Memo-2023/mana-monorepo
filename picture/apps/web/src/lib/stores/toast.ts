import { writable } from 'svelte/store';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
	id: string;
	message: string;
	type: ToastType;
	duration?: number;
}

export const toasts = writable<Toast[]>([]);

let toastId = 0;

export function showToast(message: string, type: ToastType = 'info', duration = 5000) {
	const id = `toast-${toastId++}`;
	const toast: Toast = { id, message, type, duration };

	toasts.update((current) => [...current, toast]);

	if (duration > 0) {
		setTimeout(() => {
			dismissToast(id);
		}, duration);
	}

	return id;
}

export function dismissToast(id: string) {
	toasts.update((current) => current.filter((toast) => toast.id !== id));
}

export function clearToasts() {
	toasts.set([]);
}
