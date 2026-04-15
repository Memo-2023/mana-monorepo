<script lang="ts">
	import { goto } from '$app/navigation';
	import { getContext } from 'svelte';
	import { getFilteredItems, getCollectionById } from '$lib/modules/inventory/queries';
	import type { Collection, Item } from '$lib/modules/inventory/queries';
	import StatusBadge from '$lib/modules/inventory/components/StatusBadge.svelte';
	import { MagnifyingGlass } from '@mana/shared-icons';

	const collectionsCtx: { readonly value: Collection[] } = getContext('collections');
	const itemsCtx: { readonly value: Item[] } = getContext('items');

	let query = $state('');
	let results = $derived(
		query.length >= 2 ? getFilteredItems(itemsCtx.value, { search: query }) : []
	);
</script>

<svelte:head>
	<title>Suche - Inventar - Mana</title>
</svelte:head>

<div class="mx-auto max-w-2xl space-y-6">
	<h1 class="text-2xl font-bold text-[hsl(var(--color-foreground))]">Suche</h1>

	<div class="relative">
		<MagnifyingGlass
			size={20}
			class="absolute left-3 top-1/2 -translate-y-1/2 text-[hsl(var(--color-muted-foreground))]"
		/>
		<!-- svelte-ignore a11y_autofocus -->
		<input
			type="text"
			bind:value={query}
			placeholder="In allen Items suchen..."
			class="w-full rounded-xl border border-[hsl(var(--color-border))] bg-[hsl(var(--color-input))] py-3 pl-11 pr-4 text-lg text-[hsl(var(--color-foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--color-primary))]"
			autofocus
		/>
	</div>

	{#if query.length >= 2}
		<p class="text-sm text-[hsl(var(--color-muted-foreground))]">{results.length} Ergebnisse</p>
		<div class="space-y-2">
			{#each results as item (item.id)}
				<button
					onclick={() => goto(`/inventory/items/${item.id}`)}
					class="flex w-full items-center gap-4 rounded-lg border border-[hsl(var(--color-border))] bg-[hsl(var(--color-card))] px-4 py-3 text-left transition-colors hover:border-[hsl(var(--color-primary)/0.3)]"
				>
					<div class="flex-1">
						<div class="flex items-center gap-2">
							<h3 class="font-medium text-[hsl(var(--color-foreground))]">{item.name}</h3>
							<StatusBadge status={item.status} />
						</div>
						<p class="text-xs text-[hsl(var(--color-muted-foreground))]">
							{getCollectionById(collectionsCtx.value, item.collectionId)?.name || ''}
						</p>
					</div>
				</button>
			{/each}
		</div>
	{:else if query.length > 0}
		<p class="text-sm text-[hsl(var(--color-muted-foreground))]">
			Mindestens 2 Zeichen eingeben...
		</p>
	{/if}
</div>
