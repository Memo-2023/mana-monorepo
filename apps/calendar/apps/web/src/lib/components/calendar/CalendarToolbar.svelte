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

	function collapseToolbar() {
		onCollapsedChange?.(true);
	}

	function expandToolbar() {
		onCollapsedChange?.(false);
	}

	function toggleToolbar() {
		onCollapsedChange?.(!isCollapsed);
	}
</script>

<!-- Toolbar Container - positioned next to InputBar -->
<div class="toolbar-container" class:sidebar-mode={isSidebarMode}>
	<!-- FAB Button (always visible) -->
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
				<!-- Close icon -->
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M6 18L18 6M6 6l12 12"
				/>
			{/if}
		</svg>
	</button>

	<!-- Expanded Toolbar Panel (opens above) -->
	{#if !isCollapsed}
		<div class="toolbar-panel glass-panel" transition:slide={{ duration: 200 }}>
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
	{/if}
</div>

<style>
	/* Container positioned next to InputBar */
	.toolbar-container {
		position: fixed;
		bottom: calc(70px + env(safe-area-inset-bottom, 0px));
		right: calc(50% - 350px - 60px); /* Right of InputBar (max-width 700px / 2 + gap) */
		z-index: 91; /* Above InputBar (90) */
		display: flex;
		flex-direction: column;
		align-items: flex-end;
		gap: 0.5rem;
		pointer-events: none;
	}

	.toolbar-container.sidebar-mode {
		bottom: calc(0px + env(safe-area-inset-bottom, 0px));
	}

	/* Responsive positioning */
	@media (max-width: 900px) {
		.toolbar-container {
			right: 1rem;
		}
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
		background: rgba(255, 255, 255, 0.92);
		backdrop-filter: blur(16px);
		-webkit-backdrop-filter: blur(16px);
		border: 1px solid rgba(0, 0, 0, 0.1);
		box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
		border-radius: 1rem;
	}

	:global(.dark) .glass-panel {
		background: rgba(30, 30, 30, 0.92);
		border: 1px solid rgba(255, 255, 255, 0.15);
	}

	/* FAB Button */
	.toolbar-fab {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 2.75rem;
		height: 2.75rem;
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
		width: 1.25rem;
		height: 1.25rem;
		color: hsl(var(--color-muted-foreground));
		transition: color 0.2s ease;
	}

	.toolbar-fab:hover .fab-icon {
		color: hsl(var(--color-foreground));
	}

	/* Toolbar Panel (opens above FAB) */
	.toolbar-panel {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem 0.75rem;
		pointer-events: auto;
		white-space: nowrap;
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
