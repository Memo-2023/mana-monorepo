import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import type { MatrixClient } from 'matrix-js-sdk';

// Show notifications even when app is in foreground
Notifications.setNotificationHandler({
	handleNotification: async () => ({
		shouldShowAlert: true,
		shouldPlaySound: true,
		shouldSetBadge: true,
		shouldShowBanner: true,
		shouldShowList: true,
	}),
});

export async function requestNotificationPermissions(): Promise<boolean> {
	const { status: existing } = await Notifications.getPermissionsAsync();
	if (existing === 'granted') return true;
	const { status } = await Notifications.requestPermissionsAsync();
	return status === 'granted';
}

/**
 * Get the Expo push token for this device.
 * projectId from app.json extra.eas.projectId.
 */
export async function getExpoPushToken(projectId?: string): Promise<string | null> {
	try {
		const token = await Notifications.getExpoPushTokenAsync(
			projectId ? { projectId } : undefined,
		);
		return token.data;
	} catch {
		return null;
	}
}

/**
 * Register a Matrix HTTP pusher pointing to the Expo push proxy.
 * This requires a compatible Matrix push gateway (e.g. a custom proxy or sygnal).
 * For development, this is optional — sync keeps the app connected.
 */
export async function registerMatrixPusher(
	client: MatrixClient,
	pushToken: string,
	appId: string,
	appDisplayName: string,
	deviceDisplayName: string,
	pushGatewayUrl: string,
): Promise<void> {
	await (client as any).setPusher({
		pushkey: pushToken,
		kind: 'http',
		app_id: appId,
		app_display_name: appDisplayName,
		device_display_name: deviceDisplayName,
		lang: 'en',
		data: {
			url: `${pushGatewayUrl}/_matrix/push/v1/notify`,
			format: 'event_id_only',
		},
	});
}

/**
 * Display a local notification for an incoming message.
 * Called from the Matrix sync event handler for messages
 * while the app is in the foreground.
 */
export async function showMessageNotification(
	senderName: string,
	roomName: string,
	body: string,
	roomId: string,
): Promise<void> {
	await Notifications.scheduleNotificationAsync({
		content: {
			title: `${senderName} in ${roomName}`,
			body,
			data: { roomId },
			sound: true,
		},
		trigger: null, // fire immediately
	});
}

/**
 * Set the app badge count.
 */
export async function setBadgeCount(count: number): Promise<void> {
	await Notifications.setBadgeCountAsync(count);
}

/**
 * Listen for notification taps and navigate to the room.
 * Returns a cleanup function.
 */
export function setupNotificationNavigation(): () => void {
	const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
		const roomId = response.notification.request.content.data?.roomId as string | undefined;
		if (roomId) {
			router.push(`/room/${roomId}`);
		}
	});

	return () => subscription.remove();
}
