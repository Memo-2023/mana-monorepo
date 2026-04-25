<script lang="ts">
	import DetailView from '$lib/modules/writing/views/DetailView.svelte';
	import { RoutePage } from '$lib/components/shell';
	import { page } from '$app/state';

	const id = $derived(page.params.id ?? '');
</script>

<svelte:head>
	<title>Entwurf - Schreiben - Mana</title>
</svelte:head>

<RoutePage appId="writing">
	{#key id}
		<DetailView {id} />
	{/key}
</RoutePage>
