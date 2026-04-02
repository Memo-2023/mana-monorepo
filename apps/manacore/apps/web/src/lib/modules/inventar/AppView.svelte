<!--
  Inventar — Split-Screen AppView
  Collections and items overview.
-->
<script lang="ts">
	import { liveQuery } from 'dexie';
	import { db } from '$lib/data/database';
	import type { ViewProps } from '$lib/components/workbench/nav-stack';
	import type { LocalCollection, LocalItem } from './types';

	let { navigate, goBack, params }: ViewProps = $props();

	let collections = $state<LocalCollection[]>([]);
	let items = $state<LocalItem[]>([]);

	$effect(() => {
		const sub = liveQuery(async () => {
			return db
				.table<LocalCollection>('inventarCollections')
				.orderBy('order')
				.toArray()
				.then((all) => all.filter((c) => !c.deletedAt));
		}).subscribe((val) => {
			collections = val ?? [];
		});
		return () => sub.unsubscribe();
	});

	$effect(() => {
		const sub = liveQuery(async () => {
			return db
				.table<LocalItem>('inventarItems')
				.toArray()
				.then((all) => all.filter((i) => !i.deletedAt));
		}).subscribe((val) => {
			items = val ?? [];
		});
		return () => sub.unsubscribe();
	});

	function itemsInCollection(collectionId: string): number {
		return items.filter((i) => i.collectionId === collectionId).length;
	}

	const totalValue = $derived(() => {
		return items.reduce((sum, i) => sum + (i.purchaseData?.price ?? 0), 0);
	});
</script>

<div class="flex h-full flex-col gap-3 p-4">
	<div class="flex gap-3 text-xs text-white/40">
		<span>{items.length} Gegenstände</span>
		{#if totalValue() > 0}
			<span>~{totalValue().toFixed(0)} EUR</span>
		{/if}
	</div>

	<div class="flex-1 overflow-auto">
		{#each collections as collection (collection.id)}
			<button
				onclick={() =>
					navigate('detail', {
						collectionId: collection.id,
						_siblingIds: collections.map((c) => c.id),
						_siblingKey: 'collectionId',
					})}
				class="mb-2 w-full rounded-md border border-white/10 px-3 py-2.5 text-left transition-colors hover:bg-white/5"
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
		{/each}

		{#if collections.length === 0}
			<p class="py-8 text-center text-sm text-white/30">Keine Sammlungen</p>
		{/if}
	</div>
</div>
