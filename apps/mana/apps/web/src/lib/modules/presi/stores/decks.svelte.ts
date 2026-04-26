/**
 * Decks Store — Mutation-Only
 *
 * Reads are handled by liveQuery hooks in queries.ts.
 * This store only handles writes to IndexedDB via the unified database.
 */

import { db } from '$lib/data/database';
import { presiDeckTable, slideTable } from '../collections';
import { toDeck, toSlide } from '../queries';
import { PresiEvents } from '@mana/shared-utils/analytics';
import { encryptRecord, decryptRecord } from '$lib/data/crypto';
import { emitDomainEvent } from '$lib/data/events';
import { getActiveSpace } from '$lib/data/scope';
import { getEffectiveUserId } from '$lib/data/current-user';
import { defaultVisibilityFor, type VisibilityLevel } from '@mana/shared-privacy';
import { createBlock, updateBlock } from '$lib/data/time-blocks/service';
import type {
	LocalDeck,
	LocalSlide,
	Deck,
	Slide,
	CreateDeckDto,
	UpdateDeckDto,
	CreateSlideDto,
	UpdateSlideDto,
} from '../types';

let isLoading = $state(false);
let error = $state<string | null>(null);

function createDecksStore() {
	async function createDeck(dto: CreateDeckDto): Promise<Deck | null> {
		isLoading = true;
		error = null;
		try {
			const newLocal: LocalDeck = {
				id: crypto.randomUUID(),
				title: dto.title,
				description: dto.description || null,
				themeId: dto.themeId || null,
				visibility: defaultVisibilityFor(getActiveSpace()?.type),
			};
			const plaintextSnapshot = toDeck(newLocal);
			await encryptRecord('presiDecks', newLocal);
			await presiDeckTable.add(newLocal);
			PresiEvents.deckCreated();
			return plaintextSnapshot;
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to create deck';
			console.error('Failed to create deck:', e);
			return null;
		} finally {
			isLoading = false;
		}
	}

	async function updateDeck(id: string, dto: UpdateDeckDto): Promise<boolean> {
		error = null;
		try {
			const localUpdates: Partial<LocalDeck> = {};
			if (dto.title !== undefined) localUpdates.title = dto.title;
			if (dto.description !== undefined) localUpdates.description = dto.description;
			if (dto.themeId !== undefined) localUpdates.themeId = dto.themeId;

			await encryptRecord('presiDecks', localUpdates);
			await presiDeckTable.update(id, localUpdates);
			return true;
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to update deck';
			console.error('Failed to update deck:', e);
			return false;
		}
	}

	async function setVisibility(id: string, next: VisibilityLevel): Promise<boolean> {
		try {
			const existing = await presiDeckTable.get(id);
			if (!existing) return false;
			const before: VisibilityLevel = existing.visibility ?? 'space';
			if (before === next) return true;
			const stamp = new Date().toISOString();
			await presiDeckTable.update(id, {
				visibility: next,
				visibilityChangedAt: stamp,
				visibilityChangedBy: getEffectiveUserId(),
				updatedAt: stamp,
			});
			emitDomainEvent('VisibilityChanged', 'presi', 'presiDecks', id, {
				recordId: id,
				collection: 'presiDecks',
				before,
				after: next,
			});
			return true;
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to set visibility';
			return false;
		}
	}

	async function deleteDeck(id: string): Promise<boolean> {
		error = null;
		try {
			const now = new Date().toISOString();
			// Atomic cascade: deck + all slides in one Dexie transaction.
			await db.transaction('rw', presiDeckTable, slideTable, async () => {
				const slides = await slideTable.where('deckId').equals(id).toArray();
				for (const slide of slides) {
					await slideTable.update(slide.id, { deletedAt: now });
				}
				await presiDeckTable.update(id, { deletedAt: now });
			});
			PresiEvents.deckDeleted();
			return true;
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to delete deck';
			console.error('Failed to delete deck:', e);
			return false;
		}
	}

	async function createSlide(deckId: string, dto: CreateSlideDto): Promise<Slide | null> {
		error = null;
		try {
			const existingSlides = await slideTable.where('deckId').equals(deckId).toArray();
			const activeSlides = existingSlides.filter((s) => !s.deletedAt);
			const order = dto.order ?? activeSlides.length + 1;
			const newLocal: LocalSlide = {
				id: crypto.randomUUID(),
				deckId,
				order,
				content: dto.content,
			};
			const plaintextSnapshot = toSlide(newLocal);
			await encryptRecord('slides', newLocal);
			await slideTable.add(newLocal);
			PresiEvents.slideCreated();
			return plaintextSnapshot;
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to create slide';
			console.error('Failed to create slide:', e);
			return null;
		}
	}

	async function updateSlide(id: string, dto: UpdateSlideDto): Promise<boolean> {
		error = null;
		try {
			const localUpdates: Partial<LocalSlide> = {};
			if (dto.content !== undefined) localUpdates.content = dto.content;
			if (dto.order !== undefined) localUpdates.order = dto.order;

			await encryptRecord('slides', localUpdates);
			await slideTable.update(id, localUpdates);
			return true;
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to update slide';
			console.error('Failed to update slide:', e);
			return false;
		}
	}

	async function deleteSlide(id: string): Promise<boolean> {
		error = null;
		try {
			const now = new Date().toISOString();
			await slideTable.update(id, { deletedAt: now });
			PresiEvents.slideDeleted();
			return true;
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to delete slide';
			console.error('Failed to delete slide:', e);
			return false;
		}
	}

	async function reorderSlides(slides: { id: string; order: number }[]): Promise<boolean> {
		error = null;
		try {
			const now = new Date().toISOString();
			for (const { id, order } of slides) {
				await slideTable.update(id, { order });
			}
			return true;
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to reorder slides';
			console.error('Failed to reorder slides:', e);
			return false;
		}
	}

	async function startRehearsal(deckId: string): Promise<string | null> {
		const deck = await presiDeckTable.get(deckId);
		if (!deck) return null;
		if (deck.activeRehearsalBlockId) return deck.activeRehearsalBlockId;

		const decrypted = await decryptRecord('presiDecks', { ...deck });
		const deckTitle = decrypted?.title ?? 'Präsentation';
		const now = new Date().toISOString();

		const timeBlockId = await createBlock({
			startDate: now,
			endDate: null,
			isLive: true,
			kind: 'logged',
			type: 'rehearsal',
			sourceModule: 'presi',
			sourceId: deckId,
			title: `${deckTitle} — Probe`,
			color: '#84cc16',
		});

		await presiDeckTable.update(deckId, {
			activeRehearsalBlockId: timeBlockId,
		});

		return timeBlockId;
	}

	async function endRehearsal(deckId: string): Promise<void> {
		const deck = await presiDeckTable.get(deckId);
		if (!deck?.activeRehearsalBlockId) return;

		const now = new Date().toISOString();
		await updateBlock(deck.activeRehearsalBlockId, {
			endDate: now,
			isLive: false,
		});

		await presiDeckTable.update(deckId, {
			activeRehearsalBlockId: null,
		});
	}

	return {
		get isLoading() {
			return isLoading;
		},
		get error() {
			return error;
		},
		createDeck,
		updateDeck,
		setVisibility,
		deleteDeck,
		createSlide,
		updateSlide,
		deleteSlide,
		reorderSlides,
		startRehearsal,
		endRehearsal,
	};
}

export const decksStore = createDecksStore();
