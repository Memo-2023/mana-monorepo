<script lang="ts">
	import { format, parseISO, getMonth } from 'date-fns';
	import { de } from 'date-fns/locale';
	import type { HeatmapDataPoint } from './types';

	interface Props {
		data: HeatmapDataPoint[];
		title?: string;
		/** Number of days to display (default: 180) */
		daysCount?: number;
		/** Custom tooltip formatter */
		tooltipFormatter?: (point: HeatmapDataPoint) => string;
		/** Item name for tooltip (e.g., "Aufgabe", "Event", "Kontakt") */
		itemName?: string;
		/** Plural item name for tooltip (e.g., "Aufgaben", "Events", "Kontakte") */
		itemNamePlural?: string;
	}

	let {
		data,
		title = 'Aktivität',
		daysCount = 180,
		tooltipFormatter,
		itemName = 'Aufgabe',
		itemNamePlural = 'Aufgaben',
	}: Props = $props();

	// Constants
	const CELL_SIZE = 12;
	const CELL_GAP = 3;
	const DAY_LABELS = ['Mo', '', 'Mi', '', 'Fr', '', 'So'];

	// Calculate max for color scaling
	let maxCount = $derived(Math.max(...data.map((d) => d.count), 1));

	// Get color intensity based on count (uses CSS variable --primary)
	function getColorClass(count: number): string {
		if (count === 0) return 'intensity-0';
		const ratio = count / maxCount;
		if (ratio <= 0.25) return 'intensity-1';
		if (ratio <= 0.5) return 'intensity-2';
		if (ratio <= 0.75) return 'intensity-3';
		return 'intensity-4';
	}

	// Group data by weeks
	let weeks = $derived.by(() => {
		const result: HeatmapDataPoint[][] = [];
		let currentWeek: HeatmapDataPoint[] = [];

		// Adjust for Monday start
		const adjustedData = [...data];

		// Fill initial gap if first day isn't Monday
		if (adjustedData.length > 0) {
			const firstDay = adjustedData[0];
			// Convert Sunday (0) to 6, Monday (1) to 0, etc.
			const adjustedDayOfWeek = firstDay.dayOfWeek === 0 ? 6 : firstDay.dayOfWeek - 1;

			for (let i = 0; i < adjustedDayOfWeek; i++) {
				currentWeek.push({ date: '', count: 0, dayOfWeek: i });
			}
		}

		adjustedData.forEach((day) => {
			// Convert to Monday-based index
			const adjustedDayOfWeek = day.dayOfWeek === 0 ? 6 : day.dayOfWeek - 1;

			if (adjustedDayOfWeek === 0 && currentWeek.length > 0) {
				result.push(currentWeek);
				currentWeek = [];
			}
			currentWeek.push({ ...day, dayOfWeek: adjustedDayOfWeek });
		});

		if (currentWeek.length > 0) {
			result.push(currentWeek);
		}

		return result;
	});

	// Calculate month labels
	let monthLabels = $derived.by(() => {
		const labels: { month: string; weekIndex: number }[] = [];
		let lastMonth = -1;

		weeks.forEach((week, weekIndex) => {
			const validDay = week.find((d) => d.date);
			if (validDay) {
				const date = parseISO(validDay.date);
				const month = getMonth(date);
				if (month !== lastMonth) {
					labels.push({
						month: format(date, 'MMM', { locale: de }),
						weekIndex,
					});
					lastMonth = month;
				}
			}
		});

		return labels;
	});

	// Calculate SVG dimensions
	let svgWidth = $derived(weeks.length * (CELL_SIZE + CELL_GAP) + 30);
	let svgHeight = 7 * (CELL_SIZE + CELL_GAP) + 30;

	function formatTooltip(day: HeatmapDataPoint): string {
		if (!day.date) return '';
		if (tooltipFormatter) return tooltipFormatter(day);
		const date = format(parseISO(day.date), 'EEEE, d. MMMM yyyy', { locale: de });
		const name = day.count === 1 ? itemName : itemNamePlural;
		return `${day.count} ${name} am ${date}`;
	}
</script>

