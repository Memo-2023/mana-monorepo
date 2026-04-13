import type { ModuleConfig } from '$lib/data/module-registry';

export const recipesModuleConfig: ModuleConfig = {
	appId: 'recipes',
	tables: [{ name: 'recipes' }],
};
