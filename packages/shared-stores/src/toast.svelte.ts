/**
 * Toast Store Factory
 * Creates a toast notification store with Svelte 5 runes.
 */

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
	id: string;
	type: ToastType;
	message: string;
	duration?: number;
}

export interface ToastStore {
	readonly toasts: Toast[];
	show: (message: string, type?: ToastType, duration?: number) => void;
	success: (message: string, duration?: number) => void;
	error: (message: string, duration?: number) => void;
	info: (message: string, duration?: number) => void;
	warning: (message: string, duration?: number) => void;
	dismiss: (id: string) => void;
	clear: () => void;
}

export interface ToastStoreConfig {
	/** Default duration in milliseconds (default: 5000) */
	defaultDuration?: number;
	/** Maximum number of toasts visible at once */
	maxToasts?: number;
}

/**
 * Create a toast store with Svelte 5 runes.
 */
export function createToastStore(config: ToastStoreConfig = {}): ToastStore {
	const { defaultDuration = 5000, maxToasts = 5 } = config;

	let toasts = $state<Toast[]>([]);

	function generateId(): string {
		return Math.random().toString(36).substring(2, 9);
	}

	function show(message: string, type: ToastType = 'info', duration: number = defaultDuration) {
		const id = generateId();
		const toast: Toast = { id, type, message, duration };

		toasts = [...toasts.slice(-(maxToasts - 1)), toast];

		if (duration > 0) {
			setTimeout(() => dismiss(id), duration);
		}
	}

	function dismiss(id: string) {
		toasts = toasts.filter((t) => t.id !== id);
	}

	function clear() {
		toasts = [];
	}

	return {
		get toasts() {
			return toasts;
		},
		show,
		success: (message: string, duration?: number) => show(message, 'success', duration),
		error: (message: string, duration?: number) => show(message, 'error', duration),
		info: (message: string, duration?: number) => show(message, 'info', duration),
		warning: (message: string, duration?: number) => show(message, 'warning', duration),
		dismiss,
		clear,
	};
}
