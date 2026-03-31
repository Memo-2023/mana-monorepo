import NotificationService, { requestNotificationPermission } from './NotificationService';
import { NotificationChannel, NotificationOptions, UpdateableNotification } from './types';

const useNotification = () => {
	const showNotification = async (options: NotificationOptions): Promise<void> => {
		const {
			title,
			body,
			channelType = NotificationChannel.DEFAULT,
			asForegroundService = false,
		} = options;
		return NotificationService.showNotification(title, body, channelType, asForegroundService);
	};

	const createUpdateableNotification = (instanceId: string): UpdateableNotification => {
		return NotificationService.createUpdateableNotification(instanceId);
	};

	const stopForegroundService = async (): Promise<void> => {
		return NotificationService.stopForegroundService();
	};

	return {
		showNotification,
		createUpdateableNotification,
		stopForegroundService,
		requestNotificationPermission,
	};
};

export default useNotification;
