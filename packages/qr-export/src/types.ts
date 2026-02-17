/**
 * ManaQR Export Format Types
 *
 * Compact format for exporting personal data to QR codes.
 * Target size: ~2,500 bytes (fits in single QR code)
 */

/** Relation type for contacts */
export type ContactRelation =
	| 1 // Familie
	| 2 // Partner
	| 3 // Freund
	| 4 // Arbeit
	| 5; // Notfall

/** Priority level for todos */
export type TodoPriority =
	| 1 // Hoch
	| 2 // Mittel
	| 3; // Niedrig

/** Minimal contact data */
export interface ManaQRContact {
	/** Name (required) */
	n: string;
	/** Phone number */
	p?: string;
	/** Email */
	e?: string;
	/** Relation type */
	r: ContactRelation;
}

/** Minimal calendar event data */
export interface ManaQREvent {
	/** Title (max 30 chars recommended) */
	t: string;
	/** Start time as Unix timestamp (seconds) */
	s: number;
	/** Duration in minutes */
	d: number;
	/** Location (short) */
	l?: string;
}

/** Minimal todo data */
export interface ManaQRTodo {
	/** Title (max 40 chars recommended) */
	t: string;
	/** Priority 1-3 */
	p: TodoPriority;
	/** Due date as days from export date (0-255) */
	d?: number;
}

/** User context data */
export interface ManaQRUserContext {
	/** Name */
	n: string;
	/** Timezone (e.g., "Europe/Berlin") */
	z?: string;
	/** Language code (e.g., "de") */
	l?: string;
	/** Location/City */
	w?: string;
	/** Profession/Job */
	b?: string;
	/** Status/Motto */
	m?: string;
}

/** Main export format */
export interface ManaQRExport {
	/** Format version */
	v: 1;
	/** Export timestamp (Unix seconds) */
	ts: number;
	/** User context */
	u: ManaQRUserContext;
	/** Top contacts (recommended: 5) */
	c: ManaQRContact[];
	/** Upcoming events (recommended: 10) */
	e: ManaQREvent[];
	/** Priority todos (recommended: 15) */
	t: ManaQRTodo[];
}

/** Result of encoding */
export interface EncodeResult {
	/** Encoded string for QR code */
	data: string;
	/** Size in bytes */
	size: number;
	/** Whether it fits in a single QR code */
	fitsInQR: boolean;
}

/** Decode error types */
export type DecodeError =
	| 'INVALID_PREFIX'
	| 'INVALID_BASE64'
	| 'DECOMPRESSION_FAILED'
	| 'INVALID_JSON'
	| 'INVALID_VERSION'
	| 'INVALID_STRUCTURE';

/** Result of decoding */
export type DecodeResult =
	| { success: true; data: ManaQRExport }
	| { success: false; error: DecodeError; message: string };

/** Limits for QR export */
export const MANA_QR_LIMITS = {
	/** Max bytes for QR code (with some buffer) */
	MAX_QR_BYTES: 2500,
	/** Recommended max contacts */
	MAX_CONTACTS: 5,
	/** Recommended max events */
	MAX_EVENTS: 10,
	/** Recommended max todos */
	MAX_TODOS: 15,
	/** Max title length for events */
	MAX_EVENT_TITLE: 30,
	/** Max title length for todos */
	MAX_TODO_TITLE: 40,
} as const;

/** Relation labels (for UI) */
export const RELATION_LABELS: Record<ContactRelation, string> = {
	1: 'Familie',
	2: 'Partner',
	3: 'Freund',
	4: 'Arbeit',
	5: 'Notfall',
};

/** Priority labels (for UI) */
export const PRIORITY_LABELS: Record<TodoPriority, string> = {
	1: 'Hoch',
	2: 'Mittel',
	3: 'Niedrig',
};
