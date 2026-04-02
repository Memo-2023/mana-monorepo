<script lang="ts">
	/**
	 * AgendaSkeleton - Skeleton for agenda page event list
	 * Shows date groups with event items
	 */

	import { SkeletonBox } from '@manacore/shared-ui';
</script>

<div class="space-y-6" role="status" aria-label="Termine werden geladen...">
	<!-- Date Groups -->
	{#each Array(4) as _, groupIndex}
		<div class="space-y-2" style="opacity: {Math.max(0.4, 1 - groupIndex * 0.15)}">
			<!-- Date Header -->
			<div class="px-2">
				<SkeletonBox width="140px" height="14px" borderRadius="4px" />
			</div>

			<!-- Event Items -->
			{#each Array(groupIndex === 0 ? 3 : 2) as _, eventIndex}
				<div
					class="bg-card rounded-xl p-4 flex gap-4"
					style="opacity: {Math.max(0.5, 1 - eventIndex * 0.15)}"
				>
					<!-- Color Bar -->
					<SkeletonBox width="4px" height="48px" borderRadius="2px" />

					<!-- Event Content -->
					<div class="flex-1 space-y-2">
						<!-- Time -->
						<SkeletonBox width="90px" height="12px" borderRadius="4px" />
						<!-- Title -->
						<SkeletonBox width="70%" height="16px" borderRadius="4px" />
						<!-- Location (occasionally) -->
						{#if eventIndex === 0}
							<SkeletonBox width="50%" height="14px" borderRadius="4px" />
						{/if}
					</div>
				</div>
			{/each}
		</div>
	{/each}
</div>
