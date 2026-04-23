<script lang="ts">
	import { page } from '$app/state';
	import { RoutePage } from '$lib/components/shell';
	import DetailGarmentView from '$lib/modules/wardrobe/views/DetailGarmentView.svelte';

	const id = $derived(page.params.id ?? '');
</script>

<svelte:head>
	<title>Kleidungsstück · Mana</title>
</svelte:head>

<RoutePage appId="wardrobe" backHref="/wardrobe">
	<!-- Force a fresh subtree on :id change so the liveQuery + edit-form
	     local state reset cleanly when navigating between /garment/a → /b. -->
	{#key id}
		<DetailGarmentView {id} />
	{/key}
</RoutePage>
