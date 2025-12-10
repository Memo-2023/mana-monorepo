<script lang="ts">
	/**
	 * TimersSkeleton - Skeleton for active timers grid
	 * Shows placeholder tiles for timer displays
	 */

	import { SkeletonBox } from '@manacore/shared-ui';
</script>

<div role="status" aria-label="Timer werden geladen...">
	<!-- Section Header -->
	<div class="mb-2">
		<SkeletonBox width="80px" height="12px" borderRadius="4px" />
	</div>

	<!-- Timer Grid -->
	<div class="grid grid-cols-2 sm:grid-cols-3 gap-2">
		{#each Array(4) as _, i}
			<div
				class="bg-card rounded-xl p-3 border border-border"
				style="opacity: {Math.max(0.5, 1 - i * 0.12)}"
			>
				<!-- Time + Delete Button Row -->
				<div class="flex items-start justify-between mb-1">
					<SkeletonBox width="70px" height="24px" borderRadius="4px" />
					<SkeletonBox width="14px" height="14px" borderRadius="4px" />
				</div>

				<!-- Label -->
				<div class="mb-2">
					<SkeletonBox width="50px" height="10px" borderRadius="4px" />
				</div>

				<!-- Progress Bar -->
				<div class="mb-2">
					<SkeletonBox width="100%" height="4px" borderRadius="2px" />
				</div>

				<!-- Control Buttons -->
				<div class="flex gap-1">
					<SkeletonBox width="100%" height="28px" borderRadius="6px" />
					<SkeletonBox width="48px" height="28px" borderRadius="6px" />
				</div>
			</div>
		{/each}
	</div>
</div>
