import { db } from '$lib/data/database';
import { getManaApp } from '@manacore/shared-branding';
import { scoreRecord } from '../scoring';
import type { SearchProvider, SearchResult, SearchOptions } from '../types';

const app = getManaApp('contacts');

export const contactsSearchProvider: SearchProvider = {
	appId: 'contacts',
	appName: 'Kontakte',
	appIcon: app?.icon,
	appColor: app?.color,
	searchableTypes: ['contact'],

	async search(query: string, options?: SearchOptions): Promise<SearchResult[]> {
		const limit = options?.limit ?? 5;
		const results: SearchResult[] = [];

		const contacts = await db.table('contacts').toArray();
		for (const contact of contacts) {
			if (contact.deletedAt || contact.isArchived) continue;
			const fullName = [contact.firstName, contact.lastName].filter(Boolean).join(' ');
			const { score, matchedField } = scoreRecord(
				[
					{ name: 'name', value: fullName, weight: 1.0 },
					{ name: 'email', value: contact.email, weight: 0.5 },
					{ name: 'phone', value: contact.phone, weight: 0.4 },
					{ name: 'company', value: contact.company, weight: 0.5 },
					{ name: 'jobTitle', value: contact.jobTitle, weight: 0.4 },
				],
				query
			);
			if (score > 0) {
				const subtitle = [contact.company, contact.email].filter(Boolean).join(' · ');
				results.push({
					id: contact.id,
					type: 'contact',
					appId: 'contacts',
					title: fullName || contact.email || 'Unbekannt',
					subtitle: subtitle || undefined,
					appIcon: app?.icon,
					appColor: app?.color,
					href: `/contacts?id=${contact.id}`,
					score,
					matchedField,
				});
			}
		}

		return results.sort((a, b) => b.score - a.score).slice(0, limit);
	},
};
