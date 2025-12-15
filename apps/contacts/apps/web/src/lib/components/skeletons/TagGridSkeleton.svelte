<script lang="ts">
	/**
	 * TagGridSkeleton - Skeleton for the tags grid
	 */

	import TagCardSkeleton from './TagCardSkeleton.svelte';
	import { calculateFadeOpacity } from './utils';

	interface Props {
		/** Number of skeleton cards to show */
		count?: number;
		/** Apply cascading fade effect */
		fadeEffect?: boolean;
		/** Minimum opacity for fade effect */
		minOpacity?: number;
	}

	let { count = 6, fadeEffect = true, minOpacity = 0.4 }: Props = $props();
</script>

<div class="tag-grid-skeleton" role="status" aria-label="Tags werden geladen...">
	{#each Array(count) as _, i}
		<TagCardSkeleton opacity={fadeEffect ? calculateFadeOpacity(i, count, minOpacity) : 1} />
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
