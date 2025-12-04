<script lang="ts">
	interface Props {
		hours: number;
		minutes: number;
		seconds: number;
		size?: number;
	}

	let { hours, minutes, seconds, size = 280 }: Props = $props();

	// 5x7 dot matrix patterns for digits 0-9
	const patterns: Record<string, number[][]> = {
		'0': [
			[0, 1, 1, 1, 0],
			[1, 0, 0, 0, 1],
			[1, 0, 0, 1, 1],
			[1, 0, 1, 0, 1],
			[1, 1, 0, 0, 1],
			[1, 0, 0, 0, 1],
			[0, 1, 1, 1, 0],
		],
		'1': [
			[0, 0, 1, 0, 0],
			[0, 1, 1, 0, 0],
			[0, 0, 1, 0, 0],
			[0, 0, 1, 0, 0],
			[0, 0, 1, 0, 0],
			[0, 0, 1, 0, 0],
			[0, 1, 1, 1, 0],
		],
		'2': [
			[0, 1, 1, 1, 0],
			[1, 0, 0, 0, 1],
			[0, 0, 0, 0, 1],
			[0, 0, 0, 1, 0],
			[0, 0, 1, 0, 0],
			[0, 1, 0, 0, 0],
			[1, 1, 1, 1, 1],
		],
		'3': [
			[0, 1, 1, 1, 0],
			[1, 0, 0, 0, 1],
			[0, 0, 0, 0, 1],
			[0, 0, 1, 1, 0],
			[0, 0, 0, 0, 1],
			[1, 0, 0, 0, 1],
			[0, 1, 1, 1, 0],
		],
		'4': [
			[0, 0, 0, 1, 0],
			[0, 0, 1, 1, 0],
			[0, 1, 0, 1, 0],
			[1, 0, 0, 1, 0],
			[1, 1, 1, 1, 1],
			[0, 0, 0, 1, 0],
			[0, 0, 0, 1, 0],
		],
		'5': [
			[1, 1, 1, 1, 1],
			[1, 0, 0, 0, 0],
			[1, 1, 1, 1, 0],
			[0, 0, 0, 0, 1],
			[0, 0, 0, 0, 1],
			[1, 0, 0, 0, 1],
			[0, 1, 1, 1, 0],
		],
		'6': [
			[0, 0, 1, 1, 0],
			[0, 1, 0, 0, 0],
			[1, 0, 0, 0, 0],
			[1, 1, 1, 1, 0],
			[1, 0, 0, 0, 1],
			[1, 0, 0, 0, 1],
			[0, 1, 1, 1, 0],
		],
		'7': [
			[1, 1, 1, 1, 1],
			[0, 0, 0, 0, 1],
			[0, 0, 0, 1, 0],
			[0, 0, 1, 0, 0],
			[0, 1, 0, 0, 0],
			[0, 1, 0, 0, 0],
			[0, 1, 0, 0, 0],
		],
		'8': [
			[0, 1, 1, 1, 0],
			[1, 0, 0, 0, 1],
			[1, 0, 0, 0, 1],
			[0, 1, 1, 1, 0],
			[1, 0, 0, 0, 1],
			[1, 0, 0, 0, 1],
			[0, 1, 1, 1, 0],
		],
		'9': [
			[0, 1, 1, 1, 0],
			[1, 0, 0, 0, 1],
			[1, 0, 0, 0, 1],
			[0, 1, 1, 1, 1],
			[0, 0, 0, 0, 1],
			[0, 0, 0, 1, 0],
			[0, 1, 1, 0, 0],
		],
	};

	const colonPattern = [[0], [1], [0], [0], [0], [1], [0]];

	let h1 = $derived(Math.floor(hours / 10).toString());
	let h2 = $derived((hours % 10).toString());
	let m1 = $derived(Math.floor(minutes / 10).toString());
	let m2 = $derived((minutes % 10).toString());
	let s1 = $derived(Math.floor(seconds / 10).toString());
	let s2 = $derived((seconds % 10).toString());
</script>

