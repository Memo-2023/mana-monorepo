import { browser } from '$app/environment';

/**
 * Browser Notification Service for Matrix Chat
 */

// Notification settings stored in localStorage
const SETTINGS_KEY = 'matrix_notification_settings';

interface NotificationSettings {
	enabled: boolean;
	sound: boolean;
	showPreview: boolean;
}

const defaultSettings: NotificationSettings = {
	enabled: true,
	sound: true,
	showPreview: true,
};

/**
 * Get notification settings from localStorage
 */
export function getNotificationSettings(): NotificationSettings {
	if (!browser) return defaultSettings;

	try {
		const stored = localStorage.getItem(SETTINGS_KEY);
		if (stored) {
			return { ...defaultSettings, ...JSON.parse(stored) };
		}
	} catch (e) {
		console.warn('Failed to parse notification settings:', e);
	}
	return defaultSettings;
}

/**
 * Save notification settings to localStorage
 */
export function saveNotificationSettings(settings: Partial<NotificationSettings>): void {
	if (!browser) return;

	const current = getNotificationSettings();
	const updated = { ...current, ...settings };
	localStorage.setItem(SETTINGS_KEY, JSON.stringify(updated));
}

/**
 * Check if browser notifications are supported
 */
export function isNotificationSupported(): boolean {
	return browser && 'Notification' in window;
}

/**
 * Get current notification permission status
 */
export function getNotificationPermission(): NotificationPermission | 'unsupported' {
	if (!isNotificationSupported()) return 'unsupported';
	return Notification.permission;
}

/**
 * Request notification permission
 */
export async function requestNotificationPermission(): Promise<NotificationPermission | 'unsupported'> {
	if (!isNotificationSupported()) return 'unsupported';

	try {
		const permission = await Notification.requestPermission();
		return permission;
	} catch (e) {
		console.error('Failed to request notification permission:', e);
		return 'denied';
	}
}

/**
 * Check if notifications are enabled and permitted
 */
export function canShowNotifications(): boolean {
	if (!isNotificationSupported()) return false;
	if (Notification.permission !== 'granted') return false;

	const settings = getNotificationSettings();
	return settings.enabled;
}

/**
 * Check if the document is currently focused
 */
export function isDocumentFocused(): boolean {
	if (!browser) return true;
	return document.hasFocus();
}

/**
 * Show a browser notification for a new message
 */
export function showMessageNotification(
	senderName: string,
	messageBody: string,
	roomName: string,
	options?: {
		onClick?: () => void;
		icon?: string;
	}
): void {
	if (!canShowNotifications()) return;
	if (isDocumentFocused()) return;

	const settings = getNotificationSettings();

	const title = roomName ? `${senderName} in ${roomName}` : senderName;
	const body = settings.showPreview ? messageBody : 'Neue Nachricht';

	try {
		const notification = new Notification(title, {
			body: body.slice(0, 200), // Limit body length
			icon: options?.icon || '/favicon.png',
			tag: 'matrix-message', // Group notifications
			silent: !settings.sound,
		} as NotificationOptions);

		notification.onclick = () => {
			window.focus();
			notification.close();
			options?.onClick?.();
		};

		// Auto-close after 5 seconds
		setTimeout(() => {
			notification.close();
		}, 5000);
	} catch (e) {
		console.error('Failed to show notification:', e);
	}
}

/**
 * Play notification sound
 */
export function playNotificationSound(): void {
	if (!browser) return;

	const settings = getNotificationSettings();
	if (!settings.sound) return;

	try {
		// Create a simple beep using Web Audio API
		const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
		const oscillator = audioContext.createOscillator();
		const gainNode = audioContext.createGain();

		oscillator.connect(gainNode);
		gainNode.connect(audioContext.destination);

		oscillator.frequency.value = 800;
		oscillator.type = 'sine';

		gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
		gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);

		oscillator.start(audioContext.currentTime);
		oscillator.stop(audioContext.currentTime + 0.3);
	} catch (e) {
		// Ignore audio errors (common when user hasn't interacted yet)
	}
}
