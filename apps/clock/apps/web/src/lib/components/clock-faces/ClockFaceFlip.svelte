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
</script>

<div class="clock-face-flip" style="--size: {size}px;">
	<div class="flip-container">
		<!-- Hours -->
		<div class="flip-group">
			<div class="flip-card">
				<div class="flip-top">
					<span>{h1}</span>
				</div>
				<div class="flip-bottom">
					<span>{h1}</span>
				</div>
				<div class="flip-hinge"></div>
			</div>
			<div class="flip-card">
				<div class="flip-top">
					<span>{h2}</span>
				</div>
				<div class="flip-bottom">
					<span>{h2}</span>
				</div>
				<div class="flip-hinge"></div>
			</div>
		</div>

		<div class="flip-separator">
			<div class="sep-dot"></div>
			<div class="sep-dot"></div>
		</div>

		<!-- Minutes -->
		<div class="flip-group">
			<div class="flip-card">
				<div class="flip-top">
					<span>{m1}</span>
				</div>
				<div class="flip-bottom">
					<span>{m1}</span>
				</div>
				<div class="flip-hinge"></div>
			</div>
			<div class="flip-card">
				<div class="flip-top">
					<span>{m2}</span>
				</div>
				<div class="flip-bottom">
					<span>{m2}</span>
				</div>
				<div class="flip-hinge"></div>
			</div>
		</div>

		<div class="flip-separator flip-separator-small">
			<div class="sep-dot sep-dot-small"></div>
			<div class="sep-dot sep-dot-small"></div>
		</div>

		<!-- Seconds -->
		<div class="flip-group flip-group-small">
			<div class="flip-card flip-card-small">
				<div class="flip-top">
					<span>{s1}</span>
				</div>
				<div class="flip-bottom">
					<span>{s1}</span>
				</div>
				<div class="flip-hinge"></div>
			</div>
			<div class="flip-card flip-card-small">
				<div class="flip-top">
					<span>{s2}</span>
				</div>
				<div class="flip-bottom">
					<span>{s2}</span>
				</div>
				<div class="flip-hinge"></div>
			</div>
		</div>
	</div>
</div>

<style>
	.clock-face-flip {
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.flip-container {
		display: flex;
		align-items: center;
		gap: 6px;
		padding: 12px 16px;
		background: linear-gradient(180deg, #1a1a1a 0%, #0a0a0a 100%);
		border-radius: 8px;
		box-shadow:
			0 8px 24px rgba(0, 0, 0, 0.4),
			inset 0 1px 1px rgba(255, 255, 255, 0.05);
	}

	.flip-group {
		display: flex;
		gap: 3px;
	}

	.flip-card {
		position: relative;
		width: 44px;
		height: 64px;
		perspective: 300px;
	}

	.flip-card-small {
		width: 30px;
		height: 44px;
	}

	.flip-top,
	.flip-bottom {
		position: absolute;
		width: 100%;
		height: 50%;
		overflow: hidden;
		display: flex;
		justify-content: center;
	}

	.flip-top {
		top: 0;
		background: linear-gradient(180deg, #3a3a3a 0%, #2a2a2a 100%);
		border-radius: 6px 6px 0 0;
		align-items: flex-end;
		border-bottom: 1px solid #1a1a1a;
	}

	.flip-top span {
		transform: translateY(50%);
	}

	.flip-bottom {
		bottom: 0;
		background: linear-gradient(180deg, #2a2a2a 0%, #1a1a1a 100%);
		border-radius: 0 0 6px 6px;
		align-items: flex-start;
	}

	.flip-bottom span {
		transform: translateY(-50%);
	}

	.flip-top span,
	.flip-bottom span {
		font-family: 'Oswald', 'Bebas Neue', 'Impact', sans-serif;
		font-size: 48px;
		font-weight: 500;
		color: #f0f0f0;
		line-height: 1;
	}

	.flip-card-small .flip-top span,
	.flip-card-small .flip-bottom span {
		font-size: 32px;
	}

	.flip-hinge {
		position: absolute;
		top: 50%;
		left: 0;
		right: 0;
		height: 2px;
		margin-top: -1px;
		background: linear-gradient(
			90deg,
			transparent 0%,
			rgba(0, 0, 0, 0.8) 10%,
			rgba(0, 0, 0, 0.8) 90%,
			transparent 100%
		);
		z-index: 10;
	}

	.flip-hinge::before {
		content: '';
		position: absolute;
		top: -1px;
		left: 5%;
		right: 5%;
		height: 1px;
		background: rgba(255, 255, 255, 0.1);
	}

	.flip-separator {
		display: flex;
		flex-direction: column;
		gap: 12px;
		padding: 0 4px;
	}

	.flip-separator-small {
		gap: 8px;
		padding: 0 2px;
	}

	.sep-dot {
		width: 6px;
		height: 6px;
		background: #666;
		border-radius: 50%;
		box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.5);
	}

	.sep-dot-small {
		width: 4px;
		height: 4px;
	}

	.flip-group-small {
		align-self: flex-end;
		margin-bottom: 2px;
	}
</style>
