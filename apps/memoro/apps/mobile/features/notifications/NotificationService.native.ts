import notifee, { AndroidImportance, AuthorizationStatus } from '@notifee/react-native';
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
		const settings = await notifee.requestPermission();
		return settings.authorizationStatus === AuthorizationStatus.AUTHORIZED;
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

			const channelId = await notifee.createChannel({
				id: channelType,
				name: channelType,
				importance: asForegroundService ? AndroidImportance.HIGH : AndroidImportance.DEFAULT,
			});

			await notifee.displayNotification({
				title,
				body,
				android: {
					channelId,
					importance: asForegroundService ? AndroidImportance.HIGH : AndroidImportance.DEFAULT,
					ongoing: asForegroundService,
					asForegroundService,
					pressAction: {
						id: 'default',
					},
				},
				ios: {
					// iOS specific options
					foregroundPresentationOptions: {
						badge: true,
						sound: true,
						banner: true,
						list: true,
					},
				},
			});
		} catch (error) {
			console.error('Fehler beim Anzeigen der Benachrichtigung:', error);
		}
	}

	public async stopForegroundService(): Promise<void> {
		try {
			await notifee.stopForegroundService();
		} catch (error) {
			console.error('Fehler beim Stoppen des Foreground-Services:', error);
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
					const channelId = await notifee.createChannel({
						id: instanceId,
						name: 'Default Channel',
						importance: AndroidImportance.DEFAULT,
					});

					await notifee.displayNotification({
						id: instanceId,
						title,
						body: message,
						android: {
							channelId,
							importance: AndroidImportance.DEFAULT,
							ongoing: requireInteraction,
							pressAction: {
								id: 'default',
							},
						},
						ios: {
							// iOS specific options
							foregroundPresentationOptions: {
								badge: !silent,
								sound: !silent,
								banner: true,
								list: true,
							},
						},
					});

					instance.lastUpdateTime = now;
				}
			} catch (error) {
				console.error('Fehler beim Aktualisieren der Benachrichtigung:', error);
			}
		};

		const finish = async (title: string, message: string): Promise<void> => {
			NotificationService.notificationInstances.delete(instanceId);
			await notifee.cancelNotification(instanceId);
			const channelId = await notifee.createChannel({
				id: 'default',
				name: 'Default Channel',
				importance: AndroidImportance.DEFAULT,
			});
			await notifee.displayNotification({
				title,
				body: message,
				android: {
					channelId,
					importance: AndroidImportance.DEFAULT,
				},
				ios: {
					foregroundPresentationOptions: {
						badge: true,
						sound: true,
						banner: true,
						list: true,
					},
				},
			});
		};

		const error = async (title: string, message: string): Promise<void> => {
			NotificationService.notificationInstances.delete(instanceId);
			await notifee.cancelNotification(instanceId);
			const channelId = await notifee.createChannel({
				id: 'default',
				name: 'Default Channel',
				importance: AndroidImportance.HIGH,
			});
			await notifee.displayNotification({
				title,
				body: message,
				android: {
					channelId,
					importance: AndroidImportance.HIGH,
				},
				ios: {
					foregroundPresentationOptions: {
						badge: true,
						sound: true,
						banner: true,
						list: true,
					},
				},
			});
		};

		return {
			update,
			finish,
			error,
		};
	}
}

// Standard-Export der Instanz
export default new NotificationService();

// Benannter Export der statischen Methode
export const { requestNotificationPermission } = NotificationService;
