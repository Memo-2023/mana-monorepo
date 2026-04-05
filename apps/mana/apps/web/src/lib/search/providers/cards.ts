import { db } from '$lib/data/database';
import { getManaApp } from '@mana/shared-branding';
import { scoreRecord, truncateSubtitle } from '../scoring';
import type { SearchProvider, SearchResult, SearchOptions } from '../types';

const app = getManaApp('cards');

export const cardsSearchProvider: SearchProvider = {
	appId: 'cards',
	appName: 'Cards',
	appIcon: app?.icon,
	appColor: app?.color,
	searchableTypes: ['deck', 'card'],

	async search(query: string, options?: SearchOptions): Promise<SearchResult[]> {
		const limit = options?.limit ?? 5;
		const results: SearchResult[] = [];

		// Search decks
		const decks = await db.table('cardDecks').toArray();
		for (const deck of decks) {
			if (deck.deletedAt) continue;
			const { score, matchedField } = scoreRecord(
				[
					{ name: 'name', value: deck.name, weight: 1.0 },
					{ name: 'description', value: deck.description, weight: 0.7 },
				],
				query
			);
			if (score > 0) {
				results.push({
					id: deck.id,
					type: 'deck',
					appId: 'cards',
					title: deck.name,
					subtitle: truncateSubtitle(deck.description) || 'Deck',
					appIcon: app?.icon,
					appColor: app?.color,
					href: `/cards/${deck.id}`,
					score,
					matchedField,
				});
			}
		}

		// Search cards (front/back)
		const cards = await db.table('cards').toArray();
		for (const card of cards) {
			if (card.deletedAt) continue;
			const { score, matchedField } = scoreRecord(
				[
					{ name: 'front', value: card.front, weight: 1.0 },
					{ name: 'back', value: card.back, weight: 0.8 },
				],
				query
			);
			if (score > 0) {
				results.push({
					id: card.id,
					type: 'card',
					appId: 'cards',
					title: truncateSubtitle(card.front, 60) || 'Karte',
					subtitle: truncateSubtitle(card.back, 60),
					appIcon: app?.icon,
					appColor: app?.color,
					href: `/cards/${card.deckId}`,
					score,
					matchedField,
				});
			}
		}

		return results.sort((a, b) => b.score - a.score).slice(0, limit);
	},
};
