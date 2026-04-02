<script lang="ts">
	/**
	 * AppLoadingSkeleton - Full-page loading skeleton for app initialization
	 * Replaces spinner with calendar-themed skeleton layout
	 */

	import { SkeletonBox } from '@manacore/shared-ui';
</script>

<div
	class="flex min-h-screen items-center justify-center bg-background"
	role="status"
	aria-label="Kalender wird geladen..."
>
	<div class="w-full max-w-md px-6 space-y-8">
		<!-- Logo/Header Area -->
		<div class="flex flex-col items-center gap-4">
			<SkeletonBox width="64px" height="64px" borderRadius="16px" />
			<SkeletonBox width="180px" height="24px" borderRadius="8px" />
		</div>

		<!-- Calendar Preview Skeleton -->
		<div class="bg-card rounded-xl p-4 space-y-4">
			<!-- Mini Calendar Header -->
			<div class="flex items-center justify-between">
				<SkeletonBox width="120px" height="20px" />
				<div class="flex gap-2">
					<SkeletonBox width="32px" height="32px" borderRadius="8px" />
					<SkeletonBox width="32px" height="32px" borderRadius="8px" />
				</div>
			</div>

			<!-- Weekday Headers -->
			<div class="grid grid-cols-7 gap-1">
				{#each Array(7) as _}
					<SkeletonBox width="100%" height="24px" borderRadius="4px" />
				{/each}
			</div>

			<!-- Calendar Days Grid -->
			<div class="grid grid-cols-7 gap-1">
				{#each Array(35) as _, i}
					<div style="opacity: {Math.max(0.3, 1 - (i % 7) * 0.08)}">
						<SkeletonBox width="100%" height="32px" borderRadius="8px" />
					</div>
				{/each}
			</div>
		</div>

		<!-- Loading Indicator -->
		<div class="flex justify-center">
			<SkeletonBox width="140px" height="16px" borderRadius="4px" />
		</div>
	</div>
</div>
