import { LocationData } from './locationService';

// Berechne Distanz zwischen zwei Standorten in Metern
export function getDistanceBetweenCoordinates(
	lat1: number,
	lon1: number,
	lat2: number,
	lon2: number
): number {
	const R = 6371e3; // Erdradius in Metern
	const φ1 = (lat1 * Math.PI) / 180; // φ, λ in Radiant
	const φ2 = (lat2 * Math.PI) / 180;
	const Δφ = ((lat2 - lat1) * Math.PI) / 180;
	const Δλ = ((lon2 - lon1) * Math.PI) / 180;

	const a =
		Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
		Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
	const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

	return R * c; // in Metern
}

export interface ConsolidatedLocation {
	latitude: number;
	longitude: number;
	startTimestamp: number;
	endTimestamp: number;
	count: number;
	duration: number; // in Millisekunden
	accuracy?: number;
	altitude?: number;
	addresses: Set<string>;
	originalLocations: LocationData[];
}

export interface Place extends Omit<ConsolidatedLocation, 'originalLocations'> {
	id: string;
	name: string;
	customAddress?: string;
	visitCount: number;
	totalDuration: number;
	firstVisit: number;
	lastVisit: number;
	radius?: number;
}

/**
 * Konsolidiert Standorte, die sich innerhalb eines bestimmten Radius befinden
 * @param locations Array der Standortdaten
 * @param radius Radius in Metern, innerhalb dessen Standorte zusammengefasst werden sollen
 * @returns Array der konsolidierten Standorte
 */
export function consolidateLocationsByProximity(
	locations: LocationData[],
	radius: number = 100
): ConsolidatedLocation[] {
	if (!locations || locations.length === 0) {
		return [];
	}

	// Helper function to get timestamp
	const getTimestamp = (location: LocationData): number => {
		return location.timestamps?.recordedMs || location.timestamp || 0;
	};

	// Sortiere Standorte nach Zeitstempel (aufsteigend)
	const sortedLocations = [...locations].sort((a, b) => getTimestamp(a) - getTimestamp(b));

	const consolidatedLocations: ConsolidatedLocation[] = [];
	let currentGroup: LocationData[] = [sortedLocations[0]];
	let currentCenter = {
		latitude: sortedLocations[0].latitude,
		longitude: sortedLocations[0].longitude,
	};

	// Iteriere durch alle Standorte, beginnend mit dem zweiten
	for (let i = 1; i < sortedLocations.length; i++) {
		const location = sortedLocations[i];

		// Berechne Distanz zum aktuellen Zentrum
		const distance = getDistanceBetweenCoordinates(
			currentCenter.latitude,
			currentCenter.longitude,
			location.latitude,
			location.longitude
		);

		// Wenn Distanz innerhalb des Radius, füge zum aktuellen Cluster hinzu
		if (distance <= radius) {
			currentGroup.push(location);

			// Aktualisiere das Zentrum als gewichteten Durchschnitt
			const totalPoints = currentGroup.length;
			currentCenter = {
				latitude: (currentCenter.latitude * (totalPoints - 1) + location.latitude) / totalPoints,
				longitude: (currentCenter.longitude * (totalPoints - 1) + location.longitude) / totalPoints,
			};
		} else {
			// Schließe den aktuellen Cluster ab und erstelle ein konsolidiertes Objekt
			finalizeCluster(currentGroup, consolidatedLocations);

			// Starte einen neuen Cluster mit dem aktuellen Standort
			currentGroup = [location];
			currentCenter = {
				latitude: location.latitude,
				longitude: location.longitude,
			};
		}
	}

	// Den letzten Cluster verarbeiten
	if (currentGroup.length > 0) {
		finalizeCluster(currentGroup, consolidatedLocations);
	}

	return consolidatedLocations;
}

/**
 * Erstellt ein konsolidiertes Standortobjekt aus einer Gruppe von Standorten
 */
