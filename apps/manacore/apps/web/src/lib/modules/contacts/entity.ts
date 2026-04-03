import { registerEntity } from '$lib/entities/registry';
import type { EntityDescriptor } from '$lib/entities/types';

const contactsEntity: EntityDescriptor = {
	appId: 'contacts',
	collection: 'contacts',
	paramKey: 'contactId',

	getDisplayData: (item) => {
		const name = [item.firstName, item.lastName].filter(Boolean).join(' ');
		return {
			title: name || (item.email as string) || 'Kontakt',
			subtitle: (item.company as string) ?? undefined,
		};
	},

	dragType: 'contact',
	// Contacts are drag sources only — dropping onto contacts doesn't create a new contact
};

registerEntity(contactsEntity);
