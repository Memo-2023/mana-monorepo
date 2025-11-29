import { Platform } from 'react-native';
import { safeStorage } from './safeStorage';
import { DeviceInfo } from '../types';

const DEVICE_ID_KEY = '@mana/deviceId';

/**
 * Device manager for multi-device support
 */
export const DeviceManager = {
	/**
	 * Get or create device information
	 */
	async getDeviceInfo(): Promise<DeviceInfo> {
		let deviceId = await safeStorage.getItem<string>(DEVICE_ID_KEY);

		if (!deviceId) {
			// Generate new device ID
			deviceId = `device_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
			await safeStorage.setItem(DEVICE_ID_KEY, deviceId);
		}

		const deviceName = Platform.select({
			ios: 'iOS Device',
			android: 'Android Device',
			web: 'Web Browser',
			default: 'Unknown Device',
		});

		const deviceType: 'web' | 'ios' | 'android' = Platform.select({
			ios: 'ios',
			android: 'android',
			web: 'web',
			default: 'web',
		});

		const userAgent = Platform.select({
			web: typeof navigator !== 'undefined' ? navigator.userAgent : 'Unknown',
			default: `ManaAuth/1.0 (${Platform.OS}; ${Platform.Version || 'Unknown'})`,
		});

		return {
			deviceId,
			deviceName,
			deviceType,
			userAgent,
		};
	},

	/**
	 * Get stored device ID
	 */
	async getStoredDeviceId(): Promise<string | null> {
		return await safeStorage.getItem<string>(DEVICE_ID_KEY);
	},

	/**
	 * Clear device ID (for testing)
	 */
	async clearDeviceId(): Promise<void> {
		await safeStorage.removeItem(DEVICE_ID_KEY);
	},
};
