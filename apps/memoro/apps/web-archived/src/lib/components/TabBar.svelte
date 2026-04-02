<script lang="ts">
	import type { Split } from '$lib/stores/tabs';
	import { tabs } from '$lib/stores/tabs';

	interface Props {
		split: Split;
		onSplitVertical?: () => void;
		onSplitHorizontal?: () => void;
		onCloseSplit?: () => void;
	}

	let { split, onSplitVertical, onSplitHorizontal, onCloseSplit }: Props = $props();

	function handleCloseTab(tabId: string) {
		tabs.closeTab(split.id, tabId);
	}

	function handleActivateTab(tabId: string) {
		tabs.activateTab(split.id, tabId);
	}

	function truncateTitle(title: string, maxLength: number = 20): string {
		if (title.length <= maxLength) return title;
		return title.substring(0, maxLength - 3) + '...';
	}
</script>

<div class="flex items-center justify-between gap-2 p-3 bg-transparent">
	<!-- Tabs -->
	<div class="flex gap-2 overflow-x-auto">
		{#each split.tabs as tab (tab.id)}
			<button
				onclick={() => handleActivateTab(tab.id)}
				class="group relative flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm transition-all backdrop-blur-md {tab.isActive
					? 'bg-white/20 text-white shadow-sm border border-white/20'
					: 'bg-black/30 text-white/60 hover:bg-white/10 hover:text-white border border-white/10'}"
			>
				<!-- Tab Title -->
				<span class="max-w-[150px] truncate">
					{truncateTitle(tab.memo?.title || 'Untitled Memo')}
				</span>

				<!-- Close Button -->
				<span
					role="button"
					tabindex="0"
					onclick={(e) => {
						e.stopPropagation();
						handleCloseTab(tab.id);
					}}
					onkeydown={(e) => {
						if (e.key === 'Enter' || e.key === ' ') {
							e.preventDefault();
							e.stopPropagation();
							handleCloseTab(tab.id);
						}
					}}
					class="rounded p-0.5 opacity-0 transition-opacity hover:bg-white/20 group-hover:opacity-100 {tab.isActive
						? 'opacity-100'
						: ''} cursor-pointer"
					title="Close tab"
				>
					<svg class="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M6 18L18 6M6 6l12 12"
						/>
					</svg>
				</span>
			</button>
		{/each}
	</div>

	<!-- Actions -->
	<div class="flex items-center gap-1 rounded-lg bg-white/10 px-2 py-1">
		<!-- Split Vertical -->
		{#if onSplitVertical}
			<button
				onclick={onSplitVertical}
				class="rounded-md p-1.5 text-white/60 transition-colors hover:bg-white/20 hover:text-white"
				title="Split vertically (Shift+Click on memo)"
			>
				<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M9 4v16M15 4v16"
					/>
				</svg>
			</button>
		{/if}

		<!-- Split Horizontal -->
		{#if onSplitHorizontal}
			<button
				onclick={onSplitHorizontal}
				class="rounded-md p-1.5 text-white/60 transition-colors hover:bg-white/20 hover:text-white"
				title="Split horizontally"
			>
				<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M4 9h16M4 15h16"
					/>
				</svg>
			</button>
		{/if}

		<!-- Close Split -->
		{#if onCloseSplit}
			<button
				onclick={onCloseSplit}
				class="rounded-md p-1.5 text-white/60 transition-colors hover:bg-red-500/20 hover:text-red-400"
				title="Close split"
			>
				<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M6 18L18 6M6 6l12 12"
					/>
				</svg>
			</button>
		{/if}
	</div>
</div>

<style>
	/* Hide scrollbar for tab overflow */
	.overflow-x-auto::-webkit-scrollbar {
		height: 0;
	}
</style>
