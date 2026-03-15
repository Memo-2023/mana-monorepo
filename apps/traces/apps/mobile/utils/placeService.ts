import AsyncStorage from '@react-native-async-storage/async-storage';

import {
	ConsolidatedLocation,
	Place,
	generatePlaceId,
	filterFrequentLocations,
	consolidateLocationsByProximity,
} from './locationHelper';
import { getLocationHistory } from './locationService';
import { logInfo, logError } from './logService';

// AsyncStorage key für die gespeicherten Orte
const PLACES_STORAGE_KEY = 'saved_places';

/**
 * Lädt alle gespeicherten Orte aus dem AsyncStorage
 */
export const getSavedPlaces = async (): Promise<Place[]> => {
	try {
		const placesJSON = await AsyncStorage.getItem(PLACES_STORAGE_KEY);
		if (placesJSON) {
			const places = JSON.parse(placesJSON);

			// Konvertiere Set zurück (wird bei JSON.parse als Objekt gespeichert)
			const placesWithSets = places.map((place: any) => ({
				...place,
				addresses: new Set(place.addresses || []),
			}));

			// Entferne Duplikate basierend auf Koordinaten (gleiche Orte mit verschiedenen IDs)
			const uniquePlaces: Place[] = [];
			for (const place of placesWithSets) {
				const isDuplicate = uniquePlaces.some(
					(existing) =>
						Math.abs(existing.latitude - place.latitude) < 0.0001 &&
						Math.abs(existing.longitude - place.longitude) < 0.0001
				);
				if (!isDuplicate) {
					uniquePlaces.push(place);
				}
			}

			logInfo('Gespeicherte Orte geladen', {
				totalPlaces: places.length,
				uniquePlaces: uniquePlaces.length,
				duplicatesRemoved: places.length - uniquePlaces.length,
			});

			return uniquePlaces;
		}
		return [];
	} catch (error) {
		logError('Fehler beim Laden der gespeicherten Orte', error);
		return [];
	}
};

/**
 * Speichert einen neuen Ort oder aktualisiert einen bestehenden
 */
export const savePlace = async (place: Place): Promise<boolean> => {
	try {
		const places = await getSavedPlaces();

		// Prüfe, ob der Ort bereits existiert
		const existingIndex = places.findIndex((p) => p.id === place.id);

		if (existingIndex >= 0) {
			// Aktualisiere bestehenden Ort
			places[existingIndex] = place;
		} else {
			// Füge neuen Ort hinzu
			places.push(place);
		}

		// Konvertiere Set zu Array für JSON.stringify
		const placesToSave = places.map((p) => ({
			...p,
			addresses: Array.from(p.addresses),
		}));

		await AsyncStorage.setItem(PLACES_STORAGE_KEY, JSON.stringify(placesToSave));
		logInfo('Ort gespeichert', { placeId: place.id, placeName: place.name });
		return true;
	} catch (error) {
		logError('Fehler beim Speichern des Ortes', error);
		return false;
	}
};

/**
 * Löscht einen gespeicherten Ort
 */
export const deletePlace = async (placeId: string): Promise<boolean> => {
	try {
		const places = await getSavedPlaces();
		const filteredPlaces = places.filter((place) => place.id !== placeId);

		// Konvertiere Set zu Array für JSON.stringify
		const placesToSave = filteredPlaces.map((p) => ({
			...p,
			addresses: Array.from(p.addresses),
		}));

		await AsyncStorage.setItem(PLACES_STORAGE_KEY, JSON.stringify(placesToSave));
		logInfo('Ort gelöscht', { placeId });
		return true;
	} catch (error) {
		logError('Fehler beim Löschen des Ortes', error);
		return false;
	}
};

/**
 * Erstellt ein neues Place-Objekt aus einem konsolidierten Standort
 */
