<script lang="ts">
	import { viewStore } from '$lib/stores/view.svelte';
	import { settingsStore } from '$lib/stores/settings.svelte';
	import type { CalendarViewType } from '@calendar/shared';
	interface Props {
		isToolbarExpanded?: boolean;
		isMobile?: boolean;
	}

	let { isToolbarExpanded = false, isMobile = false }: Props = $props();

	function handleViewClick(view: CalendarViewType) {
		viewStore.setViewType(view);
	}

	// View labels (short versions for pill)
	const viewLabels: Record<CalendarViewType, string> = {
		week: '7',
		month: 'M',
		agenda: 'A',
	};

	// View titles for tooltip
	const viewTitles: Record<CalendarViewType, string> = {
		week: 'Wochenansicht',
		month: 'Monatsansicht',
		agenda: 'Agenda',
	};

	// Get enabled views from settings
	let enabledViews = $derived(settingsStore.quickViewPillViews);
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div class="view-mode-pill" class:toolbar-expanded={isToolbarExpanded} class:mobile={isMobile}>
	{#each enabledViews as view}
		<button
			type="button"
			class="view-btn"
			class:active={viewStore.viewType === view}
			onclick={() => handleViewClick(view)}
			title={viewTitles[view]}
		>
			{#if view === 'week'}
				<svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						stroke-linecap="round"
						stroke-width="2"
						d="M3 4v16M6.5 4v16M10 4v16M13.5 4v16M17 4v16M20.5 4v16M24 4v16"
					/>
				</svg>
			{:else if view === 'month'}
				<svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<rect x="3" y="4" width="18" height="16" rx="2" stroke-width="2" />
					<path stroke-linecap="round" stroke-width="2" d="M3 9h18M8 4v4M16 4v4" />
					<path
						stroke-linecap="round"
						stroke-width="1.5"
						d="M7 13h2M11 13h2M15 13h2M7 17h2M11 17h2"
					/>
				</svg>
			{:else if view === 'agenda'}
				<svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h12" />
				</svg>
			{/if}
		</button>
	{/each}
</div>

<style>
	.view-mode-pill {
		position: fixed;
		/* Same vertical alignment as FAB */
		bottom: calc(70px + 9px + env(safe-area-inset-bottom, 0px));
		/* Position left of the Toolbar FAB (which is at right: calc(50% - 350px - 70px)) */
		/* FAB position + FAB width (54px) + gap (8px) = left of FAB */
		right: calc(50% - 350px - 70px + 54px + 8px);
		z-index: 91;
		display: flex;
		align-items: center;
		gap: 0.125rem;
		padding: 0.375rem;
		background: hsl(var(--color-surface) / 0.85);
		backdrop-filter: blur(12px);
		-webkit-backdrop-filter: blur(12px);
		border: 1px solid hsl(var(--color-border));
		border-radius: 9999px;
		box-shadow: 0 2px 8px hsl(var(--color-foreground) / 0.08);
		transition: bottom 0.2s ease;
	}

	/* When toolbar is expanded, move pill up */
	.view-mode-pill.toolbar-expanded {
		bottom: calc(140px + 9px + env(safe-area-inset-bottom, 0px));
	}

	/* Responsive - on smaller screens, FAB is at right: 1rem */
	@media (max-width: 900px) {
		.view-mode-pill {
			right: calc(1rem + 54px + 8px);
		}
	}

	/* Mobile: ViewModePill moves above InputBar as its own row */
	/* InputBar is at bottom: 70px (above PillNav), so controls go above that */
	.view-mode-pill.mobile {
		/* Position centered above InputBar */
		right: auto;
		left: 50%;
		transform: translateX(-50%);
		/* Above PillNav (70px) + InputBar (72px) + gap (8px) */
		bottom: calc(70px + 72px + 8px + env(safe-area-inset-bottom, 0px));
	}

	.view-mode-pill.mobile.toolbar-expanded {
		/* Move up when toolbar is expanded (add toolbar height 70px) */
		bottom: calc(70px + 72px + 70px + 8px + env(safe-area-inset-bottom, 0px));
	}

	/* Fallback for CSS-only mobile detection */
	@media (max-width: 640px) {
		.view-mode-pill:not(.mobile) {
			/* Position centered above InputBar */
			right: auto;
			left: 50%;
			transform: translateX(-50%);
			/* Above PillNav (70px) + InputBar (72px) + gap (8px) */
			bottom: calc(70px + 72px + 8px + env(safe-area-inset-bottom, 0px));
		}

		.view-mode-pill:not(.mobile).toolbar-expanded {
			/* Move up when toolbar is expanded (add toolbar height 70px) */
			bottom: calc(70px + 72px + 70px + 8px + env(safe-area-inset-bottom, 0px));
		}
	}

	.view-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 2rem;
		height: 2rem;
		padding: 0.375rem;
		background: transparent;
		border: none;
		border-radius: 9999px;
		cursor: pointer;
		color: hsl(var(--color-muted-foreground));
		transition: all 0.15s ease;
	}

	.view-btn:hover {
		background: hsl(var(--color-muted) / 0.5);
		color: hsl(var(--color-foreground));
	}

	.view-btn.active {
		background: color-mix(in srgb, #3b82f6 15%, transparent 85%);
		color: #3b82f6;
	}

	.view-btn :global(svg) {
		width: 1.125rem;
		height: 1.125rem;
	}

	.view-text {
		font-size: 0.75rem;
		font-weight: 600;
	}
</style>
