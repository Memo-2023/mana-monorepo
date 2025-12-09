<script lang="ts">
	/**
	 * SkeletonList - List of skeleton rows with cascading fade effect
	 *
	 * @example
	 * ```svelte
	 * <SkeletonList count={5} />
	 * <SkeletonList count={10} showAvatar fadeEffect />
	 * ```
	 */

	import SkeletonRow from './SkeletonRow.svelte';

	interface Props {
		/** Number of rows to show */
		count?: number;
		/** Show avatar in each row */
		showAvatar?: boolean;
		/** Avatar size */
		avatarSize?: string;
		/** Apply cascading fade effect (rows fade out towards bottom) */
		fadeEffect?: boolean;
		/** Minimum opacity for fade effect */
		minOpacity?: number;
		/** Gap between rows */
		gap?: string;
		/** Additional CSS classes */
		class?: string;
	}

	let {
		count = 5,
		showAvatar = true,
		avatarSize = '40px',
		fadeEffect = true,
		minOpacity = 0.3,
		gap = '0',
		class: className = '',
	}: Props = $props();

	function calculateOpacity(index: number): number {
		if (!fadeEffect) return 1;
		const fadeStep = (1 - minOpacity) / Math.max(count - 1, 1);
		return Math.max(minOpacity, 1 - index * fadeStep);
	}
</script>

<div class="skeleton-list flex flex-col {className}" style="gap: {gap};">
	{#each Array(count) as _, i}
		<SkeletonRow {showAvatar} {avatarSize} opacity={calculateOpacity(i)} />
	{/each}
</div>
