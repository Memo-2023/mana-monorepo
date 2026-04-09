/**
 * Inventar module — collection accessors and guest seed data.
 *
 * Uses prefixed table names in the unified DB: invCollections, invItems, invLocations, invCategories.
 */

import { db } from '$lib/data/database';
import type { LocalCollection, LocalItem, LocalLocation, LocalCategory } from './types';

// ─── Collection Accessors ──────────────────────────────────

export const invCollectionTable = db.table<LocalCollection>('invCollections');
export const invItemTable = db.table<LocalItem>('invItems');
export const invLocationTable = db.table<LocalLocation>('invLocations');
export const invCategoryTable = db.table<LocalCategory>('invCategories');

// ─── Guest Seed ────────────────────────────────────────────

const DEMO_COLLECTION_ID = 'demo-electronics';
const DEMO_LOCATION_ID = 'demo-home';
const DEMO_CATEGORY_ID = 'demo-tech';

export const INVENTORY_GUEST_SEED = {
	invCollections: [
		{
			id: DEMO_COLLECTION_ID,
			name: 'Meine Elektronik',
			description: 'Beispiel-Sammlung zum Kennenlernen von Inventar.',
			icon: '💻',
			color: '#3b82f6',
			schema: {
				fields: [
					{ id: 'brand', name: 'Marke', type: 'text', order: 0 },
					{ id: 'model', name: 'Modell', type: 'text', order: 1 },
					{ id: 'serial', name: 'Seriennummer', type: 'text', order: 2 },
				],
			},
			order: 0,
			itemCount: 2,
		},
	],
	invItems: [
		{
			id: 'item-laptop',
			collectionId: DEMO_COLLECTION_ID,
			locationId: DEMO_LOCATION_ID,
			categoryId: DEMO_CATEGORY_ID,
			name: 'MacBook Pro',
			description: 'Arbeits-Laptop',
			status: 'owned' as const,
			quantity: 1,
			fieldValues: { brand: 'Apple', model: 'MacBook Pro 14"', serial: 'ABC123' },
			photos: [],
			notes: [],
			tags: ['arbeit'],
			order: 0,
		},
		{
			id: 'item-headphones',
			collectionId: DEMO_COLLECTION_ID,
			locationId: DEMO_LOCATION_ID,
			name: 'Kopfhorer',
			description: 'Noise-Cancelling Kopfhorer',
			status: 'owned' as const,
			quantity: 1,
			fieldValues: { brand: 'Sony', model: 'WH-1000XM5' },
			photos: [],
			notes: [],
			tags: ['audio'],
			order: 1,
		},
	],
	invLocations: [
		{
			id: DEMO_LOCATION_ID,
			name: 'Zuhause',
			description: 'Mein Zuhause',
			icon: '🏠',
			path: 'Zuhause',
			depth: 0,
			order: 0,
		},
		{
			id: 'demo-office',
			parentId: DEMO_LOCATION_ID,
			name: 'Buro',
			icon: '🖥️',
			path: 'Zuhause/Buro',
			depth: 1,
			order: 0,
		},
	],
	invCategories: [
		{
			id: DEMO_CATEGORY_ID,
			name: 'Technik',
			icon: '⚡',
			color: '#6366f1',
			order: 0,
		},
		{
			id: 'demo-audio',
			name: 'Audio',
			icon: '🎧',
			color: '#ec4899',
			order: 1,
		},
	],
};
