<script lang="ts">
	import { ExpandableToolbar } from '@manacore/shared-ui';
	import CalendarToolbarContent from './CalendarToolbarContent.svelte';

	interface Props {
		isSidebarMode?: boolean;
		isCollapsed?: boolean;
		isMobile?: boolean;
		bottomOffset?: string;
		onModeChange?: (isSidebar: boolean) => void;
		onCollapsedChange?: (isCollapsed: boolean) => void;
	}

	let {
		isSidebarMode = false,
		isCollapsed = true,
		isMobile = false,
		bottomOffset = '70px',
		onModeChange,
		onCollapsedChange,
	}: Props = $props();

	function toggleSidebarMode() {
		onModeChange?.(!isSidebarMode);
	}
</script>

<ExpandableToolbar
	{isCollapsed}
	{onCollapsedChange}
	{isSidebarMode}
	{bottomOffset}
	collapsedTitle="Kalender-Optionen"
	expandedTitle="Schließen"
>
	<CalendarToolbarContent />

	{#snippet rightActions()}
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
	{/snippet}
</ExpandableToolbar>

<style>
	/* Layout toggle button - app-specific style */
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
