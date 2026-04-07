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
import { encryptRecord } from '$lib/data/crypto';
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
				isPublic: false,
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
			const localUpdates: Partial<LocalDeck> & { updatedAt: string } = {
				updatedAt: new Date().toISOString(),
			};
			if (dto.title !== undefined) localUpdates.title = dto.title;
			if (dto.description !== undefined) localUpdates.description = dto.description;
			if (dto.themeId !== undefined) localUpdates.themeId = dto.themeId;
			if (dto.isPublic !== undefined) localUpdates.isPublic = dto.isPublic;

			await encryptRecord('presiDecks', localUpdates);
			await presiDeckTable.update(id, localUpdates);
			return true;
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to update deck';
			console.error('Failed to update deck:', e);
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
					await slideTable.update(slide.id, { deletedAt: now, updatedAt: now });
				}
				await presiDeckTable.update(id, { deletedAt: now, updatedAt: now });
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
			const localUpdates: Partial<LocalSlide> & { updatedAt: string } = {
				updatedAt: new Date().toISOString(),
			};
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
			await slideTable.update(id, { deletedAt: now, updatedAt: now });
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
				await slideTable.update(id, { order, updatedAt: now });
			}
			return true;
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to reorder slides';
			console.error('Failed to reorder slides:', e);
			return false;
		}
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
		deleteDeck,
		createSlide,
		updateSlide,
		deleteSlide,
		reorderSlides,
	};
}

export const decksStore = createDecksStore();
