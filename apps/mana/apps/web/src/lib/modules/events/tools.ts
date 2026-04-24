import { formatDate } from '$lib/i18n/format';
import type { ModuleTool } from '$lib/data/tools/types';
import { eventsStore } from './stores/events.svelte';
import { discoveryStore } from './discovery/store.svelte';
import * as discoveryApi from './discovery/api';

export const socialEventsTools: ModuleTool[] = [
	{
		name: 'create_social_event',
		module: 'events',
		description: 'Erstellt ein soziales Event (Party, Treffen, Feier)',
		parameters: [
			{ name: 'title', type: 'string', description: 'Name des Events', required: true },
			{ name: 'startTime', type: 'string', description: 'Startzeit (ISO 8601)', required: true },
			{ name: 'endTime', type: 'string', description: 'Endzeit (ISO 8601)', required: true },
			{ name: 'location', type: 'string', description: 'Ort', required: false },
			{ name: 'description', type: 'string', description: 'Beschreibung', required: false },
		],
		async execute(params) {
			const result = await eventsStore.createEvent({
				title: params.title as string,
				startTime: params.startTime as string,
				endTime: params.endTime as string,
				location: params.location as string | undefined,
				description: params.description as string | undefined,
			});
			return result.success
				? { success: true, data: { id: result.id }, message: `Event "${params.title}" erstellt` }
				: { success: false, message: result.error ?? 'Fehler' };
		},
	},

	// ── Event Discovery (Phase 3) ───────────────────────────────
	{
		name: 'discover_events',
		module: 'events',
		description:
			'Sucht oeffentliche Veranstaltungen in den konfigurierten Regionen des Nutzers. Gibt Events mit Titel, Datum, Ort, Kategorie und Quelle zurueck.',
		parameters: [
			{
				name: 'query',
				type: 'string',
				description: 'Optionaler Suchtext (z.B. "Jazz Konzerte")',
				required: false,
			},
			{
				name: 'category',
				type: 'string',
				description: 'Kategorie-Filter',
				required: false,
			},
			{
				name: 'days_ahead',
				type: 'number',
				description: 'Wie viele Tage voraus suchen (Standard: 14)',
				required: false,
			},
		],
		async execute(params) {
			const daysAhead = (params.days_ahead as number) ?? 14;
			const to = new Date(Date.now() + daysAhead * 86_400_000).toISOString();
			const feedParams: discoveryApi.FeedParams = {
				to,
				hideDismissed: true,
				limit: 20,
			};
			if (params.category) feedParams.category = params.category as string;

			const result = await discoveryApi.getFeed(feedParams);
			const events = result.events.map((e) => ({
				id: e.id,
				title: e.title,
				date: e.startAt,
				location: e.location,
				category: e.category,
				source: e.sourceName,
				sourceUrl: e.sourceUrl,
				priceInfo: e.priceInfo,
			}));

			if (events.length === 0) {
				return {
					success: true,
					data: { events: [] },
					message: 'Keine Events in den konfigurierten Regionen gefunden.',
				};
			}

			const summary = events
				.slice(0, 10)
				.map(
					(e) =>
						`- ${e.title} (${formatDate(new Date(e.date))}${e.location ? `, ${e.location}` : ''})`
				)
				.join('\n');

			return {
				success: true,
				data: { events, total: result.total },
				message: `${events.length} Events gefunden:\n${summary}`,
			};
		},
	},
	{
		name: 'suggest_event',
		module: 'events',
		description:
			'Schlaegt dem Nutzer ein entdecktes Event vor. Erstellt ein Proposal das der Nutzer bestaetigen muss, um das Event in seinen Kalender zu uebernehmen.',
		parameters: [
			{
				name: 'discovered_event_id',
				type: 'string',
				description: 'ID des entdeckten Events',
				required: true,
			},
			{
				name: 'reason',
				type: 'string',
				description: 'Begruendung warum dieses Event relevant ist',
				required: false,
			},
		],
		async execute(params) {
			const eventId = params.discovered_event_id as string;
			const reason = params.reason as string | undefined;

			// Load the event from the feed to get its details
			const result = await discoveryApi.getFeed({ limit: 100 });
			const event = result.events.find((e) => e.id === eventId);
			if (!event) {
				return { success: false, message: `Event ${eventId} nicht gefunden` };
			}

			// Save the event (creates a local socialEvent)
			await discoveryStore.saveEvent(eventId);

			const msg = reason
				? `Event "${event.title}" vorgeschlagen: ${reason}`
				: `Event "${event.title}" vorgeschlagen`;

			return {
				success: true,
				data: { eventId, title: event.title, date: event.startAt },
				message: msg,
			};
		},
	},
];
