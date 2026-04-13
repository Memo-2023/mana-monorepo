import type { ModuleTool } from '$lib/data/tools/types';
import { memosStore } from './stores/memos.svelte';

export const memoroTools: ModuleTool[] = [
	{
		name: 'create_memo',
		module: 'memoro',
		description: 'Erstellt ein neues Sprachmemo / Memo',
		parameters: [
			{ name: 'title', type: 'string', description: 'Titel', required: false },
			{ name: 'transcript', type: 'string', description: 'Text / Transkript', required: true },
		],
		async execute(params) {
			const memo = await memosStore.create({
				title: params.title as string | undefined,
				transcript: params.transcript as string,
			});
			return { success: true, data: memo, message: `Memo "${memo.title || 'Neu'}" erstellt` };
		},
	},
];