export const createPlaceFromLocation = (location: ConsolidatedLocation, name: string): Place => {
	return {
		id: generatePlaceId(),
		name,
		latitude: location.latitude,
		longitude: location.longitude,
		startTimestamp: location.startTimestamp,
		endTimestamp: location.endTimestamp,
		count: location.count,
		duration: location.duration,
		accuracy: location.accuracy,
		altitude: location.altitude,
		addresses: location.addresses,
		visitCount: location.count,
		totalDuration: location.duration,
		firstVisit: location.startTimestamp,
		lastVisit: location.endTimestamp,
		radius: 100, // Standard-Radius in Metern
	};
};

/**
 * Findet häufig besuchte Orte aus dem Standortverlauf
 */
export const getFrequentLocations = async (
	minCount: number = 1
): Promise<ConsolidatedLocation[]> => {
	try {
		const locationHistory = await getLocationHistory();
		logInfo('Lade häufige Standorte', {
			totalLocations: locationHistory.length,
			minCount,
		});

		// Konsolidiere Standorte basierend auf Nähe
		const consolidatedLocations = consolidateLocationsByProximity(locationHistory);
		logInfo('Standorte konsolidiert', {
			originalCount: locationHistory.length,
			consolidatedCount: consolidatedLocations.length,
		});

		// Filtere nach Häufigkeit
		const frequentLocations = filterFrequentLocations(consolidatedLocations, minCount);
		logInfo('Häufige Standorte gefiltert', {
			beforeFilter: consolidatedLocations.length,
			afterFilter: frequentLocations.length,
			minCount,
		});

		return frequentLocations;
	} catch (error) {
		logError('Fehler beim Abrufen häufiger Standorte', error);
		return [];
	}
};

/**
 * Prüft, ob ein Standort einem gespeicherten Ort entspricht (basierend auf Entfernung)
 */
export const findMatchingPlace = (
	latitude: number,
	longitude: number,
	places: Place[]
): Place | null => {
	// Importiere die benötigte Funktion aus locationHelper
	const { getDistanceBetweenCoordinates } = require('./locationHelper');

	for (const place of places) {
		const distance = getDistanceBetweenCoordinates(
			place.latitude,
			place.longitude,
			latitude,
			longitude
		);

		// Wenn der Standort innerhalb des definierten Radius liegt
		if (distance <= (place.radius || 100)) {
			return place;
		}
	}

	return null;
};

export interface CityVisit {
	city: string;
	visitCount: number;
	totalDuration: number;
	firstVisit: number;
	lastVisit: number;
	locations: ConsolidatedLocation[];
}

export interface CountryVisit {
	country: string;
	countryCode?: string;
	visitCount: number;
	totalDuration: number;
	firstVisit: number;
	lastVisit: number;
	locations: ConsolidatedLocation[];
	cities: Set<string>;
}

/**
 * Extrahiert Städte aus den Standorten und gruppiert sie mit Besuchsstatistiken
 */
