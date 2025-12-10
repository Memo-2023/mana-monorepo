<script lang="ts">
	/**
	 * AppLoadingSkeleton - Full-page loading skeleton for app initialization
	 * Replaces spinner with clock-themed skeleton layout
	 */

	import { SkeletonBox } from '@manacore/shared-ui';
</script>

<div
	class="flex min-h-screen items-center justify-center bg-background"
	role="status"
	aria-label="App wird geladen..."
>
	<div class="w-full max-w-sm px-6 space-y-8">
		<!-- Clock Icon Area -->
		<div class="flex flex-col items-center gap-4">
			<SkeletonBox width="80px" height="80px" borderRadius="50%" />
			<SkeletonBox width="120px" height="24px" borderRadius="8px" />
		</div>

		<!-- Time Display Skeleton -->
		<div class="bg-card rounded-2xl p-6 space-y-4">
			<!-- Large Time -->
			<div class="flex justify-center">
				<SkeletonBox width="200px" height="48px" borderRadius="8px" />
			</div>

			<!-- Date -->
			<div class="flex justify-center">
				<SkeletonBox width="140px" height="16px" borderRadius="4px" />
			</div>

			<!-- Quick Actions -->
			<div class="flex justify-center gap-3 pt-2">
				{#each Array(4) as _, i}
					<SkeletonBox width="48px" height="48px" borderRadius="12px" />
				{/each}
			</div>
		</div>

		<!-- Loading Text -->
		<div class="flex justify-center">
			<SkeletonBox width="100px" height="14px" borderRadius="4px" />
		</div>
	</div>
</div>
