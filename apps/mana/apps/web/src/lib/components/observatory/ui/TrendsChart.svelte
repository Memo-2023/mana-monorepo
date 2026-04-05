<script lang="ts">
	import type { AppData } from '../data/types';

	let { apps }: { apps: AppData[] } = $props();

	// Build timeline data from apps that have trends (previousScore)
	// For now we create 2 data points: "before" and "now"
	const timePoints = ['Vorher', 'Aktuell'];

	const statusColors: Record<string, string> = {
		mature: '#34d399',
		production: '#60a5fa',
		beta: '#fbbf24',
		alpha: '#f97316',
		prototype: '#94a3b8',
	};

	// Chart dimensions
	const width = 800;
	const height = 400;
	const padL = 50;
	const padR = 30;
	const padT = 20;
	const padB = 40;
	const chartW = width - padL - padR;
	const chartH = height - padT - padB;

	// Apps sorted by current score
	let sorted = $derived(apps.toSorted((a, b) => b.score - a.score));

	// Generate line path for each app
	function appLine(app: AppData): { path: string; startY: number; endY: number } {
		const prev = app.trend !== 0 ? app.score - app.trend : app.score;
		const x0 = padL;
		const x1 = padL + chartW;
		const y0 = padT + chartH - (prev / 100) * chartH;
		const y1 = padT + chartH - (app.score / 100) * chartH;
		return {
			path: `M${x0},${y0} L${x1},${y1}`,
			startY: y0,
			endY: y1,
		};
	}

	// Grid lines
	const gridLines = [0, 25, 50, 75, 100];

	let hoveredApp = $state<string | null>(null);

	let gainers = $derived(sorted.filter((a) => a.trend > 0).sort((a, b) => b.trend - a.trend));
	let avgScore = $derived(Math.round(sorted.reduce((s, a) => s + a.score, 0) / sorted.length));
</script>

<div class="trends-chart">
	<svg
		viewBox="0 0 {width} {height}"
		style="width: 100%; height: auto; max-height: 450px;"
		xmlns="http://www.w3.org/2000/svg"
	>
		<!-- Grid -->
		{#each gridLines as val}
			{@const y = padT + chartH - (val / 100) * chartH}
			<line
				x1={padL}
				y1={y}
				x2={padL + chartW}
				y2={y}
				stroke="rgba(148, 163, 184, 0.08)"
				stroke-width="0.5"
			/>
			<text
				x={padL - 8}
				{y}
				text-anchor="end"
				dominant-baseline="central"
				font-size="9"
				fill="#64748b"
			>
				{val}
			</text>
		{/each}

		<!-- Time labels -->
		<text x={padL} y={height - 10} text-anchor="start" font-size="10" fill="#64748b">
			{timePoints[0]}
		</text>
		<text x={padL + chartW} y={height - 10} text-anchor="end" font-size="10" fill="#64748b">
			{timePoints[1]}
		</text>

		<!-- Lines for each app -->
		{#each sorted as app (app.id)}
			{@const line = appLine(app)}
			{@const isHovered = hoveredApp === app.id}
			{@const color = statusColors[app.status] || '#94a3b8'}

			<g opacity={hoveredApp && !isHovered ? 0.15 : 1} style="transition: opacity 0.2s;">
				<!-- Line -->
				<path
					d={line.path}
					fill="none"
					stroke={color}
					stroke-width={isHovered ? 3 : 1.5}
					stroke-linecap="round"
				/>

				<!-- Start dot -->
				<circle cx={padL} cy={line.startY} r={isHovered ? 4 : 2.5} fill={color} />

				<!-- End dot -->
				<circle cx={padL + chartW} cy={line.endY} r={isHovered ? 4 : 2.5} fill={color} />

				<!-- Label at end -->
				<text
					x={padL + chartW + 6}
					y={line.endY}
					font-size={isHovered ? 11 : 9}
					font-weight={isHovered ? 600 : 400}
					fill={isHovered ? '#f1f5f9' : '#94a3b8'}
					dominant-baseline="central"
				>
					{app.displayName}
					{app.score}
				</text>

				<!-- Hover area (invisible wide line) -->
				<path
					d={line.path}
					fill="none"
					stroke="transparent"
					stroke-width="12"
					onmouseenter={() => (hoveredApp = app.id)}
					onmouseleave={() => (hoveredApp = null)}
					style="cursor: pointer;"
				/>
			</g>
		{/each}

		<!-- Trend annotation for apps with big changes -->
		{#each sorted.filter((a) => Math.abs(a.trend) >= 10) as app (app.id)}
			{@const line = appLine(app)}
			{@const midX = padL + chartW * 0.5}
			{@const midY = (line.startY + line.endY) / 2}
			<text
				x={midX}
				y={midY - 8}
				text-anchor="middle"
				font-size="10"
				font-weight="600"
				fill={app.trend > 0 ? '#34d399' : '#ef4444'}
				opacity={hoveredApp && hoveredApp !== app.id ? 0.15 : 0.7}
			>
				{app.trend > 0 ? '+' : ''}{app.trend}
			</text>
		{/each}
	</svg>

	<!-- Summary cards -->
	<div class="trend-summary">
		{#if gainers.length}
			<div class="summary-card">
				<span class="summary-label">Grosste Verbesserungen</span>
				<div class="summary-items">
					{#each gainers as app (app.id)}
						<span class="summary-item gain">
							{app.displayName} <strong>+{app.trend}</strong>
						</span>
					{/each}
				</div>
			</div>
		{/if}

		<div class="summary-card">
			<span class="summary-label">Durchschnitt</span>
			<span class="summary-value">{avgScore}</span>
		</div>
	</div>
</div>

<style>
	.trends-chart {
		display: flex;
		flex-direction: column;
		gap: 20px;
	}

	.trend-summary {
		display: flex;
		gap: 16px;
		flex-wrap: wrap;
	}

	.summary-card {
		background: rgba(15, 23, 42, 0.5);
		border: 1px solid rgba(148, 163, 184, 0.08);
		border-radius: 10px;
		padding: 12px 16px;
		display: flex;
		flex-direction: column;
		gap: 6px;
	}

	.summary-label {
		font-size: 10px;
		color: #64748b;
		text-transform: uppercase;
		letter-spacing: 0.06em;
		font-weight: 600;
	}

	.summary-items {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
	}

	.summary-item {
		font-size: 12px;
		color: #cbd5e1;
	}

	.summary-item.gain strong {
		color: #34d399;
	}

	.summary-value {
		font-size: 24px;
		font-weight: 800;
		color: #f1f5f9;
		font-variant-numeric: tabular-nums;
	}
</style>
