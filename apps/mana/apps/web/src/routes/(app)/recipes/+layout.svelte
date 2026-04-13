<script lang="ts">
	import { setContext } from 'svelte';
	import type { Snippet } from 'svelte';
	import { useAllRecipes } from '$lib/modules/recipes/queries';

	let { children }: { children: Snippet } = $props();

	const allRecipes = useAllRecipes();

	setContext('recipes', allRecipes);
</script>

{@render children()}
