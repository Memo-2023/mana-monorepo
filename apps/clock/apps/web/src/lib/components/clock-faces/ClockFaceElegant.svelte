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

<div class="clock-face-elegant" style="--size: {size}px;">
	<!-- Outer golden bezel -->
	<div class="bezel-outer"></div>
	<div class="bezel-inner"></div>

	<!-- Background with texture -->
	<div class="clock-bg">
		<div class="texture"></div>
		<div class="guilloche"></div>
	</div>

	<!-- Minute markers -->
	{#each Array(60) as _, i}
		<div class="marker" class:marker-5={i % 5 === 0} style="transform: rotate({i * 6}deg)"></div>
	{/each}

	<!-- Hour indices (diamond shaped) -->
	{#each Array(12) as _, i}
		<div class="hour-index" style="--angle: {i * 30}deg;">
			<div class="diamond"></div>
		</div>
	{/each}

	<!-- Decorative rings -->
	<div class="ring ring-outer"></div>
	<div class="ring ring-inner"></div>

	<!-- Brand text -->
	<div class="brand">ELEGANT</div>

	<!-- Clock hands -->
	<div class="hands-container">
		<div class="hand hour-hand" style="transform: rotate({hourRotation}deg)">
			<div class="hand-blade"></div>
		</div>
		<div class="hand minute-hand" style="transform: rotate({minuteRotation}deg)">
			<div class="hand-blade"></div>
		</div>
		<div class="hand second-hand" style="transform: rotate({secondRotation}deg)"></div>
	</div>

	<!-- Center jewel -->
	<div class="center-jewel">
		<div class="jewel-inner"></div>
	</div>
</div>

<style>
	.clock-face-elegant {
		position: relative;
		width: var(--size);
		height: var(--size);
		border-radius: 50%;
	}

	.bezel-outer {
		position: absolute;
		inset: 0;
		border-radius: 50%;
		background: linear-gradient(
			135deg,
			#f5e7a3 0%,
			#d4af37 25%,
			#f5e7a3 50%,
			#d4af37 75%,
			#f5e7a3 100%
		);
		box-shadow:
			0 8px 24px rgba(0, 0, 0, 0.2),
			inset 0 1px 2px rgba(255, 255, 255, 0.5);
	}

	.bezel-inner {
		position: absolute;
		inset: 4px;
		border-radius: 50%;
		background: linear-gradient(180deg, #b8960c 0%, #d4af37 50%, #8b7229 100%);
	}

	.clock-bg {
		position: absolute;
		inset: 8px;
		border-radius: 50%;
		background: linear-gradient(
			180deg,
			hsl(var(--color-surface)) 0%,
			hsl(var(--color-background) / 0.95) 100%
		);
		overflow: hidden;
	}

	.texture {
		position: absolute;
		inset: 0;
		background: radial-gradient(circle at 50% 30%, rgba(255, 255, 255, 0.15) 0%, transparent 60%);
	}

	.guilloche {
		position: absolute;
		inset: 25%;
		border-radius: 50%;
		background: repeating-conic-gradient(
			from 0deg,
			hsl(var(--color-border) / 0.05) 0deg 3deg,
			transparent 3deg 6deg
		);
	}

	.marker {
		position: absolute;
		top: 50%;
		left: 50%;
		width: 1px;
		height: calc(var(--size) * 0.02);
		margin-left: -0.5px;
		margin-top: calc(var(--size) * -0.44);
		background: #d4af37;
		opacity: 0.4;
		transform-origin: center calc(var(--size) * 0.44);
	}

	.marker-5 {
		width: 2px;
		margin-left: -1px;
		height: calc(var(--size) * 0.035);
		margin-top: calc(var(--size) * -0.44);
		opacity: 0.7;
	}

	.hour-index {
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%) rotate(var(--angle)) translateY(calc(var(--size) * -0.36));
	}

	.diamond {
		width: calc(var(--size) * 0.025);
		height: calc(var(--size) * 0.04);
		background: linear-gradient(135deg, #f5e7a3 0%, #d4af37 50%, #8b7229 100%);
		clip-path: polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%);
		box-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
	}

	.ring {
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		border-radius: 50%;
		border: 1px solid #d4af37;
	}

	.ring-outer {
		width: 75%;
		height: 75%;
		opacity: 0.2;
	}

	.ring-inner {
		width: 55%;
		height: 55%;
		opacity: 0.15;
	}

	.brand {
		position: absolute;
		top: 32%;
		left: 50%;
		transform: translateX(-50%);
		font-family: 'Palatino Linotype', 'Book Antiqua', Palatino, Georgia, serif;
		font-size: calc(var(--size) * 0.035);
		font-weight: 400;
		letter-spacing: 0.25em;
		color: #d4af37;
		opacity: 0.6;
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
	}

	.hour-hand .hand-blade {
		width: 100%;
		height: 100%;
		background: linear-gradient(90deg, #8b7229 0%, #d4af37 50%, #8b7229 100%);
		clip-path: polygon(40% 0%, 60% 0%, 100% 100%, 0% 100%);
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
	}

	.minute-hand {
		width: calc(var(--size) * 0.018);
		height: calc(var(--size) * 0.34);
		margin-left: calc(var(--size) * -0.009);
		margin-top: calc(var(--size) * -0.34);
	}

	.minute-hand .hand-blade {
		width: 100%;
		height: 100%;
		background: linear-gradient(90deg, #8b7229 0%, #d4af37 50%, #8b7229 100%);
		clip-path: polygon(35% 0%, 65% 0%, 100% 100%, 0% 100%);
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
	}

	.second-hand {
		width: calc(var(--size) * 0.006);
		height: calc(var(--size) * 0.4);
		margin-left: calc(var(--size) * -0.003);
		margin-top: calc(var(--size) * -0.32);
		transform-origin: center 80%;
		background: #d4af37;
		border-radius: 1px;
	}

	.center-jewel {
		position: absolute;
		top: 50%;
		left: 50%;
		width: calc(var(--size) * 0.06);
		height: calc(var(--size) * 0.06);
		margin: calc(var(--size) * -0.03);
		border-radius: 50%;
		background: linear-gradient(135deg, #f5e7a3 0%, #d4af37 50%, #8b7229 100%);
		box-shadow:
			0 2px 6px rgba(0, 0, 0, 0.3),
			inset 0 1px 2px rgba(255, 255, 255, 0.5);
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.jewel-inner {
		width: 40%;
		height: 40%;
		border-radius: 50%;
		background: radial-gradient(circle, #fff 0%, #f5e7a3 100%);
	}
</style>
