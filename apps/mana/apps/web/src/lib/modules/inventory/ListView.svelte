<!--
  Inventory — Workbench ListView
  Collections and items overview.
-->
<script lang="ts">
	import { useLiveQueryWithDefault } from '@mana/local-store/svelte';
	import { db } from '$lib/data/database';
	import { BaseListView } from '@mana/shared-ui';
	import type { ViewProps } from '$lib/app-registry';
	import type { LocalCollection, LocalItem } from './types';

	let { navigate }: ViewProps = $props();

	const collectionsQuery = useLiveQueryWithDefault(async () => {
		const all = await db.table<LocalCollection>('invCollections').orderBy('order').toArray();
		return all.filter((c) => !c.deletedAt);
	}, [] as LocalCollection[]);

	const itemsQuery = useLiveQueryWithDefault(async () => {
		const all = await db.table<LocalItem>('invItems').toArray();
		return all.filter((i) => !i.deletedAt);
	}, [] as LocalItem[]);

	const collections = $derived(collectionsQuery.value);
	const items = $derived(itemsQuery.value);

	function itemsInCollection(collectionId: string): number {
		return items.filter((i) => i.collectionId === collectionId).length;
	}

	const totalValue = $derived(items.reduce((sum, i) => sum + (i.purchaseData?.price ?? 0), 0));
</script>

<BaseListView items={collections} getKey={(c) => c.id} emptyTitle="Keine Sammlungen">
	{#snippet header()}
		<span>{items.length} Gegenstände</span>
		{#if totalValue > 0}
			<span>~{totalValue.toFixed(0)} EUR</span>
		{/if}
	{/snippet}

	{#snippet item(collection)}
		<button
			onclick={() =>
				navigate('detail', {
					collectionId: collection.id,
					_siblingIds: collections.map((c) => c.id),
					_siblingKey: 'collectionId',
				})}
			class="mb-2 w-full rounded-md border border-white/10 px-3 py-2.5 text-left transition-colors hover:bg-white/5 min-h-[44px]"
		>
			<div class="flex items-center gap-2">
				{#if collection.icon}
					<span class="text-sm">{collection.icon}</span>
				{/if}
				<p class="flex-1 truncate text-sm font-medium text-white/80">{collection.name}</p>
				<span class="text-xs text-white/40">{itemsInCollection(collection.id)}</span>
			</div>
			{#if collection.description}
				<p class="mt-1 truncate text-xs text-white/30">{collection.description}</p>
			{/if}
		</button>
	{/snippet}
</BaseListView>