<div class="heatmap-container">
	<h3 class="heatmap-title">{title}</h3>

	<div class="heatmap-scroll">
		<svg
			width={svgWidth}
			height={svgHeight}
			viewBox="0 0 {svgWidth} {svgHeight}"
			class="heatmap-svg"
		>
			<!-- Month labels -->
			{#each monthLabels as label}
				<text x={30 + label.weekIndex * (CELL_SIZE + CELL_GAP)} y={10} class="month-label">
					{label.month}
				</text>
			{/each}

			<!-- Day labels -->
			{#each DAY_LABELS as label, i}
				{#if label}
					<text x={0} y={22 + i * (CELL_SIZE + CELL_GAP) + CELL_SIZE / 2 + 4} class="day-label">
						{label}
					</text>
				{/if}
			{/each}

			<!-- Cells -->
			{#each weeks as week, weekIndex}
				{#each week as day, dayIndex}
					{#if day.date}
						<rect
							x={30 + weekIndex * (CELL_SIZE + CELL_GAP)}
							y={20 + dayIndex * (CELL_SIZE + CELL_GAP)}
							width={CELL_SIZE}
							height={CELL_SIZE}
							rx={2}
							class="cell {getColorClass(day.count)}"
						>
							<title>{formatTooltip(day)}</title>
						</rect>
					{:else}
						<rect
							x={30 + weekIndex * (CELL_SIZE + CELL_GAP)}
							y={20 + dayIndex * (CELL_SIZE + CELL_GAP)}
							width={CELL_SIZE}
							height={CELL_SIZE}
							rx={2}
							class="cell empty"
						/>
					{/if}
				{/each}
			{/each}
		</svg>
	</div>

	<!-- Legend -->
	<div class="legend">
		<span class="legend-label">Weniger</span>
		<div class="legend-cells">
			<div class="legend-cell intensity-0"></div>
			<div class="legend-cell intensity-1"></div>
			<div class="legend-cell intensity-2"></div>
			<div class="legend-cell intensity-3"></div>
			<div class="legend-cell intensity-4"></div>
		</div>
		<span class="legend-label">Mehr</span>
	</div>
</div>

<style>
	.heatmap-container {
		background: rgba(255, 255, 255, 0.95);
		backdrop-filter: blur(20px);
		-webkit-backdrop-filter: blur(20px);
		border: 1px solid rgba(0, 0, 0, 0.1);
		border-radius: 1.5rem;
		padding: 1.5rem;
	}

	:global(.dark) .heatmap-container {
		background: rgba(30, 30, 30, 0.95);
		border: 1px solid rgba(255, 255, 255, 0.15);
	}

	.heatmap-title {
		font-size: 1rem;
		font-weight: 600;
		color: hsl(var(--foreground));
		margin: 0 0 1rem 0;
	}

	.heatmap-scroll {
		overflow-x: auto;
		padding-bottom: 0.5rem;
	}

	.heatmap-svg {
		display: block;
	}

	.month-label {
		font-size: 10px;
		fill: hsl(var(--muted-foreground));
	}

	.day-label {
		font-size: 10px;
		fill: hsl(var(--muted-foreground));
	}

	.cell {
		transition: opacity 0.15s ease;
	}

	.cell:hover {
		opacity: 0.8;
	}

	.cell.empty {
		fill: transparent;
	}

	:global(.dark) .cell.empty {
		fill: transparent;
	}

	.legend {
		display: flex;
		align-items: center;
		justify-content: flex-end;
		gap: 0.5rem;
		margin-top: 1rem;
	}

	.legend-label {
		font-size: 0.75rem;
		color: hsl(var(--muted-foreground));
	}

	.legend-cells {
		display: flex;
		gap: 3px;
	}

	.legend-cell {
		width: 12px;
		height: 12px;
		border-radius: 2px;
	}

	/* Intensity classes using theme primary color */
	.intensity-0 {
		fill: hsl(var(--muted) / 0.3);
		background: hsl(var(--muted) / 0.3);
	}

	.intensity-1 {
		fill: hsl(var(--primary) / 0.3);
		background: hsl(var(--primary) / 0.3);
	}

	.intensity-2 {
		fill: hsl(var(--primary) / 0.5);
		background: hsl(var(--primary) / 0.5);
	}

	.intensity-3 {
		fill: hsl(var(--primary) / 0.7);
		background: hsl(var(--primary) / 0.7);
	}

	.intensity-4 {
		fill: hsl(var(--primary));
		background: hsl(var(--primary));
	}
</style>
