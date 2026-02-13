<script lang="ts">
	import { settingsStore } from '$lib/stores/settings.svelte';
	import { format } from 'date-fns';
	import { de } from 'date-fns/locale';
	import DateStripContextMenu from './DateStripContextMenu.svelte';

	interface Props {
		isToolbarExpanded?: boolean;
		isMobile?: boolean;
	}

	let { isToolbarExpanded = false, isMobile = false }: Props = $props();

	let contextMenu: DateStripContextMenu;

	function handleClick() {
		settingsStore.set('dateStripCollapsed', false);
	}

	function handleContextMenu(e: MouseEvent) {
		e.preventDefault();
		contextMenu?.show(e.clientX, e.clientY);
	}

	// Format current date for FAB display: "Dez 14"
	let fabLabel = $derived(format(new Date(), 'MMM d', { locale: de }));
</script>

<div
	class="datestrip-fab-container"
	class:toolbar-expanded={isToolbarExpanded}
	class:mobile={isMobile}
>
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<button
		onclick={handleClick}
		oncontextmenu={handleContextMenu}
		class="datestrip-fab"
		title="Datumsleiste erweitern (Rechtsklick für Optionen)"
	>
		<span class="fab-label">{fabLabel}</span>
	</button>
</div>

<DateStripContextMenu bind:this={contextMenu} />

<style>
	.datestrip-fab-container {
		position: fixed;
		bottom: calc(70px + 9px + env(safe-area-inset-bottom, 0px));
		/* Position left of InputBar: center (50%) minus half of InputBar (225px) minus gap (8px) minus fab width (54px) */
		left: calc(50% - 225px - 8px - 54px);
		z-index: 49;
		pointer-events: none;
		transition:
			bottom 0.2s ease,
			left 0.2s ease;
	}

	.datestrip-fab-container.toolbar-expanded {
		bottom: calc(140px + 9px + env(safe-area-inset-bottom, 0px));
	}

	@media (max-width: 900px) {
		.datestrip-fab-container {
			left: 1rem;
		}
	}

	/* Mobile: Position in row above InputBar, left of ViewModePill */
	/* InputBar is at bottom: 70px (above PillNav), so controls go above that */
	.datestrip-fab-container.mobile {
		/* Above PillNav (70px) + InputBar (72px) + gap (8px), to the left of center */
		bottom: calc(70px + 72px + 8px + env(safe-area-inset-bottom, 0px));
		left: calc(50% - 100px - 54px - 8px);
	}

	.datestrip-fab-container.mobile.toolbar-expanded {
		bottom: calc(70px + 72px + 70px + 8px + env(safe-area-inset-bottom, 0px));
	}

	/* Fallback for CSS-only mobile detection */
	@media (max-width: 640px) {
		.datestrip-fab-container:not(.mobile) {
			/* Above PillNav (70px) + InputBar (72px) + gap (8px), to the left of center */
			bottom: calc(70px + 72px + 8px + env(safe-area-inset-bottom, 0px));
			left: calc(50% - 100px - 54px - 8px);
		}

		.datestrip-fab-container:not(.mobile).toolbar-expanded {
			bottom: calc(70px + 72px + 70px + 8px + env(safe-area-inset-bottom, 0px));
		}
	}

	.datestrip-fab {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		min-width: 54px;
		height: 54px;
		padding: 0 0.75rem;
		cursor: pointer;
		border: none;
		transition: all 0.2s ease;
		pointer-events: auto;
		background: hsl(var(--color-surface) / 0.85);
		backdrop-filter: blur(12px);
		-webkit-backdrop-filter: blur(12px);
		border: 1px solid hsl(var(--color-border));
		box-shadow: 0 2px 8px hsl(var(--color-foreground) / 0.08);
		border-radius: 9999px;
	}

	.datestrip-fab:hover {
		transform: scale(1.05);
		box-shadow: 0 4px 12px hsl(var(--color-foreground) / 0.15);
	}

	.fab-label {
		font-size: 0.875rem;
		font-weight: 600;
		color: hsl(var(--color-foreground));
		white-space: nowrap;
	}
</style>
