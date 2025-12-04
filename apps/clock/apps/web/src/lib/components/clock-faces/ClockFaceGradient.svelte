<script lang="ts">
	interface Props {
		hours: number;
		minutes: number;
		seconds: number;
		size?: number;
	}

	let { hours, minutes, seconds, size = 280 }: Props = $props();

	let timeString = $derived(
		`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
	);
	let secondsString = $derived(seconds.toString().padStart(2, '0'));

	// Calculate progress through the day for gradient animation
	let dayProgress = $derived((hours * 3600 + minutes * 60 + seconds) / 86400);
	let hue = $derived(Math.round(dayProgress * 360));
</script>

<div class="clock-face-gradient" style="--size: {size}px; --hue: {hue};">
	<div class="gradient-container">
		<!-- Animated background -->
		<div class="bg-gradient"></div>
		<div class="bg-overlay"></div>

		<!-- Glass effect -->
		<div class="glass-effect"></div>

		<!-- Time display -->
		<div class="time-wrapper">
			<span class="time-shadow">{timeString}</span>
			<span class="time-text">{timeString}</span>
		</div>

		<!-- Seconds with different style -->
		<div class="seconds-wrapper">
			<span class="seconds-text">{secondsString}</span>
		</div>

		<!-- Progress bar for seconds -->
		<div class="progress-bar">
			<div class="progress-fill" style="width: {(seconds / 60) * 100}%"></div>
		</div>
	</div>
</div>

<style>
	.clock-face-gradient {
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.gradient-container {
		position: relative;
		padding: 24px 36px;
		border-radius: 20px;
		overflow: hidden;
		box-shadow:
			0 8px 32px rgba(0, 0, 0, 0.3),
			0 0 0 1px rgba(255, 255, 255, 0.1);
	}

	.bg-gradient {
		position: absolute;
		inset: 0;
		background: linear-gradient(
			135deg,
			hsl(var(--hue), 70%, 45%) 0%,
			hsl(calc(var(--hue) + 60), 70%, 35%) 50%,
			hsl(calc(var(--hue) + 120), 70%, 25%) 100%
		);
		transition: background 1s ease;
	}

	.bg-overlay {
		position: absolute;
		inset: 0;
		background:
			radial-gradient(ellipse at 30% 20%, rgba(255, 255, 255, 0.15) 0%, transparent 50%),
			radial-gradient(ellipse at 70% 80%, rgba(0, 0, 0, 0.2) 0%, transparent 50%);
	}

	.glass-effect {
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		height: 50%;
		background: linear-gradient(
			180deg,
			rgba(255, 255, 255, 0.15) 0%,
			rgba(255, 255, 255, 0.05) 50%,
			transparent 100%
		);
		border-radius: 20px 20px 0 0;
	}

	.time-wrapper {
		position: relative;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.time-shadow {
		position: absolute;
		font-family:
			'SF Pro Display',
			-apple-system,
			BlinkMacSystemFont,
			sans-serif;
		font-size: 3.5rem;
		font-weight: 200;
		letter-spacing: 0.05em;
		color: rgba(0, 0, 0, 0.3);
		transform: translate(2px, 2px);
		white-space: nowrap;
	}

	.time-text {
		position: relative;
		font-family:
			'SF Pro Display',
			-apple-system,
			BlinkMacSystemFont,
			sans-serif;
		font-size: 3.5rem;
		font-weight: 200;
		letter-spacing: 0.05em;
		color: #ffffff;
		text-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
		white-space: nowrap;
	}

	.seconds-wrapper {
		position: relative;
		text-align: center;
		margin-top: 4px;
	}

	.seconds-text {
		font-family:
			'SF Pro Display',
			-apple-system,
			BlinkMacSystemFont,
			sans-serif;
		font-size: 1.25rem;
		font-weight: 300;
		color: rgba(255, 255, 255, 0.7);
		letter-spacing: 0.2em;
	}

	.progress-bar {
		position: relative;
		margin-top: 16px;
		height: 3px;
		background: rgba(255, 255, 255, 0.2);
		border-radius: 2px;
		overflow: hidden;
	}

	.progress-fill {
		height: 100%;
		background: rgba(255, 255, 255, 0.8);
		border-radius: 2px;
		transition: width 0.3s linear;
	}
</style>
