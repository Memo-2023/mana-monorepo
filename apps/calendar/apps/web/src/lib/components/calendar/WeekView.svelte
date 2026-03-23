<script lang="ts">
	import { onMount } from 'svelte';
	import { viewStore } from '$lib/stores/view.svelte';
	import { eventsStore } from '$lib/stores/events.svelte';
	import { calendarsStore } from '$lib/stores/calendars.svelte';
	import { settingsStore } from '$lib/stores/settings.svelte';
	import { searchStore } from '$lib/stores/search.svelte';
	import { todosStore, type Task } from '$lib/stores/todos.svelte';
	import { birthdaysStore, type BirthdayEvent } from '$lib/stores/birthdays.svelte';
	import BirthdayPopover from '$lib/components/birthday/BirthdayPopover.svelte';
	import {
		useVisibleHours,
		useCurrentTimeIndicator,
		useBirthdayPopover,
		useEventDragDrop,
		useTaskDragDrop,
		useSidebarDrop,
		useDragToCreate,
		useCalendarKeyboard,
	} from '$lib/composables';
	import { toDate } from '$lib/utils/eventDateHelpers';
	import { HOUR_HEIGHT_PX, SNAP_INTERVAL_MINUTES } from '$lib/utils/calendarConstants';
	import {
		getVisibleTimedEvents,
		getVisibleAllDayEvents,
		getVisibleOverflowEvents,
		type OverflowEvents,
	} from '$lib/utils/eventFiltering';
	import EventCard from './EventCard.svelte';
	import TaskBlock from './TaskBlock.svelte';
	import { ContextMenu, type ContextMenuItem } from '@manacore/shared-ui';
	import { goto } from '$app/navigation';
	import {
		format,
		eachDayOfInterval,
		isToday,
		isWeekend,
		isSameDay,
		differenceInMinutes,
		getWeek,
		startOfWeek,
		endOfWeek,
	} from 'date-fns';
	import { de, enUS, fr, es, it } from 'date-fns/locale';
	import { locale, _ } from 'svelte-i18n';

	import type { CalendarEvent } from '@calendar/shared';

	interface Props {
		/** Optional date override for carousel navigation (uses viewStore.currentDate if not provided) */
		date?: Date;
		onQuickCreate?: (date: Date, position: { x: number; y: number }, endDate?: Date) => void;
		onEventClick?: (event: CalendarEvent) => void;
		onTaskClick?: (task: Task) => void;
	}

	let { date, onQuickCreate, onEventClick, onTaskClick }: Props = $props();

	// Use provided date or fall back to viewStore
	let effectiveDate = $derived(date ?? viewStore.currentDate);

	// Calculate view range based on effective date
	let effectiveViewRange = $derived.by(() => {
		if (date) {
			// Calculate range for the provided date
			const weekStartsOn = settingsStore.weekStartsOn;
			return {
				start: startOfWeek(date, { weekStartsOn }),
				end: endOfWeek(date, { weekStartsOn }),
			};
		}
		// Use viewStore range when no date override
		return viewStore.viewRange;
	});

	// Use shared constants
	const HOUR_HEIGHT = HOUR_HEIGHT_PX;
	const MINUTES_PER_SLOT = SNAP_INTERVAL_MINUTES;

	// Get date-fns locale based on current app locale
	const dateLocales = { de, en: enUS, fr, es, it };
	let currentDateLocale = $derived(
		dateLocales[$locale?.substring(0, 2) as keyof typeof dateLocales] || de
	);

	// Generate days of the week, optionally filtering weekends
	let allDays = $derived(
		eachDayOfInterval({
			start: effectiveViewRange.start,
			end: effectiveViewRange.end,
		})
	);

	let days = $derived(
		settingsStore.showOnlyWeekdays ? allDays.filter((day) => !isWeekend(day)) : allDays
	);

	// Get week number for display
	let weekNumber = $derived(
		getWeek(effectiveViewRange.start, { weekStartsOn: settingsStore.weekStartsOn })
	);

	// Use composables for hour filtering and time indicator
	const visibleHours = useVisibleHours();
	const timeIndicator = useCurrentTimeIndicator();

	// Destructure for convenience (these are reactive getters)
	let hours = $derived(visibleHours.hours);
	let firstVisibleHour = $derived(visibleHours.firstVisibleHour);
	let lastVisibleHour = $derived(visibleHours.lastVisibleHour);
	let totalVisibleHours = $derived(visibleHours.totalVisibleHours);
	const minutesToPercent = visibleHours.minutesToPercent;

	// Current time indicator position
	let currentTimePosition = $derived(minutesToPercent(timeIndicator.currentMinutes));

	// Reference to the days container for position calculations
	let daysContainerEl: HTMLDivElement;

	// Reference to the time grid (scroll container)
	let timeGridEl: HTMLDivElement;

	// ========== Composables for Drag/Drop/Resize/Create ==========
	const eventDragDrop = useEventDragDrop(() => ({
		containerEl: daysContainerEl,
		days,
		firstVisibleHour,
		lastVisibleHour,
		totalVisibleHours,
		hourHeight: HOUR_HEIGHT,
		minutesToPercent,
	}));

	const taskDragDrop = useTaskDragDrop(() => ({
		containerEl: daysContainerEl,
		days,
		firstVisibleHour,
		totalVisibleHours,
	}));

	const sidebarDrop = useSidebarDrop(() => ({
		firstVisibleHour,
		totalVisibleHours,
	}));

	const dragToCreate = useDragToCreate(() => ({
		containerEl: daysContainerEl,
		days,
		firstVisibleHour,
		lastVisibleHour,
		totalVisibleHours,
		hourHeight: HOUR_HEIGHT,
		minutesToPercent,
		isOtherOperationActive: () =>
			eventDragDrop.isDragging ||
			eventDragDrop.isResizing ||
			taskDragDrop.isTaskDragging ||
			taskDragDrop.isTaskResizing,
		onCreateEnd: (startTime, endTime, position) => {
			if (onQuickCreate) {
				onQuickCreate(startTime, position, endTime);
			} else {
				goto(`/event/new?start=${startTime.toISOString()}&end=${endTime.toISOString()}`);
			}
		},
	}));

	const keyboard = useCalendarKeyboard([
		{
			isActive: () => eventDragDrop.isDragging || eventDragDrop.isResizing,
			cancel: eventDragDrop.cancel,
		},
		{
			isActive: () => taskDragDrop.isTaskDragging || taskDragDrop.isTaskResizing,
			cancel: taskDragDrop.cancel,
		},
		{ isActive: () => dragToCreate.isCreating, cancel: dragToCreate.cancel },
	]);

	$effect(() => keyboard.setup());

	// Scroll to current time on mount so the red indicator line is visible
	onMount(() => {
		if (!timeGridEl) return;

		const hourHeight =
			parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--hour-height')) ||
			48;
		const now = new Date();
		const currentMinutesFromMidnight = now.getHours() * 60 + now.getMinutes();
		const viewportHeight = timeGridEl.clientHeight;

		// Calculate pixel position of current time
		const effectiveMinutes = Math.max(0, currentMinutesFromMidnight - firstVisibleHour * 60);
		const currentTimePixels = (effectiveMinutes / 60) * hourHeight;

		// Scroll so current time is ~1/3 from the top of the viewport
		const scrollPosition = currentTimePixels - viewportHeight / 3;

		timeGridEl.scrollTo({
			top: Math.max(0, scrollPosition),
			behavior: 'instant',
		});
	});

	// Birthday Popover (using composable)
	const birthdayPopover = useBirthdayPopover();

	// Get birthdays for a day (if enabled in settings)
	function getBirthdaysForDay(day: Date): BirthdayEvent[] {
		if (!settingsStore.showBirthdays) return [];
		return birthdaysStore.getBirthdaysForDay(day);
	}

	// Check if there are any birthdays to show in the all-day row
	let hasAnyBirthdays = $derived(
		settingsStore.showBirthdays && days.some((day) => getBirthdaysForDay(day).length > 0)
	);

	function getEventsForDay(day: Date): CalendarEvent[] {
		return getVisibleTimedEvents(
			eventsStore.getEventsForDay(day),
			calendarsStore.visibleCalendars,
			{
				filterHoursEnabled: settingsStore.filterHoursEnabled,
				dayStartHour: settingsStore.dayStartHour,
				dayEndHour: settingsStore.dayEndHour,
			}
		);
	}

	function getOverflowEventsForDay(day: Date): OverflowEvents {
		if (!settingsStore.filterHoursEnabled) {
			return { before: [], after: [] };
		}
		return getVisibleOverflowEvents(
			eventsStore.getEventsForDay(day),
			calendarsStore.visibleCalendars,
			settingsStore.dayStartHour,
			settingsStore.dayEndHour
		);
	}

	function getAllDayEventsForDay(day: Date): CalendarEvent[] {
		return getVisibleAllDayEvents(
			eventsStore.getEventsForDay(day),
			calendarsStore.visibleCalendars
		);
	}

	// Get display mode for an event (per-event override takes precedence over global setting)
	function getEventDisplayMode(event: CalendarEvent): 'header' | 'block' {
		return (
			(event.metadata as { allDayDisplayMode?: 'header' | 'block' } | null)?.allDayDisplayMode ||
			settingsStore.allDayDisplayMode
		);
	}

	// Split all-day events by display mode
	function getHeaderAllDayEventsForDay(day: Date) {
		return getAllDayEventsForDay(day).filter((e) => getEventDisplayMode(e) === 'header');
	}

	function getBlockAllDayEventsForDay(day: Date) {
		return getAllDayEventsForDay(day).filter((e) => getEventDisplayMode(e) === 'block');
	}

	// Check if there are any all-day events to show in header
	let hasAnyHeaderAllDayEvents = $derived(
		days.some((day) => getHeaderAllDayEventsForDay(day).length > 0)
	);

	function getEventStyle(event: CalendarEvent) {
		const start = toDate(event.startTime);
		const end = toDate(event.endTime);

		const startMinutes = start.getHours() * 60 + start.getMinutes();
		const duration = differenceInMinutes(end, start);

		const top = minutesToPercent(startMinutes);
		const height = Math.max((duration / (totalVisibleHours * 60)) * 100, 2); // Min 2% height

		return `top: ${top}%; height: ${height}%;`;
	}

	function formatEventTimeRange(event: CalendarEvent): string {
		return `${formatEventTime(event.startTime)} - ${formatEventTime(event.endTime)}`;
	}

	/**
	 * Get style for a scheduled task (time-blocking)
	 */
	function getTaskStyle(task: Task): string {
		if (!task.scheduledStartTime) return '';

		// Parse HH:mm time
		const [startHour, startMin] = task.scheduledStartTime.split(':').map(Number);
		const startMinutes = startHour * 60 + startMin;

		// Calculate duration - use estimatedDuration or scheduledEndTime or default 30 min
		let duration = task.estimatedDuration || 30;
		if (task.scheduledEndTime) {
			const [endHour, endMin] = task.scheduledEndTime.split(':').map(Number);
			const endMinutes = endHour * 60 + endMin;
			duration = endMinutes - startMinutes;
		}

		const top = minutesToPercent(startMinutes);
		const height = Math.max((duration / (totalVisibleHours * 60)) * 100, 2);

		return `top: ${top}%; height: ${height}%;`;
	}

	/**
	 * Get scheduled tasks for a specific day
	 */
	function getScheduledTasksForDay(day: Date): Task[] {
		return todosStore.getScheduledTasksForDay(day);
	}

	function formatEventTime(date: Date | string): string {
		return settingsStore.formatTime(toDate(date));
	}

	function handleEventClick(event: CalendarEvent, e: MouseEvent) {
		if (eventDragDrop.isDragging || eventDragDrop.isResizing || eventDragDrop.hasMoved) {
			e.preventDefault();
			e.stopPropagation();
			setTimeout(() => eventDragDrop.resetHasMoved(), 100);
			return;
		}
		if (onEventClick) {
			onEventClick(event);
		} else {
			goto(`/?event=${event.id}`);
		}
	}

	// (Drag/drop/resize/create/keyboard handlers are in composables above)

	// Context menu state
	let contextMenuVisible = $state(false);
	let contextMenuX = $state(0);
	let contextMenuY = $state(0);
	let contextMenuEvent = $state<CalendarEvent | null>(null);

	function handleEventContextMenu(event: CalendarEvent, e: MouseEvent) {
		contextMenuX = e.clientX;
		contextMenuY = e.clientY;
		contextMenuEvent = event;
		contextMenuVisible = true;
	}

	function getContextMenuItems(): ContextMenuItem[] {
		if (!contextMenuEvent) return [];
		const event = contextMenuEvent;

		return [
			{
				id: 'edit',
				label: $_('calendar.contextMenu.edit'),
				action: () => {
					if (onEventClick) {
						onEventClick(event);
					} else {
						goto(`/?event=${event.id}`);
					}
				},
			},
			{
				id: 'duplicate',
				label: $_('calendar.contextMenu.duplicate'),
				action: async () => {
					await eventsStore.createEvent({
						calendarId: event.calendarId,
						title: `${event.title} (${$_('calendar.contextMenu.copy')})`,
						description: event.description ?? undefined,
						location: event.location ?? undefined,
						startTime: event.startTime,
						endTime: event.endTime,
						isAllDay: event.isAllDay,
						timezone: event.timezone ?? undefined,
						color: event.color ?? undefined,
						status: event.status ?? undefined,
					});
				},
			},
			{ id: 'divider-1', label: '', type: 'divider' },
			{
				id: 'delete',
				label: $_('calendar.contextMenu.delete'),
				variant: 'danger',
				action: () => eventsStore.deleteEvent(event.id),
			},
		];
	}
