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

	// Get current date info
	let now = $derived(new Date());
	let dateString = $derived(
		now.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
	);
</script>

<div class="clock-face-terminal" style="--size: {size}px;">
	<div class="terminal-window">
		<!-- Title bar -->
		<div class="title-bar">
			<div class="title-buttons">
				<span class="btn btn-close"></span>
				<span class="btn btn-minimize"></span>
				<span class="btn btn-maximize"></span>
			</div>
			<span class="title-text">clock@system:~</span>
		</div>

		<!-- Terminal content -->
		<div class="terminal-content">
			<div class="line">
				<span class="prompt">$</span>
				<span class="command">date --format="%T"</span>
			</div>

			<div class="output time-output">
				{timeString}
			</div>

			<div class="line">
				<span class="prompt">$</span>
				<span class="command">date --format="%a %b %d"</span>
			</div>

			<div class="output date-output">
				{dateString}
			</div>

			<div class="line">
				<span class="prompt">$</span>
				<span class="cursor">_</span>
			</div>
		</div>
	</div>
</div>

<style>
	.clock-face-terminal {
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.terminal-window {
		background: #1e1e1e;
		border-radius: 8px;
		overflow: hidden;
		box-shadow:
			0 8px 32px rgba(0, 0, 0, 0.4),
			0 0 0 1px rgba(255, 255, 255, 0.05);
		min-width: 260px;
	}

	.title-bar {
		display: flex;
		align-items: center;
		gap: 12px;
		padding: 8px 12px;
		background: #2d2d2d;
		border-bottom: 1px solid #3a3a3a;
	}

	.title-buttons {
		display: flex;
		gap: 6px;
	}

	.btn {
		width: 12px;
		height: 12px;
		border-radius: 50%;
	}

	.btn-close {
		background: #ff5f56;
	}

	.btn-minimize {
		background: #ffbd2e;
	}

	.btn-maximize {
		background: #27ca40;
	}

	.title-text {
		font-family: 'SF Mono', 'Monaco', 'Cascadia Code', monospace;
		font-size: 0.7rem;
		color: #888;
	}

	.terminal-content {
		padding: 16px;
		font-family: 'SF Mono', 'Monaco', 'Cascadia Code', monospace;
	}

	.line {
		display: flex;
		align-items: center;
		gap: 8px;
		margin-bottom: 4px;
	}

	.prompt {
		color: #27ca40;
		font-weight: 600;
	}

	.command {
		color: #888;
		font-size: 0.85rem;
	}

	.output {
		margin-bottom: 12px;
		padding-left: 16px;
	}

	.time-output {
		font-size: 2rem;
		font-weight: 600;
		color: #00ff88;
		text-shadow: 0 0 10px rgba(0, 255, 136, 0.3);
		letter-spacing: 0.05em;
	}

	.date-output {
		font-size: 0.9rem;
		color: #61afef;
	}

	.cursor {
		color: #27ca40;
		animation: blink 1s step-end infinite;
	}

	@keyframes blink {
		0%,
		100% {
			opacity: 1;
		}
		50% {
			opacity: 0;
		}
	}
</style>
