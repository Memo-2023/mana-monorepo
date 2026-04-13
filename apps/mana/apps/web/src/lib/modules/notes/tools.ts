import type { ModuleTool } from '$lib/data/tools/types';
import { notesStore } from './stores/notes.svelte';

export const notesTools: ModuleTool[] = [
	{
		name: 'create_note',
		module: 'notes',
		description: 'Erstellt eine neue Notiz',
		parameters: [
			{ name: 'title', type: 'string', description: 'Titel', required: false },
			{ name: 'content', type: 'string', description: 'Inhalt', required: true },
		],
		async execute(params) {
			const note = await notesStore.createNote({
				title: params.title as string | undefined,
				content: params.content as string,
			});
			return {
				success: true,
				data: note,
				message: `Notiz "${note.title || 'Unbenannt'}" erstellt`,
			};
		},
	},
];
