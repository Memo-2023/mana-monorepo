<script lang="ts">
	import type { AppData } from '../data/types';
	import { getHealthColor } from '../data/colors';
	import PlantFactory from '../plants/PlantFactory.svelte';

	let { app, onclick }: { app: AppData; onclick?: () => void } = $props();

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

	const plantTypeLabels: Record<string, string> = {
		oak: 'Eiche',
		birch: 'Birke',
		youngTree: 'Junger Baum',
		reed: 'Schilf',
		waterLily: 'Seerose',
		moss: 'Moos',
		shrub: 'Busch',
		sprout: 'Sprossling',
		stump: 'Baumstumpf',
		swampCluster: 'Sumpfpflanze',
	};

	// Create a centered version of the app for the card SVG
	let cardApp = $derived({
		...app,
		position: { x: 80, y: 120 },
	});

	function scoreColor(score: number): string {
		if (score >= 85) return '#34d399';
		if (score >= 70) return '#60a5fa';
		if (score >= 55) return '#fbbf24';
		if (score >= 40) return '#f97316';
		return '#ef4444';
	}
</script>

<button type="button" class="plant-card" {onclick}>
	<!-- Plant SVG preview -->
	<div class="plant-preview">
		<svg width="160" height="160" viewBox="0 0 160 160" xmlns="http://www.w3.org/2000/svg">
			<!-- Ground line -->
			<ellipse cx="80" cy="125" rx="50" ry="6" fill="#7DB86A" opacity="0.3" />
			<PlantFactory app={cardApp} />
		</svg>
	</div>

	<!-- Info -->
	<div class="plant-info">
		<div class="plant-header">
			<span class="plant-name">{app.displayName}</span>
			<span class="plant-score" style="color: {scoreColor(app.score)}">{app.score}</span>
		</div>
		<div class="plant-meta">
			<span class="plant-type">{plantTypeLabels[app.plantType] || app.plantType}</span>
			<span class="plant-status" style="color: {statusColors[app.status]}">
				{statusLabels[app.status]}
			</span>
		</div>
		<!-- Mini score bar -->
		<div class="plant-bar">
			<div
				class="plant-bar-fill"
				style="width: {app.score}%; background: {scoreColor(app.score)}"
			></div>
		</div>
		{#if app.trend !== 0}
			<div class="plant-trend" class:positive={app.trend > 0} class:negative={app.trend < 0}>
				{app.trend > 0 ? '+' : ''}{app.trend} seit letztem Audit
			</div>
		{/if}
	</div>
</button>

<style>
	.plant-card {
		flex-shrink: 0;
		width: 200px;
		background: rgba(15, 23, 42, 0.6);
		backdrop-filter: blur(8px);
		border: 1px solid rgba(148, 163, 184, 0.1);
		border-radius: 12px;
		overflow: hidden;
		cursor: pointer;
		transition:
			transform 0.2s,
			border-color 0.2s,
			box-shadow 0.2s;
		text-align: left;
		color: inherit;
		padding: 0;
	}

	.plant-card:hover {
		transform: translateY(-4px);
		border-color: rgba(59, 130, 246, 0.3);
		box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
	}

	.plant-preview {
		display: flex;
		justify-content: center;
		align-items: center;
		background: linear-gradient(180deg, #e0f2fe 0%, #bae6fd 40%, #7db86a 100%);
		padding: 8px 0 0;
	}

	.plant-info {
		padding: 12px;
	}

	.plant-header {
		display: flex;
		justify-content: space-between;
		align-items: baseline;
		margin-bottom: 4px;
	}

	.plant-name {
		font-size: 14px;
		font-weight: 600;
		color: #f1f5f9;
	}

	.plant-score {
		font-size: 20px;
		font-weight: 800;
		font-variant-numeric: tabular-nums;
	}

	.plant-meta {
		display: flex;
		justify-content: space-between;
		font-size: 11px;
		margin-bottom: 8px;
	}

	.plant-type {
		color: #64748b;
	}

	.plant-status {
		font-weight: 500;
	}

	.plant-bar {
		height: 3px;
		background: rgba(148, 163, 184, 0.15);
		border-radius: 2px;
		overflow: hidden;
	}

	.plant-bar-fill {
		height: 100%;
		border-radius: 2px;
		transition: width 0.4s ease;
	}

	.plant-trend {
		font-size: 10px;
		margin-top: 6px;
	}

	.plant-trend.positive {
		color: #34d399;
	}

	.plant-trend.negative {
		color: #ef4444;
	}
</style>
