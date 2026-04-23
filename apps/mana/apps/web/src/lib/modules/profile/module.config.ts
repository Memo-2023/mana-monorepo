import type { ModuleConfig } from '$lib/data/module-registry';

export const profileModuleConfig: ModuleConfig = {
	appId: 'profile',
	tables: [{ name: 'userContext' }, { name: 'meImages' }],
};
