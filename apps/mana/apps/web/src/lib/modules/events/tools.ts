import type { ModuleTool } from '$lib/data/tools/types';
import { eventsStore } from './stores/events.svelte';

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
];
