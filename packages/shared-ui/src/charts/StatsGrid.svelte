<script lang="ts">
	import type { StatItem } from './types';
	import { STAT_VARIANT_COLORS } from './types';

	interface Props {
		items: StatItem[];
		columns?: 2 | 3 | 4 | 6;
	}

	let { items, columns = 6 }: Props = $props();

	// Filter items based on showCondition
	let visibleItems = $derived(items.filter((item) => item.showCondition !== false));
</script>

<div
	class="stats-grid"
	class:cols-2={columns === 2}
	class:cols-3={columns === 3}
	class:cols-4={columns === 4}
	class:cols-6={columns === 6}
>
	{#each visibleItems as item (item.id)}
		<div class="stat-card">
			<div
				class="stat-icon"
				style="background-color: {STAT_VARIANT_COLORS[item.variant]
					.bg}; color: {STAT_VARIANT_COLORS[item.variant].color}"
			>
				<item.icon size={24} />
			</div>
			<div class="stat-content">
				<span class="stat-value">{item.value}</span>
				<span class="stat-label">{item.label}</span>
			</div>
		</div>
	{/each}
</div>

<style>
	.stats-grid {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 1rem;
	}

	/* Default responsive behavior for 6 columns */
	.stats-grid.cols-6 {
		grid-template-columns: repeat(2, 1fr);
	}

	@media (min-width: 640px) {
		.stats-grid.cols-6 {
			grid-template-columns: repeat(3, 1fr);
		}
		.stats-grid.cols-3 {
			grid-template-columns: repeat(3, 1fr);
		}
		.stats-grid.cols-4 {
			grid-template-columns: repeat(2, 1fr);
		}
	}

	@media (min-width: 1024px) {
		.stats-grid.cols-6 {
			grid-template-columns: repeat(6, 1fr);
		}
		.stats-grid.cols-4 {
			grid-template-columns: repeat(4, 1fr);
		}
	}

	.stats-grid.cols-2 {
		grid-template-columns: repeat(2, 1fr);
	}

	.stats-grid.cols-3 {
		grid-template-columns: repeat(2, 1fr);
	}

	.stat-card {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 1rem;
		background: rgba(255, 255, 255, 0.95);
		backdrop-filter: blur(20px);
		-webkit-backdrop-filter: blur(20px);
		border: 1px solid rgba(0, 0, 0, 0.1);
		border-radius: 1rem;
		transition:
			transform 0.2s ease,
			box-shadow 0.2s ease;
	}

	.stat-card:hover {
		transform: translateY(-2px);
		box-shadow: 0 8px 25px -5px rgba(0, 0, 0, 0.1);
	}

	:global(.dark) .stat-card {
		background: rgba(30, 30, 30, 0.95);
		border: 1px solid rgba(255, 255, 255, 0.15);
	}

	.stat-icon {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 44px;
		height: 44px;
		border-radius: 0.75rem;
		flex-shrink: 0;
	}

	.stat-content {
		display: flex;
		flex-direction: column;
		min-width: 0;
	}

	.stat-value {
		font-size: 1.5rem;
		font-weight: 700;
		line-height: 1.2;
		color: hsl(var(--foreground));
	}

	.stat-label {
		font-size: 0.75rem;
		color: hsl(var(--muted-foreground));
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}
</style>
