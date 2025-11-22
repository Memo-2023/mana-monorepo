<script lang="ts">
	/**
	 * SkeletonBox - Basis-Komponente für Skeleton Loader
	 *
	 * Wiederverwendbare Box mit Shimmer-Animation für Loading States.
	 * Theme-aware und vollständig anpassbar.
	 */

	interface Props {
		width?: string;
		height?: string;
		borderRadius?: string;
		className?: string;
	}

	let {
		width = '100%',
		height = '20px',
		borderRadius = '4px',
		className = ''
	}: Props = $props();
</script>

<div
	class="skeleton-box {className}"
	style="width: {width}; height: {height}; border-radius: {borderRadius};"
	role="status"
	aria-label="Loading"
></div>

<style>
	.skeleton-box {
		background: linear-gradient(
			90deg,
			var(--skeleton-base) 0%,
			var(--skeleton-highlight) 50%,
			var(--skeleton-base) 100%
		);
		background-size: 200% 100%;
		animation: skeleton-shimmer 1.5s ease-in-out infinite;
	}

	@keyframes skeleton-shimmer {
		0% {
			background-position: 200% 0;
		}
		100% {
			background-position: -200% 0;
		}
	}

	/* Light Mode - Default */
	:global(:root) {
		--skeleton-base: #e5e7eb;
		--skeleton-highlight: #f3f4f6;
	}

	/* Dark Mode */
	:global(.dark) {
		--skeleton-base: #2a2a2a;
		--skeleton-highlight: #3a3a3a;
	}
</style>
