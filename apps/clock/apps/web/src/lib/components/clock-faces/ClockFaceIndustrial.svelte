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

<div class="clock-face-industrial" style="--size: {size}px;">
	<!-- Riveted metal frame -->
	<div class="frame">
		{#each Array(12) as _, i}
			<div class="rivet" style="transform: rotate({i * 30}deg)"></div>
		{/each}
	</div>

	<!-- Metal dial -->
	<div class="clock-bg">
		<div class="brushed-texture"></div>
		<div class="inner-ring"></div>
	</div>

	<!-- All tick marks -->
	{#each Array(60) as _, i}
		<div class="marker" class:marker-5={i % 5 === 0} style="transform: rotate({i * 6}deg)"></div>
	{/each}

	<!-- Numbers with industrial font -->
	{#each numbers as num, i}
		<span class="number" style="--angle: {i * 30}deg;">
			{num.toString().padStart(2, '0')}
		</span>
	{/each}

	<!-- Warning stripes decoration -->
	<div class="warning-ring"></div>

	<!-- Clock hands -->
	<div class="hands-container">
		<div class="hand hour-hand" style="transform: rotate({hourRotation}deg)">
			<div class="hand-body"></div>
			<div class="hand-highlight"></div>
		</div>
		<div class="hand minute-hand" style="transform: rotate({minuteRotation}deg)">
			<div class="hand-body"></div>
			<div class="hand-highlight"></div>
		</div>
		<div class="hand second-hand" style="transform: rotate({secondRotation}deg)"></div>
	</div>

	<!-- Center bolt -->
	<div class="center-bolt">
		<div class="bolt-slot"></div>
	</div>
</div>

<style>
	.clock-face-industrial {
		position: relative;
		width: var(--size);
		height: var(--size);
		border-radius: 50%;
	}

	.frame {
		position: absolute;
		inset: 0;
		border-radius: 50%;
		background: linear-gradient(180deg, #5a5a5a 0%, #3d3d3d 50%, #2a2a2a 100%);
		box-shadow:
			0 8px 24px rgba(0, 0, 0, 0.4),
			inset 0 2px 4px rgba(255, 255, 255, 0.1),
			inset 0 -2px 4px rgba(0, 0, 0, 0.3);
	}

	.rivet {
		position: absolute;
		top: 50%;
		left: 50%;
		width: calc(var(--size) * 0.025);
		height: calc(var(--size) * 0.025);
		margin-left: calc(var(--size) * -0.0125);
		margin-top: calc(var(--size) * -0.48);
		background: radial-gradient(circle at 30% 30%, #888 0%, #444 100%);
		border-radius: 50%;
		box-shadow:
			inset 0 1px 2px rgba(255, 255, 255, 0.3),
			0 1px 2px rgba(0, 0, 0, 0.4);
		transform-origin: center calc(var(--size) * 0.48);
	}

	.clock-bg {
		position: absolute;
		inset: calc(var(--size) * 0.045);
		border-radius: 50%;
		background: linear-gradient(180deg, #e8e8e8 0%, #d0d0d0 50%, #b8b8b8 100%);
		box-shadow: inset 0 4px 12px rgba(0, 0, 0, 0.2);
		overflow: hidden;
	}

	.brushed-texture {
		position: absolute;
		inset: 0;
		background: repeating-linear-gradient(
			90deg,
			transparent,
			transparent 1px,
			rgba(255, 255, 255, 0.03) 1px,
			rgba(255, 255, 255, 0.03) 2px
		);
	}

	.inner-ring {
		position: absolute;
		inset: 15%;
		border-radius: 50%;
		border: 3px solid rgba(0, 0, 0, 0.08);
	}

	.marker {
		position: absolute;
		top: 50%;
		left: 50%;
		width: 2px;
		height: calc(var(--size) * 0.03);
		margin-left: -1px;
		margin-top: calc(var(--size) * -0.43);
		background: #333;
		transform-origin: center calc(var(--size) * 0.43);
	}

	.marker-5 {
		width: 4px;
		margin-left: -2px;
		height: calc(var(--size) * 0.05);
		background: #1a1a1a;
		border-radius: 1px;
	}

	.number {
		position: absolute;
		top: 50%;
		left: 50%;
		font-family: 'Share Tech Mono', 'Courier New', monospace;
		font-size: calc(var(--size) * 0.058);
		font-weight: 700;
		color: #1a1a1a;
		transform: translate(-50%, -50%) rotate(var(--angle)) translateY(calc(var(--size) * -0.33))
			rotate(calc(var(--angle) * -1));
	}

	.warning-ring {
		position: absolute;
		top: 50%;
		left: 50%;
		width: 25%;
		height: 25%;
		transform: translate(-50%, -50%);
		border-radius: 50%;
		background: repeating-conic-gradient(from 0deg, #f59e0b 0deg 15deg, #1a1a1a 15deg 30deg);
		opacity: 0.2;
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
	}

	.hour-hand .hand-body {
		width: 100%;
		height: 100%;
		background: linear-gradient(90deg, #2a2a2a 0%, #4a4a4a 50%, #2a2a2a 100%);
		clip-path: polygon(20% 0%, 80% 0%, 65% 100%, 35% 100%);
	}

	.hour-hand .hand-highlight {
		position: absolute;
		top: 10%;
		left: 30%;
		width: 40%;
		height: 80%;
		background: linear-gradient(
			90deg,
			transparent 0%,
			rgba(255, 255, 255, 0.15) 50%,
			transparent 100%
		);
		clip-path: polygon(0% 0%, 100% 0%, 80% 100%, 20% 100%);
	}

	.minute-hand {
		width: calc(var(--size) * 0.03);
		height: calc(var(--size) * 0.32);
		margin-left: calc(var(--size) * -0.015);
		margin-top: calc(var(--size) * -0.32);
	}

	.minute-hand .hand-body {
		width: 100%;
		height: 100%;
		background: linear-gradient(90deg, #2a2a2a 0%, #4a4a4a 50%, #2a2a2a 100%);
		clip-path: polygon(15% 0%, 85% 0%, 60% 100%, 40% 100%);
	}

	.minute-hand .hand-highlight {
		position: absolute;
		top: 8%;
		left: 25%;
		width: 50%;
		height: 85%;
		background: linear-gradient(
			90deg,
			transparent 0%,
			rgba(255, 255, 255, 0.15) 50%,
			transparent 100%
		);
		clip-path: polygon(0% 0%, 100% 0%, 75% 100%, 25% 100%);
	}

	.second-hand {
		width: calc(var(--size) * 0.012);
		height: calc(var(--size) * 0.42);
		margin-left: calc(var(--size) * -0.006);
		margin-top: calc(var(--size) * -0.34);
		background: #f59e0b;
		border-radius: 1px;
		transform-origin: center 80.95%;
		box-shadow: 0 0 8px rgba(245, 158, 11, 0.5);
	}

	.center-bolt {
		position: absolute;
		top: 50%;
		left: 50%;
		width: calc(var(--size) * 0.065);
		height: calc(var(--size) * 0.065);
		margin: calc(var(--size) * -0.0325);
		border-radius: 50%;
		background: linear-gradient(135deg, #666 0%, #333 100%);
		box-shadow:
			0 2px 6px rgba(0, 0, 0, 0.4),
			inset 0 1px 2px rgba(255, 255, 255, 0.2);
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.bolt-slot {
		width: 60%;
		height: 3px;
		background: #1a1a1a;
		border-radius: 1px;
	}
</style>
