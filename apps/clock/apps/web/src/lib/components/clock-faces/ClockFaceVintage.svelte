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

	// Vintage numbers
	const numbers = [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
</script>

<div class="clock-face-vintage" style="--size: {size}px;">
	<!-- Aged outer frame -->
	<div class="outer-frame"></div>

	<!-- Background with aged texture -->
	<div class="clock-bg">
		<div class="age-texture"></div>
		<div class="stains"></div>
	</div>

	<!-- Decorative inner border -->
	<div class="inner-border"></div>

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

	<!-- Vintage numbers -->
	{#each numbers as num, i}
		<span class="number" style="--angle: {i * 30}deg;">
			{num}
		</span>
	{/each}

	<!-- Brand text -->
	<div class="brand">
		<span class="brand-name">VINTAGE</span>
		<span class="brand-sub">EST. 1920</span>
	</div>

	<!-- Clock hands -->
	<div class="hands-container">
		<div class="hand hour-hand" style="transform: rotate({hourRotation}deg)">
			<div class="spade-tip"></div>
			<div class="hand-body"></div>
		</div>
		<div class="hand minute-hand" style="transform: rotate({minuteRotation}deg)">
			<div class="spade-tip"></div>
			<div class="hand-body"></div>
		</div>
		<div class="hand second-hand" style="transform: rotate({secondRotation}deg)"></div>
	</div>

	<!-- Center cap -->
	<div class="center-cap">
		<div class="cap-detail"></div>
	</div>
</div>

<style>
	.clock-face-vintage {
		position: relative;
		width: var(--size);
		height: var(--size);
		border-radius: 50%;
	}

	.outer-frame {
		position: absolute;
		inset: 0;
		border-radius: 50%;
		background: linear-gradient(
			135deg,
			#8b6914 0%,
			#c9a227 25%,
			#a67c00 50%,
			#c9a227 75%,
			#8b6914 100%
		);
		box-shadow:
			0 8px 24px rgba(0, 0, 0, 0.3),
			inset 0 2px 4px rgba(255, 255, 255, 0.3),
			inset 0 -2px 4px rgba(0, 0, 0, 0.2);
	}

	.clock-bg {
		position: absolute;
		inset: calc(var(--size) * 0.035);
		border-radius: 50%;
		background: linear-gradient(180deg, #f5e6c8 0%, #e8d4a8 50%, #d4c090 100%);
		overflow: hidden;
	}

	.age-texture {
		position: absolute;
		inset: 0;
		background:
			radial-gradient(circle at 20% 80%, rgba(139, 90, 43, 0.1) 0%, transparent 30%),
			radial-gradient(circle at 80% 20%, rgba(139, 90, 43, 0.08) 0%, transparent 25%),
			radial-gradient(circle at 50% 50%, transparent 40%, rgba(0, 0, 0, 0.05) 100%);
	}

	.stains {
		position: absolute;
		inset: 0;
		background:
			radial-gradient(ellipse at 30% 70%, rgba(101, 67, 33, 0.08) 0%, transparent 20%),
			radial-gradient(ellipse at 70% 30%, rgba(101, 67, 33, 0.06) 0%, transparent 15%);
	}

	.inner-border {
		position: absolute;
		inset: calc(var(--size) * 0.06);
		border-radius: 50%;
		border: 2px solid rgba(139, 105, 20, 0.3);
	}

	.tick {
		position: absolute;
		top: 50%;
		left: 50%;
		transform-origin: center center;
	}

	.tick-minute {
		width: 1px;
		height: calc(var(--size) * 0.025);
		margin-left: -0.5px;
		margin-top: calc(var(--size) * -0.44);
		background: rgba(101, 67, 33, 0.4);
	}

	.tick-hour {
		width: 2px;
		height: calc(var(--size) * 0.045);
		margin-left: -1px;
		margin-top: calc(var(--size) * -0.44);
		background: #654321;
		border-radius: 1px;
	}

	.number {
		position: absolute;
		top: 50%;
		left: 50%;
		font-family: 'Playfair Display', 'Times New Roman', Georgia, serif;
		font-size: calc(var(--size) * 0.075);
		font-weight: 700;
		color: #3d2914;
		text-shadow: 1px 1px 0 rgba(255, 255, 255, 0.5);
		transform: translate(-50%, -50%) rotate(var(--angle)) translateY(calc(var(--size) * -0.34))
			rotate(calc(var(--angle) * -1));
	}

	.brand {
		position: absolute;
		top: 65%;
		left: 50%;
		transform: translateX(-50%);
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 2px;
	}

	.brand-name {
		font-family: 'Playfair Display', Georgia, serif;
		font-size: calc(var(--size) * 0.038);
		font-weight: 600;
		letter-spacing: 0.2em;
		color: #654321;
		opacity: 0.6;
	}

	.brand-sub {
		font-family: 'Times New Roman', serif;
		font-size: calc(var(--size) * 0.025);
		font-style: italic;
		color: #8b6914;
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
		width: calc(var(--size) * 0.035);
		height: calc(var(--size) * 0.25);
		margin-left: calc(var(--size) * -0.0175);
		margin-top: calc(var(--size) * -0.25);
	}

	.hour-hand .hand-body {
		position: absolute;
		bottom: 0;
		left: 50%;
		transform: translateX(-50%);
		width: 60%;
		height: 85%;
		background: #1a1a1a;
		border-radius: 2px;
	}

	.hour-hand .spade-tip {
		position: absolute;
		top: 0;
		left: 50%;
		transform: translateX(-50%);
		width: 100%;
		height: 25%;
		background: #1a1a1a;
		clip-path: polygon(50% 0%, 100% 100%, 80% 100%, 50% 30%, 20% 100%, 0% 100%);
	}

	.minute-hand {
		width: calc(var(--size) * 0.028);
		height: calc(var(--size) * 0.35);
		margin-left: calc(var(--size) * -0.014);
		margin-top: calc(var(--size) * -0.35);
	}

	.minute-hand .hand-body {
		position: absolute;
		bottom: 0;
		left: 50%;
		transform: translateX(-50%);
		width: 60%;
		height: 88%;
		background: #1a1a1a;
		border-radius: 1px;
	}

	.minute-hand .spade-tip {
		position: absolute;
		top: 0;
		left: 50%;
		transform: translateX(-50%);
		width: 100%;
		height: 20%;
		background: #1a1a1a;
		clip-path: polygon(50% 0%, 100% 100%, 75% 100%, 50% 35%, 25% 100%, 0% 100%);
	}

	.second-hand {
		width: calc(var(--size) * 0.008);
		height: calc(var(--size) * 0.42);
		margin-left: calc(var(--size) * -0.004);
		margin-top: calc(var(--size) * -0.34);
		background: #8b0000;
		border-radius: 1px;
		transform-origin: center 80.95%;
	}

	.center-cap {
		position: absolute;
		top: 50%;
		left: 50%;
		width: calc(var(--size) * 0.055);
		height: calc(var(--size) * 0.055);
		margin: calc(var(--size) * -0.0275);
		border-radius: 50%;
		background: linear-gradient(135deg, #c9a227 0%, #8b6914 100%);
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.cap-detail {
		width: 50%;
		height: 50%;
		border-radius: 50%;
		background: #1a1a1a;
	}
</style>
