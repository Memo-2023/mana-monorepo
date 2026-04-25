/**
 * Deck Store — Mutations Only
 *
 * Reads come from liveQuery hooks in queries.ts.
 * This store only handles writes to IndexedDB via the unified database.
 */

import { CardsEvents } from '@mana/shared-utils/analytics';
import { db } from '$lib/data/database';
import { cardDeckTable, cardTable } from '../collections';
import { toDeck } from '../queries';
import { encryptRecord, decryptRecord } from '$lib/data/crypto';
import { emitDomainEvent } from '$lib/data/events';
import { getActiveSpace } from '$lib/data/scope';
import { getEffectiveUserId } from '$lib/data/current-user';
import { defaultVisibilityFor, type VisibilityLevel } from '@mana/shared-privacy';
import { createBlock, updateBlock } from '$lib/data/time-blocks/service';
import type { LocalDeck } from '../types';
import type { Deck, CreateDeckInput, UpdateDeckInput } from '../types';

let error = $state<string | null>(null);

export const deckStore = {
	get error() {
		return error;
	},

	async createDeck(input: CreateDeckInput): Promise<Deck | null> {
		error = null;
		try {
			const initialPublic = input.isPublic ?? false;
			const newLocal: LocalDeck = {
				id: crypto.randomUUID(),
				name: input.title,
				description: input.description ?? null,
				color: '#6366f1',
				cardCount: 0,
				isPublic: initialPublic,
				// Initialize the unified field too — if the create flow set
				// isPublic, mirror it as 'public'; otherwise space-default.
				visibility: initialPublic ? 'public' : defaultVisibilityFor(getActiveSpace()?.type),
			};

			const plaintextSnapshot = toDeck(newLocal);
			await encryptRecord('cardDecks', newLocal);
			await cardDeckTable.add(newLocal);
			CardsEvents.deckCreated();
			return plaintextSnapshot;
		} catch (err: any) {
			error = err.message || 'Failed to create deck';
			console.error('Create deck error:', err);
			return null;
		}
	},

	async updateDeck(id: string, updates: UpdateDeckInput) {
		error = null;
		try {
			const localUpdates: Partial<LocalDeck> = {};
			if (updates.title !== undefined) localUpdates.name = updates.title;
			if (updates.description !== undefined) localUpdates.description = updates.description;
			if (updates.isPublic !== undefined) {
				// Legacy callers still pass isPublic — mirror to visibility
				// so the unified field stays in sync until M6.1 hard-drop.
				localUpdates.isPublic = updates.isPublic;
				localUpdates.visibility = updates.isPublic ? 'public' : 'space';
			}

			const diff: Partial<LocalDeck> = {
				...localUpdates,
				updatedAt: new Date().toISOString(),
			};
			await encryptRecord('cardDecks', diff);
			await cardDeckTable.update(id, diff);
		} catch (err: any) {
			error = err.message || 'Failed to update deck';
			console.error('Update deck error:', err);
		}
	},

	/**
	 * Flip a deck's visibility. M6 soft-migration: writes both
	 * `visibility` and the legacy `isPublic` mirror so the picker
	 * coexists with the older "public" badge UI until M6.1 hard-drop.
	 */
	async setVisibility(id: string, next: VisibilityLevel) {
		const existing = await cardDeckTable.get(id);
		if (!existing) throw new Error(`Deck ${id} not found`);
		const before: VisibilityLevel = existing.visibility ?? (existing.isPublic ? 'public' : 'space');
		if (before === next) return;

		const stamp = new Date().toISOString();
		await cardDeckTable.update(id, {
			visibility: next,
			isPublic: next === 'public',
			visibilityChangedAt: stamp,
			visibilityChangedBy: getEffectiveUserId(),
			updatedAt: stamp,
		});

		emitDomainEvent('VisibilityChanged', 'cards', 'cardDecks', id, {
			recordId: id,
			collection: 'cardDecks',
			before,
			after: next,
		});
	},

	async deleteDeck(id: string) {
		error = null;
		try {
			const now = new Date().toISOString();

			// Atomic cascade: deck + all child cards are soft-deleted in one
			// Dexie transaction. If any write fails, the whole operation aborts —
			// no orphaned cards left pointing at a deleted deck.
			await db.transaction('rw', cardDeckTable, cardTable, async () => {
				const cards = await cardTable.where('deckId').equals(id).toArray();
				for (const card of cards) {
					await cardTable.update(card.id, { deletedAt: now, updatedAt: now });
				}
				await cardDeckTable.update(id, { deletedAt: now, updatedAt: now });
			});
			CardsEvents.deckDeleted();
		} catch (err: any) {
			error = err.message || 'Failed to delete deck';
			console.error('Delete deck error:', err);
		}
	},

	async startStudySession(deckId: string): Promise<string | null> {
		const deck = await cardDeckTable.get(deckId);
		if (!deck) return null;

		// Don't start a second session if one is already active
		if (deck.activeStudyBlockId) return deck.activeStudyBlockId;

		const decrypted = await decryptRecord('cardDecks', { ...deck });
		const deckName = decrypted?.name ?? 'Deck';
		const now = new Date().toISOString();

		const timeBlockId = await createBlock({
			startDate: now,
			endDate: null,
			isLive: true,
			kind: 'logged',
			type: 'study',
			sourceModule: 'cards',
			sourceId: deckId,
			title: `${deckName} lernen`,
			color: '#0ea5e9',
		});

		await cardDeckTable.update(deckId, {
			activeStudyBlockId: timeBlockId,
			lastStudied: now,
			updatedAt: now,
		});

		return timeBlockId;
	},

	async endStudySession(deckId: string): Promise<void> {
		const deck = await cardDeckTable.get(deckId);
		if (!deck?.activeStudyBlockId) return;

		const now = new Date().toISOString();
		await updateBlock(deck.activeStudyBlockId, {
			endDate: now,
			isLive: false,
		});

		await cardDeckTable.update(deckId, {
			activeStudyBlockId: null,
			updatedAt: now,
		});
	},

	clearError() {
		error = null;
	},
};
