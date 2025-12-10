<script lang="ts">
	import { SkeletonBox } from '@manacore/shared-ui';
</script>

<div class="network-skeleton">
	<!-- Simulated graph nodes -->
	<div class="skeleton-nodes">
		{#each Array(8) as _, i}
			<div
				class="skeleton-node"
				style="
					left: {20 + Math.random() * 60}%;
					top: {20 + Math.random() * 60}%;
					animation-delay: {i * 0.1}s;
				"
			>
				<SkeletonBox width="48px" height="48px" borderRadius="50%" />
			</div>
		{/each}
	</div>

	<!-- Simulated connections -->
	<svg class="skeleton-connections" viewBox="0 0 100 100" preserveAspectRatio="none">
		<line x1="25" y1="30" x2="45" y2="50" class="skeleton-line" />
		<line x1="45" y1="50" x2="70" y2="35" class="skeleton-line" style="animation-delay: 0.2s" />
		<line x1="45" y1="50" x2="55" y2="70" class="skeleton-line" style="animation-delay: 0.4s" />
		<line x1="70" y1="35" x2="80" y2="55" class="skeleton-line" style="animation-delay: 0.6s" />
		<line x1="30" y1="65" x2="55" y2="70" class="skeleton-line" style="animation-delay: 0.8s" />
	</svg>

	<!-- Loading text -->
	<div class="loading-indicator">
		<div class="spinner"></div>
		<span>Netzwerk wird geladen...</span>
	</div>
</div>

<style>
	.network-skeleton {
		position: relative;
		width: 100%;
		height: 100%;
		min-height: 400px;
		background: hsl(var(--background));
		border-radius: 1rem;
		border: 1px solid hsl(var(--border));
		overflow: hidden;
	}

	.skeleton-nodes {
		position: absolute;
		inset: 0;
	}

	.skeleton-node {
		position: absolute;
		transform: translate(-50%, -50%);
		animation: pulse 2s ease-in-out infinite;
	}

	.skeleton-connections {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
	}

	.skeleton-line {
		stroke: hsl(var(--muted-foreground) / 0.2);
		stroke-width: 0.5;
		animation: pulse 2s ease-in-out infinite;
	}

	.loading-indicator {
		position: absolute;
		bottom: 2rem;
		left: 50%;
		transform: translateX(-50%);
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.75rem 1.25rem;
		background: hsl(var(--card));
		border: 1px solid hsl(var(--border));
		border-radius: 9999px;
		font-size: 0.875rem;
		color: hsl(var(--muted-foreground));
		box-shadow: 0 4px 12px hsl(var(--foreground) / 0.05);
	}

	.spinner {
		width: 1rem;
		height: 1rem;
		border: 2px solid hsl(var(--muted));
		border-top-color: hsl(var(--primary));
		border-radius: 50%;
		animation: spin 0.8s linear infinite;
	}

	@keyframes pulse {
		0%,
		100% {
			opacity: 0.4;
		}
		50% {
			opacity: 0.8;
		}
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}
</style>
