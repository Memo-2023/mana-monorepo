/**
 * Decks Store — Mutation-Only
 *
 * Reads are handled by useLiveQuery hooks in queries.ts.
 * This store only handles writes (create, update, delete).
 */

import type {
	CreateDeckDto,
	UpdateDeckDto,
	CreateSlideDto,
	UpdateSlideDto,
	Deck,
	Slide,
} from '@presi/shared';
import {
	deckCollection,
	slideCollection,
	type LocalDeck,
	type LocalSlide,
} from '$lib/data/local-store';
import { toDeck, toSlide } from '$lib/data/queries';

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
			const inserted = await deckCollection.insert(newLocal);
			return toDeck(inserted);
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
			if (dto.isPublic !== undefined) localUpdates.isPublic = dto.isPublic;

			await deckCollection.update(id, localUpdates);
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
			// Delete all slides belonging to this deck
			const slides = await slideCollection.getAll({ deckId: id });
			for (const slide of slides) {
				await slideCollection.delete(slide.id);
			}

			await deckCollection.delete(id);
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
			const existingSlides = await slideCollection.getAll({ deckId });
			const order = dto.order ?? existingSlides.length + 1;
			const newLocal: LocalSlide = {
				id: crypto.randomUUID(),
				deckId,
				order,
				content: dto.content,
			};
			const inserted = await slideCollection.insert(newLocal);
			return toSlide(inserted);
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

			await slideCollection.update(id, localUpdates);
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
			await slideCollection.delete(id);
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
			for (const { id, order } of slides) {
				await slideCollection.update(id, { order });
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
