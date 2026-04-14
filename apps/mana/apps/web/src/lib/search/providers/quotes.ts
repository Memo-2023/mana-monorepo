import { db } from '$lib/data/database';
import { getManaApp } from '@mana/shared-branding';
import { scoreRecord, truncateSubtitle } from '../scoring';
import type { SearchProvider, SearchResult, SearchOptions } from '../types';

const app = getManaApp('quotes');

export const quotesSearchProvider: SearchProvider = {
	appId: 'quotes',
	appName: 'Quotes',
	appIcon: app?.icon,
	appColor: app?.color,
	searchableTypes: ['list'],

	async search(query: string, options?: SearchOptions): Promise<SearchResult[]> {
		const limit = options?.limit ?? 5;
		const results: SearchResult[] = [];

		// Search quote lists
		const lists = await db.table('quotesLists').toArray();
		for (const list of lists) {
			if (list.deletedAt) continue;
			const { score, matchedField } = scoreRecord(
				[
					{ name: 'name', value: list.name, weight: 1.0 },
					{ name: 'description', value: list.description, weight: 0.7 },
				],
				query
			);
			if (score > 0) {
				results.push({
					id: list.id,
					type: 'list',
					appId: 'quotes',
					title: list.name,
					subtitle: truncateSubtitle(list.description) || 'Zitatsammlung',
					appIcon: app?.icon,
					appColor: app?.color,
					href: '/quotes',
					score,
					matchedField,
				});
			}
		}

		return results.sort((a, b) => b.score - a.score).slice(0, limit);
	},
};
