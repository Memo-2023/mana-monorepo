<!--
  Dreams — Symbols overview
  Wordcloud-ish list of all symbols, sized by frequency.
  Click → opens detail panel.
-->
<script lang="ts">
	import { useAllDreamSymbols } from '../queries';
	import type { DreamSymbol } from '../types';
	import SymbolDetailView from './SymbolDetailView.svelte';

	let symbols$ = useAllDreamSymbols();
	let symbols = $derived(symbols$.value);

	let searchQuery = $state('');
	let selectedSymbolId = $state<string | null>(null);

	let filtered = $derived(
		searchQuery.trim()
			? symbols.filter((s) => s.name.toLowerCase().includes(searchQuery.toLowerCase()))
			: symbols
	);

	let maxCount = $derived(filtered.reduce((m, s) => Math.max(m, s.count), 1));

	function fontSize(sym: DreamSymbol): string {
		// Scale 0.75rem .. 1.5rem based on count
		const ratio = Math.max(0.2, sym.count / maxCount);
		return `${0.75 + ratio * 0.75}rem`;
	}
</script>

{#if selectedSymbolId}
	<SymbolDetailView symbolId={selectedSymbolId} onBack={() => (selectedSymbolId = null)} />
{:else}
	<div class="symbols-view">
		{#if symbols.length > 5}
			<input
				class="search-input"
				type="text"
				placeholder="Symbol suchen..."
				bind:value={searchQuery}
			/>
		{/if}

		{#if filtered.length === 0}
			<p class="empty">
				{symbols.length === 0
					? 'Noch keine Symbole. Füge Symbole zu deinen Träumen hinzu, um sie hier zu sehen.'
					: 'Keine Treffer'}
			</p>
		{:else}
			<div class="cloud">
				{#each filtered as sym (sym.id)}
					<button
						class="sym-chip"
						style="font-size: {fontSize(sym)}; --sym-color: {sym.color ?? '#6366f1'}"
						onclick={() => (selectedSymbolId = sym.id)}
					>
						<span class="sym-dot"></span>
						<span class="sym-name">{sym.name}</span>
						<span class="sym-count">{sym.count}</span>
					</button>
				{/each}
			</div>
		{/if}
	</div>
{/if}

<style>
	.symbols-view {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		flex: 1;
		min-height: 0;
	}

	.search-input {
		padding: 0.3rem 0.5rem;
		border-radius: 0.375rem;
		border: 1px solid rgba(0, 0, 0, 0.08);
		background: transparent;
		font-size: 0.75rem;
		color: #374151;
		outline: none;
	}
	.search-input:focus {
		border-color: #6366f1;
	}
	:global(.dark) .search-input {
		border-color: rgba(255, 255, 255, 0.08);
		color: #f3f4f6;
	}

	.cloud {
		display: flex;
		flex-wrap: wrap;
		align-items: baseline;
		gap: 0.5rem 0.75rem;
		padding: 0.5rem 0.25rem;
		overflow-y: auto;
	}

	.sym-chip {
		display: inline-flex;
		align-items: center;
		gap: 0.375rem;
		padding: 0.25rem 0.625rem;
		border-radius: 9999px;
		border: 1px solid rgba(0, 0, 0, 0.06);
		background: transparent;
		color: var(--sym-color);
		cursor: pointer;
		transition: all 0.15s;
		font-weight: 500;
		line-height: 1.4;
	}
	.sym-chip:hover {
		background: color-mix(in srgb, var(--sym-color) 10%, transparent);
		border-color: var(--sym-color);
	}
	:global(.dark) .sym-chip {
		border-color: rgba(255, 255, 255, 0.08);
	}

	.sym-dot {
		width: 6px;
		height: 6px;
		border-radius: 9999px;
		background: var(--sym-color);
		flex-shrink: 0;
	}

	.sym-name {
		font-weight: 500;
	}

	.sym-count {
		font-size: 0.625rem;
		color: #9ca3af;
		font-weight: 400;
	}

	.empty {
		padding: 2rem 0;
		text-align: center;
		font-size: 0.8125rem;
		color: #9ca3af;
	}
</style>
