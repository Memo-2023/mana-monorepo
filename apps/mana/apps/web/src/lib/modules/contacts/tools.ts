import type { ModuleTool } from '$lib/data/tools/types';
import { contactsStore } from './stores/contacts.svelte';
import { contactTable } from './collections';
import { decryptRecords } from '$lib/data/crypto';
import { toContact } from './queries';
import type { LocalContact } from './types';

export const contactsTools: ModuleTool[] = [
	{
		name: 'create_contact',
		module: 'contacts',
		description: 'Erstellt einen neuen Kontakt',
		parameters: [
			{ name: 'firstName', type: 'string', description: 'Vorname', required: true },
			{ name: 'lastName', type: 'string', description: 'Nachname', required: false },
			{ name: 'email', type: 'string', description: 'E-Mail', required: false },
			{ name: 'phone', type: 'string', description: 'Telefon', required: false },
		],
		async execute(params) {
			const contact = await contactsStore.createContact({
				firstName: params.firstName as string,
				lastName: params.lastName as string | undefined,
				email: params.email as string | undefined,
				phone: params.phone as string | undefined,
			});
			return { success: true, data: contact, message: `Kontakt "${params.firstName}" erstellt` };
		},
	},
	{
		name: 'get_contacts',
		module: 'contacts',
		description: 'Gibt alle Kontakte zurueck',
		parameters: [],
		async execute() {
			const all = await contactTable.toArray();
			const active = all.filter((c) => !c.deletedAt && !c.isArchived);
			const decrypted = await decryptRecords<LocalContact>('contacts', active);
			const contacts = decrypted.map(toContact);
			return {
				success: true,
				data: contacts.map((c) => ({
					id: c.id,
					name: [c.firstName, c.lastName].filter(Boolean).join(' '),
					company: c.company,
				})),
				message: `${contacts.length} Kontakte`,
			};
		},
	},
];
