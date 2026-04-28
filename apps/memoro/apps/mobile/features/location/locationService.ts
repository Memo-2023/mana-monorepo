import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface LocationData {
	latitude: number;
	longitude: number;
	timestamp: number;
}

/**
 * Fordert Standortberechtigungen vom Benutzer an
 * @returns {Promise<boolean>} True wenn Berechtigungen erteilt wurden
 */
export const requestLocationPermissions = async (): Promise<boolean> => {
	const { status } = await Location.requestForegroundPermissionsAsync();
	return status === 'granted';
};

/**
 * Ruft den aktuellen Standort des Geräts ab
 * @returns {Promise<LocationData | null>} Standortdaten oder null bei Fehler
 */
export const getCurrentLocation = async (): Promise<LocationData | null> => {
	try {
		const { coords, timestamp } = await Location.getCurrentPositionAsync({
			accuracy: Location.Accuracy.Balanced,
		});

		return {
			latitude: coords.latitude,
			longitude: coords.longitude,
			timestamp,
		};
	} catch (error) {
		console.debug('Fehler beim Abrufen des Standorts:', error);
		return null;
	}
};

/**
 * Speichert Standortdaten in der lokalen Speicherung
 * @param {LocationData} locationData Zu speichernde Standortdaten
 */
export const saveLocationData = async (locationData: LocationData): Promise<void> => {
	try {
		const existingDataString = await AsyncStorage.getItem('locationHistory');
		const existingData = existingDataString ? JSON.parse(existingDataString) : [];

		// Neuen Standort zur Historie hinzufügen
		const updatedData = [...existingData, locationData];

		// Maximal 100 Einträge speichern (kann angepasst werden)
		const limitedData = updatedData.slice(-100);

		await AsyncStorage.setItem('locationHistory', JSON.stringify(limitedData));
	} catch (error) {
		console.debug('Fehler beim Speichern des Standorts:', error);
	}
};

/**
 * Ruft die gespeicherte Standorthistorie ab
 * @returns {Promise<LocationData[]>} Array mit Standortdaten
 */
export const getLocationHistory = async (): Promise<LocationData[]> => {
	try {
		const dataString = await AsyncStorage.getItem('locationHistory');
		return dataString ? JSON.parse(dataString) : [];
	} catch (error) {
		console.debug('Fehler beim Abrufen der Standorthistorie:', error);
		return [];
	}
};

/**
 * Löscht die gesamte Standorthistorie
 */
export const clearLocationHistory = async (): Promise<void> => {
	try {
		await AsyncStorage.removeItem('locationHistory');
	} catch (error) {
		console.debug('Fehler beim Löschen der Standorthistorie:', error);
	}
};

/**
 * Prüft, ob die Standortspeicherung aktiviert ist und ruft ggf. den aktuellen Standort ab
 * @returns LocationData-Objekt oder null, wenn deaktiviert oder Fehler
 */
/**
 * Adressinformationen aus Reverse Geocoding
 */
export interface AddressInfo {
	street?: string;
	streetNumber?: string;
	postalCode?: string;
	city?: string;
	district?: string;
	region?: string;
	country?: string;
	name?: string;
	formattedAddress?: string;
}

/**
 * Erweiterte Standortdaten mit Adressinformationen
 */
export interface EnhancedLocationData extends LocationData {
	address?: AddressInfo;
}

/**
 * Führt ein Reverse Geocoding mit Expo Location durch
 * @param latitude Breitengrad
 * @param longitude Längengrad
 * @returns Adressinformationen oder null bei Fehler
 */
export const reverseGeocodeWithExpo = async (
	latitude: number,
	longitude: number
): Promise<AddressInfo | null> => {
	try {
		const addressResults = await Location.reverseGeocodeAsync({
			latitude,
			longitude,
		});

		if (addressResults && addressResults.length > 0) {
			const addressData = addressResults[0];
			return {
				street: addressData.street || undefined,
				streetNumber: addressData.streetNumber || undefined,
				postalCode: addressData.postalCode || undefined,
				city: addressData.city || undefined,
				district: addressData.district || undefined,
				region: addressData.region || undefined,
				country: addressData.country || undefined,
				name: addressData.name || undefined,
				formattedAddress: [
					// Verwende addressData.name falls vorhanden, sonst kombiniere street + streetNumber
					addressData.name ||
						[addressData.street, addressData.streetNumber].filter(Boolean).join(' '),
					[addressData.postalCode, addressData.city].filter(Boolean).join(' '),
					addressData.country,
				]
					.filter(Boolean)
					.join(', '),
			};
		}
		return null;
	} catch (error) {
		console.debug('Fehler beim Reverse Geocoding mit Expo:', error);
		return null;
	}
};

/**
 * Führt ein Reverse Geocoding durch. Nutzt ausschließlich Expo's
 * On-Device Reverse-Geocoding — keine direkten Calls an
 * nominatim.openstreetmap.org, weil das die User-IP + Coords ungeschützt
 * an einen Public-Service leakt. Wenn Expo keine Adresse liefert,
 * geben wir null zurück.
 *
 * Falls Expo's Qualität auf Dauer nicht reicht, ist der richtige Fix
 * ein Proxy-Endpoint im memoro-server, der intern an mana-geocoding
 * weiterreicht (Privacy-Hardening + Photon-Self).
 */
export const getAddressFromCoordinates = async (
	latitude: number,
	longitude: number
): Promise<AddressInfo | null> => {
	try {
		const expoResult = await reverseGeocodeWithExpo(latitude, longitude);
		if (expoResult && expoResult.street && expoResult.city) {
			return expoResult;
		}
		return expoResult;
	} catch (error) {
		console.debug('Fehler beim Reverse Geocoding:', error);
		return null;
	}
};

/**
 * Prüft, ob die Standortspeicherung aktiviert ist und ruft ggf. den aktuellen Standort ab
 * @param includeAddress Ob Adressinformationen abgerufen werden sollen
 * @returns LocationData-Objekt oder null, wenn deaktiviert oder Fehler
 */
export const getLocationForMemo = async (
	includeAddress: boolean = false
): Promise<LocationData | EnhancedLocationData | null> => {
	try {
		// Prüfe, ob die Standortspeicherung aktiviert ist
		const saveLocationSetting = await AsyncStorage.getItem('saveLocation');
		if (saveLocationSetting !== 'true') {
			// Standortspeicherung ist deaktiviert
			return null;
		}

		// Prüfe Berechtigungen
		const hasPermission = await requestLocationPermissions();
		if (!hasPermission) {
			// Keine Berechtigung
			return null;
		}

		// Rufe aktuellen Standort ab
		const locationData = await getCurrentLocation();
		if (!locationData) return null;

		// Wenn Adressinformationen nicht benötigt werden, nur Koordinaten zurückgeben
		if (!includeAddress) return locationData;

		// Adressinformationen abrufen
		const addressInfo = await getAddressFromCoordinates(
			locationData.latitude,
			locationData.longitude
		);

		// Erweiterte Standortdaten zurückgeben
		return {
			...locationData,
			address: addressInfo || undefined,
		};
	} catch (error) {
		console.debug('Fehler beim Abrufen des Standorts für Memo:', error);
		return null;
	}
};
