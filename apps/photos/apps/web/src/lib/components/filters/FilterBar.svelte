<script lang="ts">
	import { _ } from 'svelte-i18n';
	import { photoStore } from '$lib/stores/photos.svelte';

	const apps = ['picture', 'chat', 'contacts', 'nutriphi'];

	let selectedApps = $state<string[]>([]);
	let dateFrom = $state('');
	let dateTo = $state('');
	let hasLocation = $state<boolean | undefined>(undefined);
	let sortBy = $state<'dateTaken' | 'createdAt' | 'size'>('dateTaken');
	let sortOrder = $state<'asc' | 'desc'>('desc');

	function toggleApp(app: string) {
		if (selectedApps.includes(app)) {
			selectedApps = selectedApps.filter((a) => a !== app);
		} else {
			selectedApps = [...selectedApps, app];
		}
	}

	async function applyFilters() {
		await photoStore.setFilters({
			apps: selectedApps.length > 0 ? selectedApps : undefined,
			dateFrom: dateFrom || undefined,
			dateTo: dateTo || undefined,
			hasLocation,
			sortBy,
			sortOrder,
		});
	}

	async function clearFilters() {
		selectedApps = [];
		dateFrom = '';
		dateTo = '';
		hasLocation = undefined;
		sortBy = 'dateTaken';
		sortOrder = 'desc';
		await photoStore.setFilters({});
	}
</script>

<div class="filter-bar">
	<div class="filter-section">
		<span class="filter-label" id="app-filter-label">{$_('filters.app')}</span>
		<div class="app-filters" role="group" aria-labelledby="app-filter-label">
			{#each apps as app}
				<button
					class="app-chip"
					class:selected={selectedApps.includes(app)}
					onclick={() => toggleApp(app)}
					aria-pressed={selectedApps.includes(app)}
				>
					{app}
				</button>
			{/each}
		</div>
	</div>

	<div class="filter-section">
		<span class="filter-label">{$_('filters.dateRange')}</span>
		<div class="date-inputs">
			<input type="date" class="form-input" bind:value={dateFrom} aria-label={$_('filters.from')} />
			<span class="date-separator">-</span>
			<input type="date" class="form-input" bind:value={dateTo} aria-label={$_('filters.to')} />
		</div>
	</div>

	<div class="filter-section">
		<label class="filter-label" for="location-filter">{$_('filters.hasLocation')}</label>
		<select id="location-filter" class="form-input" bind:value={hasLocation}>
			<option value={undefined}>All</option>
			<option value={true}>Yes</option>
			<option value={false}>No</option>
		</select>
	</div>

	<div class="filter-section">
		<label class="filter-label" for="sort-by-filter">{$_('filters.sortBy')}</label>
		<select id="sort-by-filter" class="form-input" bind:value={sortBy}>
			<option value="dateTaken">{$_('filters.date')}</option>
			<option value="createdAt">Created</option>
			<option value="size">{$_('filters.size')}</option>
		</select>
	</div>

	<div class="filter-section">
		<label class="filter-label" for="sort-order-filter">{$_('filters.sortOrder')}</label>
		<select id="sort-order-filter" class="form-input" bind:value={sortOrder}>
			<option value="desc">{$_('filters.desc')}</option>
			<option value="asc">{$_('filters.asc')}</option>
		</select>
	</div>

	<div class="filter-actions">
		<button class="btn btn-ghost" onclick={clearFilters}>
			{$_('filters.clear')}
		</button>
		<button class="btn btn-primary" onclick={applyFilters}> Apply </button>
	</div>
</div>

<style>
	.filter-bar {
		display: flex;
		flex-wrap: wrap;
		gap: 1rem;
		padding: 1rem;
		background: var(--color-card);
		border-radius: var(--radius-lg);
		border: 1px solid var(--color-border);
		margin-bottom: 1.5rem;
	}

	.filter-section {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.filter-label {
		font-size: 0.75rem;
		font-weight: 500;
		color: var(--color-muted-foreground);
		text-transform: uppercase;
	}

	.app-filters {
		display: flex;
		flex-wrap: wrap;
		gap: 0.25rem;
	}

	.app-chip {
		padding: 0.25rem 0.75rem;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-full);
		background: var(--color-background);
		color: var(--color-foreground);
		font-size: 0.75rem;
		cursor: pointer;
		transition: all 150ms;
	}

	.app-chip:hover {
		background: var(--color-accent);
	}

	.app-chip.selected {
		background: var(--color-primary);
		color: var(--color-primary-foreground);
		border-color: var(--color-primary);
	}

	.date-inputs {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.date-separator {
		color: var(--color-muted-foreground);
	}

	.form-input {
		padding: 0.5rem;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		background: var(--color-background);
		color: var(--color-foreground);
		font-size: 0.875rem;
	}

	.form-input:focus {
		outline: none;
		border-color: var(--color-primary);
	}

	.filter-actions {
		display: flex;
		align-items: flex-end;
		gap: 0.5rem;
		margin-left: auto;
	}
</style>