function finalizeCluster(group: LocationData[], consolidatedLocations: ConsolidatedLocation[]) {
	if (group.length === 0) return;

	// Helper function to get timestamp
	const getTimestamp = (location: LocationData): number => {
		return location.timestamps?.recordedMs || location.timestamp || 0;
	};

	// Sortiere die Gruppe nach Zeitstempel (aufsteigend)
	group.sort((a, b) => getTimestamp(a) - getTimestamp(b));

	// Sammle alle eindeutigen Adressen
	const addresses = new Set<string>();
	for (const loc of group) {
		if (loc.address) {
			// Use formatted address if available, otherwise build from components
			if (loc.address.formatted) {
				addresses.add(loc.address.formatted);
			} else if (loc.address.components) {
				const addressParts = [];
				if (loc.address.components.street) {
					const streetWithNumber = loc.address.components.houseNumber
						? `${loc.address.components.street} ${loc.address.components.houseNumber}`
						: loc.address.components.street;
					addressParts.push(streetWithNumber);
				}

				if (loc.address.components.postalCode && loc.address.components.city) {
					addressParts.push(`${loc.address.components.postalCode} ${loc.address.components.city}`);
				} else if (loc.address.components.city) {
					addressParts.push(loc.address.components.city);
				}

				if (addressParts.length > 0) {
					addresses.add(addressParts.join(', '));
				}
			} else {
				// Legacy fallback
				const addressParts = [];
				const legacyAddress = loc.address as any;
				if (legacyAddress.street) {
					const streetWithNumber = legacyAddress.streetNumber
						? `${legacyAddress.street} ${legacyAddress.streetNumber}`
						: legacyAddress.street;
					addressParts.push(streetWithNumber);
				}

				if (legacyAddress.postalCode && legacyAddress.city) {
					addressParts.push(`${legacyAddress.postalCode} ${legacyAddress.city}`);
				} else if (legacyAddress.city) {
					addressParts.push(legacyAddress.city);
				}

				if (addressParts.length > 0) {
					addresses.add(addressParts.join(', '));
				}
			}
		}
	}

	// Berechne den geometrischen Mittelpunkt
	let sumLat = 0,
		sumLon = 0;
	for (const loc of group) {
		sumLat += loc.latitude;
		sumLon += loc.longitude;
	}

	// Erstelle das konsolidierte Objekt
	const consolidated: ConsolidatedLocation = {
		latitude: sumLat / group.length,
		longitude: sumLon / group.length,
		startTimestamp: getTimestamp(group[0]),
		endTimestamp: getTimestamp(group[group.length - 1]),
		count: group.length,
		duration: getTimestamp(group[group.length - 1]) - getTimestamp(group[0]),
		addresses,
		originalLocations: group,
	};

	// Wenn verfügbar, füge Genauigkeit und Höhe hinzu (Durchschnittswerte)
	const accuracyValues = group
		.map((loc) => loc.accuracy)
		.filter((acc): acc is number => acc !== undefined);

	if (accuracyValues.length > 0) {
		consolidated.accuracy =
			accuracyValues.reduce((sum, val) => sum + val, 0) / accuracyValues.length;
	}

	const altitudeValues = group
		.map((loc) => loc.altitude)
		.filter((alt): alt is number => alt !== undefined);

	if (altitudeValues.length > 0) {
		consolidated.altitude =
			altitudeValues.reduce((sum, val) => sum + val, 0) / altitudeValues.length;
	}

	consolidatedLocations.push(consolidated);
}

/**
 * Hilfreiche Funktion zum Formatieren der Dauer in Minuten und Stunden
 */
export function formatDuration(durationMs: number): string {
	const seconds = Math.floor(durationMs / 1000);
	const minutes = Math.floor(seconds / 60);
	const hours = Math.floor(minutes / 60);

	if (hours > 0) {
		const remainingMinutes = minutes % 60;
		return `${hours} Std${hours !== 1 ? 'n' : ''} ${remainingMinutes > 0 ? remainingMinutes + ' Min' : ''}`;
	} else if (minutes > 0) {
		return `${minutes} Min${minutes !== 1 ? '' : 'ute'}`;
	} else {
		return 'Weniger als 1 Minute';
	}
}

/**
 * Filtert konsolidierte Standorte nach Häufigkeit
 * @param locations Array der konsolidierten Standorte
 * @param minCount Minimale Anzahl an Besuchen
 * @returns Array der gefilterten Standorte
 */
export function filterFrequentLocations(
	locations: ConsolidatedLocation[],
	minCount: number = 20
): ConsolidatedLocation[] {
	return locations.filter((location) => location.count >= minCount);
}

/**
 * Generiert eine eindeutige ID für einen Ort
 */
export function generatePlaceId(): string {
	return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}
