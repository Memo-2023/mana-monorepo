export type ToastType = 'success' | 'error' | 'warning' | 'info' | 'loading';
export type ToastPosition = 'top' | 'bottom';

export interface ToastFeature {
	icon: string;
	title: string;
	description: string;
}

export interface Toast {
	id: string;
	type: ToastType;
	title: string;
	message?: string;
	features?: ToastFeature[]; // Array of feature sections
	duration?: number; // in milliseconds, 0 = persistent
	position?: ToastPosition; // Default: 'top'
	action?: {
		label: string;
		onPress: () => void;
	};
	onDismiss?: () => void;
	bypassRateLimit?: boolean; // Option to bypass rate limiting for critical toasts
	metadata?: {
		manaCount?: number;
		progress?: number; // 0-100 for loading states
		[key: string]: any;
	};
}

export interface ToastState {
	toasts: Toast[];
	addToast: (toast: Omit<Toast, 'id'>) => string;
	removeToast: (id: string) => void;
	updateToast: (id: string, updates: Partial<Omit<Toast, 'id'>>) => void;
	clearAll: () => void;
}

export interface ToastContextType {
	showToast: (toast: Omit<Toast, 'id'>) => string;
	hideToast: (id: string) => void;
	updateToast: (id: string, updates: Partial<Omit<Toast, 'id'>>) => void;
	showSuccess: (title: string, message?: string, duration?: number) => string;
	showError: (title: string, message?: string, duration?: number) => string;
	showWarning: (title: string, message?: string, duration?: number) => string;
	showInfo: (title: string, message?: string, duration?: number) => string;
	showLoading: (title: string, message?: string) => string;
}
