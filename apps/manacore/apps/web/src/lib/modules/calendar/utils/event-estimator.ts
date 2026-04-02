/**
 * Event Duration Estimator & Conflict Detector
 *
 * Duration: suggests event duration based on historical events
 * using weighted similarity (calendar, title overlap, tags).
 *
 * Conflict: checks for overlapping events in a given time range.
 *
 * Both run fully offline against local IndexedDB data.
 */

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

function getEventDuration(event: HistoricalEventData): number | null {
	if (event.allDay) return null;
	const start = new Date(event.startDate).getTime();
	const end = new Date(event.endDate).getTime();
	const minutes = (end - start) / 60_000;
	if (minutes >= 5 && minutes <= 720) return Math.round(minutes);
	return null;
}

function similarity(
	newEvent: { title: string; calendarId?: string | null; tagIds?: string[] },
	historical: HistoricalEventData,
	newTokens: string[]
): number {
	let score = 0;

	if (
		newEvent.calendarId &&
		historical.calendarId &&
		newEvent.calendarId === historical.calendarId
	) {
		score += 3;
	}

	if (newEvent.tagIds && historical.tagIds) {
		const histSet = new Set(historical.tagIds);
		const shared = newEvent.tagIds.filter((id) => histSet.has(id)).length;
		score += shared * 2;
	}

	const histTokens = tokenize(historical.title);
	const overlap = titleOverlap(newTokens, histTokens);
	if (overlap > 0.5) score += 4;
	else if (overlap > 0.2) score += 2;
	else if (overlap > 0) score += 1;

	return score;
}

function roundToNice(minutes: number): number {
	if (minutes <= 10) return Math.round(minutes / 5) * 5 || 5;
	if (minutes <= 30) return Math.round(minutes / 5) * 5;
	if (minutes <= 60) return Math.round(minutes / 15) * 15;
	if (minutes <= 240) return Math.round(minutes / 30) * 30;
	return Math.round(minutes / 60) * 60;
}

export function estimateEventDuration(
	newEvent: { title: string; calendarId?: string | null; tagIds?: string[] },
	history: HistoricalEventData[],
	minSamples = 3
): DurationEstimate | null {
	const newTokens = tokenize(newEvent.title);
	const scored: { duration: number; score: number }[] = [];

	for (const event of history) {
		const duration = getEventDuration(event);
		if (duration === null) continue;
		const score = similarity(newEvent, event, newTokens);
		if (score > 0) scored.push({ duration, score });
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

// ── Conflict Detection ───────────────────────────────────

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

	if (newStart >= newEnd) return { hasConflict: false, conflicts: [] };

	const conflicts: ConflictingEvent[] = [];

	for (const event of existingEvents) {
		if (event.id === excludeEventId) continue;
		if (event.allDay) continue;

		const eventStart = new Date(event.startDate).getTime();
		const eventEnd = new Date(event.endDate).getTime();

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

	return { hasConflict: conflicts.length > 0, conflicts };
}
