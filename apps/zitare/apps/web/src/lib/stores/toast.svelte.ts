// Simple toast notification store

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface Toast {
	id: string;
	message: string;
	type: ToastType;
}

let toasts = $state<Toast[]>([]);

function addToast(message: string, type: ToastType = 'info', duration = 3000) {
	const id = crypto.randomUUID();
	toasts = [...toasts, { id, message, type }];

	setTimeout(() => {
		toasts = toasts.filter((t) => t.id !== id);
	}, duration);
}

export const toast = {
	get toasts() {
		return toasts;
	},
	success: (message: string) => addToast(message, 'success'),
	error: (message: string) => addToast(message, 'error'),
	info: (message: string) => addToast(message, 'info'),
	warning: (message: string) => addToast(message, 'warning'),
	dismiss: (id: string) => {
		toasts = toasts.filter((t) => t.id !== id);
	},
};
