import NetInfo from '@react-native-community/netinfo';

/**
 * Check if device is connected to network
 */
export const isDeviceConnected = async (): Promise<boolean> => {
	try {
		const state = await NetInfo.fetch();
		return state.isConnected === true;
	} catch (error) {
		console.warn('Error checking network connectivity:', error);
		return false;
	}
};

/**
 * Check if device has stable connection
 */
export const hasStableConnection = async (): Promise<boolean> => {
	try {
		const state = await NetInfo.fetch();
		return state.isConnected === true && state.isInternetReachable === true;
	} catch (error) {
		console.warn('Error checking stable connection:', error);
		return false;
	}
};
