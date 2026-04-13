import type { ModuleTool } from '$lib/data/tools/types';
export const guidesTools: ModuleTool[] = [
	{
		name: 'create_guide',
		module: 'guides',
		description: 'Erstellt eine neue Anleitung / Guide',
		parameters: [
			{ name: 'title', type: 'string', description: 'Titel der Anleitung', required: true },
		],
		async execute(params) {
			const { guidesStore } = await import('./stores/guides.svelte');
			const guide = await guidesStore.createGuide({ title: params.title as string });
			return { success: true, data: guide, message: `Guide "${params.title}" erstellt` };
		},
	},
];
