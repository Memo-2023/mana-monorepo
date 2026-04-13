import type { ModuleTool } from '$lib/data/tools/types';
export const cyclesTools: ModuleTool[] = [
	{
		name: 'log_cycle_day',
		module: 'cycles',
		description: 'Loggt einen Zyklus-Tag (Menstruationszyklus)',
		parameters: [
			{
				name: 'flow',
				type: 'string',
				description: 'Staerke',
				required: false,
				enum: ['light', 'medium', 'heavy', 'spotting', 'none'],
			},
		],
		async execute(params) {
			const { cyclesStore } = await import('./stores/cycles.svelte');
			const entry = await cyclesStore.createCycle({});
			return { success: true, data: entry, message: 'Zyklus-Tag geloggt' };
		},
	},
];
