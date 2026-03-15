<script lang="ts">
	import { viewStore } from '$lib/stores/view.svelte';
	import { settingsStore } from '$lib/stores/settings.svelte';
	import type { CalendarViewType } from '@calendar/shared';
	interface Props {
		/** Bottom offset from viewport bottom (default: '70px') */
		bottomOffset?: string;
	}

	let { bottomOffset = '70px' }: Props = $props();

	function handleViewClick(view: CalendarViewType) {
		viewStore.setViewType(view);
	}

	// View labels
	const viewLabels: Record<CalendarViewType, string> = {
		week: '7',
		month: 'M',
		agenda: 'L',
	};

	// View titles for tooltip
	const viewTitles: Record<CalendarViewType, string> = {
		week: 'Wochenansicht',
		month: 'Monatsansicht',
		agenda: 'Agenda',
	};

	// Get enabled views from settings
	let enabledViews = $derived(settingsStore.quickViewPillViews);

	// Get label for a view
	function getViewLabel(view: CalendarViewType): string {
		return viewLabels[view] || '';
	}

	// Get title for a view
	function getViewTitle(view: CalendarViewType): string {
		return viewTitles[view] || '';
	}
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div class="views-bar" style="--bottom-offset: {bottomOffset}">
	<div class="views-container">
		<div class="views-icon">
			<svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z"
				/>
			</svg>
		</div>

		<div class="views-buttons">
			{#each enabledViews as view}
				<button
					type="button"
					class="view-btn"
					class:active={viewStore.viewType === view}
					onclick={() => handleViewClick(view)}
					title={getViewTitle(view)}
				>
					{getViewLabel(view)}
				</button>
			{/each}
		</div>
	</div>
</div>

<style>
	.views-bar {
		position: fixed;
		bottom: calc(var(--bottom-offset, 70px) + env(safe-area-inset-bottom, 0px));
		z-index: 90;
		padding: 0.75rem 0;
		pointer-events: none;
		height: 72px;
		transition: bottom 0.3s ease;
		display: flex;
		/* Desktop: Position left of InputBar (InputBar has max-width 700px, centered) */
		/* ViewsBar ends at left edge of InputBar with a gap */
		right: calc(50% + 350px + 8px); /* InputBar center + half width + gap */
		left: auto;
	}

	.views-container {
		pointer-events: auto;
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.75rem 1.25rem;
		background: hsl(var(--color-surface) / 0.85);
		backdrop-filter: blur(12px);
		-webkit-backdrop-filter: blur(12px);
		border: 1px solid hsl(var(--color-border));
		border-radius: 9999px;
		box-shadow:
			0 4px 6px -1px hsl(var(--color-foreground) / 0.1),
			0 2px 4px -1px hsl(var(--color-foreground) / 0.06);
		transition: all 0.2s ease;
		height: 54px;
	}

	.views-icon {
		width: 1.25rem;
		height: 1.25rem;
		color: hsl(var(--color-muted-foreground));
		flex-shrink: 0;
	}

	.views-icon svg {
		width: 100%;
		height: 100%;
	}

	.views-buttons {
		display: flex;
		align-items: center;
		gap: 0.25rem;
	}

	.view-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		min-width: 2rem;
		height: 2rem;
		padding: 0 0.5rem;
		background: transparent;
		border: none;
		border-radius: 9999px;
		cursor: pointer;
		color: hsl(var(--color-muted-foreground));
		font-size: 0.875rem;
		font-weight: 500;
		transition: all 0.15s ease;
	}

	.view-btn:hover {
		background: hsl(var(--color-muted) / 0.5);
		color: hsl(var(--color-foreground));
	}

	.view-btn.active {
		background: hsl(var(--color-primary) / 0.15);
		color: hsl(var(--color-primary));
	}

	/* Tablet: Position left with fixed margin */
	@media (max-width: 900px) {
		.views-bar {
			right: auto;
			left: 1rem;
		}
	}

	/* Mobile: Center above InputBar */
	@media (max-width: 640px) {
		.views-bar {
			/* Position above the InputBar - centered */
			bottom: calc(var(--bottom-offset, 70px) + 72px + env(safe-area-inset-bottom, 0px));
			left: 0;
			right: 0;
			justify-content: center;
			padding: 0.75rem 1rem;
		}
	}
</style>
