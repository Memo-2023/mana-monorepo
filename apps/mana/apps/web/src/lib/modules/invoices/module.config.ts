import type { ModuleConfig } from '$lib/data/module-registry';

export const invoicesModuleConfig: ModuleConfig = {
	appId: 'invoices',
	tables: [{ name: 'invoices' }, { name: 'invoiceClients' }, { name: 'invoiceSettings' }],
};
