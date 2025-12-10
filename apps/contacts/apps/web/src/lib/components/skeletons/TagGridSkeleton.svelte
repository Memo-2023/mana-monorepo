<script lang="ts">
	/**
	 * TagGridSkeleton - Skeleton for the tags grid
	 */

	import TagCardSkeleton from './TagCardSkeleton.svelte';

	interface Props {
		/** Number of skeleton cards to show */
		count?: number;
		/** Apply cascading fade effect */
		fadeEffect?: boolean;
		/** Minimum opacity for fade effect */
		minOpacity?: number;
	}

	let { count = 6, fadeEffect = true, minOpacity = 0.4 }: Props = $props();

	function calculateOpacity(index: number): number {
		if (!fadeEffect) return 1;
		const fadeStep = (1 - minOpacity) / Math.max(count - 1, 1);
		return Math.max(minOpacity, 1 - index * fadeStep);
	}
</script>

<div class="tag-grid-skeleton" role="status" aria-label="Tags werden geladen...">
	{#each Array(count) as _, i}
		<TagCardSkeleton opacity={calculateOpacity(i)} />
	{/each}
</div>

<style>
	.tag-grid-skeleton {
		display: grid;
		grid-template-columns: repeat(1, 1fr);
		gap: 1rem;
	}

	@media (min-width: 640px) {
		.tag-grid-skeleton {
			grid-template-columns: repeat(2, 1fr);
		}
	}

	@media (min-width: 1024px) {
		.tag-grid-skeleton {
			grid-template-columns: repeat(3, 1fr);
		}
	}
</style>
