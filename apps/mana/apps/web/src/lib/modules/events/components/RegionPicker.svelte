<script lang="ts">
	import { _ } from 'svelte-i18n';
	import type { DiscoveryRegion } from '../discovery/types';
	import { discoveryStore } from '../discovery/store.svelte';

	interface Props {
		regions: DiscoveryRegion[];
	}

	let { regions }: Props = $props();

	let searchQuery = $state('');
	let suggestions = $state<{ label: string; lat: number; lon: number }[]>([]);
	let searching = $state(false);
	let showForm = $state(false);
	let radiusKm = $state(25);

	async function searchLocation() {
		const q = searchQuery.trim();
		if (q.length < 2) {
			suggestions = [];
			return;
		}
		searching = true;
		try {
			const res = await fetch(
				`http://localhost:3018/api/v1/geocode/search?q=${encodeURIComponent(q)}&limit=5&lang=de`
			);
			if (res.ok) {
				const data = await res.json();
				suggestions = (data.results ?? []).map(
					(r: { label: string; latitude: number; longitude: number }) => ({
						label: r.label,
						lat: r.latitude,
						lon: r.longitude,
					})
				);
			}
		} catch {
			suggestions = [];
		} finally {
			searching = false;
		}
	}

	async function selectSuggestion(s: { label: string; lat: number; lon: number }) {
		await discoveryStore.addRegion({
			label: s.label.split(',')[0] ?? s.label,
			lat: s.lat,
			lon: s.lon,
			radiusKm,
		});
		searchQuery = '';
		suggestions = [];
		showForm = false;
	}

	async function removeRegion(id: string) {
		await discoveryStore.removeRegion(id);
	}

	let debounceTimer: ReturnType<typeof setTimeout>;
	function onSearchInput() {
		clearTimeout(debounceTimer);
		debounceTimer = setTimeout(searchLocation, 300);
	}
</script>

<div class="region-picker">
	<div class="region-list">
		{#each regions as region (region.id)}
			<div class="region-chip">
				<span class="region-label">{region.label}</span>
				<span class="region-radius"
					>{$_('events.region_picker.radius_unit', { values: { km: region.radiusKm } })}</span
				>
				<button class="remove-btn" onclick={() => removeRegion(region.id)}>x</button>
			</div>
		{/each}
		{#if !showForm}
			<button class="add-btn" onclick={() => (showForm = true)}
				>{$_('events.region_picker.add_region')}</button
			>
		{/if}
	</div>

	{#if showForm}
		<div class="search-form">
			<input
				class="input"
				bind:value={searchQuery}
				oninput={onSearchInput}
				placeholder={$_('events.region_picker.placeholder_search')}
			/>
			<div class="radius-row">
				<label class="radius-label" for="region-radius"
					>{$_('events.region_picker.radius_label', { values: { km: radiusKm } })}</label
				>
				<input id="region-radius" type="range" min="5" max="100" step="5" bind:value={radiusKm} />
			</div>
			{#if suggestions.length > 0}
				<ul class="suggestions">
					{#each suggestions as s}
						<li>
							<button class="suggestion-btn" onclick={() => selectSuggestion(s)}>
								{s.label}
							</button>
						</li>
					{/each}
				</ul>
			{/if}
			{#if searching}
				<p class="searching-hint">{$_('events.region_picker.searching')}</p>
			{/if}
			<button
				class="cancel-btn"
				onclick={() => {
					showForm = false;
					searchQuery = '';
					suggestions = [];
				}}
			>
				{$_('events.region_picker.action_cancel')}
			</button>
		</div>
	{/if}
</div>

<style>
	.region-picker {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}
	.region-list {
		display: flex;
		flex-wrap: wrap;
		gap: 0.375rem;
		align-items: center;
	}
	.region-chip {
		display: flex;
		align-items: center;
		gap: 0.25rem;
		padding: 0.25rem 0.5rem;
		border: 1px solid hsl(var(--color-border));
		border-radius: 1rem;
		background: hsl(var(--color-muted));
		font-size: 0.8125rem;
	}
	.region-label {
		font-weight: 500;
		color: hsl(var(--color-foreground));
	}
	.region-radius {
		font-size: 0.6875rem;
		color: hsl(var(--color-muted-foreground));
	}
	.remove-btn {
		background: none;
		border: none;
		cursor: pointer;
		color: hsl(var(--color-muted-foreground));
		font-size: 0.75rem;
		padding: 0 0.25rem;
		font-family: inherit;
	}
	.remove-btn:hover {
		color: hsl(var(--color-foreground));
	}
	.add-btn {
		padding: 0.25rem 0.625rem;
		border: 1px dashed hsl(var(--color-border));
		border-radius: 1rem;
		background: none;
		font-size: 0.8125rem;
		color: hsl(var(--color-muted-foreground));
		cursor: pointer;
		font-family: inherit;
	}
	.add-btn:hover {
		color: hsl(var(--color-foreground));
		border-color: hsl(var(--color-foreground));
	}
	.search-form {
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
	.radius-row {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}
	.radius-label {
		font-size: 0.75rem;
		color: hsl(var(--color-muted-foreground));
		white-space: nowrap;
	}
	.suggestions {
		list-style: none;
		margin: 0;
		padding: 0;
	}
	.suggestion-btn {
		width: 100%;
		text-align: left;
		padding: 0.375rem 0.5rem;
		border: none;
		background: none;
		font-size: 0.8125rem;
		color: hsl(var(--color-foreground));
		cursor: pointer;
		border-radius: 0.25rem;
		font-family: inherit;
	}
	.suggestion-btn:hover {
		background: hsl(var(--color-muted));
	}
	.searching-hint {
		font-size: 0.75rem;
		color: hsl(var(--color-muted-foreground));
		margin: 0;
	}
	.cancel-btn {
		align-self: flex-start;
		padding: 0.25rem 0.5rem;
		border: none;
		background: none;
		font-size: 0.75rem;
		color: hsl(var(--color-muted-foreground));
		cursor: pointer;
		font-family: inherit;
	}
</style>
