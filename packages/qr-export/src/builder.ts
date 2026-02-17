/**
 * ManaQR Export Builder
 *
 * Fluent API for building QR exports easily.
 */

import type {
	ManaQRExport,
	ManaQRUserContext,
	ManaQRContact,
	ManaQREvent,
	ManaQRTodo,
	EncodeResult,
	ContactRelation,
	TodoPriority,
} from './types';
import { MANA_QR_LIMITS } from './types';
import { encode, estimateSize } from './encoder';
import {
	selectTopContacts,
	selectUpcomingEvents,
	selectPriorityTodos,
	type ContactInput,
	type EventInput,
	type TodoInput,
} from './selectors';

/**
 * Builder for creating ManaQR exports
 *
 * @example
 * ```ts
 * const result = createManaQRExport()
 *   .user({ n: 'Till', z: 'Europe/Berlin', l: 'de' })
 *   .addContact({ n: 'Mama', p: '+491701234567', r: 1 })
 *   .addContact({ n: 'Papa', p: '+491707654321', r: 1 })
 *   .addEvent({ t: 'Zahnarzt', s: Date.now() + 86400000, d: 60 })
 *   .addTodo({ t: 'Steuererklärung', p: 1, d: 14 })
 *   .encode();
 * ```
 */
export class ManaQRExportBuilder {
	private _user: ManaQRUserContext = { n: '' };
	private _contacts: ManaQRContact[] = [];
	private _events: ManaQREvent[] = [];
	private _todos: ManaQRTodo[] = [];
	private _timestamp: number = Math.floor(Date.now() / 1000);

	/**
	 * Set user context
	 */
	user(context: ManaQRUserContext): this {
		this._user = context;
		return this;
	}

	/**
	 * Set user name (shorthand)
	 */
	userName(name: string): this {
		this._user.n = name;
		return this;
	}

	/**
	 * Set user timezone
	 */
	timezone(tz: string): this {
		this._user.z = tz;
		return this;
	}

	/**
	 * Set user language
	 */
	language(lang: string): this {
		this._user.l = lang;
		return this;
	}

	/**
	 * Set user location
	 */
	location(loc: string): this {
		this._user.w = loc;
		return this;
	}

	/**
	 * Add a single contact
	 */
	addContact(contact: ManaQRContact): this {
		this._contacts.push(contact);
		return this;
	}

	/**
	 * Add multiple contacts
	 */
	contacts(contacts: ManaQRContact[]): this {
		this._contacts.push(...contacts);
		return this;
	}

	/**
	 * Add contacts from input format (auto-selects top contacts)
	 */
	contactsFrom(inputs: ContactInput[], limit: number = MANA_QR_LIMITS.MAX_CONTACTS): this {
		this._contacts = selectTopContacts(inputs, limit);
		return this;
	}

	/**
	 * Add a single event
	 */
	addEvent(event: ManaQREvent): this {
		this._events.push(event);
		return this;
	}

	/**
	 * Add multiple events
	 */
	events(events: ManaQREvent[]): this {
		this._events.push(...events);
		return this;
	}

	/**
	 * Add events from input format (auto-selects upcoming)
	 */
	eventsFrom(inputs: EventInput[], limit: number = MANA_QR_LIMITS.MAX_EVENTS): this {
		this._events = selectUpcomingEvents(inputs, limit);
		return this;
	}

	/**
	 * Add a single todo
	 */
	addTodo(todo: ManaQRTodo): this {
		this._todos.push(todo);
		return this;
	}

	/**
	 * Add multiple todos
	 */
	todos(todos: ManaQRTodo[]): this {
		this._todos.push(...todos);
		return this;
	}

	/**
	 * Add todos from input format (auto-selects by priority)
	 */
	todosFrom(inputs: TodoInput[], limit: number = MANA_QR_LIMITS.MAX_TODOS): this {
		this._todos = selectPriorityTodos(inputs, limit);
		return this;
	}

	/**
	 * Set custom timestamp (Unix seconds)
	 */
	timestamp(ts: number): this {
		this._timestamp = ts;
		return this;
	}

	/**
	 * Build the export data (without encoding)
	 */
	build(): ManaQRExport {
		return {
			v: 1,
			ts: this._timestamp,
			u: this._user,
			c: this._contacts,
			e: this._events,
			t: this._todos,
		};
	}

	/**
	 * Estimate encoded size in bytes
	 */
	estimateSize(): number {
		return estimateSize(this.build());
	}

	/**
	 * Check if current data will fit in a QR code
	 */
	willFit(): boolean {
		return this.estimateSize() <= MANA_QR_LIMITS.MAX_QR_BYTES;
	}

	/**
	 * Encode to QR-ready string
	 */
	encode(): EncodeResult {
		return encode(this.build());
	}
}

/**
 * Create a new ManaQR export builder
 */
export function createManaQRExport(): ManaQRExportBuilder {
	return new ManaQRExportBuilder();
}

// --- Quick helpers for common formats ---

/**
 * Create a contact in compact format
 */
export function contact(
	name: string,
	phone?: string,
	relation: ContactRelation = 3
): ManaQRContact {
	return { n: name, p: phone, r: relation };
}

/**
 * Create an event in compact format
 */
export function event(
	title: string,
	startDate: Date,
	durationMinutes = 60,
	location?: string
): ManaQREvent {
	return {
		t: title,
		s: Math.floor(startDate.getTime() / 1000),
		d: durationMinutes,
		l: location,
	};
}

/**
 * Create a todo in compact format
 */
export function todo(title: string, priority: TodoPriority = 2, dueDays?: number): ManaQRTodo {
	return { t: title, p: priority, d: dueDays };
}
