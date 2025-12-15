<script lang="ts">
	import type { CalendarEvent } from '@calendar/shared';
	import { eventsStore } from '$lib/stores/events.svelte';
	import { _ } from 'svelte-i18n';

	interface Props {
		event: CalendarEvent;
		style: string;
		color: string;
		isDragging?: boolean;
		isResizing?: boolean;
		isDraggingSource?: boolean;
		isSearchHighlighted?: boolean;
		isSearchDimmed?: boolean;
		formattedTime: string;
		onClick?: (event: CalendarEvent, e: MouseEvent) => void;
		onPointerDown?: (event: CalendarEvent, e: PointerEvent) => void;
		onContextMenu?: (event: CalendarEvent, e: MouseEvent) => void;
		onResizeStart?: (event: CalendarEvent, edge: 'top' | 'bottom', e: PointerEvent) => void;
	}

	let {
		event,
		style,
		color,
		isDragging = false,
		isResizing = false,
		isDraggingSource = false,
		isSearchHighlighted = false,
		isSearchDimmed = false,
		formattedTime,
		onClick,
		onPointerDown,
		onContextMenu,
		onResizeStart,
	}: Props = $props();

	let isDraft = $derived(eventsStore.isDraftEvent(event.id));

	function handleClick(e: MouseEvent) {
		if (isDragging || isResizing || isDraft) {
			e.preventDefault();
			e.stopPropagation();
			return;
		}
		onClick?.(event, e);
	}

	function handlePointerDown(e: PointerEvent) {
		onPointerDown?.(event, e);
	}

	function handleContextMenu(e: MouseEvent) {
		e.preventDefault();
		e.stopPropagation();
		if (isDraft) return;
		onContextMenu?.(event, e);
	}

	function handleResizeTop(e: PointerEvent) {
		e.stopPropagation();
		onResizeStart?.(event, 'top', e);
	}

	function handleResizeBottom(e: PointerEvent) {
		e.stopPropagation();
		onResizeStart?.(event, 'bottom', e);
	}

	function handleKeydown(e: KeyboardEvent) {
		if ((e.key === 'Enter' || e.key === ' ') && !isDraft) {
			e.preventDefault();
			onClick?.(event, e as unknown as MouseEvent);
		}
	}
</script>

<div
	class="event-card"
	class:dragging={isDragging && !isDraggingSource}
	class:dragging-source={isDraggingSource}
	class:resizing={isResizing}
	class:draft={isDraft}
	class:search-highlighted={isSearchHighlighted}
	class:search-dimmed={isSearchDimmed}
	data-event-id={event.id}
	{style}
	style:background-color={color}
	role="button"
	tabindex="0"
	aria-label={event.title || $_('calendar.draftEvent')}
	onpointerdown={handlePointerDown}
	onclick={handleClick}
	onkeydown={handleKeydown}
	oncontextmenu={handleContextMenu}
>
	<!-- Top resize handle -->
	{#if onResizeStart}
		<div
			class="resize-handle top"
			onpointerdown={handleResizeTop}
			role="slider"
			aria-label={$_('event.changeStartTime')}
			aria-valuenow={0}
			tabindex="-1"
		></div>
	{/if}

	<span class="event-time">{formattedTime}</span>
	<span class="event-title">{event.title || (isDraft ? $_('calendar.draftEvent') : '')}</span>
	{#if event.location}
		<span class="event-location">{event.location}</span>
	{/if}

	<!-- Bottom resize handle -->
	{#if onResizeStart}
		<div
			class="resize-handle bottom"
			onpointerdown={handleResizeBottom}
			role="slider"
			aria-label={$_('event.changeEndTime')}
			aria-valuenow={0}
			tabindex="-1"
		></div>
	{/if}
</div>

<style>
	.event-card {
		position: absolute;
		left: 2px;
		right: 2px;
		padding: 2px 4px;
		border-radius: var(--radius-sm);
		text-align: left;
		cursor: grab;
		z-index: 1;
		overflow: hidden;
		transition:
			box-shadow 0.15s ease,
			opacity 0.15s ease;
		touch-action: none;
		user-select: none;
		color: white;
	}

	.event-card:hover {
		box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
	}

	.event-card:focus-visible {
		outline: 2px solid hsl(var(--color-primary));
		outline-offset: 1px;
	}

	.event-card.dragging {
		cursor: grabbing;
		opacity: 0.9;
		box-shadow: 0 8px 16px rgba(0, 0, 0, 0.3);
		z-index: 100;
	}

	.event-card.resizing {
		opacity: 0.85;
		z-index: 100;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25);
		outline: 2px dashed hsl(var(--color-primary) / 0.6);
		outline-offset: -2px;
	}

	/* Ghost style for source position during cross-day drag */
	.event-card.dragging-source {
		opacity: 0.4;
		background: transparent !important;
		border: 2px dashed hsl(var(--color-border));
		pointer-events: none;
	}

	.event-card.dragging-source .event-title,
	.event-card.dragging-source .event-time,
	.event-card.dragging-source .event-location {
		opacity: 0.5;
	}

	.event-card.draft {
		border: 2px dashed hsl(var(--color-primary) / 0.6);
		background-color: hsl(var(--color-primary) / 0.3) !important;
	}

	.event-card.search-highlighted {
		outline: 2px solid hsl(var(--color-primary));
		outline-offset: 1px;
		box-shadow: 0 0 0 3px hsl(var(--color-primary) / 0.3);
	}

	.event-card.search-dimmed {
		opacity: 0.35;
		filter: grayscale(0.3);
	}

	.event-time {
		display: block;
		font-size: 0.6rem;
		opacity: 0.9;
	}

	.event-title {
		display: block;
		font-size: 0.7rem;
		font-weight: 500;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.event-location {
		display: block;
		font-size: 0.6rem;
		opacity: 0.85;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	/* Resize handles */
	.resize-handle {
		position: absolute;
		left: 0;
		right: 0;
		height: 8px;
		cursor: ns-resize;
		opacity: 0;
		transition: opacity 0.15s ease;
		z-index: 2;
	}

	.resize-handle.top {
		top: 0;
		border-radius: var(--radius-sm) var(--radius-sm) 0 0;
	}

	.resize-handle.bottom {
		bottom: 0;
		border-radius: 0 0 var(--radius-sm) var(--radius-sm);
	}

	.event-card:hover .resize-handle {
		opacity: 1;
		background: rgba(255, 255, 255, 0.3);
	}
</style>
