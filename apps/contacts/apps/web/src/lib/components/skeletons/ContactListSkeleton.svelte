<script lang="ts">
	/**
	 * ContactListSkeleton - Skeleton for the contact list view
	 * Shows multiple ContactRowSkeleton with cascading fade effect
	 */

	import ContactRowSkeleton from './ContactRowSkeleton.svelte';

	interface Props {
		/** Number of skeleton rows to show */
		count?: number;
		/** Apply cascading fade effect */
		fadeEffect?: boolean;
		/** Minimum opacity for fade effect */
		minOpacity?: number;
	}

	let { count = 8, fadeEffect = true, minOpacity = 0.3 }: Props = $props();

	function calculateOpacity(index: number): number {
		if (!fadeEffect) return 1;
		const fadeStep = (1 - minOpacity) / Math.max(count - 1, 1);
		return Math.max(minOpacity, 1 - index * fadeStep);
	}
</script>

<div class="space-y-2" role="status" aria-label="Kontakte werden geladen...">
	{#each Array(count) as _, i}
		<ContactRowSkeleton opacity={calculateOpacity(i)} />
	{/each}
</div>
