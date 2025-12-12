<script lang="ts">
	import { PillToolbar, PillToolbarDivider } from '@manacore/shared-ui';
	import CalendarToolbarContent from './CalendarToolbarContent.svelte';

	interface Props {
		isSidebarMode?: boolean;
		isCollapsed?: boolean;
		onModeChange?: (isSidebar: boolean) => void;
		onCollapsedChange?: (isCollapsed: boolean) => void;
	}

	let {
		isSidebarMode = false,
		isCollapsed = false,
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
</script>

{#if !isCollapsed}
	<PillToolbar position="bottom" bottomOffset={isSidebarMode ? '0px' : '70px'}>
		<CalendarToolbarContent />

		<PillToolbarDivider />

		<!-- Layout Control -->
		<div class="segmented-control glass-pill">
			<button onclick={collapseToolbar} class="segment-btn" title="Toolbar minimieren">
				<svg class="segment-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
				</svg>
			</button>
			<div class="segment-divider"></div>
			<button
				onclick={toggleSidebarMode}
				class="segment-btn"
				title={isSidebarMode ? 'Zur Bottom-Navigation' : 'Zur Sidebar-Navigation'}
			>
				<svg class="segment-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
	</PillToolbar>
{/if}

<!-- FAB for collapsed state -->
{#if isCollapsed}
	<button
		onclick={expandToolbar}
		class="toolbar-fab glass-pill"
		class:sidebar-mode={isSidebarMode}
		title="Toolbar anzeigen"
	>
		<svg class="fab-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
			<path
				stroke-linecap="round"
				stroke-linejoin="round"
				stroke-width="2"
				d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
			/>
		</svg>
	</button>
{/if}

<style>
	.segmented-control {
		display: flex;
		align-items: center;
		padding: 0.125rem;
		gap: 0;
	}

	.glass-pill {
		background: rgba(255, 255, 255, 0.85);
		backdrop-filter: blur(12px);
		-webkit-backdrop-filter: blur(12px);
		border: 1px solid rgba(0, 0, 0, 0.1);
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
		border-radius: 9999px;
	}

	:global(.dark) .glass-pill {
		background: rgba(255, 255, 255, 0.12);
		border: 1px solid rgba(255, 255, 255, 0.15);
	}

	.segment-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 0.375rem;
		background: transparent;
		border: none;
		cursor: pointer;
		color: hsl(var(--color-muted-foreground));
		border-radius: 9999px;
		transition: all 0.15s ease;
	}

	.segment-btn:hover {
		background: rgba(0, 0, 0, 0.05);
		color: hsl(var(--color-foreground));
	}

	:global(.dark) .segment-btn:hover {
		background: rgba(255, 255, 255, 0.1);
	}

	.segment-divider {
		width: 1px;
		height: 1rem;
		background: rgba(0, 0, 0, 0.1);
		margin: 0 0.125rem;
	}

	:global(.dark) .segment-divider {
		background: rgba(255, 255, 255, 0.15);
	}

	.segment-icon {
		width: 1rem;
		height: 1rem;
	}

	/* FAB for collapsed state - positioned right, above PillNav FAB */
	.toolbar-fab {
		position: fixed;
		bottom: calc(56px + env(safe-area-inset-bottom, 0px)); /* Above PillNav FAB */
		right: 0;
		z-index: 1000;
		display: flex;
		align-items: center;
		justify-content: center;
		width: 2.5rem;
		height: 2.5rem;
		cursor: pointer;
		border: none;
		border-radius: 9999px 0 0 9999px;
		transition: all 0.3s ease;
	}

	.toolbar-fab.sidebar-mode {
		bottom: calc(56px + env(safe-area-inset-bottom, 0px));
	}

	.toolbar-fab:hover {
		transform: scale(1.05);
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
	}

	.fab-icon {
		width: 1.25rem;
		height: 1.25rem;
		color: hsl(var(--color-muted-foreground));
	}

	.toolbar-fab:hover .fab-icon {
		color: hsl(var(--color-foreground));
	}
</style>
