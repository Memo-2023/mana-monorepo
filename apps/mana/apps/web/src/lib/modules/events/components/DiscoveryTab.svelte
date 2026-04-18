<script lang="ts">
	import { onMount } from 'svelte';
	import { discoveryStore } from '../discovery/store.svelte';
	import DiscoverySetup from './DiscoverySetup.svelte';
	import DiscoveredEventCard from './DiscoveredEventCard.svelte';
	import RegionPicker from './RegionPicker.svelte';
	import SourceManager from './SourceManager.svelte';

	let initialized = $state(false);
	let showSources = $state(false);

	onMount(async () => {
		await discoveryStore.init();
		initialized = true;
	});

	async function handleSetupComplete() {
		await discoveryStore.refreshFeed();
	}

	async function handleSave(eventId: string) {
		await discoveryStore.saveEvent(eventId);
	}

	async function handleDismiss(eventId: string) {
		await discoveryStore.dismissEvent(eventId);
	}
</script>

<div class="discovery-tab">
	{#if !initialized}
		<p class="loading">Lade...</p>
	{:else if !discoveryStore.isSetUp}
		<DiscoverySetup onComplete={handleSetupComplete} />
	{:else}
		<div class="controls">
			<RegionPicker regions={discoveryStore.regions} />
			<div class="control-row">
				<button class="control-btn" onclick={() => discoveryStore.refreshFeed()}>
					Aktualisieren
				</button>
				<button
					class="control-btn"
					class:active={showSources}
					onclick={() => (showSources = !showSources)}
				>
					Quellen {discoveryStore.sources.length > 0 ? `(${discoveryStore.sources.length})` : ''}
				</button>
			</div>
		</div>

		{#if showSources}
			<SourceManager sources={discoveryStore.sources} regions={discoveryStore.regions} />
		{/if}

		{#if discoveryStore.loading}
			<p class="loading">Lade Events...</p>
		{:else if discoveryStore.error}
			<p class="error-msg">{discoveryStore.error}</p>
		{:else if discoveryStore.feed.length === 0}
			<div class="empty">
				<p class="empty-title">Noch keine Events gefunden</p>
				<p class="empty-hint">
					Fuge iCal-Feeds von Venues oder Vereinen hinzu, um Events zu entdecken.
				</p>
				{#if !showSources}
					<button class="action-btn" onclick={() => (showSources = true)}>
						Quellen verwalten
					</button>
				{/if}
			</div>
		{:else}
			<div class="feed">
				{#each discoveryStore.feed as event (event.id)}
					<DiscoveredEventCard
						{event}
						onSave={() => handleSave(event.id)}
						onDismiss={() => handleDismiss(event.id)}
					/>
				{/each}
				{#if discoveryStore.feedHasMore}
					<button
						class="load-more"
						onclick={() => discoveryStore.refreshFeed({ offset: discoveryStore.feed.length })}
					>
						Mehr laden
					</button>
				{/if}
			</div>
		{/if}
	{/if}
</div>

<style>
	.discovery-tab {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}
	.controls {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}
	.control-row {
		display: flex;
		gap: 0.375rem;
	}
	.control-btn {
		padding: 0.375rem 0.75rem;
		border: 1px solid hsl(var(--color-border));
		border-radius: 0.375rem;
		background: hsl(var(--color-card));
		font-size: 0.8125rem;
		cursor: pointer;
		color: hsl(var(--color-foreground));
		font-family: inherit;
	}
	.control-btn.active {
		background: hsl(var(--color-primary));
		color: hsl(var(--color-primary-foreground));
		border-color: transparent;
	}
	.loading {
		font-size: 0.875rem;
		color: hsl(var(--color-muted-foreground));
		text-align: center;
		padding: 2rem 0;
		margin: 0;
	}
	.error-msg {
		font-size: 0.875rem;
		color: rgb(220, 38, 38);
		text-align: center;
		padding: 1rem;
		margin: 0;
	}
	.empty {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.5rem;
		padding: 2rem 1rem;
		border: 1px dashed hsl(var(--color-border));
		border-radius: 0.625rem;
		text-align: center;
	}
	.empty-title {
		margin: 0;
		font-size: 0.9375rem;
		font-weight: 500;
		color: hsl(var(--color-foreground));
	}
	.empty-hint {
		margin: 0;
		font-size: 0.8125rem;
		color: hsl(var(--color-muted-foreground));
	}
	.action-btn {
		padding: 0.375rem 0.75rem;
		border: 1px solid hsl(var(--color-border));
		border-radius: 0.375rem;
		background: hsl(var(--color-card));
		font-size: 0.8125rem;
		cursor: pointer;
		color: hsl(var(--color-foreground));
		font-family: inherit;
	}
	.feed {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}
	.load-more {
		padding: 0.5rem;
		border: 1px solid hsl(var(--color-border));
		border-radius: 0.5rem;
		background: hsl(var(--color-card));
		font-size: 0.8125rem;
		cursor: pointer;
		color: hsl(var(--color-muted-foreground));
		text-align: center;
		font-family: inherit;
	}
	.load-more:hover {
		color: hsl(var(--color-foreground));
	}
</style>
