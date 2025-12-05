<script lang="ts">
	interface Props {
		hours: number;
		minutes: number;
		seconds: number;
		size?: number;
	}

	let { hours, minutes, seconds, size = 280 }: Props = $props();

	let timeString = $derived(
		`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
	);

	// Radar sweep angle based on seconds
	let sweepAngle = $derived((seconds / 60) * 360);
</script>

<div class="clock-face-radar" style="--size: {size}px;">
	<div class="radar-display">
		<!-- Radar screen -->
		<div class="radar-screen">
			<!-- Grid lines -->
			<div class="grid-horizontal"></div>
			<div class="grid-vertical"></div>
			<div class="grid-circle circle-1"></div>
			<div class="grid-circle circle-2"></div>
			<div class="grid-circle circle-3"></div>

			<!-- Sweep line -->
			<div class="sweep-container" style="transform: rotate({sweepAngle}deg)">
				<div class="sweep-line"></div>
				<div class="sweep-glow"></div>
			</div>

			<!-- Center dot -->
			<div class="center-dot"></div>

			<!-- Time blips -->
			<div class="blip blip-hours" style="--angle: {(hours % 12) * 30}deg;">
				<div class="blip-dot"></div>
			</div>
			<div class="blip blip-minutes" style="--angle: {minutes * 6}deg;">
				<div class="blip-dot"></div>
			</div>
		</div>

		<!-- Digital readout -->
		<div class="digital-readout">
			<span class="readout-label">TIME</span>
			<span class="readout-value">{timeString}</span>
		</div>

		<!-- Status indicators -->
		<div class="status-row">
			<div class="status">
				<span class="status-dot active"></span>
				<span class="status-text">SYNC</span>
			</div>
			<div class="status">
				<span class="status-dot active"></span>
				<span class="status-text">TRAC</span>
			</div>
		</div>
	</div>
</div>

<style>
	.clock-face-radar {
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.radar-display {
		background: linear-gradient(180deg, #0a1a0a 0%, #051505 100%);
		border-radius: 12px;
		padding: 16px;
		box-shadow:
			0 8px 32px rgba(0, 0, 0, 0.5),
			inset 0 1px 1px rgba(0, 255, 0, 0.05);
	}

	.radar-screen {
		position: relative;
		width: 180px;
		height: 180px;
		background: radial-gradient(circle at center, #0a2a0a 0%, #051505 70%, #030a03 100%);
		border-radius: 50%;
		border: 2px solid #0f3f0f;
		overflow: hidden;
		box-shadow: inset 0 0 30px rgba(0, 255, 0, 0.1);
	}

	.grid-horizontal,
	.grid-vertical {
		position: absolute;
		background: rgba(0, 255, 0, 0.1);
	}

	.grid-horizontal {
		top: 50%;
		left: 10%;
		right: 10%;
		height: 1px;
		transform: translateY(-50%);
	}

	.grid-vertical {
		left: 50%;
		top: 10%;
		bottom: 10%;
		width: 1px;
		transform: translateX(-50%);
	}

	.grid-circle {
		position: absolute;
		top: 50%;
		left: 50%;
		border-radius: 50%;
		border: 1px solid rgba(0, 255, 0, 0.1);
	}

	.circle-1 {
		width: 30%;
		height: 30%;
		transform: translate(-50%, -50%);
	}

	.circle-2 {
		width: 60%;
		height: 60%;
		transform: translate(-50%, -50%);
	}

	.circle-3 {
		width: 90%;
		height: 90%;
		transform: translate(-50%, -50%);
	}

	.sweep-container {
		position: absolute;
		top: 50%;
		left: 50%;
		width: 50%;
		height: 2px;
		transform-origin: left center;
		transition: transform 1s linear;
	}

	.sweep-line {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background: linear-gradient(90deg, rgba(0, 255, 0, 0.8) 0%, transparent 100%);
	}

	.sweep-glow {
		position: absolute;
		top: 50%;
		left: 0;
		width: 100%;
		height: 40px;
		transform: translateY(-50%);
		background: linear-gradient(90deg, rgba(0, 255, 0, 0.2) 0%, transparent 100%);
		clip-path: polygon(0% 50%, 100% 0%, 100% 100%);
	}

	.center-dot {
		position: absolute;
		top: 50%;
		left: 50%;
		width: 8px;
		height: 8px;
		transform: translate(-50%, -50%);
		background: #00ff00;
		border-radius: 50%;
		box-shadow: 0 0 8px #00ff00;
	}

	.blip {
		position: absolute;
		top: 50%;
		left: 50%;
		width: 35%;
		height: 2px;
		transform-origin: left center;
		transform: rotate(var(--angle));
	}

	.blip-dot {
		position: absolute;
		right: 0;
		top: 50%;
		transform: translateY(-50%);
		width: 10px;
		height: 10px;
		background: #00ff00;
		border-radius: 50%;
		box-shadow: 0 0 6px #00ff00;
		animation: pulse 2s ease-in-out infinite;
	}

	.blip-hours .blip-dot {
		width: 12px;
		height: 12px;
		background: #00ffaa;
		box-shadow: 0 0 8px #00ffaa;
	}

	@keyframes pulse {
		0%,
		100% {
			opacity: 1;
		}
		50% {
			opacity: 0.5;
		}
	}

	.digital-readout {
		display: flex;
		flex-direction: column;
		align-items: center;
		margin-top: 12px;
		padding: 8px 16px;
		background: rgba(0, 255, 0, 0.05);
		border: 1px solid rgba(0, 255, 0, 0.2);
		border-radius: 4px;
	}

	.readout-label {
		font-family: 'Share Tech Mono', monospace;
		font-size: 0.6rem;
		color: rgba(0, 255, 0, 0.5);
		letter-spacing: 0.2em;
	}

	.readout-value {
		font-family: 'Share Tech Mono', monospace;
		font-size: 1.2rem;
		font-weight: 600;
		color: #00ff00;
		text-shadow: 0 0 8px rgba(0, 255, 0, 0.5);
		letter-spacing: 0.1em;
	}

	.status-row {
		display: flex;
		justify-content: center;
		gap: 16px;
		margin-top: 8px;
	}

	.status {
		display: flex;
		align-items: center;
		gap: 4px;
	}

	.status-dot {
		width: 6px;
		height: 6px;
		background: #333;
		border-radius: 50%;
	}

	.status-dot.active {
		background: #00ff00;
		box-shadow: 0 0 4px #00ff00;
	}

	.status-text {
		font-family: 'Share Tech Mono', monospace;
		font-size: 0.6rem;
		color: rgba(0, 255, 0, 0.6);
		letter-spacing: 0.1em;
	}
</style>
