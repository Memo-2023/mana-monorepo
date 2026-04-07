import type { ModuleConfig } from '$lib/data/module-registry';

export const calcModuleConfig: ModuleConfig = {
	appId: 'calc',
	tables: [{ name: 'calculations' }, { name: 'savedFormulas' }],
};
