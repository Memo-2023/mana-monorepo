import type { NetworkAdapter } from '../types';

let networkAdapter: NetworkAdapter | null = null;

/**
 * Set the network adapter for the auth service
 */
export function setNetworkAdapter(adapter: NetworkAdapter): void {
	networkAdapter = adapter;
}

/**
 * Get the current network adapter
 */
export function getNetworkAdapter(): NetworkAdapter | null {
	return networkAdapter;
}

/**
 * Check if device is connected to the network
 */
export async function isDeviceConnected(): Promise<boolean> {
	if (!networkAdapter) {
		// Default to true if no adapter is set
		return true;
	}
	return networkAdapter.isDeviceConnected();
}

/**
 * Check if device has a stable connection
 */
export async function hasStableConnection(): Promise<boolean> {
	if (!networkAdapter || !networkAdapter.hasStableConnection) {
		// Default to basic connectivity check
		return isDeviceConnected();
	}
	return networkAdapter.hasStableConnection();
}

/**
 * Create a web-based network adapter
 */
export function createWebNetworkAdapter(): NetworkAdapter {
	return {
		async isDeviceConnected(): Promise<boolean> {
			return navigator.onLine;
		},
		async hasStableConnection(): Promise<boolean> {
			// For web, we just check online status
			// More sophisticated checks could be added
			return navigator.onLine;
		},
	};
}
