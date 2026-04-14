import type { ModuleConfig } from '$lib/data/module-registry';

export const periodModuleConfig: ModuleConfig = {
	appId: 'period',
	tables: [{ name: 'periods' }, { name: 'periodDayLogs' }, { name: 'periodSymptoms' }],
};
