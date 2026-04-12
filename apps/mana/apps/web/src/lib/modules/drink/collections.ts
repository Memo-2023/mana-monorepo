/**
 * Drink module — collection accessors and guest seed data.
 *
 * Tables: drinkEntries, drinkPresets
 */

import { db } from '$lib/data/database';
import type { LocalDrinkEntry, LocalDrinkPreset } from './types';

// ─── Collection Accessors ──────────────────────────────────

export const drinkEntryTable = db.table<LocalDrinkEntry>('drinkEntries');
export const drinkPresetTable = db.table<LocalDrinkPreset>('drinkPresets');

// ─── Guest Seed ────────────────────────────────────────────

export const DRINK_GUEST_SEED = {
	drinkEntries: [] satisfies LocalDrinkEntry[],
	drinkPresets: [
		{
			id: 'drink-preset-water',
			name: 'Wasser',
			icon: 'drop',
			color: '#3b82f6',
			drinkType: 'water',
			defaultQuantityMl: 250,
			order: 0,
			isArchived: false,
		},
		{
			id: 'drink-preset-coffee',
			name: 'Kaffee',
			icon: 'coffee',
			color: '#92400e',
			drinkType: 'coffee',
			defaultQuantityMl: 200,
			order: 1,
			isArchived: false,
		},
		{
			id: 'drink-preset-tea',
			name: 'Tee',
			icon: 'coffee',
			color: '#65a30d',
			drinkType: 'tea',
			defaultQuantityMl: 250,
			order: 2,
			isArchived: false,
		},
		{
			id: 'drink-preset-juice',
			name: 'Saft',
			icon: 'orange-slice',
			color: '#f97316',
			drinkType: 'juice',
			defaultQuantityMl: 200,
			order: 3,
			isArchived: false,
		},
		{
			id: 'drink-preset-beer',
			name: 'Bier',
			icon: 'beer-stein',
			color: '#f59e0b',
			drinkType: 'beer',
			defaultQuantityMl: 330,
			order: 4,
			isArchived: false,
		},
	] satisfies LocalDrinkPreset[],
};
