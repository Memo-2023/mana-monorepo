<script lang="ts">
	import { slide } from 'svelte/transition';
	import CalendarToolbarContent from './CalendarToolbarContent.svelte';

	interface Props {
		isSidebarMode?: boolean;
		isCollapsed?: boolean;
		onModeChange?: (isSidebar: boolean) => void;
		onCollapsedChange?: (isCollapsed: boolean) => void;
	}

	let {
		isSidebarMode = false,
		isCollapsed = true, // Default to collapsed
		onModeChange,
		onCollapsedChange,
	}: Props = $props();

	function toggleSidebarMode() {
		onModeChange?.(!isSidebarMode);
	}

	function toggleToolbar() {
		onCollapsedChange?.(!isCollapsed);
	}
</script>

<!-- FAB Button - positioned next to InputBar -->
<div class="fab-container" class:sidebar-mode={isSidebarMode} class:expanded={!isCollapsed}>
	<button
		onclick={toggleToolbar}
		class="toolbar-fab glass-pill"
		class:active={!isCollapsed}
		title={isCollapsed ? 'Kalender-Optionen' : 'Schließen'}
	>
		<svg class="fab-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
			{#if isCollapsed}
				<!-- Settings/sliders icon -->
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
				/>
			{:else}
				<!-- Chevron down icon -->
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
			{/if}
		</svg>
	</button>
</div>

<!-- Expanded Toolbar Panel - below InputBar, pushes content up -->
{#if !isCollapsed}
	<div
		class="toolbar-bar glass-panel"
		class:sidebar-mode={isSidebarMode}
		transition:slide={{ duration: 200 }}
	>
		<div class="toolbar-content">
			<CalendarToolbarContent />

			<div class="toolbar-divider"></div>

			<!-- Layout Control -->
			<button
				onclick={toggleSidebarMode}
				class="layout-btn"
				title={isSidebarMode ? 'Zur Bottom-Navigation' : 'Zur Sidebar-Navigation'}
			>
				<svg class="layout-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					{#if isSidebarMode}
						<!-- Bottom bar layout icon -->
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M3 3h18v9H3V3zm0 12h18v6H3v-6z"
						/>
					{:else}
						<!-- Sidebar layout icon -->
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M3 3h7v18H3V3zm9 0h9v18h-9V3z"
						/>
					{/if}
				</svg>
			</button>
		</div>
	</div>
{/if}

<style>
	/* FAB Container - positioned next to InputBar (aligned with input-container) */
	.fab-container {
		position: fixed;
		bottom: calc(
			70px + 9px + env(safe-area-inset-bottom, 0px)
		); /* 70px offset + 9px to align with input-container */
		right: calc(50% - 350px - 70px); /* Right of InputBar (max-width 700px / 2 + gap) */
		z-index: 91; /* Above InputBar (90) */
		pointer-events: none;
		transition: bottom 0.2s ease;
	}

	/* When expanded, move FAB up with InputBar */
	.fab-container.expanded {
		bottom: calc(130px + 9px + env(safe-area-inset-bottom, 0px));
	}

	.fab-container.sidebar-mode {
		bottom: calc(0px + 9px + env(safe-area-inset-bottom, 0px));
	}

	.fab-container.sidebar-mode.expanded {
		bottom: calc(60px + 9px + env(safe-area-inset-bottom, 0px));
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
		bottom: calc(70px + env(safe-area-inset-bottom, 0px));
		left: 0;
		right: 0;
		z-index: 89; /* Below InputBar (90) */
		display: flex;
		justify-content: center;
		padding: 0.5rem 1rem;
		padding-top: 8rem; /* Space between InputBar and toolbar (~128px) */
	}

	.toolbar-bar.sidebar-mode {
		bottom: calc(0px + env(safe-area-inset-bottom, 0px));
	}

	.toolbar-content {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem 1rem;
		background: rgba(255, 255, 255, 0.92);
		backdrop-filter: blur(16px);
		-webkit-backdrop-filter: blur(16px);
		border: 1px solid rgba(0, 0, 0, 0.1);
		box-shadow: 0 -2px 16px rgba(0, 0, 0, 0.08);
		border-radius: 1rem;
		white-space: nowrap;
	}

	:global(.dark) .toolbar-content {
		background: rgba(30, 30, 30, 0.92);
		border: 1px solid rgba(255, 255, 255, 0.15);
	}

	/* Glass styling */
	.glass-pill {
		background: rgba(255, 255, 255, 0.85);
		backdrop-filter: blur(12px);
		-webkit-backdrop-filter: blur(12px);
		border: 1px solid rgba(0, 0, 0, 0.1);
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
		border-radius: 9999px;
	}

	:global(.dark) .glass-pill {
		background: rgba(255, 255, 255, 0.12);
		border: 1px solid rgba(255, 255, 255, 0.15);
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
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
	}

	.toolbar-fab.active {
		background: #3b82f6;
		border-color: #3b82f6;
	}

	.toolbar-fab.active .fab-icon {
		color: white;
	}

	.fab-icon {
		width: 1.5rem;
		height: 1.5rem;
		color: hsl(var(--color-muted-foreground));
		transition: color 0.2s ease;
	}

	.toolbar-fab:hover .fab-icon {
		color: hsl(var(--color-foreground));
	}

	.toolbar-divider {
		width: 1px;
		height: 1.5rem;
		background: rgba(0, 0, 0, 0.1);
		margin: 0 0.25rem;
	}

	:global(.dark) .toolbar-divider {
		background: rgba(255, 255, 255, 0.15);
	}

	/* Layout toggle button */
	.layout-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 0.5rem;
		background: transparent;
		border: none;
		cursor: pointer;
		color: hsl(var(--color-muted-foreground));
		border-radius: 9999px;
		transition: all 0.15s ease;
	}

	.layout-btn:hover {
		background: rgba(0, 0, 0, 0.05);
		color: hsl(var(--color-foreground));
	}

	:global(.dark) .layout-btn:hover {
		background: rgba(255, 255, 255, 0.1);
	}

	.layout-icon {
		width: 1rem;
		height: 1rem;
	}
</style>
