<script lang="ts">
	import EntryCard from '../components/EntryCard.svelte';
	import type { LibraryEntry } from '../types';

	let {
		entries,
		onopen,
	}: {
		entries: LibraryEntry[];
		onopen?: (entry: LibraryEntry) => void;
	} = $props();
</script>

{#if entries.length === 0}
	<div class="empty">
		<p>Noch keine Einträge.</p>
		<p class="muted">Klick auf <strong>„+ Neu"</strong> um deinen ersten Eintrag anzulegen.</p>
	</div>
{:else}
	<div class="grid">
		{#each entries as entry (entry.id)}
			<EntryCard {entry} onclick={onopen} />
		{/each}
	</div>
{/if}

<style>
	.grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
		gap: 1rem;
	}
	.empty {
		padding: 2.5rem 1rem;
		text-align: center;
		border: 1px dashed var(--color-border, rgba(0, 0, 0, 0.12));
		border-radius: 0.75rem;
	}
	.empty p {
		margin: 0.25rem 0;
	}
	.muted {
		color: var(--color-text-muted, #64748b);
		font-size: 0.9rem;
	}
</style>
