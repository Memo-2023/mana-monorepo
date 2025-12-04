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

	// Numbers
	const numbers = [12, 3, 6, 9];
	const angles = [0, 90, 180, 270];
</script>

<div class="clock-face-nautical" style="--size: {size}px;">
	<!-- Brass bezel -->
	<div class="bezel">
		<div class="bezel-inner"></div>
	</div>

	<!-- White enamel dial -->
	<div class="clock-bg">
		<div class="dial-texture"></div>
	</div>

	<!-- Compass rose decoration -->
	<div class="compass-rose">
		{#each Array(8) as _, i}
			<div class="compass-point" style="transform: rotate({i * 45}deg)"></div>
		{/each}
	</div>

	<!-- Minute markers -->
	{#each Array(60) as _, i}
		<div
			class="marker"
			class:marker-5={i % 5 === 0 && i % 15 !== 0}
			class:marker-15={i % 15 === 0}
			style="transform: rotate({i * 6}deg)"
		></div>
	{/each}

	<!-- Cardinal numbers -->
	{#each numbers as num, i}
		<span class="number" style="--angle: {angles[i]}deg;">
			{num}
		</span>
	{/each}

	<!-- Ship's wheel decoration -->
	<div class="ships-wheel">
		{#each Array(8) as _, i}
			<div class="spoke" style="transform: rotate({i * 45}deg)"></div>
		{/each}
		<div class="wheel-hub"></div>
	</div>

	<!-- Brand text -->
	<div class="brand">MARINE</div>

	<!-- Clock hands -->
	<div class="hands-container">
		<div class="hand hour-hand" style="transform: rotate({hourRotation}deg)"></div>
		<div class="hand minute-hand" style="transform: rotate({minuteRotation}deg)"></div>
		<div class="hand second-hand" style="transform: rotate({secondRotation}deg)"></div>
	</div>

	<!-- Center cap -->
	<div class="center-cap"></div>
</div>

<style>
	.clock-face-nautical {
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
			#d4a84b 0%,
			#b8860b 20%,
			#cd9b1d 40%,
			#b8860b 60%,
			#d4a84b 80%,
			#b8860b 100%
		);
		box-shadow:
			0 8px 24px rgba(0, 0, 0, 0.3),
			inset 0 2px 4px rgba(255, 255, 255, 0.4);
	}

	.bezel-inner {
		position: absolute;
		inset: 4px;
		border-radius: 50%;
		background: linear-gradient(180deg, #cd9b1d 0%, #b8860b 50%, #8b6914 100%);
	}

	.clock-bg {
		position: absolute;
		inset: calc(var(--size) * 0.04);
		border-radius: 50%;
		background: #f8f8f0;
		box-shadow: inset 0 2px 8px rgba(0, 0, 0, 0.1);
		overflow: hidden;
	}

	.dial-texture {
		position: absolute;
		inset: 0;
		background: radial-gradient(circle at 50% 50%, transparent 60%, rgba(184, 134, 11, 0.03) 100%);
	}

	.compass-rose {
		position: absolute;
		top: 50%;
		left: 50%;
		width: 70%;
		height: 70%;
		transform: translate(-50%, -50%);
	}

	.compass-point {
		position: absolute;
		top: 50%;
		left: 50%;
		width: 1px;
		height: 35%;
		margin-left: -0.5px;
		margin-top: -35%;
		background: rgba(184, 134, 11, 0.08);
		transform-origin: center bottom;
	}

	.marker {
		position: absolute;
		top: 50%;
		left: 50%;
		width: 1px;
		height: calc(var(--size) * 0.02);
		margin-left: -0.5px;
		margin-top: calc(var(--size) * -0.44);
		background: #1a365d;
		opacity: 0.4;
		transform-origin: center calc(var(--size) * 0.44);
	}

	.marker-5 {
		width: 2px;
		margin-left: -1px;
		height: calc(var(--size) * 0.035);
		opacity: 0.6;
	}

	.marker-15 {
		width: 3px;
		margin-left: -1.5px;
		height: calc(var(--size) * 0.05);
		opacity: 0.8;
		background: #1a365d;
	}

	.number {
		position: absolute;
		top: 50%;
		left: 50%;
		font-family: 'Cinzel', 'Times New Roman', serif;
		font-size: calc(var(--size) * 0.085);
		font-weight: 700;
		color: #1a365d;
		transform: translate(-50%, -50%) rotate(var(--angle)) translateY(calc(var(--size) * -0.32))
			rotate(calc(var(--angle) * -1));
	}

	.ships-wheel {
		position: absolute;
		top: 62%;
		left: 50%;
		width: calc(var(--size) * 0.14);
		height: calc(var(--size) * 0.14);
		transform: translateX(-50%);
	}

	.spoke {
		position: absolute;
		top: 50%;
		left: 50%;
		width: 2px;
		height: 50%;
		margin-left: -1px;
		margin-top: -50%;
		background: #b8860b;
		opacity: 0.4;
		transform-origin: center bottom;
	}

	.wheel-hub {
		position: absolute;
		top: 50%;
		left: 50%;
		width: 30%;
		height: 30%;
		transform: translate(-50%, -50%);
		border-radius: 50%;
		border: 2px solid rgba(184, 134, 11, 0.4);
	}

	.brand {
		position: absolute;
		top: 28%;
		left: 50%;
		transform: translateX(-50%);
		font-family: 'Cinzel', 'Times New Roman', serif;
		font-size: calc(var(--size) * 0.035);
		font-weight: 600;
		letter-spacing: 0.25em;
		color: #1a365d;
		opacity: 0.5;
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
		width: calc(var(--size) * 0.032);
		height: calc(var(--size) * 0.24);
		margin-left: calc(var(--size) * -0.016);
		margin-top: calc(var(--size) * -0.24);
		background: #1a365d;
		clip-path: polygon(30% 0%, 70% 0%, 55% 100%, 45% 100%);
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
	}

	.minute-hand {
		width: calc(var(--size) * 0.024);
		height: calc(var(--size) * 0.34);
		margin-left: calc(var(--size) * -0.012);
		margin-top: calc(var(--size) * -0.34);
		background: #1a365d;
		clip-path: polygon(25% 0%, 75% 0%, 55% 100%, 45% 100%);
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
	}

	.second-hand {
		width: calc(var(--size) * 0.008);
		height: calc(var(--size) * 0.4);
		margin-left: calc(var(--size) * -0.004);
		margin-top: calc(var(--size) * -0.32);
		background: #b8860b;
		border-radius: 1px;
		transform-origin: center 80%;
	}

	.center-cap {
		position: absolute;
		top: 50%;
		left: 50%;
		width: calc(var(--size) * 0.05);
		height: calc(var(--size) * 0.05);
		margin: calc(var(--size) * -0.025);
		border-radius: 50%;
		background: linear-gradient(135deg, #d4a84b 0%, #b8860b 100%);
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
	}
</style>
