<script lang="ts">
	/**
	 * SpacesPageSkeleton - Full-page Skeleton für Spaces Seite
	 *
	 * Zeigt Platzhalter für Space Cards und Create Button
	 */

	import SkeletonBox from '../utils/SkeletonBox.svelte';

	interface Props {
		spaceCount?: number;
		showCreateButton?: boolean;
	}

	let { spaceCount = 6, showCreateButton = true }: Props = $props();
</script>

<div class="flex h-full flex-col">
	<div class="flex-1 overflow-y-auto">
		<div class="mx-auto max-w-5xl space-y-6 pb-12">
			<!-- Header -->
			<div class="flex items-center justify-between">
				<div>
					<SkeletonBox width="280px" height="36px" className="mb-2" />
					<SkeletonBox width="320px" height="16px" />
				</div>
				{#if showCreateButton}
					<SkeletonBox width="140px" height="48px" borderRadius="8px" />
				{/if}
			</div>

			<!-- Spaces Grid -->
			<div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
				{#each Array(spaceCount) as _, i}
					<div
						class="rounded-xl border border-theme bg-menu p-6 transition-all"
						style="opacity: {Math.max(0.4, 1 - i * 0.08)};"
					>
						<!-- Space Icon -->
						<div class="mb-4">
							<SkeletonBox width="48px" height="48px" borderRadius="50%" />
						</div>

						<!-- Space Name -->
						<SkeletonBox width="70%" height="20px" className="mb-3" />

						<!-- Description -->
						<div class="mb-4">
							<SkeletonBox width="100%" height="14px" className="mb-2" />
							<SkeletonBox width="85%" height="14px" />
						</div>

						<!-- Members & Stats -->
						<div class="mb-4 flex items-center gap-4 border-t border-theme pt-4">
							<div class="flex items-center gap-2">
								<SkeletonBox width="20px" height="20px" borderRadius="50%" />
								<SkeletonBox width="40px" height="12px" />
							</div>
							<div class="flex items-center gap-2">
								<SkeletonBox width="20px" height="20px" borderRadius="50%" />
								<SkeletonBox width="40px" height="12px" />
							</div>
						</div>

						<!-- Action Buttons -->
						<div class="flex gap-2">
							<SkeletonBox width="100%" height="36px" borderRadius="6px" />
							<SkeletonBox width="36px" height="36px" borderRadius="6px" />
						</div>
					</div>
				{/each}
			</div>
		</div>
	</div>
</div>
