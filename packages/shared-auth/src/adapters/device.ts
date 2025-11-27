import type { DeviceManagerAdapter, DeviceInfo } from '../types';

let deviceAdapter: DeviceManagerAdapter | null = null;

/**
 * Set the device manager adapter for the auth service
 */
export function setDeviceAdapter(adapter: DeviceManagerAdapter): void {
	deviceAdapter = adapter;
}

/**
 * Get the current device adapter
 */
export function getDeviceAdapter(): DeviceManagerAdapter {
	if (!deviceAdapter) {
		throw new Error(
			'Device adapter not initialized. Call setDeviceAdapter() before using auth services.'
		);
	}
	return deviceAdapter;
}

/**
 * Check if device adapter is initialized
 */
export function isDeviceInitialized(): boolean {
	return deviceAdapter !== null;
}

/**
 * Create a web-based device manager adapter
 */
export function createWebDeviceAdapter(): DeviceManagerAdapter {
	// Generate a persistent device ID for web
	const getOrCreateDeviceId = (): string => {
		const storageKey = '@manacore/deviceId';
		let deviceId = localStorage.getItem(storageKey);
		if (!deviceId) {
			deviceId = crypto.randomUUID();
			localStorage.setItem(storageKey, deviceId);
		}
		return deviceId;
	};

	return {
		async getDeviceInfo(): Promise<DeviceInfo> {
			const userAgent = navigator.userAgent;
			let deviceName = 'Web Browser';
			let deviceType = 'web';

			// Try to extract browser name
			if (userAgent.includes('Chrome')) {
				deviceName = 'Chrome Browser';
			} else if (userAgent.includes('Safari')) {
				deviceName = 'Safari Browser';
			} else if (userAgent.includes('Firefox')) {
				deviceName = 'Firefox Browser';
			} else if (userAgent.includes('Edge')) {
				deviceName = 'Edge Browser';
			}

			// Detect device type
			if (/Mobi|Android/i.test(userAgent)) {
				deviceType = 'mobile_web';
			} else if (/Tablet|iPad/i.test(userAgent)) {
				deviceType = 'tablet_web';
			}

			return {
				deviceId: getOrCreateDeviceId(),
				deviceName,
				deviceType,
				platform: 'web',
			};
		},
		async getStoredDeviceId(): Promise<string | null> {
			return localStorage.getItem('@manacore/deviceId');
		},
	};
}
