<script lang="ts">
	import { goto } from '$app/navigation';
	import {
		Plus,
		Star,
		Check,
		Archive,
		Link as LinkIcon,
		MagnifyingGlass,
		CaretUp,
		CaretDown,
		Minus,
		ShootingStar,
		Folder,
		X,
		Trash,
	} from '@mana/shared-icons';
	import { wishesStore } from './stores/wishes.svelte';
	import { listsStore } from './stores/lists.svelte';
	import {
		useAllWishes,
		useAllLists,
		filterByStatus,
		filterByList,
		searchWishes,
		getTotalEstimatedCost,
	} from './queries';

	const allWishes = useAllWishes();
	const allLists = useAllLists();

	let filter = $state<'active' | 'fulfilled' | 'all'>('active');
	let selectedListId = $state<string | null>(null);
	let searchQuery = $state('');
	let showAdd = $state(false);
	let newTitle = $state('');
	let newTargetPrice = $state('');
	let newCategory = $state('');
	let showNewList = $state(false);
	let newListName = $state('');

	const wishes = $derived(allWishes.value);
	const lists = $derived(allLists.value);

	const filtered = $derived.by(() => {
		let result = wishes;
		if (filter !== 'all') result = filterByStatus(result, filter);
		if (selectedListId) result = filterByList(result, selectedListId);
		if (searchQuery) result = searchWishes(result, searchQuery);
		return result;
	});

	const totalCost = $derived(getTotalEstimatedCost(filterByStatus(wishes, 'active')));
	const activeCount = $derived(filterByStatus(wishes, 'active').length);
	const fulfilledCount = $derived(filterByStatus(wishes, 'fulfilled').length);

	async function addWish() {
		const title = newTitle.trim();
		if (!title) return;
		await wishesStore.create({
			title,
			listId: selectedListId,
			targetPrice: newTargetPrice ? parseFloat(newTargetPrice) : undefined,
			category: newCategory || undefined,
		});
		newTitle = '';
		newTargetPrice = '';
		newCategory = '';
		showAdd = false;
	}

	async function addList() {
		const name = newListName.trim();
		if (!name) return;
		const created = await listsStore.create({ name });
		selectedListId = created.id;
		newListName = '';
		showNewList = false;
	}

	async function deleteList(id: string) {
		await listsStore.delete(id);
		if (selectedListId === id) selectedListId = null;
	}
</script>

<svelte:head>
	<title>Wünsche - Mana</title>
</svelte:head>

