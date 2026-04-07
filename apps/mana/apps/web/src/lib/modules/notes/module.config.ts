import type { ModuleConfig } from '$lib/data/module-registry';

export const notesModuleConfig: ModuleConfig = {
	appId: 'notes',
	tables: [{ name: 'notes' }, { name: 'noteTags' }],
};
