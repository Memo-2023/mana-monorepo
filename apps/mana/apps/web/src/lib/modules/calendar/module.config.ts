import type { ModuleConfig } from '$lib/data/module-registry';

export const calendarModuleConfig: ModuleConfig = {
	appId: 'calendar',
	tables: [{ name: 'calendars' }, { name: 'events' }, { name: 'eventTags' }],
};
