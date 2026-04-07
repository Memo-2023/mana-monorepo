import type { ModuleConfig } from '$lib/data/module-registry';

export const eventsModuleConfig: ModuleConfig = {
	appId: 'events',
	tables: [
		// `socialEvents` is renamed in unified DB to avoid collision with calendar.events.
		{ name: 'socialEvents', syncName: 'events' },
		{ name: 'eventGuests' },
		{ name: 'eventInvitations' },
		{ name: 'eventItems' },
	],
};
