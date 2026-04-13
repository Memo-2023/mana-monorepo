import type { ModuleTool } from '$lib/data/tools/types';
export const recipesTools: ModuleTool[] = [
	{
		name: 'create_recipe',
		module: 'recipes',
		description: 'Erstellt ein neues Rezept',
		parameters: [
			{ name: 'title', type: 'string', description: 'Name des Rezepts', required: true },
			{ name: 'description', type: 'string', description: 'Beschreibung', required: false },
		],
		async execute(params) {
			const { recipesStore } = await import('./stores/recipes.svelte');
			const recipe = await recipesStore.createRecipe({
				title: params.title as string,
				description: params.description as string | undefined,
			});
			return { success: true, data: recipe, message: `Rezept "${params.title}" erstellt` };
		},
	},
];
