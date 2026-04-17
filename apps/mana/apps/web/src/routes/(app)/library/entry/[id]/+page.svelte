<script lang="ts">
	import { page } from '$app/state';
	import DetailView from '$lib/modules/library/views/DetailView.svelte';
	import { useAllEntries } from '$lib/modules/library/queries';

	const entries$ = useAllEntries();
	const entry = $derived(entries$.value.find((e) => e.id === page.params.id));
</script>

<svelte:head>
	<title>{entry?.title ?? 'Bibliothek'} - Mana</title>
</svelte:head>

{#if entries$.loading}
	<p class="loading">Lädt…</p>
{:else if !entry}
	<div class="not-found">
		<p>Eintrag nicht gefunden.</p>
		<a href="/library">← Zurück zur Bibliothek</a>
	</div>
{:else}
	<DetailView {entry} />
{/if}

<style>
	.loading,
	.not-found {
		max-width: 640px;
		margin: 4rem auto;
		text-align: center;
	}
	.not-found a {
		color: #a855f7;
	}
</style>
