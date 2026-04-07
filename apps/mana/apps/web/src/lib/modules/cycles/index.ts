/**
 * Cycles module — barrel exports.
 */

// ─── Stores ──────────────────────────────────────────────
export { cyclesStore } from './stores/cycles.svelte';
export { dayLogsStore } from './stores/dayLogs.svelte';
export { symptomsStore } from './stores/symptoms.svelte';

// ─── Queries ─────────────────────────────────────────────
export {
	useAllCycles,
	useCurrentCycle,
	useAllDayLogs,
	useDayLog,
	useAllSymptoms,
	toCycle,
	toCycleDayLog,
	toCycleSymptom,
	groupLogsByMonth,
	formatLogDate,
} from './queries';

// ─── Utils ───────────────────────────────────────────────
export { derivePhase, findCycleForDate, getCycleDayNumber, daysBetween } from './utils/phase';
export {
	averageCycleLength,
	predictNextPeriodStart,
	daysUntilNextPeriod,
	predictFertileWindow,
	computeCycleStats,
} from './utils/prediction';

// ─── Collections ─────────────────────────────────────────
export { cycleTable, cycleDayLogTable, cycleSymptomTable, CYCLES_GUEST_SEED } from './collections';

// ─── Types & Constants ───────────────────────────────────
export {
	FLOW_COLORS,
	FLOW_LABELS,
	MOOD_COLORS,
	MOOD_LABELS,
	PHASE_COLORS,
	PHASE_LABELS,
	CERVICAL_MUCUS_LABELS,
	DEFAULT_CYCLE_LENGTH,
	DEFAULT_PERIOD_LENGTH,
	DEFAULT_LUTEAL_LENGTH,
} from './types';
export type {
	LocalCycle,
	LocalCycleDayLog,
	LocalCycleSymptom,
	Cycle,
	CycleDayLog,
	CycleSymptom,
	Flow,
	Mood,
	CervicalMucus,
	SymptomCategory,
	CyclePhase,
} from './types';
