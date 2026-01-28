<script lang="ts">
	import { viewStore } from '$lib/stores/view.svelte';
	import { eventsStore } from '$lib/stores/events.svelte';
	import { settingsStore } from '$lib/stores/settings.svelte';
	import {
		format,
		startOfMonth,
		endOfMonth,
		startOfWeek,
		endOfWeek,
		eachDayOfInterval,
		isSameMonth,
		isToday,
		setHours,
		setMinutes,
	} from 'date-fns';
	import { de } from 'date-fns/locale';
	import { toDate } from '$lib/utils/eventDateHelpers';
	import { filterByTags } from '$lib/utils/eventFiltering';
	import type { CalendarViewType, CalendarEvent } from '@calendar/shared';

	interface Props {
		/** Optional date override for carousel navigation (uses viewStore.currentDate if not provided) */
		date?: Date;
		onQuickCreate?: (date: Date, position: { x: number; y: number }) => void;
		onEventClick?: (event: CalendarEvent) => void;
	}

	let { date, onQuickCreate, onEventClick }: Props = $props();

	// Use provided date or fall back to viewStore
	let effectiveDate = $derived(date ?? viewStore.currentDate);

	// Derived values
	let year = $derived(effectiveDate.getFullYear());

	let months = $derived(Array.from({ length: 12 }, (_, i) => new Date(year, i, 1)));

	// Week day headers
	const weekDaysFromMonday = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];
	const weekDaysFromSunday = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];
	let weekDays = $derived(
		settingsStore.weekStartsOn === 1 ? weekDaysFromMonday : weekDaysFromSunday
	);

	// Context menu state
	let contextMenu = $state<{ visible: boolean; x: number; y: number; date: Date | null }>({
		visible: false,
		x: 0,
		y: 0,
		date: null,
	});

	// Context menu options
	const viewOptions: { type: CalendarViewType; label: string }[] = [
		{ type: 'day', label: 'Tagesansicht' },
		{ type: 'week', label: 'Wochenansicht' },
		{ type: 'month', label: 'Monatsansicht' },
	];

	// Precompute event counts for performance
	let eventCountsByDay = $derived.by(() => {
		const counts = new Map<string, number>();
		let events = eventsStore.events ?? [];

		// Apply tag filter if tags are selected
		events = filterByTags(events, settingsStore.selectedTagIds);

		for (const event of events) {
			const start = toDate(event.startTime);
			const key = format(start, 'yyyy-MM-dd');
			counts.set(key, (counts.get(key) || 0) + 1);
		}

		return counts;
	});

	// Helper functions
	function getMonthDays(month: Date): Date[] {
		const monthStart = startOfMonth(month);
		const monthEnd = endOfMonth(month);
		const calendarStart = startOfWeek(monthStart, {
			weekStartsOn: settingsStore.weekStartsOn,
		});
		const calendarEnd = endOfWeek(monthEnd, {
			weekStartsOn: settingsStore.weekStartsOn,
		});

		return eachDayOfInterval({ start: calendarStart, end: calendarEnd });
	}

	function getEventCount(day: Date): number {
		const key = format(day, 'yyyy-MM-dd');
		return eventCountsByDay.get(key) || 0;
	}

	// Event handlers
	function handleDayClick(day: Date, e: MouseEvent) {
		if (onQuickCreate) {
			const startTime = setMinutes(setHours(day, 9), 0);
			onQuickCreate(startTime, { x: e.clientX, y: e.clientY });
		} else {
			viewStore.setDate(day);
			viewStore.setViewType('day');
		}
	}

	function handleDayContextMenu(day: Date, e: MouseEvent) {
		e.preventDefault();
		contextMenu = {
			visible: true,
			x: e.clientX,
			y: e.clientY,
			date: day,
		};
	}

	function handleContextMenuSelect(viewType: CalendarViewType) {
		if (contextMenu.date) {
			viewStore.setDate(contextMenu.date);
			viewStore.setViewType(viewType);
		}
		closeContextMenu();
	}

	function closeContextMenu() {
		contextMenu = { visible: false, x: 0, y: 0, date: null };
	}

	function handleMonthClick(month: Date) {
		viewStore.setDate(month);
		viewStore.setViewType('month');
	}

	function handleKeyDown(e: KeyboardEvent, day: Date) {
		if (e.key === 'Enter' || e.key === ' ') {
			e.preventDefault();
			handleDayClick(day, e as unknown as MouseEvent);
		}
	}

	// Close context menu on click outside
	function handleWindowClick() {
		if (contextMenu.visible) {
			closeContextMenu();
		}
	}

	// Close context menu on Escape
	function handleWindowKeyDown(e: KeyboardEvent) {
		if (e.key === 'Escape' && contextMenu.visible) {
			closeContextMenu();
		}
	}
</script>

<svelte:window onclick={handleWindowClick} onkeydown={handleWindowKeyDown} />

