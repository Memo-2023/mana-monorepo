/**
 * Inventar — Local-First Data Layer
 *
 * Migrates from localStorage to IndexedDB (Dexie.js) with sync support.
 * Collections, items, locations, and categories are stored locally.
 */

import { createLocalStore, type BaseRecord } from '@manacore/local-store';
import { guestCollections, guestItems, guestLocations, guestCategories } from './guest-seed';

// ─── Types ──────────────────────────────────────────────────

export interface LocalCollection extends BaseRecord {
	name: string;
	description?: string | null;
	icon?: string | null;
	color?: string | null;
	schema: {
		fields: Array<{
			id: string;
			name: string;
			type: string;
			required?: boolean;
			defaultValue?: unknown;
			options?: string[];
			currencyCode?: string;
			placeholder?: string;
			order: number;
		}>;
	};
	templateId?: string | null;
	order: number;
	itemCount: number;
}

export interface LocalItem extends BaseRecord {
	collectionId: string;
	locationId?: string | null;
	categoryId?: string | null;
	name: string;
	description?: string | null;
	status: 'owned' | 'lent' | 'stored' | 'for_sale' | 'disposed';
	quantity: number;
	fieldValues: Record<string, unknown>;
	purchaseData?: {
		price?: number;
		currency?: string;
		date?: string;
		retailer?: string;
		warrantyExpiry?: string;
	} | null;
	photos: Array<{ id: string; url: string; caption?: string; order: number }>;
	notes: Array<{ id: string; content: string; createdAt: string }>;
	tags: string[];
	order: number;
}

export interface LocalLocation extends BaseRecord {
	parentId?: string | null;
	name: string;
	description?: string | null;
	icon?: string | null;
	path: string;
	depth: number;
	order: number;
}

export interface LocalCategory extends BaseRecord {
	parentId?: string | null;
	name: string;
	icon?: string | null;
	color?: string | null;
	order: number;
}

// ─── Store ──────────────────────────────────────────────────

const SYNC_SERVER_URL = import.meta.env.PUBLIC_SYNC_SERVER_URL || 'http://localhost:3050';

export const inventarStore = createLocalStore({
	appId: 'inventar',
	collections: [
		{
			name: 'collections',
			indexes: ['order', 'templateId'],
			guestSeed: guestCollections,
		},
		{
			name: 'items',
			indexes: [
				'collectionId',
				'locationId',
				'categoryId',
				'status',
				'name',
				'[collectionId+order]',
			],
			guestSeed: guestItems,
		},
		{
			name: 'locations',
			indexes: ['parentId', 'path', 'depth', 'order'],
			guestSeed: guestLocations,
		},
		{
			name: 'categories',
			indexes: ['parentId', 'order'],
			guestSeed: guestCategories,
		},
	],
	sync: {
		serverUrl: SYNC_SERVER_URL,
	},
});

// Typed collection accessors
export const collectionCollection = inventarStore.collection<LocalCollection>('collections');
export const itemCollection = inventarStore.collection<LocalItem>('items');
export const locationCollection = inventarStore.collection<LocalLocation>('locations');
export const categoryCollection = inventarStore.collection<LocalCategory>('categories');
