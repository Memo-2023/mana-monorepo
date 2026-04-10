import type { ModuleConfig } from '$lib/data/module-registry';

export const journalModuleConfig: ModuleConfig = {
	appId: 'journal',
	tables: [{ name: 'journalEntries' }],
};
