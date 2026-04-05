<!--
  SplitPaneLayout — Wraps the main content and optionally renders a split-screen panel.

  Usage:
    <SplitPaneLayout>
      <YourMainContent />
    </SplitPaneLayout>
-->
<script lang="ts">
	import type { Snippet } from 'svelte';
	import { splitStore } from './store.svelte';
	import ResizeHandle from './ResizeHandle.svelte';
	import PanelHeader from './PanelHeader.svelte';

	let { children }: { children: Snippet } = $props();
</script>

<div class="split-layout flex h-full w-full overflow-hidden">
	<!-- Main panel -->
	<div
		style="width: {splitStore.isActive ? splitStore.dividerPosition + '%' : '100%'}"
		class="main-pane h-full overflow-auto transition-[width] duration-200 ease-out"
	>
		{@render children()}
	</div>

	{#if splitStore.isActive && splitStore.SplitComponent}
		<ResizeHandle onResize={(pos) => splitStore.setDividerPosition(pos)} />

		<!-- Split panel -->
		<div
			style="width: {100 - splitStore.dividerPosition}%"
			class="split-pane flex h-full flex-col overflow-hidden border-l border-white/10"
		>
			<PanelHeader appId={splitStore.splitApp} onClose={() => splitStore.closeSplit()} />
			<div class="flex-1 overflow-auto">
				<splitStore.SplitComponent />
			</div>
		</div>
	{/if}

	{#if splitStore.isLoading}
		<div class="flex w-64 items-center justify-center border-l border-white/10 bg-white/5">
			<div
				class="h-5 w-5 animate-spin rounded-full border-2 border-white/20 border-t-white/60"
			></div>
		</div>
	{/if}
</div>

<style>
	/* Mobile: stack split pane vertically, hide resize handle */
	@media (max-width: 768px) {
		.split-layout {
			flex-direction: column;
		}

		.main-pane {
			width: 100% !important;
			flex-shrink: 0;
		}

		.split-pane {
			width: 100% !important;
			border-left: none;
			border-top: 1px solid rgba(255, 255, 255, 0.1);
		}

		.split-layout :global(.resize-handle) {
			display: none;
		}
	}
</style>
