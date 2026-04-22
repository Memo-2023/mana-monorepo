<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { CaretLeft, PencilSimple, Plus, Trash } from '@mana/shared-icons';
	import { getContext } from 'svelte';
	import { itemsStore } from '$lib/modules/inventory/stores/items.svelte';
	import { viewStore } from '$lib/modules/inventory/stores/view.svelte';
	import {
		getCollectionById,
		getItemsByCollection,
		getSortedItems,
	} from '$lib/modules/inventory/queries';
	import type { Collection, Item, ItemStatus } from '$lib/modules/inventory/queries';
	import FieldRenderer from '$lib/modules/inventory/components/fields/FieldRenderer.svelte';
	import FieldEditor from '$lib/modules/inventory/components/fields/FieldEditor.svelte';
	import StatusBadge from '$lib/modules/inventory/components/StatusBadge.svelte';
	import ViewModeToggle from '$lib/modules/inventory/components/ViewModeToggle.svelte';
	import { RoutePage } from '$lib/components/shell';

	const collectionsCtx: { readonly value: Collection[] } = getContext('collections');
	const itemsCtx: { readonly value: Item[] } = getContext('items');

	let collectionId = $derived($page.params.id ?? '');
	let collection = $derived(getCollectionById(collectionsCtx.value, collectionId));
	let items = $derived(getItemsByCollection(itemsCtx.value, collectionId));
	let sortedItems = $derived(getSortedItems(items, viewStore.sort));

	// Item creation
	let showNewItem = $state(false);
	let newItemName = $state('');
	let newItemFields = $state<Record<string, unknown>>({});
	let newItemStatus = $state<ItemStatus>('owned');

	async function createItem() {
		if (!newItemName.trim() || !collection) return;
		await itemsStore.create({
			collectionId: collection.id,
			name: newItemName.trim(),
			status: newItemStatus,
			fieldValues: newItemFields,
		});
		newItemName = '';
		newItemFields = {};
		newItemStatus = 'owned';
		showNewItem = false;
	}

	function deleteItem(e: Event, id: string) {
		e.stopPropagation();
		if (confirm('Item loschen?')) {
			itemsStore.delete(id);
		}
	}
</script>

<svelte:head>
	<title>{collection?.name || 'Sammlung'} - Inventar - Mana</title>
</svelte:head>

