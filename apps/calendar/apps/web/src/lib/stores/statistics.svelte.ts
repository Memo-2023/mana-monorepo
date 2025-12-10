/**
 * Calendar Statistics Store - Calculates calendar statistics using Svelte 5 runes
 */

import type { CalendarEvent, Calendar } from '@calendar/shared';
import {
	startOfDay,
	startOfWeek,
	endOfWeek,
	subDays,
	format,
	differenceInMinutes,
	isToday,
	isSameWeek,
	parseISO,
	eachDayOfInterval,
	addDays,
} from 'date-fns';
import { de } from 'date-fns/locale';
import type {
	HeatmapDataPoint,
	TrendDataPoint,
	DonutSegment,
	ProgressItem,
} from '@manacore/shared-ui';

// Types
export interface EventStatusBreakdown {
	status: 'confirmed' | 'tentative' | 'cancelled';
	count: number;
	percentage: number;
	color: string;
}

const STATUS_COLORS: Record<string, string> = {
	confirmed: '#10B981', // green
	tentative: '#F59E0B', // orange
	cancelled: '#EF4444', // red
};

const STATUS_LABELS: Record<string, string> = {
	confirmed: 'Bestätigt',
	tentative: 'Vorläufig',
	cancelled: 'Abgesagt',
};

// State
let events = $state<CalendarEvent[]>([]);
let calendars = $state<Calendar[]>([]);

