<script lang="ts">
	import { photoStore } from '$lib/modules/photos/stores/photos.svelte';

	const apps = ['picture', 'chat', 'contacts', 'food'];

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

<div class="mb-6 flex flex-wrap gap-4 rounded-xl border border-border bg-background-card p-4">
	<div class="flex flex-col gap-1.5">
		<span class="text-xs font-medium uppercase text-foreground-secondary">App</span>
		<div class="flex flex-wrap gap-1">
			{#each apps as app}
				<button
					class="rounded-full px-3 py-1 text-xs transition-colors {selectedApps.includes(app)
						? 'bg-primary text-white'
						: 'bg-background text-foreground-secondary hover:bg-background-card-hover border border-border'}"
					onclick={() => toggleApp(app)}
				>
					{app}
				</button>
			{/each}
		</div>
	</div>

	<div class="flex flex-col gap-1.5">
		<span class="text-xs font-medium uppercase text-foreground-secondary">Zeitraum</span>
		<div class="flex items-center gap-2">
			<input
				type="date"
				class="rounded-lg border border-border bg-background px-2 py-1 text-sm text-foreground"
				bind:value={dateFrom}
			/>
			<span class="text-foreground-secondary">-</span>
			<input
				type="date"
				class="rounded-lg border border-border bg-background px-2 py-1 text-sm text-foreground"
				bind:value={dateTo}
			/>
		</div>
	</div>

	<div class="flex flex-col gap-1.5">
		<label for="sort-by" class="text-xs font-medium uppercase text-foreground-secondary"
			>Sortierung</label
		>
		<select
			id="sort-by"
			class="rounded-lg border border-border bg-background px-2 py-1 text-sm text-foreground"
			bind:value={sortBy}
		>
			<option value="dateTaken">Datum</option>
			<option value="createdAt">Erstellt</option>
			<option value="size">Größe</option>
		</select>
	</div>

	<div class="flex flex-col gap-1.5">
		<label for="sort-order" class="text-xs font-medium uppercase text-foreground-secondary"
			>Reihenfolge</label
		>
		<select
			id="sort-order"
			class="rounded-lg border border-border bg-background px-2 py-1 text-sm text-foreground"
			bind:value={sortOrder}
		>
			<option value="desc">Neueste zuerst</option>
			<option value="asc">Älteste zuerst</option>
		</select>
	</div>

	<div class="flex items-end gap-2 ml-auto">
		<button
			class="rounded-lg border border-border bg-background px-3 py-1.5 text-sm text-foreground-secondary hover:bg-background-card-hover"
			onclick={clearFilters}
		>
			Zurücksetzen
		</button>
		<button
			class="rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-white hover:bg-primary/90"
			onclick={applyFilters}
		>
			Anwenden
		</button>
	</div>
</div>
