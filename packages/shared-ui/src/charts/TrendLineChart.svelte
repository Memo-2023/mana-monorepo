<script lang="ts">
	import type { TrendDataPoint } from './types';

	interface Props {
		data: TrendDataPoint[];
		title?: string;
		height?: number;
		/** Item name for tooltip (e.g., "Aufgabe", "Event", "Kontakt") */
		itemName?: string;
		/** Plural item name for tooltip (e.g., "Aufgaben", "Events", "Kontakte") */
		itemNamePlural?: string;
	}

	let {
		data,
		title = 'Trend (letzte 4 Wochen)',
		height = 200,
		itemName = 'Aufgabe',
		itemNamePlural = 'Aufgaben',
	}: Props = $props();

	// Chart dimensions
	const WIDTH = 600;
	const PADDING = { top: 20, right: 20, bottom: 30, left: 40 };

	let chartWidth = WIDTH - PADDING.left - PADDING.right;
	let chartHeight = height - PADDING.top - PADDING.bottom;

	// Calculate max for scaling
	let maxCount = $derived(Math.max(...data.map((d) => d.count), 1));

	// Scale functions
	function scaleX(index: number): number {
		if (data.length <= 1) return PADDING.left;
		return PADDING.left + (index / (data.length - 1)) * chartWidth;
	}

	function scaleY(value: number): number {
		return PADDING.top + chartHeight - (value / maxCount) * chartHeight;
	}

	// Generate path for the line
	let linePath = $derived.by(() => {
		if (data.length === 0) return '';

		const points = data.map((d, i) => ({
			x: scaleX(i),
			y: scaleY(d.count),
		}));

		// Create smooth curve using cubic bezier
		let path = `M ${points[0].x} ${points[0].y}`;

		for (let i = 1; i < points.length; i++) {
			const prev = points[i - 1];
			const curr = points[i];
			const cpX = (prev.x + curr.x) / 2;
			path += ` C ${cpX} ${prev.y}, ${cpX} ${curr.y}, ${curr.x} ${curr.y}`;
		}

		return path;
	});

	// Generate path for the area fill
	let areaPath = $derived.by(() => {
		if (data.length === 0) return '';

		const baseline = PADDING.top + chartHeight;
		return `${linePath} L ${scaleX(data.length - 1)} ${baseline} L ${scaleX(0)} ${baseline} Z`;
	});

	// Y-axis ticks
	let yTicks = $derived.by(() => {
		const tickCount = 4;
		const step = maxCount / tickCount;
		return Array.from({ length: tickCount + 1 }, (_, i) => Math.round(i * step));
	});

	// X-axis labels (show every 7th day for weekly labels)
	let xLabels = $derived.by(() => {
		const labels: { index: number; label: string }[] = [];
		const step = Math.max(1, Math.floor(data.length / 4));

		for (let i = 0; i < data.length; i += step) {
			if (data[i]) {
				labels.push({ index: i, label: data[i].date.slice(5) }); // MM-DD format
			}
		}

		return labels;
	});

	// Generate unique gradient ID
	let gradientId = $derived(`areaGradient-${Math.random().toString(36).slice(2, 9)}`);

	function formatTooltip(point: TrendDataPoint): string {
		const name = point.count === 1 ? itemName : itemNamePlural;
		return `${point.count} ${name} am ${point.date}`;
	}
</script>

<div class="chart-container">
	<h3 class="chart-title">{title}</h3>

	<svg viewBox="0 0 {WIDTH} {height}" class="chart-svg" preserveAspectRatio="xMidYMid meet">
		<!-- Grid lines -->
		{#each yTicks as tick}
			<line
				x1={PADDING.left}
				y1={scaleY(tick)}
				x2={WIDTH - PADDING.right}
				y2={scaleY(tick)}
				class="grid-line"
			/>
		{/each}

		<!-- Area fill with gradient -->
		<defs>
			<linearGradient id={gradientId} x1="0%" y1="0%" x2="0%" y2="100%">
				<stop offset="0%" class="gradient-start" />
				<stop offset="100%" class="gradient-end" />
			</linearGradient>
		</defs>

		<path d={areaPath} fill="url(#{gradientId})" class="area-path" />

		<!-- Line -->
		<path d={linePath} class="line-path" />

		<!-- Data points -->
		{#each data as point, i}
			<circle cx={scaleX(i)} cy={scaleY(point.count)} r={4} class="data-point">
				<title>{formatTooltip(point)}</title>
			</circle>
		{/each}

		<!-- Y-axis labels -->
		{#each yTicks as tick}
			<text x={PADDING.left - 8} y={scaleY(tick) + 4} class="y-label">
				{tick}
			</text>
		{/each}

		<!-- X-axis labels -->
		{#each xLabels as label}
			<text x={scaleX(label.index)} y={height - 8} class="x-label">
				{label.label}
			</text>
		{/each}
	</svg>
</div>

<style>
	.chart-container {
		background: rgba(255, 255, 255, 0.95);
		backdrop-filter: blur(20px);
		-webkit-backdrop-filter: blur(20px);
		border: 1px solid rgba(0, 0, 0, 0.1);
		border-radius: 1.5rem;
		padding: 1.5rem;
	}

	:global(.dark) .chart-container {
		background: rgba(30, 30, 30, 0.95);
		border: 1px solid rgba(255, 255, 255, 0.15);
	}

	.chart-title {
		font-size: 1rem;
		font-weight: 600;
		color: hsl(var(--foreground));
		margin: 0 0 1rem 0;
	}

	.chart-svg {
		width: 100%;
		height: auto;
		max-height: 200px;
	}

	.grid-line {
		stroke: hsl(var(--muted) / 0.3);
		stroke-width: 1;
		stroke-dasharray: 4 4;
	}

	:global(.dark) .grid-line {
		stroke: rgba(255, 255, 255, 0.1);
	}

	.area-path {
		transition: opacity 0.3s ease;
	}

	.gradient-start {
		stop-color: hsl(var(--primary));
		stop-opacity: 0.3;
	}

	.gradient-end {
		stop-color: hsl(var(--primary));
		stop-opacity: 0.05;
	}

	.line-path {
		fill: none;
		stroke: hsl(var(--primary));
		stroke-width: 2.5;
		stroke-linecap: round;
		stroke-linejoin: round;
	}

	.data-point {
		fill: hsl(var(--primary));
		stroke: white;
		stroke-width: 2;
		cursor: pointer;
		transition: r 0.15s ease;
	}

	.data-point:hover {
		r: 6;
	}

	:global(.dark) .data-point {
		stroke: #1e1e1e;
	}

	.y-label {
		font-size: 10px;
		fill: hsl(var(--muted-foreground));
		text-anchor: end;
	}

	.x-label {
		font-size: 10px;
		fill: hsl(var(--muted-foreground));
		text-anchor: middle;
	}
</style>