export const calendarStatisticsStore = {
	// Setters
	setEvents(newEvents: CalendarEvent[]) {
		events = newEvents;
	},

	setCalendars(newCalendars: Calendar[]) {
		calendars = newCalendars;
	},

	// Quick Stats
	get totalEvents() {
		return events.length;
	},

	get eventsToday() {
		return events.filter((e) => {
			const startTime = typeof e.startTime === 'string' ? parseISO(e.startTime) : e.startTime;
			return isToday(startTime);
		}).length;
	},

	get eventsThisWeek() {
		const now = new Date();
		return events.filter((e) => {
			const startTime = typeof e.startTime === 'string' ? parseISO(e.startTime) : e.startTime;
			return isSameWeek(startTime, now, { weekStartsOn: 1 });
		}).length;
	},

	get upcomingEvents() {
		const now = new Date();
		const nextWeek = addDays(now, 7);
		return events.filter((e) => {
			const startTime = typeof e.startTime === 'string' ? parseISO(e.startTime) : e.startTime;
			return startTime > now && startTime <= nextWeek;
		}).length;
	},

	get busyHoursThisWeek() {
		const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
		const weekEnd = endOfWeek(new Date(), { weekStartsOn: 1 });

		let totalMinutes = 0;

		events.forEach((e) => {
			if (e.isAllDay) return; // Skip all-day events

			const startTime = typeof e.startTime === 'string' ? parseISO(e.startTime) : e.startTime;
			const endTime = typeof e.endTime === 'string' ? parseISO(e.endTime) : e.endTime;

			if (startTime >= weekStart && startTime <= weekEnd) {
				totalMinutes += differenceInMinutes(endTime, startTime);
			}
		});

		return Math.round((totalMinutes / 60) * 10) / 10; // Round to 1 decimal
	},

	get totalCalendars() {
		return calendars.length;
	},

	get averageEventDuration() {
		const timedEvents = events.filter((e) => !e.isAllDay);
		if (timedEvents.length === 0) return 0;

		const totalMinutes = timedEvents.reduce((sum, e) => {
			const startTime = typeof e.startTime === 'string' ? parseISO(e.startTime) : e.startTime;
			const endTime = typeof e.endTime === 'string' ? parseISO(e.endTime) : e.endTime;
			return sum + differenceInMinutes(endTime, startTime);
		}, 0);

		return Math.round(totalMinutes / timedEvents.length);
	},

	// Activity Heatmap (last 6 months) - based on event creation
	get activityHeatmap(): HeatmapDataPoint[] {
		const endDate = new Date();
		const startDate = subDays(endDate, 180);

		// Count events per day based on start time
		const eventMap = new Map<string, number>();

		events.forEach((e) => {
			const startTime = typeof e.startTime === 'string' ? parseISO(e.startTime) : e.startTime;
			const dateKey = format(startTime, 'yyyy-MM-dd');
			eventMap.set(dateKey, (eventMap.get(dateKey) || 0) + 1);
		});

		// Generate all days
		const days = eachDayOfInterval({ start: startDate, end: endDate });

		return days.map((day) => {
			const dateKey = format(day, 'yyyy-MM-dd');
			return {
				date: dateKey,
				count: eventMap.get(dateKey) || 0,
				dayOfWeek: day.getDay(),
			};
		});
	},

	// Weekly Trend (last 4 weeks)
	get weeklyTrend(): TrendDataPoint[] {
		const endDate = new Date();
		const startDate = subDays(endDate, 27);

		const eventMap = new Map<string, number>();

		events.forEach((e) => {
			const startTime = typeof e.startTime === 'string' ? parseISO(e.startTime) : e.startTime;
			if (startTime >= startDate && startTime <= endDate) {
				const dateKey = format(startTime, 'yyyy-MM-dd');
				eventMap.set(dateKey, (eventMap.get(dateKey) || 0) + 1);
			}
		});

		const days = eachDayOfInterval({ start: startDate, end: endDate });

		return days.map((day) => {
			const dateKey = format(day, 'yyyy-MM-dd');
			return {
				date: dateKey,
				count: eventMap.get(dateKey) || 0,
				label: format(day, 'EEE', { locale: de }),
			};
		});
	},

	// Status Breakdown (Donut Chart)
	get statusBreakdown(): DonutSegment[] {
		const total = events.length;
		if (total === 0) return [];

		const counts: Record<string, number> = {
			confirmed: 0,
			tentative: 0,
			cancelled: 0,
		};

		events.forEach((e) => {
			const status = e.status || 'confirmed';
			if (counts[status] !== undefined) {
				counts[status]++;
			}
		});

		return (['confirmed', 'tentative', 'cancelled'] as const).map((status) => ({
			id: status,
			label: STATUS_LABELS[status],
			count: counts[status],
			percentage: total > 0 ? Math.round((counts[status] / total) * 100) : 0,
			color: STATUS_COLORS[status],
		}));
	},

	// Calendar Activity (Progress Bars)
	get calendarActivity(): ProgressItem[] {
		const calendarMap = new Map<string, { total: number; thisWeek: number }>();

		// Initialize with all calendars
		calendars.forEach((c) => {
			calendarMap.set(c.id, { total: 0, thisWeek: 0 });
		});

		const now = new Date();

		// Count events per calendar
		events.forEach((e) => {
			const calendarId = e.calendarId;
			const data = calendarMap.get(calendarId) || { total: 0, thisWeek: 0 };
			data.total++;

			const startTime = typeof e.startTime === 'string' ? parseISO(e.startTime) : e.startTime;
			if (isSameWeek(startTime, now, { weekStartsOn: 1 })) {
				data.thisWeek++;
			}

			calendarMap.set(calendarId, data);
		});

		// Convert to array
		const result: ProgressItem[] = [];

		calendarMap.forEach((data, calendarId) => {
			if (data.total === 0) return;

			const calendar = calendars.find((c) => c.id === calendarId);

			result.push({
				id: calendarId,
				name: calendar?.name || 'Unbekannt',
				color: calendar?.color || '#6B7280',
				total: data.total,
				completed: data.thisWeek,
				percentage: data.total > 0 ? Math.round((data.thisWeek / data.total) * 100) : 0,
			});
		});

		// Sort by total events descending
		return result.sort((a, b) => b.total - a.total);
	},

	// All-day vs Timed events ratio
	get allDayRatio() {
		const allDay = events.filter((e) => e.isAllDay).length;
		const timed = events.filter((e) => !e.isAllDay).length;
		return {
			allDay,
			timed,
			allDayPercentage: events.length > 0 ? Math.round((allDay / events.length) * 100) : 0,
		};
	},

	// Recurring events count
	get recurringEventsCount() {
		return events.filter((e) => e.recurrenceRule).length;
	},
};
