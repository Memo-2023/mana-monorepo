<script lang="ts">
	/**
	 * SkeletonBox - Base component for skeleton loading states
	 *
	 * Reusable box with shimmer animation for loading states.
	 * Theme-aware (light/dark mode) and fully customizable.
	 *
	 * @example
	 * ```svelte
	 * <SkeletonBox width="200px" height="24px" />
	 * <SkeletonBox width="100%" height="100px" borderRadius="12px" />
	 * ```
	 */

	interface Props {
		/** Width of the skeleton (CSS value) */
		width?: string;
		/** Height of the skeleton (CSS value) */
		height?: string;
		/** Border radius (CSS value) */
		borderRadius?: string;
		/** Make it circular (overrides borderRadius) */
		circle?: boolean;
		/** Additional CSS classes */
		class?: string;
	}

	let {
		width = '100%',
		height = '20px',
		borderRadius = '4px',
		circle = false,
		class: className = '',
	}: Props = $props();

	const computedRadius = $derived(circle ? '50%' : borderRadius);
	const computedHeight = $derived(circle ? width : height);
</script>

<div
	class="skeleton-box {className}"
	style="width: {width}; height: {computedHeight}; border-radius: {computedRadius};"
	role="status"
	aria-label="Loading"
></div>

<style>
	.skeleton-box {
		background: linear-gradient(
			90deg,
			var(--skeleton-base, #e5e7eb) 0%,
			var(--skeleton-highlight, #f3f4f6) 50%,
			var(--skeleton-base, #e5e7eb) 100%
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
