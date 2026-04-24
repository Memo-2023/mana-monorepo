import { getDateFnsLocale } from '$lib/i18n/format';
/**
 * Events QuickInputBar Adapter — quick-create gatherings.
 *
 * MVP: very simple parser. The whole query becomes the title; default
 * start = today 19:00, end = +2h. Future: parse date phrases like
 * "Geburtstag Anna freitag 19 uhr".
 */

import type { InputBarAdapter } from '$lib/quick-input/types';
import type { QuickInputItem } from '@mana/shared-ui';
import { db } from '$lib/data/database';
import type { LocalSocialEvent } from './types';
import { format } from 'date-fns';
function defaultStart(): Date {
	const d = new Date();
	d.setHours(19, 0, 0, 0);
	return d;
}

export function createAdapter(): InputBarAdapter {
	return {
		placeholder: 'Neues Event oder suchen...',
		appIcon: 'events',
		deferSearch: true,
		createText: 'Erstellen',
		emptyText: 'Keine Events gefunden',

		async onSearch(query) {
			const q = query.toLowerCase();
			const events = await db.table<LocalSocialEvent>('socialEvents').toArray();
			return events
				.filter((e) => !e.deletedAt && e.title?.toLowerCase().includes(q))
				.slice(0, 10)
				.map((e) => ({
					id: e.id,
					title: e.title,
					subtitle: e.location ?? '',
				}));
		},

		onSelect(item: QuickInputItem) {
			window.location.href = `/events/${item.id}`;
		},

		onParseCreate(query) {
			if (!query.trim()) return null;
			const start = defaultStart();
			return {
				title: `"${query.trim()}" anlegen`,
				subtitle: `Start: ${format(start, 'EEE, d. MMM, HH:mm', { locale: getDateFnsLocale() })}`,
			};
		},

		async onCreate(query) {
			if (!query.trim()) return;
			const start = defaultStart();
			const end = new Date(start.getTime() + 2 * 60 * 60 * 1000);
			const { eventsStore } = await import('./stores/events.svelte');
			await eventsStore.createEvent({
				title: query.trim(),
				startTime: start.toISOString(),
				endTime: end.toISOString(),
			});
		},
	};
}
