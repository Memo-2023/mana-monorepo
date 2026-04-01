import { db } from '$lib/data/database';
import { getManaApp } from '@manacore/shared-branding';
import { scoreRecord } from '../scoring';
import type { SearchProvider, SearchResult, SearchOptions } from '../types';

const app = getManaApp('clock');

export const clockSearchProvider: SearchProvider = {
	appId: 'clock',
	appName: 'Clock',
	appIcon: app?.icon,
	appColor: app?.color,
	searchableTypes: ['alarm', 'timer', 'worldClock'],

	async search(query: string, options?: SearchOptions): Promise<SearchResult[]> {
		const limit = options?.limit ?? 5;
		const results: SearchResult[] = [];

		// Search alarms by label
		const alarms = await db.table('alarms').toArray();
		for (const alarm of alarms) {
			if (alarm.deletedAt || !alarm.label) continue;
			const { score, matchedField } = scoreRecord(
				[{ name: 'label', value: alarm.label, weight: 1.0 }],
				query
			);
			if (score > 0) {
				results.push({
					id: alarm.id,
					type: 'alarm',
					appId: 'clock',
					title: alarm.label,
					subtitle: 'Alarm',
					appIcon: app?.icon,
					appColor: app?.color,
					href: '/clock',
					score,
					matchedField,
				});
			}
		}

		// Search timers by label
		const timers = await db.table('timers').toArray();
		for (const timer of timers) {
			if (timer.deletedAt || !timer.label) continue;
			const { score, matchedField } = scoreRecord(
				[{ name: 'label', value: timer.label, weight: 1.0 }],
				query
			);
			if (score > 0) {
				results.push({
					id: timer.id,
					type: 'timer',
					appId: 'clock',
					title: timer.label,
					subtitle: 'Timer',
					appIcon: app?.icon,
					appColor: app?.color,
					href: '/clock',
					score,
					matchedField,
				});
			}
		}

		// Search world clocks by city name
		const worldClocks = await db.table('worldClocks').toArray();
		for (const wc of worldClocks) {
			if (wc.deletedAt) continue;
			const { score, matchedField } = scoreRecord(
				[{ name: 'cityName', value: wc.cityName, weight: 1.0 }],
				query
			);
			if (score > 0) {
				results.push({
					id: wc.id,
					type: 'worldClock',
					appId: 'clock',
					title: wc.cityName,
					subtitle: 'Weltzeit',
					appIcon: app?.icon,
					appColor: app?.color,
					href: '/clock',
					score,
					matchedField,
				});
			}
		}

		return results.sort((a, b) => b.score - a.score).slice(0, limit);
	},
};
