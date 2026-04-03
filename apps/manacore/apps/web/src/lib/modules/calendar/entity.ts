import { registerEntity } from '$lib/entities/registry';
import type { EntityDescriptor } from '$lib/entities/types';

const calendarEntity: EntityDescriptor = {
	appId: 'calendar',
	collection: 'events',
	paramKey: 'eventId',

	getDisplayData: (item) => ({
		title: (item.title as string) || 'Termin',
		subtitle: item.startDate
			? new Date(item.startDate as string).toLocaleDateString('de', {
					day: '2-digit',
					month: '2-digit',
					hour: '2-digit',
					minute: '2-digit',
				})
			: undefined,
	}),

	dragType: 'event',
	acceptsDropFrom: ['task', 'contact'],

	transformIncoming: {
		task: (source) => {
			const dueDate = (source.dueDate as string) || new Date().toISOString();
			const start = new Date(dueDate);
			const end = new Date(start.getTime() + 60 * 60 * 1000);
			return {
				title: source.title as string,
				startTime: start.toISOString(),
				endTime: end.toISOString(),
				description: source.description as string | undefined,
			};
		},
		contact: (source) => {
			const name = [source.firstName, source.lastName].filter(Boolean).join(' ');
			const now = new Date();
			const end = new Date(now.getTime() + 60 * 60 * 1000);
			return {
				title: `Treffen mit ${name}`,
				startTime: now.toISOString(),
				endTime: end.toISOString(),
			};
		},
	},

	createItem: async (data) => {
		// Lazy imports to avoid circular dependency at registration time
		const { db } = await import('$lib/data/database');
		const { eventsStore } = await import('./stores/events.svelte');

		const calendars = await db.table('calendars').toArray();
		const defaultCal = calendars.find((c: Record<string, unknown>) => !c.deletedAt);
		const calendarId = (defaultCal?.id as string) ?? 'default';

		const result = await eventsStore.createEvent({
			calendarId,
			title: data.title as string,
			startTime: data.startTime as string,
			endTime: data.endTime as string,
			description: (data.description as string) ?? undefined,
		});

		if (!result.success || !result.data) throw new Error(result.error || 'Failed to create event');
		return result.data.id;
	},
};

registerEntity(calendarEntity);
