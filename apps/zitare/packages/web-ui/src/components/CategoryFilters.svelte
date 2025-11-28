<script lang="ts">
	interface Props {
		categories: string[];
		selectedCategory: string | null;
		onSelect: (category: string | null) => void;
		primaryColor?: string;
	}

	let { categories, selectedCategory = $bindable(null), onSelect, primaryColor }: Props = $props();

	function handleSelect(category: string | null) {
		selectedCategory = category;
		onSelect(category);
	}
</script>

<div class="category-filters">
	<button
		class="category-btn"
		class:active={!selectedCategory}
		onclick={() => handleSelect(null)}
		style={!selectedCategory && primaryColor
			? `background: rgb(${primaryColor}); border-color: rgb(${primaryColor}); color: white;`
			: ''}
	>
		Alle
	</button>
	{#each categories as category}
		<button
			class="category-btn"
			class:active={selectedCategory === category}
			onclick={() => handleSelect(category)}
			style={selectedCategory === category && primaryColor
				? `background: rgb(${primaryColor}); border-color: rgb(${primaryColor}); color: white;`
				: ''}
		>
			{category}
		</button>
	{/each}
</div>

<style>
	.category-filters {
		display: flex;
		gap: var(--spacing-sm);
		flex-wrap: wrap;
		margin-bottom: var(--spacing-md);
	}

	.category-btn {
		padding: var(--spacing-sm) var(--spacing-lg);
		border: 2px solid rgb(var(--color-border));
		background: rgb(var(--color-background));
		color: rgb(var(--color-text-secondary));
		border-radius: var(--radius-full);
		font-weight: 600;
		cursor: pointer;
		transition: all var(--transition-base);
	}

	.category-btn:hover {
		border-color: rgb(var(--color-primary));
		color: rgb(var(--color-primary));
	}

	.category-btn.active {
		background: rgb(var(--color-primary));
		border-color: rgb(var(--color-primary));
		color: white;
	}

	@media (max-width: 768px) {
		.category-filters {
			justify-content: center;
		}
	}
</style>
