/**
 * Calendar QuickInputBar Adapter
 */

import type { InputBarAdapter } from '$lib/quick-input/types';
import type { QuickInputItem } from '@manacore/shared-ui';
import { db } from '$lib/data/database';
import { parseEventInput, resolveEventIds, formatParsedEventPreview } from './utils/event-parser';
import { toCalendar, toCalendarEvent } from './queries';
import type { LocalCalendar, LocalEvent } from './types';
import { format, isSameDay } from 'date-fns';
import { de } from 'date-fns/locale';

export function createAdapter(): InputBarAdapter {
	return {
		placeholder: 'Neuer Termin oder suchen...',
		appIcon: 'calendar',
		deferSearch: true,
		createText: 'Erstellen',
		emptyText: 'Keine Termine gefunden',

		async onSearch(query) {
			const q = query.toLowerCase();
			const events = await db.table<LocalEvent>('events').toArray();
			return events
				.filter((e) => !e.deletedAt && e.title?.toLowerCase().includes(q))
				.sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime())
				.slice(0, 10)
				.map((e) => ({
					id: e.id,
					title: e.title || '',
					subtitle: e.startDate
						? format(new Date(e.startDate), 'dd. MMM yyyy, HH:mm', { locale: de })
						: '',
				}));
		},

		onSelect(item: QuickInputItem) {
			// Could open event detail modal — for now just navigate
			window.dispatchEvent(new CustomEvent('calendar:open-event', { detail: { id: item.id } }));
		},

		onParseCreate(query) {
			if (!query.trim()) return null;
			const parsed = parseEventInput(query);
			const preview = formatParsedEventPreview(parsed);
			return {
				title: `"${parsed.title}" erstellen`,
				subtitle: preview || 'Neuer Termin',
			};
		},

		async onCreate(query) {
			if (!query.trim()) return;
			const parsed = parseEventInput(query);
			const calendars = (await db.table<LocalCalendar>('calendars').toArray())
				.filter((c) => !c.deletedAt)
				.map(toCalendar);
			const tags = await db.table('tags').toArray();
			const defaultCal = calendars.find((c) => c.isDefault) || calendars[0];
			const resolved = resolveEventIds(parsed, calendars, tags, defaultCal?.id);

			const { eventsStore } = await import('./stores/events.svelte');
			await eventsStore.createEvent({
				calendarId: resolved.calendarId || defaultCal?.id || '',
				title: resolved.title,
				description: null,
				startTime: resolved.startTime || new Date().toISOString(),
				endTime: resolved.endTime || new Date(Date.now() + 3600000).toISOString(),
				isAllDay: resolved.isAllDay || false,
				location: resolved.location || null,
				recurrenceRule: resolved.recurrenceRule || null,
			});
		},
	};
}
