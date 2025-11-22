import type { DeviceInfo } from '$lib/types/auth';

const DEVICE_ID_KEY = 'manadeck_device_id';

/**
 * Generate a unique device ID for web
 */
function generateDeviceId(): string {
	return `web_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
}

/**
 * Get or create device ID
 */
export function getDeviceId(): string {
	if (typeof window === 'undefined') return '';

	let deviceId = localStorage.getItem(DEVICE_ID_KEY);
	if (!deviceId) {
		deviceId = generateDeviceId();
		localStorage.setItem(DEVICE_ID_KEY, deviceId);
	}
	return deviceId;
}

/**
 * Get device info for authentication
 */
export function getDeviceInfo(): DeviceInfo {
	const deviceId = getDeviceId();
	const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : '';

	// Simple device name based on user agent
	let deviceName = 'Web Browser';
	if (userAgent.includes('Mac')) deviceName = 'Mac';
	else if (userAgent.includes('Windows')) deviceName = 'Windows';
	else if (userAgent.includes('Linux')) deviceName = 'Linux';

	return {
		deviceId,
		deviceName,
		deviceType: 'web',
		userAgent
	};
}
