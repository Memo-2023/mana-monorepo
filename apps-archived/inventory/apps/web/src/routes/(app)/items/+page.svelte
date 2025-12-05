<script lang="ts">
	import { goto } from '$app/navigation';
	import { _ } from 'svelte-i18n';
	import { onMount } from 'svelte';
	import { itemsStore, categoriesStore, locationsStore } from '$lib/stores';
	import { PageHeader, Button, Input } from '@manacore/shared-ui';
	import type { ItemCondition } from '@inventory/shared';

	let searchQuery = $state('');
	let searchTimeout: ReturnType<typeof setTimeout>;

	onMount(() => {
		itemsStore.fetchItems();
	});

	function handleSearch(value: string) {
		searchQuery = value;

		clearTimeout(searchTimeout);
		searchTimeout = setTimeout(() => {
			itemsStore.fetchItems({ search: value, page: 1 });
		}, 300);
	}

	function handleFilterChange(key: string, value: string | undefined) {
		itemsStore.fetchItems({ [key]: value || undefined, page: 1 });
	}

	function getConditionLabel(condition: ItemCondition): string {
		return $_(`conditions.${condition}`);
	}

	function formatPrice(price: string | null | undefined, currency: string): string {
		if (!price) return '-';
		return new Intl.NumberFormat('de-DE', { style: 'currency', currency }).format(Number(price));
	}
</script>

<svelte:head>
	<title>{$_('items.title')} - {$_('app.name')}</title>
</svelte:head>

<div class="p-6">
	<PageHeader title={$_('items.title')}>
		{#snippet actions()}
			<Button onclick={() => goto('/items/new')}>
				<svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M12 4v16m8-8H4"
					/>
				</svg>
				{$_('items.new')}
			</Button>
		{/snippet}
	</PageHeader>

	<!-- Filters -->
	<div class="mt-6 flex flex-wrap gap-4">
		<div class="flex-1 min-w-[200px]">
			<Input
				type="text"
				placeholder={$_('items.search')}
				value={searchQuery}
				oninput={handleSearch}
			/>
		</div>

		<select
			class="rounded-lg border border-theme bg-theme px-3 py-2 text-sm"
			onchange={(e) => handleFilterChange('categoryId', (e.target as HTMLSelectElement).value)}
		>
			<option value="">{$_('common.all')} {$_('nav.categories')}</option>
			{#each categoriesStore.flatCategories as category}
				<option value={category.id}>{'  '.repeat(category.level)}{category.name}</option>
			{/each}
		</select>

		<select
			class="rounded-lg border border-theme bg-theme px-3 py-2 text-sm"
			onchange={(e) => handleFilterChange('locationId', (e.target as HTMLSelectElement).value)}
		>
			<option value="">{$_('common.all')} {$_('nav.locations')}</option>
			{#each locationsStore.flatLocations as location}
				<option value={location.id}>{'  '.repeat(location.level)}{location.name}</option>
			{/each}
		</select>

		<select
			class="rounded-lg border border-theme bg-theme px-3 py-2 text-sm"
			onchange={(e) => handleFilterChange('condition', (e.target as HTMLSelectElement).value)}
		>
			<option value="">{$_('common.all')} {$_('item.condition')}</option>
			<option value="new">{$_('conditions.new')}</option>
			<option value="like_new">{$_('conditions.like_new')}</option>
			<option value="good">{$_('conditions.good')}</option>
			<option value="fair">{$_('conditions.fair')}</option>
			<option value="poor">{$_('conditions.poor')}</option>
		</select>
	</div>

	<!-- Items List -->
	<div class="mt-6">
		{#if itemsStore.loading}
			<div class="flex items-center justify-center py-12">
				<div
					class="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"
				></div>
			</div>
		{:else if itemsStore.items.length === 0}
			<div class="text-center py-12">
				<div
					class="w-16 h-16 mx-auto mb-4 rounded-full bg-theme-secondary/10 flex items-center justify-center"
				>
					<svg
						class="w-8 h-8 text-theme-secondary"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
						/>
					</svg>
				</div>
				<p class="text-theme-secondary">{$_('items.empty')}</p>
				<Button class="mt-4" onclick={() => goto('/items/new')}>
					{$_('items.emptyCreate')}
				</Button>
			</div>
		{:else}
			<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
				{#each itemsStore.items as item}
					<a
						href="/items/{item.id}"
						class="group block rounded-xl border border-theme bg-surface p-4 transition-all hover:border-primary hover:shadow-lg"
					>
						<div class="flex items-start justify-between">
							<div class="flex-1 min-w-0">
								<h3 class="font-medium text-theme truncate">{item.name}</h3>
								{#if item.category}
									<p class="text-xs text-theme-secondary mt-1">{item.category.name}</p>
								{/if}
							</div>
							{#if item.isFavorite}
								<svg
									class="w-5 h-5 text-yellow-500 flex-shrink-0"
									fill="currentColor"
									viewBox="0 0 24 24"
								>
									<path
										d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
									/>
								</svg>
							{/if}
						</div>

						<div class="mt-4 flex items-center justify-between text-sm">
							<span
								class="px-2 py-1 rounded-full text-xs bg-theme-secondary/10 text-theme-secondary"
							>
								{getConditionLabel(item.condition)}
							</span>
							<span class="text-theme font-medium">
								{formatPrice(item.purchasePrice, item.currency)}
							</span>
						</div>

						{#if item.location}
							<div class="mt-3 flex items-center gap-1 text-xs text-theme-secondary">
								<svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
									/>
								</svg>
								<span class="truncate">{item.location.name}</span>
							</div>
						{/if}
					</a>
				{/each}
			</div>

			<!-- Pagination -->
			{#if itemsStore.pagination && itemsStore.pagination.totalPages > 1}
				<div class="mt-6 flex items-center justify-center gap-2">
					<Button
						variant="outline"
						disabled={itemsStore.pagination.page <= 1}
						onclick={() => itemsStore.fetchItems({ page: itemsStore.pagination!.page - 1 })}
					>
						Zurück
					</Button>
					<span class="text-sm text-theme-secondary">
						Seite {itemsStore.pagination.page} von {itemsStore.pagination.totalPages}
					</span>
					<Button
						variant="outline"
						disabled={itemsStore.pagination.page >= itemsStore.pagination.totalPages}
						onclick={() => itemsStore.fetchItems({ page: itemsStore.pagination!.page + 1 })}
					>
						Weiter
					</Button>
				</div>
			{/if}
		{/if}
	</div>
</div>
