<script lang="ts">
	/**
	 * SplitPaneContainer Component
	 * Main container that handles split-screen layout.
	 */

	import type { Snippet } from 'svelte';
	import { onMount } from 'svelte';
	import { getSplitPanelContext } from '../stores/split-panel.svelte.js';
	import AppPanel from './AppPanel.svelte';
	import PanelControls from './PanelControls.svelte';
	import ResizeHandle from './ResizeHandle.svelte';

	interface Props {
		children: Snippet;
		class?: string;
	}

	let { children, class: className = '' }: Props = $props();

	const splitPanel = getSplitPanelContext();

	// Grid template based on divider position
	let gridTemplate = $derived(
		splitPanel.isActive && splitPanel.rightPanel ? `${splitPanel.dividerPosition}% 6px 1fr` : '1fr'
	);

	function handleResize(position: number) {
		splitPanel.setDividerPosition(position);
	}

	function handleReset() {
		splitPanel.resetDividerPosition();
	}
</script>

<div
	class="split-pane-container {className}"
	class:split-active={splitPanel.isActive && splitPanel.rightPanel}
	style:--grid-template={gridTemplate}
>
	<div class="main-panel">
		{@render children()}
	</div>

	{#if splitPanel.isActive && splitPanel.rightPanel}
		<ResizeHandle
			position={splitPanel.dividerPosition}
			onResize={handleResize}
			onReset={handleReset}
		/>

		<div class="side-panel">
			<AppPanel panel={splitPanel.rightPanel} />
			<PanelControls
				panelName={splitPanel.rightPanel.name || splitPanel.rightPanel.appId}
				onSwap={() => splitPanel.swapPanels()}
				onClose={() => splitPanel.closePanel()}
			/>
		</div>
	{/if}
</div>

<style>
	.split-pane-container {
		display: grid;
		grid-template-columns: var(--grid-template, 1fr);
		width: 100%;
		height: 100%;
		min-height: 0;
		overflow: hidden;
	}

	.main-panel {
		position: relative;
		width: 100%;
		height: 100%;
		min-width: 0;
		min-height: 0;
		overflow: hidden;
	}

	.side-panel {
		position: relative;
		width: 100%;
		height: 100%;
		min-width: 0;
		min-height: 0;
		overflow: hidden;
	}

	/* Ensure proper stacking */
	.split-active .main-panel {
		z-index: 1;
	}

	.split-active .side-panel {
		z-index: 1;
	}

	/* Hide side panel on mobile via media query as fallback */
	@media (max-width: 1023px) {
		.split-pane-container {
			grid-template-columns: 1fr !important;
		}

		.side-panel,
		.split-pane-container :global(.resize-handle) {
			display: none;
		}
	}
</style>
