/**
 * Wishes module — collection accessors and guest seed data.
 *
 * Uses prefixed table names in the unified DB: wishesItems, wishesLists, wishesPriceChecks.
 */

import { db } from '$lib/data/database';
import type { LocalWish, LocalWishList, LocalPriceCheck } from './types';

// ─── Collection Accessors ──────────────────────────────────

export const wishTable = db.table<LocalWish>('wishesItems');
export const listTable = db.table<LocalWishList>('wishesLists');
export const priceCheckTable = db.table<LocalPriceCheck>('wishesPriceChecks');

// ─── Guest Seed ────────────────────────────────────────────

const DEMO_LIST_ID = 'demo-birthday-wishes';

export const WISHES_GUEST_SEED = {
	wishesLists: [
		{
			id: DEMO_LIST_ID,
			name: 'Geburtstagsgeschenke',
			description: 'Ideen für Geburtstag',
			icon: '🎁',
			color: '#ec4899',
			isArchived: false,
			order: 0,
		},
	],
	wishesItems: [
		{
			id: 'demo-wish-1',
			title: 'Neue Kopfhörer',
			description: 'Wireless, aktive Geräuschunterdrückung',
			listId: DEMO_LIST_ID,
			priority: 'medium' as const,
			status: 'active' as const,
			targetPrice: 150,
			currency: 'EUR',
			productUrls: [],
			imageUrl: null,
			category: 'Technik',
			tags: ['audio', 'tech'],
			notes: [],
			order: 0,
		},
		{
			id: 'demo-wish-2',
			title: 'Kochbuch — vegetarische Rezepte',
			description: 'Am liebsten asiatisch-vegetarisch',
			listId: DEMO_LIST_ID,
			priority: 'low' as const,
			status: 'active' as const,
			targetPrice: 25,
			currency: 'EUR',
			productUrls: [],
			imageUrl: null,
			category: 'Bücher',
			tags: ['books', 'cooking'],
			notes: [],
			order: 1,
		},
	],
	wishesPriceChecks: [] as Record<string, unknown>[],
};
