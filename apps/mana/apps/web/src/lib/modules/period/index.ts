/**
 * Periods module — barrel exports.
 */

// ─── Stores ──────────────────────────────────────────────
export { periodsStore } from './stores/periods.svelte';
export { dayLogsStore } from './stores/dayLogs.svelte';
export { symptomsStore } from './stores/symptoms.svelte';

// ─── Queries ─────────────────────────────────────────────
export {
	useAllPeriods,
	useCurrentPeriod,
	useAllDayLogs,
	useDayLog,
	useAllSymptoms,
	toPeriod,
	toPeriodDayLog,
	toPeriodSymptom,
	groupLogsByMonth,
	formatLogDate,
} from './queries';
export type { RelativeDateLabels } from './queries';

// ─── Utils ───────────────────────────────────────────────
export { derivePhase, findPeriodForDate, getPeriodDayNumber, daysBetween } from './utils/phase';
export {
	averagePeriodLength,
	predictNextPeriodStart,
	daysUntilNextPeriod,
	predictFertileWindow,
	computePeriodStats,
} from './utils/prediction';

// ─── Collections ─────────────────────────────────────────
export {
	periodTable,
	periodDayLogTable,
	periodSymptomTable,
	PERIODS_GUEST_SEED,
} from './collections';

// ─── Types & Constants ───────────────────────────────────
export {
	FLOW_COLORS,
	FLOW_LABELS,
	MOOD_COLORS,
	MOOD_LABELS,
	PHASE_COLORS,
	PHASE_LABELS,
	CERVICAL_MUCUS_LABELS,
	DEFAULT_PERIOD_LENGTH,
	DEFAULT_BLEEDING_DAYS,
	DEFAULT_LUTEAL_LENGTH,
} from './types';
export type {
	LocalPeriod,
	LocalPeriodDayLog,
	LocalPeriodSymptom,
	Period,
	PeriodDayLog,
	PeriodSymptom,
	Flow,
	Mood,
	CervicalMucus,
	SymptomCategory,
	PeriodPhase,
} from './types';
