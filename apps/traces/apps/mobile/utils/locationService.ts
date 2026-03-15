import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import { Platform } from 'react-native';

import { BACKGROUND_LOCATION_TASK } from './backgroundLocationTask';
import { logInfo, logWarning, logError } from './logService';
import { TRACKING_INTERVALS } from '../components/TrackingControls';

// Konstanten für die AsyncStorage-Keys
export const SAVE_ADDRESS_KEY = 'save_address_enabled';
export const DEFAULT_INTERVAL_KEY = 'default_tracking_interval';
export const ACCURACY_LEVEL_KEY = 'location_accuracy_level';

// Genauigkeitsstufen für die App
export enum AccuracyLevel {
	Lowest = 'lowest',
	Low = 'low',
	Balanced = 'balanced',
	High = 'high',
	Highest = 'highest',
}

// Mapping von AccuracyLevel zu Expo Location.Accuracy
export const accuracyMapping = {
	[AccuracyLevel.Lowest]: Location.Accuracy.Lowest,
	[AccuracyLevel.Low]: Location.Accuracy.Low,
	[AccuracyLevel.Balanced]: Location.Accuracy.Balanced,
	[AccuracyLevel.High]: Location.Accuracy.High,
	[AccuracyLevel.Highest]: Location.Accuracy.Highest,
};

// Beschreibungen der Genauigkeitsstufen für die UI
export const accuracyDescriptions = {
	[AccuracyLevel.Lowest]: 'Niedrigste (1-3 km, geringster Akkuverbrauch)',
	[AccuracyLevel.Low]: 'Niedrig (500m-1km)',
	[AccuracyLevel.Balanced]: 'Mittel (100-500m, empfohlen)',
	[AccuracyLevel.High]: 'Hoch (20-100m)',
	[AccuracyLevel.Highest]: 'Höchste (0-20m, höchster Akkuverbrauch)',
};

export interface LocationData {
	id: string;
	latitude: number;
	longitude: number;
	timestamps: {
		recorded: string; // ISO 8601 string
		recordedMs: number; // Unix milliseconds für Berechnungen
	};
	accuracy?: number;
	altitude?: number;
	speed?: number;
	address?: {
		formatted?: string; // "Musterstraße 123, 12345 Berlin"
		components: {
			street?: string;
			houseNumber?: string;
			city?: string;
			postalCode?: string;
			country?: string;
			countryCode?: string; // ISO code
		};
		confidence?: number; // 0-1 für Geocoding-Qualität
	};
	metadata: {
		source: 'foreground' | 'background' | 'manual' | 'photo-import';
		batteryLevel?: number;
		connectionType?: 'wifi' | 'cellular' | 'none';
		deviceMotion?: 'stationary' | 'walking' | 'driving' | 'unknown';
	};
	quality: {
		accuracyLevel: AccuracyLevel;
		horizontalAccuracy: number;
		verticalAccuracy?: number;
		isSignificantLocation: boolean; // Bewegung vs. gleiche Position
	};
	// Photo Import Data
	photoImport?: {
		assetId: string; // MediaLibrary Asset ID
		photoUri: string; // Lokaler Pfad zum Foto
		photoTimestamp: number; // Original Foto-Zeit
		importedAt: number; // Wann importiert
		exifData?: any; // EXIF-Daten
	};
	// Legacy support - will be removed in future versions
	timestamp?: number;
}

const LOCATION_HISTORY_KEY = 'location_history';

// Lade die aktuell konfigurierte Genauigkeit
export const getAccuracyLevel = async (): Promise<AccuracyLevel> => {
	try {
		const savedValue = await AsyncStorage.getItem(ACCURACY_LEVEL_KEY);
		return savedValue ? (savedValue as AccuracyLevel) : AccuracyLevel.Balanced;
	} catch (error) {
		logError('Fehler beim Laden der Genauigkeitseinstellung', error);
		return AccuracyLevel.Balanced; // Im Fehlerfall Standard
	}
};

