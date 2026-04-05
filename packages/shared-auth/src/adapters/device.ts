import type { DeviceManagerAdapter, DeviceInfo } from '../types';

let deviceAdapter: DeviceManagerAdapter | null = null;

/**
 * Generate a UUID with fallback for non-secure contexts (HTTP)
 * crypto.randomUUID() requires HTTPS, so we fall back to crypto.getRandomValues()
 */
function generateUUID(): string {
	// Try native randomUUID first (requires secure context)
	if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
		try {
			return crypto.randomUUID();
		} catch {
			// Falls through to fallback
		}
	}

	// Fallback: use crypto.getRandomValues() which works in insecure contexts
	if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
		const bytes = new Uint8Array(16);
		crypto.getRandomValues(bytes);

		// Set version (4) and variant (RFC 4122)
		bytes[6] = (bytes[6] & 0x0f) | 0x40;
		bytes[8] = (bytes[8] & 0x3f) | 0x80;

		// Convert to hex string with dashes
		const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
		return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
	}

	// Last resort: Math.random() based UUID (not cryptographically secure, but works)
	return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
		const r = (Math.random() * 16) | 0;
		const v = c === 'x' ? r : (r & 0x3) | 0x8;
		return v.toString(16);
	});
}

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
		const storageKey = '@mana/deviceId';
		let deviceId = localStorage.getItem(storageKey);
		if (!deviceId) {
			deviceId = generateUUID();
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
			return localStorage.getItem('@mana/deviceId');
		},
	};
}
