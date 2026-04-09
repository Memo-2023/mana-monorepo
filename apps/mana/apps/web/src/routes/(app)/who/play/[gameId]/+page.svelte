<script lang="ts">
	import { page } from '$app/stores';
	import PlayView from '$lib/modules/who/views/PlayView.svelte';

	const gameId = $derived($page.params.gameId ?? '');
</script>

<svelte:head>
	<title>Who? — Spiel — Mana</title>
</svelte:head>

{#if gameId}
	<PlayView {gameId} />
{/if}
