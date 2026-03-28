<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { _ } from 'svelte-i18n';
	import { getContext } from 'svelte';
	import { itemsStore } from '$lib/stores/items.svelte';
	import { viewStore } from '$lib/stores/view.svelte';
	import { getCollectionById, getItemsByCollection, getSortedItems } from '$lib/data/queries';
	import type { Collection, Item, ItemStatus } from '@inventar/shared';
	import FieldRenderer from '$lib/components/fields/FieldRenderer.svelte';
	import FieldEditor from '$lib/components/fields/FieldEditor.svelte';
	import StatusBadge from '$lib/components/StatusBadge.svelte';
	import ViewModeToggle from '$lib/components/ViewModeToggle.svelte';

	const collectionsCtx: { readonly value: Collection[] } = getContext('collections');
	const itemsCtx: { readonly value: Item[] } = getContext('items');

	let collectionId = $derived($page.params.id);
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
		if (confirm('Item löschen?')) {
			itemsStore.delete(id);
		}
	}
</script>

<svelte:head>
	<title>{collection?.name || 'Sammlung'} | Inventar</title>
</svelte:head>

{#if !collection}
	<div class="text-center py-16">
		<p class="text-[hsl(var(--muted-foreground))]">Sammlung nicht gefunden</p>
		<a href="/" class="mt-4 text-[hsl(var(--primary))]">Zurück</a>
	</div>
{:else}
	<div class="space-y-6">
		<!-- Header -->
		<div class="flex items-center justify-between">
			<div class="flex items-center gap-3">
				<a href="/" class="text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]">
					<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M15 19l-7-7 7-7"
						/>
					</svg>
				</a>
				<span class="text-2xl">{collection.icon || '📁'}</span>
				<div>
					<h1 class="text-2xl font-bold text-[hsl(var(--foreground))]">{collection.name}</h1>
					{#if collection.description}
						<p class="text-sm text-[hsl(var(--muted-foreground))]">{collection.description}</p>
					{/if}
				</div>
			</div>
			<div class="flex items-center gap-2">
				<ViewModeToggle current={viewStore.viewMode} onchange={(m) => viewStore.setViewMode(m)} />
				<a
					href="/collections/{collection.id}/edit"
					class="rounded-lg border border-[hsl(var(--border))] p-2 text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
				>
					<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
						/>
					</svg>
				</a>
				<button
					onclick={() => (showNewItem = !showNewItem)}
					class="flex items-center gap-2 rounded-lg bg-[hsl(var(--primary))] px-4 py-2 text-sm font-medium text-[hsl(var(--primary-foreground))]"
				>
					<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M12 4v16m8-8H4"
						/>
					</svg>
					{$_('item.create')}
				</button>
			</div>
		</div>

		<!-- New Item Form -->
		{#if showNewItem}
			<div
				class="rounded-xl border border-[hsl(var(--primary)/0.3)] bg-[hsl(var(--card))] p-4 space-y-3"
			>
				<input
					type="text"
					bind:value={newItemName}
					placeholder={$_('item.name')}
					class="w-full rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--input))] px-4 py-2.5 text-[hsl(var(--foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))]"
					onkeydown={(e) => e.key === 'Enter' && createItem()}
				/>

				<!-- Custom fields -->
				{#if collection.schema.fields.length > 0}
					<div class="grid gap-3 sm:grid-cols-2">
						{#each collection.schema.fields.sort((a, b) => a.order - b.order) as field}
							<div>
								<label class="mb-1 block text-xs font-medium text-[hsl(var(--muted-foreground))]">
									{field.name}{field.required ? ' *' : ''}
								</label>
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
						class="rounded-lg border border-[hsl(var(--border))] px-3 py-1.5 text-sm"
					>
						{$_('common.cancel')}
					</button>
					<button
						onclick={createItem}
						disabled={!newItemName.trim()}
						class="rounded-lg bg-[hsl(var(--primary))] px-4 py-1.5 text-sm font-medium text-[hsl(var(--primary-foreground))] disabled:opacity-50"
					>
						{$_('common.create')}
					</button>
				</div>
			</div>
		{/if}

		<!-- Items -->
		{#if sortedItems.length === 0}
			<div
				class="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-[hsl(var(--border))] py-16"
			>
				<span class="mb-4 text-4xl">📭</span>
				<p class="text-[hsl(var(--muted-foreground))]">{$_('item.noItems')}</p>
				<button
					onclick={() => (showNewItem = true)}
					class="mt-4 rounded-lg bg-[hsl(var(--primary))] px-4 py-2 text-sm text-[hsl(var(--primary-foreground))]"
				>
					{$_('item.create')}
				</button>
			</div>
		{:else if viewStore.viewMode === 'grid'}
			<!-- Grid View -->
			<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
				{#each sortedItems as item (item.id)}
					<button
						onclick={() => goto(`/items/${item.id}`)}
						class="item-card group rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4 text-left"
					>
						<div class="flex items-start justify-between">
							<h3 class="font-semibold text-[hsl(var(--foreground))]">{item.name}</h3>
							<StatusBadge status={item.status} />
						</div>
						{#if collection.schema.fields.length > 0}
							<div class="mt-3 space-y-1">
								{#each collection.schema.fields.slice(0, 3) as field}
									{#if item.fieldValues[field.id] !== undefined}
										<div class="flex items-baseline gap-2 text-xs">
											<span class="text-[hsl(var(--muted-foreground))]">{field.name}:</span>
											<FieldRenderer {field} value={item.fieldValues[field.id]} />
										</div>
									{/if}
								{/each}
							</div>
						{/if}
						<button
							onclick={(e) => deleteItem(e, item.id)}
							class="mt-2 text-xs text-[hsl(var(--muted-foreground))] opacity-0 hover:text-red-500 group-hover:opacity-100"
						>
							{$_('common.delete')}
						</button>
					</button>
				{/each}
			</div>
		{:else if viewStore.viewMode === 'table'}
			<!-- Table View -->
			<div class="overflow-x-auto rounded-xl border border-[hsl(var(--border))]">
				<table class="w-full text-sm">
					<thead>
						<tr class="border-b border-[hsl(var(--border))] bg-[hsl(var(--muted))]">
							<th class="px-4 py-2.5 text-left font-medium text-[hsl(var(--muted-foreground))]"
								>{$_('item.name')}</th
							>
							<th class="px-4 py-2.5 text-left font-medium text-[hsl(var(--muted-foreground))]"
								>{$_('item.status')}</th
							>
							{#each collection.schema.fields as field}
								<th class="px-4 py-2.5 text-left font-medium text-[hsl(var(--muted-foreground))]"
									>{field.name}</th
								>
							{/each}
							<th class="w-10"></th>
						</tr>
					</thead>
					<tbody>
						{#each sortedItems as item (item.id)}
							<tr
								class="cursor-pointer border-b border-[hsl(var(--border))] transition-colors hover:bg-[hsl(var(--accent)/0.05)]"
								onclick={() => goto(`/items/${item.id}`)}
							>
								<td class="px-4 py-2.5 font-medium text-[hsl(var(--foreground))]">{item.name}</td>
								<td class="px-4 py-2.5"><StatusBadge status={item.status} /></td>
								{#each collection.schema.fields as field}
									<td class="px-4 py-2.5"
										><FieldRenderer {field} value={item.fieldValues[field.id]} /></td
									>
								{/each}
								<td class="px-4 py-2.5">
									<button
										onclick={(e) => deleteItem(e, item.id)}
										class="text-[hsl(var(--muted-foreground))] hover:text-red-500"
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
					<button
						onclick={() => goto(`/items/${item.id}`)}
						class="group flex w-full items-center gap-4 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-4 py-3 text-left transition-colors hover:border-[hsl(var(--primary)/0.3)]"
					>
						<div class="flex-1 min-w-0">
							<div class="flex items-center gap-2">
								<h3 class="font-medium text-[hsl(var(--foreground))] truncate">{item.name}</h3>
								<StatusBadge status={item.status} />
							</div>
							{#if collection.schema.fields.length > 0}
								<div class="mt-1 flex flex-wrap gap-3 text-xs text-[hsl(var(--muted-foreground))]">
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
							<span class="text-sm text-[hsl(var(--muted-foreground))]">×{item.quantity}</span>
						{/if}
						<button
							onclick={(e) => deleteItem(e, item.id)}
							class="text-[hsl(var(--muted-foreground))] opacity-0 hover:text-red-500 group-hover:opacity-100"
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
					</button>
				{/each}
			</div>
		{/if}
	</div>
{/if}
