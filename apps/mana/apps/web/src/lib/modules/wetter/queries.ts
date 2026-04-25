/**
 * Wetter module read-side — Dexie liveQuery hooks for locations.
 */

import { useScopedLiveQuery } from '$lib/data/scope/use-scoped-live-query.svelte';
import { db } from '$lib/data/database';
import { scopedForModule } from '$lib/data/scope';
import type { WeatherLocation, WeatherSettings } from './types';

export function useLocations() {
	return useScopedLiveQuery(
		() => scopedForModule<WeatherLocation, string>('wetter', 'wetterLocations').sortBy('order'),
		[] as WeatherLocation[]
	);
}

export function useDefaultLocation() {
	return useScopedLiveQuery(
		() => db.table<WeatherLocation>('wetterLocations').where('isDefault').equals(1).first(),
		undefined as WeatherLocation | undefined
	);
}

export function useSettings() {
	return useScopedLiveQuery(
		async () => {
			const settings = await db.table<WeatherSettings>('wetterSettings').get('default');
			return (
				settings ?? {
					id: 'default',
					temperatureUnit: 'celsius',
					windSpeedUnit: 'kmh',
					precipitationUnit: 'mm',
				}
			);
		},
		{
			id: 'default',
			temperatureUnit: 'celsius',
			windSpeedUnit: 'kmh',
			precipitationUnit: 'mm',
		} as WeatherSettings
	);
}
