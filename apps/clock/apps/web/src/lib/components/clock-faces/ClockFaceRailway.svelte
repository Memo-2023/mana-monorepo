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

	const numbers = [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
</script>

<div class="clock-face-railway" style="--size: {size}px;">
	<!-- Black bezel -->
	<div class="bezel"></div>

	<!-- White dial -->
	<div class="clock-bg"></div>

	<!-- Minute markers -->
	{#each Array(60) as _, i}
		{#if i % 5 !== 0}
			<div class="tick tick-minute" style="transform: rotate({i * 6}deg)"></div>
		{/if}
	{/each}

	<!-- Hour markers - bold rectangles -->
	{#each Array(12) as _, i}
		<div class="tick tick-hour" style="transform: rotate({i * 30}deg)"></div>
	{/each}

	<!-- Numbers -->
	{#each numbers as num, i}
		<span class="number" style="--angle: {i * 30}deg;">
			{num}
		</span>
	{/each}

	<!-- SBB/CFF brand mark -->
	<div class="brand">SBB CFF FFS</div>

	<!-- Clock hands -->
	<div class="hands-container">
		<!-- Hour hand - rounded rectangle -->
		<div class="hand hour-hand" style="transform: rotate({hourRotation}deg)"></div>

		<!-- Minute hand - longer rounded rectangle -->
		<div class="hand minute-hand" style="transform: rotate({minuteRotation}deg)"></div>

		<!-- Second hand - distinctive red circle (Mondaine style) -->
		<div class="hand second-hand" style="transform: rotate({secondRotation}deg)">
			<div class="second-shaft"></div>
			<div class="second-lollipop"></div>
		</div>
	</div>

	<!-- Center cap -->
	<div class="center-cap"></div>
</div>

<style>
	.clock-face-railway {
		position: relative;
		width: var(--size);
		height: var(--size);
		border-radius: 50%;
	}

	.bezel {
		position: absolute;
		inset: 0;
		border-radius: 50%;
		background: #1a1a1a;
		box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
	}

	.clock-bg {
		position: absolute;
		inset: calc(var(--size) * 0.03);
		border-radius: 50%;
		background: #ffffff;
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
		margin-top: calc(var(--size) * -0.44);
		background: #1a1a1a;
	}

	.tick-hour {
		width: calc(var(--size) * 0.025);
		height: calc(var(--size) * 0.065);
		margin-left: calc(var(--size) * -0.0125);
		margin-top: calc(var(--size) * -0.44);
		background: #1a1a1a;
		border-radius: 2px;
	}

	.number {
		position: absolute;
		top: 50%;
		left: 50%;
		font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
		font-size: calc(var(--size) * 0.075);
		font-weight: 700;
		color: #1a1a1a;
		transform: translate(-50%, -50%) rotate(var(--angle)) translateY(calc(var(--size) * -0.32))
			rotate(calc(var(--angle) * -1));
	}

	.brand {
		position: absolute;
		top: 68%;
		left: 50%;
		transform: translateX(-50%);
		font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
		font-size: calc(var(--size) * 0.025);
		font-weight: 500;
		letter-spacing: 0.1em;
		color: #666;
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
		width: calc(var(--size) * 0.045);
		height: calc(var(--size) * 0.23);
		margin-left: calc(var(--size) * -0.0225);
		margin-top: calc(var(--size) * -0.23);
		background: #1a1a1a;
		border-radius: calc(var(--size) * 0.0225);
	}

	.minute-hand {
		width: calc(var(--size) * 0.035);
		height: calc(var(--size) * 0.33);
		margin-left: calc(var(--size) * -0.0175);
		margin-top: calc(var(--size) * -0.33);
		background: #1a1a1a;
		border-radius: calc(var(--size) * 0.0175);
	}

	.second-hand {
		width: calc(var(--size) * 0.012);
		height: calc(var(--size) * 0.42);
		margin-left: calc(var(--size) * -0.006);
		margin-top: calc(var(--size) * -0.36);
		transform-origin: center 85.71%;
	}

	.second-shaft {
		position: absolute;
		bottom: 0;
		left: 50%;
		transform: translateX(-50%);
		width: calc(var(--size) * 0.008);
		height: 85%;
		background: #dc2626;
	}

	.second-lollipop {
		position: absolute;
		top: 0;
		left: 50%;
		transform: translateX(-50%);
		width: calc(var(--size) * 0.055);
		height: calc(var(--size) * 0.055);
		background: #dc2626;
		border-radius: 50%;
	}

	.center-cap {
		position: absolute;
		top: 50%;
		left: 50%;
		width: calc(var(--size) * 0.04);
		height: calc(var(--size) * 0.04);
		margin: calc(var(--size) * -0.02);
		border-radius: 50%;
		background: #1a1a1a;
	}
</style>
