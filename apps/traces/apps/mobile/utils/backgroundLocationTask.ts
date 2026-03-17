import * as Location from 'expo-location';
import { Platform } from 'react-native';

import { LocationData } from './locationService';
import { logInfo, logWarning, logError } from './logService';

// Konstante für den AsyncStorage-Key für die Adressspeicherung
const SAVE_ADDRESS_KEY = 'save_address_enabled';

// Definiere Task-Namen
export const BACKGROUND_LOCATION_TASK = 'background-location-task';
export const LOCATION_UPDATE_TASK = 'com.mana.traces.locationupdatetask';
export const LOCATION_PROCESSING_TASK = 'com.mana.traces.locationprocessingtask';

// Helper function to generate UUID
const generateUUID = (): string => {
	return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
		const r = (Math.random() * 16) | 0;
		const v = c === 'x' ? r : (r & 0x3) | 0x8;
		return v.toString(16);
	});
};

// Helper function to detect connection type
const getConnectionType = async (): Promise<'wifi' | 'cellular' | 'none'> => {
	return 'cellular'; // Default assumption for background
};

// Helper function to get battery level
const getBatteryLevel = async (): Promise<number | undefined> => {
	return undefined; // Not available in background context
};

// Helper function to detect device motion based on speed
const getDeviceMotion = (speed?: number): 'stationary' | 'walking' | 'driving' | 'unknown' => {
	if (speed === undefined || speed === null) {
		return 'unknown';
	}

	// Convert m/s to km/h for easier understanding
	const kmh = speed * 3.6;

	if (kmh < 1) {
		return 'stationary'; // Less than 1 km/h
	} else if (kmh < 8) {
		return 'walking'; // 1-8 km/h (typical walking speed: 3-6 km/h)
	} else {
		return 'driving'; // Above 8 km/h (cycling, driving, etc.)
	}
};

// Module nur laden, wenn nicht im Web
let TaskManager: any;
let BackgroundFetch: any;
let BackgroundTaskScheduler: any;

if (Platform.OS !== 'web') {
	try {
		TaskManager = require('expo-task-manager');
		if (Platform.OS === 'ios') {
			try {
				BackgroundFetch = require('expo-background-fetch');
				BackgroundTaskScheduler = require('expo-background-task');
			} catch (e) {
				console.warn('iOS-spezifische Hintergrund-Module konnten nicht geladen werden:', e);
			}
		}
	} catch (e) {
		console.warn('expo-task-manager konnte nicht geladen werden:', e);
	}
}

// Prüfe, ob Adressspeicherung aktiviert ist
const isAddressSavingEnabled = async (): Promise<boolean> => {
	try {
		const AsyncStorage = require('@react-native-async-storage/async-storage').default;
		const savedValue = await AsyncStorage.getItem(SAVE_ADDRESS_KEY);
		// Wenn kein Wert gespeichert ist, verwende true als Standard (opt-in)
		return savedValue === null ? true : savedValue === 'true';
	} catch (error) {
		console.error('Fehler beim Laden der Adress-Einstellung:', error);
		return true; // Im Fehlerfall standardmäßig aktiviert
	}
};

// Funktion zur Adressermittlung
const getAddressFromCoordinates = async (latitude: number, longitude: number) => {
	// Prüfe zuerst, ob Adressspeicherung aktiviert ist
	const addressSavingEnabled = await isAddressSavingEnabled();
	if (!addressSavingEnabled) {
		return null;
	}

	try {
		const addressResponse = await Location.reverseGeocodeAsync({
			latitude,
			longitude,
		});

		if (addressResponse && addressResponse.length > 0) {
			const addressInfo = addressResponse[0];

			// Build formatted address
			const addressParts = [
				addressInfo.street && addressInfo.streetNumber
					? `${addressInfo.street} ${addressInfo.streetNumber}`
					: addressInfo.street,
				addressInfo.postalCode && addressInfo.city
					? `${addressInfo.postalCode} ${addressInfo.city}`
					: addressInfo.city,
				addressInfo.country,
			].filter(Boolean);

			return {
				formatted: addressParts.join(', '),
				components: {
					street: addressInfo.street || undefined,
					houseNumber: addressInfo.streetNumber || undefined,
					city: addressInfo.city || undefined,
					postalCode: addressInfo.postalCode || undefined,
					country: addressInfo.country || undefined,
					countryCode: addressInfo.isoCountryCode || undefined,
				},
				confidence: 0.9, // Default high confidence for expo-location
			};
		}
		return null;
	} catch (error) {
		console.error('Fehler bei der Adressermittlung:', error);
		return null;
	}
};

