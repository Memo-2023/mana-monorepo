<script lang="ts">
	import type { AppData } from '../data/types';

	let { app, x, y }: { app: AppData; x: number; y: number } = $props();

	const statusLabels: Record<string, string> = {
		mature: 'Mature',
		production: 'Production',
		beta: 'Beta',
		alpha: 'Alpha',
		prototype: 'Prototype',
	};

	const statusColors: Record<string, string> = {
		mature: '#34d399',
		production: '#60a5fa',
		beta: '#fbbf24',
		alpha: '#f97316',
		prototype: '#94a3b8',
	};

	const healthIcons: Record<string, string> = {
		up: '●',
		degraded: '◐',
		down: '○',
		unknown: '?',
	};

	const healthColors: Record<string, string> = {
		up: '#34d399',
		degraded: '#fbbf24',
		down: '#ef4444',
		unknown: '#94a3b8',
	};
</script>

<div class="plant-tooltip" style="left: {x}px; top: {y}px;">
	<div class="tooltip-header">
		<span class="tooltip-name">{app.displayName}</span>
		<span class="tooltip-score">{app.score}</span>
	</div>
	<div class="tooltip-meta">
		<span class="tooltip-status" style="color: {statusColors[app.status]}">
			{statusLabels[app.status]}
		</span>
		<span class="tooltip-health" style="color: {healthColors[app.health]}">
			{healthIcons[app.health]}
		</span>
		{#if app.trend !== 0}
			<span class="tooltip-trend" class:positive={app.trend > 0} class:negative={app.trend < 0}>
				{app.trend > 0 ? '+' : ''}{app.trend}
			</span>
		{/if}
	</div>
	<div class="tooltip-categories">
		{#each Object.entries(app.categories) as [key, value]}
			<div class="tooltip-cat-row">
				<span class="tooltip-cat-label">{key}</span>
				<div class="tooltip-cat-bar">
					<div class="tooltip-cat-fill" style="width: {value}%"></div>
				</div>
				<span class="tooltip-cat-value">{value}</span>
			</div>
		{/each}
	</div>
</div>

<style>
	.plant-tooltip {
		position: fixed;
		z-index: 50;
		pointer-events: none;
		transform: translate(-50%, -100%) translateY(-12px);
		background: rgba(15, 23, 42, 0.92);
		backdrop-filter: blur(8px);
		border: 1px solid rgba(148, 163, 184, 0.15);
		border-radius: 10px;
		padding: 10px 14px;
		min-width: 180px;
		box-shadow:
			0 8px 24px rgba(0, 0, 0, 0.3),
			0 0 0 1px rgba(255, 255, 255, 0.05);
	}

	.tooltip-header {
		display: flex;
		justify-content: space-between;
		align-items: baseline;
		margin-bottom: 4px;
	}

	.tooltip-name {
		font-size: 13px;
		font-weight: 600;
		color: #f1f5f9;
	}

	.tooltip-score {
		font-size: 18px;
		font-weight: 700;
		color: #f1f5f9;
		font-variant-numeric: tabular-nums;
	}

	.tooltip-meta {
		display: flex;
		gap: 8px;
		align-items: center;
		margin-bottom: 8px;
		font-size: 11px;
	}

	.tooltip-status {
		font-weight: 500;
	}

	.tooltip-health {
		font-size: 8px;
	}

	.tooltip-trend {
		font-size: 11px;
		font-weight: 600;
	}

	.tooltip-trend.positive {
		color: #34d399;
	}

	.tooltip-trend.negative {
		color: #ef4444;
	}

	.tooltip-categories {
		display: flex;
		flex-direction: column;
		gap: 2px;
	}

	.tooltip-cat-row {
		display: flex;
		align-items: center;
		gap: 6px;
	}

	.tooltip-cat-label {
		font-size: 9px;
		color: #94a3b8;
		width: 72px;
		text-transform: capitalize;
		flex-shrink: 0;
	}

	.tooltip-cat-bar {
		flex: 1;
		height: 3px;
		background: rgba(148, 163, 184, 0.15);
		border-radius: 2px;
		overflow: hidden;
	}

	.tooltip-cat-fill {
		height: 100%;
		border-radius: 2px;
		background: linear-gradient(90deg, #3b82f6, #60a5fa);
		transition: width 0.3s ease;
	}

	.tooltip-cat-value {
		font-size: 9px;
		color: #94a3b8;
		width: 18px;
		text-align: right;
		font-variant-numeric: tabular-nums;
	}
</style>
