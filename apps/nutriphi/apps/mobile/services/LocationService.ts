import * as Location from 'expo-location';

export interface LocationData {
	latitude: number;
	longitude: number;
	accuracy: number | null;
	altitude: number | null;
	altitudeAccuracy: number | null;
	heading: number | null;
	speed: number | null;
	timestamp: number;
	address?: LocationAddress;
}

export interface LocationAddress {
	name?: string;
	street?: string;
	city?: string;
	region?: string;
	country?: string;
	postalCode?: string;
	formattedAddress?: string;
}

export class LocationService {
	private static instance: LocationService;
	private hasPermission: boolean = false;

	private constructor() {}

	public static getInstance(): LocationService {
		if (!LocationService.instance) {
			LocationService.instance = new LocationService();
		}
		return LocationService.instance;
	}

	public async checkPermissions(): Promise<boolean> {
		try {
			const { status } = await Location.getForegroundPermissionsAsync();
			this.hasPermission = status === 'granted';
			return this.hasPermission;
		} catch (error) {
			console.error('Failed to check location permissions:', error);
			return false;
		}
	}

	public async requestPermissions(): Promise<boolean> {
		try {
			const { status } = await Location.requestForegroundPermissionsAsync();
			this.hasPermission = status === 'granted';
			return this.hasPermission;
		} catch (error) {
			console.error('Failed to request location permissions:', error);
			return false;
		}
	}

	public async getCurrentLocation(): Promise<LocationData | null> {
		try {
			// Check permissions first
			if (!this.hasPermission) {
				const granted = await this.requestPermissions();
				if (!granted) {
					console.log('Location permission denied');
					return null;
				}
			}

			// Get current location with high accuracy
			const location = await Location.getCurrentPositionAsync({
				accuracy: Location.Accuracy.High,
				timeInterval: 5000, // 5 seconds
				mayShowUserSettingsDialog: true,
			});

			const locationData: LocationData = {
				latitude: location.coords.latitude,
				longitude: location.coords.longitude,
				accuracy: location.coords.accuracy,
				altitude: location.coords.altitude,
				altitudeAccuracy: location.coords.altitudeAccuracy,
				heading: location.coords.heading,
				speed: location.coords.speed,
				timestamp: location.timestamp,
			};

			// Try to get address
			try {
				const address = await this.reverseGeocode(locationData.latitude, locationData.longitude);
				locationData.address = address;
			} catch (error) {
				console.warn('Reverse geocoding failed:', error);
			}

			return locationData;
		} catch (error) {
			console.error('Failed to get current location:', error);
			return null;
		}
	}

	public async reverseGeocode(
		latitude: number,
		longitude: number
	): Promise<LocationAddress | null> {
		try {
			const results = await Location.reverseGeocodeAsync({
				latitude,
				longitude,
			});

			if (results && results.length > 0) {
				const result = results[0];

				// Build formatted address
				const addressParts = [];

				// Try to detect common places
				let placeName = result.name;
				if (!placeName && result.street) {
					placeName = result.street;
				}

				// Build formatted address
				if (result.streetNumber) addressParts.push(result.streetNumber);
				if (result.street) addressParts.push(result.street);
				const streetAddress = addressParts.join(' ');

				const cityParts = [];
				if (result.city) cityParts.push(result.city);
				if (result.region) cityParts.push(result.region);
				if (result.postalCode) cityParts.push(result.postalCode);
				const cityAddress = cityParts.join(', ');

				const formattedAddress = [streetAddress, cityAddress, result.country]
					.filter(Boolean)
					.join(', ');

				return {
					name: placeName || undefined,
					street: streetAddress || undefined,
					city: result.city || undefined,
					region: result.region || undefined,
					country: result.country || undefined,
					postalCode: result.postalCode || undefined,
					formattedAddress: formattedAddress || undefined,
				};
			}

			return null;
		} catch (error) {
			console.error('Reverse geocoding failed:', error);
			return null;
		}
	}

	public getReadableLocationName(address: LocationAddress | null): string {
		if (!address) return 'Unbekannter Ort';

		// Priority: name > street > city > region > country
		if (address.name) return address.name;
		if (address.street) return address.street;
		if (address.city) return address.city;
		if (address.region) return address.region;
		if (address.country) return address.country;

		return 'Unbekannter Ort';
	}

	public formatLocationForDisplay(address: LocationAddress | null): string {
		if (!address) return '';

		// For display in UI, show a concise version
		if (address.name && address.city) {
			return `${address.name}, ${address.city}`;
		}

		if (address.street && address.city) {
			return `${address.street}, ${address.city}`;
		}

		if (address.city) {
			return address.city;
		}

		return address.formattedAddress || 'Unbekannter Ort';
	}

	public calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
		// Haversine formula to calculate distance in meters
		const R = 6371e3; // Earth's radius in meters
		const φ1 = (lat1 * Math.PI) / 180;
		const φ2 = (lat2 * Math.PI) / 180;
		const Δφ = ((lat2 - lat1) * Math.PI) / 180;
		const Δλ = ((lon2 - lon1) * Math.PI) / 180;

		const a =
			Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
			Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
		const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

		return R * c; // Distance in meters
	}

	public isNearLocation(
		currentLat: number,
		currentLon: number,
		targetLat: number,
		targetLon: number,
		thresholdMeters: number = 100
	): boolean {
		const distance = this.calculateDistance(currentLat, currentLon, targetLat, targetLon);
		return distance <= thresholdMeters;
	}
}
