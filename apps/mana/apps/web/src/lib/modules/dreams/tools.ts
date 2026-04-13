import type { ModuleTool } from '$lib/data/tools/types';
import { dreamsStore } from './stores/dreams.svelte';

export const dreamsTools: ModuleTool[] = [
	{
		name: 'create_dream',
		module: 'dreams',
		description: 'Erstellt einen Traum-Eintrag im Traumtagebuch',
		parameters: [
			{ name: 'title', type: 'string', description: 'Titel des Traums', required: false },
			{ name: 'content', type: 'string', description: 'Traumbeschreibung', required: true },
			{ name: 'isLucid', type: 'boolean', description: 'Luzider Traum?', required: false },
		],
		async execute(params) {
			const dream = await dreamsStore.createDream({
				title: params.title as string | undefined,
				content: params.content as string,
				isLucid: (params.isLucid as boolean) ?? false,
			});
			return {
				success: true,
				data: dream,
				message: `Traum "${dream.title || 'Unbenannt'}" erstellt`,
			};
		},
	},
];
