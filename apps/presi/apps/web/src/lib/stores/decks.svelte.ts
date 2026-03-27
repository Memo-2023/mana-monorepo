/**
 * Decks Store — Local-First with Dexie.js
 *
 * All reads and writes go to IndexedDB first.
 * When authenticated, changes sync to the server in the background.
 * Same public API as before so components don't need changes.
 */

import type {
	Deck,
	Slide,
	CreateDeckDto,
	UpdateDeckDto,
	CreateSlideDto,
	UpdateSlideDto,
} from '@presi/shared';
import {
	deckCollection,
	slideCollection,
	type LocalDeck,
	type LocalSlide,
} from '$lib/data/local-store';

let decks = $state<Deck[]>([]);
let currentDeck = $state<Deck | null>(null);
let currentSlides = $state<Slide[]>([]);
let isLoading = $state(false);
let error = $state<string | null>(null);

/** Convert LocalDeck (IndexedDB) to shared Deck type. */
function toDeck(local: LocalDeck): Deck {
	return {
		id: local.id,
		userId: 'local',
		title: local.title,
		description: local.description ?? undefined,
		themeId: local.themeId ?? undefined,
		isPublic: local.isPublic,
		createdAt: local.createdAt ?? new Date().toISOString(),
		updatedAt: local.updatedAt ?? new Date().toISOString(),
	};
}

/** Convert LocalSlide (IndexedDB) to shared Slide type. */
function toSlide(local: LocalSlide): Slide {
	return {
		id: local.id,
		deckId: local.deckId,
		order: local.order,
		content: local.content,
		createdAt: local.createdAt ?? new Date().toISOString(),
	};
}

function createDecksStore() {
	async function loadDecks() {
		isLoading = true;
		error = null;
		try {
			const localDecks = await deckCollection.getAll();
			decks = localDecks.map(toDeck);
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to load decks';
			console.error('Failed to load decks:', e);
		} finally {
			isLoading = false;
		}
	}

	async function loadDeck(id: string) {
		isLoading = true;
		error = null;
		try {
			const localDeck = await deckCollection.get(id);
			if (localDeck) {
				currentDeck = toDeck(localDeck);
			} else {
				currentDeck = null;
				throw new Error('Deck not found');
			}
			const localSlides = await slideCollection.getAll({ deckId: id });
			currentSlides = localSlides.map(toSlide).sort((a, b) => a.order - b.order);
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to load deck';
			console.error('Failed to load deck:', e);
		} finally {
			isLoading = false;
		}
	}

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
			const deck = toDeck(inserted);
			decks = [deck, ...decks];
			return deck;
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

			const updated = await deckCollection.update(id, localUpdates);
			if (updated) {
				const updatedDeck = toDeck(updated);
				decks = decks.map((d) => (d.id === id ? updatedDeck : d));
				if (currentDeck?.id === id) {
					currentDeck = updatedDeck;
				}
			}
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
			decks = decks.filter((d) => d.id !== id);
			if (currentDeck?.id === id) {
				currentDeck = null;
				currentSlides = [];
			}
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
			const order = dto.order ?? currentSlides.length + 1;
			const newLocal: LocalSlide = {
				id: crypto.randomUUID(),
				deckId,
				order,
				content: dto.content,
			};
			const inserted = await slideCollection.insert(newLocal);
			const slide = toSlide(inserted);
			currentSlides = [...currentSlides, slide].sort((a, b) => a.order - b.order);
			return slide;
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

			const updated = await slideCollection.update(id, localUpdates);
			if (updated) {
				currentSlides = currentSlides
					.map((s) => (s.id === id ? toSlide(updated) : s))
					.sort((a, b) => a.order - b.order);
			}
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
			currentSlides = currentSlides.filter((s) => s.id !== id);
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
			const orderMap = new Map(slides.map((s) => [s.id, s.order]));
			for (const { id, order } of slides) {
				await slideCollection.update(id, { order });
			}
			currentSlides = currentSlides
				.map((s) => ({ ...s, order: orderMap.get(s.id) ?? s.order }))
				.sort((a, b) => a.order - b.order);
			return true;
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to reorder slides';
			console.error('Failed to reorder slides:', e);
			return false;
		}
	}

	function clearCurrent() {
		currentDeck = null;
		currentSlides = [];
	}

	return {
		get decks() {
			return decks;
		},
		get currentDeck() {
			return currentDeck;
		},
		get currentSlides() {
			return currentSlides;
		},
		get isLoading() {
			return isLoading;
		},
		get error() {
			return error;
		},
		loadDecks,
		loadDeck,
		createDeck,
		updateDeck,
		deleteDeck,
		createSlide,
		updateSlide,
		deleteSlide,
		reorderSlides,
		clearCurrent,
	};
}

export const decksStore = createDecksStore();
