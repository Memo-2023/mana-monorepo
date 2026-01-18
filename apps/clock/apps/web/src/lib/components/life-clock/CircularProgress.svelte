<script lang="ts">
	import { onMount } from 'svelte';

	interface Props {
		daysLived: number;
		lifeExpectancyYears?: number;
		size?: number;
	}

	let { daysLived, lifeExpectancyYears = 80, size = 280 }: Props = $props();

	// Calculate progress
	let totalDays = $derived(Math.ceil(lifeExpectancyYears * 365.25));
	let percentage = $derived(Math.min((daysLived / totalDays) * 100, 100));
	let remainingDays = $derived(Math.max(totalDays - daysLived, 0));

	// SVG calculations
	let strokeWidth = 12;
	let radius = $derived((size - strokeWidth) / 2);
	let circumference = $derived(2 * Math.PI * radius);
	let dashOffset = $derived(circumference - (percentage / 100) * circumference);

	// Animation
	let animatedOffset = $state(circumference);
	let mounted = $state(false);

	onMount(() => {
		mounted = true;
		// Animate on mount
		requestAnimationFrame(() => {
			animatedOffset = dashOffset;
		});
	});

	// Update animation when values change
	$effect(() => {
		if (mounted) {
			animatedOffset = dashOffset;
		}
	});
</script>

<div class="circular-container">
	<div class="circular-wrapper" style="width: {size}px; height: {size}px;">
		<svg width={size} height={size} viewBox="0 0 {size} {size}" class="circular-svg">
			<!-- Background circle -->
			<circle
				cx={size / 2}
				cy={size / 2}
				r={radius}
				fill="none"
				stroke="hsl(var(--color-muted-foreground) / 0.15)"
				stroke-width={strokeWidth}
			/>

			<!-- Progress circle -->
			<circle
				cx={size / 2}
				cy={size / 2}
				r={radius}
				fill="none"
				stroke="hsl(var(--color-primary))"
				stroke-width={strokeWidth}
				stroke-linecap="round"
				stroke-dasharray={circumference}
				stroke-dashoffset={animatedOffset}
				transform="rotate(-90 {size / 2} {size / 2})"
				class="progress-circle"
			/>

			<!-- Markers for decades -->
			{#each Array(8) as _, i}
				{@const angle = (i / 8) * 360 - 90}
				{@const markerRadius = radius + strokeWidth / 2 + 8}
				{@const x = size / 2 + markerRadius * Math.cos((angle * Math.PI) / 180)}
				{@const y = size / 2 + markerRadius * Math.sin((angle * Math.PI) / 180)}
				<text {x} {y} text-anchor="middle" dominant-baseline="middle" class="decade-marker">
					{i * 10}
				</text>
			{/each}
		</svg>

		<!-- Center content -->
		<div class="center-content">
			<span class="percentage">{percentage.toFixed(1)}%</span>
			<span class="label">gelebt</span>
		</div>
	</div>

	<div class="circular-stats">
		<div class="stat-row">
			<div class="stat">
				<span class="stat-value lived">{daysLived.toLocaleString('de-DE')}</span>
				<span class="stat-label">Tage gelebt</span>
			</div>
			<div class="stat-divider"></div>
			<div class="stat">
				<span class="stat-value remaining">{remainingDays.toLocaleString('de-DE')}</span>
				<span class="stat-label">Tage verbleibend</span>
			</div>
		</div>
		<p class="expectancy-note">Basierend auf {lifeExpectancyYears} Jahren Lebenserwartung</p>
	</div>
</div>

<style>
	.circular-container {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1.5rem;
	}

	.circular-wrapper {
		position: relative;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.circular-svg {
		transform: rotate(0deg);
	}

	.progress-circle {
		transition: stroke-dashoffset 1.5s cubic-bezier(0.4, 0, 0.2, 1);
	}

	.decade-marker {
		font-size: 0.625rem;
		fill: hsl(var(--color-muted-foreground));
		font-weight: 500;
	}

	.center-content {
		position: absolute;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
	}

	.percentage {
		font-size: 2.5rem;
		font-weight: 200;
		color: hsl(var(--color-foreground));
		line-height: 1;
	}

	.label {
		font-size: 0.875rem;
		color: hsl(var(--color-muted-foreground));
		margin-top: 0.25rem;
	}

	.circular-stats {
		text-align: center;
	}

	.stat-row {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 1.5rem;
	}

	.stat {
		display: flex;
		flex-direction: column;
		align-items: center;
	}

	.stat-divider {
		width: 1px;
		height: 2.5rem;
		background: hsl(var(--color-border));
	}

	.stat-value {
		font-size: 1.25rem;
		font-weight: 600;
		font-variant-numeric: tabular-nums;
	}

	.stat-value.lived {
		color: hsl(var(--color-primary));
	}

	.stat-value.remaining {
		color: hsl(var(--color-muted-foreground));
	}

	.stat-label {
		font-size: 0.75rem;
		color: hsl(var(--color-muted-foreground));
		margin-top: 0.125rem;
	}

	.expectancy-note {
		font-size: 0.625rem;
		color: hsl(var(--color-muted-foreground) / 0.7);
		margin-top: 0.75rem;
	}
</style>
