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

	// Roman numerals
	const romanNumerals = ['XII', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI'];
</script>

<div class="clock-face-classic" style="--size: {size}px;">
	<!-- Outer bezel -->
	<div class="bezel"></div>

	<!-- Background -->
	<div class="clock-bg">
		<!-- Decorative pattern -->
		<div class="pattern"></div>
	</div>

	<!-- Minute tick marks -->
	{#each Array(60) as _, i}
		{#if i % 5 !== 0}
			<div class="tick tick-minute" style="transform: rotate({i * 6}deg)"></div>
		{/if}
	{/each}

	<!-- Hour tick marks -->
	{#each Array(12) as _, i}
		<div class="tick tick-hour" style="transform: rotate({i * 30}deg)"></div>
	{/each}

	<!-- Roman numerals -->
	{#each romanNumerals as numeral, i}
		<span class="numeral" style="--angle: {i * 30}deg;">
			{numeral}
		</span>
	{/each}

	<!-- Inner decorative ring -->
	<div class="inner-ring"></div>

	<!-- Clock hands -->
	<div class="hands-container">
		<div class="hand hour-hand" style="transform: rotate({hourRotation}deg)">
			<div class="hand-body"></div>
			<div class="hand-tail"></div>
		</div>
		<div class="hand minute-hand" style="transform: rotate({minuteRotation}deg)">
			<div class="hand-body"></div>
			<div class="hand-tail"></div>
		</div>
		<div class="hand second-hand" style="transform: rotate({secondRotation}deg)">
			<div class="hand-body"></div>
			<div class="hand-counterweight"></div>
		</div>
	</div>

	<!-- Center cap -->
	<div class="center-cap">
		<div class="center-inner"></div>
	</div>
</div>

<style>
	.clock-face-classic {
		position: relative;
		width: var(--size);
		height: var(--size);
		border-radius: 50%;
	}

	.bezel {
		position: absolute;
		inset: 0;
		border-radius: 50%;
		background: linear-gradient(
			135deg,
			hsl(var(--color-foreground) / 0.15) 0%,
			hsl(var(--color-foreground) / 0.05) 50%,
			hsl(var(--color-foreground) / 0.2) 100%
		);
		box-shadow:
			0 8px 24px rgba(0, 0, 0, 0.15),
			0 2px 8px rgba(0, 0, 0, 0.1),
			inset 0 1px 2px rgba(255, 255, 255, 0.2);
	}

	.clock-bg {
		position: absolute;
		inset: 6px;
		border-radius: 50%;
		background: linear-gradient(
			180deg,
			hsl(var(--color-surface)) 0%,
			hsl(var(--color-background)) 100%
		);
		box-shadow:
			inset 0 2px 8px rgba(0, 0, 0, 0.08),
			inset 0 -1px 2px rgba(255, 255, 255, 0.5);
		overflow: hidden;
	}

	.pattern {
		position: absolute;
		inset: 0;
		background: radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.1) 0%, transparent 50%);
	}

	.tick {
		position: absolute;
		top: 50%;
		left: 50%;
		transform-origin: center center;
	}

	.tick-minute {
		width: 1px;
		height: calc(var(--size) * 0.03);
		margin-left: -0.5px;
		margin-top: calc(var(--size) * -0.46);
		background: hsl(var(--color-muted-foreground) / 0.4);
	}

	.tick-hour {
		width: 2px;
		height: calc(var(--size) * 0.05);
		margin-left: -1px;
		margin-top: calc(var(--size) * -0.46);
		background: hsl(var(--color-foreground) / 0.6);
		border-radius: 1px;
	}

	.numeral {
		position: absolute;
		top: 50%;
		left: 50%;
		font-family: 'Palatino Linotype', 'Book Antiqua', Palatino, Georgia, serif;
		font-size: calc(var(--size) * 0.065);
		font-weight: 500;
		color: hsl(var(--color-foreground));
		text-shadow: 0 1px 1px rgba(0, 0, 0, 0.1);
		transform: translate(-50%, -50%) rotate(var(--angle)) translateY(calc(var(--size) * -0.36))
			rotate(calc(var(--angle) * -1));
	}

	.inner-ring {
		position: absolute;
		top: 50%;
		left: 50%;
		width: 60%;
		height: 60%;
		transform: translate(-50%, -50%);
		border-radius: 50%;
		border: 1px solid hsl(var(--color-border) / 0.3);
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
		width: calc(var(--size) * 0.03);
		height: calc(var(--size) * 0.28);
		margin-left: calc(var(--size) * -0.015);
		margin-top: calc(var(--size) * -0.28);
	}

	.hour-hand .hand-body {
		position: absolute;
		bottom: 0;
		left: 50%;
		transform: translateX(-50%);
		width: 100%;
		height: 85%;
		background: linear-gradient(
			90deg,
			hsl(var(--color-foreground) / 0.7) 0%,
			hsl(var(--color-foreground)) 50%,
			hsl(var(--color-foreground) / 0.7) 100%
		);
		clip-path: polygon(30% 0%, 70% 0%, 100% 100%, 0% 100%);
	}

	.hour-hand .hand-tail {
		position: absolute;
		top: 85%;
		left: 50%;
		transform: translateX(-50%);
		width: 60%;
		height: 20%;
		background: hsl(var(--color-foreground));
		border-radius: 0 0 2px 2px;
	}

	.minute-hand {
		width: calc(var(--size) * 0.022);
		height: calc(var(--size) * 0.38);
		margin-left: calc(var(--size) * -0.011);
		margin-top: calc(var(--size) * -0.38);
	}

	.minute-hand .hand-body {
		position: absolute;
		bottom: 0;
		left: 50%;
		transform: translateX(-50%);
		width: 100%;
		height: 88%;
		background: linear-gradient(
			90deg,
			hsl(var(--color-foreground) / 0.7) 0%,
			hsl(var(--color-foreground)) 50%,
			hsl(var(--color-foreground) / 0.7) 100%
		);
		clip-path: polygon(25% 0%, 75% 0%, 100% 100%, 0% 100%);
	}

	.minute-hand .hand-tail {
		position: absolute;
		top: 88%;
		left: 50%;
		transform: translateX(-50%);
		width: 70%;
		height: 18%;
		background: hsl(var(--color-foreground));
		border-radius: 0 0 1px 1px;
	}

	.second-hand {
		width: calc(var(--size) * 0.008);
		height: calc(var(--size) * 0.48);
		margin-left: calc(var(--size) * -0.004);
		margin-top: calc(var(--size) * -0.38);
		transform-origin: center 79.17%;
	}

	.second-hand .hand-body {
		position: absolute;
		bottom: 20%;
		left: 50%;
		transform: translateX(-50%);
		width: 100%;
		height: 80%;
		background: hsl(var(--color-primary));
		border-radius: 1px;
	}

	.second-hand .hand-counterweight {
		position: absolute;
		bottom: 0;
		left: 50%;
		transform: translateX(-50%);
		width: 200%;
		height: 20%;
		background: hsl(var(--color-primary));
		border-radius: 2px;
	}

	.center-cap {
		position: absolute;
		top: 50%;
		left: 50%;
		width: calc(var(--size) * 0.06);
		height: calc(var(--size) * 0.06);
		margin: calc(var(--size) * -0.03);
		border-radius: 50%;
		background: linear-gradient(
			135deg,
			hsl(var(--color-foreground)) 0%,
			hsl(var(--color-muted-foreground)) 100%
		);
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.center-inner {
		width: 40%;
		height: 40%;
		border-radius: 50%;
		background: hsl(var(--color-primary));
	}
</style>
