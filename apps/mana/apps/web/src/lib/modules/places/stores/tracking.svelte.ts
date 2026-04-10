/**
 * Tracking Store — Browser Geolocation API wrapper with Svelte 5 runes.
 *
 * Tracks the user's position via watchPosition and periodically logs
 * entries to IndexedDB. Also detects proximity to known places.
 */

import { decryptRecords, encryptRecord } from '$lib/data/crypto';
import { createBlock } from '$lib/data/time-blocks/service';
import { locationLogTable, placeTable } from '../collections';
import { getDistanceKm, findNearestPlace, toPlace } from '../queries';
import { reverseGeocode, formatAddress } from '../geocoding';
import type { LocalLocationLog, LocalPlace } from '../types';

// ─── State ──────────────────────────────────────────────

let isTracking = $state(false);
let currentPosition = $state<GeolocationPosition | null>(null);
let error = $state<string | null>(null);
let permissionState = $state<string>('unknown');

let _watchId: number | null = null;
let _lastLogTime = 0;

/** Minimum seconds between log entries (default: 5 minutes). */
const LOG_INTERVAL_MS = 5 * 60 * 1000;

// ─── Permission Check ───────────────────────────────────

async function checkPermission(): Promise<string> {
	try {
		const result = await navigator.permissions.query({ name: 'geolocation' });
		permissionState = result.state;
		result.addEventListener('change', () => {
			permissionState = result.state;
		});
		return result.state;
	} catch {
		permissionState = 'unknown';
		return 'unknown';
	}
}

// ─── Core Tracking ──────────────────────────────────────

function startTracking() {
	if (isTracking || !navigator.geolocation) return;

	error = null;
	isTracking = true;

	_watchId = navigator.geolocation.watchPosition(
		async (pos) => {
			currentPosition = pos;
			error = null;

			const now = Date.now();
			if (now - _lastLogTime >= LOG_INTERVAL_MS) {
				_lastLogTime = now;
				await logPosition(pos);
			}
		},
		(err) => {
			error = err.message;
		},
		{
			enableHighAccuracy: false,
			maximumAge: 60_000,
			timeout: 30_000,
		}
	);

	checkPermission();
}

function stopTracking() {
	if (_watchId !== null) {
		navigator.geolocation.clearWatch(_watchId);
		_watchId = null;
	}
	isTracking = false;
}

async function getCurrentPosition(): Promise<GeolocationPosition | null> {
	if (!navigator.geolocation) {
		error = 'Geolocation wird nicht unterstuetzt';
		return null;
	}

	return new Promise((resolve) => {
		navigator.geolocation.getCurrentPosition(
			(pos) => {
				currentPosition = pos;
				error = null;
				resolve(pos);
			},
			(err) => {
				error = err.message;
				resolve(null);
			},
			{ enableHighAccuracy: false, maximumAge: 60_000, timeout: 15_000 }
		);
	});
}

// ─── Log to IndexedDB ───────────────────────────────────

async function logPosition(pos: GeolocationPosition) {
	const lat = pos.coords.latitude;
	const lng = pos.coords.longitude;

	// Check proximity to known places. lat/lng on `places` stay plaintext
	// (see registry.ts) so the proximity matcher works during background
	// geolocation logging even before the vault is unlocked. We still
	// decrypt so that nearest.name etc. is usable downstream.
	const allLocals = await placeTable.toArray();
	const visible = allLocals.filter((p) => !p.deletedAt);
	const decrypted = await decryptRecords<LocalPlace>('places', visible);
	const places = decrypted.map(toPlace);
	const nearest = findNearestPlace(places, lat, lng);

	const log: LocalLocationLog = {
		id: crypto.randomUUID(),
		latitude: lat,
		longitude: lng,
		accuracy: pos.coords.accuracy ?? undefined,
		altitude: pos.coords.altitude ?? undefined,
		speed: pos.coords.speed ?? undefined,
		heading: pos.coords.heading ?? undefined,
		timestamp: new Date(pos.timestamp).toISOString(),
		placeId: nearest?.id,
		createdAt: new Date().toISOString(),
		updatedAt: new Date().toISOString(),
	};

	await encryptRecord('locationLogs', log);
	await locationLogTable.add(log);

	// Update visit count on the matched place + create TimeBlock
	if (nearest) {
		const local = await placeTable.get(nearest.id);
		if (local) {
			const updates: Partial<LocalPlace> = {
				visitCount: (local.visitCount ?? 0) + 1,
				lastVisitedAt: log.timestamp,
				updatedAt: new Date().toISOString(),
			};

			// Auto-fill address via reverse geocoding if the place has none
			if (!local.address) {
				reverseGeocode(lat, lng).then(async (result) => {
					if (result) {
						const addr = formatAddress(result.address);
						if (addr) {
							const rec: Partial<LocalPlace> = { address: addr };
							await encryptRecord('places', rec);
							await placeTable.update(nearest.id, {
								address: rec.address,
								updatedAt: new Date().toISOString(),
							});
						}
					}
				});
			}

			await placeTable.update(nearest.id, updates);

			await createBlock({
				startDate: log.timestamp,
				endDate: log.timestamp,
				kind: 'logged',
				type: 'visit',
				sourceModule: 'places',
				sourceId: nearest.id,
				title: nearest.name,
				color: '#a855f7',
			});
		}
	}
}

// ─── Force-Log (ignores interval) ───────────────────────

async function logNow() {
	if (!currentPosition) {
		const pos = await getCurrentPosition();
		if (pos) {
			_lastLogTime = Date.now();
			await logPosition(pos);
		}
		return;
	}
	_lastLogTime = Date.now();
	await logPosition(currentPosition);
}

// ─── Exports ────────────────────────────────────────────

export const trackingStore = {
	get isTracking() {
		return isTracking;
	},
	get currentPosition() {
		return currentPosition;
	},
	get error() {
		return error;
	},
	get permissionState() {
		return permissionState;
	},
	startTracking,
	stopTracking,
	getCurrentPosition,
	checkPermission,
	logNow,
};
