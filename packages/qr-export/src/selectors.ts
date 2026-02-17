/**
 * Selectors for choosing the most important data for QR export
 *
 * These helpers select and prioritize data to fit within QR code limits.
 */

import type {
	ManaQRContact,
	ManaQREvent,
	ManaQRTodo,
	ContactRelation,
	TodoPriority,
} from './types';
import { MANA_QR_LIMITS } from './types';

// --- Contact Selectors ---

/** Input format for contact selection */
export interface ContactInput {
	name: string;
	phone?: string;
	email?: string;
	relation?: ContactRelation;
	/** Higher = more important */
	importance?: number;
	/** Is emergency contact */
	isEmergency?: boolean;
	/** Is family member */
	isFamily?: boolean;
}

/**
 * Select the most important contacts for QR export
 *
 * Priority order:
 * 1. Emergency contacts (relation = 5)
 * 2. Family (relation = 1)
 * 3. Partner (relation = 2)
 * 4. By importance score
 * 5. By provided order
 */
export function selectTopContacts(
	contacts: ContactInput[],
	limit: number = MANA_QR_LIMITS.MAX_CONTACTS
): ManaQRContact[] {
	const scored = contacts.map((c, index) => {
		let score = 0;

		// Emergency contacts highest priority
		if (c.isEmergency || c.relation === 5) score += 1000;
		// Family second
		if (c.isFamily || c.relation === 1) score += 500;
		// Partner third
		if (c.relation === 2) score += 400;
		// Work contacts
		if (c.relation === 4) score += 100;
		// Custom importance
		if (c.importance) score += c.importance;
		// Prefer contacts with phone numbers
		if (c.phone) score += 50;
		// Original order as tiebreaker
		score -= index * 0.01;

		return { contact: c, score };
	});

	// Sort by score descending
	scored.sort((a, b) => b.score - a.score);

	// Take top N and convert to compact format
	return scored.slice(0, limit).map(({ contact }) => ({
		n: contact.name,
		p: contact.phone,
		e: contact.email,
		r: contact.relation || 3, // Default to "Freund"
	}));
}

// --- Event Selectors ---

/** Input format for event selection */
export interface EventInput {
	title: string;
	/** Start time as Date or Unix timestamp (ms) */
	start: Date | number;
	/** End time as Date or Unix timestamp (ms) */
	end?: Date | number;
	/** Duration in minutes (alternative to end) */
	durationMinutes?: number;
	location?: string;
	/** Is all-day event */
	allDay?: boolean;
	/** Higher = more important */
	importance?: number;
}

/**
 * Select upcoming events for QR export
 *
 * Only includes future events, sorted by start time.
 * Truncates titles to fit size limits.
 */
export function selectUpcomingEvents(
	events: EventInput[],
	limit: number = MANA_QR_LIMITS.MAX_EVENTS,
	fromDate: Date = new Date()
): ManaQREvent[] {
	const fromTimestamp = fromDate.getTime();

	// Filter and sort future events
	const futureEvents = events
		.map((e) => ({
			event: e,
			startMs: e.start instanceof Date ? e.start.getTime() : e.start,
		}))
		.filter(({ startMs }) => startMs >= fromTimestamp)
		.sort((a, b) => a.startMs - b.startMs);

	// Take top N and convert to compact format
	return futureEvents.slice(0, limit).map(({ event, startMs }) => {
		// Calculate duration
		let durationMinutes = event.durationMinutes || 60;
		if (event.end) {
			const endMs = event.end instanceof Date ? event.end.getTime() : event.end;
			durationMinutes = Math.round((endMs - startMs) / 60000);
		}
		if (event.allDay) {
			durationMinutes = 1440; // 24 hours
		}

		return {
			t: truncate(event.title, MANA_QR_LIMITS.MAX_EVENT_TITLE),
			s: Math.floor(startMs / 1000), // Unix seconds
			d: durationMinutes,
			l: event.location ? truncate(event.location, 20) : undefined,
		};
	});
}

// --- Todo Selectors ---

/** Input format for todo selection */
export interface TodoInput {
	title: string;
	priority?: TodoPriority;
	/** Due date as Date or Unix timestamp (ms) */
	dueDate?: Date | number;
	/** Is completed */
	completed?: boolean;
	/** Higher = more important */
	importance?: number;
}

/**
 * Select the most important todos for QR export
 *
 * Priority order:
 * 1. Priority 1 (high)
 * 2. Priority 2 (medium)
 * 3. Priority 3 (low)
 * 4. By due date (sooner = higher)
 * 5. By importance score
 *
 * Excludes completed todos.
 */
export function selectPriorityTodos(
	todos: TodoInput[],
	limit: number = MANA_QR_LIMITS.MAX_TODOS,
	fromDate: Date = new Date()
): ManaQRTodo[] {
	const fromTimestamp = fromDate.getTime();
	const fromDayStart = new Date(fromDate);
	fromDayStart.setHours(0, 0, 0, 0);

	// Filter out completed todos and score the rest
	const scored = todos
		.filter((t) => !t.completed)
		.map((t, index) => {
			let score = 0;

			// Priority is most important
			const priority = t.priority || 3;
			score += (4 - priority) * 1000; // P1=3000, P2=2000, P3=1000

			// Due date matters
			if (t.dueDate) {
				const dueMs = t.dueDate instanceof Date ? t.dueDate.getTime() : t.dueDate;
				const daysUntilDue = Math.floor((dueMs - fromTimestamp) / 86400000);
				// Overdue items get highest boost
				if (daysUntilDue < 0) {
					score += 500;
				} else if (daysUntilDue <= 7) {
					score += 300 - daysUntilDue * 10;
				}
			}

			// Custom importance
			if (t.importance) score += t.importance;

			// Original order as tiebreaker
			score -= index * 0.01;

			return { todo: t, score };
		});

	// Sort by score descending
	scored.sort((a, b) => b.score - a.score);

	// Take top N and convert to compact format
	return scored.slice(0, limit).map(({ todo }) => {
		let dueDays: number | undefined;
		if (todo.dueDate) {
			const dueMs = todo.dueDate instanceof Date ? todo.dueDate.getTime() : todo.dueDate;
			const daysFromNow = Math.floor((dueMs - fromDayStart.getTime()) / 86400000);
			// Clamp to 0-255 range
			dueDays = Math.max(0, Math.min(255, daysFromNow));
		}

		return {
			t: truncate(todo.title, MANA_QR_LIMITS.MAX_TODO_TITLE),
			p: todo.priority || 3,
			d: dueDays,
		};
	});
}

// --- Utility ---

function truncate(str: string, maxLength: number): string {
	if (str.length <= maxLength) return str;
	return str.slice(0, maxLength - 1) + '…';
}
