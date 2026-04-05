/**
 * Times QuickInputBar Adapter
 *
 * Provides search across time entries (stopwatch sessions)
 * and quick-create for new timer/alarm entries.
 */

import type { InputBarAdapter } from '$lib/quick-input/types';
import type { QuickInputItem } from '@mana/shared-ui';
import { db } from '$lib/data/database';
import { parseEntryInput, formatParsedEntryPreview } from './utils/entry-parser';

export function createAdapter(): InputBarAdapter {
	return {
		placeholder: 'Suchen in Times...',
		appIcon: 'clock',
		deferSearch: false,
		emptyText: 'Keine Einträge gefunden',

		async onSearch(query) {
			const q = query.toLowerCase();
			// Search across alarms and world clocks
			const alarms = await db.table('alarms').toArray();
			const worldClocks = await db.table('worldClocks').toArray();

			const results: QuickInputItem[] = [];

			for (const a of alarms as Record<string, unknown>[]) {
				if (!(a.deletedAt as string) && (a.label as string)?.toLowerCase().includes(q)) {
					results.push({
						id: a.id as string,
						title: (a.label as string) || 'Alarm',
						subtitle: `${(a.hour as number)?.toString().padStart(2, '0')}:${(a.minute as number)?.toString().padStart(2, '0')}`,
					});
				}
			}

			for (const wc of worldClocks as Record<string, unknown>[]) {
				if (
					!(wc.deletedAt as string) &&
					((wc.label as string)?.toLowerCase().includes(q) ||
						(wc.timezone as string)?.toLowerCase().includes(q))
				) {
					results.push({
						id: wc.id as string,
						title: (wc.label as string) || (wc.timezone as string) || '',
						subtitle: 'Weltuhr',
					});
				}
			}

			return results.slice(0, 10);
		},

		onSelect() {},
	};
}
