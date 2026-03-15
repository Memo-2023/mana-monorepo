import AsyncStorage from '@react-native-async-storage/async-storage';

import { LogEntry } from '~/app/(tabs)/logs';

// Konstanten
const LOG_STORAGE_KEY = 'app_logs';
const MAX_LOGS = 500; // Maximale Anzahl an Logs die gespeichert werden

// Generiert eine eindeutige ID
const generateId = (): string => {
	return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};

// Logs aus dem AsyncStorage laden
export const getStoredLogs = async (): Promise<LogEntry[]> => {
	try {
		const logsJson = await AsyncStorage.getItem(LOG_STORAGE_KEY);
		return logsJson ? JSON.parse(logsJson) : [];
	} catch (error) {
		console.error('Fehler beim Laden der Logs:', error);
		return [];
	}
};

// Logs im AsyncStorage speichern
const saveLogs = async (logs: LogEntry[]): Promise<void> => {
	try {
		// Begrenze die Anzahl der Logs auf MAX_LOGS (die neuesten behalten)
		const limitedLogs = logs.length > MAX_LOGS ? logs.slice(logs.length - MAX_LOGS) : logs;

		await AsyncStorage.setItem(LOG_STORAGE_KEY, JSON.stringify(limitedLogs));
	} catch (error) {
		console.error('Fehler beim Speichern der Logs:', error);
	}
};

// Log-Eintrag erstellen
export const createLog = async (
	level: 'info' | 'warning' | 'error',
	message: string,
	details?: any
): Promise<void> => {
	try {
		// Aktuellen Zeitstempel erstellen
		const timestamp = Date.now();

		// Log-Eintrag erstellen
		const logEntry: LogEntry = {
			id: generateId(),
			timestamp,
			level,
			message,
			details,
		};

		// Aktuelle Logs laden
		const currentLogs = await getStoredLogs();

		// Neuen Log hinzufügen
		const updatedLogs = [...currentLogs, logEntry];

		// Aktualisierte Logs speichern
		await saveLogs(updatedLogs);

		// Bei Fehlern auch in der Konsole ausgeben
		if (level === 'error') {
			console.error(message, details);
		} else if (level === 'warning') {
			console.warn(message, details);
		} else {
			console.log(message, details);
		}
	} catch (error) {
		console.error('Fehler beim Erstellen des Log-Eintrags:', error);
	}
};

// Hilfsfunktionen für einfacheren Zugriff
export const logInfo = (message: string, details?: any) => createLog('info', message, details);
export const logWarning = (message: string, details?: any) =>
	createLog('warning', message, details);
export const logError = (message: string, details?: any) => createLog('error', message, details);

// Alle Logs löschen
export const clearLogs = async (): Promise<void> => {
	try {
		await AsyncStorage.removeItem(LOG_STORAGE_KEY);
	} catch (error) {
		console.error('Fehler beim Löschen der Logs:', error);
	}
};
