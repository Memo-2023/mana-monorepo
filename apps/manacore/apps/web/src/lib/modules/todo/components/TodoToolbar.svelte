<script lang="ts">
	import { _ } from 'svelte-i18n';
	import { viewStore } from '../stores/view.svelte';
	import type { SortBy } from '../types';
	import {
		SortAscending,
		SortDescending,
		MagnifyingGlass,
		FunnelSimple,
		Columns,
		List,
	} from '@manacore/shared-icons';

	interface Props {
		showBoardToggle?: boolean;
		isBoardView?: boolean;
		onToggleBoard?: () => void;
	}

	let { showBoardToggle = false, isBoardView = false, onToggleBoard }: Props = $props();

	let showSortMenu = $state(false);

	const sortOptions: { value: SortBy; label: string }[] = $derived([
		{ value: 'order', label: $_('todo.sortManual') },
		{ value: 'dueDate', label: $_('todo.sortDueDate') },
		{ value: 'priority', label: $_('todo.sortPriority') },
		{ value: 'title', label: $_('todo.sortName') },
		{ value: 'createdAt', label: $_('todo.sortCreated') },
	]);
</script>

<div class="flex items-center gap-2">
	<!-- Search toggle -->
	<button
		onclick={() => {
			if (viewStore.currentView === 'search') viewStore.setInbox();
			else viewStore.setSearch('');
		}}
		class="flex h-8 w-8 items-center justify-center rounded-lg transition-colors
			{viewStore.currentView === 'search'
			? 'bg-primary/10 text-primary'
			: 'text-muted-foreground hover:bg-muted hover:text-foreground'}"
		title={$_('todo.search')}
	>
		<MagnifyingGlass size={16} />
	</button>

	<!-- Sort -->
	<div class="relative">
		<button
			onclick={() => (showSortMenu = !showSortMenu)}
			class="flex h-8 items-center gap-1 rounded-lg px-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
			title={$_('todo.sort')}
		>
			{#if viewStore.sortOrder === 'asc'}
				<SortAscending size={16} />
			{:else}
				<SortDescending size={16} />
			{/if}
			<span class="text-xs"
				>{sortOptions.find((o) => o.value === viewStore.sortBy)?.label ?? 'Sort'}</span
			>
		</button>

		{#if showSortMenu}
			<!-- svelte-ignore a11y_click_events_have_key_events -->
			<!-- svelte-ignore a11y_no_static_element_interactions -->
			<div class="fixed inset-0 z-40" onclick={() => (showSortMenu = false)}></div>
			<div
				class="absolute right-0 top-full z-50 mt-1 min-w-[140px] rounded-lg border border-border bg-card p-1 shadow-lg"
			>
				{#each sortOptions as opt}
					<button
						onclick={() => {
							if (viewStore.sortBy === opt.value) {
								viewStore.toggleSortOrder();
							} else {
								viewStore.setSort(opt.value);
							}
							showSortMenu = false;
						}}
						class="flex w-full items-center justify-between rounded-md px-3 py-1.5 text-sm hover:bg-muted
							{viewStore.sortBy === opt.value ? 'text-primary font-medium' : 'text-foreground'}"
					>
						{opt.label}
						{#if viewStore.sortBy === opt.value}
							<span class="text-xs text-muted-foreground">
								{viewStore.sortOrder === 'asc' ? '↑' : '↓'}
							</span>
						{/if}
					</button>
				{/each}
			</div>
		{/if}
	</div>

	<!-- Show completed toggle -->
	<button
		onclick={() => viewStore.toggleShowCompleted()}
		class="flex h-8 items-center gap-1 rounded-lg px-2 text-xs transition-colors
			{viewStore.showCompleted
			? 'bg-primary/10 text-primary'
			: 'text-muted-foreground hover:bg-muted hover:text-foreground'}"
	>
		<FunnelSimple size={14} />
		{$_('todo.showCompleted')}
	</button>

	<!-- Board/List toggle -->
	{#if showBoardToggle}
		<button
			onclick={onToggleBoard}
			class="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
			title={isBoardView ? $_('todo.listView') : $_('todo.boardView')}
		>
			{#if isBoardView}
				<List size={16} />
			{:else}
				<Columns size={16} />
			{/if}
		</button>
	{/if}
</div>
