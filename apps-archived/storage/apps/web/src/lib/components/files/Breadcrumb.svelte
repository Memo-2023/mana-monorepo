<script lang="ts">
	import { ChevronRight, Home } from 'lucide-svelte';

	interface BreadcrumbItem {
		id: string | null;
		name: string;
	}

	interface Props {
		items: BreadcrumbItem[];
		onNavigate: (id: string | null) => void;
	}

	let { items, onNavigate }: Props = $props();
</script>

<nav class="breadcrumb" aria-label="Breadcrumb">
	<ol class="breadcrumb-list">
		<li class="breadcrumb-item">
			<button onclick={() => onNavigate(null)} class="breadcrumb-link" aria-label="Home">
				<Home size={16} />
				<span>Meine Dateien</span>
			</button>
		</li>
		{#each items as item, index (item.id)}
			<li class="breadcrumb-item">
				<ChevronRight size={16} class="separator" />
				{#if index === items.length - 1}
					<span class="breadcrumb-current">{item.name}</span>
				{:else}
					<button onclick={() => onNavigate(item.id)} class="breadcrumb-link">
						{item.name}
					</button>
				{/if}
			</li>
		{/each}
	</ol>
</nav>

<style>
	.breadcrumb {
		margin-bottom: 1.5rem;
	}

	.breadcrumb-list {
		display: flex;
		align-items: center;
		flex-wrap: wrap;
		gap: 0.25rem;
		list-style: none;
		padding: 0;
		margin: 0;
	}

	.breadcrumb-item {
		display: flex;
		align-items: center;
		gap: 0.25rem;
	}

	.breadcrumb-link {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.25rem 0.5rem;
		background: transparent;
		border: none;
		border-radius: var(--radius-sm);
		font-size: 0.875rem;
		color: rgb(var(--color-text-secondary));
		cursor: pointer;
		transition: all var(--transition-fast);
	}

	.breadcrumb-link:hover {
		background: rgb(var(--color-surface));
		color: rgb(var(--color-text-primary));
	}

	.breadcrumb-current {
		font-size: 0.875rem;
		font-weight: 500;
		color: rgb(var(--color-text-primary));
		padding: 0.25rem 0.5rem;
	}

	.breadcrumb-item :global(.separator) {
		color: rgb(var(--color-text-tertiary));
	}
</style>
