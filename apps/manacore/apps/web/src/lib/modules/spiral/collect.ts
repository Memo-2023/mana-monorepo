/**
 * Cross-App Activity Collector
 *
 * Reads from all cross-app IndexedDB readers and produces
 * AppSnapshot objects for the Mana Spiral.
 */

import { MANA_APP_INDEX } from '@manacore/spiral-db';
import {
	crossTaskCollection,
	crossEventCollection,
	crossContactCollection,
	crossConversationCollection,
	crossFavoriteCollection,
	crossImageCollection,
	crossAlarmCollection,
	crossFileCollection,
	crossSongCollection,
	crossPresiDeckCollection,
	crossSpaceCollection,
	crossCardsDeckCollection,
	crossCardsCardCollection,
	type CrossAppTask,
	type CrossAppContact,
	type CrossAppImage,
} from '$lib/data/cross-app-stores';
import type { AppSnapshot } from './stores/mana-spiral.svelte';

/**
 * Collect snapshots from all cross-app readers.
 * Each collection is read once and summarized into an AppSnapshot.
 */
export async function collectAppSnapshots(): Promise<AppSnapshot[]> {
	const snapshots: AppSnapshot[] = [];

	// Run all reads in parallel
	const [
		tasks,
		events,
		contacts,
		conversations,
		favorites,
		images,
		alarms,
		files,
		songs,
		decks,
		spaces,
		cardDecks,
		cards,
	] = await Promise.all([
		safeGetAll(crossTaskCollection),
		safeGetAll(crossEventCollection),
		safeGetAll(crossContactCollection),
		safeGetAll(crossConversationCollection),
		safeGetAll(crossFavoriteCollection),
		safeGetAll(crossImageCollection),
		safeGetAll(crossAlarmCollection),
		safeGetAll(crossFileCollection),
		safeGetAll(crossSongCollection),
		safeGetAll(crossPresiDeckCollection),
		safeGetAll(crossSpaceCollection),
		safeGetAll(crossCardsDeckCollection),
		safeGetAll(crossCardsCardCollection),
	]);

	// Todo
	if (tasks.length > 0) {
		const completed = (tasks as CrossAppTask[]).filter((t) => t.isCompleted).length;
		snapshots.push({
			app: 'Todo',
			appIndex: MANA_APP_INDEX.todo,
			totalItems: tasks.length,
			completedItems: completed,
			favoriteItems: 0,
			label: `${tasks.length} Tasks (${completed} erledigt)`,
		});
	}

	// Calendar
	if (events.length > 0) {
		snapshots.push({
			app: 'Calendar',
			appIndex: MANA_APP_INDEX.calendar,
			totalItems: events.length,
			completedItems: 0,
			favoriteItems: 0,
			label: `${events.length} Events`,
		});
	}

	// Contacts
	if (contacts.length > 0) {
		const favs = (contacts as CrossAppContact[]).filter((c) => c.isFavorite).length;
		snapshots.push({
			app: 'Contacts',
			appIndex: MANA_APP_INDEX.contacts,
			totalItems: contacts.length,
			completedItems: 0,
			favoriteItems: favs,
			label: `${contacts.length} Kontakte`,
		});
	}

	// Chat
	if (conversations.length > 0) {
		snapshots.push({
			app: 'Chat',
			appIndex: MANA_APP_INDEX.chat,
			totalItems: conversations.length,
			completedItems: 0,
			favoriteItems: 0,
			label: `${conversations.length} Gespräche`,
		});
	}

	// Zitare
	if (favorites.length > 0) {
		snapshots.push({
			app: 'Zitare',
			appIndex: MANA_APP_INDEX.zitare,
			totalItems: favorites.length,
			completedItems: 0,
			favoriteItems: favorites.length,
			label: `${favorites.length} Favoriten`,
		});
	}

	// Picture
	if (images.length > 0) {
		const favs = (images as CrossAppImage[]).filter((i) => i.isFavorite).length;
		snapshots.push({
			app: 'Picture',
			appIndex: MANA_APP_INDEX.picture,
			totalItems: images.length,
			completedItems: 0,
			favoriteItems: favs,
			label: `${images.length} Bilder`,
		});
	}

	// Clock
	if (alarms.length > 0) {
		snapshots.push({
			app: 'Clock',
			appIndex: MANA_APP_INDEX.clock,
			totalItems: alarms.length,
			completedItems: 0,
			favoriteItems: 0,
			label: `${alarms.length} Alarme`,
		});
	}

	// Storage
	if (files.length > 0) {
		snapshots.push({
			app: 'Storage',
			appIndex: MANA_APP_INDEX.storage,
			totalItems: files.length,
			completedItems: 0,
			favoriteItems: 0,
			label: `${files.length} Dateien`,
		});
	}

	// Mukke
	if (songs.length > 0) {
		snapshots.push({
			app: 'Mukke',
			appIndex: MANA_APP_INDEX.mukke,
			totalItems: songs.length,
			completedItems: 0,
			favoriteItems: 0,
			label: `${songs.length} Songs`,
		});
	}

	// Presi
	if (decks.length > 0) {
		snapshots.push({
			app: 'Presi',
			appIndex: MANA_APP_INDEX.presi,
			totalItems: decks.length,
			completedItems: 0,
			favoriteItems: 0,
			label: `${decks.length} Präsentationen`,
		});
	}

	// Context
	if (spaces.length > 0) {
		snapshots.push({
			app: 'Context',
			appIndex: MANA_APP_INDEX.context,
			totalItems: spaces.length,
			completedItems: 0,
			favoriteItems: 0,
			label: `${spaces.length} Spaces`,
		});
	}

	// Cards
	if (cardDecks.length > 0 || cards.length > 0) {
		snapshots.push({
			app: 'Cards',
			appIndex: MANA_APP_INDEX.cards,
			totalItems: cards.length,
			completedItems: 0,
			favoriteItems: 0,
			label: `${cardDecks.length} Decks, ${cards.length} Karten`,
		});
	}

	return snapshots;
}

/**
 * Safe wrapper for collection.getAll() — returns empty array on error
 * (e.g. if the other app's DB doesn't exist yet)
 */
async function safeGetAll(collection: { getAll: () => Promise<unknown[]> }): Promise<unknown[]> {
	try {
		return await collection.getAll();
	} catch {
		return [];
	}
}
