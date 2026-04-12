<script lang="ts">
	import { setContext } from 'svelte';
	import type { Snippet } from 'svelte';
	import { useAllDrinkEntries, useAllDrinkPresets } from '$lib/modules/drink/queries';

	let { children }: { children: Snippet } = $props();

	const allEntries = useAllDrinkEntries();
	const allPresets = useAllDrinkPresets();

	setContext('drinkEntries', allEntries);
	setContext('drinkPresets', allPresets);
</script>

{@render children()}