// Importiere die saveLocationToHistory-Funktion direkt aus der Datei
const saveLocationToHistory = async (location: LocationData): Promise<void> => {
	const AsyncStorage = require('@react-native-async-storage/async-storage').default;
	const LOCATION_HISTORY_KEY = 'location_history';

	try {
		// Adressinformationen hinzufügen, falls noch nicht vorhanden
		if (!location.address) {
			const address = await getAddressFromCoordinates(location.latitude, location.longitude);
			if (address) {
				location.address = address;
			}
		}

		// Get existing history
		const historyString = await AsyncStorage.getItem(LOCATION_HISTORY_KEY);
		const history: LocationData[] = historyString ? JSON.parse(historyString) : [];

		// Add new location
		history.push(location);

		// Save back to storage
		await AsyncStorage.setItem(LOCATION_HISTORY_KEY, JSON.stringify(history));
		console.log('Standort mit Adresse im Hintergrund gespeichert');
	} catch (error) {
		console.error('Error saving location to history:', error);
	}
};

// Registriere die Hintergrundaufgaben
if (TaskManager) {
	// 1. Standort-Tracking-Aufgabe
	TaskManager.defineTask(
		BACKGROUND_LOCATION_TASK,
		async ({ data, error }: { data: any; error: any }) => {
			if (error) {
				logError('Hintergrund-Standortverfolgung Fehler', error);
				return;
			}

			if (data) {
				// Extrahiere die Standortdaten
				const { locations } = data as { locations: Location.LocationObject[] };

				// Variable für den letzten gespeicherten Standort und Zeitpunkt
				const AsyncStorage = require('@react-native-async-storage/async-storage').default;
				const LAST_SAVED_LOCATION_KEY = 'last_saved_location_timestamp';
				const DEFAULT_INTERVAL_KEY = 'default_tracking_interval';
				const ACCURACY_LEVEL_KEY = 'location_accuracy_level';

				try {
					// Lade den konfigurierten Intervall
					const intervalString = await AsyncStorage.getItem(DEFAULT_INTERVAL_KEY);
					const configuredInterval = intervalString ? parseInt(intervalString, 10) : 5 * 60 * 1000; // Standard: 5 Minuten

					// Lade den Zeitpunkt des letzten gespeicherten Standorts
					const lastSavedString = await AsyncStorage.getItem(LAST_SAVED_LOCATION_KEY);
					const lastSavedTimestamp = lastSavedString ? parseInt(lastSavedString, 10) : 0;

					// WICHTIG: Kein Vordergrund-Check mehr! Beide Tasks können parallel laufen
					// Die Duplikat-Vermeidung erfolgt über den Zeitstempel-Check

					// Lade die Genauigkeitseinstellung (wird für die Logs verwendet)
					const accuracyLevel = (await AsyncStorage.getItem(ACCURACY_LEVEL_KEY)) || 'balanced';

					// Aktuelle Zeit
					const now = Date.now();

					// Prüfe, ob genug Zeit seit dem letzten Speichern vergangen ist
					// WICHTIG: 30 Sekunden Puffer um zu vermeiden, dass Vordergrund und Hintergrund
					// gleichzeitig speichern (race condition)
					const MINIMUM_SAVE_INTERVAL = 30 * 1000; // 30 Sekunden Puffer
					if (now - lastSavedTimestamp >= configuredInterval - MINIMUM_SAVE_INTERVAL) {
						// Verarbeite alle empfangenen Standorte
						for (const location of locations) {
							try {
								// Konvertiere in unser LocationData-Format
								const batteryLevel = await getBatteryLevel();
								const connectionType = await getConnectionType();

								const locationData: LocationData = {
									id: generateUUID(),
									latitude: location.coords.latitude,
									longitude: location.coords.longitude,
									timestamps: {
										recorded: new Date(location.timestamp).toISOString(),
										recordedMs: location.timestamp,
									},
									accuracy: location.coords.accuracy || undefined,
									altitude: location.coords.altitude || undefined,
									speed: location.coords.speed || undefined,
									metadata: {
										source: 'background',
										batteryLevel,
										connectionType,
										deviceMotion: getDeviceMotion(location.coords.speed ?? undefined),
									},
									quality: {
										accuracyLevel: accuracyLevel as any, // Will be typed properly after imports are fixed
										horizontalAccuracy: location.coords.accuracy || 0,
										verticalAccuracy: location.coords.altitudeAccuracy ?? undefined,
										isSignificantLocation: true,
									},
									// Legacy support
									timestamp: location.timestamp,
								};

								// Speichere den Standort im Verlauf
								await saveLocationToHistory(locationData);

								// Speichere den aktuellen Zeitpunkt als letzten gespeicherten Zeitpunkt
								await AsyncStorage.setItem(LAST_SAVED_LOCATION_KEY, now.toString());

								logInfo('Hintergrund-Standort gespeichert', {
									coords: { lat: locationData.latitude, lng: locationData.longitude },
									timestamp: new Date(locationData.timestamp || 0).toISOString(),
									intervall: configuredInterval,
									genauigkeit: accuracyLevel,
									gemesseneGenauigkeit: location.coords.accuracy
										? `${location.coords.accuracy.toFixed(1)}m`
										: 'unbekannt',
								});
							} catch (err) {
								logError('Fehler beim Speichern des Hintergrund-Standorts', err);
							}
						}
					} else {
						const nextUpdateIn = Math.round(
							(configuredInterval - (now - lastSavedTimestamp)) / 1000
						);
						logInfo('Hintergrund-Standort übersprungen (Intervall noch nicht erreicht)', {
							nextUpdateIn: nextUpdateIn + ' Sekunden',
							configuredInterval: configuredInterval / 1000 + ' Sekunden',
							lastSavedAgo: Math.round((now - lastSavedTimestamp) / 1000) + ' Sekunden',
							genauigkeit: accuracyLevel,
						});
					}
				} catch (err) {
					logError('Fehler bei der Intervallprüfung', err);
				}
			}
		}
	);

	// 2. iOS BGTask für Location Updates
	if (Platform.OS === 'ios' && BackgroundFetch && BackgroundTaskScheduler) {
		// Standort-Update-Aufgabe (fetch)
		TaskManager.defineTask(LOCATION_UPDATE_TASK, async () => {
			try {
				logInfo('Background fetch ausgeführt');

				// Lade den letzten gespeicherten Zeitpunkt und den konfigurierten Intervall
				const AsyncStorage = require('@react-native-async-storage/async-storage').default;
				const LAST_SAVED_LOCATION_KEY = 'last_saved_location_timestamp';
				const DEFAULT_INTERVAL_KEY = 'default_tracking_interval';

				// Lade den konfigurierten Intervall
				const intervalString = await AsyncStorage.getItem(DEFAULT_INTERVAL_KEY);
				const configuredInterval = intervalString ? parseInt(intervalString, 10) : 5 * 60 * 1000; // Standard: 5 Minuten

				// Lade den Zeitpunkt des letzten gespeicherten Standorts
				const lastSavedString = await AsyncStorage.getItem(LAST_SAVED_LOCATION_KEY);
				const lastSavedTimestamp = lastSavedString ? parseInt(lastSavedString, 10) : 0;

				// WICHTIG: Kein Vordergrund-Check mehr! Beide Tasks können parallel laufen
				// Die Duplikat-Vermeidung erfolgt über den Zeitstempel-Check

				// Aktuelle Zeit
				const now = Date.now();

				// Prüfe, ob genug Zeit seit dem letzten Speichern vergangen ist
				// 30 Sekunden Puffer um Race Conditions zu vermeiden
				const MINIMUM_SAVE_INTERVAL = 30 * 1000;
				if (now - lastSavedTimestamp >= configuredInterval - MINIMUM_SAVE_INTERVAL) {
					// Aktuelle Position holen
					const location = await Location.getCurrentPositionAsync({
						accuracy: Location.Accuracy.Balanced,
					});

					// In LocationData Format umwandeln
					const batteryLevel = await getBatteryLevel();
					const connectionType = await getConnectionType();

					const locationData: LocationData = {
						id: generateUUID(),
						latitude: location.coords.latitude,
						longitude: location.coords.longitude,
						timestamps: {
							recorded: new Date(location.timestamp).toISOString(),
							recordedMs: location.timestamp,
						},
						accuracy: location.coords.accuracy || undefined,
						altitude: location.coords.altitude || undefined,
						speed: location.coords.speed || undefined,
						metadata: {
							source: 'background',
							batteryLevel,
							connectionType,
							deviceMotion: getDeviceMotion(location.coords.speed ?? undefined),
						},
						quality: {
							accuracyLevel: 'balanced' as any, // Default for background fetch
							horizontalAccuracy: location.coords.accuracy || 0,
							verticalAccuracy: location.coords.altitudeAccuracy ?? undefined,
							isSignificantLocation: true,
						},
						// Legacy support
						timestamp: location.timestamp,
					};

					// Speichern
					await saveLocationToHistory(locationData);

					// Speichere den aktuellen Zeitpunkt als letzten gespeicherten Zeitpunkt
					await AsyncStorage.setItem(LAST_SAVED_LOCATION_KEY, now.toString());

					logInfo('Standort durch Background Fetch aktualisiert', { configuredInterval });
					return BackgroundFetch.BackgroundFetchResult.NewData;
				} else {
					logInfo('Background Fetch übersprungen', {
						nextUpdateIn:
							Math.round((configuredInterval - (now - lastSavedTimestamp)) / 1000) + ' Sekunden',
						configuredInterval,
					});
					return BackgroundFetch.BackgroundFetchResult.NoData;
				}
			} catch (error) {
				logError('Fehler beim Background Fetch', error);
				return BackgroundFetch.BackgroundFetchResult.Failed;
			}
		});

		// 3. Verarbeitungs-Aufgabe (processing)
		TaskManager.defineTask(LOCATION_PROCESSING_TASK, async () => {
			try {
				console.log('Background Processing ausgeführt');

				// Hier könnte komplexere Verarbeitung der Standortdaten stattfinden
				// z.B. Zusammenfassen von Standorten, Berechnung von Statistiken, usw.

				console.log('Standortdaten verarbeitet');
				return true; // Erfolgreiche Ausführung
			} catch (error) {
				console.error('Fehler beim Background Processing:', error);
				return false; // Fehlerhafte Ausführung
			}
		});
	}
}