// Speichere die Genauigkeitseinstellung
export const saveAccuracyLevel = async (level: AccuracyLevel): Promise<void> => {
	try {
		await AsyncStorage.setItem(ACCURACY_LEVEL_KEY, level);
		logInfo('Genauigkeitsstufe gespeichert', { level });
	} catch (error) {
		logError('Fehler beim Speichern der Genauigkeitseinstellung', error);
	}
};

// Request location permissions
export const requestLocationPermissions = async (): Promise<boolean> => {
	try {
		// Zuerst nur Vordergrund-Berechtigungen anfordern
		const foreground = await Location.requestForegroundPermissionsAsync();

		if (foreground.status !== 'granted') {
			return false;
		}

		// Dann Hintergrund-Berechtigungen anfordern
		const background = await Location.requestBackgroundPermissionsAsync();

		if (background.status !== 'granted') {
			// Wir erlauben den Betrieb auch nur mit Vordergrund-Berechtigungen
			return true;
		}

		return true;
	} catch (error) {
		console.error('Error requesting permissions:', error);
		return false;
	}
};

// Get current location
export const getCurrentLocation = async (): Promise<LocationData | null> => {
	try {
		// Erst überprüfen und bei Bedarf die Berechtigungen anfordern
		const hasPermission = await requestLocationPermissions();
		if (!hasPermission) {
			return null;
		}

		// Aktuelle Genauigkeitseinstellung laden
		const accuracyLevel = await getAccuracyLevel();
		const accuracy = accuracyMapping[accuracyLevel];

		const location = await Location.getCurrentPositionAsync({
			accuracy,
		});

		const batteryLevel = await getBatteryLevel();
		const connectionType = await getConnectionType();

		return {
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
				source: 'foreground',
				batteryLevel,
				connectionType,
				deviceMotion: getDeviceMotion(location.coords.speed ?? undefined),
			},
			quality: {
				accuracyLevel,
				horizontalAccuracy: location.coords.accuracy || 0,
				verticalAccuracy: location.coords.altitudeAccuracy ?? undefined,
				isSignificantLocation: true,
			},
			// Legacy support
			timestamp: location.timestamp,
		};
	} catch (error) {
		console.error('Error getting location:', error);
		return null;
	}
};