</script>

<div class="week-view">
	<!-- Week number indicator (if enabled) -->
	{#if settingsStore.showWeekNumbers}
		<div class="week-number-indicator">
			{$_('views.weekNumber')}
			{weekNumber}
		</div>
	{/if}

	<!-- Sticky header container -->
	<div class="sticky-header">
		<!-- Day headers -->
		<div class="day-headers" role="row">
			<div class="time-gutter"></div>
			{#each days as day}
				<div
					class="day-header"
					class:today={isToday(day)}
					role="columnheader"
					aria-label={format(day, 'EEEE, d. MMMM', { locale: currentDateLocale })}
				>
					<span class="day-name">{format(day, 'EEE', { locale: currentDateLocale })}</span>
					<span class="day-number" class:today={isToday(day)}>{format(day, 'd')}</span>
				</div>
			{/each}
		</div>

		<!-- All-day events row (shown when there are header-mode all-day events or birthdays) -->
		{#if hasAnyHeaderAllDayEvents || hasAnyBirthdays}
			<div class="all-day-row">
				<div class="time-gutter">
					{#if settingsStore.showWeekNumbers}
						<span class="week-label">{$_('views.weekNumber')} {weekNumber}</span>
					{/if}
				</div>
				{#each days as day}
					<div class="all-day-cell">
						{#each getHeaderAllDayEventsForDay(day) as event}
							<button
								class="all-day-event"
								class:search-highlighted={searchStore.isEventHighlighted(event.id)}
								class:search-dimmed={searchStore.isEventDimmed(event.id)}
								style="background-color: {calendarsStore.getColor(event.calendarId)}"
								onclick={() => goto(`/?event=${event.id}`)}
								aria-label="{event.title} - {$_('views.allDay')}"
							>
								{event.title}
							</button>
						{/each}
						<!-- Birthdays -->
						{#each getBirthdaysForDay(day) as birthday}
							<button
								class="all-day-event birthday-event"
								onclick={(e) => birthdayPopover.handleBirthdayClick(birthday, e)}
								aria-label="{birthday.displayName} - {$_(
									'views.birthday'
								)}{settingsStore.showBirthdayAge && birthday.age > 0 ? ` (${birthday.age})` : ''}"
							>
								🎂 {birthday.displayName}
								{#if settingsStore.showBirthdayAge && birthday.age > 0}
									<span class="birthday-age">({birthday.age})</span>
								{/if}
							</button>
						{/each}
					</div>
				{/each}
			</div>
		{/if}
	</div>

	<!-- Time grid -->
	<div
		class="time-grid scrollbar-thin"
		bind:this={timeGridEl}
		role="grid"
		aria-label={$_('views.weekView')}
	>
		<!-- Time column -->
		<div class="time-column">
			{#each hours as hour}
				<div class="time-label">
					{settingsStore.formatHour(hour)}
				</div>
			{/each}
		</div>

		<!-- Day columns -->
		<div class="days-container" bind:this={daysContainerEl}>
			{#each days as day, dayIndex}
				<!-- svelte-ignore a11y_no_static_element_interactions -->
				<div
					class="day-column"
					class:today={isToday(day)}
					class:drop-target={sidebarDrop.dropTarget && isSameDay(day, sidebarDrop.dropTarget.day)}
					class:creating={dragToCreate.isCreating &&
						dragToCreate.createTargetDay &&
						isSameDay(day, dragToCreate.createTargetDay)}
					onpointerdown={dragToCreate.startCreate}
					ondragover={(e) => sidebarDrop.handleDragOver(e, day)}
					ondragleave={sidebarDrop.handleDragLeave}
					ondrop={(e) => sidebarDrop.handleDrop(e, day)}
				>
					{#each hours as hour}
						<div
							class="hour-slot"
							role="button"
							tabindex="-1"
							aria-label={`${format(day, 'EEEE', { locale: currentDateLocale })} ${settingsStore.formatHour(hour)}`}
						></div>
					{/each}

					<!-- Block-style all-day events -->
					{#each getBlockAllDayEventsForDay(day) as event (event.id)}
						<button
							class="all-day-block-event"
							class:search-highlighted={searchStore.isEventHighlighted(event.id)}
							class:search-dimmed={searchStore.isEventDimmed(event.id)}
							style="background-color: {calendarsStore.getColor(event.calendarId)}"
							onclick={() => goto(`/?event=${event.id}`)}
							aria-label="{event.title} - {$_('views.allDay')}"
						>
							<span class="event-title">{event.title}</span>
						</button>
					{/each}

					<!-- Timed events -->
					{#each getEventsForDay(day) as event (event.id)}
						{@const isBeingDragged =
							eventDragDrop.isDragging && eventDragDrop.draggedEvent?.id === event.id}
						{@const isBeingResized =
							eventDragDrop.isResizing && eventDragDrop.resizeEvent?.id === event.id}
						{@const isCrossDayDrag =
							isBeingDragged &&
							eventDragDrop.dragTargetDay !== null &&
							!isSameDay(day, eventDragDrop.dragTargetDay)}
						<EventCard
							{event}
							style={isBeingDragged && !isCrossDayDrag
								? `top: ${eventDragDrop.dragPreviewTop}%; height: ${eventDragDrop.dragPreviewHeight}%;`
								: isBeingResized
									? `top: ${eventDragDrop.resizePreviewTop}%; height: ${eventDragDrop.resizePreviewHeight}%;`
									: getEventStyle(event)}
							color={calendarsStore.getColor(event.calendarId)}
							isDragging={isBeingDragged && !isCrossDayDrag}
							isDraggingSource={isCrossDayDrag}
							isResizing={isBeingResized}
							isSearchHighlighted={searchStore.isEventHighlighted(event.id)}
							isSearchDimmed={searchStore.isEventDimmed(event.id)}
							formattedTime={isBeingResized
								? eventDragDrop.getResizePreviewTime()
								: formatEventTimeRange(event)}
							onClick={handleEventClick}
							onContextMenu={handleEventContextMenu}
							onPointerDown={eventDragDrop.startDrag}
							onResizeStart={eventDragDrop.startResize}
						/>
					{/each}

					<!-- Scheduled Tasks (Time-Blocking) - only shown if enabled in settings -->
					{#if settingsStore.showTasksInCalendar}
						{#each getScheduledTasksForDay(day) as task (task.id)}
							{@const isTaskBeingDragged =
								taskDragDrop.isTaskDragging && taskDragDrop.draggedTask?.id === task.id}
							{@const isTaskBeingResized =
								taskDragDrop.isTaskResizing && taskDragDrop.resizeTask?.id === task.id}
							{@const isTaskCrossDayDrag =
								isTaskBeingDragged &&
								taskDragDrop.taskDragTargetDay !== null &&
								!isSameDay(day, taskDragDrop.taskDragTargetDay)}
							<TaskBlock
								{task}
								style={isTaskBeingDragged && !isTaskCrossDayDrag
									? `top: ${taskDragDrop.taskDragPreviewTop}%; height: ${taskDragDrop.taskDragPreviewHeight}%;`
									: isTaskBeingResized
										? `top: ${taskDragDrop.taskResizePreviewTop}%; height: ${taskDragDrop.taskResizePreviewHeight}%;`
										: getTaskStyle(task)}
								{onTaskClick}
								onDragStart={taskDragDrop.startDrag}
								onResizeStart={taskDragDrop.startResize}
								isDragging={isTaskBeingDragged && !isTaskCrossDayDrag}
								isResizing={isTaskBeingResized}
								isDraggingSource={isTaskCrossDayDrag}
							/>
						{/each}

						<!-- Task Drag preview (solid) for cross-day dragging -->
						{#if taskDragDrop.isTaskDragging && taskDragDrop.draggedTask && taskDragDrop.taskDragTargetDay && isSameDay(day, taskDragDrop.taskDragTargetDay) && !getScheduledTasksForDay(day).some((t) => t.id === taskDragDrop.draggedTask!.id)}
							<TaskBlock
								task={taskDragDrop.draggedTask}
								style="top: {taskDragDrop.taskDragPreviewTop}%; height: {taskDragDrop.taskDragPreviewHeight}%;"
								isDragging={true}
							/>
						{/if}
					{/if}

					<!-- Drag preview (solid) for cross-day dragging -->
					{#if eventDragDrop.isDragging && eventDragDrop.draggedEvent && eventDragDrop.dragTargetDay && isSameDay(day, eventDragDrop.dragTargetDay) && !getEventsForDay(day).some((e) => e.id === eventDragDrop.draggedEvent!.id)}
						<EventCard
							event={eventDragDrop.draggedEvent}
							style="top: {eventDragDrop.dragPreviewTop}%; height: {eventDragDrop.dragPreviewHeight}%;"
							color={calendarsStore.getColor(eventDragDrop.draggedEvent.calendarId)}
							isDragging={true}
							formattedTime={formatEventTimeRange(eventDragDrop.draggedEvent)}
						/>
					{/if}

					<!-- Create preview (drag-to-create) -->
					{#if dragToCreate.isCreating && dragToCreate.createTargetDay && isSameDay(day, dragToCreate.createTargetDay)}
						<div
							class="create-preview"
							style="top: {dragToCreate.createPreviewTop}%; height: {dragToCreate.createPreviewHeight}%; background-color: {calendarsStore.getColor(
								calendarsStore.defaultCalendar?.id || ''
							)};"
						>
							<span class="event-time">{dragToCreate.getCreatePreviewTime()}</span>
							<span class="event-title">(Neuer Termin)</span>
						</div>
					{/if}

					<!-- Overflow indicators for events outside visible time range -->
					{#if true}
						{@const overflow = getOverflowEventsForDay(day)}
						{#if overflow.before.length > 0}
							<div class="overflow-indicator top" title="{overflow.before.length} Termin(e) früher">
								{#each overflow.before as event}
									<div
										class="overflow-line"
										style="background-color: {calendarsStore.getColor(event.calendarId)}"
										title="{formatEventTime(event.startTime)} {event.title}"
									></div>
								{/each}
							</div>
						{/if}
						{#if overflow.after.length > 0}
							<div
								class="overflow-indicator bottom"
								title="{overflow.after.length} Termin(e) später"
							>
								{#each overflow.after as event}
									<div
										class="overflow-line"
										style="background-color: {calendarsStore.getColor(event.calendarId)}"
										title="{formatEventTime(event.startTime)} {event.title}"
									></div>
								{/each}
							</div>
						{/if}
					{/if}

					<!-- Current time indicator -->
					{#if isToday(day)}
						<div class="time-indicator" style="top: {currentTimePosition}%">
							<span class="time-indicator-label">{settingsStore.formatTime(timeIndicator.now)}</span
							>
						</div>
					{/if}
				</div>
			{/each}
		</div>
	</div>
</div>

<!-- Birthday Popover -->
{#if birthdayPopover.selectedBirthday}
	<BirthdayPopover
		birthday={birthdayPopover.selectedBirthday}
		position={birthdayPopover.popoverPosition}
		onClose={birthdayPopover.closePopover}
	/>
{/if}

<ContextMenu
	visible={contextMenuVisible}
	x={contextMenuX}
	y={contextMenuY}
	items={getContextMenuItems()}
	onClose={() => {
		contextMenuVisible = false;
		contextMenuEvent = null;
	}}
/>

<style>
	.week-view {
		display: flex;
		flex-direction: column;
	}

	.week-number-indicator {
		display: none; /* Hidden by default, shown in gutter instead */
	}

	.sticky-header {
		position: sticky;
		top: 0;
		z-index: 10;
		background: hsl(var(--color-background));
	}

	.all-day-row {
		display: flex;
		border-bottom: 1px solid hsl(var(--color-border));
		min-height: 32px;
	}

	.all-day-cell {
		flex: 1;
		display: flex;
		flex-wrap: wrap;
		gap: 2px;
		padding: 4px;
		border-left: 1px solid hsl(var(--color-border));
	}

	.all-day-event {
		width: 100%;
		padding: 2px 6px;
		font-size: 0.75rem;
		color: white;
		border-radius: var(--radius-sm);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		border: none;
		cursor: pointer;
		transition: opacity 0.15s ease;
		text-align: left;
	}

	.all-day-event.search-highlighted {
		outline: 2px solid hsl(var(--color-primary));
		outline-offset: 1px;
		box-shadow: 0 0 0 3px hsl(var(--color-primary) / 0.3);
	}

	.all-day-event.search-dimmed {
		opacity: 0.35;
		filter: grayscale(0.3);
	}

	/* Birthday events in all-day row */
	.all-day-event.birthday-event {
		background: linear-gradient(135deg, #ec4899 0%, #f472b6 100%);
	}

	.all-day-event.birthday-event:hover {
		opacity: 0.9;
	}

	.birthday-age {
		opacity: 0.85;
		font-size: 0.7rem;
	}

	/* Block-style all-day events (displayed as full-day blocks in the grid) */
	.all-day-block-event {
		position: absolute;
		top: 0;
		left: 2px;
		right: 2px;
		bottom: 0;
		padding: 4px 6px;
		color: white;
		border: none;
		border-radius: var(--radius-sm);
		text-align: left;
		cursor: pointer;
		z-index: 0;
		opacity: 0.3;
		overflow: hidden;
		display: flex;
		align-items: flex-start;
	}

	.all-day-block-event:hover {
		opacity: 0.5;
	}

	.all-day-block-event.search-highlighted {
		opacity: 0.6;
		outline: 2px solid hsl(var(--color-primary));
		outline-offset: 1px;
	}

	.all-day-block-event.search-dimmed {
		opacity: 0.15;
		filter: grayscale(0.5);
	}

	.all-day-block-event .event-title {
		font-size: 0.75rem;
		font-weight: 500;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.day-headers {
		display: flex;
		border-bottom: 1px solid hsl(var(--color-border));
	}

	.time-gutter {
		width: var(--time-column-width);
		flex-shrink: 0;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.week-label {
		font-size: 0.625rem;
		color: hsl(var(--color-muted-foreground));
		text-transform: uppercase;
		font-weight: 500;
	}

	.day-header {
		flex: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 0.5rem;
		border-left: 1px solid hsl(var(--color-border));
		transition: background-color 150ms ease;
	}

	.day-name {
		font-size: 0.75rem;
		color: hsl(var(--color-muted-foreground));
		text-transform: uppercase;
	}

	.day-number {
		font-size: 1.25rem;
		font-weight: 600;
		width: 36px;
		height: 36px;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: var(--radius-full);
	}

	.day-number.today {
		background: hsl(var(--color-primary));
		color: hsl(var(--color-primary-foreground));
	}

	.time-grid {
		flex: 1;
		display: flex;
	}

	.time-column {
		width: var(--time-column-width);
		flex-shrink: 0;
		padding-top: 1rem;
		padding-bottom: 200px; /* Space for bottom UI (PillNav, InputBar, etc.) */
	}

	.time-label {
		height: var(--hour-height);
		padding-right: 0.5rem;
		text-align: right;
		font-size: 0.75rem;
		color: hsl(var(--color-muted-foreground));
		position: relative;
		top: 0.25em;
	}

	.days-container {
		flex: 1;
		display: flex;
		position: relative;
	}

	.day-column {
		flex: 1;
		position: relative;
		border-left: 1px solid hsl(var(--color-border));
		padding-top: 1rem;
		padding-bottom: 200px; /* Space for bottom UI (PillNav, InputBar, etc.) */
	}

	.day-column.today {
		background: hsl(var(--color-primary) / 0.05);
	}

	.day-column.drop-target {
		background: hsl(var(--color-primary) / 0.15);
		outline: 2px dashed hsl(var(--color-primary));
		outline-offset: -2px;
	}

	.hour-slot {
		height: var(--hour-height);
		width: 100%;
		border: none;
		border-bottom: 1px solid hsl(var(--color-border) / 0.5);
		background: transparent;
		cursor: pointer;
	}

	.hour-slot:hover {
		background: hsl(var(--color-muted) / 0.3);
	}

	/* Create preview (drag-to-create) */
	.create-preview {
		position: absolute;
		left: 2px;
		right: 2px;
		padding: 2px 4px;
		border-radius: var(--radius-sm);
		text-align: left;
		z-index: 50;
		overflow: hidden;
		color: white;
		opacity: 0.85;
		border: 2px dashed rgba(255, 255, 255, 0.5);
		pointer-events: none;
	}

	.create-preview .event-time {
		display: block;
		font-size: 0.6rem;
		opacity: 0.9;
	}

	.create-preview .event-title {
		display: block;
		font-size: 0.7rem;
		font-weight: 500;
		opacity: 0.8;
	}

	.day-column.creating {
		cursor: ns-resize;
	}

	.time-indicator {
		position: absolute;
		left: 0;
		right: 0;
		height: 2px;
		background: hsl(var(--color-error));
		z-index: 2;
	}

	.time-indicator::before {
		content: '';
		position: absolute;
		left: -4px;
		top: -4px;
		width: 10px;
		height: 10px;
		background: hsl(var(--color-error));
		border-radius: 50%;
	}

	.time-indicator-label {
		position: absolute;
		right: 4px;
		bottom: 3px;
		font-size: 0.6rem;
		font-weight: 600;
		color: hsl(var(--color-error));
		line-height: 1;
		pointer-events: none;
	}

	/* Overflow indicators for events outside visible time range */
	.overflow-indicator {
		position: absolute;
		left: 2px;
		right: 2px;
		display: flex;
		flex-direction: column;
		gap: 2px;
		z-index: 5;
		padding: 2px;
	}

	.overflow-indicator.top {
		top: 0;
	}

	.overflow-indicator.bottom {
		bottom: 0;
	}

	.overflow-line {
		height: 3px;
		border-radius: 2px;
		opacity: 0.7;
		cursor: pointer;
		transition:
			opacity 0.15s ease,
			height 0.15s ease;
	}

	.overflow-line:hover {
		opacity: 1;
		height: 5px;
	}
</style>