// Registriere die iOS-spezifischen Hintergrundaufgaben
export const registerIOSBackgroundTasks = async (): Promise<void> => {
	if (Platform.OS !== 'ios' || !TaskManager || !BackgroundFetch || !BackgroundTaskScheduler) {
		return;
	}

	try {
		// Standort-Update-Aufgabe registrieren
		await BackgroundFetch.registerTaskAsync(LOCATION_UPDATE_TASK, {
			minimumInterval: 15 * 60, // 15 Minuten
			stopOnTerminate: false,
			startOnBoot: true,
		});

		// Verarbeitungs-Aufgabe registrieren
		if (BackgroundTaskScheduler.NetworkType) {
			await BackgroundTaskScheduler.registerTaskAsync(LOCATION_PROCESSING_TASK, {
				requiredNetworkType: BackgroundTaskScheduler.NetworkType.ANY,
				requiresCharging: false,
				requiresBatteryNotLow: true,
				requiresStorageNotLow: true,
			});
		} else {
			// Fallback ohne Netzwerk-Anforderung
			await BackgroundTaskScheduler.registerTaskAsync(LOCATION_PROCESSING_TASK, {
				requiresCharging: false,
				requiresBatteryNotLow: true,
				requiresStorageNotLow: true,
			});
		}

		console.log('iOS-Hintergrundaufgaben registriert');
	} catch (error) {
		console.error('Fehler beim Registrieren der iOS-Hintergrundaufgaben:', error);
	}
};