// Start location tracking
export const startLocationTracking = async (
	onLocationUpdate: (location: LocationData) => void,
	timeInterval = 5000, // 5 seconds by default
	distanceInterval = 10 // 10 meters by default
): Promise<Location.LocationSubscription | null> => {
	try {
		const hasPermission = await requestLocationPermissions();
		if (!hasPermission) {
			return null;
		}

		// Lade die aktuelle Genauigkeitseinstellung
		const accuracyLevel = await getAccuracyLevel();
		const accuracy = accuracyMapping[accuracyLevel];

		// Speichere den Intervall für Hintergrund-Tracking-Komponenten
		await saveDefaultInterval(timeInterval);
		logInfo('Tracking gestartet', { timeInterval, distanceInterval, accuracyLevel });

		// Prüfe ob schon mal ein Standort gespeichert wurde
		const LAST_SAVED_LOCATION_KEY = 'last_saved_location_timestamp';
		const existingTimestamp = await AsyncStorage.getItem(LAST_SAVED_LOCATION_KEY);
		const isFirstTrackingSession = !existingTimestamp;

		const currentTime = Date.now();
		logInfo('Tracking-Session Check', {
			existingTimestamp,
			isFirstTrackingSession,
			currentTime,
			willSaveImmediately: isFirstTrackingSession,
		});

		// SOFORTIGES SPEICHERN: Setze Zeitstempel weit in die Vergangenheit
		// damit der erste Standort sofort gespeichert wird
		const forcedSaveTimestamp = (currentTime - timeInterval - 1000).toString(); // 1 Sekunde vor dem Intervall
		await AsyncStorage.setItem(LAST_SAVED_LOCATION_KEY, forcedSaveTimestamp);

		logInfo('Zeitstempel für sofortiges Speichern gesetzt', {
			forcedSaveTimestamp,
			intervalMs: timeInterval,
			willTriggerSaveImmediately: true,
		});

		// Hintergrund-Tracking NUR konfigurieren, kein direktes Vordergrund-Tracking
		if (Platform.OS !== 'web') {
			try {
				// Dynamische ActivityType Auswahl basierend auf Tracking-Intervall
				// Spaziergang-Modi (<=2min) = Fitness (optimiert für Fußgänger)
				// Fahrten (2-30min) = AutomotiveNavigation (optimiert für schnelle Bewegung)
				// Langzeit (>30min) = Other (Energie-Sparmodus)
				const activityType =
					timeInterval <= 2 * 60 * 1000 // <= 2 Minuten (Spaziergang)
						? Location.ActivityType.Fitness // Optimiert für Fußgänger
						: timeInterval <= 30 * 60 * 1000 // <= 30 Minuten (Fahrt)
							? Location.ActivityType.AutomotiveNavigation // Optimiert für Fahrten
							: Location.ActivityType.Other; // Energie-Sparmodus

				// Spaziergang-Modus: Noch aggressivere Settings für maximale Präzision
				const isWalkMode = timeInterval <= 2 * 60 * 1000; // <= 2 Minuten

				// Vordergrund-Tracking wird durch App-State-Change automatisch gestoppt
				// Hintergrund-Tracking übernimmt dann mit weniger Frequenz
				await Location.startLocationUpdatesAsync(BACKGROUND_LOCATION_TASK, {
					accuracy,
					// iOS: Minimale Intervals für häufigere Background Updates
					// Spaziergang: Nutze das gewählte Intervall direkt (30s oder 1min)
					// Andere: Minimum 1 Sekunde
					timeInterval: isWalkMode ? timeInterval : Math.max(timeInterval, 1000),
					// Spaziergang: 5m für sehr präzise Tracks
					// Andere: 10m Standard
					distanceInterval: isWalkMode ? 5 : Math.max(distanceInterval, 10),
					// WICHTIG: Deferred Updates Konfiguration für iOS
					// Spaziergang: Aggressivere Settings
					deferredUpdatesInterval: isWalkMode ? 50 : 100,
					deferredUpdatesDistance: isWalkMode ? 5 : 10,
					deferredUpdatesTimeout: 1000,
					foregroundService: {
						notificationTitle: isWalkMode
							? '🚶 Spaziergang wird aufgezeichnet'
							: 'Standortverlauf läuft',
						notificationBody: isWalkMode
							? 'Detailliertes Tracking aktiv'
							: 'Dein Standort wird aufgezeichnet',
						notificationColor: '#4CAF50',
					},
					showsBackgroundLocationIndicator: true,
					// Dynamischer ActivityType basierend auf Intervall
					activityType,
					pausesUpdatesAutomatically: false,
				});
				const activityTypeName =
					activityType === Location.ActivityType.AutomotiveNavigation
						? 'AutomotiveNavigation'
						: activityType === Location.ActivityType.Fitness
							? 'Fitness'
							: 'Other';

				logInfo('Hintergrund-Tracking konfiguriert', {
					mode: isWalkMode ? '🚶 Spaziergang' : '🚗 Standard',
					backgroundInterval: isWalkMode ? timeInterval : Math.max(timeInterval, 1000),
					backgroundDistance: isWalkMode ? 5 : Math.max(distanceInterval, 10),
					deferredInterval: isWalkMode ? 50 : 100,
					deferredDistance: isWalkMode ? 5 : 10,
					activityType: activityTypeName,
					accuracyLevel,
				});
			} catch (error) {
				logWarning('Hintergrund-Tracking konnte nicht gestartet werden', error);
			}
		}

		// Effizientes Vordergrund-Tracking: NUR wenn App aktiv ist
		let lastSavedTimestamp = currentTime - timeInterval - 1000;
		let subscription: Location.LocationSubscription | null = null;

		logInfo('Starte effizientes Vordergrund-Tracking', {
			accuracy: accuracyLevel,
			timeInterval,
			distanceInterval,
		});

		// Hole sofort einen aktuellen Standort für UI-Update
		try {
			const currentPos = await Location.getCurrentPositionAsync({
				accuracy,
				mayShowUserSettingsDialog: false,
			});

			const batteryLevel = await getBatteryLevel();
			const connectionType = await getConnectionType();

			const initialLocationData: LocationData = {
				id: generateUUID(),
				latitude: currentPos.coords.latitude,
				longitude: currentPos.coords.longitude,
				timestamps: {
					recorded: new Date(currentPos.timestamp).toISOString(),
					recordedMs: currentPos.timestamp,
				},
				accuracy: currentPos.coords.accuracy || undefined,
				altitude: currentPos.coords.altitude || undefined,
				speed: currentPos.coords.speed || undefined,
				metadata: {
					source: 'foreground',
					batteryLevel,
					connectionType,
					deviceMotion: getDeviceMotion(currentPos.coords.speed ?? undefined),
				},
				quality: {
					accuracyLevel,
					horizontalAccuracy: currentPos.coords.accuracy || 0,
					verticalAccuracy: currentPos.coords.altitudeAccuracy ?? undefined,
					isSignificantLocation: true,
				},
				timestamp: currentPos.timestamp,
			};

			// UI sofort aktualisieren
			onLocationUpdate(initialLocationData);

			// Erste Location sofort speichern
			await saveLocationToHistory(initialLocationData);
			lastSavedTimestamp = currentTime;

			logInfo('Initialer Standort erfolgreich abgerufen und gespeichert', {
				coords: { lat: currentPos.coords.latitude, lng: currentPos.coords.longitude },
				accuracy: currentPos.coords.accuracy,
			});
		} catch (error) {
			logError('Fehler beim Abrufen des initialen Standorts', error);
		}

		// Verwende NUR watchPositionAsync - kein zusätzliches Polling für bessere Batterie-Effizienz
		try {
			// Spaziergang-Modus: Nutze kleinere Intervalle für Präzision
			const isWalkMode = timeInterval <= 2 * 60 * 1000;

			subscription = await Location.watchPositionAsync(
				{
					accuracy,
					// Spaziergang: Nutze das gewählte Intervall (30s/1min)
					// Andere: Minimum 30 Sekunden
					timeInterval: isWalkMode ? timeInterval : Math.max(timeInterval, 30000),
					// Spaziergang: 5m für sehr präzise Tracks
					// Andere: 10m Standard
					distanceInterval: isWalkMode ? 5 : Math.max(distanceInterval, 10),
				},
				async (location) => {
					logInfo('Vordergrund-Standort empfangen', {
						coords: { lat: location.coords.latitude, lng: location.coords.longitude },
						accuracy: location.coords.accuracy,
						timestamp: new Date(location.timestamp).toISOString(),
					});

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
							source: 'foreground',
							batteryLevel,
							connectionType,
							deviceMotion: getDeviceMotion(location.coords.speed ?? undefined),
						},
						quality: {
							accuracyLevel,
							horizontalAccuracy: location.coords.accuracy || 0,
							verticalAccuracy: location.coords.altitudeAccuracy ?? undefined,
							isSignificantLocation: true,
						},
						timestamp: location.timestamp,
					};

					// UI immer aktualisieren
					onLocationUpdate(locationData);

					// Prüfung ob gespeichert werden soll
					const now = Date.now();

					// WICHTIG: Lade den aktuellen Timestamp aus Storage für genaue Duplikat-Vermeidung
					const LAST_SAVED_LOCATION_KEY = 'last_saved_location_timestamp';
					const currentSavedString = await AsyncStorage.getItem(LAST_SAVED_LOCATION_KEY);
					const currentSavedTimestamp = currentSavedString ? parseInt(currentSavedString, 10) : 0;

					const timeSinceLastSave = now - currentSavedTimestamp;
					const shouldSave = timeSinceLastSave >= timeInterval;

					if (shouldSave) {
						// Atomares Update: Speichere zuerst den neuen Timestamp
						await AsyncStorage.setItem(LAST_SAVED_LOCATION_KEY, now.toString());

						// Dann speichere den Standort
						await saveLocationToHistory(locationData);
						lastSavedTimestamp = now;

						logInfo('Vordergrund-Standort gespeichert', {
							timeInterval,
							timeSinceLastSave: Math.round(timeSinceLastSave / 1000) + 's',
							coords: { lat: locationData.latitude, lng: locationData.longitude },
						});
					}
				}
			);

			logInfo('Vordergrund-Tracking erfolgreich gestartet (watchPositionAsync)');
		} catch (error) {
			logError('Fehler beim Starten des Vordergrund-Trackings', error);
			// Fallback: Setze subscription auf null, damit der Return-Handler funktioniert
			subscription = null;
		}

		// Return subscription handler
		return {
			remove: async () => {
				if (subscription) {
					subscription.remove();
					logInfo('Vordergrund-Tracking gestoppt');
				}
			},
		} as Location.LocationSubscription;
	} catch (error) {
		console.error('Error starting location tracking:', error);
		return null;
	}
};