<div class="clock-face-matrix" style="--size: {size}px;">
	<div class="matrix-display">
		<div class="matrix-screen">
			<div class="screen-overlay"></div>
			<div class="digits-container">
				<!-- Hours -->
				<div class="digit-matrix">
					{#each patterns[h1] as row}
						<div class="dot-row">
							{#each row as dot}
								<div class="dot" class:on={dot === 1}></div>
							{/each}
						</div>
					{/each}
				</div>
				<div class="digit-matrix">
					{#each patterns[h2] as row}
						<div class="dot-row">
							{#each row as dot}
								<div class="dot" class:on={dot === 1}></div>
							{/each}
						</div>
					{/each}
				</div>

				<!-- Colon -->
				<div class="colon-matrix">
					{#each colonPattern as row}
						<div class="dot-row">
							{#each row as dot}
								<div class="dot dot-colon" class:on={dot === 1}></div>
							{/each}
						</div>
					{/each}
				</div>

				<!-- Minutes -->
				<div class="digit-matrix">
					{#each patterns[m1] as row}
						<div class="dot-row">
							{#each row as dot}
								<div class="dot" class:on={dot === 1}></div>
							{/each}
						</div>
					{/each}
				</div>
				<div class="digit-matrix">
					{#each patterns[m2] as row}
						<div class="dot-row">
							{#each row as dot}
								<div class="dot" class:on={dot === 1}></div>
							{/each}
						</div>
					{/each}
				</div>

				<!-- Colon -->
				<div class="colon-matrix">
					{#each colonPattern as row}
						<div class="dot-row">
							{#each row as dot}
								<div class="dot dot-colon" class:on={dot === 1}></div>
							{/each}
						</div>
					{/each}
				</div>

				<!-- Seconds -->
				<div class="digit-matrix digit-small">
					{#each patterns[s1] as row}
						<div class="dot-row">
							{#each row as dot}
								<div class="dot dot-small" class:on={dot === 1}></div>
							{/each}
						</div>
					{/each}
				</div>
				<div class="digit-matrix digit-small">
					{#each patterns[s2] as row}
						<div class="dot-row">
							{#each row as dot}
								<div class="dot dot-small" class:on={dot === 1}></div>
							{/each}
						</div>
					{/each}
				</div>
			</div>
		</div>
	</div>
</div>

<style>
	.clock-face-matrix {
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.matrix-display {
		background: linear-gradient(180deg, #2a2a2a 0%, #1a1a1a 100%);
		border-radius: 10px;
		padding: 6px;
		box-shadow:
			0 8px 24px rgba(0, 0, 0, 0.4),
			inset 0 1px 1px rgba(255, 255, 255, 0.1);
	}

	.matrix-screen {
		position: relative;
		background: #0a0a0a;
		border-radius: 6px;
		padding: 14px 18px;
		box-shadow: inset 0 2px 6px rgba(0, 0, 0, 0.5);
	}

	.screen-overlay {
		position: absolute;
		inset: 0;
		background: linear-gradient(
			180deg,
			rgba(255, 255, 255, 0.03) 0%,
			transparent 50%,
			rgba(0, 0, 0, 0.1) 100%
		);
		border-radius: 6px;
		pointer-events: none;
	}

	.digits-container {
		display: flex;
		gap: 4px;
		align-items: flex-end;
	}

	.digit-matrix {
		display: flex;
		flex-direction: column;
		gap: 2px;
	}

	.digit-small {
		transform: scale(0.7);
		transform-origin: bottom left;
	}

	.dot-row {
		display: flex;
		gap: 2px;
	}

	.dot {
		width: 6px;
		height: 6px;
		border-radius: 50%;
		background: #1a1a1a;
		transition: all 80ms;
	}

	.dot.on {
		background: #ff3333;
		box-shadow:
			0 0 4px #ff3333,
			0 0 8px #ff3333,
			0 0 12px rgba(255, 51, 51, 0.5);
	}

	.dot-small {
		width: 5px;
		height: 5px;
	}

	.dot-colon {
		width: 4px;
		height: 4px;
	}

	.colon-matrix {
		padding: 0 3px;
		display: flex;
		flex-direction: column;
		gap: 2px;
	}
</style>
