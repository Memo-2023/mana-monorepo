import type { ModuleTool } from '$lib/data/tools/types';
import { filesStore } from './stores/files.svelte';

export const storageTools: ModuleTool[] = [
	{
		name: 'create_folder',
		module: 'storage',
		description: 'Erstellt einen neuen Ordner im Dateispeicher',
		parameters: [{ name: 'name', type: 'string', description: 'Ordnername', required: true }],
		async execute(params) {
			const folder = await filesStore.createFolder(params.name as string);
			return { success: true, data: folder, message: `Ordner "${params.name}" erstellt` };
		},
	},
];
