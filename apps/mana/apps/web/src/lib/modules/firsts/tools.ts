import type { ModuleTool } from '$lib/data/tools/types';
export const firstsTools: ModuleTool[] = [
	{
		name: 'create_first',
		module: 'firsts',
		description: 'Erstellt ein "Erstes Mal" (Bucket-List-Traum oder erlebtes Ersterlebnis)',
		parameters: [{ name: 'title', type: 'string', description: 'Was', required: true }],
		async execute(params) {
			const { firstsStore } = await import('./stores/firsts.svelte');
			const first = await firstsStore.createDream({ title: params.title as string });
			return { success: true, data: first, message: `Erstes Mal: "${params.title}"` };
		},
	},
];
