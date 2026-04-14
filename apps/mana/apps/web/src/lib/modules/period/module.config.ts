import type { ModuleConfig } from '$lib/data/module-registry';

export const cyclesModuleConfig: ModuleConfig = {
	appId: 'cycles',
	tables: [{ name: 'cycles' }, { name: 'cycleDayLogs' }, { name: 'cycleSymptoms' }],
};
