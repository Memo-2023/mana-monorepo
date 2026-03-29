/**
 * Event Duration Estimator & Conflict Detector
 *
 * Duration estimation: suggests event duration based on historical events
 * using weighted similarity (calendar, title overlap, tags, time of day).
 *
 * Conflict detection: checks for overlapping events in a given time range.
 *
 * Both run fully offline against local IndexedDB data.
 */

// ─── Duration Estimation ───────────────────────────────────

export interface HistoricalEventData {
	title: string;
	calendarId?: string | null;
	startDate: string;
	endDate: string;
	allDay?: boolean;
	tagIds?: string[];
}

export interface DurationEstimate {
	minutes: number;
	confidence: 'low' | 'medium' | 'high';
	sampleSize: number;
}

interface ScoredEvent {
	duration: number; // minutes
	score: number;
}

const STOP_WORDS = new Set([
	'der',
	'die',
	'das',
	'ein',
	'eine',
	'und',
	'oder',
	'für',
	'mit',
	'von',
	'zu',
	'im',
	'am',
	'an',
	'auf',
	'in',
	'den',
	'dem',
	'des',
	'bei',
	'nach',
	'the',
	'a',
	'an',
	'and',
	'or',
	'for',
	'with',
	'from',
	'to',
	'in',
	'on',
	'at',
]);

function tokenize(title: string): string[] {
	return title
		.toLowerCase()
		.replace(/[^a-zäöüßàáâãèéêëìíîïòóôõùúûü0-9\s]/g, '')
		.split(/\s+/)
		.filter((w) => w.length > 2 && !STOP_WORDS.has(w));
}

function titleOverlap(a: string[], b: string[]): number {
	if (a.length === 0 || b.length === 0) return 0;
	const setB = new Set(b);
	const shared = a.filter((w) => setB.has(w)).length;
	return shared / Math.max(a.length, b.length);
}

/**
 * Get event duration in minutes. Ignores all-day events and unreasonable durations.
 */
function getEventDuration(event: HistoricalEventData): number | null {
	if (event.allDay) return null;

	const start = new Date(event.startDate).getTime();
	const end = new Date(event.endDate).getTime();
	const minutes = (end - start) / 60_000;

	// Only use reasonable durations (5 min to 12 hours)
	if (minutes >= 5 && minutes <= 720) {
		return Math.round(minutes);
	}
	return null;
}

function similarity(
	newEvent: { title: string; calendarId?: string | null; tagIds?: string[] },
	historical: HistoricalEventData,
	newTokens: string[]
): number {
	let score = 0;

	// Same calendar is strongest signal
	if (
		newEvent.calendarId &&
		historical.calendarId &&
		newEvent.calendarId === historical.calendarId
	) {
		score += 3;
	}

	// Shared tags
	if (newEvent.tagIds && historical.tagIds) {
		const histSet = new Set(historical.tagIds);
		const shared = newEvent.tagIds.filter((id) => histSet.has(id)).length;
		score += shared * 2;
	}

	// Title word overlap
	const histTokens = tokenize(historical.title);
	const overlap = titleOverlap(newTokens, histTokens);
	if (overlap > 0.5)
		score += 4; // title match is very strong for events
	else if (overlap > 0.2) score += 2;
	else if (overlap > 0) score += 1;

	return score;
}

/**
 * Round minutes to human-friendly values
 */
function roundToNice(minutes: number): number {
	if (minutes <= 10) return Math.round(minutes / 5) * 5 || 5;
	if (minutes <= 30) return Math.round(minutes / 5) * 5;
	if (minutes <= 60) return Math.round(minutes / 15) * 15;
	if (minutes <= 240) return Math.round(minutes / 30) * 30;
	return Math.round(minutes / 60) * 60;
}

/**
 * Estimate duration for a new event based on past events.
 */
export function estimateEventDuration(
	newEvent: { title: string; calendarId?: string | null; tagIds?: string[] },
	history: HistoricalEventData[],
	minSamples = 3
): DurationEstimate | null {
	const newTokens = tokenize(newEvent.title);
	const scored: ScoredEvent[] = [];

	for (const event of history) {
		const duration = getEventDuration(event);
		if (duration === null) continue;

		const score = similarity(newEvent, event, newTokens);
		if (score > 0) {
			scored.push({ duration, score });
		}
	}

	if (scored.length < minSamples) return null;

	scored.sort((a, b) => b.score - a.score);
	const top = scored.slice(0, 20);

	let totalWeight = 0;
	let totalDuration = 0;
	for (const { duration, score } of top) {
		totalWeight += score;
		totalDuration += duration * score;
	}

	const minutes = roundToNice(Math.round(totalDuration / totalWeight));

	const maxScore = top[0].score;
	const confidence: DurationEstimate['confidence'] =
		top.length >= 10 && maxScore >= 5
			? 'high'
			: top.length >= 5 && maxScore >= 3
				? 'medium'
				: 'low';

	return { minutes, confidence, sampleSize: top.length };
}

// ─── Conflict Detection ────────────────────────────────────

export interface ConflictingEvent {
	id: string;
	title: string;
	startDate: string;
	endDate: string;
	calendarId: string;
}

export interface ConflictResult {
	hasConflict: boolean;
	conflicts: ConflictingEvent[];
}

/**
 * Check if a proposed event overlaps with existing events.
 * Two events overlap if: eventA.start < eventB.end AND eventA.end > eventB.start
 *
 * @param startDate - Proposed event start (ISO string or Date)
 * @param endDate - Proposed event end (ISO string or Date)
 * @param existingEvents - All events to check against
 * @param excludeEventId - Exclude this event (for editing existing events)
 */
export function detectConflicts(
	startDate: string | Date,
	endDate: string | Date,
	existingEvents: {
		id: string;
		title: string;
		startDate: string;
		endDate: string;
		calendarId: string;
		allDay?: boolean;
	}[],
	excludeEventId?: string
): ConflictResult {
	const newStart = new Date(startDate).getTime();
	const newEnd = new Date(endDate).getTime();

	if (newStart >= newEnd) {
		return { hasConflict: false, conflicts: [] };
	}

	const conflicts: ConflictingEvent[] = [];

	for (const event of existingEvents) {
		if (event.id === excludeEventId) continue;
		if (event.allDay) continue; // all-day events don't block time

		const eventStart = new Date(event.startDate).getTime();
		const eventEnd = new Date(event.endDate).getTime();

		// Overlap check: A.start < B.end AND A.end > B.start
		if (newStart < eventEnd && newEnd > eventStart) {
			conflicts.push({
				id: event.id,
				title: event.title,
				startDate: event.startDate,
				endDate: event.endDate,
				calendarId: event.calendarId,
			});
		}
	}

	return {
		hasConflict: conflicts.length > 0,
		conflicts,
	};
}
