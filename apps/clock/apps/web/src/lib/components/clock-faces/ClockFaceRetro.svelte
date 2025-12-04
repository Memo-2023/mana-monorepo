<script lang="ts">
	interface Props {
		hours: number;
		minutes: number;
		seconds: number;
		size?: number;
	}

	let { hours, minutes, seconds, size = 280 }: Props = $props();

	// 3x5 pixel font patterns
	const pixelPatterns: Record<string, number[][]> = {
		'0': [
			[1, 1, 1],
			[1, 0, 1],
			[1, 0, 1],
			[1, 0, 1],
			[1, 1, 1],
		],
		'1': [
			[0, 1, 0],
			[1, 1, 0],
			[0, 1, 0],
			[0, 1, 0],
			[1, 1, 1],
		],
		'2': [
			[1, 1, 1],
			[0, 0, 1],
			[1, 1, 1],
			[1, 0, 0],
			[1, 1, 1],
		],
		'3': [
			[1, 1, 1],
			[0, 0, 1],
			[1, 1, 1],
			[0, 0, 1],
			[1, 1, 1],
		],
		'4': [
			[1, 0, 1],
			[1, 0, 1],
			[1, 1, 1],
			[0, 0, 1],
			[0, 0, 1],
		],
		'5': [
			[1, 1, 1],
			[1, 0, 0],
			[1, 1, 1],
			[0, 0, 1],
			[1, 1, 1],
		],
		'6': [
			[1, 1, 1],
			[1, 0, 0],
			[1, 1, 1],
			[1, 0, 1],
			[1, 1, 1],
		],
		'7': [
			[1, 1, 1],
			[0, 0, 1],
			[0, 0, 1],
			[0, 0, 1],
			[0, 0, 1],
		],
		'8': [
			[1, 1, 1],
			[1, 0, 1],
			[1, 1, 1],
			[1, 0, 1],
			[1, 1, 1],
		],
		'9': [
			[1, 1, 1],
			[1, 0, 1],
			[1, 1, 1],
			[0, 0, 1],
			[1, 1, 1],
		],
	};

	const colonPattern = [[0], [1], [0], [1], [0]];

	let h1 = $derived(Math.floor(hours / 10).toString());
	let h2 = $derived((hours % 10).toString());
	let m1 = $derived(Math.floor(minutes / 10).toString());
	let m2 = $derived((minutes % 10).toString());
	let s1 = $derived(Math.floor(seconds / 10).toString());
	let s2 = $derived((seconds % 10).toString());
</script>

<div class="clock-face-retro" style="--size: {size}px;">
	<div class="retro-case">
		<!-- CRT screen effect -->
		<div class="crt-screen">
			<div class="scanlines"></div>
			<div class="crt-glow"></div>

			<div class="pixels-container">
				<!-- Hours -->
				<div class="digit-pixels">
					{#each pixelPatterns[h1] as row}
						<div class="pixel-row">
							{#each row as pixel}
								<div class="pixel" class:on={pixel === 1}></div>
							{/each}
						</div>
					{/each}
				</div>
				<div class="digit-pixels">
					{#each pixelPatterns[h2] as row}
						<div class="pixel-row">
							{#each row as pixel}
								<div class="pixel" class:on={pixel === 1}></div>
							{/each}
						</div>
					{/each}
				</div>

				<!-- Colon -->
				<div class="colon-pixels">
					{#each colonPattern as row}
						<div class="pixel-row">
							{#each row as pixel}
								<div class="pixel pixel-colon" class:on={pixel === 1}></div>
							{/each}
						</div>
					{/each}
				</div>

				<!-- Minutes -->
				<div class="digit-pixels">
					{#each pixelPatterns[m1] as row}
						<div class="pixel-row">
							{#each row as pixel}
								<div class="pixel" class:on={pixel === 1}></div>
							{/each}
						</div>
					{/each}
				</div>
				<div class="digit-pixels">
					{#each pixelPatterns[m2] as row}
						<div class="pixel-row">
							{#each row as pixel}
								<div class="pixel" class:on={pixel === 1}></div>
							{/each}
						</div>
					{/each}
				</div>

				<!-- Small colon -->
				<div class="colon-pixels colon-small">
					{#each colonPattern as row}
						<div class="pixel-row">
							{#each row as pixel}
								<div class="pixel pixel-small" class:on={pixel === 1}></div>
							{/each}
						</div>
					{/each}
				</div>

				<!-- Seconds -->
				<div class="digit-pixels digit-small">
					{#each pixelPatterns[s1] as row}
						<div class="pixel-row">
							{#each row as pixel}
								<div class="pixel pixel-small" class:on={pixel === 1}></div>
							{/each}
						</div>
					{/each}
				</div>
				<div class="digit-pixels digit-small">
					{#each pixelPatterns[s2] as row}
						<div class="pixel-row">
							{#each row as pixel}
								<div class="pixel pixel-small" class:on={pixel === 1}></div>
							{/each}
						</div>
					{/each}
				</div>
			</div>
		</div>
	</div>
</div>

<style>
	.clock-face-retro {
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.retro-case {
		background: linear-gradient(180deg, #4a4a4a 0%, #2a2a2a 50%, #1a1a1a 100%);
		border-radius: 16px;
		padding: 12px;
		box-shadow:
			0 8px 32px rgba(0, 0, 0, 0.4),
			inset 0 2px 4px rgba(255, 255, 255, 0.1);
	}

	.crt-screen {
		position: relative;
		background: #0a0a0a;
		border-radius: 8px;
		padding: 20px 24px;
		box-shadow: inset 0 0 30px rgba(0, 0, 0, 0.5);
		overflow: hidden;
	}

	.scanlines {
		position: absolute;
		inset: 0;
		background: repeating-linear-gradient(
			0deg,
			transparent,
			transparent 2px,
			rgba(0, 0, 0, 0.15) 2px,
			rgba(0, 0, 0, 0.15) 4px
		);
		pointer-events: none;
	}

	.crt-glow {
		position: absolute;
		inset: 0;
		background: radial-gradient(ellipse at center, rgba(0, 255, 0, 0.03) 0%, transparent 70%);
		pointer-events: none;
	}

	.pixels-container {
		display: flex;
		align-items: flex-end;
		gap: 6px;
		position: relative;
		z-index: 1;
	}

	.digit-pixels {
		display: flex;
		flex-direction: column;
		gap: 3px;
	}

	.digit-small {
		transform: scale(0.7);
		transform-origin: bottom left;
	}

	.pixel-row {
		display: flex;
		gap: 3px;
	}

	.pixel {
		width: 8px;
		height: 8px;
		background: #1a2a1a;
		border-radius: 1px;
		transition: all 80ms;
	}

	.pixel.on {
		background: #00ff00;
		box-shadow:
			0 0 4px #00ff00,
			0 0 8px #00ff00,
			0 0 12px rgba(0, 255, 0, 0.4);
	}

	.pixel-small {
		width: 6px;
		height: 6px;
	}

	.pixel-colon {
		width: 4px;
		height: 4px;
	}

	.colon-pixels {
		display: flex;
		flex-direction: column;
		gap: 3px;
		padding: 0 2px;
	}

	.colon-small {
		padding: 0 1px;
	}
</style>
