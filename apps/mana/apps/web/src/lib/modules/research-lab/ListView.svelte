<!--
  Research Lab — ListView.

  Pick a category (search/extract/agent), choose providers, run a side-by-side
  comparison. Eval runs persist server-side in research.eval_runs; this view
  is a thin orchestrator over the mana-research service.
-->
<script lang="ts">
	import { goto } from '$app/navigation';
	import ProviderPicker from './components/ProviderPicker.svelte';
	import CompareColumn from './components/CompareColumn.svelte';
	import { researchLabStore } from './stores/session.svelte';
	import type { ResearchCategory } from './types';

	const store = researchLabStore;

	$effect(() => {
		void store.loadCatalog();
		void store.loadRecentRuns();
	});

	const session = $derived(store.session);
	const catalog = $derived(store.catalog);
	const health = $derived(store.health);
	const error = $derived(store.error);
	const isRunning = $derived(store.isRunning);
	const recentRuns = $derived(store.recentRuns);

	const activeProviders = $derived(
		!catalog
			? []
			: session.mode === 'search'
				? catalog.search
				: session.mode === 'extract'
					? catalog.extract
					: catalog.agent
	);

	const activeHealth = $derived(health?.providers.filter((p) => p.category === session.mode) ?? []);

	const selected = $derived(session.selected[session.mode]);

	const estimatedCost = $derived.by(() => {
		return selected.reduce((sum, id) => {
			const info = activeProviders.find((p) => p.id === id);
			if (!info) return sum;
			const price =
				session.mode === 'search'
					? info.pricing?.search
					: session.mode === 'extract'
						? info.pricing?.extract
						: info.pricing?.research;
			return sum + (price ?? 0);
		}, 0);
	});

	async function runCompare() {
		if (session.mode === 'search') await store.runSearchCompare();
		else if (session.mode === 'extract') await store.runExtractCompare();
		else await store.runAgentCompare();
	}

	function onKeyDown(ev: KeyboardEvent) {
		if (ev.key === 'Enter' && (ev.metaKey || ev.ctrlKey)) {
			ev.preventDefault();
			void runCompare();
		}
	}

	const canRun = $derived.by(() => {
		if (isRunning) return false;
		if (selected.length === 0) return false;
		if (session.mode === 'extract') return session.url.trim().length > 0;
		return session.query.trim().length > 0;
	});
</script>