// Funktion zum Stoppen der Hintergrund-Standortverfolgung
export const stopBackgroundLocationTask = async (): Promise<void> => {
	if (!TaskManager) {
		console.log('TaskManager ist nicht verfügbar, keine Hintergrund-Standortverfolgung zu stoppen');
		return;
	}

	try {
		// Standortverfolgung stoppen
		const isTaskDefined = await TaskManager.isTaskRegisteredAsync(BACKGROUND_LOCATION_TASK);
		if (isTaskDefined) {
			await Location.stopLocationUpdatesAsync(BACKGROUND_LOCATION_TASK);
			console.log('Hintergrund-Standortverfolgung gestoppt');
		}

		// iOS-spezifische Aufgaben abmelden
		if (Platform.OS === 'ios' && BackgroundFetch && BackgroundTaskScheduler) {
			if (await TaskManager.isTaskRegisteredAsync(LOCATION_UPDATE_TASK)) {
				await BackgroundFetch.unregisterTaskAsync(LOCATION_UPDATE_TASK);
			}

			if (await TaskManager.isTaskRegisteredAsync(LOCATION_PROCESSING_TASK)) {
				await BackgroundTaskScheduler.unregisterTaskAsync(LOCATION_PROCESSING_TASK);
			}

			console.log('iOS-Hintergrundaufgaben abgemeldet');
		}
	} catch (error) {
		console.error('Fehler beim Stoppen der Hintergrundaufgaben:', error);
	}
};
