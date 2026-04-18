<script lang="ts">
	import type { DiscoverySource, DiscoveryRegion } from '../discovery/types';
	import { discoveryStore } from '../discovery/store.svelte';

	interface Props {
		sources: DiscoverySource[];
		regions: DiscoveryRegion[];
	}

	let { sources, regions }: Props = $props();

	let showForm = $state(false);
	let newName = $state('');
	let newUrl = $state('');
	let newRegionId = $state('');
	let discovering = $state(false);

	const activeSources = $derived(sources.filter((s) => s.isActive));
	const suggestedSources = $derived(sources.filter((s) => !s.isActive));

	async function handleDiscover() {
		const regionId = regions[0]?.id;
		if (!regionId) return;
		discovering = true;
		try {
			await discoveryStore.discoverSources(regionId);
		} finally {
			discovering = false;
		}
	}

	async function handleActivate(id: string) {
		await discoveryStore.activateSource(id);
	}

	async function handleReject(id: string) {
		await discoveryStore.rejectSource(id);
	}

	const regionIdDefault = $derived(regions[0]?.id ?? '');

	async function handleAdd(e: SubmitEvent) {
		e.preventDefault();
		const name = newName.trim();
		const url = newUrl.trim();
		const regionId = newRegionId || regionIdDefault;
		if (!name || !url || !regionId) return;

		await discoveryStore.addSource({ type: 'ical', url, name, regionId });
		newName = '';
		newUrl = '';
		showForm = false;
	}

	async function handleRemove(id: string) {
		await discoveryStore.removeSource(id);
	}

	async function handleCrawl(id: string) {
		await discoveryStore.crawlSource(id);
	}

	function formatDate(iso: string | null): string {
		if (!iso) return 'nie';
		return new Date(iso).toLocaleString('de-DE', {
			day: '2-digit',
			month: '2-digit',
			hour: '2-digit',
			minute: '2-digit',
		});
	}
</script>

