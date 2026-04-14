import type { ModuleTool } from '$lib/data/tools/types';
export const periodTools: ModuleTool[] = [
	{
		name: 'log_period_day',
		module: 'period',
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
			const { periodsStore } = await import('./stores/periods.svelte');
			const entry = await periodsStore.createPeriod({});
			return { success: true, data: entry, message: 'Zyklus-Tag geloggt' };
		},
	},
];
