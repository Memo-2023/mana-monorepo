<script lang="ts">
	/**
	 * BlueprintsPageSkeleton - Full-page Skeleton für Blueprints Seite
	 *
	 * Zeigt Filter Pills und Grid von Blueprint-Karten während des Ladens
	 */

	import SkeletonBox from '../utils/SkeletonBox.svelte';

	interface Props {
		blueprintCount?: number;
		showFilters?: boolean;
	}

	let { blueprintCount = 9, showFilters = true }: Props = $props();
</script>

<div class="container mx-auto px-6 py-8">
	<!-- Category Filter Pills -->
	{#if showFilters}
		<div class="mb-8 flex gap-2 overflow-x-auto pb-2">
			{#each [90, 110, 80, 100, 95, 85] as width}
				<SkeletonBox width="{width}px" height="36px" borderRadius="18px" className="flex-shrink-0" />
			{/each}
		</div>
	{/if}

	<!-- Blueprint Cards Grid -->
	<div class="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
		{#each Array(blueprintCount) as _, i}
			<div
				class="rounded-xl border border-theme bg-menu p-6 transition-all"
				style="opacity: {Math.max(0.4, 1 - i * 0.07)};"
			>
				<!-- Category Badge -->
				<SkeletonBox width="90px" height="22px" borderRadius="12px" className="mb-4" />

				<!-- Blueprint Title -->
				<SkeletonBox width="100%" height="24px" className="mb-3" />

				<!-- Description Lines -->
				<div class="mb-5">
					<SkeletonBox width="100%" height="14px" className="mb-2" />
					<SkeletonBox width="95%" height="14px" className="mb-2" />
					<SkeletonBox width="75%" height="14px" />
				</div>

				<!-- Prompts Count -->
				<div class="flex items-center gap-2 border-t border-theme pt-4">
					<SkeletonBox width="18px" height="18px" borderRadius="50%" />
					<SkeletonBox width="110px" height="12px" />
				</div>
			</div>
		{/each}
	</div>
</div>

<style>
	/* Horizontal scroll styling for filter pills */
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