<div class="source-manager">
	<div class="header">
		<h3 class="section-title">Quellen</h3>
		<div class="header-actions">
			<button
				class="discover-btn"
				onclick={handleDiscover}
				disabled={discovering || regions.length === 0}
			>
				{discovering ? 'Suche...' : 'Automatisch finden'}
			</button>
			{#if !showForm}
				<button class="add-btn" onclick={() => (showForm = true)}>+ iCal-Feed</button>
			{/if}
		</div>
	</div>

	{#if showForm}
		<form class="add-form" onsubmit={handleAdd}>
			<input
				class="input"
				bind:value={newName}
				placeholder="Name (z.B. Jazzhaus Freiburg)"
				required
			/>
			<input class="input" bind:value={newUrl} placeholder="iCal URL (.ics)" type="url" required />
			{#if regions.length > 1}
				<select class="input" bind:value={newRegionId}>
					{#each regions as r (r.id)}
						<option value={r.id}>{r.label}</option>
					{/each}
				</select>
			{/if}
			<div class="form-actions">
				<button type="submit" class="action-btn primary">Hinzufugen</button>
				<button type="button" class="action-btn" onclick={() => (showForm = false)}
					>Abbrechen</button
				>
			</div>
		</form>
	{/if}

	{#if suggestedSources.length > 0}
		<div class="suggestions-section">
			<h4 class="sub-title">Vorgeschlagene Quellen</h4>
			<div class="source-list">
				{#each suggestedSources as source (source.id)}
					<div class="source-item suggested">
						<div class="source-info">
							<div class="source-name">{source.name}</div>
							<div class="source-meta">
								{source.type.toUpperCase()}
								{#if source.url}
									· <a class="source-url" href={source.url} target="_blank" rel="noopener"
										>{new URL(source.url).hostname}</a
									>
								{/if}
							</div>
						</div>
						<div class="source-actions">
							<button class="icon-btn activate" onclick={() => handleActivate(source.id)}
								>Aktivieren</button
							>
							<button class="icon-btn danger" onclick={() => handleReject(source.id)}>x</button>
						</div>
					</div>
				{/each}
			</div>
		</div>
	{/if}

	{#if activeSources.length === 0 && suggestedSources.length === 0}
		<p class="empty">
			Noch keine Quellen. Nutze "Automatisch finden" oder fuge iCal-Feeds manuell hinzu.
		</p>
	{:else if activeSources.length > 0}
		<div class="source-list">
			{#each activeSources as source (source.id)}
				<div class="source-item" class:error={source.errorCount > 0}>
					<div class="source-info">
						<div class="source-name">{source.name}</div>
						<div class="source-meta">
							{source.type.toUpperCase()} · Letzter Scan: {formatDate(source.lastCrawledAt)}
							{#if source.errorCount > 0}
								<span class="error-badge">{source.errorCount} Fehler</span>
							{/if}
						</div>
						{#if source.lastError}
							<div class="source-error">{source.lastError}</div>
						{/if}
					</div>
					<div class="source-actions">
						<button class="icon-btn" onclick={() => handleCrawl(source.id)} title="Jetzt scannen">
							Scannen
						</button>
						<button
							class="icon-btn danger"
							onclick={() => handleRemove(source.id)}
							title="Entfernen"
						>
							x
						</button>
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>

<style>
	.source-manager {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}
	.header {
		display: flex;
		align-items: center;
		justify-content: space-between;
	}
	.header-actions {
		display: flex;
		gap: 0.375rem;
	}
	.discover-btn {
		padding: 0.25rem 0.625rem;
		border: 1px solid hsl(var(--color-primary));
		border-radius: 0.375rem;
		background: none;
		font-size: 0.75rem;
		color: hsl(var(--color-primary));
		cursor: pointer;
		font-family: inherit;
	}
	.discover-btn:hover {
		background: hsl(var(--color-primary));
		color: hsl(var(--color-primary-foreground));
	}
	.discover-btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
	.suggestions-section {
		display: flex;
		flex-direction: column;
		gap: 0.375rem;
	}
	.sub-title {
		margin: 0;
		font-size: 0.6875rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.04em;
		color: hsl(var(--color-primary));
	}
	.source-item.suggested {
		border-color: hsl(var(--color-primary) / 0.3);
		background: hsl(var(--color-primary) / 0.05);
	}
	.source-url {
		color: hsl(var(--color-primary));
		text-decoration: none;
		font-size: 0.6875rem;
	}
	.source-url:hover {
		text-decoration: underline;
	}
	.icon-btn.activate {
		color: hsl(var(--color-primary));
		border-color: hsl(var(--color-primary));
	}
	.section-title {
		margin: 0;
		font-size: 0.75rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: hsl(var(--color-muted-foreground));
	}
	.add-btn {
		padding: 0.25rem 0.625rem;
		border: 1px dashed hsl(var(--color-border));
		border-radius: 0.375rem;
		background: none;
		font-size: 0.75rem;
		color: hsl(var(--color-muted-foreground));
		cursor: pointer;
		font-family: inherit;
	}
	.add-form {
		display: flex;
		flex-direction: column;
		gap: 0.375rem;
		padding: 0.75rem;
		border: 1px solid hsl(var(--color-border));
		border-radius: 0.5rem;
		background: hsl(var(--color-card));
	}
	.input {
		padding: 0.5rem 0.75rem;
		border: 1px solid hsl(var(--color-border));
		border-radius: 0.375rem;
		background: hsl(var(--color-background));
		font-size: 0.875rem;
		color: hsl(var(--color-foreground));
		font-family: inherit;
	}
	.form-actions {
		display: flex;
		gap: 0.375rem;
	}
	.action-btn {
		padding: 0.375rem 0.75rem;
		border: 1px solid hsl(var(--color-border));
		border-radius: 0.375rem;
		background: hsl(var(--color-card));
		font-size: 0.8125rem;
		cursor: pointer;
		font-family: inherit;
		color: hsl(var(--color-foreground));
	}
	.action-btn.primary {
		background: hsl(var(--color-primary));
		color: hsl(var(--color-primary-foreground));
		border-color: transparent;
	}
	.source-list {
		display: flex;
		flex-direction: column;
		gap: 0.375rem;
	}
	.source-item {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0.5rem 0.75rem;
		border: 1px solid hsl(var(--color-border));
		border-radius: 0.5rem;
		background: hsl(var(--color-card));
	}
	.source-item.error {
		border-color: rgba(239, 68, 68, 0.3);
	}
	.source-item.inactive {
		opacity: 0.5;
	}
	.source-info {
		flex: 1;
		min-width: 0;
	}
	.source-name {
		font-size: 0.875rem;
		font-weight: 500;
		color: hsl(var(--color-foreground));
	}
	.source-meta {
		font-size: 0.75rem;
		color: hsl(var(--color-muted-foreground));
		display: flex;
		align-items: center;
		gap: 0.375rem;
		flex-wrap: wrap;
	}
	.error-badge {
		font-size: 0.625rem;
		font-weight: 600;
		padding: 0.0625rem 0.375rem;
		border-radius: 0.25rem;
		background: rgba(239, 68, 68, 0.15);
		color: rgb(220, 38, 38);
	}
	.inactive-badge {
		font-size: 0.625rem;
		font-weight: 600;
		padding: 0.0625rem 0.375rem;
		border-radius: 0.25rem;
		background: hsl(var(--color-muted));
		color: hsl(var(--color-muted-foreground));
	}
	.source-error {
		font-size: 0.6875rem;
		color: rgb(220, 38, 38);
		margin-top: 0.125rem;
	}
	.source-actions {
		display: flex;
		gap: 0.25rem;
		flex-shrink: 0;
	}
	.icon-btn {
		padding: 0.25rem 0.5rem;
		border: 1px solid hsl(var(--color-border));
		border-radius: 0.25rem;
		background: none;
		font-size: 0.75rem;
		cursor: pointer;
		color: hsl(var(--color-muted-foreground));
		font-family: inherit;
	}
	.icon-btn:hover {
		color: hsl(var(--color-foreground));
	}
	.icon-btn.danger:hover {
		color: rgb(220, 38, 38);
	}
	.empty {
		font-size: 0.8125rem;
		color: hsl(var(--color-muted-foreground));
		margin: 0;
	}
</style>
