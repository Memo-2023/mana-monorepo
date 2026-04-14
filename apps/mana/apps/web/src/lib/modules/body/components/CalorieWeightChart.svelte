<!--
  CalorieWeightChart — Body × Food correlation view.

  Overlays daily calorie intake (from food `meals`) against
  bodyweight (from `bodyMeasurements`) for the last N days. The
  whole point of having both modules in the same app is being
  able to ask "did the cut work?" without exporting CSVs.

  Two y-axes (calories left, weight right), shared x. Pure SVG,
  same auto-scaling pattern as the other charts in this module —
  no chart-lib dependency.

  When an active phase is supplied we draw a horizontal target-
  weight line so the user can see how far the run is from goal.

  Data:
    - calorie buckets are summed per day across non-deleted meals
      with non-null nutrition.calories
    - weight series uses the latest weight reading per day (one
      person can step on the scale twice; we keep the last)
    - days with no data are simply omitted, the line interpolates
-->
<script lang="ts">
	import type { BodyMeasurement, BodyPhase } from '../types';
	import type { MealWithNutrition } from '$lib/modules/food/types';

	interface Props {
		measurements: BodyMeasurement[];
		meals: MealWithNutrition[];
		activePhase?: BodyPhase | null;
		days?: number;
		height?: number;
	}
	const { measurements, meals, activePhase = null, days = 56, height = 160 }: Props = $props();

	// ─ Date axis: last `days` days ending today ─
	let axis = $derived.by(() => {
		const out: string[] = [];
		const today = new Date();
		for (let i = days - 1; i >= 0; i--) {
			const d = new Date(today);
			d.setDate(today.getDate() - i);
			out.push(d.toISOString().split('T')[0]);
		}
		return out;
	});

	// ─ Calorie sum per day from meals ─
	let caloriesByDate = $derived.by(() => {
		const map = new Map<string, number>();
		for (const m of meals) {
			const cals = m.nutrition?.calories ?? 0;
			if (cals <= 0) continue;
			map.set(m.date, (map.get(m.date) ?? 0) + cals);
		}
		return map;
	});

	// ─ Latest weight per day ─
	let weightByDate = $derived.by(() => {
		const map = new Map<string, number>();
		for (const m of measurements) {
			if (m.type !== 'weight') continue;
			const existing = map.get(m.date);
			// Replace if this reading is created later than the kept one;
			// the BodyMeasurement type doesn't carry an in-day timestamp
			// so we just take the last one we encounter — order from
			// useAllBodyMeasurements is "by date desc" already, so we
			// only set if not already present.
			if (existing === undefined) {
				map.set(m.date, m.value);
			}
		}
		return map;
	});

	// ─ Restrict series to days that fall inside the axis window ─
	let calSeries = $derived(axis.map((d) => ({ date: d, value: caloriesByDate.get(d) ?? null })));
	let weightSeries = $derived(axis.map((d) => ({ date: d, value: weightByDate.get(d) ?? null })));

	// ─ Auto-scaled extents (skip null buckets) ─
	function extent(values: (number | null)[]): { min: number; max: number } {
		const real = values.filter((v): v is number => v !== null);
		if (real.length === 0) return { min: 0, max: 1 };
		const min = Math.min(...real);
		const max = Math.max(...real);
		const pad = Math.max((max - min) * 0.15, 1);
		return { min: min - pad, max: max + pad };
	}
	let calExtent = $derived(extent(calSeries.map((p) => p.value)));
	let weightExtent = $derived(extent(weightSeries.map((p) => p.value)));

	// ─ Counts so we can decide whether to render ─
	let calPoints = $derived(calSeries.filter((p) => p.value !== null).length);
	let weightPoints = $derived(weightSeries.filter((p) => p.value !== null).length);

	// ─ Geometry ─
	const width = 480;
	const padX = 12;
	const padY = 14;

	function plotPath(series: { value: number | null }[], ext: { min: number; max: number }): string {
		const range = ext.max - ext.min || 1;
		const stepX = (width - padX * 2) / Math.max(series.length - 1, 1);
		let d = '';
		let lastWasNull = true;
		series.forEach((p, i) => {
			if (p.value === null) {
				lastWasNull = true;
				return;
			}
			const x = padX + i * stepX;
			const y = padY + (height - padY * 2) * (1 - (p.value - ext.min) / range);
			d += `${lastWasNull ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)} `;
			lastWasNull = false;
		});
		return d.trim();
	}

	let calPath = $derived(plotPath(calSeries, calExtent));
	let weightPath = $derived(plotPath(weightSeries, weightExtent));

	// ─ Target weight overlay ─
	let targetY = $derived.by(() => {
		const target = activePhase?.targetWeight ?? null;
		if (target === null) return null;
		const range = weightExtent.max - weightExtent.min || 1;
		// Only render the target line if it falls within the visible range,
		// otherwise it gets clamped to the edge and looks like a meaningless
		// boundary stripe. The user can read the explicit value from the legend.
		if (target < weightExtent.min || target > weightExtent.max) return null;
		return padY + (height - padY * 2) * (1 - (target - weightExtent.min) / range);
	});

	// ─ Trend deltas (first → last non-null point of each series) ─
	function trendDelta(series: { value: number | null }[]): number | null {
		const real = series.filter((p): p is { value: number } => p.value !== null);
		if (real.length < 2) return null;
		return real[real.length - 1].value - real[0].value;
	}
	let calDelta = $derived(trendDelta(calSeries));
	let weightDelta = $derived(trendDelta(weightSeries));

	function avgCalories(): number | null {
		const real = calSeries.map((p) => p.value).filter((v): v is number => v !== null);
		if (real.length === 0) return null;
		return Math.round(real.reduce((s, v) => s + v, 0) / real.length);
	}
	let avg = $derived(avgCalories());
