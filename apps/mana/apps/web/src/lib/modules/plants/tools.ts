import type { ModuleTool } from '$lib/data/tools/types';
export const plantsTools: ModuleTool[] = [
	{
		name: 'create_plant',
		module: 'plants',
		description: 'Erfasst eine neue Pflanze',
		parameters: [{ name: 'name', type: 'string', description: 'Name der Pflanze', required: true }],
		async execute(params) {
			const { plantMutations } = await import('./mutations');
			const plant = await plantMutations.create({ name: params.name as string });
			return { success: true, data: plant, message: `Pflanze "${params.name}" erstellt` };
		},
	},
];
