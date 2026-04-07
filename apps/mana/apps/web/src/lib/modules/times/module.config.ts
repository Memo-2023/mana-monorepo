import type { ModuleConfig } from '$lib/data/module-registry';

export const timesModuleConfig: ModuleConfig = {
	appId: 'times',
	tables: [
		{ name: 'timeClients', syncName: 'clients' },
		{ name: 'timeProjects', syncName: 'projects' },
		{ name: 'timeEntries' },
		{ name: 'timeTemplates', syncName: 'templates' },
		{ name: 'timeSettings', syncName: 'settings' },
		{ name: 'timeAlarms', syncName: 'alarms' },
		{ name: 'timeCountdownTimers', syncName: 'countdownTimers' },
		{ name: 'timeWorldClocks', syncName: 'worldClocks' },
		{ name: 'entryTags' },
	],
};
