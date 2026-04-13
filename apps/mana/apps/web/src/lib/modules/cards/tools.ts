import type { ModuleTool } from '$lib/data/tools/types';
import { cardStore } from './stores/cards.svelte';

export const cardsTools: ModuleTool[] = [
	{
		name: 'create_card',
		module: 'cards',
		description: 'Erstellt eine neue Lernkarte (Flashcard)',
		parameters: [
			{ name: 'deckId', type: 'string', description: 'ID des Decks', required: true },
			{ name: 'front', type: 'string', description: 'Vorderseite (Frage)', required: true },
			{ name: 'back', type: 'string', description: 'Rueckseite (Antwort)', required: true },
		],
		async execute(params) {
			const card = await cardStore.createCard({
				deckId: params.deckId as string,
				front: params.front as string,
				back: params.back as string,
			});
			return card
				? { success: true, data: card, message: 'Lernkarte erstellt' }
				: { success: false, message: 'Fehler beim Erstellen der Karte' };
		},
	},
];
