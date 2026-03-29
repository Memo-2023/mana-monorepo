import { toast } from 'svelte-sonner';
import * as m from '$paraglide/messages';

/**
 * Toast notification service wrapper for consistent messaging
 */
export const notify = {
	/**
	 * Success Messages
	 */
	success: (message: string, description?: string) => {
		if (description) {
			toast.success(message, { description });
		} else {
			toast.success(message);
		}
	},

	/**
	 * Error Messages with optional details
	 */
	error: (message: string, details?: string) => {
		if (details) {
			toast.error(message, {
				description: details,
			});
		} else {
			toast.error(message);
		}
	},

	/**
	 * Info Messages
	 */
	info: (message: string, description?: string) => {
		if (description) {
			toast.info(message, { description });
		} else {
			toast.info(message);
		}
	},

	/**
	 * Warning Messages
	 */
	warning: (message: string, description?: string) => {
		if (description) {
			toast.warning(message, { description });
		} else {
			toast.warning(message);
		}
	},

	/**
	 * Loading Message (returns toast ID for updating)
	 */
	loading: (message: string) => {
		return toast.loading(message);
	},

	/**
	 * Update existing toast
	 */
	update: (
		id: string | number,
		options: { message?: string; type?: 'success' | 'error' | 'info' | 'warning' }
	) => {
		if (options.type === 'success') {
			toast.success(options.message || 'Erfolg', { id });
		} else if (options.type === 'error') {
			toast.error(options.message || 'Fehler', { id });
		} else if (options.type === 'info') {
			toast.info(options.message || 'Info', { id });
		} else if (options.type === 'warning') {
			toast.warning(options.message || 'Warnung', { id });
		} else {
			toast(options.message || 'Update', { id });
		}
	},

	/**
	 * Promise-based notifications for async operations
	 */
	promise: async <T>(
		promise: Promise<T>,
		messages: {
			loading: string;
			success: string | ((data: T) => string);
			error: string | ((error: any) => string);
		}
	): Promise<T> => {
		toast.promise(promise, messages);
		return promise;
	},

	/**
	 * Custom toast with action button
	 */
	action: (message: string, actionLabel: string, onAction: () => void | Promise<void>) => {
		toast(message, {
			action: {
				label: actionLabel,
				onClick: onAction,
			},
		});
	},

	/**
	 * Dismiss specific toast or all toasts
	 */
	dismiss: (id?: string | number) => {
		if (id) {
			toast.dismiss(id);
		} else {
			toast.dismiss();
		}
	},
};

// Convenience exports for common messages
export const toastMessages = {
	// Authentication
	loginSuccess: () => notify.success(m.toast_login_success()),
	loginError: (error?: string) => notify.error(m.toast_login_error(), error),
	logoutSuccess: () => notify.info(m.toast_logout_success()),
	registerSuccess: () => notify.success(m.toast_register_success()),
	emailVerified: () => notify.success(m.toast_email_verified()),
	passwordResetSent: () => notify.info(m.toast_password_reset_sent()),
	passwordChanged: () => notify.success(m.toast_password_changed()),

	// User actions
	profileUpdated: () => notify.success(m.toast_profile_updated()),
	avatarUploaded: () => notify.success(m.toast_avatar_uploaded()),
	usernameSet: (username: string) =>
		notify.success(`Username "${username}" erfolgreich gesetzt! 🎉`),

	// Link management
	linkCreated: () => notify.success(m.toast_link_created()),
	linkCopied: () => notify.success(m.toast_link_copied()),
	linkDeleted: (onUndo?: () => void) => {
		if (onUndo) {
			notify.action('Link gelöscht', 'Rückgängig', onUndo);
		} else {
			notify.info(m.toast_link_deleted());
		}
	},
	linkUpdated: () => notify.success(m.toast_link_updated()),

	// Subscription
	subscriptionUpgraded: () => notify.success(m.toast_subscription_upgraded()),
	subscriptionCancelled: () => notify.info(m.toast_subscription_cancelled()),
	paymentFailed: () => notify.error(m.toast_payment_failed(), m.toast_payment_failed_desc()),

	// Errors
	genericError: (message?: string) => notify.error(message || 'Ein Fehler ist aufgetreten'),
	networkError: () => notify.error(m.toast_network_error(), m.toast_network_error_desc()),
	permissionDenied: () => notify.error(m.toast_permission_denied()),
	sessionExpired: () => notify.warning(m.toast_session_expired(), m.toast_session_expired_desc()),

	// Validation
	invalidInput: (field: string) => notify.error(`Ungültige Eingabe: ${field}`),
	requiredField: (field: string) => notify.error(`Pflichtfeld: ${field}`),

	// File operations
	fileTooBig: (maxSize: string) => notify.error(`Datei zu groß`, `Maximale Größe: ${maxSize}`),
	unsupportedFormat: () => notify.error(m.toast_unsupported_format()),

	// Loading states
	saving: () => notify.loading('Wird gespeichert...'),
	loading: () => notify.loading('Wird geladen...'),
	uploading: () => notify.loading('Wird hochgeladen...'),
	processing: () => notify.loading('Wird verarbeitet...'),
};