// Prüfe, ob Adressspeicherung aktiviert ist
export const isAddressSavingEnabled = async (): Promise<boolean> => {
	try {
		const savedValue = await AsyncStorage.getItem(SAVE_ADDRESS_KEY);
		// Wenn kein Wert gespeichert ist, verwende true als Standard (opt-in)
		return savedValue === null ? true : savedValue === 'true';
	} catch (error) {
		console.error('Fehler beim Laden der Adress-Einstellung:', error);
		return true; // Im Fehlerfall standardmäßig aktiviert
	}
};

// Speichere den Standard-Intervall
export const saveDefaultInterval = async (interval: number | null): Promise<void> => {
	try {
		if (interval !== null) {
			await AsyncStorage.setItem(DEFAULT_INTERVAL_KEY, interval.toString());
			logInfo('Intervall gespeichert', { interval });
		} else {
			await AsyncStorage.removeItem(DEFAULT_INTERVAL_KEY);
			logInfo('Intervall entfernt');
		}
	} catch (error) {
		logError('Fehler beim Speichern des Standard-Intervalls', error);
	}
};

// Lade den Standard-Intervall
export const getDefaultInterval = async (): Promise<number | null> => {
	try {
		const savedValue = await AsyncStorage.getItem(DEFAULT_INTERVAL_KEY);
		logInfo('Geladener Intervall', { savedValue });
		if (savedValue !== null) {
			return parseInt(savedValue, 10);
		}
		return null;
	} catch (error) {
		logError('Fehler beim Laden des Standard-Intervalls', error);
		return null;
	}
};

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
	// This would require expo-network or similar package
	// For now, return 'unknown' - can be implemented later
	return 'cellular'; // Default assumption
};

