/**
 * Browser Notification Service
 *
 * Centralized wrapper for the Browser Notification API.
 * Used by the reminder scheduler to fire local notifications.
 *
 * @example
 * ```typescript
 * import { notificationService } from '@mana/shared-stores';
 *
 * if (await notificationService.requestPermission()) {
 *   notificationService.send('Task fällig', { body: 'Einkaufen gehen' });
 * }
 * ```
 */

export interface NotificationOptions {
	/** Notification body text */
	body?: string;
	/** Icon URL */
	icon?: string;
	/** Tag for deduplication (same tag replaces previous notification) */
	tag?: string;
	/** Called when user clicks the notification */
	onClick?: () => void;
}

export const notificationService = {
	/** Check if browser supports Notification API */
	isSupported(): boolean {
		return typeof window !== 'undefined' && 'Notification' in window;
	},

	/** Check if permission is already granted */
	hasPermission(): boolean {
		if (!this.isSupported()) return false;
		return Notification.permission === 'granted';
	},

	/** Request notification permission. Returns true if granted. */
	async requestPermission(): Promise<boolean> {
		if (!this.isSupported()) return false;
		if (Notification.permission === 'granted') return true;
		if (Notification.permission === 'denied') return false;

		const result = await Notification.requestPermission();
		return result === 'granted';
	},

	/** Send a browser notification. No-op if permission not granted. */
	send(title: string, options?: NotificationOptions): void {
		if (!this.hasPermission()) return;

		const notification = new Notification(title, {
			body: options?.body,
			icon: options?.icon ?? '/favicon.png',
			tag: options?.tag,
		});

		if (options?.onClick) {
			notification.onclick = () => {
				window.focus();
				options.onClick!();
				notification.close();
			};
		}
	},
};
