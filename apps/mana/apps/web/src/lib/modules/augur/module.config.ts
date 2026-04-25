import type { ModuleConfig } from '$lib/data/module-registry';

export const augurModuleConfig: ModuleConfig = {
	appId: 'augur',
	tables: [{ name: 'augurEntries' }],
};
