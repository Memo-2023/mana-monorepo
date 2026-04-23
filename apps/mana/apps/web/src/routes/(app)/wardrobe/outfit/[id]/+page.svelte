<script lang="ts">
	import { page } from '$app/state';
	import { RoutePage } from '$lib/components/shell';
	import DetailOutfitView from '$lib/modules/wardrobe/views/DetailOutfitView.svelte';

	const id = $derived(page.params.id ?? '');
</script>

<svelte:head>
	<title>Outfit · Mana</title>
</svelte:head>

<RoutePage appId="wardrobe" backHref="/wardrobe">
	<!-- Force a fresh subtree on :id change so liveQuery and local state
	     reset cleanly when navigating between /outfit/a → /outfit/b. -->
	{#key id}
		<DetailOutfitView {id} />
	{/key}
</RoutePage>
