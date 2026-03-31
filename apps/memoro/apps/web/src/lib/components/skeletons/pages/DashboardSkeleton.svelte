<script lang="ts">
	/**
	 * DashboardSkeleton - Full-page Skeleton für Memos Page
	 *
	 * Zeigt die Struktur der Memos-Seite während des Ladens:
	 * - Linke Spalte: Glass Search Bar und Memo-Liste mit gerundeten Karten
	 * - Rechte Spalte: Memo Panel Platzhalter mit gerundeten Ecken
	 */

	import SkeletonBox from '../utils/SkeletonBox.svelte';
	import { isSidebarMode, isNavCollapsed } from '$lib/stores/navigation';

	interface Props {
		memoCount?: number;
		leftColumnWidth?: number;
	}

	let { memoCount = 6, leftColumnWidth = 400 }: Props = $props();
</script>

<div
	class="flex w-full gap-0 overflow-hidden {$isNavCollapsed || $isSidebarMode
		? 'h-screen'
		: 'h-[calc(100vh-5rem)]'}"
>
	<!-- Left Column: Memo List -->
	<div class="relative flex flex-shrink-0 flex-col bg-menu" style="width: {leftColumnWidth}px;">
		<!-- Floating Search Bar -->
		<div
			class="absolute top-0 left-0 right-0 z-20 py-3 pr-2 transition-all duration-300 {$isNavCollapsed
				? 'pl-16'
				: 'pl-4'}"
		>
			<SkeletonBox
				width="100%"
				height="48px"
				borderRadius="12px"
				className="bg-white/70 dark:bg-black/50 backdrop-blur-xl border border-theme shadow-lg"
			/>
		</div>

		<!-- Memo List (Scrollable) -->
		<div class="flex-1 overflow-y-auto scrollbar-hide pl-4 pr-2 pt-[72px]">
			<!-- Memo Cards -->
			<div class="flex flex-col">
				{#each Array(memoCount) as _, i}
					<div
						class="w-full rounded-xl border border-theme bg-content p-4"
						style="height: 144px; margin-bottom: 12px; opacity: {Math.max(0.5, 1 - i * 0.1)};"
					>
						<!-- Title -->
						<div class="mb-1">
							<SkeletonBox width="70%" height="18px" />
						</div>

						<!-- Intro/Transcript Preview Lines -->
						<div class="mb-2">
							<SkeletonBox width="100%" height="14px" className="mb-1" />
							<SkeletonBox width="80%" height="14px" />
						</div>

						<!-- Footer: Date & Duration -->
						<div class="flex items-center justify-between mt-auto">
							<SkeletonBox width="70px" height="12px" />
							<SkeletonBox width="35px" height="12px" />
						</div>
					</div>
				{/each}
			</div>
		</div>
	</div>

	<!-- Resizer -->
	<div class="w-1 bg-transparent"></div>

	<!-- Right Column: Memo Panel Placeholder -->
	<div class="flex flex-1 flex-col bg-menu">
		<!-- Panel Container matching SplitView single split design -->
		<div class="relative h-full w-full overflow-hidden pt-3 pl-2 pr-4">
			<!-- Content Container -->
			<div
				class="h-full w-full overflow-hidden rounded-t-xl border border-theme border-b-0 bg-content"
			>
				<!-- Empty State -->
				<div class="flex h-full items-center justify-center p-4">
					<div class="text-center rounded-xl border border-theme bg-content p-8">
						<!-- Placeholder Icon -->
						<div class="mb-6 flex justify-center">
							<SkeletonBox width="80px" height="80px" borderRadius="16px" />
						</div>

						<!-- Placeholder Text -->
						<SkeletonBox width="200px" height="28px" className="mb-2 mx-auto" />
						<SkeletonBox width="280px" height="16px" className="mx-auto" />
					</div>
				</div>
			</div>
		</div>
	</div>
</div>

<style>
	/* Hide scrollbar completely */
	.scrollbar-hide {
		-ms-overflow-style: none;
		scrollbar-width: none;
	}

	.scrollbar-hide::-webkit-scrollbar {
		display: none;
	}
</style>