</script>

<div class="chart">
	{#if calPoints === 0 && weightPoints === 0}
		<p class="empty">Noch keine überlappenden Daten — logge Mahlzeiten und Gewicht parallel.</p>
	{:else}
		<div class="legend">
			<div class="series cal">
				<span class="dot"></span>
				<div>
					<div class="series-label">Ø Kalorien / Tag</div>
					<div class="series-value">
						{avg ?? '—'}
						{#if calDelta !== null}
							<span class="delta" class:up={calDelta > 0} class:down={calDelta < 0}>
								{calDelta > 0 ? '+' : ''}{Math.round(calDelta)}
							</span>
						{/if}
					</div>
				</div>
			</div>
			<div class="series weight">
				<span class="dot"></span>
				<div>
					<div class="series-label">Gewicht</div>
					<div class="series-value">
						{weightSeries.filter((p) => p.value !== null).slice(-1)[0]?.value ?? '—'}
						<span class="unit">kg</span>
						{#if weightDelta !== null}
							<span class="delta" class:up={weightDelta > 0} class:down={weightDelta < 0}>
								{weightDelta > 0 ? '+' : ''}{weightDelta.toFixed(1)}
							</span>
						{/if}
					</div>
				</div>
			</div>
		</div>

		<svg viewBox="0 0 {width} {height}" preserveAspectRatio="none">
			{#if targetY !== null}
				<line
					x1={padX}
					x2={width - padX}
					y1={targetY}
					y2={targetY}
					stroke="hsl(var(--color-muted-foreground))"
					stroke-width="1"
					stroke-dasharray="3 3"
					opacity="0.6"
				/>
			{/if}
			<path
				d={calPath}
				fill="none"
				stroke="hsl(35 90% 55%)"
				stroke-width="2"
				stroke-linecap="round"
				stroke-linejoin="round"
			/>
			<path
				d={weightPath}
				fill="none"
				stroke="hsl(217 91% 60%)"
				stroke-width="2"
				stroke-linecap="round"
				stroke-linejoin="round"
			/>
		</svg>

		<div class="footer">
			Letzte {days} Tage
			{#if activePhase}
				· Phase: <span class="phase-name">{activePhase.kind}</span>
				{#if activePhase.targetWeight}
					· Ziel: {activePhase.targetWeight}kg
				{/if}
			{/if}
		</div>
	{/if}
</div>

<style>
	.chart {
		display: flex;
		flex-direction: column;
		gap: 0.625rem;
	}
	.legend {
		display: flex;
		gap: 1rem;
		flex-wrap: wrap;
	}
	.series {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}
	.dot {
		width: 0.625rem;
		height: 0.625rem;
		border-radius: 50%;
		flex-shrink: 0;
	}
	.cal .dot {
		background: hsl(35 90% 55%);
	}
	.weight .dot {
		background: hsl(217 91% 60%);
	}
	.series-label {
		font-size: 0.625rem;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: hsl(var(--color-muted-foreground));
	}
	.series-value {
		font-size: 1rem;
		font-weight: 600;
		color: hsl(var(--color-foreground));
		font-variant-numeric: tabular-nums;
	}
	.unit {
		font-size: 0.6875rem;
		color: hsl(var(--color-muted-foreground));
		font-weight: 400;
	}
	.delta {
		font-size: 0.75rem;
		font-weight: 600;
		margin-left: 0.25rem;
	}
	.delta.up {
		color: hsl(0 84% 60%);
	}
	.delta.down {
		color: hsl(142 71% 45%);
	}
	svg {
		width: 100%;
		height: auto;
	}
	.footer {
		font-size: 0.6875rem;
		color: hsl(var(--color-muted-foreground));
	}
	.phase-name {
		text-transform: uppercase;
		font-weight: 600;
		color: hsl(var(--color-foreground));
	}
	.empty {
		font-size: 0.8125rem;
		color: hsl(var(--color-muted-foreground));
		text-align: center;
		padding: 1rem 0;
	}
</style>
