/**
 * Times module — barrel exports.
 */

// ─── Times Stores ─────────────────────────────────────────
export { timerStore } from './stores/timer.svelte';
export { focusStore } from './stores/focus.svelte';
export { viewStore } from './stores/view.svelte';

// ─── Clock Stores (merged from clock module) ──────────────
export { alarmsStore } from './stores/alarms.svelte';
export { countdownTimersStore } from './stores/countdown-timers.svelte';
export { worldClocksStore } from './stores/world-clocks.svelte';
export { stopwatchesStore, formatTime, formatLapTime } from './stores/stopwatch.svelte';
export { sessionAlarmsStore } from './stores/session-alarms.svelte';
export { sessionCountdownTimersStore } from './stores/session-countdown-timers.svelte';

// ─── Times Queries ────────────────────────────────────────
export {
	useAllClients,
	useAllProjects,
	useAllTimeEntries,
	useAllTags,
	useAllTemplates,
	useSettings,
	toClient,
	toProject,
	toTimeEntry,
	toTemplate,
	toSettings,
	formatDuration,
	formatDurationCompact,
	formatDurationDecimal,
	getEntriesByDate,
	getEntriesByDateRange,
	getTotalDuration,
	getBillableDuration,
	groupEntriesByDate,
	groupEntriesByProject,
	getFilteredEntries,
	getSortedEntries,
	getActiveProjects,
	getActiveClients,
	getProjectById,
	getClientById,
	getProjectsByClient,
} from './queries';

// ─── Clock Queries (merged from clock module) ─────────────
export {
	useAllAlarms,
	useAllCountdownTimers,
	useAllWorldClocks,
	allAlarms$,
	allCountdownTimers$,
	allWorldClocks$,
	toAlarm,
	toCountdownTimer,
	toWorldClock,
	filterEnabledAlarms,
	filterActiveCountdownTimers,
	sortWorldClocksByOrder,
} from './queries';

// ─── Times Collections ───────────────────────────────────
export {
	clientTable,
	projectTable,
	timeEntryTable,
	templateTable,
	settingsTable,
	TIMES_GUEST_SEED,
} from './collections';

// ─── Clock Collections (merged from clock module) ─────────
export { alarmTable, countdownTimerTable, worldClockTable } from './collections';

// ─── Utils ────────────────────────────────────────────────
export { roundDuration } from './utils/rounding';
export { exportEntriesToCSV } from './utils/export';

// ─── Times Types ──────────────────────────────────────────
export { PROJECT_COLORS } from './types';
export type {
	LocalClient,
	LocalProject,
	LocalTimeEntry,
	LocalTemplate,
	LocalSettings,
	BillingRate,
	ProjectVisibility,
	EntrySourceRef,
	Client,
	Project,
	TimeEntry,
	Tag,
	EntryTemplate,
	TimesSettings,
	FilterCriteria,
	SortOption,
	SavedFilter,
	ViewMode,
	RoundingMethod,
} from './types';

// ─── Clock Types (merged from clock module) ───────────────
export type { LocalAlarm, LocalCountdownTimer, LocalWorldClock } from './types';
