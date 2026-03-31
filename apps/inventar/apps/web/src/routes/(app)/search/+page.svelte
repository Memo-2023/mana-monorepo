<script lang="ts">
	import { goto } from '$app/navigation';
	import { _ } from 'svelte-i18n';
	import { getContext } from 'svelte';
	import { getFilteredItems, getCollectionById } from '$lib/data/queries';
	import type { Collection, Item } from '@inventar/shared';
	import StatusBadge from '$lib/components/StatusBadge.svelte';
	import { MagnifyingGlass } from '@manacore/shared-icons';

	const collectionsCtx: { readonly value: Collection[] } = getContext('collections');
	const itemsCtx: { readonly value: Item[] } = getContext('items');

	let query = $state('');
	let results = $derived(
		query.length >= 2 ? getFilteredItems(itemsCtx.value, { search: query }) : []
	);
</script>

<svelte:head>
	<title>{$_('nav.search')} | Inventar</title>
</svelte:head>

<div class="mx-auto max-w-2xl space-y-6">
	<h1 class="text-2xl font-bold text-[hsl(var(--foreground))]">{$_('nav.search')}</h1>

	<div class="relative">
		<MagnifyingGlass
			size={20}
			class="absolute left-3 top-1/2 -translate-y-1/2 text-[hsl(var(--muted-foreground))]"
		/>
		<input
			type="text"
			bind:value={query}
			placeholder="{$_('common.search')} in allen Items..."
			class="w-full rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--input))] py-3 pl-11 pr-4 text-lg text-[hsl(var(--foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))]"
			autofocus
		/>
	</div>

	{#if query.length >= 2}
		<p class="text-sm text-[hsl(var(--muted-foreground))]">{results.length} Ergebnisse</p>
		<div class="space-y-2">
			{#each results as item (item.id)}
				<button
					onclick={() => goto(`/items/${item.id}`)}
					class="flex w-full items-center gap-4 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-4 py-3 text-left transition-colors hover:border-[hsl(var(--primary)/0.3)]"
				>
					<div class="flex-1">
						<div class="flex items-center gap-2">
							<h3 class="font-medium text-[hsl(var(--foreground))]">{item.name}</h3>
							<StatusBadge status={item.status} />
						</div>
						<p class="text-xs text-[hsl(var(--muted-foreground))]">
							{getCollectionById(collectionsCtx.value, item.collectionId)?.name || ''}
						</p>
					</div>
				</button>
			{/each}
		</div>
	{:else if query.length > 0}
		<p class="text-sm text-[hsl(var(--muted-foreground))]">Mindestens 2 Zeichen eingeben...</p>
	{/if}
</div>
