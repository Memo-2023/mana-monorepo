<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { _ } from 'svelte-i18n';
	import { itemsStore } from '$lib/stores/items.svelte';
	import { collectionsStore } from '$lib/stores/collections.svelte';
	import { locationsStore } from '$lib/stores/locations.svelte';
	import { categoriesStore } from '$lib/stores/categories.svelte';
	import type { ItemStatus } from '@inventar/shared';
	import FieldRenderer from '$lib/components/fields/FieldRenderer.svelte';
	import FieldEditor from '$lib/components/fields/FieldEditor.svelte';
	import StatusBadge from '$lib/components/StatusBadge.svelte';

	let itemId = $derived($page.params.id);
	let item = $derived(itemsStore.getById(itemId));
	let collection = $derived(item ? collectionsStore.getById(item.collectionId) : undefined);

	let editing = $state(false);
	let editName = $state('');
	let editDescription = $state('');
	let editStatus = $state<ItemStatus>('owned');
	let editQuantity = $state(1);
	let editFields = $state<Record<string, unknown>>({});
	let editLocationId = $state<string | undefined>();
	let editCategoryId = $state<string | undefined>();

	// Notes
	let newNote = $state('');

	const statuses: ItemStatus[] = ['owned', 'lent', 'stored', 'for_sale', 'disposed'];

	function startEditing() {
		if (!item) return;
		editName = item.name;
		editDescription = item.description || '';
		editStatus = item.status;
		editQuantity = item.quantity;
		editFields = { ...item.fieldValues };
		editLocationId = item.locationId;
		editCategoryId = item.categoryId;
		editing = true;
	}

	function saveEdit() {
		if (!item || !editName.trim()) return;
		itemsStore.update(item.id, {
			name: editName.trim(),
			description: editDescription.trim() || undefined,
			status: editStatus,
			quantity: editQuantity,
			fieldValues: editFields,
			locationId: editLocationId,
			categoryId: editCategoryId,
		});
		editing = false;
	}

	function addNote() {
		if (!item || !newNote.trim()) return;
		itemsStore.addNote(item.id, newNote.trim());
		newNote = '';
	}

	function deleteItem() {
		if (!item || !confirm('Item endgültig löschen?')) return;
		itemsStore.delete(item.id);
		goto(collection ? `/collections/${collection.id}` : '/items');
	}

	const inputClass =
		'w-full rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--input))] px-3 py-2 text-sm text-[hsl(var(--foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))]';
</script>

<svelte:head>
	<title>{item?.name || 'Item'} | Inventar</title>
</svelte:head>

