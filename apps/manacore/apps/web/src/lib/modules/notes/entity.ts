import { registerEntity } from '$lib/entities/registry';
import { notesStore } from './stores/notes.svelte';
import type { EntityDescriptor } from '$lib/entities/types';

const notesEntity: EntityDescriptor = {
	appId: 'notes',
	collection: 'notes',
	paramKey: 'noteId',

	getDisplayData: (item) => ({
		title: (item.title as string) || 'Notiz',
		subtitle: undefined,
	}),

	dragType: 'note',
	acceptsDropFrom: ['task', 'contact'],

	transformIncoming: {
		task: (source) => ({
			title: source.title as string,
			content: (source.description as string) ?? '',
		}),
		contact: (source) => ({
			title: `${[source.firstName, source.lastName].filter(Boolean).join(' ')}`,
			content: `Kontakt: ${[source.firstName, source.lastName].filter(Boolean).join(' ')}`,
		}),
	},

	createItem: async (data) => {
		const note = await notesStore.createNote({
			title: data.title as string,
			content: (data.content as string) ?? '',
		});
		return note.id;
	},
};

registerEntity(notesEntity);
