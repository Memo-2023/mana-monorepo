<script lang="ts">
	/**
	 * StatisticsPageSkeleton - Full-page Skeleton für Statistics Seite
	 *
	 * Zeigt Platzhalter für Statistik-Karten während des Ladens
	 */

	import SkeletonBox from '../utils/SkeletonBox.svelte';

	interface Props {
		showCards?: boolean;
	}

	let { showCards = true }: Props = $props();
</script>

<div class="container mx-auto px-6 py-8">
	<!-- Header -->
	<div class="mb-8">
		<SkeletonBox width="200px" height="36px" className="mb-3" />
		<SkeletonBox width="300px" height="16px" />
	</div>

	{#if showCards}
		<!-- Quick Stats Cards - Horizontal Scroll -->
		<div class="mb-8 flex gap-4 overflow-x-auto pb-4">
			{#each [1, 2, 3, 4] as _, i}
				<div
					class="flex-shrink-0 rounded-xl border border-theme bg-menu p-6"
					style="width: 280px; opacity: {Math.max(0.5, 1 - i * 0.1)};"
				>
					<!-- Card Title -->
					<SkeletonBox width="120px" height="14px" className="mb-4" />

					<!-- Main Number -->
					<SkeletonBox width="100px" height="36px" className="mb-2" />

					<!-- Secondary Info -->
					<SkeletonBox width="80px" height="12px" />
				</div>
			{/each}
		</div>

		<!-- Large Stat Cards Grid -->
		<div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
			<!-- Overview Card -->
			<div class="rounded-xl border border-theme bg-menu p-6">
				<SkeletonBox width="180px" height="24px" className="mb-6" />

				<!-- Stats Grid -->
				<div class="grid grid-cols-2 gap-4">
					{#each [1, 2, 3, 4] as _}
						<div class="rounded-lg border border-theme p-4">
							<SkeletonBox width="80px" height="12px" className="mb-3" />
							<SkeletonBox width="60px" height="28px" />
						</div>
					{/each}
				</div>
			</div>

			<!-- Productivity Card -->
			<div class="rounded-xl border border-theme bg-menu p-6">
				<SkeletonBox width="160px" height="24px" className="mb-6" />

				<!-- Chart Area -->
				<div class="space-y-4">
					{#each [1, 2, 3] as _}
						<div>
							<SkeletonBox width="100px" height="12px" className="mb-2" />
							<SkeletonBox width="100%" height="8px" borderRadius="4px" />
						</div>
					{/each}
				</div>
			</div>

			<!-- Insights Card -->
			<div class="rounded-xl border border-theme bg-menu p-6">
				<SkeletonBox width="140px" height="24px" className="mb-6" />

				<!-- Circular Chart Placeholder -->
				<div class="flex justify-center py-8">
					<SkeletonBox width="200px" height="200px" borderRadius="50%" />
				</div>

				<!-- Legend -->
				<div class="mt-6 space-y-3">
					{#each [1, 2, 3, 4] as _}
						<div class="flex items-center justify-between">
							<div class="flex items-center gap-2">
								<SkeletonBox width="12px" height="12px" borderRadius="50%" />
								<SkeletonBox width="100px" height="12px" />
							</div>
							<SkeletonBox width="40px" height="12px" />
						</div>
					{/each}
				</div>
			</div>

			<!-- Engagement Card -->
			<div class="rounded-xl border border-theme bg-menu p-6">
				<SkeletonBox width="150px" height="24px" className="mb-6" />

				<!-- Engagement Stats -->
				<div class="space-y-6">
					{#each [1, 2, 3] as _}
						<div>
							<SkeletonBox width="120px" height="14px" className="mb-2" />
							<SkeletonBox width="100%" height="16px" className="mb-1" />
							<SkeletonBox width="70%" height="12px" />
						</div>
					{/each}
				</div>
			</div>
		</div>
	{/if}
</div>

<style>
	/* Horizontal scroll styling for quick stats */
	.overflow-x-auto::-webkit-scrollbar {
		height: 6px;
	}

	.overflow-x-auto::-webkit-scrollbar-track {
		background: transparent;
	}

	.overflow-x-auto::-webkit-scrollbar-thumb {
		background: #cbd5e0;
		border-radius: 3px;
	}

	:global(.dark) .overflow-x-auto::-webkit-scrollbar-thumb {
		background: #4a5568;
	}
</style>