<div class="lab">
	<header class="lab-header">
		<p class="subtitle">
			Gleiche Anfrage parallel an mehrere Anbieter schicken, Antworten nebeneinander vergleichen,
			persistent speichern.
		</p>
		<div class="header-actions">
			<button type="button" class="keys-link" onclick={() => void goto('/research-lab/keys')}>
				🔑 API-Keys
			</button>
		</div>
		<div class="mode-toggle" role="tablist">
			{#each ['search', 'extract', 'agent'] as const as m}
				<button
					role="tab"
					aria-selected={session.mode === m}
					class:active={session.mode === m}
					onclick={() => store.setMode(m as ResearchCategory)}
				>
					{m === 'search' ? 'Suche' : m === 'extract' ? 'Extrakt' : 'Agent'}
				</button>
			{/each}
		</div>
	</header>

	<section class="query-bar">
		{#if session.mode === 'extract'}
			<input
				type="url"
				placeholder="https://example.com/article"
				value={session.url}
				oninput={(e) => store.setUrl((e.currentTarget as HTMLInputElement).value)}
				onkeydown={onKeyDown}
				class="query-input"
			/>
		{:else}
			<input
				type="text"
				placeholder={session.mode === 'agent'
					? 'Frage stellen — z.B. "Was sind aktuelle Meinungen zu X?"'
					: 'Suchanfrage …'}
				value={session.query}
				oninput={(e) => store.setQuery((e.currentTarget as HTMLInputElement).value)}
				onkeydown={onKeyDown}
				class="query-input"
			/>
		{/if}

		<button type="button" class="primary" disabled={!canRun} onclick={() => void runCompare()}>
			{#if isRunning}Läuft…{:else}Vergleichen ({selected.length}){/if}
		</button>
	</section>

	<section class="providers">
		<div class="providers-row">
			<span class="label">Anbieter</span>
			<div class="providers-meta">
				<span>{selected.length} ausgewählt</span>
				{#if estimatedCost > 0}
					<span>~ {estimatedCost}¢ Kosten</span>
				{/if}
				<a href="#recent-runs" class="history-link">Historie ↓</a>
			</div>
		</div>
		{#if !catalog}
			<p class="loading">Lade Anbieter-Katalog …</p>
		{:else}
			<ProviderPicker
				category={session.mode}
				providers={activeProviders}
				health={activeHealth}
				{selected}
				onToggle={(id) => store.toggleProvider(session.mode, id)}
			/>
		{/if}
	</section>

	{#if error}
		<div class="error-banner">{error}</div>
	{/if}

	{#if session.lastRun}
		<section class="results">
			<div class="results-header">
				<h3>Ergebnisse</h3>
				<span class="results-meta">
					Run <code>{session.lastRun.runId.slice(0, 8)}</code> · {session.lastRun.entries.length}
					Anbieter
				</span>
			</div>
			<div class="grid">
				{#each session.lastRun.entries as entry (entry.provider)}
					<CompareColumn
						category={session.lastRun.category}
						{entry}
						runId={session.lastRun.runId}
					/>
				{/each}
			</div>
		</section>
	{/if}

	<section class="recent" id="recent-runs">
		<h3>Letzte Runs</h3>
		{#if recentRuns.length === 0}
			<p class="loading">Noch keine Runs in dieser Session.</p>
		{:else}
			<ul class="runs-list">
				{#each recentRuns.slice(0, 10) as run (run.id)}
					<li>
						<button
							type="button"
							class="run run-button"
							onclick={() => void goto(`/research-lab/runs/${run.id}`)}
						>
							<span class="run-badge badge-{run.category}">{run.category}</span>
							<span class="run-query">{run.query}</span>
							<span class="run-providers">
								{run.providersRequested.join(', ')}
							</span>
							<span class="run-meta">
								{run.mode}
								{run.totalCostCredits > 0 ? ` · ${run.totalCostCredits}¢` : ''}
							</span>
						</button>
					</li>
				{/each}
			</ul>
		{/if}
	</section>
</div>

<style>
	.lab {
		display: flex;
		flex-direction: column;
		gap: 1.25rem;
		padding: 1.25rem;
		max-width: 100%;
		min-height: 100%;
		background: hsl(var(--color-background));
		color: hsl(var(--color-foreground));
	}

	.lab-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 1rem;
		flex-wrap: wrap;
	}
	.subtitle {
		margin: 0;
		font-size: 0.875rem;
		color: hsl(var(--color-muted-foreground));
		max-width: 40rem;
		flex: 1 1 20rem;
	}

	.header-actions {
		display: flex;
		gap: 0.5rem;
	}
	.keys-link {
		padding: 0.375rem 0.75rem;
		border: 1px solid hsl(var(--color-border));
		border-radius: 0.375rem;
		background: hsl(var(--color-surface));
		color: hsl(var(--color-foreground));
		font-size: 0.8125rem;
		cursor: pointer;
		transition:
			background 0.15s,
			border-color 0.15s;
	}
	.keys-link:hover {
		background: hsl(var(--color-surface-hover));
		border-color: hsl(var(--color-border-strong));
	}

	.mode-toggle {
		display: inline-flex;
		border: 1px solid hsl(var(--color-border));
		border-radius: 0.5rem;
		overflow: hidden;
	}
	.mode-toggle button {
		padding: 0.375rem 0.875rem;
		background: hsl(var(--color-surface));
		color: hsl(var(--color-foreground));
		border: none;
		border-right: 1px solid hsl(var(--color-border));
		font-size: 0.8125rem;
		cursor: pointer;
		transition: background 0.15s;
	}
	.mode-toggle button:last-child {
		border-right: none;
	}
	.mode-toggle button:hover {
		background: hsl(var(--color-surface-hover));
	}
	.mode-toggle button.active {
		background: hsl(var(--color-primary));
		color: hsl(var(--color-primary-foreground, 0 0% 10%));
	}

	.query-bar {
		display: flex;
		gap: 0.5rem;
	}
	.query-input {
		flex: 1;
		padding: 0.625rem 0.875rem;
		border: 1px solid hsl(var(--color-border));
		border-radius: 0.375rem;
		background: hsl(var(--color-surface));
		color: hsl(var(--color-foreground));
		font-size: 0.9375rem;
		transition: border-color 0.15s;
	}
	.query-input:focus {
		outline: none;
		border-color: hsl(var(--color-primary));
	}

	button.primary {
		padding: 0.625rem 1.25rem;
		background: hsl(var(--color-primary));
		color: hsl(var(--color-primary-foreground, 0 0% 10%));
		border: none;
		border-radius: 0.375rem;
		font-weight: 500;
		cursor: pointer;
		transition: opacity 0.15s;
	}
	button.primary:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.providers {
		display: flex;
		flex-direction: column;
		gap: 0.625rem;
	}
	.providers-row {
		display: flex;
		justify-content: space-between;
		align-items: baseline;
	}
	.label {
		font-size: 0.8125rem;
		font-weight: 500;
		color: hsl(var(--color-muted-foreground));
		text-transform: uppercase;
		letter-spacing: 0.04em;
	}
	.providers-meta {
		display: flex;
		gap: 0.875rem;
		font-size: 0.75rem;
		color: hsl(var(--color-muted-foreground));
	}
	.history-link {
		color: hsl(var(--color-primary));
		text-decoration: none;
	}
	.loading {
		font-size: 0.875rem;
		color: hsl(var(--color-muted-foreground));
	}

	.error-banner {
		padding: 0.625rem 0.875rem;
		background: hsl(var(--color-error, 0 84% 60%) / 0.1);
		border: 1px solid hsl(var(--color-error, 0 84% 60%) / 0.4);
		color: hsl(var(--color-error, 0 84% 40%));
		border-radius: 0.375rem;
		font-size: 0.875rem;
	}

	.results-header {
		display: flex;
		justify-content: space-between;
		align-items: baseline;
		margin-bottom: 0.75rem;
	}
	.results-header h3 {
		margin: 0;
		font-size: 1rem;
		font-weight: 600;
	}
	.results-meta {
		font-size: 0.75rem;
		color: hsl(var(--color-muted-foreground));
	}
	.results-meta code {
		font-family: ui-monospace, SFMono-Regular, monospace;
	}

	.grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
		gap: 0.875rem;
	}

	.recent {
		border-top: 1px solid hsl(var(--color-border));
		padding-top: 1rem;
	}
	.recent h3 {
		margin: 0 0 0.625rem;
		font-size: 1rem;
		font-weight: 600;
	}
	.runs-list {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}
	.run {
		display: grid;
		grid-template-columns: 5rem 1fr auto auto;
		align-items: center;
		gap: 0.625rem;
		padding: 0.5rem 0.625rem;
		border: 1px solid hsl(var(--color-border));
		border-radius: 0.375rem;
		background: hsl(var(--color-surface));
		font-size: 0.8125rem;
		color: hsl(var(--color-foreground));
		text-align: left;
		width: 100%;
	}
	.run-button {
		cursor: pointer;
		transition:
			background 0.15s,
			border-color 0.15s;
	}
	.run-button:hover {
		background: hsl(var(--color-surface-hover));
		border-color: hsl(var(--color-border-strong));
	}
	.run-badge {
		padding: 0.125rem 0.375rem;
		border-radius: 0.25rem;
		font-size: 0.625rem;
		text-transform: uppercase;
		text-align: center;
		letter-spacing: 0.04em;
	}
	.badge-search {
		background: hsl(200 80% 50% / 0.15);
		color: hsl(200 80% 40%);
	}
	.badge-extract {
		background: hsl(270 60% 55% / 0.15);
		color: hsl(270 60% 45%);
	}
	.badge-agent {
		background: hsl(30 90% 55% / 0.15);
		color: hsl(30 90% 40%);
	}
	.run-query {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.run-providers {
		font-family: ui-monospace, SFMono-Regular, monospace;
		font-size: 0.6875rem;
		color: hsl(var(--color-muted-foreground));
		max-width: 16rem;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.run-meta {
		font-size: 0.75rem;
		color: hsl(var(--color-muted-foreground));
	}
</style>
