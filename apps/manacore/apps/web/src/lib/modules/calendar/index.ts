/**
 * Calendar module — barrel exports.
 */

export { calendarsStore } from './stores/calendars.svelte';
export { eventsStore } from './stores/events.svelte';
export { calendarViewStore } from './stores/view.svelte';
export {
	useAllCalendars,
	useAllEvents,
	allCalendars$,
	allEvents$,
	toCalendar,
	toCalendarEvent,
	getVisibleCalendars,
	getDefaultCalendar,
	getCalendarById,
	getCalendarColor,
	getEventById,
	getEventsForDay,
	getEventsInRange,
	filterEventsByVisibleCalendars,
	sortEventsByTime,
} from './queries';
export { calendarTable, eventTable, CALENDAR_GUEST_SEED } from './collections';
export type { LocalCalendar, LocalEvent, CalendarViewType, CalendarEvent, Calendar } from './types';
