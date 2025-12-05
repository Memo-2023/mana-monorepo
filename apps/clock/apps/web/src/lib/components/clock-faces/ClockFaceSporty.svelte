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

	// Main numbers
	const mainNumbers = [
		{ num: 12, angle: 0 },
		{ num: 3, angle: 90 },
		{ num: 6, angle: 180 },
		{ num: 9, angle: 270 },
	];
</script>

<div class="clock-face-sporty" style="--size: {size}px;">
	<!-- Textured bezel -->
	<div class="bezel">
		{#each Array(120) as _, i}
			<div class="bezel-notch" style="transform: rotate({i * 3}deg)"></div>
		{/each}
	</div>

	<!-- Dark background -->
	<div class="clock-bg">
		<div class="inner-bevel"></div>
	</div>

	<!-- Minute markers -->
	{#each Array(60) as _, i}
		<div
			class="marker"
			class:marker-5={i % 5 === 0}
			class:marker-15={i % 15 === 0}
			style="transform: rotate({i * 6}deg)"
		></div>
	{/each}

	<!-- Main numbers -->
	{#each mainNumbers as { num, angle }}
		<span class="number" style="--angle: {angle}deg;">
			{num}
		</span>
	{/each}

	<!-- Subdial decorations -->
	<div class="subdial subdial-top">
		<span class="subdial-text">CHRONO</span>
	</div>
	<div class="subdial subdial-bottom">
		<div class="subdial-ring"></div>
	</div>

	<!-- Clock hands -->
	<div class="hands-container">
		<div class="hand hour-hand" style="transform: rotate({hourRotation}deg)">
			<div class="hand-arrow"></div>
		</div>
		<div class="hand minute-hand" style="transform: rotate({minuteRotation}deg)">
			<div class="hand-arrow"></div>
		</div>
		<div class="hand second-hand" style="transform: rotate({secondRotation}deg)">
			<div class="second-needle"></div>
			<div class="second-counter"></div>
			<div class="second-circle"></div>
		</div>
	</div>

	<!-- Center hub -->
	<div class="center-hub">
		<div class="hub-inner"></div>
	</div>
</div>

<style>
	.clock-face-sporty {
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
			180deg,
			hsl(var(--color-foreground)) 0%,
			hsl(var(--color-muted-foreground)) 100%
		);
		box-shadow:
			0 8px 24px rgba(0, 0, 0, 0.3),
			inset 0 1px 2px rgba(255, 255, 255, 0.2);
	}

	.bezel-notch {
		position: absolute;
		top: 50%;
		left: 50%;
		width: 2px;
		height: calc(var(--size) * 0.02);
		margin-left: -1px;
		margin-top: calc(var(--size) * -0.5);
		background: hsl(var(--color-background) / 0.3);
		transform-origin: center calc(var(--size) * 0.5);
	}

	.clock-bg {
		position: absolute;
		inset: calc(var(--size) * 0.04);
		border-radius: 50%;
		background: hsl(var(--color-background));
		box-shadow: inset 0 4px 12px rgba(0, 0, 0, 0.2);
	}

	.inner-bevel {
		position: absolute;
		inset: 0;
		border-radius: 50%;
		border: 2px solid hsl(var(--color-border) / 0.3);
	}

	.marker {
		position: absolute;
		top: 50%;
		left: 50%;
		width: 2px;
		height: calc(var(--size) * 0.03);
		margin-left: -1px;
		margin-top: calc(var(--size) * -0.42);
		background: hsl(var(--color-muted-foreground) / 0.5);
		transform-origin: center calc(var(--size) * 0.42);
	}

	.marker-5 {
		width: 3px;
		margin-left: -1.5px;
		height: calc(var(--size) * 0.05);
		background: hsl(var(--color-foreground));
	}

	.marker-15 {
		width: 4px;
		margin-left: -2px;
		height: calc(var(--size) * 0.06);
		background: hsl(var(--color-foreground));
		border-radius: 1px;
	}

	.number {
		position: absolute;
		top: 50%;
		left: 50%;
		font-family: 'Impact', 'Arial Black', 'Helvetica Neue', sans-serif;
		font-size: calc(var(--size) * 0.095);
		font-weight: 900;
		color: hsl(var(--color-foreground));
		letter-spacing: -0.02em;
		transform: translate(-50%, -50%) rotate(var(--angle)) translateY(calc(var(--size) * -0.32))
			rotate(calc(var(--angle) * -1));
	}

	.subdial {
		position: absolute;
		left: 50%;
		transform: translateX(-50%);
	}

	.subdial-top {
		top: 26%;
	}

	.subdial-text {
		font-family: 'Arial Narrow', Arial, sans-serif;
		font-size: calc(var(--size) * 0.03);
		font-weight: 700;
		letter-spacing: 0.15em;
		color: hsl(var(--color-muted-foreground));
		text-transform: uppercase;
	}

	.subdial-bottom {
		top: 62%;
	}

	.subdial-ring {
		width: calc(var(--size) * 0.15);
		height: calc(var(--size) * 0.15);
		border-radius: 50%;
		border: 2px solid hsl(var(--color-border) / 0.4);
		background: hsl(var(--color-background) / 0.5);
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

	.hour-hand .hand-arrow {
		width: 100%;
		height: 100%;
		background: hsl(var(--color-foreground));
		clip-path: polygon(15% 0%, 85% 0%, 100% 20%, 60% 100%, 40% 100%, 0% 20%);
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
	}

	.minute-hand {
		width: calc(var(--size) * 0.03);
		height: calc(var(--size) * 0.32);
		margin-left: calc(var(--size) * -0.015);
		margin-top: calc(var(--size) * -0.32);
	}

	.minute-hand .hand-arrow {
		width: 100%;
		height: 100%;
		background: hsl(var(--color-foreground));
		clip-path: polygon(20% 0%, 80% 0%, 100% 15%, 55% 100%, 45% 100%, 0% 15%);
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
	}

	.second-hand {
		width: calc(var(--size) * 0.012);
		height: calc(var(--size) * 0.48);
		margin-left: calc(var(--size) * -0.006);
		margin-top: calc(var(--size) * -0.36);
		transform-origin: center 75%;
	}

	.second-needle {
		position: absolute;
		top: 25%;
		left: 50%;
		transform: translateX(-50%);
		width: 100%;
		height: 75%;
		background: hsl(var(--color-error));
		border-radius: 1px;
	}

	.second-counter {
		position: absolute;
		top: 0;
		left: 50%;
		transform: translateX(-50%);
		width: calc(var(--size) * 0.025);
		height: 25%;
		background: hsl(var(--color-error));
		border-radius: 3px;
	}

	.second-circle {
		position: absolute;
		top: 20%;
		left: 50%;
		transform: translateX(-50%);
		width: calc(var(--size) * 0.03);
		height: calc(var(--size) * 0.03);
		background: hsl(var(--color-error));
		border-radius: 50%;
	}

	.center-hub {
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
		box-shadow: 0 2px 6px rgba(0, 0, 0, 0.4);
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.hub-inner {
		width: 50%;
		height: 50%;
		border-radius: 50%;
		background: hsl(var(--color-error));
		box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.3);
	}
</style>
