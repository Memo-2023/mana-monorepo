<script lang="ts">
	import { goto } from '$app/navigation';
	import { _ } from 'svelte-i18n';
	import { collectionsStore } from '$lib/stores/collections.svelte';
	import { itemsStore } from '$lib/stores/items.svelte';
	import type { Collection } from '@inventar/shared';

	function getItemCount(collectionId: string): number {
		return itemsStore.getCountByCollection(collectionId);
	}

	function handleCollectionClick(collection: Collection) {
		goto(`/collections/${collection.id}`);
	}

	function handleDelete(e: Event, id: string) {
		e.stopPropagation();
		if (confirm('Sammlung und alle Items löschen?')) {
			itemsStore.deleteByCollection(id);
			collectionsStore.delete(id);
		}
	}

	// Stats
	let totalItems = $derived(itemsStore.getTotalCount());
	let totalCollections = $derived(collectionsStore.collections.length);
</script>

<svelte:head>
	<title>Inventar</title>
</svelte:head>

<div class="space-y-6">
	<!-- Header -->
	<div class="flex items-center justify-between">
		<div>
			<h1 class="text-2xl font-bold text-[hsl(var(--foreground))]">{$_('nav.collections')}</h1>
			<p class="text-sm text-[hsl(var(--muted-foreground))]">
				{totalCollections} Sammlungen · {totalItems} Items
			</p>
		</div>
		<a
			href="/collections/new"
			class="flex items-center gap-2 rounded-lg bg-[hsl(var(--primary))] px-4 py-2 text-sm font-medium text-[hsl(var(--primary-foreground))] transition-colors hover:opacity-90"
		>
			<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
			</svg>
			{$_('collection.create')}
		</a>
	</div>

	<!-- Collections grid -->
	{#if collectionsStore.collections.length === 0}
		<div
			class="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-[hsl(var(--border))] py-16"
		>
			<span class="mb-4 text-5xl">📦</span>
			<h2 class="mb-2 text-lg font-semibold text-[hsl(var(--foreground))]">
				{$_('collection.noCollections')}
			</h2>
			<p class="mb-6 text-sm text-[hsl(var(--muted-foreground))]">
				Erstelle deine erste Sammlung, um loszulegen.
			</p>
			<a
				href="/collections/new"
				class="rounded-lg bg-[hsl(var(--primary))] px-6 py-2.5 text-sm font-medium text-[hsl(var(--primary-foreground))]"
			>
				{$_('collection.create')}
			</a>
		</div>
	{:else}
		<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
			{#each collectionsStore.collections.sort((a, b) => a.order - b.order) as collection (collection.id)}
				<div
					role="button"
					tabindex="0"
					onclick={() => handleCollectionClick(collection)}
					class="item-card group rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5 text-left transition-all hover:border-[hsl(var(--primary)/0.3)]"
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
							<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
								/>
							</svg>
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
