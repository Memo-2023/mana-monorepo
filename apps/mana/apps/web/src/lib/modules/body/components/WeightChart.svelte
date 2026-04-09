<!--
  WeightChart — minimal SVG line chart for a single measurement type
  (defaults to weight) over the most recent N entries.

  Pure SVG: no chart library dependency. The y-axis auto-scales to
  the value range with a small padding so flat-line periods don't
  collapse to a single horizontal line at the top of the box.
-->
<script lang="ts">
	import type { BodyMeasurement, MeasurementType } from '../types';

	interface Props {
		measurements: BodyMeasurement[];
		type?: MeasurementType;
		limit?: number;
		height?: number;
	}
	const { measurements, type = 'weight', limit = 30, height = 100 }: Props = $props();

	let series = $derived(
		measurements
			.filter((m) => m.type === type)
			.sort((a, b) => a.date.localeCompare(b.date))
			.slice(-limit)
	);

	let extent = $derived.by(() => {
		if (series.length === 0) return { min: 0, max: 1 };
		const values = series.map((m) => m.value);
		const min = Math.min(...values);
		const max = Math.max(...values);
		const pad = Math.max((max - min) * 0.15, 0.5);
		return { min: min - pad, max: max + pad };
	});

	const width = 320;
	const padX = 8;
	const padY = 8;

	let path = $derived.by(() => {
		if (series.length < 2) return '';
		const range = extent.max - extent.min || 1;
		const stepX = (width - padX * 2) / (series.length - 1);
		return series
			.map((m, i) => {
				const x = padX + i * stepX;
				const y = padY + (height - padY * 2) * (1 - (m.value - extent.min) / range);
				return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
			})
			.join(' ');
	});

	let latest = $derived(series[series.length - 1]);
	let first = $derived(series[0]);
	let delta = $derived(latest && first ? latest.value - first.value : 0);
</script>

<div class="chart">
	{#if series.length === 0}
		<p class="empty">Noch keine Daten</p>
	{:else}
		<div class="header">
			<div class="latest">
				{latest.value} <span class="unit">{latest.unit === 'percent' ? '%' : latest.unit}</span>
			</div>
			{#if series.length > 1}
				<div class="delta" class:positive={delta > 0} class:negative={delta < 0}>
					{delta > 0 ? '+' : ''}{delta.toFixed(1)}
				</div>
			{/if}
		</div>

		<svg viewBox="0 0 {width} {height}" preserveAspectRatio="none">
			<path
				d={path}
				fill="none"
				stroke="currentColor"
				stroke-width="2"
				stroke-linecap="round"
				stroke-linejoin="round"
			/>
			{#each series as m, i (m.id)}
				{@const range = extent.max - extent.min || 1}
				{@const stepX = (width - padX * 2) / Math.max(series.length - 1, 1)}
				{@const x = padX + i * stepX}
				{@const y = padY + (height - padY * 2) * (1 - (m.value - extent.min) / range)}
				<circle cx={x} cy={y} r="2" fill="currentColor" />
			{/each}
		</svg>
	{/if}
</div>

<style>
	.chart {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		color: hsl(var(--color-primary));
	}
	.header {
		display: flex;
		align-items: baseline;
		gap: 0.5rem;
	}
	.latest {
		font-size: 1.25rem;
		font-weight: 600;
		color: hsl(var(--color-foreground));
		font-variant-numeric: tabular-nums;
	}
	.unit {
		font-size: 0.75rem;
		color: hsl(var(--color-muted-foreground));
		font-weight: 400;
	}
	.delta {
		font-size: 0.75rem;
		font-weight: 600;
		color: hsl(var(--color-muted-foreground));
		font-variant-numeric: tabular-nums;
	}
	.delta.positive {
		color: hsl(142 71% 45%);
	}
	.delta.negative {
		color: hsl(0 84% 60%);
	}
	svg {
		width: 100%;
		height: auto;
	}
	.empty {
		font-size: 0.8125rem;
		color: hsl(var(--color-muted-foreground));
	}
</style>
