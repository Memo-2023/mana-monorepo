/**
 * Calendar Tools — LLM-accessible operations for calendar events.
 */

import type { ModuleTool } from '$lib/data/tools/types';
import { eventsStore } from './stores/events.svelte';
import { eventTagOps } from './stores/tags.svelte';
import { db } from '$lib/data/database';
import { decryptRecords } from '$lib/data/crypto';
import { filterByScope } from '$lib/data/ai/scope-context';
import type { LocalTimeBlock } from '$lib/data/time-blocks/types';

export const calendarTools: ModuleTool[] = [
	{
		name: 'create_event',
		module: 'calendar',
		description: 'Erstellt einen neuen Kalender-Termin',
		parameters: [
			{ name: 'title', type: 'string', description: 'Titel des Termins', required: true },
			{ name: 'startTime', type: 'string', description: 'Startzeit (ISO 8601)', required: true },
			{ name: 'endTime', type: 'string', description: 'Endzeit (ISO 8601)', required: true },
			{ name: 'isAllDay', type: 'boolean', description: 'Ganztaegig', required: false },
			{ name: 'location', type: 'string', description: 'Ort', required: false },
			{ name: 'description', type: 'string', description: 'Beschreibung', required: false },
		],
		async execute(params) {
			// Find default calendar
			const calendars = await db.table('calendars').toArray();
			const defaultCal =
				calendars.find((c: Record<string, unknown>) => !c.deletedAt && c.isDefault) ??
				calendars.find((c: Record<string, unknown>) => !c.deletedAt);
			if (!defaultCal) {
				return { success: false, message: 'Kein Kalender vorhanden' };
			}

			const result = await eventsStore.createEvent({
				calendarId: (defaultCal as Record<string, unknown>).id as string,
				title: params.title as string,
				startTime: params.startTime as string,
				endTime: params.endTime as string,
				isAllDay: (params.isAllDay as boolean) ?? false,
				location: params.location as string | undefined,
				description: params.description as string | undefined,
			});
			return {
				success: result.success,
				data: result.data,
				message: result.success
					? `Termin "${params.title}" erstellt`
					: (result.error ?? 'Fehler beim Erstellen'),
			};
		},
	},
	{
		name: 'get_todays_events',
		module: 'calendar',
		description: 'Gibt alle Termine fuer heute zurueck',
		parameters: [],
		async execute() {
			const today = new Date().toISOString().split('T')[0];
			const blocks = await db
				.table<LocalTimeBlock>('timeBlocks')
				.where('startDate')
				.between(`${today}T00:00:00`, `${today}T23:59:59\uffff`)
				.toArray();
			const eventBlocks = blocks.filter(
				(b) => !b.deletedAt && b.type === 'event' && b.sourceModule === 'calendar'
			);
			const decrypted = await decryptRecords<LocalTimeBlock>('timeBlocks', eventBlocks);
			const scoped = await filterByScope(decrypted, async (b) =>
				b.sourceId ? eventTagOps.getTagIds(b.sourceId) : []
			);
			const events = scoped
				.sort((a, b) => (a.startDate as string).localeCompare(b.startDate as string))
				.map((b) => ({
					id: b.sourceId,
					title: b.title,
					startTime: b.startDate,
					endTime: b.endDate,
					allDay: b.allDay,
				}));
			return {
				success: true,
				data: events,
				message: `${events.length} Termine heute`,
			};
		},
	},
];
