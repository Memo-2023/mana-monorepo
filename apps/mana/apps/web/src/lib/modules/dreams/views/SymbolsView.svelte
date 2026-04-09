<!--
  Dreams — Symbols overview
  Wordcloud-ish list of all symbols, sized by frequency.
  Click → opens detail panel.
-->
<script lang="ts">
	import {
		formatDreamDate,
		getLastUsedBySymbol,
		useAllDreams,
		useAllDreamSymbols,
	} from '../queries';
	import type { Dream, DreamSymbol } from '../types';
	import SymbolDetailView from './SymbolDetailView.svelte';

	let { onOpenDream }: { onOpenDream?: (dream: Dream) => void } = $props();

	let symbols$ = useAllDreamSymbols();
	let dreams$ = useAllDreams();
	let symbols = $derived(symbols$.value);
	let dreams = $derived(dreams$.value);

	type SortMode = 'count' | 'alpha' | 'recent';
	let sortMode = $state<SortMode>('count');
	let searchQuery = $state('');
	let selectedSymbolId = $state<string | null>(null);

	let lastUsedMap = $derived(getLastUsedBySymbol(dreams));

	let active = $derived(symbols.filter((s) => s.count > 0));

	let filtered = $derived(
		searchQuery.trim()
			? active.filter((s) => s.name.toLowerCase().includes(searchQuery.toLowerCase()))
			: active
	);

	let sorted = $derived.by(() => {
		const list = [...filtered];
		switch (sortMode) {
			case 'alpha':
				return list.sort((a, b) => a.name.localeCompare(b.name, 'de'));
			case 'recent':
				return list.sort((a, b) => {
					const ra = lastUsedMap.get(a.name) ?? '';
					const rb = lastUsedMap.get(b.name) ?? '';
					return rb.localeCompare(ra);
				});
			default:
				return list.sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, 'de'));
		}
	});

	let maxCount = $derived(sorted.reduce((m, s) => Math.max(m, s.count), 1));

	function fontSize(sym: DreamSymbol): string {
		// More dramatic scaling: 0.75rem .. 1.625rem
		const ratio = Math.max(0.1, sym.count / maxCount);
		// ease-out so big symbols stand out more
		const eased = Math.sqrt(ratio);
		return `${0.75 + eased * 0.875}rem`;
	}

	function selectSymbol(id: string) {
		selectedSymbolId = id;
	}
</script>

