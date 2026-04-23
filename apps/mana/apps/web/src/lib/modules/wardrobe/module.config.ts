import type { ModuleConfig } from '$lib/data/module-registry';

export const wardrobeModuleConfig: ModuleConfig = {
	appId: 'wardrobe',
	tables: [{ name: 'wardrobeGarments' }, { name: 'wardrobeOutfits' }],
};
