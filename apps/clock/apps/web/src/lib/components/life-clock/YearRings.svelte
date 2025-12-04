<script lang="ts">
	interface Props {
		yearsLived: number;
		exactAge: { years: number; months: number; days: number };
		lifeExpectancyYears?: number;
		size?: number;
	}

	let { yearsLived, exactAge, lifeExpectancyYears = 80, size = 300 }: Props = $props();

	// Calculate rings
	let totalYears = lifeExpectancyYears;
	let ringWidth = $derived(Math.max(2, (size / 2 - 20) / totalYears));
	let centerX = $derived(size / 2);
	let centerY = $derived(size / 2);

	// Generate rings data
	let rings = $derived(() => {
		const result: {
			year: number;
			radius: number;
			lived: boolean;
			current: boolean;
			decade: boolean;
		}[] = [];
		for (let year = 1; year <= totalYears; year++) {
			const radius = 15 + year * ringWidth;
			result.push({
				year,
				radius,
				lived: year <= yearsLived,
				current: year === yearsLived + 1,
				decade: year % 10 === 0,
			});
		}
		return result;
	});

	// Current year progress (partial ring)
	let currentYearProgress = $derived(() => {
		const monthProgress = exactAge.months / 12;
		const dayProgress = exactAge.days / 365;
		return (monthProgress + dayProgress) * 100;
	});
</script>

<div class="year-rings-container">
	<div class="rings-header">
		<span class="header-label">Jeder Ring = 1 Jahr deines Lebens</span>
	</div>

	<div class="rings-wrapper" style="width: {size}px; height: {size}px;">
		<svg width={size} height={size} viewBox="0 0 {size} {size}" class="rings-svg">
			<!-- Background rings (future years) -->
			{#each rings() as ring}
				{#if !ring.lived && !ring.current}
					<circle
						cx={centerX}
						cy={centerY}
						r={ring.radius}
						fill="none"
						stroke="hsl(var(--color-muted-foreground) / 0.1)"
						stroke-width={ringWidth - 1}
						class:decade-ring={ring.decade}
					/>
				{/if}
			{/each}

			<!-- Lived years -->
			{#each rings() as ring}
				{#if ring.lived}
					<circle
						cx={centerX}
						cy={centerY}
						r={ring.radius}
						fill="none"
						stroke="hsl(var(--color-primary) / {0.3 + (ring.year / totalYears) * 0.7})"
						stroke-width={ringWidth - 1}
					/>
				{/if}
			{/each}

			<!-- Current year (partial) -->
			{#each rings() as ring}
				{#if ring.current}
					{@const circumference = 2 * Math.PI * ring.radius}
					{@const dashOffset = circumference - (currentYearProgress() / 100) * circumference}
					<circle
						cx={centerX}
						cy={centerY}
						r={ring.radius}
						fill="none"
						stroke="hsl(var(--color-primary))"
						stroke-width={ringWidth - 1}
						stroke-dasharray={circumference}
						stroke-dashoffset={dashOffset}
						stroke-linecap="round"
						transform="rotate(-90 {centerX} {centerY})"
					/>
				{/if}
			{/each}

			<!-- Decade markers -->
			{#each [10, 20, 30, 40, 50, 60, 70, 80] as decade}
				{@const markerRadius = 15 + decade * ringWidth + ringWidth / 2 + 2}
				{#if decade <= totalYears}
					<text
						x={centerX + markerRadius}
						y={centerY}
						text-anchor="start"
						dominant-baseline="middle"
						class="decade-label"
					>
						{decade}
					</text>
				{/if}
			{/each}

			<!-- Center dot -->
			<circle cx={centerX} cy={centerY} r="8" fill="hsl(var(--color-primary))" />
			<text
				x={centerX}
				y={centerY}
				text-anchor="middle"
				dominant-baseline="middle"
				class="birth-label"
			>
				0
			</text>
		</svg>
	</div>

	<div class="rings-info">
		<div class="age-display">
			<span class="age-years">{exactAge.years}</span>
			<span class="age-unit">Jahre</span>
			<span class="age-detail">+ {exactAge.months} Monate, {exactAge.days} Tage</span>
		</div>
	</div>

	<div class="rings-legend">
		<div class="legend-item">
			<div class="legend-ring lived"></div>
			<span>Gelebte Jahre</span>
		</div>
		<div class="legend-item">
			<div class="legend-ring current"></div>
			<span>Aktuelles Jahr</span>
		</div>
		<div class="legend-item">
			<div class="legend-ring future"></div>
			<span>Zukünftige Jahre</span>
		</div>
	</div>
</div>

<style>
	.year-rings-container {
		display: flex;
		flex-direction: column;
		align-items: center;
	}

	.rings-header {
		margin-bottom: 1rem;
	}

	.header-label {
		font-size: 0.75rem;
		color: hsl(var(--color-muted-foreground));
	}

	.rings-wrapper {
		position: relative;
	}

	.rings-svg {
		display: block;
	}

	.decade-ring {
		stroke: hsl(var(--color-muted-foreground) / 0.2) !important;
	}

	.decade-label {
		font-size: 0.5rem;
		fill: hsl(var(--color-muted-foreground) / 0.6);
		font-weight: 500;
	}

	.birth-label {
		font-size: 0.5rem;
		fill: hsl(var(--color-primary-foreground));
		font-weight: 600;
	}

	.rings-info {
		margin-top: 1rem;
		text-align: center;
	}

	.age-display {
		display: flex;
		align-items: baseline;
		justify-content: center;
		gap: 0.375rem;
	}

	.age-years {
		font-size: 2rem;
		font-weight: 300;
		color: hsl(var(--color-foreground));
	}

	.age-unit {
		font-size: 1rem;
		color: hsl(var(--color-muted-foreground));
	}

	.age-detail {
		font-size: 0.875rem;
		color: hsl(var(--color-muted-foreground));
		margin-left: 0.25rem;
	}

	.rings-legend {
		display: flex;
		justify-content: center;
		gap: 1.25rem;
		margin-top: 1rem;
	}

	.legend-item {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		font-size: 0.625rem;
		color: hsl(var(--color-muted-foreground));
	}

	.legend-ring {
		width: 12px;
		height: 12px;
		border-radius: 50%;
		border: 2px solid;
	}

	.legend-ring.lived {
		border-color: hsl(var(--color-primary));
		background: hsl(var(--color-primary) / 0.3);
	}

	.legend-ring.current {
		border-color: hsl(var(--color-primary));
		background: transparent;
	}

	.legend-ring.future {
		border-color: hsl(var(--color-muted-foreground) / 0.2);
		background: transparent;
	}
</style>
