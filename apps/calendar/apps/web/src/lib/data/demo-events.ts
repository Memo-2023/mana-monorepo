/**
 * Demo Events - Static sample events for unauthenticated users
 *
 * Shows a realistic calendar with various event types to demonstrate
 * the app's capabilities without requiring login.
 */

import type { CalendarEvent } from '@calendar/shared';
import { addDays, setHours, setMinutes, startOfWeek } from 'date-fns';

// Get browser timezone or default to Europe/Berlin
const timezone =
	typeof Intl !== 'undefined' ? Intl.DateTimeFormat().resolvedOptions().timeZone : 'Europe/Berlin';

/**
 * Create a demo event with common defaults
 */
function createDemoEvent(
	id: string,
	title: string,
	dayOffset: number,
	startHour: number,
	startMinute: number,
	endHour: number,
	endMinute: number,
	color: string,
	options: {
		description?: string;
		location?: string;
		isAllDay?: boolean;
	} = {}
): CalendarEvent {
	const now = new Date();
	const weekStart = startOfWeek(now, { weekStartsOn: 1 });
	const eventDay = addDays(weekStart, dayOffset);

	return {
		id: `demo_${id}`,
		calendarId: 'demo-calendar',
		userId: 'demo',
		title,
		description: options.description,
		location: options.location,
		startTime: setMinutes(setHours(eventDay, startHour), startMinute).toISOString(),
		endTime: setMinutes(setHours(eventDay, endHour), endMinute).toISOString(),
		isAllDay: options.isAllDay ?? false,
		timezone,
		color,
		status: 'confirmed',
		createdAt: now.toISOString(),
		updatedAt: now.toISOString(),
	};
}

/**
 * Generate demo events relative to the current date
 * Events are spread across the current week to always look relevant
 */
export function generateDemoEvents(): CalendarEvent[] {
	return [
		// Monday - Work meeting
		createDemoEvent('1', 'Team Standup', 0, 9, 0, 9, 30, '#3b82f6', {
			description: 'Tägliches Standup Meeting mit dem Entwicklungsteam',
			location: 'Meeting Room A',
		}),
		// Monday - Lunch
		createDemoEvent('2', 'Mittagessen mit Lisa', 0, 12, 30, 13, 30, '#10b981', {
			location: 'Café Central',
		}),
		// Tuesday - All day event
		createDemoEvent('3', 'Projektabgabe', 1, 0, 0, 23, 59, '#f59e0b', {
			description: 'Deadline für das Q1 Projekt',
			isAllDay: true,
		}),
		// Tuesday - Client call
		createDemoEvent('4', 'Kundengespräch', 1, 14, 0, 15, 0, '#8b5cf6', {
			description: 'Quartals-Review mit Kunde XYZ',
			location: 'Zoom',
		}),
		// Wednesday - Workout
		createDemoEvent('5', 'Fitness', 2, 7, 0, 8, 30, '#ef4444', {
			description: 'Krafttraining',
			location: 'FitGym',
		}),
		// Wednesday - Long meeting
		createDemoEvent('6', 'Sprint Planning', 2, 10, 0, 12, 0, '#3b82f6', {
			description: 'Planung für den nächsten Sprint',
			location: 'Großer Konferenzraum',
		}),
		// Thursday - Doctor appointment
		createDemoEvent('7', 'Arzttermin', 3, 11, 0, 12, 0, '#ec4899', {
			description: 'Jährliche Vorsorgeuntersuchung',
			location: 'Dr. Müller, Hauptstraße 15',
		}),
		// Friday - Team event
		createDemoEvent('8', 'Team-Event: Escape Room', 4, 16, 0, 19, 0, '#10b981', {
			description: 'Teambuilding Aktivität',
			location: 'Escape Berlin',
		}),
		// Saturday - Weekend activity
		createDemoEvent('9', 'Brunch mit Familie', 5, 11, 0, 14, 0, '#f59e0b', {
			location: 'Bei Oma',
		}),
		// Sunday - Relaxation
		createDemoEvent('10', 'Yoga-Kurs', 6, 10, 0, 11, 30, '#8b5cf6', {
			description: 'Sonntags-Entspannung',
			location: 'Yoga Studio Harmony',
		}),
	];
}

/**
 * Check if an event ID is a demo event
 */
export function isDemoEvent(id: string): boolean {
	return id.startsWith('demo_');
}
