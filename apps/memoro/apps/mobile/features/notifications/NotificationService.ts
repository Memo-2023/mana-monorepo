import iconPath from '~/assets/icon.png';
import {
	NotificationChannel,
	UpdateableNotification,
	UpdateableNotificationOptions,
} from './types';

interface NotificationInstance {
	lastUpdateTime: number;
}

class NotificationService {
	private static notificationInstances = new Map<string, NotificationInstance>();

	public static async requestNotificationPermission(): Promise<boolean> {
		if (!('Notification' in window)) {
			console.log('Dieser Browser unterstützt keine Benachrichtigungen');
			return false;
		}

		if (Notification.permission === 'granted') {
			return true;
		}

		if (Notification.permission !== 'denied') {
			const permission = await Notification.requestPermission();
			return permission === 'granted';
		}

		return false;
	}

	public async showNotification(
		title: string,
		body: string,
		channelType: NotificationChannel = NotificationChannel.DEFAULT,
		asForegroundService = false
	): Promise<void> {
		try {
			const hasPermission = await NotificationService.requestNotificationPermission();
			if (!hasPermission) return;

			new Notification(title, {
				body,
				icon: iconPath,
				tag: channelType,
				requireInteraction: asForegroundService,
				silent: false,
			});
		} catch (error) {
			console.error('Fehler beim Anzeigen der Benachrichtigung:', error);
		}
	}

	public createUpdateableNotification(instanceId: string): UpdateableNotification {
		if (!NotificationService.notificationInstances.has(instanceId)) {
			NotificationService.notificationInstances.set(instanceId, {
				lastUpdateTime: 0,
			});
		}

		const update = async (
			title: string,
			message: string,
			options: UpdateableNotificationOptions = {}
		): Promise<void> => {
			const { minUpdateInterval = 1000, requireInteraction = true, silent = true } = options;

			try {
				const hasPermission = await NotificationService.requestNotificationPermission();
				if (!hasPermission) return;

				const instance = NotificationService.notificationInstances.get(instanceId)!;
				const now = Date.now();

				if (now - instance.lastUpdateTime >= minUpdateInterval) {
					// Existierende Notification mit gleicher ID schließen
					if ('serviceWorker' in navigator) {
						const registration = await navigator.serviceWorker.ready;
						const existingNotifications = await registration.getNotifications({ tag: instanceId });
						existingNotifications.forEach((notification) => notification.close());
					}

					// Neue Notification anzeigen

					new Notification(title, {
						body: message,
						icon: iconPath,
						tag: instanceId,
						requireInteraction,
						silent,
					});

					// Status aktualisieren
					instance.lastUpdateTime = now;
				}
			} catch (error) {
				console.error('Fehler beim Aktualisieren der Benachrichtigung:', error);
			}
		};

		const finish = async (title: string, message: string): Promise<void> => {
			NotificationService.notificationInstances.delete(instanceId);
			await this.showNotification(title, message, NotificationChannel.FUNCTIONAL, false);
		};

		const error = async (title: string, message: string): Promise<void> => {
			NotificationService.notificationInstances.delete(instanceId);
			await this.showNotification(title, message, NotificationChannel.FUNCTIONAL, false);
		};

		return {
			update,
			finish,
			error,
		};
	}

	public async stopForegroundService(): Promise<void> {
		// Keine Implementierung notwendig für Web
	}
}

// Standard-Export der Instanz
export default new NotificationService();

// Benannter Export der statischen Methode
export const { requestNotificationPermission } = NotificationService;
