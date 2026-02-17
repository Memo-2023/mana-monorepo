/**
 * QR Export API Service
 *
 * Collects data from contacts, calendar, and todo services for QR export.
 */

import { contactsService, type Contact } from './contacts';
import { calendarService, type CalendarEvent } from './calendar';
import { todoService, type Task } from './todo';
import type { UserDataSummary } from './my-data';
import {
	createManaQRExport,
	type EncodeResult,
	type ContactInput,
	type EventInput,
	type TodoInput,
	type ContactRelation,
	type TodoPriority,
} from '@manacore/qr-export';

/**
 * Data collected for QR export
 */
export interface QRExportData {
	contacts: Contact[];
	events: CalendarEvent[];
	tasks: Task[];
	userData: UserDataSummary | null;
}

/**
 * Result of QR export generation
 */
export interface QRExportResult {
	encodeResult: EncodeResult;
	stats: {
		contactCount: number;
		eventCount: number;
		todoCount: number;
	};
}

/**
 * Map Contact to ContactInput for qr-export
 */
function mapContactToInput(contact: Contact): ContactInput {
	const displayName = contactsService.getDisplayName(contact);

	// Determine relation based on available data
	// Default to 3 (Freund), but this could be enhanced with actual relation data
	let relation: ContactRelation = 3;

	return {
		name: displayName,
		phone: contact.mobile || contact.phone,
		email: contact.email,
		relation,
		importance: contact.isFavorite ? 100 : 0,
	};
}

/**
 * Map CalendarEvent to EventInput for qr-export
 */
function mapEventToInput(event: CalendarEvent): EventInput {
	const startDate = new Date(event.startTime);
	const endDate = new Date(event.endTime);

	return {
		title: event.title,
		start: startDate,
		end: endDate,
		location: event.location,
		allDay: event.isAllDay,
	};
}

/**
 * Map Task to TodoInput for qr-export
 */
function mapTaskToInput(task: Task): TodoInput {
	// Map priority string to number
	const priorityMap: Record<string, TodoPriority> = {
		urgent: 1,
		high: 1,
		medium: 2,
		low: 3,
	};

	const priority = priorityMap[task.priority] || 2;

	return {
		title: task.title,
		priority,
		dueDate: task.dueDate ? new Date(task.dueDate) : undefined,
		completed: task.isCompleted,
	};
}

/**
 * QR Export service
 */
export const qrExportService = {
	/**
	 * Collect all data needed for QR export
	 */
	async collectExportData(): Promise<QRExportData> {
		// Fetch all data in parallel
		const [contactsResult, eventsResult, tasksResult] = await Promise.all([
			contactsService.getFavoriteContacts(10), // Get more, we'll filter
			calendarService.getUpcomingEvents(30), // Next 30 days
			todoService.getUpcomingTasks(30), // Next 30 days
		]);

		return {
			contacts: contactsResult.data || [],
			events: eventsResult.data || [],
			tasks: tasksResult.data || [],
			userData: null, // Will be set by caller if needed
		};
	},

	/**
	 * Generate QR export from collected data
	 */
	generateExport(
		data: QRExportData,
		options?: {
			maxContacts?: number;
			maxEvents?: number;
			maxTodos?: number;
		}
	): QRExportResult {
		const maxContacts = options?.maxContacts ?? 5;
		const maxEvents = options?.maxEvents ?? 10;
		const maxTodos = options?.maxTodos ?? 15;

		// Map to input formats
		const contactInputs = data.contacts.map(mapContactToInput);
		const eventInputs = data.events.map(mapEventToInput);
		const taskInputs = data.tasks.map(mapTaskToInput);

		// Build export using the builder
		const builder = createManaQRExport();

		// Set user context if available
		if (data.userData?.user) {
			builder.user({
				n: data.userData.user.name || data.userData.user.email.split('@')[0],
				l: 'de', // Could be derived from user settings
				z: 'Europe/Berlin', // Could be derived from user settings
			});
		} else {
			builder.userName('ManaCore User');
		}

		// Add data using smart selectors
		builder.contactsFrom(contactInputs, maxContacts);
		builder.eventsFrom(eventInputs, maxEvents);
		builder.todosFrom(taskInputs, maxTodos);

		// Encode
		const encodeResult = builder.encode();

		return {
			encodeResult,
			stats: {
				contactCount: Math.min(contactInputs.length, maxContacts),
				eventCount: Math.min(eventInputs.length, maxEvents),
				todoCount: Math.min(taskInputs.filter((t) => !t.completed).length, maxTodos),
			},
		};
	},

	/**
	 * Generate QR export with all data fetched automatically
	 */
	async generateFullExport(
		userData?: UserDataSummary | null,
		options?: {
			maxContacts?: number;
			maxEvents?: number;
			maxTodos?: number;
		}
	): Promise<QRExportResult> {
		const data = await this.collectExportData();
		data.userData = userData || null;
		return this.generateExport(data, options);
	},
};
