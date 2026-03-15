import { Platform } from 'react-native';

import { registerIOSBackgroundTasks } from './backgroundLocationTask';

// Diese Funktion wird beim Start der App aufgerufen
export const registerBackgroundTasks = async (): Promise<void> => {
	if (Platform.OS !== 'ios') return;

	try {
		// Rufe die Funktion zum Registrieren der iOS-Hintergrundaufgaben auf
		await registerIOSBackgroundTasks();
		console.log('Hintergrundaufgaben erfolgreich initialisiert');
	} catch (error) {
		console.error('Fehler beim Registrieren der Hintergrundaufgaben:', error);
	}
};
