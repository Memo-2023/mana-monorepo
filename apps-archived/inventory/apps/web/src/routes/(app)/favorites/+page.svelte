<script lang="ts">
	import { _ } from 'svelte-i18n';
	import { onMount } from 'svelte';
	import { itemsStore } from '$lib/stores';
	import { PageHeader } from '@manacore/shared-ui';

	onMount(() => {
		itemsStore.fetchItems({ isFavorite: true, isArchived: false });
	});

	function formatPrice(price: string | null | undefined, currency: string): string {
		if (!price) return '-';
		return new Intl.NumberFormat('de-DE', { style: 'currency', currency }).format(Number(price));
	}
</script>

<svelte:head>
	<title>{$_('favorites.title')} - {$_('app.name')}</title>
</svelte:head>

<div class="p-6">
	<PageHeader title={$_('favorites.title')} />

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
							d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
						/>
					</svg>
				</div>
				<p class="text-theme-secondary">{$_('favorites.empty')}</p>
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
							<svg
								class="w-5 h-5 text-yellow-500 flex-shrink-0"
								fill="currentColor"
								viewBox="0 0 24 24"
							>
								<path
									d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
								/>
							</svg>
						</div>
						<div class="mt-4 text-right">
							<span class="text-theme font-medium">
								{formatPrice(item.purchasePrice, item.currency)}
							</span>
						</div>
					</a>
				{/each}
			</div>
		{/if}
	</div>
</div>