{#if !item}
	<div class="text-center py-16">
		<p class="text-[hsl(var(--muted-foreground))]">Item nicht gefunden</p>
		<a href="/items" class="mt-4 text-[hsl(var(--primary))]">Zurück</a>
	</div>
{:else}
	<div class="mx-auto max-w-2xl space-y-6">
		<!-- Header -->
		<div class="flex items-center justify-between">
			<div class="flex items-center gap-3">
				<button
					onclick={() => goto(collection ? `/collections/${collection.id}` : '/items')}
					class="text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
				>
					<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M15 19l-7-7 7-7"
						/>
					</svg>
				</button>
				{#if !editing}
					<div>
						<h1 class="text-2xl font-bold text-[hsl(var(--foreground))]">{item.name}</h1>
						{#if collection}
							<p class="text-sm text-[hsl(var(--muted-foreground))]">
								{collection.icon}
								{collection.name}
							</p>
						{/if}
					</div>
				{/if}
			</div>
			<div class="flex gap-2">
				{#if editing}
					<button
						onclick={() => (editing = false)}
						class="rounded-lg border border-[hsl(var(--border))] px-3 py-1.5 text-sm"
						>{$_('common.cancel')}</button
					>
					<button
						onclick={saveEdit}
						class="rounded-lg bg-[hsl(var(--primary))] px-4 py-1.5 text-sm font-medium text-[hsl(var(--primary-foreground))]"
						>{$_('common.save')}</button
					>
				{:else}
					<button
						onclick={startEditing}
						class="rounded-lg border border-[hsl(var(--border))] px-3 py-1.5 text-sm text-[hsl(var(--foreground))]"
						>{$_('common.edit')}</button
					>
					<button
						onclick={deleteItem}
						class="rounded-lg border border-red-300 px-3 py-1.5 text-sm text-red-500 hover:bg-red-50 dark:border-red-800 dark:hover:bg-red-900/20"
						>{$_('common.delete')}</button
					>
				{/if}
			</div>
		</div>

		{#if editing}
			<!-- Edit Mode -->
			<div
				class="space-y-4 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5"
			>
				<input type="text" bind:value={editName} placeholder={$_('item.name')} class={inputClass} />
				<textarea
					bind:value={editDescription}
					placeholder={$_('item.description')}
					rows="2"
					class={inputClass}
				></textarea>

				<div class="grid gap-4 sm:grid-cols-2">
					<div>
						<label class="mb-1 block text-xs font-medium text-[hsl(var(--muted-foreground))]"
							>{$_('item.status')}</label
						>
						<select bind:value={editStatus} class={inputClass}>
							{#each statuses as s}<option value={s}>{$_(`status.${s}`)}</option>{/each}
						</select>
					</div>
					<div>
						<label class="mb-1 block text-xs font-medium text-[hsl(var(--muted-foreground))]"
							>{$_('item.quantity')}</label
						>
						<input type="number" bind:value={editQuantity} min="1" class={inputClass} />
					</div>
					{#if locationsStore.locations.length > 0}
						<div>
							<label class="mb-1 block text-xs font-medium text-[hsl(var(--muted-foreground))]"
								>{$_('item.location')}</label
							>
							<select bind:value={editLocationId} class={inputClass}>
								<option value={undefined}>— Kein Standort —</option>
								{#each locationsStore.locations as loc}
									<option value={loc.id}>{loc.path ? `${loc.path}/` : ''}{loc.name}</option>
								{/each}
							</select>
						</div>
					{/if}
					{#if categoriesStore.categories.length > 0}
						<div>
							<label class="mb-1 block text-xs font-medium text-[hsl(var(--muted-foreground))]"
								>{$_('item.category')}</label
							>
							<select bind:value={editCategoryId} class={inputClass}>
								<option value={undefined}>— Keine Kategorie —</option>
								{#each categoriesStore.categories as cat}
									<option value={cat.id}>{cat.name}</option>
								{/each}
							</select>
						</div>
					{/if}
				</div>

				{#if collection}
					<div>
						<h3 class="mb-2 text-sm font-semibold text-[hsl(var(--foreground))]">
							{$_('collection.customFields')}
						</h3>
						<div class="grid gap-3 sm:grid-cols-2">
							{#each collection.schema.fields.sort((a, b) => a.order - b.order) as field}
								<div>
									<label class="mb-1 block text-xs font-medium text-[hsl(var(--muted-foreground))]"
										>{field.name}</label
									>
									<FieldEditor
										{field}
										value={editFields[field.id]}
										onchange={(v) => (editFields = { ...editFields, [field.id]: v })}
									/>
								</div>
							{/each}
						</div>
					</div>
				{/if}
			</div>
		{:else}
			<!-- View Mode -->
			<div class="space-y-4">
				<!-- Status & Meta -->
				<div class="flex flex-wrap items-center gap-3">
					<StatusBadge status={item.status} size="md" />
					{#if item.quantity > 1}
						<span class="rounded-full bg-[hsl(var(--muted))] px-3 py-1 text-sm"
							>×{item.quantity}</span
						>
					{/if}
					{#if item.locationId}
						{@const loc = locationsStore.getById(item.locationId)}
						{#if loc}
							<span class="flex items-center gap-1 text-sm text-[hsl(var(--muted-foreground))]">
								📍 {locationsStore.getFullPath(loc.id)}
							</span>
						{/if}
					{/if}
					{#if item.categoryId}
						{@const cat = categoriesStore.getById(item.categoryId)}
						{#if cat}
							<span class="rounded-full bg-[hsl(var(--muted))] px-2 py-0.5 text-xs"
								>{cat.icon || '🏷️'} {cat.name}</span
							>
						{/if}
					{/if}
				</div>

				{#if item.description}
					<p class="text-[hsl(var(--foreground))]">{item.description}</p>
				{/if}

				<!-- Custom Fields -->
				{#if collection && collection.schema.fields.length > 0}
					<div class="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4">
						<h3 class="mb-3 text-sm font-semibold text-[hsl(var(--foreground))]">Details</h3>
						<div class="grid gap-2 sm:grid-cols-2">
							{#each collection.schema.fields.sort((a, b) => a.order - b.order) as field}
								<div class="flex items-baseline gap-2">
									<span class="text-xs font-medium text-[hsl(var(--muted-foreground))]"
										>{field.name}:</span
									>
									<FieldRenderer {field} value={item.fieldValues[field.id]} />
								</div>
							{/each}
						</div>
					</div>
				{/if}

				<!-- Notes -->
				<div class="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4">
					<h3 class="mb-3 text-sm font-semibold text-[hsl(var(--foreground))]">
						{$_('item.notes')} ({item.notes.length})
					</h3>
					<div class="space-y-2">
						{#each item.notes as note (note.id)}
							<div
								class="group flex items-start justify-between rounded-lg bg-[hsl(var(--muted))] p-3"
							>
								<div>
									<p class="text-sm text-[hsl(var(--foreground))]">{note.content}</p>
									<p class="mt-1 text-xs text-[hsl(var(--muted-foreground))]">
										{new Date(note.createdAt).toLocaleDateString('de-DE')}
									</p>
								</div>
								<button
									onclick={() => itemsStore.deleteNote(item.id, note.id)}
									class="text-[hsl(var(--muted-foreground))] opacity-0 hover:text-red-500 group-hover:opacity-100"
									>×</button
								>
							</div>
						{/each}
					</div>
					<div class="mt-3 flex gap-2">
						<input
							type="text"
							bind:value={newNote}
							placeholder="Notiz hinzufügen..."
							class="flex-1 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--input))] px-3 py-2 text-sm text-[hsl(var(--foreground))]"
							onkeydown={(e) => e.key === 'Enter' && addNote()}
						/>
						<button
							onclick={addNote}
							disabled={!newNote.trim()}
							class="rounded-lg bg-[hsl(var(--primary))] px-3 py-2 text-sm text-[hsl(var(--primary-foreground))] disabled:opacity-50"
							>+</button
						>
					</div>
				</div>
			</div>
		{/if}
	</div>
{/if}
