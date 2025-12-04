<script lang="ts">
	interface Props {
		hours: number;
		minutes: number;
		seconds: number;
		size?: number;
	}

	let { hours, minutes, seconds, size = 280 }: Props = $props();

	let h1 = $derived(Math.floor(hours / 10));
	let h2 = $derived(hours % 10);
	let m1 = $derived(Math.floor(minutes / 10));
	let m2 = $derived(minutes % 10);
	let s1 = $derived(Math.floor(seconds / 10));
	let s2 = $derived(seconds % 10);

	const digits = $derived([h1, h2, -1, m1, m2, -1, s1, s2]);
</script>

<div class="clock-face-typewriter" style="--size: {size}px;">
	<div class="typewriter-case">
		<!-- Paper roll effect -->
		<div class="paper-top"></div>

		<!-- Main display area -->
		<div class="paper">
			<div class="paper-texture"></div>

			<div class="digits-row">
				{#each digits as digit, i}
					{#if digit === -1}
						<div class="separator">:</div>
					{:else}
						<div class="key-container">
							<div class="key" class:key-small={i >= 5}>
								<span class="key-text">{digit}</span>
							</div>
							<div class="key-shadow"></div>
						</div>
					{/if}
				{/each}
			</div>
		</div>

		<!-- Typewriter bar -->
		<div class="type-bar">
			<div class="bar-detail"></div>
		</div>
	</div>
</div>

<style>
	.clock-face-typewriter {
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.typewriter-case {
		position: relative;
		background: linear-gradient(180deg, #3d3d3d 0%, #2a2a2a 50%, #1a1a1a 100%);
		border-radius: 12px;
		padding: 16px;
		box-shadow:
			0 8px 32px rgba(0, 0, 0, 0.4),
			inset 0 1px 2px rgba(255, 255, 255, 0.1);
	}

	.paper-top {
		position: absolute;
		top: 0;
		left: 20px;
		right: 20px;
		height: 8px;
		background: #f5f0e6;
		border-radius: 0 0 4px 4px;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
	}

	.paper {
		position: relative;
		background: #f5f0e6;
		border-radius: 4px;
		padding: 20px 16px;
		margin-top: 8px;
		box-shadow: inset 0 2px 8px rgba(0, 0, 0, 0.1);
	}

	.paper-texture {
		position: absolute;
		inset: 0;
		background: repeating-linear-gradient(
			0deg,
			transparent,
			transparent 24px,
			rgba(0, 0, 0, 0.02) 24px,
			rgba(0, 0, 0, 0.02) 25px
		);
		border-radius: 4px;
		pointer-events: none;
	}

	.digits-row {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 6px;
		position: relative;
	}

	.key-container {
		position: relative;
	}

	.key {
		position: relative;
		width: 36px;
		height: 44px;
		background: linear-gradient(180deg, #4a4a4a 0%, #2d2d2d 100%);
		border-radius: 6px;
		display: flex;
		align-items: center;
		justify-content: center;
		box-shadow:
			0 4px 8px rgba(0, 0, 0, 0.3),
			inset 0 1px 2px rgba(255, 255, 255, 0.2),
			inset 0 -1px 2px rgba(0, 0, 0, 0.3);
		transform: translateY(-2px);
		transition: transform 100ms;
	}

	.key-small {
		width: 28px;
		height: 34px;
	}

	.key-text {
		font-family: 'American Typewriter', 'Courier New', monospace;
		font-size: 1.5rem;
		font-weight: 700;
		color: #f5f0e6;
		text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
	}

	.key-small .key-text {
		font-size: 1.1rem;
	}

	.key-shadow {
		position: absolute;
		bottom: -4px;
		left: 2px;
		right: 2px;
		height: 6px;
		background: #1a1a1a;
		border-radius: 0 0 4px 4px;
		z-index: -1;
	}

	.separator {
		font-family: 'American Typewriter', 'Courier New', monospace;
		font-size: 1.5rem;
		font-weight: 700;
		color: #2d2d2d;
		padding: 0 2px;
	}

	.type-bar {
		height: 6px;
		background: linear-gradient(90deg, #666 0%, #888 50%, #666 100%);
		border-radius: 3px;
		margin-top: 12px;
		box-shadow:
			inset 0 1px 2px rgba(255, 255, 255, 0.3),
			0 2px 4px rgba(0, 0, 0, 0.3);
	}

	.bar-detail {
		height: 100%;
		background: repeating-linear-gradient(
			90deg,
			transparent,
			transparent 4px,
			rgba(0, 0, 0, 0.1) 4px,
			rgba(0, 0, 0, 0.1) 5px
		);
		border-radius: 3px;
	}
</style>
