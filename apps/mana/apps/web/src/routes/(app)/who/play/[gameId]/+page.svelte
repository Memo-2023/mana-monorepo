<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import PlayView from '$lib/modules/who/views/PlayView.svelte';
	import { RoutePage } from '$lib/components/shell';

	const gameId = $derived($page.params.gameId ?? '');
</script>

<svelte:head>
	<title>Who? — Spiel — Mana</title>
</svelte:head>

<RoutePage appId="who" backHref="/who" title="Spiel">
	{#if gameId}
		<PlayView {gameId} onBack={() => goto('/who')} />
	{/if}
</RoutePage>
