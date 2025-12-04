<script lang="ts">
	interface Props {
		hours: number;
		minutes: number;
		seconds: number;
		size?: number;
	}

	let { hours, minutes, seconds, size = 280 }: Props = $props();

	// Clock hand rotations
	let secondRotation = $derived((seconds / 60) * 360);
	let minuteRotation = $derived(((minutes + seconds / 60) / 60) * 360);
	let hourRotation = $derived((((hours % 12) + minutes / 60) / 12) * 360);

	// Arabic numerals
	const numbers = [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
</script>

<div class="clock-face-modern" style="--size: {size}px;">
	<!-- Background with subtle gradient -->
	<div class="clock-bg">
		<div class="inner-shadow"></div>
	</div>

	<!-- Minute tick marks -->
	{#each Array(60) as _, i}
		{#if i % 5 !== 0}
			<div class="tick tick-minute" style="transform: rotate({i * 6}deg)"></div>
		{/if}
	{/each}

	<!-- Arabic numbers -->
	{#each numbers as num, i}
		<span class="number" style="--angle: {i * 30}deg;">
			{num}
		</span>
	{/each}

	<!-- Clock hands -->
	<div class="hands-container">
		<div class="hand hour-hand" style="transform: rotate({hourRotation}deg)"></div>
		<div class="hand minute-hand" style="transform: rotate({minuteRotation}deg)"></div>
		<div class="hand second-hand" style="transform: rotate({secondRotation}deg)">
			<div class="second-body"></div>
			<div class="second-tail"></div>
		</div>
	</div>

	<!-- Center dot -->
	<div class="center-cap">
		<div class="center-inner"></div>
	</div>
</div>

<style>
	.clock-face-modern {
		position: relative;
		width: var(--size);
		height: var(--size);
		border-radius: 50%;
	}

	.clock-bg {
		position: absolute;
		inset: 0;
		border-radius: 50%;
		background: hsl(var(--color-surface));
		border: 3px solid hsl(var(--color-border));
		box-shadow:
			0 8px 32px rgba(0, 0, 0, 0.1),
			0 2px 8px rgba(0, 0, 0, 0.05);
		overflow: hidden;
	}

	.inner-shadow {
		position: absolute;
		inset: 0;
		border-radius: 50%;
		box-shadow: inset 0 2px 10px rgba(0, 0, 0, 0.06);
	}

	.tick {
		position: absolute;
		top: 50%;
		left: 50%;
		transform-origin: center center;
	}

	.tick-minute {
		width: 2px;
		height: calc(var(--size) * 0.025);
		margin-left: -1px;
		margin-top: calc(var(--size) * -0.46);
		background: hsl(var(--color-muted-foreground) / 0.3);
		border-radius: 1px;
	}

	.number {
		position: absolute;
		top: 50%;
		left: 50%;
		font-family:
			-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', Roboto, sans-serif;
		font-size: calc(var(--size) * 0.075);
		font-weight: 600;
		color: hsl(var(--color-foreground));
		transform: translate(-50%, -50%) rotate(var(--angle)) translateY(calc(var(--size) * -0.36))
			rotate(calc(var(--angle) * -1));
	}

	.hands-container {
		position: absolute;
		inset: 0;
	}

	.hand {
		position: absolute;
		top: 50%;
		left: 50%;
		transform-origin: center bottom;
	}

	.hour-hand {
		width: calc(var(--size) * 0.028);
		height: calc(var(--size) * 0.26);
		margin-left: calc(var(--size) * -0.014);
		margin-top: calc(var(--size) * -0.26);
		background: hsl(var(--color-foreground));
		border-radius: calc(var(--size) * 0.014);
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.15);
	}

	.minute-hand {
		width: calc(var(--size) * 0.02);
		height: calc(var(--size) * 0.36);
		margin-left: calc(var(--size) * -0.01);
		margin-top: calc(var(--size) * -0.36);
		background: hsl(var(--color-foreground));
		border-radius: calc(var(--size) * 0.01);
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.15);
	}

	.second-hand {
		width: calc(var(--size) * 0.008);
		height: calc(var(--size) * 0.46);
		margin-left: calc(var(--size) * -0.004);
		margin-top: calc(var(--size) * -0.36);
		transform-origin: center 78.26%;
	}

	.second-body {
		position: absolute;
		top: 22%;
		left: 50%;
		transform: translateX(-50%);
		width: 100%;
		height: 78%;
		background: hsl(var(--color-primary));
		border-radius: 1px;
	}

	.second-tail {
		position: absolute;
		top: 0;
		left: 50%;
		transform: translateX(-50%);
		width: 180%;
		height: 22%;
		background: hsl(var(--color-primary));
		border-radius: 2px;
	}

	.center-cap {
		position: absolute;
		top: 50%;
		left: 50%;
		width: calc(var(--size) * 0.055);
		height: calc(var(--size) * 0.055);
		margin: calc(var(--size) * -0.0275);
		border-radius: 50%;
		background: hsl(var(--color-foreground));
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.center-inner {
		width: 50%;
		height: 50%;
		border-radius: 50%;
		background: hsl(var(--color-primary));
	}
</style>
