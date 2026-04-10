/**
 * Journal module — barrel exports.
 */

// ─── Stores ──────────────────────────────────────────────
export { journalStore } from './stores/journal.svelte';

// ─── Queries ─────────────────────────────────────────────
export {
	useAllJournalEntries,
	useJournalEntry,
	toJournalEntry,
	searchEntries,
	groupByMonth,
	formatEntryDate,
	getOnThisDay,
	getTagStats,
	getMoodDistribution,
	computeInsights,
} from './queries';

// ─── Collections ─────────────────────────────────────────
export { journalEntryTable, JOURNAL_GUEST_SEED } from './collections';

// ─── Types ───────────────────────────────────────────────
export { MOOD_COLORS, MOOD_LABELS, MOOD_EMOJI } from './types';
export type { LocalJournalEntry, JournalEntry, JournalMood } from './types';
