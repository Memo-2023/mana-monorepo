/**
 * Places module — collection accessors and guest seed data.
 */

import { db } from '$lib/data/database';
import type { LocalPlace, LocalLocationLog } from './types';

// ─── Collection Accessors ──────────────────────────────────

export const placeTable = db.table<LocalPlace>('places');
export const locationLogTable = db.table<LocalLocationLog>('locationLogs');

// ─── Guest Seed ────────────────────────────────────────────

export const PLACES_GUEST_SEED = {
	places: [
		{
			id: 'guest-place-home',
			name: 'Zuhause',
			latitude: 47.6603,
			longitude: 9.1751,
			category: 'home' as const,
			isFavorite: true,
			isArchived: false,
			visitCount: 12,
			lastVisitedAt: new Date().toISOString(),
		},
		{
			id: 'guest-place-work',
			name: 'Buero',
			latitude: 47.6588,
			longitude: 9.1753,
			category: 'work' as const,
			isFavorite: false,
			isArchived: false,
			visitCount: 8,
		},
	] satisfies LocalPlace[],
	locationLogs: [] satisfies LocalLocationLog[],
};