<div class="space-y-3">
	<!-- Stats + Add -->
	<div class="flex items-center justify-between">
		<p class="text-xs text-[hsl(var(--color-muted-foreground))]">
			{activeCount} offen · {fulfilledCount} erfüllt
			{#if totalCost > 0}
				· ~{totalCost.toLocaleString('de-DE')} €
			{/if}
		</p>
		<button
			onclick={() => (showAdd = !showAdd)}
			class="flex items-center gap-1.5 rounded-md bg-[hsl(var(--color-primary))] px-3 py-1.5 text-xs font-medium text-[hsl(var(--color-primary-foreground))] transition-colors hover:opacity-90"
		>
			<Plus size={14} />
			Hinzufügen
		</button>
	</div>

	<!-- Quick Add -->
	{#if showAdd}
		<form
			onsubmit={(e) => {
				e.preventDefault();
				addWish();
			}}
			class="rounded-lg border border-[hsl(var(--color-border))] bg-[hsl(var(--color-card))] p-3"
		>
			<div class="space-y-2">
				<input
					bind:value={newTitle}
					placeholder="Was wünschst du dir?"
					class="w-full rounded-md border border-[hsl(var(--color-border))] bg-transparent px-3 py-1.5 text-sm text-[hsl(var(--color-foreground))] outline-none placeholder:text-[hsl(var(--color-muted-foreground))] focus:border-[hsl(var(--color-primary))]"
				/>
				<div class="flex flex-wrap gap-2">
					<input
						bind:value={newTargetPrice}
						placeholder="Zielpreis (€)"
						type="number"
						step="0.01"
						class="w-28 rounded-md border border-[hsl(var(--color-border))] bg-transparent px-2.5 py-1.5 text-xs text-[hsl(var(--color-foreground))] outline-none placeholder:text-[hsl(var(--color-muted-foreground))] focus:border-[hsl(var(--color-primary))]"
					/>
					<input
						bind:value={newCategory}
						placeholder="Kategorie"
						class="w-28 rounded-md border border-[hsl(var(--color-border))] bg-transparent px-2.5 py-1.5 text-xs text-[hsl(var(--color-foreground))] outline-none placeholder:text-[hsl(var(--color-muted-foreground))] focus:border-[hsl(var(--color-primary))]"
					/>
					{#if lists.length > 0}
						<select
							bind:value={selectedListId}
							class="rounded-md border border-[hsl(var(--color-border))] bg-transparent px-2.5 py-1.5 text-xs text-[hsl(var(--color-foreground))] outline-none"
						>
							<option value={null}>Keine Liste</option>
							{#each lists as list (list.id)}
								<option value={list.id}>{list.name}</option>
							{/each}
						</select>
					{/if}
				</div>
				<div class="flex justify-end gap-2">
					<button
						type="button"
						onclick={() => (showAdd = false)}
						class="rounded-md px-2.5 py-1 text-xs text-[hsl(var(--color-muted-foreground))] hover:bg-[hsl(var(--color-muted))]"
					>
						Abbrechen
					</button>
					<button
						type="submit"
						disabled={!newTitle.trim()}
						class="rounded-md bg-[hsl(var(--color-primary))] px-3 py-1 text-xs font-medium text-[hsl(var(--color-primary-foreground))] disabled:opacity-40"
					>
						Speichern
					</button>
				</div>
			</div>
		</form>
	{/if}

	<!-- Filter tabs -->
	<div class="flex gap-1 rounded-lg bg-[hsl(var(--color-muted))] p-0.5">
		{#each [{ key: 'active', label: 'Offen', icon: Star }, { key: 'fulfilled', label: 'Erfüllt', icon: Check }, { key: 'all', label: 'Alle', icon: Archive }] as tab (tab.key)}
			<button
				onclick={() => (filter = tab.key as 'active' | 'fulfilled' | 'all')}
				class="flex flex-1 items-center justify-center gap-1 rounded-md px-2.5 py-1 text-[11px] font-medium transition-colors {filter ===
				tab.key
					? 'bg-[hsl(var(--color-card))] text-[hsl(var(--color-foreground))] shadow-sm'
					: 'text-[hsl(var(--color-muted-foreground))] hover:text-[hsl(var(--color-foreground))]'}"
			>
				<tab.icon size={12} />
				{tab.label}
			</button>
		{/each}
	</div>

	<!-- Lists -->
	<div class="flex items-center gap-1 overflow-x-auto">
		{#if lists.length > 0}
			<button
				onclick={() => (selectedListId = null)}
				class="flex-shrink-0 rounded-md px-2 py-1 text-[11px] font-medium transition-colors {selectedListId ===
				null
					? 'bg-[hsl(var(--color-primary)/0.1)] text-[hsl(var(--color-primary))]'
					: 'text-[hsl(var(--color-muted-foreground))] hover:text-[hsl(var(--color-foreground))]'}"
			>
				Alle
			</button>
		{/if}
		{#each lists as list (list.id)}
			<div class="group relative flex-shrink-0">
				<button
					onclick={() => (selectedListId = selectedListId === list.id ? null : list.id)}
					class="flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium transition-colors {selectedListId ===
					list.id
						? 'bg-[hsl(var(--color-primary)/0.1)] text-[hsl(var(--color-primary))]'
						: 'text-[hsl(var(--color-muted-foreground))] hover:text-[hsl(var(--color-foreground))]'}"
				>
					<Folder size={11} />
					{list.name}
				</button>
				<button
					onclick={() => deleteList(list.id)}
					class="absolute -right-1 -top-1 hidden rounded-full bg-[hsl(var(--color-card))] p-0.5 text-[hsl(var(--color-muted-foreground))] shadow-sm hover:text-red-400 group-hover:block"
				>
					<X size={8} />
				</button>
			</div>
		{/each}
		{#if showNewList}
			<form
				onsubmit={(e) => {
					e.preventDefault();
					addList();
				}}
				class="flex items-center gap-1"
			>
				<input
					bind:value={newListName}
					placeholder="Listenname"
					class="w-24 rounded-md border border-[hsl(var(--color-border))] bg-transparent px-2 py-0.5 text-[11px] outline-none placeholder:text-[hsl(var(--color-muted-foreground))] focus:border-[hsl(var(--color-primary))]"
				/>
				<button
					type="submit"
					disabled={!newListName.trim()}
					class="rounded p-0.5 text-[hsl(var(--color-primary))] disabled:opacity-30"
				>
					<Check size={12} />
				</button>
				<button
					type="button"
					onclick={() => {
						showNewList = false;
						newListName = '';
					}}
					class="rounded p-0.5 text-[hsl(var(--color-muted-foreground))]"
				>
					<X size={12} />
				</button>
			</form>
		{:else}
			<button
				onclick={() => (showNewList = true)}
				class="flex flex-shrink-0 items-center gap-0.5 rounded-md px-1.5 py-1 text-[11px] text-[hsl(var(--color-muted-foreground))] transition-colors hover:text-[hsl(var(--color-foreground))]"
			>
				<Plus size={11} />
			</button>
		{/if}
	</div>

	<!-- Search -->
	<div class="relative">
		<MagnifyingGlass
			size={14}
			class="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-[hsl(var(--color-muted-foreground))]"
		/>
		<input
			bind:value={searchQuery}
			placeholder="Suchen..."
			class="w-full rounded-md border border-[hsl(var(--color-border))] bg-transparent py-1.5 pl-8 pr-3 text-xs text-[hsl(var(--color-foreground))] outline-none placeholder:text-[hsl(var(--color-muted-foreground))] focus:border-[hsl(var(--color-primary))]"
		/>
	</div>

	<!-- Wish list -->
	{#if filtered.length === 0}
		<div
			class="flex flex-col items-center justify-center rounded-lg border border-dashed border-[hsl(var(--color-border))] py-12"
		>
			<ShootingStar size={32} class="mb-3 text-[hsl(var(--color-muted-foreground))]" />
			<p class="text-sm text-[hsl(var(--color-muted-foreground))]">
				{filter === 'active' ? 'Noch keine Wünsche' : 'Keine Wünsche in dieser Ansicht'}
			</p>
		</div>
	{:else}
		<div class="space-y-1">
			{#each filtered as wish (wish.id)}
				<button
					onclick={() => goto(`/wishes/${wish.id}`)}
					class="group flex w-full items-center gap-2.5 rounded-md border border-transparent bg-transparent px-2.5 py-2 text-left transition-colors hover:bg-[hsl(var(--color-muted)/0.5)]"
				>
					<!-- Priority icon -->
					{#if wish.priority === 'high'}
						<CaretUp size={14} weight="fill" class="flex-shrink-0 text-red-400" />
					{:else if wish.priority === 'low'}
						<CaretDown
							size={14}
							weight="fill"
							class="flex-shrink-0 text-[hsl(var(--color-muted-foreground))]"
						/>
					{:else}
						<Minus size={14} class="flex-shrink-0 text-[hsl(var(--color-muted-foreground))]" />
					{/if}

					<div class="min-w-0 flex-1">
						<div class="flex items-center gap-1.5">
							<span
								class="truncate text-sm text-[hsl(var(--color-foreground))] {wish.status ===
								'fulfilled'
									? 'line-through opacity-50'
									: ''}"
							>
								{wish.title}
							</span>
							{#if wish.productUrls.length > 0}
								<LinkIcon
									size={11}
									class="flex-shrink-0 text-[hsl(var(--color-muted-foreground))]"
								/>
							{/if}
						</div>
						{#if wish.category || wish.tags.length > 0}
							<div class="mt-0.5 flex items-center gap-1">
								{#if wish.category}
									<span class="text-[10px] text-[hsl(var(--color-muted-foreground))]">
										{wish.category}
									</span>
								{/if}
							</div>
						{/if}
					</div>

					{#if wish.targetPrice}
						<span
							class="flex-shrink-0 text-xs tabular-nums text-[hsl(var(--color-muted-foreground))]"
						>
							{wish.targetPrice.toLocaleString('de-DE')} €
						</span>
					{/if}
				</button>
			{/each}
		</div>
	{/if}
</div>
