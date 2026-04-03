<script lang="ts">
	import { slide } from 'svelte/transition';
	import type { Snippet } from 'svelte';
	import { SlidersHorizontal } from '@manacore/shared-icons';

	interface Props {
		/** Whether the toolbar is collapsed */
		isCollapsed?: boolean;
		/** Called when collapsed state changes */
		onCollapsedChange?: (isCollapsed: boolean) => void;
		/** Whether in sidebar mode (affects positioning) */
		isSidebarMode?: boolean;
		/** Bottom offset from viewport bottom (default: '70px') */
		bottomOffset?: string;
		/** Sidebar mode bottom offset (default: '0px') */
		sidebarBottomOffset?: string;
		/** Panel height when expanded (default: '70px') */
		panelHeight?: string;
		/** FAB tooltip when collapsed */
		collapsedTitle?: string;
		/** FAB tooltip when expanded */
		expandedTitle?: string;
		/** Custom collapsed icon snippet */
		collapsedIcon?: Snippet;
		/** Custom expanded icon snippet */
		expandedIcon?: Snippet;
		/** Panel content (required) */
		children: Snippet;
		/** Optional right-side content (e.g., layout toggle) */
		rightActions?: Snippet;
	}

	let {
		isCollapsed = true,
		onCollapsedChange,
		isSidebarMode = false,
		bottomOffset = '70px',
		sidebarBottomOffset = '0px',
		panelHeight = '70px',
		collapsedTitle = 'Optionen',
		expandedTitle = 'Schließen',
		collapsedIcon,
		expandedIcon,
		children,
		rightActions,
	}: Props = $props();

	function toggleToolbar() {
		onCollapsedChange?.(!isCollapsed);
	}
</script>

<!-- FAB Button - positioned next to InputBar -->
<div
	class="fab-container"
	class:sidebar-mode={isSidebarMode}
	class:expanded={!isCollapsed}
	style="--bottom-offset: {isSidebarMode
		? sidebarBottomOffset
		: bottomOffset}; --panel-height: {panelHeight};"
>
	<button
		onclick={toggleToolbar}
		class="toolbar-fab glass-pill"
		class:active={!isCollapsed}
		title={isCollapsed ? collapsedTitle : expandedTitle}
	>
		<SlidersHorizontal size={20} class="fab-icon" />
	</button>
</div>

<!-- Expanded Toolbar Panel - below InputBar, pushes content up -->
{#if !isCollapsed}
	<div
		class="toolbar-bar glass-panel"
		class:sidebar-mode={isSidebarMode}
		style="--bottom-offset: {isSidebarMode ? sidebarBottomOffset : bottomOffset};"
		transition:slide={{ duration: 200 }}
	>
		<div class="toolbar-content">
			{@render children()}

			{#if rightActions}
				<div class="toolbar-divider"></div>
				{@render rightActions()}
			{/if}
		</div>
	</div>
{/if}

<style>
	/* FAB Container - positioned next to InputBar (aligned with input-container) */
	.fab-container {
		position: fixed;
		bottom: calc(
			var(--bottom-offset, 70px) + 9px + env(safe-area-inset-bottom, 0px)
		); /* base offset + 9px to align with input-container */
		right: calc(50% - 350px - 70px); /* Right of InputBar (max-width 700px / 2 + gap) */
		z-index: 91; /* Above InputBar (90) */
		pointer-events: none;
		transition: bottom 0.2s ease;
	}

	/* When expanded, move FAB up with InputBar */
	.fab-container.expanded {
		bottom: calc(
			var(--bottom-offset, 70px) + var(--panel-height, 70px) + 9px +
				env(safe-area-inset-bottom, 0px)
		);
	}

	/* Responsive positioning */
	@media (max-width: 900px) {
		.fab-container {
			right: 1rem;
		}
	}

	/* Toolbar Bar - full width below InputBar */
	.toolbar-bar {
		position: fixed;
		bottom: calc(var(--bottom-offset, 70px) + env(safe-area-inset-bottom, 0px));
		left: 0;
		right: 0;
		z-index: 89; /* Below InputBar (90) */
		display: flex;
		justify-content: center;
		padding: 0.5rem 1rem;
	}

	.toolbar-content {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem 1rem;
		background: hsl(var(--color-surface) / 0.92);
		backdrop-filter: blur(16px);
		-webkit-backdrop-filter: blur(16px);
		border: 1px solid hsl(var(--color-border));
		box-shadow: 0 -2px 16px hsl(var(--color-foreground) / 0.08);
		border-radius: 1rem;
		white-space: nowrap;
		max-width: calc(100vw - 2rem);
		/* Allow dropdowns to overflow */
		overflow: visible;
	}

	/* Glass styling */
	.glass-pill {
		background: hsl(var(--color-surface) / 0.85);
		backdrop-filter: blur(12px);
		-webkit-backdrop-filter: blur(12px);
		border: 1px solid hsl(var(--color-border));
		box-shadow: 0 2px 8px hsl(var(--color-foreground) / 0.08);
		border-radius: 9999px;
	}

	.glass-panel {
		background: transparent;
	}

	/* FAB Button - same height as InputBar (54px) */
	.toolbar-fab {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 54px;
		height: 54px;
		cursor: pointer;
		border: none;
		transition: all 0.2s ease;
		pointer-events: auto;
	}

	.toolbar-fab:hover {
		transform: scale(1.05);
		box-shadow: 0 4px 12px hsl(var(--color-foreground) / 0.15);
	}

	.toolbar-fab.active {
		background: hsl(var(--color-muted));
	}

	.toolbar-divider {
		width: 1px;
		height: 1.5rem;
		background: hsl(var(--color-border));
		margin: 0 0.25rem;
	}
</style>
