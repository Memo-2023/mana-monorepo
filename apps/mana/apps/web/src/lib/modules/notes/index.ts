/**
 * Notes module — barrel exports.
 */

// ─── Stores ──────────────────────────────────────────────
export { notesStore } from './stores/notes.svelte';

// ─── Queries ─────────────────────────────────────────────
export { useAllNotes, toNote, searchNotes, getPreview, formatRelativeTime } from './queries';

// ─── Collections ─────────────────────────────────────────
export { noteTable, NOTES_GUEST_SEED } from './collections';

// ─── Types ───────────────────────────────────────────────
export { NOTE_COLORS } from './types';
export type { LocalNote, Note } from './types';
