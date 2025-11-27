import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Wrapper für AsyncStorage mit Fehlerbehandlung und Typisierung
 */
export const safeStorage = {
	/**
	 * Speichert einen Wert im AsyncStorage
	 * @param key Schlüssel unter dem der Wert gespeichert wird
	 * @param value Wert der gespeichert werden soll (wird automatisch zu JSON konvertiert)
	 */
	setItem: async <T>(key: string, value: T): Promise<void> => {
		try {
			// Skip saving if value is undefined
			if (value === undefined) {
				console.warn(`Attempted to save undefined value for key: ${key}. Skipping.`);
				return;
			}
			const jsonValue = JSON.stringify(value);
			await AsyncStorage.setItem(key, jsonValue);
		} catch (e) {
			console.error('Error saving data', e);
		}
	},

	/**
	 * Holt einen Wert aus dem AsyncStorage
	 * @param key Schlüssel des zu holenden Werts
	 * @returns Der gespeicherte Wert oder null wenn nicht vorhanden
	 */
	getItem: async <T>(key: string): Promise<T | null> => {
		try {
			const jsonValue = await AsyncStorage.getItem(key);
			return jsonValue != null ? JSON.parse(jsonValue) : null;
		} catch (e) {
			console.error('Error reading data', e);
			return null;
		}
	},

	/**
	 * Entfernt einen Wert aus dem AsyncStorage
	 * @param key Schlüssel des zu entfernenden Werts
	 */
	removeItem: async (key: string): Promise<void> => {
		try {
			await AsyncStorage.removeItem(key);
		} catch (e) {
			console.error('Error removing data', e);
		}
	},

	/**
	 * Löscht alle Werte aus dem AsyncStorage
	 */
	clear: async (): Promise<void> => {
		try {
			await AsyncStorage.clear();
		} catch (e) {
			console.error('Error clearing data', e);
		}
	},
};
