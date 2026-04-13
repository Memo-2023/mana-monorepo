import type { ModuleConfig } from '$lib/data/module-registry';

export const mailModuleConfig: ModuleConfig = {
	appId: 'mail',
	tables: [{ name: 'mailDrafts' }],
};
