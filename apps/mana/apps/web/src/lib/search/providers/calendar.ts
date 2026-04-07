import { db } from '$lib/data/database';
import { decryptRecords } from '$lib/data/crypto';
import { getManaApp } from '@mana/shared-branding';
import { scoreRecord, truncateSubtitle } from '../scoring';
import type { SearchProvider, SearchResult, SearchOptions } from '../types';

const app = getManaApp('calendar');

export const calendarSearchProvider: SearchProvider = {
	appId: 'calendar',
	appName: 'Kalender',
	appIcon: app?.icon,
	appColor: app?.color,
	searchableTypes: ['event'],

	async search(query: string, options?: SearchOptions): Promise<SearchResult[]> {
		const limit = options?.limit ?? 5;
		const results: SearchResult[] = [];

		// title/description/location are encrypted at rest. Filter on the
		// plaintext deletedAt before paying for the decrypt batch.
		const rawEvents = await db.table('events').toArray();
		const visibleEvents = rawEvents.filter((e) => !e.deletedAt);
		const events = await decryptRecords('events', visibleEvents);
		for (const event of events) {
			const { score, matchedField } = scoreRecord(
				[
					{ name: 'title', value: event.title, weight: 1.0 },
					{ name: 'description', value: event.description, weight: 0.7 },
					{ name: 'location', value: event.location, weight: 0.5 },
				],
				query
			);
			if (score > 0) {
				const subtitle = [
					event.startDate ? new Date(event.startDate).toLocaleDateString('de-DE') : null,
					event.location,
				]
					.filter(Boolean)
					.join(' · ');

				results.push({
					id: event.id,
					type: 'event',
					appId: 'calendar',
					title: event.title,
					subtitle: truncateSubtitle(subtitle) || truncateSubtitle(event.description),
					appIcon: app?.icon,
					appColor: app?.color,
					href: `/calendar?event=${event.id}`,
					score,
					matchedField,
				});
			}
		}

		return results.sort((a, b) => b.score - a.score).slice(0, limit);
	},
};
