import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState, type AppStateStatus } from 'react-native';

import { getLocationHistory, type LocationData } from './locationService';
import { logInfo, logWarning, logError } from './logService';
import { apiFetch, getAuthToken } from './apiClient';
import type { LocationSyncItem, LocationSyncResponse } from '@traces/types';

const LAST_SYNC_KEY = 'last_sync_timestamp';
const SYNC_INTERVAL_MS = 15 * 60 * 1000; // 15 minutes

let syncTimer: ReturnType<typeof setInterval> | null = null;
let appStateSubscription: ReturnType<typeof AppState.addEventListener> | null = null;

/**
 * Convert mobile LocationData to sync format
 */
function toSyncItem(location: LocationData): LocationSyncItem {
	return {
		id: location.id,
		latitude: location.latitude,
		longitude: location.longitude,
		recordedAt: location.timestamps?.recorded || new Date(location.timestamp || 0).toISOString(),
		accuracy: location.accuracy,
		altitude: location.altitude,
		speed: location.speed,
		source: location.metadata?.source || 'foreground',
		deviceMotion: location.metadata?.deviceMotion,
		addressFormatted: location.address?.formatted,
		street: location.address?.components?.street,
		houseNumber: location.address?.components?.houseNumber,
		city: location.address?.components?.city,
		postalCode: location.address?.components?.postalCode,
		country: location.address?.components?.country,
		countryCode: location.address?.components?.countryCode,
	};
}

/**
 * Get the timestamp of the last successful sync
 */
export async function getLastSyncTimestamp(): Promise<number | null> {
	const value = await AsyncStorage.getItem(LAST_SYNC_KEY);
	return value ? parseInt(value, 10) : null;
}

/**
 * Sync unsynced locations to the backend
 */
export async function syncLocations(): Promise<LocationSyncResponse | null> {
	try {
		const token = await getAuthToken();
		if (!token) {
			logInfo('Sync übersprungen: nicht angemeldet');
			return null;
		}

		const lastSync = await getLastSyncTimestamp();
		const allLocations = await getLocationHistory();

		// Filter to unsynced locations (after last sync timestamp)
		const unsyncedLocations = lastSync
			? allLocations.filter((loc) => {
					const ts = loc.timestamps?.recordedMs || loc.timestamp || 0;
					return ts > lastSync;
				})
			: allLocations;

		if (unsyncedLocations.length === 0) {
			logInfo('Keine neuen Standorte zum Synchronisieren');
			return { synced: 0, duplicates: 0 };
		}

		logInfo(`Synchronisiere ${unsyncedLocations.length} Standorte...`);

		// Send in batches of 100
		let totalSynced = 0;
		let totalDuplicates = 0;
		const batchSize = 100;

		for (let i = 0; i < unsyncedLocations.length; i += batchSize) {
			const batch = unsyncedLocations.slice(i, i + batchSize);
			const syncItems = batch.map(toSyncItem);

			const result = await apiFetch<LocationSyncResponse>('/api/v1/locations/sync', {
				method: 'POST',
				body: JSON.stringify({ locations: syncItems }),
			});

			totalSynced += result.synced;
			totalDuplicates += result.duplicates;
		}

		// Update last sync timestamp
		await AsyncStorage.setItem(LAST_SYNC_KEY, Date.now().toString());

		logInfo('Synchronisierung abgeschlossen', {
			synced: totalSynced,
			duplicates: totalDuplicates,
		});

		return { synced: totalSynced, duplicates: totalDuplicates };
	} catch (error) {
		logError('Synchronisierung fehlgeschlagen', error);
		return null;
	}
}

/**
 * Start periodic sync and app-state-based sync
 */
export function startAutoSync() {
	// Sync on app foreground
	appStateSubscription = AppState.addEventListener('change', (nextState: AppStateStatus) => {
		if (nextState === 'active') {
			syncLocations().catch(() => {});
		}
	});

	// Periodic sync every 15 minutes
	syncTimer = setInterval(() => {
		syncLocations().catch(() => {});
	}, SYNC_INTERVAL_MS);

	logInfo('Auto-Sync gestartet (alle 15 Minuten)');
}

/**
 * Stop auto-sync
 */
export function stopAutoSync() {
	if (syncTimer) {
		clearInterval(syncTimer);
		syncTimer = null;
	}
	if (appStateSubscription) {
		appStateSubscription.remove();
		appStateSubscription = null;
	}
	logInfo('Auto-Sync gestoppt');
}