// Helper function to get battery level
const getBatteryLevel = async (): Promise<number | undefined> => {
	// This would require expo-battery or similar package
	// For now, return undefined - can be implemented later
	return undefined;
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

// Reverse Geocoding - Adresse aus Koordinaten ermitteln
export const getAddressFromCoordinates = async (latitude: number, longitude: number) => {
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

// Save location to history
export const saveLocationToHistory = async (location: LocationData): Promise<void> => {
	try {
		const timestamp = location.timestamps?.recordedMs || location.timestamp || Date.now();
		logInfo('Speichere Standort in Verlauf', {
			coords: { lat: location.latitude, lng: location.longitude },
			timestamp: new Date(timestamp).toISOString(),
		});

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

		logInfo('Aktuelle Verlaufslänge vor dem Hinzufügen', { currentLength: history.length });

		// Add new location
		history.push(location);

		// Save back to storage
		await AsyncStorage.setItem(LOCATION_HISTORY_KEY, JSON.stringify(history));

		logInfo('Standort erfolgreich gespeichert', {
			newLength: history.length,
			savedLocation: { lat: location.latitude, lng: location.longitude },
		});
	} catch (error) {
		logError('Fehler beim Speichern des Standorts', error);
	}
};

// Migration function for legacy LocationData
const migrateLegacyLocationData = (data: any): LocationData => {
	// If already migrated, return as is
	if (data.id && data.timestamps) {
		return data as LocationData;
	}

	// Legacy data migration
	const timestamp = data.timestamp || Date.now();
	const migrated: LocationData = {
		id: generateUUID(),
		latitude: data.latitude,
		longitude: data.longitude,
		timestamps: {
			recorded: new Date(timestamp).toISOString(),
			recordedMs: timestamp,
		},
		accuracy: data.accuracy,
		altitude: data.altitude,
		speed: data.speed,
		metadata: {
			source: 'foreground', // Default assumption for legacy data
			batteryLevel: undefined,
			connectionType: 'cellular',
			deviceMotion: getDeviceMotion(data.speed),
		},
		quality: {
			accuracyLevel: AccuracyLevel.Balanced, // Default assumption
			horizontalAccuracy: data.accuracy || 0,
			verticalAccuracy: undefined,
			isSignificantLocation: true,
		},
		// Legacy support
		timestamp,
	};

	// Migrate address if exists
	if (data.address) {
		if (data.address.components) {
			// Already new format
			migrated.address = data.address;
		} else {
			// Legacy address format - convert to new format
			const components = {
				street: data.address.street,
				houseNumber: data.address.streetNumber,
				city: data.address.city,
				postalCode: data.address.postalCode,
				country: data.address.country,
				countryCode: undefined,
			};

			// Build formatted address
			const addressParts = [
				components.street && components.houseNumber
					? `${components.street} ${components.houseNumber}`
					: components.street,
				components.postalCode && components.city
					? `${components.postalCode} ${components.city}`
					: components.city,
				components.country,
			].filter(Boolean);

			migrated.address = {
				formatted: addressParts.join(', '),
				components,
				confidence: 0.8, // Lower confidence for migrated data
			};
		}
	}

	return migrated;
};

// Get location history with automatic migration
export const getLocationHistory = async (): Promise<LocationData[]> => {
	try {
		const historyString = await AsyncStorage.getItem(LOCATION_HISTORY_KEY);
		if (!historyString) return [];

		const rawHistory = JSON.parse(historyString);

		// Check if migration is needed
		const needsMigration = rawHistory.some((item: any) => !item.id || !item.timestamps);

		if (needsMigration) {
			logInfo('Migriere Standortdaten zu neuem Format', { count: rawHistory.length });
			const migratedHistory = rawHistory.map(migrateLegacyLocationData);

			// Save migrated data back
			await AsyncStorage.setItem(LOCATION_HISTORY_KEY, JSON.stringify(migratedHistory));
			logInfo('Standortdaten-Migration abgeschlossen');

			return migratedHistory;
		}

		return rawHistory as LocationData[];
	} catch (error) {
		logError('Fehler beim Laden des Standortverlaufs', error);
		return [];
	}
};

// Delete a single location entry by ID
export const deleteLocationEntry = async (locationId: string): Promise<void> => {
	try {
		const history = await getLocationHistory();
		const updatedHistory = history.filter((location) => location.id !== locationId);
		await AsyncStorage.setItem(LOCATION_HISTORY_KEY, JSON.stringify(updatedHistory));
		logInfo('Standorteintrag gelöscht', { locationId, remainingCount: updatedHistory.length });
	} catch (error) {
		logError('Fehler beim Löschen des Standorteintrags', error);
		throw error;
	}
};

// Clear location history
export const clearLocationHistory = async (): Promise<void> => {
	try {
		await AsyncStorage.removeItem(LOCATION_HISTORY_KEY);
		// Lösche auch den Zeitstempel für den nächsten Start
		await AsyncStorage.removeItem('last_saved_location_timestamp');
		logInfo('Standortverlauf und Zeitstempel gelöscht');
	} catch (error) {
		logError('Fehler beim Löschen des Standortverlaufs', error);
	}
};
