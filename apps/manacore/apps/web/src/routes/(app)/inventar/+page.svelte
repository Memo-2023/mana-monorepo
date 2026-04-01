<script lang="ts">
	import { goto } from '$app/navigation';
	import { getContext } from 'svelte';
	import { collectionsStore } from '$lib/modules/inventar/stores/collections.svelte';
	import { itemsStore } from '$lib/modules/inventar/stores/items.svelte';
	import {
		getSortedCollections,
		getItemCountByCollection,
		getTotalItemCount,
	} from '$lib/modules/inventar/queries';
	import type { Collection, Item } from '$lib/modules/inventar/queries';
	import { Plus, Trash } from '@manacore/shared-icons';

	const collectionsCtx: { readonly value: Collection[] } = getContext('collections');
	const itemsCtx: { readonly value: Item[] } = getContext('items');

	function getItemCount(collectionId: string): number {
		return getItemCountByCollection(itemsCtx.value, collectionId);
	}

	function handleCollectionClick(collection: Collection) {
		goto(`/inventar/collections/${collection.id}`);
	}

	function handleDelete(e: Event, id: string) {
		e.stopPropagation();
		if (confirm('Sammlung und alle Items loschen?')) {
			itemsStore.deleteByCollection(id);
			collectionsStore.delete(id);
		}
	}

	// Stats
	let totalItems = $derived(getTotalItemCount(itemsCtx.value));
	let totalCollections = $derived(collectionsCtx.value.length);
	let sortedCollections = $derived(getSortedCollections(collectionsCtx.value));
</script>

<svelte:head>
	<title>Inventar - ManaCore</title>
</svelte:head>

<div class="space-y-6">
	<!-- Header -->
	<div class="flex items-center justify-between">
		<div>
			<h1 class="text-2xl font-bold text-[hsl(var(--foreground))]">Sammlungen</h1>
			<p class="text-sm text-[hsl(var(--muted-foreground))]">
				{totalCollections} Sammlungen &middot; {totalItems} Items
			</p>
		</div>
		<a
			href="/inventar/collections/new"
			class="flex items-center gap-2 rounded-lg bg-[hsl(var(--primary))] px-4 py-2 text-sm font-medium text-[hsl(var(--primary-foreground))] transition-colors hover:opacity-90"
		>
			<Plus size={20} />
			Neue Sammlung
		</a>
	</div>

	<!-- Collections grid -->
	{#if sortedCollections.length === 0}
		<div
			class="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-[hsl(var(--border))] py-16"
		>
			<span class="mb-4 text-5xl">📦</span>
			<h2 class="mb-2 text-lg font-semibold text-[hsl(var(--foreground))]">Keine Sammlungen</h2>
			<p class="mb-6 text-sm text-[hsl(var(--muted-foreground))]">
				Erstelle deine erste Sammlung, um loszulegen.
			</p>
			<a
				href="/inventar/collections/new"
				class="rounded-lg bg-[hsl(var(--primary))] px-6 py-2.5 text-sm font-medium text-[hsl(var(--primary-foreground))]"
			>
				Neue Sammlung
			</a>
		</div>
	{:else}
		<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
			{#each sortedCollections as collection (collection.id)}
				<div
					role="button"
					tabindex="0"
					onclick={() => handleCollectionClick(collection)}
					onkeydown={(e) => e.key === 'Enter' && handleCollectionClick(collection)}
					class="group rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5 text-left transition-all hover:border-[hsl(var(--primary)/0.3)]"
				>
					<div class="flex items-start justify-between">
						<div class="flex items-center gap-3">
							<span class="text-2xl">{collection.icon || '📁'}</span>
							<div>
								<h3 class="font-semibold text-[hsl(var(--foreground))]">{collection.name}</h3>
								{#if collection.description}
									<p class="mt-0.5 text-xs text-[hsl(var(--muted-foreground))] line-clamp-1">
										{collection.description}
									</p>
								{/if}
							</div>
						</div>
						<button
							onclick={(e) => handleDelete(e, collection.id)}
							class="rounded p-1 text-[hsl(var(--muted-foreground))] opacity-0 transition-opacity hover:text-red-500 group-hover:opacity-100"
						>
							<Trash size={20} />
						</button>
					</div>

					<div class="mt-4 flex items-center justify-between">
						<span class="text-sm text-[hsl(var(--muted-foreground))]">
							{getItemCount(collection.id)} Items
						</span>
						<div class="flex gap-1">
							{#each collection.schema.fields.slice(0, 3) as field}
								<span
									class="rounded bg-[hsl(var(--muted))] px-1.5 py-0.5 text-[10px] text-[hsl(var(--muted-foreground))]"
								>
									{field.name}
								</span>
							{/each}
							{#if collection.schema.fields.length > 3}
								<span
									class="rounded bg-[hsl(var(--muted))] px-1.5 py-0.5 text-[10px] text-[hsl(var(--muted-foreground))]"
								>
									+{collection.schema.fields.length - 3}
								</span>
							{/if}
						</div>
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>
