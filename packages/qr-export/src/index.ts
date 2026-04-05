/**
 * @mana/qr-export
 *
 * QR code export/import for personal data (contacts, events, todos, user context).
 * Compresses data to fit within a single QR code (~2,500 bytes).
 *
 * @example
 * ```ts
 * import { createManaQRExport, decode } from '@mana/qr-export';
 *
 * // Create export
 * const result = createManaQRExport()
 *   .user({ n: 'Till', z: 'Europe/Berlin', l: 'de' })
 *   .addContact({ n: 'Mama', p: '+491701234567', r: 1 })
 *   .addEvent({ t: 'Meeting', s: Date.now() / 1000, d: 60 })
 *   .addTodo({ t: 'Backup machen', p: 1, d: 7 })
 *   .encode();
 *
 * console.log(result.data);     // "MANA1:eJy..." (use for QR code)
 * console.log(result.fitsInQR); // true
 *
 * // Decode
 * const decoded = decode(result.data);
 * if (decoded.success) {
 *   console.log(decoded.data.u.n); // "Till"
 * }
 * ```
 */

// Types
export type {
	ManaQRExport,
	ManaQRUserContext,
	ManaQRContact,
	ManaQREvent,
	ManaQRTodo,
	ContactRelation,
	TodoPriority,
	EncodeResult,
	DecodeResult,
	DecodeError,
} from './types';

export { MANA_QR_LIMITS, RELATION_LABELS, PRIORITY_LABELS } from './types';

// Encoder/Decoder
export {
	encode,
	decode,
	estimateSize,
	willFitInQR,
	MANA_QR_PREFIX,
	MANA_QR_VERSION,
} from './encoder';

// Selectors
export type { ContactInput, EventInput, TodoInput } from './selectors';

export { selectTopContacts, selectUpcomingEvents, selectPriorityTodos } from './selectors';

// Builder
export { ManaQRExportBuilder, createManaQRExport, contact, event, todo } from './builder';

// QR Code Generation
export type { QRGenerateOptions } from './generate';
export { toDataURL, toSVG, toTerminal, toCanvas, toFile } from './generate';
