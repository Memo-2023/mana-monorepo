<script lang="ts">
	/**
	 * ContactListSkeleton - Skeleton for the contact list view
	 * Shows multiple ContactRowSkeleton with cascading fade effect
	 */

	import ContactRowSkeleton from './ContactRowSkeleton.svelte';
	import { calculateFadeOpacity } from './utils';

	interface Props {
		/** Number of skeleton rows to show */
		count?: number;
		/** Apply cascading fade effect */
		fadeEffect?: boolean;
		/** Minimum opacity for fade effect */
		minOpacity?: number;
	}

	let { count = 8, fadeEffect = true, minOpacity = 0.3 }: Props = $props();
</script>

<div class="space-y-2" role="status" aria-label="Kontakte werden geladen...">
	{#each Array(count) as _, i}
		<ContactRowSkeleton opacity={fadeEffect ? calculateFadeOpacity(i, count, minOpacity) : 1} />
	{/each}
</div>
