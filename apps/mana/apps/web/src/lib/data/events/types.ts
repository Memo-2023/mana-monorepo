/**
 * Domain Event types for the Mana Companion Brain.
 *
 * Every module mutation emits a typed DomainEvent via the EventBus.
 * Events carry semantic meaning ("TaskCompleted") rather than raw CRUD
 * operations ("tasks table updated"), enabling Projections, Rules, and
 * the LLM Context Builder to work without reverse-engineering field diffs.
 */

// ── Core Event Shape ────────────────────────────────

export interface DomainEvent<T extends string = string, P = unknown> {
	readonly type: T;
	readonly payload: P;
	readonly meta: EventMeta;
}

export interface EventMeta {
	/** Unique event ID */
	readonly id: string;
	/** ISO timestamp */
	readonly timestamp: string;
	/** Source module (e.g. 'todo', 'drink') */
	readonly appId: string;
	/** Source Dexie table */
	readonly collection: string;
	/** Affected record ID */
	readonly recordId: string;
	/** User who triggered this */
	readonly userId: string;
	/** Parent event ID (for trigger chains / cascades) */
	readonly causedBy?: string;
}

// ── Bus Interface ───────────────────────────────────

export type EventHandler<E extends DomainEvent = DomainEvent> = (event: E) => void;

export interface EventBus {
	/** Emit a domain event. Handlers run asynchronously via queueMicrotask. */
	emit(event: DomainEvent): void;
	/** Subscribe to a specific event type. Returns unsubscribe function. */
	on<T extends string>(type: T, handler: EventHandler): () => void;
	/** Subscribe to all events. Returns unsubscribe function. */
	onAny(handler: EventHandler): () => void;
	/** Unsubscribe a handler from a specific event type. */
	off(type: string, handler: EventHandler): void;
}
