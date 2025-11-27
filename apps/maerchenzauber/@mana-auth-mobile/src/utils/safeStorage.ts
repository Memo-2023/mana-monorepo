import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Safe storage wrapper with type safety and error handling
 */
export const safeStorage = {
	/**
	 * Set an item in storage
	 */
	async setItem<T>(key: string, value: T): Promise<void> {
		try {
			const stringValue = JSON.stringify(value);
			await AsyncStorage.setItem(key, stringValue);
		} catch (error) {
			console.error(`[SafeStorage] Error setting item ${key}:`, error);
			throw error;
		}
	},

	/**
	 * Get an item from storage
	 */
	async getItem<T>(key: string): Promise<T | null> {
		try {
			const value = await AsyncStorage.getItem(key);
			if (value === null || value === undefined) {
				return null;
			}
			return JSON.parse(value) as T;
		} catch (error) {
			console.error(`[SafeStorage] Error getting item ${key}:`, error);
			return null;
		}
	},

	/**
	 * Remove an item from storage
	 */
	async removeItem(key: string): Promise<void> {
		try {
			await AsyncStorage.removeItem(key);
		} catch (error) {
			console.error(`[SafeStorage] Error removing item ${key}:`, error);
			throw error;
		}
	},

	/**
	 * Clear all items from storage
	 */
	async clear(): Promise<void> {
		try {
			await AsyncStorage.clear();
		} catch (error) {
			console.error('[SafeStorage] Error clearing storage:', error);
			throw error;
		}
	},
};
