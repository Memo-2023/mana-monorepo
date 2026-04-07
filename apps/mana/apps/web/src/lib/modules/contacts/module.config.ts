import type { ModuleConfig } from '$lib/data/module-registry';

export const contactsModuleConfig: ModuleConfig = {
	appId: 'contacts',
	tables: [{ name: 'contacts' }, { name: 'contactTags' }],
};
