<script lang="ts">
	import { page } from '$app/state';
	import { RoutePage } from '$lib/components/shell';
	import DetailView from '$lib/modules/comic/views/DetailView.svelte';

	const id = $derived(page.params.id ?? '');
</script>

<svelte:head>
	<title>Comic · Mana</title>
</svelte:head>

<RoutePage appId="comic" backHref="/comic">
	<!-- Fresh subtree on :id change so liveQuery and local state (panel
	     editor open / close, scroll position) reset cleanly when
	     navigating between /comic/a → /comic/b. -->
	{#key id}
		<DetailView {id} />
	{/key}
</RoutePage>
