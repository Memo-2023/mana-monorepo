<!--
  SettingsSidebar — horizontal category chip row with an inline search
  field that surfaces a quick result list. Owns the search query; the
  parent owns the active category.
-->
<script lang="ts">
	import { _ } from 'svelte-i18n';
	import { MagnifyingGlass, X } from '@mana/shared-icons';
	import {
		getCategories,
		searchSettings,
		type Category,
		type CategoryId,
		type SearchEntry,
	} from './searchIndex';

	interface Props {
		activeCategory: CategoryId;
		onSelect: (id: CategoryId) => void;
		onJump: (entry: SearchEntry) => void;
		/** Override the default categories list. */
		categories?: Category[];
	}

	let { activeCategory, onSelect, onJump, categories: categoriesOverride }: Props = $props();
	const categories = $derived(categoriesOverride ?? getCategories($_));

	let query = $state('');
	let results = $derived(searchSettings($_, query));
	let highlightedCategoryIds = $derived(new Set(results.map((r) => r.category)));

	function clearSearch() {
		query = '';
	}

	function handleResultClick(entry: SearchEntry) {
		onJump(entry);
		clearSearch();
	}
</script>

<aside class="settings-sidebar" aria-label={$_('settings.sidebar.aria_categories')}>
	<!-- Search -->
	<div class="search-wrapper">
		<span class="search-icon">
			<MagnifyingGlass size={16} />
		</span>
		<input
			type="search"
			placeholder={$_('settings.sidebar.search_placeholder')}
			bind:value={query}
			class="search-input"
			aria-label={$_('settings.sidebar.aria_search')}
			onkeydown={(e) => {
				if (e.key === 'Escape') clearSearch();
				else if (e.key === 'Enter' && results[0]) handleResultClick(results[0]);
			}}
		/>
		{#if query}
			<button
				type="button"
				class="clear-btn"
				onclick={clearSearch}
				aria-label={$_('settings.sidebar.aria_clear')}
			>
				<X size={14} />
			</button>
		{/if}
	</div>

	{#if query && results.length > 0}
		<ul class="results-list">
			{#each results as entry (entry.label)}
				<li>
					<button type="button" class="result-btn" onclick={() => handleResultClick(entry)}>
						<span class="result-label">{entry.label}</span>
						<span class="result-hint">
							{categories.find((c) => c.id === entry.category)?.label}
						</span>
					</button>
				</li>
			{/each}
		</ul>
	{:else if query}
		<div class="no-results">
			{$_('settings.sidebar.no_results', { values: { query } })}
		</div>
	{/if}

	<div class="chip-row" role="tablist">
		{#each categories as cat (cat.id)}
			{@const Icon = cat.icon}
			{@const isActive = activeCategory === cat.id}
			{@const dim = query.length > 0 && !highlightedCategoryIds.has(cat.id)}
			<button
				type="button"
				role="tab"
				aria-selected={isActive}
				onclick={() => onSelect(cat.id)}
				class="chip-btn"
				class:active={isActive}
				class:dim
			>
				<Icon size={16} />
				{cat.label}
			</button>
		{/each}
	</div>
</aside>

<style>
	.settings-sidebar {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	/* ── Search field ───────────────────────────────────────────────── */
	.search-wrapper {
		position: relative;
		display: flex;
		align-items: center;
	}
	.search-icon {
		position: absolute;
		left: 0.75rem;
		display: flex;
		align-items: center;
		color: hsl(var(--color-muted-foreground));
		pointer-events: none;
	}
	.search-input {
		width: 100%;
		padding: 0.625rem 2.25rem;
		background: hsl(var(--color-card));
		border: 1px solid hsl(var(--color-border));
		border-radius: 9999px;
		font-size: 0.875rem;
		color: hsl(var(--color-foreground));
		transition:
			border-color 0.15s,
			box-shadow 0.15s;
	}
	.search-input::placeholder {
		color: hsl(var(--color-muted-foreground));
	}
	.search-input::-webkit-search-cancel-button {
		display: none;
	}
	.search-input:focus {
		outline: none;
		border-color: hsl(var(--color-primary) / 0.4);
		box-shadow: 0 0 0 3px hsl(var(--color-primary) / 0.15);
	}
	.clear-btn {
		position: absolute;
		right: 0.5rem;
		display: flex;
		align-items: center;
		justify-content: center;
		width: 1.5rem;
		height: 1.5rem;
		border: none;
		background: hsl(var(--color-muted));
		color: hsl(var(--color-muted-foreground));
		border-radius: 9999px;
		cursor: pointer;
	}
	.clear-btn:hover {
		background: hsl(var(--color-muted-foreground) / 0.2);
	}

	/* ── Search results dropdown ────────────────────────────────────── */
	.results-list {
		list-style: none;
		margin: 0;
		padding: 0.25rem;
		background: hsl(var(--color-card));
		border: 1px solid hsl(var(--color-border));
		border-radius: 0.875rem;
		box-shadow: 0 4px 14px hsl(0 0% 0% / 0.08);
		display: flex;
		flex-direction: column;
		gap: 0.125rem;
	}
	.result-btn {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.5rem;
		width: 100%;
		padding: 0.5rem 0.75rem;
		border: none;
		background: transparent;
		border-radius: 0.5rem;
		text-align: left;
		cursor: pointer;
		color: hsl(var(--color-foreground));
		font-size: 0.875rem;
	}
	.result-btn:hover {
		background: hsl(var(--color-surface-hover));
	}
	.result-label {
		font-weight: 500;
	}
	.result-hint {
		font-size: 0.75rem;
		color: hsl(var(--color-muted-foreground));
	}
	.no-results {
		padding: 0.75rem;
		text-align: center;
		font-size: 0.8125rem;
		color: hsl(var(--color-muted-foreground));
	}

	/* ── Category chips ─────────────────────────────────────────────── */
	.chip-row {
		display: flex;
		gap: 0.5rem;
		overflow-x: auto;
		padding: 0 1rem 0.5rem;
		margin: 0 -1rem;
		scrollbar-width: none;
	}
	.chip-row::-webkit-scrollbar {
		display: none;
	}
	.chip-btn {
		flex-shrink: 0;
		display: flex;
		align-items: center;
		gap: 0.375rem;
		padding: 0.5rem 0.875rem;
		background: hsl(var(--color-card));
		border: 1px solid hsl(var(--color-border));
		border-radius: 9999px;
		font-size: 0.8125rem;
		font-weight: 500;
		color: hsl(var(--color-foreground));
		cursor: pointer;
		transition: all 0.15s;
	}
	.chip-btn:hover {
		background: hsl(var(--color-surface-hover));
	}
	.chip-btn.active {
		background: hsl(var(--color-primary) / 0.15);
		border-color: hsl(var(--color-primary) / 0.35);
		color: hsl(var(--color-primary));
		box-shadow: inset 0 0 0 1px hsl(var(--color-primary) / 0.2);
	}
	.chip-btn.dim {
		opacity: 0.4;
	}
</style>
