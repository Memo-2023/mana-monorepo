<script lang="ts">
	/**
	 * GoogleImportSkeleton - Skeleton for Google contacts loading
	 */

	import { SkeletonBox } from '@manacore/shared-ui';
</script>

<div class="space-y-6" role="status" aria-label="Google-Kontakte werden geladen...">
	<!-- Connected Account Card Skeleton -->
	<div class="bg-card rounded-lg p-4 flex items-center justify-between">
		<div class="flex items-center gap-3">
			<SkeletonBox width="40px" height="40px" borderRadius="50%" />
			<div class="flex flex-col gap-2">
				<SkeletonBox width="120px" height="16px" />
				<SkeletonBox width="180px" height="14px" />
			</div>
		</div>
		<SkeletonBox width="80px" height="14px" />
	</div>

	<!-- Contact List Skeleton -->
	<div class="bg-card rounded-lg overflow-hidden">
		<div class="flex items-center justify-between p-4 border-b border-border">
			<SkeletonBox width="140px" height="18px" />
			<div class="flex gap-2 items-center">
				<SkeletonBox width="60px" height="14px" />
				<span class="text-muted-foreground">|</span>
				<SkeletonBox width="70px" height="14px" />
			</div>
		</div>

		<div class="divide-y divide-border">
			{#each Array(6) as _, i}
				<div class="flex items-center gap-4 p-4" style="opacity: {Math.max(0.3, 1 - i * 0.12)};">
					<SkeletonBox width="20px" height="20px" borderRadius="4px" />
					<SkeletonBox width="40px" height="40px" borderRadius="50%" />
					<div class="flex-1 flex flex-col gap-2">
						<SkeletonBox width="50%" height="16px" />
						<SkeletonBox width="65%" height="14px" />
					</div>
				</div>
			{/each}
		</div>
	</div>

	<!-- Action Button Skeleton -->
	<div class="flex justify-end">
		<SkeletonBox width="160px" height="42px" borderRadius="8px" />
	</div>
</div>
