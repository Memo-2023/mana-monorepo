<script lang="ts">
	/**
	 * DuplicateListSkeleton - Skeleton for the duplicates page
	 * Shows stats cards and duplicate groups with fade effect
	 */

	import { SkeletonBox } from '@manacore/shared-ui';
	import DuplicateGroupSkeleton from './DuplicateGroupSkeleton.svelte';

	interface Props {
		/** Number of duplicate groups to show */
		count?: number;
		/** Apply cascading fade effect */
		fadeEffect?: boolean;
		/** Minimum opacity for fade effect */
		minOpacity?: number;
	}

	let { count = 3, fadeEffect = true, minOpacity = 0.4 }: Props = $props();

	function calculateOpacity(index: number): number {
		if (!fadeEffect) return 1;
		const fadeStep = (1 - minOpacity) / Math.max(count - 1, 1);
		return Math.max(minOpacity, 1 - index * fadeStep);
	}
</script>

<div class="space-y-6" role="status" aria-label="Duplikate werden geladen...">
	<!-- Stats skeleton -->
	<div class="stats-grid">
		{#each Array(3) as _}
			<div class="stat-card">
				<SkeletonBox width="60px" height="28px" />
				<SkeletonBox width="100px" height="14px" />
			</div>
		{/each}
	</div>

	<!-- Duplicate groups skeleton -->
	<div class="space-y-4">
		{#each Array(count) as _, i}
			<DuplicateGroupSkeleton contactCount={2 + (i % 2)} opacity={calculateOpacity(i)} />
		{/each}
	</div>
</div>

<style>
	.stats-grid {
		display: grid;
		grid-template-columns: repeat(1, 1fr);
		gap: 1rem;
	}

	@media (min-width: 640px) {
		.stats-grid {
			grid-template-columns: repeat(3, 1fr);
		}
	}

	.stat-card {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		padding: 1rem;
		background-color: hsl(var(--card));
		border: 1px solid hsl(var(--border));
		border-radius: var(--radius-lg);
	}
</style>
