<script lang="ts">
	/**
	 * SkeletonText - Multi-line text skeleton
	 *
	 * Creates multiple skeleton lines for text content loading states.
	 *
	 * @example
	 * ```svelte
	 * <SkeletonText lines={3} />
	 * <SkeletonText lines={2} lastLineWidth="60%" />
	 * ```
	 */

	import SkeletonBox from './SkeletonBox.svelte';

	interface Props {
		/** Number of lines to show */
		lines?: number;
		/** Height of each line */
		lineHeight?: string;
		/** Gap between lines */
		gap?: string;
		/** Width of the last line (to simulate natural text) */
		lastLineWidth?: string;
		/** Additional CSS classes */
		class?: string;
	}

	let {
		lines = 3,
		lineHeight = '16px',
		gap = '8px',
		lastLineWidth = '70%',
		class: className = ''
	}: Props = $props();
</script>

<div class="skeleton-text {className}" style="display: flex; flex-direction: column; gap: {gap};">
	{#each Array(lines) as _, i}
		<SkeletonBox
			width={i === lines - 1 ? lastLineWidth : '100%'}
			height={lineHeight}
		/>
	{/each}
</div>
