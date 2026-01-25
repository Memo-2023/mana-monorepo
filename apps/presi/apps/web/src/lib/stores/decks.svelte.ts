import { decksApi, slidesApi } from '$lib/api/client';
import type {
	Deck,
	Slide,
	CreateDeckDto,
	UpdateDeckDto,
	CreateSlideDto,
	UpdateSlideDto,
} from '@presi/shared';

function createDecksStore() {
	let decks = $state<Deck[]>([]);
	let currentDeck = $state<Deck | null>(null);
	let currentSlides = $state<Slide[]>([]);
	let isLoading = $state(false);
	let error = $state<string | null>(null);

	async function loadDecks() {
		isLoading = true;
		error = null;
		try {
			decks = await decksApi.getAll();
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
			const data = await decksApi.getOne(id);
			currentDeck = data.deck;
			currentSlides = data.slides.sort((a, b) => a.order - b.order);
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
			const deck = await decksApi.create(dto);
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
			const updated = await decksApi.update(id, dto);
			decks = decks.map((d) => (d.id === id ? updated : d));
			if (currentDeck?.id === id) {
				currentDeck = updated;
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
			await decksApi.delete(id);
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
			const slide = await slidesApi.create(deckId, dto);
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
			const updated = await slidesApi.update(id, dto);
			currentSlides = currentSlides.map((s) => (s.id === id ? updated : s));
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
			await slidesApi.delete(id);
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
			await slidesApi.reorder({ slides });
			// Update local state
			const orderMap = new Map(slides.map((s) => [s.id, s.order]));
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
