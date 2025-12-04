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
</script>

<div class="clock-face-neon" style="--size: {size}px;">
	<div class="neon-container">
		<!-- Background glow -->
		<div class="bg-glow"></div>

		<!-- Main time -->
		<div class="time-wrapper">
			<span class="neon-glow">{timeString}</span>
			<span class="neon-blur">{timeString}</span>
			<span class="neon-text">{timeString}</span>
		</div>

		<!-- Seconds (smaller, different color) -->
		<div class="seconds-wrapper">
			<span class="seconds-glow">{secondsString}</span>
			<span class="seconds-blur">{secondsString}</span>
			<span class="seconds-text">{secondsString}</span>
		</div>
	</div>
</div>

<style>
	.clock-face-neon {
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.neon-container {
		position: relative;
		padding: 20px 32px;
		background: linear-gradient(180deg, #0a0a0a 0%, #050510 100%);
		border-radius: 12px;
		box-shadow:
			0 8px 32px rgba(0, 0, 0, 0.5),
			inset 0 1px 1px rgba(255, 255, 255, 0.03);
		display: flex;
		align-items: baseline;
		gap: 12px;
	}

	.bg-glow {
		position: absolute;
		inset: 0;
		background: radial-gradient(ellipse at center, rgba(255, 0, 255, 0.05) 0%, transparent 70%);
		border-radius: 12px;
		pointer-events: none;
	}

	.time-wrapper,
	.seconds-wrapper {
		position: relative;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.neon-glow,
	.neon-blur,
	.neon-text {
		font-family: 'Orbitron', 'Audiowide', 'Rajdhani', sans-serif;
		font-size: 3rem;
		font-weight: 700;
		letter-spacing: 0.05em;
		white-space: nowrap;
	}

	.neon-glow {
		position: absolute;
		color: transparent;
		text-shadow:
			0 0 60px #ff00ff,
			0 0 100px #ff00ff,
			0 0 140px #ff00ff;
		filter: blur(20px);
		opacity: 0.6;
	}

	.neon-blur {
		position: absolute;
		color: #ff00ff;
		text-shadow:
			0 0 10px #ff00ff,
			0 0 20px #ff00ff,
			0 0 40px #ff00ff;
		filter: blur(2px);
	}

	.neon-text {
		position: relative;
		color: #fff;
		text-shadow:
			0 0 5px #fff,
			0 0 10px #ff80ff,
			0 0 20px #ff00ff;
		animation: flicker 4s infinite;
	}

	.seconds-glow,
	.seconds-blur,
	.seconds-text {
		font-family: 'Orbitron', 'Audiowide', 'Rajdhani', sans-serif;
		font-size: 1.5rem;
		font-weight: 500;
		letter-spacing: 0.05em;
	}

	.seconds-glow {
		position: absolute;
		color: transparent;
		text-shadow:
			0 0 40px #00ffff,
			0 0 80px #00ffff;
		filter: blur(15px);
		opacity: 0.5;
	}

	.seconds-blur {
		position: absolute;
		color: #00ffff;
		text-shadow:
			0 0 8px #00ffff,
			0 0 16px #00ffff;
		filter: blur(1px);
	}

	.seconds-text {
		position: relative;
		color: #fff;
		text-shadow:
			0 0 3px #fff,
			0 0 8px #80ffff,
			0 0 15px #00ffff;
		animation: flicker 4s infinite 0.5s;
	}

	@keyframes flicker {
		0%,
		100% {
			opacity: 1;
		}
		92% {
			opacity: 1;
		}
		93% {
			opacity: 0.85;
		}
		94% {
			opacity: 1;
		}
		95% {
			opacity: 0.9;
		}
		96% {
			opacity: 1;
		}
	}

	/* Theme-based color variations */
	:global([data-theme='forest']) .neon-glow {
		text-shadow:
			0 0 60px #00ff66,
			0 0 100px #00ff66,
			0 0 140px #00ff66;
	}
	:global([data-theme='forest']) .neon-blur {
		color: #00ff66;
		text-shadow:
			0 0 10px #00ff66,
			0 0 20px #00ff66,
			0 0 40px #00ff66;
	}
	:global([data-theme='forest']) .neon-text {
		text-shadow:
			0 0 5px #fff,
			0 0 10px #80ff99,
			0 0 20px #00ff66;
	}
	:global([data-theme='forest']) .bg-glow {
		background: radial-gradient(ellipse at center, rgba(0, 255, 102, 0.05) 0%, transparent 70%);
	}

	:global([data-theme='ocean']) .neon-glow {
		text-shadow:
			0 0 60px #0099ff,
			0 0 100px #0099ff,
			0 0 140px #0099ff;
	}
	:global([data-theme='ocean']) .neon-blur {
		color: #0099ff;
		text-shadow:
			0 0 10px #0099ff,
			0 0 20px #0099ff,
			0 0 40px #0099ff;
	}
	:global([data-theme='ocean']) .neon-text {
		text-shadow:
			0 0 5px #fff,
			0 0 10px #80ccff,
			0 0 20px #0099ff;
	}
	:global([data-theme='ocean']) .bg-glow {
		background: radial-gradient(ellipse at center, rgba(0, 153, 255, 0.05) 0%, transparent 70%);
	}
</style>
