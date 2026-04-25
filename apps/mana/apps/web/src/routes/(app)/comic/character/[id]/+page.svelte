<script lang="ts">
	import { page } from '$app/state';
	import { RoutePage } from '$lib/components/shell';
	import DetailCharacterView from '$lib/modules/comic/views/DetailCharacterView.svelte';

	const id = $derived(page.params.id ?? '');
</script>

<svelte:head>
	<title>Comic-Character · Mana</title>
</svelte:head>

<RoutePage appId="comic" backHref="/comic/character">
	{#key id}
		<DetailCharacterView {id} />
	{/key}
</RoutePage>
