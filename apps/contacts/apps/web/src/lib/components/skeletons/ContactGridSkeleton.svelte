<script lang="ts">
	/**
	 * ContactGridSkeleton - Skeleton for the contact grid view
	 * Shows multiple ContactCardSkeleton with cascading fade effect
	 */

	import ContactCardSkeleton from './ContactCardSkeleton.svelte';
	import { calculateFadeOpacity } from './utils';

	interface Props {
		/** Number of skeleton cards to show */
		count?: number;
		/** Apply cascading fade effect */
		fadeEffect?: boolean;
		/** Minimum opacity for fade effect */
		minOpacity?: number;
	}

	let { count = 8, fadeEffect = true, minOpacity = 0.4 }: Props = $props();
</script>

<div class="contact-grid-skeleton" role="status" aria-label="Kontakte werden geladen...">
	{#each Array(count) as _, i}
		<ContactCardSkeleton opacity={fadeEffect ? calculateFadeOpacity(i, count, minOpacity) : 1} />
	{/each}
</div>

<style>
	.contact-grid-skeleton {
		display: grid;
		grid-template-columns: repeat(1, 1fr);
		gap: 1rem;
	}

	@media (min-width: 640px) {
		.contact-grid-skeleton {
			grid-template-columns: repeat(2, 1fr);
		}
	}

	@media (min-width: 1024px) {
		.contact-grid-skeleton {
			grid-template-columns: repeat(3, 1fr);
		}
	}

	@media (min-width: 1280px) {
		.contact-grid-skeleton {
			grid-template-columns: repeat(4, 1fr);
		}
	}
</style>
