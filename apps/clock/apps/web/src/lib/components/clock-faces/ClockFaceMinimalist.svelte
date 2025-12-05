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
</script>

<div class="clock-face-minimalist" style="--size: {size}px;">
	<!-- Clean background -->
	<div class="clock-bg"></div>

	<!-- Only 12 subtle hour markers as thin lines -->
	{#each Array(12) as _, i}
		<div
			class="marker"
			class:marker-main={i % 3 === 0}
			style="transform: rotate({i * 30}deg)"
		></div>
	{/each}

	<!-- Clock hands -->
	<div class="hands-container">
		<!-- Hour hand - thick, short -->
		<div class="hand hour-hand" style="transform: rotate({hourRotation}deg)"></div>

		<!-- Minute hand - thinner, longer -->
		<div class="hand minute-hand" style="transform: rotate({minuteRotation}deg)"></div>

		<!-- Second hand - very thin, accent color -->
		<div class="hand second-hand" style="transform: rotate({secondRotation}deg)">
			<div class="second-line"></div>
			<div class="second-circle"></div>
		</div>
	</div>

	<!-- Minimal center dot -->
	<div class="center-dot"></div>
</div>

<style>
	.clock-face-minimalist {
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
		box-shadow:
			0 4px 20px rgba(0, 0, 0, 0.08),
			0 1px 4px rgba(0, 0, 0, 0.04);
	}

	.marker {
		position: absolute;
		top: 50%;
		left: 50%;
		width: 1px;
		height: calc(var(--size) * 0.06);
		margin-left: -0.5px;
		margin-top: calc(var(--size) * -0.47);
		background: hsl(var(--color-muted-foreground) / 0.25);
		transform-origin: center calc(var(--size) * 0.47);
	}

	.marker-main {
		width: 2px;
		margin-left: -1px;
		height: calc(var(--size) * 0.08);
		margin-top: calc(var(--size) * -0.47);
		background: hsl(var(--color-foreground) / 0.6);
		border-radius: 1px;
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
		width: calc(var(--size) * 0.025);
		height: calc(var(--size) * 0.24);
		margin-left: calc(var(--size) * -0.0125);
		margin-top: calc(var(--size) * -0.24);
		background: hsl(var(--color-foreground));
		border-radius: calc(var(--size) * 0.0125);
	}

	.minute-hand {
		width: calc(var(--size) * 0.015);
		height: calc(var(--size) * 0.34);
		margin-left: calc(var(--size) * -0.0075);
		margin-top: calc(var(--size) * -0.34);
		background: hsl(var(--color-foreground));
		border-radius: calc(var(--size) * 0.0075);
	}

	.second-hand {
		width: calc(var(--size) * 0.006);
		height: calc(var(--size) * 0.42);
		margin-left: calc(var(--size) * -0.003);
		margin-top: calc(var(--size) * -0.34);
		transform-origin: center 80.95%;
	}

	.second-line {
		position: absolute;
		top: 20%;
		left: 50%;
		transform: translateX(-50%);
		width: 100%;
		height: 80%;
		background: hsl(var(--color-primary));
		border-radius: 1px;
	}

	.second-circle {
		position: absolute;
		top: 10%;
		left: 50%;
		transform: translateX(-50%);
		width: calc(var(--size) * 0.025);
		height: calc(var(--size) * 0.025);
		background: hsl(var(--color-primary));
		border-radius: 50%;
	}

	.center-dot {
		position: absolute;
		top: 50%;
		left: 50%;
		width: calc(var(--size) * 0.035);
		height: calc(var(--size) * 0.035);
		margin: calc(var(--size) * -0.0175);
		border-radius: 50%;
		background: hsl(var(--color-foreground));
	}
</style>
