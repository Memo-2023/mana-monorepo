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

<div class="clock-face-bauhaus" style="--size: {size}px;">
	<!-- Simple border -->
	<div class="frame"></div>

	<!-- Clean white background -->
	<div class="clock-bg"></div>

	<!-- Geometric hour markers - simple lines -->
	{#each Array(12) as _, i}
		<div
			class="marker"
			class:marker-quarter={i % 3 === 0}
			style="transform: rotate({i * 30}deg)"
		></div>
	{/each}

	<!-- Primary color accents at quarters -->
	<div class="accent accent-12"></div>
	<div class="accent accent-3"></div>
	<div class="accent accent-6"></div>
	<div class="accent accent-9"></div>

	<!-- Clock hands - geometric shapes -->
	<div class="hands-container">
		<!-- Hour hand - rectangle -->
		<div class="hand hour-hand" style="transform: rotate({hourRotation}deg)"></div>

		<!-- Minute hand - longer rectangle -->
		<div class="hand minute-hand" style="transform: rotate({minuteRotation}deg)"></div>

		<!-- Second hand - thin with circle -->
		<div class="hand second-hand" style="transform: rotate({secondRotation}deg)">
			<div class="second-line"></div>
			<div class="second-dot"></div>
		</div>
	</div>

	<!-- Center - simple circle -->
	<div class="center"></div>
</div>

<style>
	.clock-face-bauhaus {
		position: relative;
		width: var(--size);
		height: var(--size);
		border-radius: 50%;
	}

	.frame {
		position: absolute;
		inset: 0;
		border-radius: 50%;
		background: #1a1a1a;
	}

	.clock-bg {
		position: absolute;
		inset: calc(var(--size) * 0.02);
		border-radius: 50%;
		background: #fafafa;
	}

	.marker {
		position: absolute;
		top: 50%;
		left: 50%;
		width: 2px;
		height: calc(var(--size) * 0.06);
		margin-left: -1px;
		margin-top: calc(var(--size) * -0.45);
		background: #1a1a1a;
		transform-origin: center calc(var(--size) * 0.45);
	}

	.marker-quarter {
		width: 4px;
		margin-left: -2px;
		height: calc(var(--size) * 0.1);
		margin-top: calc(var(--size) * -0.45);
	}

	/* Primary color accents - Bauhaus colors */
	.accent {
		position: absolute;
		width: calc(var(--size) * 0.04);
		height: calc(var(--size) * 0.04);
	}

	.accent-12 {
		top: calc(var(--size) * 0.08);
		left: 50%;
		transform: translateX(-50%);
		background: #e63946; /* Red */
	}

	.accent-3 {
		top: 50%;
		right: calc(var(--size) * 0.08);
		transform: translateY(-50%);
		background: #f4a261; /* Yellow/Orange */
		border-radius: 50%;
	}

	.accent-6 {
		bottom: calc(var(--size) * 0.08);
		left: 50%;
		transform: translateX(-50%);
		background: #2a9d8f; /* Teal */
		clip-path: polygon(50% 0%, 100% 100%, 0% 100%);
	}

	.accent-9 {
		top: 50%;
		left: calc(var(--size) * 0.08);
		transform: translateY(-50%);
		background: #264653; /* Dark blue */
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
		width: calc(var(--size) * 0.04);
		height: calc(var(--size) * 0.22);
		margin-left: calc(var(--size) * -0.02);
		margin-top: calc(var(--size) * -0.22);
		background: #1a1a1a;
	}

	.minute-hand {
		width: calc(var(--size) * 0.025);
		height: calc(var(--size) * 0.32);
		margin-left: calc(var(--size) * -0.0125);
		margin-top: calc(var(--size) * -0.32);
		background: #1a1a1a;
	}

	.second-hand {
		width: calc(var(--size) * 0.008);
		height: calc(var(--size) * 0.44);
		margin-left: calc(var(--size) * -0.004);
		margin-top: calc(var(--size) * -0.36);
		transform-origin: center 81.82%;
	}

	.second-line {
		position: absolute;
		top: 18%;
		left: 50%;
		transform: translateX(-50%);
		width: 100%;
		height: 82%;
		background: #e63946;
	}

	.second-dot {
		position: absolute;
		top: 8%;
		left: 50%;
		transform: translateX(-50%);
		width: calc(var(--size) * 0.03);
		height: calc(var(--size) * 0.03);
		background: #e63946;
		border-radius: 50%;
	}

	.center {
		position: absolute;
		top: 50%;
		left: 50%;
		width: calc(var(--size) * 0.045);
		height: calc(var(--size) * 0.045);
		margin: calc(var(--size) * -0.0225);
		border-radius: 50%;
		background: #1a1a1a;
	}
</style>
