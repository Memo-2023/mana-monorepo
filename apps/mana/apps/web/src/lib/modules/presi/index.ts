/**
 * Presi module — barrel exports.
 */

export { decksStore } from './stores/decks.svelte';
export { presiDeckTable, slideTable, PRESI_GUEST_SEED } from './collections';
export {
	useAllDecks,
	useDeck,
	useDeckSlides,
	toDeck,
	toSlide,
	findDeckById,
	getSlideCount,
} from './queries';
export type {
	LocalDeck,
	LocalSlide,
	SlideContent,
	Deck,
	Slide,
	CreateDeckDto,
	UpdateDeckDto,
	CreateSlideDto,
	UpdateSlideDto,
} from './types';
