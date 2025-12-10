<script lang="ts">
	/**
	 * SkeletonGrid - Grid of skeleton cards with fade effect
	 *
	 * @example
	 * ```svelte
	 * <SkeletonGrid count={6} columns={3} />
	 * <SkeletonGrid count={8} columns={4} showAvatar />
	 * ```
	 */

	import SkeletonCard from './SkeletonCard.svelte';

	interface Props {
		/** Number of cards to show */
		count?: number;
		/** Number of columns (CSS grid) */
		columns?: number;
		/** Show avatar in cards */
		showAvatar?: boolean;
		/** Avatar size */
		avatarSize?: string;
		/** Number of body lines per card */
		bodyLines?: number;
		/** Apply cascading fade effect */
		fadeEffect?: boolean;
		/** Minimum opacity for fade effect */
		minOpacity?: number;
		/** Gap between cards */
		gap?: string;
		/** Additional CSS classes */
		class?: string;
	}

	let {
		count = 6,
		columns = 3,
		showAvatar = true,
		avatarSize = '48px',
		bodyLines = 2,
		fadeEffect = true,
		minOpacity = 0.4,
		gap = '1rem',
		class: className = '',
	}: Props = $props();

	function calculateOpacity(index: number): number {
		if (!fadeEffect) return 1;
		const fadeStep = (1 - minOpacity) / Math.max(count - 1, 1);
		return Math.max(minOpacity, 1 - index * fadeStep);
	}
</script>

<div
	class="skeleton-grid grid {className}"
	style="grid-template-columns: repeat({columns}, minmax(0, 1fr)); gap: {gap};"
>
	{#each Array(count) as _, i}
		<SkeletonCard {showAvatar} {avatarSize} {bodyLines} opacity={calculateOpacity(i)} />
	{/each}
</div>
