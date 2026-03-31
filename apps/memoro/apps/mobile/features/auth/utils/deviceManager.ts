import * as Device from 'expo-device';
import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { DeviceInfo } from '../types/auth.types';

export class DeviceManager {
	private static DEVICE_ID_KEY = 'mana_device_id';

	static async getDeviceInfo(): Promise<DeviceInfo> {
		// Get or generate device ID
		let deviceId = await SecureStore.getItemAsync(this.DEVICE_ID_KEY);

		// Debug log for loaded device ID
		if (deviceId) {
			console.debug(`Loaded existing device ID: ${deviceId}`);
		}

		if (!deviceId) {
			// Generate a new UUID
			deviceId = await this.generateDeviceId();

			// Try to store it persistently with retry logic
			let stored = false;
			for (let attempt = 1; attempt <= 3; attempt++) {
				try {
					await SecureStore.setItemAsync(this.DEVICE_ID_KEY, deviceId);

					// Verify it was actually stored
					const verifiedId = await SecureStore.getItemAsync(this.DEVICE_ID_KEY);
					if (verifiedId === deviceId) {
						console.debug(`Device ID stored successfully on attempt ${attempt}`);
						stored = true;
						break;
					} else {
						console.warn(`Device ID verification failed on attempt ${attempt}`);
					}
				} catch (error) {
					console.error(`Failed to store device ID on attempt ${attempt}:`, error);
				}
			}

			if (!stored) {
				console.error('Failed to persist device ID after 3 attempts - using session-only ID');
				// The ID will work for this session but may change on app restart
			} else {
				console.debug('New device ID created and stored successfully');
			}
		}

		// Always validate we have a device ID
		if (!deviceId) {
			throw new Error('Unable to generate device identifier');
		}

		// Get device name
		const deviceName = await this.getDeviceName();

		const deviceInfo = {
			deviceId,
			deviceName,
			deviceType: Platform.OS as 'ios' | 'android',
			userAgent: this.getUserAgent(),
		};

		console.debug('Device info:', {
			deviceId: deviceId.substring(0, 8) + '...',
			deviceName,
			deviceType: deviceInfo.deviceType,
		});

		return deviceInfo;
	}

	private static async getDeviceName(): Promise<string> {
		if (Device.deviceName) {
			return Device.deviceName;
		}

		// Fallback device names
		const deviceModel = Device.modelName || 'Unknown';
		const osName = Device.osName || Platform.OS;
		return `${deviceModel} (${osName})`;
	}

	private static getUserAgent(): string {
		// For Expo SDK 51+, use expoConfig instead of manifest
		const appName = Constants.expoConfig?.name || Constants.manifest?.name || 'Memoro';
		const appVersion = Constants.expoConfig?.version || Constants.manifest?.version || '1.0.0';
		const osName = Device.osName || Platform.OS;
		const osVersion = Device.osVersion || 'Unknown';
		const modelName = Device.modelName || 'Unknown Device';

		return `${appName}/${appVersion} (${osName} ${osVersion}; ${modelName})`;
	}

	private static async generateDeviceId(): Promise<string> {
		// Always generate a stable UUID instead of using unreliable platform-specific IDs
		// Constants.deviceId is deprecated and can change between app launches/installs
		return this.generateUUID();
	}

	private static generateUUID(): string {
		return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
			const r = (Math.random() * 16) | 0;
			const v = c === 'x' ? r : (r & 0x3) | 0x8;
			return v.toString(16);
		});
	}

	static async clearDeviceId(): Promise<void> {
		await SecureStore.deleteItemAsync(this.DEVICE_ID_KEY);
	}

	static async getStoredDeviceId(): Promise<string | null> {
		try {
			return await SecureStore.getItemAsync(this.DEVICE_ID_KEY);
		} catch (error) {
			console.error('Error retrieving stored device ID:', error);
			return null;
		}
	}
}
