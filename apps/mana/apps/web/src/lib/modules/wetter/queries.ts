/**
 * Wetter module read-side — Dexie liveQuery hooks for locations.
 */

import { useLiveQueryWithDefault } from '@mana/local-store/svelte';
import { db } from '$lib/data/database';
import type { WeatherLocation, WeatherSettings } from './types';

export function useLocations() {
	return useLiveQueryWithDefault(
		() => db.table<WeatherLocation>('wetterLocations').orderBy('order').toArray(),
		[] as WeatherLocation[]
	);
}

export function useDefaultLocation() {
	return useLiveQueryWithDefault(
		() => db.table<WeatherLocation>('wetterLocations').where('isDefault').equals(1).first(),
		undefined as WeatherLocation | undefined
	);
}

export function useSettings() {
	return useLiveQueryWithDefault(
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
