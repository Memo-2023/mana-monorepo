<!--
  Inventory — Workbench ListView
  Collections overview with quick item creation.
-->
<script lang="ts">
	import { useLiveQueryWithDefault } from '@mana/local-store/svelte';
	import { db } from '$lib/data/database';
	import { BaseListView } from '@mana/shared-ui';
	import { Plus } from '@mana/shared-icons';
	import type { ViewProps } from '$lib/app-registry';
	import type { LocalCollection, LocalItem } from './types';
	import { itemsStore } from './stores/items.svelte';

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

	// ── Quick-add item ──────────────────────────────────────
	let showAdd = $state(false);
	let newItemName = $state('');
	let selectedCollectionId = $state<string | null>(null);

	// Default to first collection
	$effect(() => {
		if (!selectedCollectionId && collections.length > 0) {
			selectedCollectionId = collections[0]!.id;
		}
	});

	async function addItem() {
		const name = newItemName.trim();
		if (!name || !selectedCollectionId) return;
		await itemsStore.create({
			collectionId: selectedCollectionId,
			name,
		});
		newItemName = '';
	}
</script>

<BaseListView items={collections} getKey={(c) => c.id} emptyTitle="Keine Sammlungen">
	{#snippet header()}
		<span>{items.length} Gegenstände</span>
		{#if totalValue > 0}
			<span>~{totalValue.toFixed(0)} EUR</span>
		{/if}
	{/snippet}

	{#snippet listHeader()}
		{#if collections.length > 0}
			{#if showAdd}
				<form
					onsubmit={(e) => {
						e.preventDefault();
						addItem();
					}}
					class="quick-add"
				>
					<select class="collection-select" bind:value={selectedCollectionId}>
						{#each collections as col (col.id)}
							<option value={col.id}>
								{col.icon ? `${col.icon} ` : ''}{col.name}
							</option>
						{/each}
					</select>
					<!-- svelte-ignore a11y_autofocus -->
					<input
						class="add-input"
						bind:value={newItemName}
						placeholder="Neuer Gegenstand..."
						autofocus
					/>
					<button type="submit" class="submit-btn" disabled={!newItemName.trim()}>
						<Plus size={14} />
					</button>
				</form>
			{:else}
				<button class="add-toggle" onclick={() => (showAdd = true)}>
					<Plus size={14} />
					<span>Gegenstand hinzufügen</span>
				</button>
			{/if}
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

<style>
	.quick-add {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		padding: 0.375rem;
		margin-bottom: 0.625rem;
		border-radius: 0.375rem;
		border: 1px solid hsl(var(--color-border));
		background: transparent;
	}

	.collection-select {
		flex-shrink: 0;
		max-width: 7rem;
		padding: 0.1875rem 0.375rem;
		border: none;
		border-right: 1px solid hsl(var(--color-border));
		background: transparent;
		color: hsl(var(--color-muted-foreground));
		font-size: 0.6875rem;
		outline: none;
		cursor: pointer;
	}
	.collection-select option {
		background: hsl(var(--color-card));
		color: hsl(var(--color-foreground));
	}

	.add-input {
		flex: 1;
		min-width: 0;
		border: none;
		background: transparent;
		outline: none;
		font-size: 0.8125rem;
		color: hsl(var(--color-foreground));
		padding: 0.125rem 0.25rem;
	}
	.add-input::placeholder {
		color: hsl(var(--color-muted-foreground));
	}

	.submit-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 24px;
		height: 24px;
		border: none;
		border-radius: 0.25rem;
		background: transparent;
		color: hsl(var(--color-muted-foreground));
		cursor: pointer;
		flex-shrink: 0;
		transition: all 0.15s;
	}
	.submit-btn:hover:not(:disabled) {
		background: hsl(var(--color-surface-hover));
		color: hsl(var(--color-foreground));
	}
	.submit-btn:disabled {
		opacity: 0.3;
		cursor: default;
	}

	.add-toggle {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		width: 100%;
		padding: 0.375rem 0.5rem;
		margin-bottom: 0.625rem;
		border: 1px dashed hsl(var(--color-border));
		border-radius: 0.375rem;
		background: transparent;
		color: hsl(var(--color-muted-foreground));
		font-size: 0.75rem;
		cursor: pointer;
		transition: all 0.15s;
	}
	.add-toggle:hover {
		border-color: hsl(var(--color-border-strong));
		color: hsl(var(--color-foreground));
		background: hsl(var(--color-surface-hover));
	}
</style>
