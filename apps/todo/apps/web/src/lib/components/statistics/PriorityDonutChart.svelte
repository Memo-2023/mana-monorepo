<script lang="ts">
	import type { TaskPriority } from '@todo/shared';

	interface PriorityBreakdown {
		priority: TaskPriority;
		count: number;
		percentage: number;
		color: string;
	}

	interface Props {
		data: PriorityBreakdown[];
	}

	let { data }: Props = $props();

	// Chart settings
	const SIZE = 200;
	const CENTER = SIZE / 2;
	const RADIUS = 80;
	const INNER_RADIUS = 50;

	// Priority labels
	const PRIORITY_LABELS: Record<TaskPriority, string> = {
		low: 'Niedrig',
		medium: 'Mittel',
		high: 'Hoch',
		urgent: 'Dringend',
	};

	// Total count
	let total = $derived(data.reduce((sum, d) => sum + d.count, 0));

	// Generate arc paths
	let arcs = $derived.by(() => {
		if (total === 0) return [];

		const result: Array<{
			path: string;
			color: string;
			priority: TaskPriority;
			count: number;
			percentage: number;
		}> = [];

		let currentAngle = -90; // Start at top

		data.forEach((segment) => {
			if (segment.count === 0) return;

			const angle = (segment.count / total) * 360;
			const startAngle = currentAngle;
			const endAngle = currentAngle + angle;

			// Convert angles to radians
			const startRad = (startAngle * Math.PI) / 180;
			const endRad = (endAngle * Math.PI) / 180;

			// Calculate points
			const x1 = CENTER + RADIUS * Math.cos(startRad);
			const y1 = CENTER + RADIUS * Math.sin(startRad);
			const x2 = CENTER + RADIUS * Math.cos(endRad);
			const y2 = CENTER + RADIUS * Math.sin(endRad);
			const x3 = CENTER + INNER_RADIUS * Math.cos(endRad);
			const y3 = CENTER + INNER_RADIUS * Math.sin(endRad);
			const x4 = CENTER + INNER_RADIUS * Math.cos(startRad);
			const y4 = CENTER + INNER_RADIUS * Math.sin(startRad);

			const largeArc = angle > 180 ? 1 : 0;

			// Create arc path
			const path = [
				`M ${x1} ${y1}`,
				`A ${RADIUS} ${RADIUS} 0 ${largeArc} 1 ${x2} ${y2}`,
				`L ${x3} ${y3}`,
				`A ${INNER_RADIUS} ${INNER_RADIUS} 0 ${largeArc} 0 ${x4} ${y4}`,
				'Z',
			].join(' ');

			result.push({
				path,
				color: segment.color,
				priority: segment.priority,
				count: segment.count,
				percentage: segment.percentage,
			});

			currentAngle = endAngle;
		});

		return result;
	});

	// Hover state
	let hoveredSegment = $state<TaskPriority | null>(null);
</script>

<div class="donut-container">
	<h3 class="donut-title">Prioritäten</h3>

	<div class="donut-content">
		<div class="donut-chart">
			<svg viewBox="0 0 {SIZE} {SIZE}" class="donut-svg">
				{#each arcs as arc}
					<path
						d={arc.path}
						fill={arc.color}
						class="arc-segment"
						class:hovered={hoveredSegment === arc.priority}
						onmouseenter={() => (hoveredSegment = arc.priority)}
						onmouseleave={() => (hoveredSegment = null)}
						role="graphics-symbol"
						aria-label="{PRIORITY_LABELS[arc.priority]}: {arc.count}"
					>
						<title>{PRIORITY_LABELS[arc.priority]}: {arc.count} ({arc.percentage}%)</title>
					</path>
				{/each}

				<!-- Center text -->
				<text x={CENTER} y={CENTER - 8} class="center-count">
					{total}
				</text>
				<text x={CENTER} y={CENTER + 12} class="center-label"> Aktiv </text>
			</svg>
		</div>

		<!-- Legend -->
		<div class="donut-legend">
			{#each data as item}
				<div
					class="legend-item"
					class:active={hoveredSegment === item.priority}
					onmouseenter={() => (hoveredSegment = item.priority)}
					onmouseleave={() => (hoveredSegment = null)}
					role="button"
					tabindex="0"
				>
					<span class="legend-color" style="background-color: {item.color}"></span>
					<span class="legend-label">{PRIORITY_LABELS[item.priority]}</span>
					<span class="legend-count">{item.count}</span>
				</div>
			{/each}
		</div>
	</div>
</div>

<style>
	.donut-container {
		background: rgba(255, 255, 255, 0.95);
		backdrop-filter: blur(20px);
		-webkit-backdrop-filter: blur(20px);
		border: 1px solid rgba(0, 0, 0, 0.1);
		border-radius: 1.5rem;
		padding: 1.5rem;
	}

	:global(.dark) .donut-container {
		background: rgba(30, 30, 30, 0.95);
		border: 1px solid rgba(255, 255, 255, 0.15);
	}

	.donut-title {
		font-size: 1rem;
		font-weight: 600;
		color: hsl(var(--foreground));
		margin: 0 0 1rem 0;
	}

	.donut-content {
		display: flex;
		align-items: center;
		gap: 1.5rem;
	}

	@media (max-width: 400px) {
		.donut-content {
			flex-direction: column;
		}
	}

	.donut-chart {
		flex-shrink: 0;
	}

	.donut-svg {
		width: 140px;
		height: 140px;
	}

	.arc-segment {
		transition:
			opacity 0.15s ease,
			transform 0.15s ease;
		transform-origin: center;
		cursor: pointer;
	}

	.arc-segment:hover,
	.arc-segment.hovered {
		opacity: 0.85;
		transform: scale(1.02);
	}

	.center-count {
		font-size: 28px;
		font-weight: 700;
		fill: hsl(var(--foreground));
		text-anchor: middle;
	}

	.center-label {
		font-size: 12px;
		fill: hsl(var(--muted-foreground));
		text-anchor: middle;
	}

	.donut-legend {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		flex: 1;
		min-width: 0;
	}

	.legend-item {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.375rem 0.5rem;
		border-radius: 0.5rem;
		cursor: pointer;
		transition: background-color 0.15s ease;
	}

	.legend-item:hover,
	.legend-item.active {
		background: hsl(var(--muted) / 0.3);
	}

	.legend-color {
		width: 12px;
		height: 12px;
		border-radius: 3px;
		flex-shrink: 0;
	}

	.legend-label {
		font-size: 0.875rem;
		color: hsl(var(--foreground));
		flex: 1;
	}

	.legend-count {
		font-size: 0.875rem;
		font-weight: 600;
		color: hsl(var(--muted-foreground));
	}
</style>