{#if selectedSymbolId}
	<SymbolDetailView
		symbolId={selectedSymbolId}
		onBack={() => (selectedSymbolId = null)}
		onSelectSymbol={selectSymbol}
		{onOpenDream}
	/>
{:else}
	<div class="symbols-view">
		<!-- Toolbar: search + sort -->
		<div class="toolbar">
			{#if active.length > 5}
				<input
					class="search-input"
					type="text"
					placeholder="Symbol suchen..."
					bind:value={searchQuery}
				/>
			{/if}
			<div class="sort-tabs">
				<button
					class="sort-tab"
					class:active={sortMode === 'count'}
					onclick={() => (sortMode = 'count')}
				>
					Häufigkeit
				</button>
				<button
					class="sort-tab"
					class:active={sortMode === 'alpha'}
					onclick={() => (sortMode = 'alpha')}
				>
					A-Z
				</button>
				<button
					class="sort-tab"
					class:active={sortMode === 'recent'}
					onclick={() => (sortMode = 'recent')}
				>
					Zuletzt
				</button>
			</div>
		</div>

		{#if sorted.length === 0}
			<p class="empty">
				{active.length === 0
					? 'Noch keine Symbole. Füge Symbole zu deinen Träumen hinzu, um sie hier zu sehen.'
					: 'Keine Treffer'}
			</p>
		{:else}
			<div class="cloud" class:list-mode={sortMode !== 'count'}>
				{#each sorted as sym (sym.id)}
					{@const lastDate = lastUsedMap.get(sym.name)}
					{@const noMeaning = !sym.meaning?.trim()}
					<button
						class="sym-chip"
						class:no-meaning={noMeaning}
						style="font-size: {sortMode === 'count'
							? fontSize(sym)
							: '0.8125rem'}; --sym-color: {sym.color ?? '#6366f1'}"
						onclick={() => (selectedSymbolId = sym.id)}
						title={sym.meaning ?? 'Noch keine Bedeutung hinterlegt'}
					>
						<span class="sym-dot"></span>
						<span class="sym-name">{sym.name}</span>
						<span class="sym-count">{sym.count}</span>
						{#if sortMode === 'recent' && lastDate}
							<span class="sym-meta">· {formatDreamDate(lastDate)}</span>
						{/if}
						{#if noMeaning}
							<span class="sym-badge" title="Keine Bedeutung hinterlegt">?</span>
						{/if}
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
		gap: 0.625rem;
		flex: 1;
		min-height: 0;
	}

	.toolbar {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.search-input {
		padding: 0.3rem 0.5rem;
		border-radius: 0.375rem;
		border: 1px solid hsl(var(--color-border));
		background: transparent;
		font-size: 0.75rem;
		color: hsl(var(--color-foreground));
		outline: none;
	}
	.search-input:focus {
		border-color: hsl(var(--color-primary));
	}
	.sort-tabs {
		display: flex;
		gap: 0.25rem;
		flex-wrap: wrap;
	}
	.sort-tab {
		padding: 0.1875rem 0.5rem;
		border-radius: 9999px;
		border: 1px solid hsl(var(--color-border));
		background: transparent;
		font-size: 0.625rem;
		color: hsl(var(--color-muted-foreground));
		cursor: pointer;
		transition: all 0.15s;
	}
	.sort-tab:hover {
		color: hsl(var(--color-primary));
	}
	.sort-tab.active {
		background: hsl(var(--color-primary));
		color: hsl(var(--color-primary-foreground));
		border-color: hsl(var(--color-primary));
	}
	.cloud {
		display: flex;
		flex-wrap: wrap;
		align-items: baseline;
		gap: 0.5rem 0.625rem;
		padding: 0.5rem 0.25rem;
		overflow-y: auto;
	}
	.cloud.list-mode {
		flex-direction: column;
		align-items: stretch;
		gap: 0.1875rem;
	}

	.sym-chip {
		display: inline-flex;
		align-items: center;
		gap: 0.375rem;
		padding: 0.25rem 0.625rem;
		border-radius: 9999px;
		border: 1px solid hsl(var(--color-border));
		background: transparent;
		color: var(--sym-color);
		cursor: pointer;
		transition: all 0.15s;
		font-weight: 500;
		line-height: 1.4;
		text-align: left;
	}
	.cloud.list-mode .sym-chip {
		border-radius: 0.375rem;
		justify-content: flex-start;
	}
	.sym-chip:hover {
		background: color-mix(in srgb, var(--sym-color) 12%, transparent);
		border-color: var(--sym-color);
	}
	.sym-chip.no-meaning {
		opacity: 0.7;
	}
	.sym-chip.no-meaning:hover {
		opacity: 1;
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
		color: hsl(var(--color-muted-foreground));
		font-weight: 400;
	}

	.sym-meta {
		font-size: 0.625rem;
		color: hsl(var(--color-muted-foreground));
		font-weight: 400;
	}
	.sym-badge {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 13px;
		height: 13px;
		border-radius: 9999px;
		background: hsl(var(--color-muted));
		color: hsl(var(--color-muted-foreground));
		font-size: 0.5625rem;
		font-weight: 700;
		margin-left: 0.125rem;
	}
	.empty {
		padding: 2rem 0;
		text-align: center;
		font-size: 0.8125rem;
		color: hsl(var(--color-muted-foreground));
	}
</style>
