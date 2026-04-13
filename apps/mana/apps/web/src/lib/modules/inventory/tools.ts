import type { ModuleTool } from '$lib/data/tools/types';
export const inventoryTools: ModuleTool[] = [
	{
		name: 'create_inventory_item',
		module: 'inventory',
		description: 'Erfasst einen Gegenstand im Inventar',
		parameters: [
			{ name: 'name', type: 'string', description: 'Name', required: true },
			{ name: 'collectionId', type: 'string', description: 'Sammlungs-ID', required: true },
		],
		async execute(params) {
			const { itemsStore } = await import('./stores/items.svelte');
			const item = await itemsStore.create({
				name: params.name as string,
				collectionId: params.collectionId as string,
			});
			return { success: true, data: item, message: `"${params.name}" im Inventar erfasst` };
		},
	},
];