export const getCitiesFromLocations = async (): Promise<CityVisit[]> => {
	try {
		const locationHistory = await getLocationHistory();
		logInfo('Extrahiere Städte aus Standorten', {
			totalLocations: locationHistory.length,
		});

		// Konsolidiere Standorte
		const consolidatedLocations = consolidateLocationsByProximity(locationHistory);

		// Map für Städte (cityName -> CityVisit)
		const citiesMap = new Map<string, CityVisit>();

		for (const location of consolidatedLocations) {
			// Extrahiere Stadt aus den Adressen
			let cityName: string | null = null;

			for (const address of location.addresses) {
				// Versuche Stadt zu extrahieren (Format: "Straße Nr, PLZ Stadt" oder "PLZ Stadt")
				const cityMatch = address.match(/\d{5}\s+([^,]+)/); // PLZ + Stadt
				if (cityMatch && cityMatch[1]) {
					cityName = cityMatch[1].trim();
					break;
				}

				// Fallback: Prüfe ob nur Stadt ohne PLZ
				const parts = address.split(',');
				if (parts.length > 0) {
					const lastPart = parts[parts.length - 1].trim();
					// Prüfe ob es keine PLZ enthält
					if (!/^\d{5}/.test(lastPart) && lastPart.length > 0) {
						cityName = lastPart;
						break;
					}
				}
			}

			if (cityName) {
				const existing = citiesMap.get(cityName);

				if (existing) {
					// Aktualisiere bestehende Stadt
					existing.visitCount += location.count;
					existing.totalDuration += location.duration;
					existing.firstVisit = Math.min(existing.firstVisit, location.startTimestamp);
					existing.lastVisit = Math.max(existing.lastVisit, location.endTimestamp);
					existing.locations.push(location);
				} else {
					// Neue Stadt hinzufügen
					citiesMap.set(cityName, {
						city: cityName,
						visitCount: location.count,
						totalDuration: location.duration,
						firstVisit: location.startTimestamp,
						lastVisit: location.endTimestamp,
						locations: [location],
					});
				}
			}
		}

		// Konvertiere Map zu Array und sortiere nach Besuchshäufigkeit
		const cities = Array.from(citiesMap.values()).sort((a, b) => b.visitCount - a.visitCount);

		logInfo('Städte extrahiert', {
			totalCities: cities.length,
		});

		return cities;
	} catch (error) {
		logError('Fehler beim Extrahieren der Städte', error);
		return [];
	}
};

/**
 * Extrahiert Länder aus den Standorten und gruppiert sie mit Besuchsstatistiken
 */
export const getCountriesFromLocations = async (): Promise<CountryVisit[]> => {
	try {
		const locationHistory = await getLocationHistory();
		logInfo('Extrahiere Länder aus Standorten', {
			totalLocations: locationHistory.length,
		});

		// Map für Länder (countryName -> CountryVisit)
		const countriesMap = new Map<string, CountryVisit>();

		// Gruppiere zunächst nach Land aus den rohen Standortdaten
		for (const location of locationHistory) {
			if (!location.address?.components?.country) continue;

			const countryName = location.address.components.country;
			const countryCode = location.address.components.countryCode;
			const cityName = location.address.components.city;

			const existing = countriesMap.get(countryName);

			if (existing) {
				// Aktualisiere bestehendes Land
				existing.visitCount += 1;
				if (cityName) {
					existing.cities.add(cityName);
				}
			} else {
				// Neues Land hinzufügen
				const cities = new Set<string>();
				if (cityName) {
					cities.add(cityName);
				}

				countriesMap.set(countryName, {
					country: countryName,
					countryCode: countryCode,
					visitCount: 1,
					totalDuration: 0,
					firstVisit: location.timestamps?.recordedMs || location.timestamp || 0,
					lastVisit: location.timestamps?.recordedMs || location.timestamp || 0,
					locations: [],
					cities: cities,
				});
			}
		}

		// Konsolidiere Standorte für detaillierte Statistiken
		const consolidatedLocations = consolidateLocationsByProximity(locationHistory);

		// Füge konsolidierte Locations hinzu und berechne Dauer
		for (const location of consolidatedLocations) {
			let countryName: string | null = null;

			// Extrahiere Land aus den Adressen des konsolidierten Standorts
			for (const loc of location.originalLocations) {
				if (loc.address?.components?.country) {
					countryName = loc.address.components.country;
					break;
				}
			}

			if (countryName) {
				const existing = countriesMap.get(countryName);
				if (existing) {
					existing.totalDuration += location.duration;
					existing.firstVisit = Math.min(existing.firstVisit, location.startTimestamp);
					existing.lastVisit = Math.max(existing.lastVisit, location.endTimestamp);
					existing.locations.push(location);
				}
			}
		}

		// Konvertiere Map zu Array und sortiere nach Besuchshäufigkeit
		const countries = Array.from(countriesMap.values()).sort((a, b) => b.visitCount - a.visitCount);

		logInfo('Länder extrahiert', {
			totalCountries: countries.length,
		});

		return countries;
	} catch (error) {
		logError('Fehler beim Extrahieren der Länder', error);
		return [];
	}
};
