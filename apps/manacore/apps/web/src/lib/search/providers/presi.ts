import { db } from '$lib/data/database';
import { getManaApp } from '@manacore/shared-branding';
import { scoreRecord, truncateSubtitle } from '../scoring';
import type { SearchProvider, SearchResult, SearchOptions } from '../types';

const app = getManaApp('presi');

export const presiSearchProvider: SearchProvider = {
	appId: 'presi',
	appName: 'Presi',
	appIcon: app?.icon,
	appColor: app?.color,
	searchableTypes: ['deck', 'slide'],

	async search(query: string, options?: SearchOptions): Promise<SearchResult[]> {
		const limit = options?.limit ?? 5;
		const results: SearchResult[] = [];

		// Search decks
		const decks = await db.table('presiDecks').toArray();
		for (const deck of decks) {
			if (deck.deletedAt) continue;
			const { score, matchedField } = scoreRecord(
				[
					{ name: 'title', value: deck.title ?? deck.name, weight: 1.0 },
					{ name: 'description', value: deck.description, weight: 0.7 },
				],
				query
			);
			if (score > 0) {
				results.push({
					id: deck.id,
					type: 'deck',
					appId: 'presi',
					title: deck.title ?? deck.name,
					subtitle: truncateSubtitle(deck.description) || 'Präsentation',
					appIcon: app?.icon,
					appColor: app?.color,
					href: `/presi/deck/${deck.id}`,
					score,
					matchedField,
				});
			}
		}

		// Search slides by content
		const slides = await db.table('slides').toArray();
		for (const slide of slides) {
			if (slide.deletedAt) continue;
			const content = slide.content || {};
			const bulletText = Array.isArray(content.bulletPoints) ? content.bulletPoints.join(' ') : '';
			const { score, matchedField } = scoreRecord(
				[
					{ name: 'title', value: content.title, weight: 1.0 },
					{ name: 'body', value: content.body, weight: 0.8 },
					{ name: 'bulletPoints', value: bulletText, weight: 0.6 },
				],
				query
			);
			if (score > 0) {
				results.push({
					id: slide.id,
					type: 'slide',
					appId: 'presi',
					title: content.title || 'Slide',
					subtitle: truncateSubtitle(content.body || bulletText),
					appIcon: app?.icon,
					appColor: app?.color,
					href: `/presi/deck/${slide.deckId}`,
					score,
					matchedField,
				});
			}
		}

		return results.sort((a, b) => b.score - a.score).slice(0, limit);
	},
};