<div class="year-view" role="grid" aria-label="Jahresansicht {year}">
	{#each months as month}
		<div class="mini-month" role="gridcell">
			<button
				class="month-header"
				onclick={() => handleMonthClick(month)}
				aria-label="Gehe zu {format(month, 'MMMM yyyy', { locale: de })}"
			>
				{format(month, 'MMMM', { locale: de })}
			</button>

			<div class="weekday-row">
				{#each weekDays as day}
					<span class="weekday">{day}</span>
				{/each}
			</div>

			<div class="days-grid" role="grid" aria-label={format(month, 'MMMM', { locale: de })}>
				{#each getMonthDays(month) as day}
					{@const eventCount = getEventCount(day)}
					<button
						class="day"
						class:other-month={!isSameMonth(day, month)}
						class:today={isToday(day)}
						class:has-events={eventCount > 0}
						class:has-many-events={eventCount > 3}
						role="gridcell"
						tabindex="0"
						aria-label="{format(day, 'd. MMMM', { locale: de })}{eventCount > 0
							? `, ${eventCount} Termine`
							: ''}"
						onclick={(e) => handleDayClick(day, e)}
						oncontextmenu={(e) => handleDayContextMenu(day, e)}
						onkeydown={(e) => handleKeyDown(e, day)}
					>
						{format(day, 'd')}
					</button>
				{/each}
			</div>
		</div>
	{/each}
</div>

<!-- Context Menu -->
{#if contextMenu.visible && contextMenu.date}
	<div
		class="context-menu"
		style="left: {contextMenu.x}px; top: {contextMenu.y}px;"
		role="menu"
		aria-label="Ansicht wählen"
	>
		<div class="context-menu-header">
			{format(contextMenu.date, 'd. MMMM yyyy', { locale: de })}
		</div>
		{#each viewOptions as option}
			<button
				class="context-menu-item"
				role="menuitem"
				onclick={() => handleContextMenuSelect(option.type)}
			>
				{option.label}
			</button>
		{/each}
	</div>
{/if}

<style>
	.year-view {
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		gap: 1rem;
		padding: 1rem;
		padding-bottom: 8rem;
		height: 100%;
		overflow: auto;
	}

	.mini-month {
		background: hsl(var(--color-muted) / 0.3);
		border: 1px solid hsl(var(--color-border));
		border-radius: var(--radius-md);
		padding: 0.75rem;
	}

	.month-header {
		width: 100%;
		padding: 0.25rem 0.5rem;
		background: transparent;
		border: none;
		font-size: 0.875rem;
		font-weight: 600;
		color: hsl(var(--color-foreground));
		text-align: left;
		cursor: pointer;
		border-radius: var(--radius-sm);
		transition: background-color 150ms ease;
	}

	.month-header:hover {
		background: hsl(var(--color-muted));
	}

	.weekday-row {
		display: grid;
		grid-template-columns: repeat(7, 1fr);
		margin: 0.5rem 0 0.25rem 0;
	}

	.weekday {
		text-align: center;
		font-size: 0.6875rem;
		font-weight: 500;
		color: hsl(var(--color-muted-foreground));
	}

	.days-grid {
		display: grid;
		grid-template-columns: repeat(7, 1fr);
		gap: 2px;
	}

	.day {
		position: relative;
		aspect-ratio: 1;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 0.8125rem;
		border: none;
		background: transparent;
		border-radius: var(--radius-full);
		cursor: pointer;
		color: hsl(var(--color-foreground));
		transition: all 150ms ease;
	}

	.day:hover {
		background: hsl(var(--color-muted));
	}

	.day.other-month {
		color: hsl(var(--color-muted-foreground));
		opacity: 0.4;
	}

	.day.today {
		background: hsl(var(--color-primary));
		color: hsl(var(--color-primary-foreground));
		font-weight: 600;
	}

	.day.today:hover {
		background: hsl(var(--color-primary) / 0.8);
	}

	.day.has-events::after {
		content: '';
		position: absolute;
		bottom: 3px;
		width: 4px;
		height: 4px;
		border-radius: var(--radius-full);
		background: hsl(var(--color-primary));
	}

	.day.today.has-events::after {
		background: hsl(var(--color-primary-foreground));
	}

	.day.has-many-events::after {
		width: 8px;
		border-radius: 2px;
	}

	/* Context Menu */
	.context-menu {
		position: fixed;
		z-index: 100;
		min-width: 160px;
		background: hsl(var(--color-surface));
		border: 1px solid hsl(var(--color-border));
		border-radius: var(--radius-md);
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
		padding: 0.25rem;
		animation: context-menu-in 150ms ease;
	}

	@keyframes context-menu-in {
		from {
			opacity: 0;
			transform: scale(0.95);
		}
		to {
			opacity: 1;
			transform: scale(1);
		}
	}

	.context-menu-header {
		padding: 0.5rem 0.75rem;
		font-size: 0.75rem;
		font-weight: 600;
		color: hsl(var(--color-muted-foreground));
		border-bottom: 1px solid hsl(var(--color-border));
		margin-bottom: 0.25rem;
	}

	.context-menu-item {
		width: 100%;
		padding: 0.5rem 0.75rem;
		background: transparent;
		border: none;
		text-align: left;
		font-size: 0.875rem;
		color: hsl(var(--color-foreground));
		cursor: pointer;
		border-radius: var(--radius-sm);
		transition: background-color 150ms ease;
	}

	.context-menu-item:hover {
		background: hsl(var(--color-muted));
	}

	/* Responsive breakpoints */
	@media (max-width: 1200px) {
		.year-view {
			grid-template-columns: repeat(3, 1fr);
		}
	}

	@media (max-width: 768px) {
		.year-view {
			grid-template-columns: repeat(2, 1fr);
			gap: 0.75rem;
			padding: 0.75rem;
		}

		.mini-month {
			padding: 0.5rem;
		}

		.month-header {
			font-size: 0.75rem;
			padding: 0.25rem;
		}

		.weekday {
			font-size: 0.5625rem;
		}

		.day {
			font-size: 0.6875rem;
		}
	}

	@media (max-width: 480px) {
		.year-view {
			grid-template-columns: 1fr;
		}
	}
</style>
