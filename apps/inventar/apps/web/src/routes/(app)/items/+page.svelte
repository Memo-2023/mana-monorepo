<script lang="ts">
	import { goto } from '$app/navigation';
	import { _ } from 'svelte-i18n';
	import { itemsStore } from '$lib/stores/items.svelte';
	import { collectionsStore } from '$lib/stores/collections.svelte';
	import { viewStore } from '$lib/stores/view.svelte';
	import StatusBadge from '$lib/components/StatusBadge.svelte';
	import ViewModeToggle from '$lib/components/ViewModeToggle.svelte';
	import type { ItemStatus } from '@inventar/shared';

	let searchQuery = $state('');

	let filteredItems = $derived(
		itemsStore.getFiltered({
			search: searchQuery || undefined,
			...viewStore.activeFilters,
		})
	);
	let sortedItems = $derived(itemsStore.getSorted(filteredItems, viewStore.sort));

	const statuses: ItemStatus[] = ['owned', 'lent', 'stored', 'for_sale', 'disposed'];

	function toggleStatus(status: ItemStatus) {
		const current = viewStore.activeFilters.status || [];
		if (current.includes(status)) {
			viewStore.updateFilter(
				'status',
				current.filter((s) => s !== status)
			);
		} else {
			viewStore.updateFilter('status', [...current, status]);
		}
	}

	function getCollectionName(collectionId: string): string {
		return collectionsStore.getById(collectionId)?.name || '';
	}
</script>

<svelte:head>
	<title>{$_('nav.allItems')} | Inventar</title>
</svelte:head>

<div class="space-y-6">
	<div class="flex items-center justify-between">
		<h1 class="text-2xl font-bold text-[hsl(var(--foreground))]">{$_('nav.allItems')}</h1>
		<ViewModeToggle current={viewStore.viewMode} onchange={(m) => viewStore.setViewMode(m)} />
	</div>

	<!-- Search & Filters -->
	<div class="space-y-3">
		<div class="relative">
			<svg
				class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[hsl(var(--muted-foreground))]"
				fill="none"
				stroke="currentColor"
				viewBox="0 0 24 24"
			>
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
				/>
			</svg>
			<input
				type="text"
				bind:value={searchQuery}
				placeholder="{$_('common.search')}..."
				class="w-full rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--input))] py-2.5 pl-10 pr-4 text-[hsl(var(--foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))]"
			/>
		</div>

		<!-- Status filter chips -->
		<div class="flex flex-wrap gap-2">
			{#each statuses as status}
				<button
					onclick={() => toggleStatus(status)}
					class="rounded-full px-3 py-1 text-xs font-medium transition-colors {(
						viewStore.activeFilters.status || []
					).includes(status)
						? 'bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]'
						: 'bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--accent)/0.2)]'}"
				>
					{$_(`status.${status}`)}
				</button>
			{/each}
			{#if viewStore.hasActiveFilters}
				<button
					onclick={() => viewStore.clearFilters()}
					class="rounded-full px-3 py-1 text-xs text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
				>
					{$_('filter.clear')}
				</button>
			{/if}
		</div>
	</div>

	<!-- Results -->
	<p class="text-sm text-[hsl(var(--muted-foreground))]">{sortedItems.length} Items</p>

	{#if sortedItems.length === 0}
		<div class="flex flex-col items-center justify-center py-16">
			<span class="mb-4 text-4xl">🔍</span>
			<p class="text-[hsl(var(--muted-foreground))]">{$_('common.noResults')}</p>
		</div>
	{:else if viewStore.viewMode === 'grid'}
		<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
			{#each sortedItems as item (item.id)}
				<button
					onclick={() => goto(`/items/${item.id}`)}
					class="item-card rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4 text-left"
				>
					<div class="flex items-start justify-between">
						<h3 class="font-semibold text-[hsl(var(--foreground))]">{item.name}</h3>
						<StatusBadge status={item.status} />
					</div>
					<p class="mt-1 text-xs text-[hsl(var(--muted-foreground))]">
						{getCollectionName(item.collectionId)}
					</p>
				</button>
			{/each}
		</div>
	{:else}
		<div class="space-y-2">
			{#each sortedItems as item (item.id)}
				<button
					onclick={() => goto(`/items/${item.id}`)}
					class="flex w-full items-center gap-4 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-4 py-3 text-left transition-colors hover:border-[hsl(var(--primary)/0.3)]"
				>
					<div class="flex-1 min-w-0">
						<div class="flex items-center gap-2">
							<h3 class="font-medium text-[hsl(var(--foreground))] truncate">{item.name}</h3>
							<StatusBadge status={item.status} />
						</div>
						<p class="mt-0.5 text-xs text-[hsl(var(--muted-foreground))]">
							{getCollectionName(item.collectionId)}
						</p>
					</div>
					{#if item.quantity > 1}
						<span class="text-sm text-[hsl(var(--muted-foreground))]">×{item.quantity}</span>
					{/if}
				</button>
			{/each}
		</div>
	{/if}
</div>