<RoutePage appId="inventory" backHref="/inventory" title="Sammlung">
	{#if !collection}
		<div class="text-center py-16">
			<p class="text-[hsl(var(--color-muted-foreground))]">Sammlung nicht gefunden</p>
			<a href="/inventory" class="mt-4 text-[hsl(var(--color-primary))]">Zuruck</a>
		</div>
	{:else}
		<div class="space-y-6">
			<!-- Header -->
			<div class="flex items-center justify-between">
				<div class="flex items-center gap-3">
					<a
						href="/inventory"
						class="text-[hsl(var(--color-muted-foreground))] hover:text-[hsl(var(--color-foreground))]"
					>
						<CaretLeft size={20} />
					</a>
					<span class="text-2xl">{collection.icon || '📁'}</span>
					<div>
						<h1 class="text-2xl font-bold text-[hsl(var(--color-foreground))]">
							{collection.name}
						</h1>
						{#if collection.description}
							<p class="text-sm text-[hsl(var(--color-muted-foreground))]">
								{collection.description}
							</p>
						{/if}
					</div>
				</div>
				<div class="flex items-center gap-2">
					<ViewModeToggle current={viewStore.viewMode} onchange={(m) => viewStore.setViewMode(m)} />
					<a
						href="/inventory/collections/{collection.id}/edit"
						class="rounded-lg border border-[hsl(var(--color-border))] p-2 text-[hsl(var(--color-muted-foreground))] hover:text-[hsl(var(--color-foreground))]"
					>
						<PencilSimple size={16} />
					</a>
					<button
						onclick={() => (showNewItem = !showNewItem)}
						class="flex items-center gap-2 rounded-lg bg-[hsl(var(--color-primary))] px-4 py-2 text-sm font-medium text-[hsl(var(--color-primary-foreground))]"
					>
						<Plus size={16} />
						Neues Item
					</button>
				</div>
			</div>

			<!-- New Item Form -->
			{#if showNewItem}
				<div
					class="rounded-xl border border-[hsl(var(--color-primary)/0.3)] bg-[hsl(var(--color-card))] p-4 space-y-3"
				>
					<input
						type="text"
						bind:value={newItemName}
						placeholder="Item-Name"
						class="w-full rounded-lg border border-[hsl(var(--color-border))] bg-[hsl(var(--color-input))] px-4 py-2.5 text-[hsl(var(--color-foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--color-primary))]"
						onkeydown={(e) => e.key === 'Enter' && createItem()}
					/>

					<!-- Custom fields -->
					{#if collection.schema.fields.length > 0}
						<div class="grid gap-3 sm:grid-cols-2">
							{#each collection.schema.fields.sort((a, b) => a.order - b.order) as field}
								<div>
									<span
										class="mb-1 block text-xs font-medium text-[hsl(var(--color-muted-foreground))]"
									>
										{field.name}{field.required ? ' *' : ''}
									</span>
									<FieldEditor
										{field}
										value={newItemFields[field.id]}
										onchange={(v) => (newItemFields = { ...newItemFields, [field.id]: v })}
									/>
								</div>
							{/each}
						</div>
					{/if}

					<div class="flex justify-end gap-2">
						<button
							onclick={() => (showNewItem = false)}
							class="rounded-lg border border-[hsl(var(--color-border))] px-3 py-1.5 text-sm"
						>
							Abbrechen
						</button>
						<button
							onclick={createItem}
							disabled={!newItemName.trim()}
							class="rounded-lg bg-[hsl(var(--color-primary))] px-4 py-1.5 text-sm font-medium text-[hsl(var(--color-primary-foreground))] disabled:opacity-50"
						>
							Erstellen
						</button>
					</div>
				</div>
			{/if}

			<!-- Items -->
			{#if sortedItems.length === 0}
				<div
					class="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-[hsl(var(--color-border))] py-16"
				>
					<span class="mb-4 text-4xl">📭</span>
					<p class="text-[hsl(var(--color-muted-foreground))]">Keine Items vorhanden</p>
					<button
						onclick={() => (showNewItem = true)}
						class="mt-4 rounded-lg bg-[hsl(var(--color-primary))] px-4 py-2 text-sm text-[hsl(var(--color-primary-foreground))]"
					>
						Neues Item
					</button>
				</div>
			{:else if viewStore.viewMode === 'grid'}
				<!-- Grid View -->
				<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
					{#each sortedItems as item (item.id)}
						<div
							onclick={() => goto(`/inventory/items/${item.id}`)}
							onkeydown={(e) => e.key === 'Enter' && goto(`/inventory/items/${item.id}`)}
							role="button"
							tabindex="0"
							class="group cursor-pointer rounded-xl border border-[hsl(var(--color-border))] bg-[hsl(var(--color-card))] p-4 text-left"
						>
							<div class="flex items-start justify-between">
								<h3 class="font-semibold text-[hsl(var(--color-foreground))]">{item.name}</h3>
								<StatusBadge status={item.status} />
							</div>
							{#if collection.schema.fields.length > 0}
								<div class="mt-3 space-y-1">
									{#each collection.schema.fields.slice(0, 3) as field}
										{#if item.fieldValues[field.id] !== undefined}
											<div class="flex items-baseline gap-2 text-xs">
												<span class="text-[hsl(var(--color-muted-foreground))]">{field.name}:</span>
												<FieldRenderer {field} value={item.fieldValues[field.id]} />
											</div>
										{/if}
									{/each}
								</div>
							{/if}
							<button
								onclick={(e) => deleteItem(e, item.id)}
								class="mt-2 text-xs text-[hsl(var(--color-muted-foreground))] opacity-0 hover:text-red-500 group-hover:opacity-100"
							>
								Loschen
							</button>
						</div>
					{/each}
				</div>
			{:else if viewStore.viewMode === 'table'}
				<!-- Table View -->
				<div class="overflow-x-auto rounded-xl border border-[hsl(var(--color-border))]">
					<table class="w-full text-sm">
						<thead>
							<tr class="border-b border-[hsl(var(--color-border))] bg-[hsl(var(--color-muted))]">
								<th
									class="px-4 py-2.5 text-left font-medium text-[hsl(var(--color-muted-foreground))]"
									>Name</th
								>
								<th
									class="px-4 py-2.5 text-left font-medium text-[hsl(var(--color-muted-foreground))]"
									>Status</th
								>
								{#each collection.schema.fields as field}
									<th
										class="px-4 py-2.5 text-left font-medium text-[hsl(var(--color-muted-foreground))]"
										>{field.name}</th
									>
								{/each}
								<th class="w-10"></th>
							</tr>
						</thead>
						<tbody>
							{#each sortedItems as item (item.id)}
								<tr
									class="cursor-pointer border-b border-[hsl(var(--color-border))] transition-colors hover:bg-[hsl(var(--color-accent)/0.05)]"
									onclick={() => goto(`/inventory/items/${item.id}`)}
								>
									<td class="px-4 py-2.5 font-medium text-[hsl(var(--color-foreground))]"
										>{item.name}</td
									>
									<td class="px-4 py-2.5"><StatusBadge status={item.status} /></td>
									{#each collection.schema.fields as field}
										<td class="px-4 py-2.5"
											><FieldRenderer {field} value={item.fieldValues[field.id]} /></td
										>
									{/each}
									<td class="px-4 py-2.5">
										<button
											onclick={(e) => deleteItem(e, item.id)}
											class="text-[hsl(var(--color-muted-foreground))] hover:text-red-500"
										>
											<Trash size={16} />
										</button>
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			{:else}
				<!-- List View -->
				<div class="space-y-2">
					{#each sortedItems as item (item.id)}
						<div
							onclick={() => goto(`/inventory/items/${item.id}`)}
							onkeydown={(e) => e.key === 'Enter' && goto(`/inventory/items/${item.id}`)}
							role="button"
							tabindex="0"
							class="group flex w-full cursor-pointer items-center gap-4 rounded-lg border border-[hsl(var(--color-border))] bg-[hsl(var(--color-card))] px-4 py-3 text-left transition-colors hover:border-[hsl(var(--color-primary)/0.3)]"
						>
							<div class="flex-1 min-w-0">
								<div class="flex items-center gap-2">
									<h3 class="font-medium text-[hsl(var(--color-foreground))] truncate">
										{item.name}
									</h3>
									<StatusBadge status={item.status} />
								</div>
								{#if collection.schema.fields.length > 0}
									<div
										class="mt-1 flex flex-wrap gap-3 text-xs text-[hsl(var(--color-muted-foreground))]"
									>
										{#each collection.schema.fields.slice(0, 4) as field}
											{#if item.fieldValues[field.id] !== undefined}
												<span
													>{field.name}: <FieldRenderer
														{field}
														value={item.fieldValues[field.id]}
													/></span
												>
											{/if}
										{/each}
									</div>
								{/if}
							</div>
							{#if item.quantity > 1}
								<span class="text-sm text-[hsl(var(--color-muted-foreground))]"
									>&times;{item.quantity}</span
								>
							{/if}
							<button
								onclick={(e) => deleteItem(e, item.id)}
								class="text-[hsl(var(--color-muted-foreground))] opacity-0 hover:text-red-500 group-hover:opacity-100"
							>
								<Trash size={16} />
							</button>
						</div>
					{/each}
				</div>
			{/if}
		</div>
	{/if}
</RoutePage>
