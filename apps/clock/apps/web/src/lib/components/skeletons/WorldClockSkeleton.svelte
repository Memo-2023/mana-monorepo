<script lang="ts">
	/**
	 * WorldClockSkeleton - Skeleton for world clock grid
	 * Shows placeholder cards for city times
	 */

	import { SkeletonBox } from '@manacore/shared-ui';
</script>

<div
	class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
	role="status"
	aria-label="Weltuhren werden geladen..."
>
	{#each Array(6) as _, i}
		<div
			class="bg-card rounded-xl p-4 border border-border"
			style="opacity: {Math.max(0.4, 1 - i * 0.1)}"
		>
			<!-- Day/Night + City Name -->
			<div class="mb-2 flex items-center gap-2">
				<SkeletonBox width="32px" height="12px" borderRadius="4px" />
				<SkeletonBox width="80px" height="14px" borderRadius="4px" />
			</div>

			<!-- Large Time Display -->
			<SkeletonBox width="140px" height="40px" borderRadius="6px" />

			<!-- Date and Offset -->
			<div class="mt-2 flex items-center justify-between">
				<SkeletonBox width="90px" height="13px" borderRadius="4px" />
				<SkeletonBox width="36px" height="14px" borderRadius="4px" />
			</div>
		</div>
	{/each}
</div>
