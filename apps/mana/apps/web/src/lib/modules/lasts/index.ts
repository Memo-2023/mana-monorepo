// ─── Stores ──────────────────────────────────────────────
export { lastsStore } from './stores/items.svelte';

// ─── Queries ─────────────────────────────────────────────
export { useAllLasts, useLastsByStatus, useInboxLasts, toLast, searchLasts } from './queries';

// ─── Collections ─────────────────────────────────────────
export { lastTable, lastsCooldownTable } from './collections';

// ─── Inference ───────────────────────────────────────────
export { runInferenceScan, recordDismissal, cooldownIdFor } from './inference/scan';
export type { ScanResult } from './inference/scan';
export type { InferenceCandidate, InferenceSource } from './inference/types';

// ─── Types ───────────────────────────────────────────────
export { CATEGORY_LABELS, CATEGORY_COLORS, CONFIDENCE_LABELS, STATUS_LABELS } from './types';
export type {
	LocalLast,
	Last,
	LastStatus,
	LastCategory,
	LastConfidence,
	WouldReclaim,
	InferredFrom,
} from './types';
