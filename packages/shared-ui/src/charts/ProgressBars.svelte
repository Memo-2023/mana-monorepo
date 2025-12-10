<script lang="ts">
	import type { ProgressItem } from './types';

	interface Props {
		data: ProgressItem[];
		title?: string;
		maxItems?: number;
		emptyMessage?: string;
	}

	let {
		data,
		title = 'Fortschritt',
		maxItems = 8,
		emptyMessage = 'Keine Daten vorhanden',
	}: Props = $props();

	// Sort by total (descending) and limit to maxItems
	let sortedData = $derived(data.slice(0, maxItems));
</script>

<div class="progress-container">
	<h3 class="progress-title">{title}</h3>

	{#if sortedData.length === 0}
		<p class="no-data">{emptyMessage}</p>
	{:else}
		<div class="progress-list">
			{#each sortedData as item (item.id)}
				<div class="progress-row">
					<div class="progress-header">
						<div class="progress-name">
							<span class="progress-dot" style="background-color: {item.color}"></span>
							<span class="name-text">{item.name}</span>
						</div>
						<span class="progress-stats">
							{item.completed}/{item.total}
						</span>
					</div>

					<div class="progress-bar-container">
						<div class="progress-bar">
							<!-- Completed segment -->
							{#if item.completed > 0}
								<div
									class="progress-segment completed"
									style="width: {(item.completed / item.total) *
										100}%; background-color: {item.color}"
								></div>
							{/if}

							<!-- In Progress segment -->
							{#if item.inProgress && item.inProgress > 0}
								<div
									class="progress-segment in-progress"
									style="width: {(item.inProgress / item.total) *
										100}%; background-color: {item.color}; opacity: 0.4"
								></div>
							{/if}
						</div>

						<span class="percentage">{item.percentage}%</span>
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>

<style>
	.progress-container {
		background: rgba(255, 255, 255, 0.95);
		backdrop-filter: blur(20px);
		-webkit-backdrop-filter: blur(20px);
		border: 1px solid rgba(0, 0, 0, 0.1);
		border-radius: 1.5rem;
		padding: 1.5rem;
	}

	:global(.dark) .progress-container {
		background: rgba(30, 30, 30, 0.95);
		border: 1px solid rgba(255, 255, 255, 0.15);
	}

	.progress-title {
		font-size: 1rem;
		font-weight: 600;
		color: hsl(var(--foreground));
		margin: 0 0 1rem 0;
	}

	.no-data {
		font-size: 0.875rem;
		color: hsl(var(--muted-foreground));
		text-align: center;
		padding: 2rem;
	}

	.progress-list {
		display: flex;
		flex-direction: column;
		gap: 0.875rem;
	}

	.progress-row {
		display: flex;
		flex-direction: column;
		gap: 0.375rem;
	}

	.progress-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.progress-name {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		min-width: 0;
	}

	.progress-dot {
		width: 10px;
		height: 10px;
		border-radius: 50%;
		flex-shrink: 0;
	}

	.name-text {
		font-size: 0.875rem;
		color: hsl(var(--foreground));
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.progress-stats {
		font-size: 0.75rem;
		color: hsl(var(--muted-foreground));
		flex-shrink: 0;
	}

	.progress-bar-container {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	.progress-bar {
		flex: 1;
		height: 8px;
		background: hsl(var(--muted) / 0.3);
		border-radius: 4px;
		overflow: hidden;
		display: flex;
	}

	:global(.dark) .progress-bar {
		background: rgba(255, 255, 255, 0.1);
	}

	.progress-segment {
		height: 100%;
		transition: width 0.3s ease;
	}

	.progress-segment.completed {
		border-radius: 4px 0 0 4px;
	}

	.progress-segment.in-progress {
		/* Striped pattern for in-progress */
		background-image: repeating-linear-gradient(
			45deg,
			transparent,
			transparent 4px,
			rgba(255, 255, 255, 0.3) 4px,
			rgba(255, 255, 255, 0.3) 8px
		);
	}

	.percentage {
		font-size: 0.75rem;
		font-weight: 600;
		color: hsl(var(--muted-foreground));
		width: 36px;
		text-align: right;
		flex-shrink: 0;
	}
</style>
