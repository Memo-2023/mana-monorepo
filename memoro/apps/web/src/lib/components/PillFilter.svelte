<script lang="ts">
	interface FilterItem {
		id: string;
		label: string;
		color?: string;
	}

	interface Props {
		items: FilterItem[];
		selectedIds: string[];
		onSelectItem: (id: string) => void;
		isLoading?: boolean;
		error?: string | null;
		showAllOption?: boolean;
		allOptionLabel?: string;
	}

	let {
		items,
		selectedIds,
		onSelectItem,
		isLoading = false,
		error = null,
		showAllOption = true,
		allOptionLabel = 'All'
	}: Props = $props();

	const allSelected = $derived(selectedIds.length === 0);
</script>

<div class="bg-page py-3">
	<div class="hide-scrollbar flex gap-2 overflow-x-auto px-4">
		{#if showAllOption}
			<button
				onclick={() => onSelectItem('all')}
				class="flex-shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-colors {allSelected
					? 'bg-primary text-black'
					: 'border border-theme bg-content text-theme'}"
			>
				{allOptionLabel}
			</button>
		{/if}

		{#if isLoading}
			{#each Array(5) as _, i}
				<div
					class="h-9 w-20 flex-shrink-0 animate-pulse rounded-full bg-menu"
					style="animation-delay: {i * 100}ms"
				></div>
			{/each}
		{:else if error}
			<span class="text-sm text-red-500">{error}</span>
		{:else}
			{#each items as item}
				{@const isSelected = selectedIds.includes(item.id)}
				<button
					onclick={() => onSelectItem(item.id)}
					class="flex-shrink-0 rounded-full border px-4 py-2 text-sm font-medium transition-colors"
					style={isSelected && item.color
						? `background-color: ${item.color}33; border-color: ${item.color}; color: ${item.color}`
						: ''}
					class:bg-menu={!isSelected}
					class:border-theme={!isSelected}
					class:text-theme={!isSelected}
				>
					{item.label}
				</button>
			{/each}
		{/if}
	</div>
</div>

<style>
	.hide-scrollbar::-webkit-scrollbar {
		display: none;
	}
	.hide-scrollbar {
		-ms-overflow-style: none;
		scrollbar-width: none;
	}
</style>
