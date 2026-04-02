<script lang="ts">
	/**
	 * EventDetailSkeleton - Skeleton for event detail modal
	 * Matches the layout of EventDetailModal
	 */

	import { SkeletonBox } from '@manacore/shared-ui';
</script>

<div class="p-6 space-y-5" role="status" aria-label="Termin wird geladen...">
	<!-- Header with Title and Actions -->
	<div class="flex items-start justify-between gap-4">
		<SkeletonBox width="60%" height="24px" borderRadius="6px" />
		<div class="flex gap-2 flex-shrink-0">
			<SkeletonBox width="32px" height="32px" borderRadius="8px" />
			<SkeletonBox width="32px" height="32px" borderRadius="8px" />
		</div>
	</div>

	<!-- Calendar Row -->
	<div class="flex items-start gap-3">
		<SkeletonBox width="20px" height="20px" borderRadius="50%" />
		<div class="flex flex-col gap-1.5 flex-1">
			<SkeletonBox width="60px" height="12px" borderRadius="4px" />
			<SkeletonBox width="120px" height="16px" borderRadius="4px" />
		</div>
	</div>

	<!-- Time Row -->
	<div class="flex items-start gap-3">
		<SkeletonBox width="20px" height="20px" borderRadius="4px" />
		<div class="flex flex-col gap-1.5 flex-1">
			<SkeletonBox width="40px" height="12px" borderRadius="4px" />
			<SkeletonBox width="200px" height="16px" borderRadius="4px" />
		</div>
	</div>

	<!-- Location Row -->
	<div class="flex items-start gap-3">
		<SkeletonBox width="20px" height="20px" borderRadius="4px" />
		<div class="flex flex-col gap-1.5 flex-1">
			<SkeletonBox width="40px" height="12px" borderRadius="4px" />
			<SkeletonBox width="160px" height="16px" borderRadius="4px" />
		</div>
	</div>

	<!-- Description Row -->
	<div class="flex items-start gap-3">
		<SkeletonBox width="20px" height="20px" borderRadius="4px" />
		<div class="flex flex-col gap-1.5 flex-1">
			<SkeletonBox width="80px" height="12px" borderRadius="4px" />
			<div class="space-y-2">
				<SkeletonBox width="100%" height="14px" borderRadius="4px" />
				<SkeletonBox width="90%" height="14px" borderRadius="4px" />
				<SkeletonBox width="70%" height="14px" borderRadius="4px" />
			</div>
		</div>
	</div>

	<!-- Attendees Row -->
	<div class="flex items-start gap-3">
		<SkeletonBox width="20px" height="20px" borderRadius="4px" />
		<div class="flex flex-col gap-2 flex-1">
			<SkeletonBox width="100px" height="12px" borderRadius="4px" />
			<div class="flex flex-col gap-1.5">
				{#each Array(3) as _, i}
					<div class="flex items-center gap-2" style="opacity: {Math.max(0.5, 1 - i * 0.2)}">
						<SkeletonBox width="140px" height="14px" borderRadius="4px" />
						<SkeletonBox width="24px" height="18px" borderRadius="4px" />
					</div>
				{/each}
			</div>
		</div>
	</div>
</div>
