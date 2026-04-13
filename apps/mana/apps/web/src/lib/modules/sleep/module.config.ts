import type { ModuleConfig } from '$lib/data/module-registry';

export const sleepModuleConfig: ModuleConfig = {
	appId: 'sleep',
	tables: [
		{ name: 'sleepEntries' },
		{ name: 'sleepHygieneLogs' },
		{ name: 'sleepHygieneChecks' },
		{ name: 'sleepSettings' },
	],
};
