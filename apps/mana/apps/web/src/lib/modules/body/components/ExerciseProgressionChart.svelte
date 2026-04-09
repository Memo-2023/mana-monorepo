<!--
  ExerciseProgressionChart — best estimated 1RM (Epley) per day for one
  exercise. Shares the auto-scaled SVG approach with WeightChart but
  takes a sets array + exerciseId instead of measurements.

  Optionally takes an exerciseSelector callback so a parent can render
  a list of exercises and switch the chart between them. The default
  picks the most-recently-trained exercise so the user always sees
  something useful even on first open.
-->
<script lang="ts">
	import type { BodyExercise, BodySet } from '../types';
	import { getE1rmTimeline, getLastSetByExercise } from '../queries';

	interface Props {
		sets: BodySet[];
		exercises: BodyExercise[];
		exerciseId?: string;
		height?: number;
	}
	const { sets, exercises, exerciseId, height = 120 }: Props = $props();

	let lastSets = $derived(getLastSetByExercise(sets));

	// If the parent doesn't pin one, fall back to the most recently
	// trained exercise so the chart isn't blank on first open.
	let resolvedId = $derived.by(() => {
		if (exerciseId) return exerciseId;
		const entries = [...lastSets.entries()].sort((a, b) =>
			b[1].createdAt.localeCompare(a[1].createdAt)
		);
		return entries[0]?.[0] ?? '';
	});

	let resolvedExercise = $derived(exercises.find((e) => e.id === resolvedId) ?? null);

	let timeline = $derived(resolvedId ? getE1rmTimeline(sets, resolvedId) : []);

	let extent = $derived.by(() => {
		if (timeline.length === 0) return { min: 0, max: 1 };
		const values = timeline.map((p) => p.value);
		const min = Math.min(...values);
		const max = Math.max(...values);
		const pad = Math.max((max - min) * 0.15, 1);
		return { min: min - pad, max: max + pad };
	});

	const width = 320;
	const padX = 8;
	const padY = 8;

	let path = $derived.by(() => {
		if (timeline.length < 2) return '';
		const range = extent.max - extent.min || 1;
		const stepX = (width - padX * 2) / (timeline.length - 1);
		return timeline
			.map((p, i) => {
				const x = padX + i * stepX;
				const y = padY + (height - padY * 2) * (1 - (p.value - extent.min) / range);
				return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
			})
			.join(' ');
	});

	let latest = $derived(timeline[timeline.length - 1]);
	let first = $derived(timeline[0]);
	let delta = $derived(latest && first ? latest.value - first.value : 0);
</script>

<div class="chart">
	{#if !resolvedExercise || timeline.length === 0}
		<p class="empty">Noch keine Sets geloggt</p>
	{:else}
		<div class="header">
			<div class="title">{resolvedExercise.name}</div>
			<div class="latest">
				e1RM <span class="value">{latest.value}</span>
				<span class="unit">kg</span>
				{#if timeline.length > 1}
					<span class="delta" class:positive={delta > 0} class:negative={delta < 0}>
						{delta > 0 ? '+' : ''}{delta.toFixed(0)}
					</span>
				{/if}
			</div>
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
			{#each timeline as p, i (p.date)}
				{@const range = extent.max - extent.min || 1}
				{@const stepX = (width - padX * 2) / Math.max(timeline.length - 1, 1)}
				{@const x = padX + i * stepX}
				{@const y = padY + (height - padY * 2) * (1 - (p.value - extent.min) / range)}
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
		justify-content: space-between;
		gap: 0.5rem;
	}
	.title {
		font-size: 0.8125rem;
		font-weight: 600;
		color: hsl(var(--color-foreground));
	}
	.latest {
		font-size: 0.6875rem;
		color: hsl(var(--color-muted-foreground));
		font-variant-numeric: tabular-nums;
	}
	.value {
		font-size: 1rem;
		font-weight: 600;
		color: hsl(var(--color-foreground));
	}
	.unit {
		font-size: 0.6875rem;
		color: hsl(var(--color-muted-foreground));
	}
	.delta {
		font-size: 0.75rem;
		font-weight: 600;
		margin-left: 0.25rem;
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
		font-size: 0.75rem;
		color: hsl(var(--color-muted-foreground));
	}
</style>
