import type { ModuleConfig } from '$lib/data/module-registry';

export const websiteModuleConfig: ModuleConfig = {
	appId: 'website',
	tables: [{ name: 'websites' }, { name: 'websitePages' }, { name: 'websiteBlocks' }],
};
