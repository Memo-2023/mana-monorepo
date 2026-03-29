/**
 * Time Estimator — Suggests task duration based on historical data
 *
 * Uses weighted similarity scoring across project, labels, title words,
 * and priority to find similar completed tasks and compute a weighted average.
 *
 * Fully offline — runs against local IndexedDB data.
 */

export interface CompletedTaskData {
	title: string;
	projectId?: string | null;
	labelIds?: string[];
	priority: string;
	estimatedDuration?: number | null; // minutes
	completedAt?: string | null;
	createdAt?: string | null;
}

export interface DurationEstimate {
	minutes: number;
	confidence: 'low' | 'medium' | 'high';
	sampleSize: number;
}

interface ScoredTask {
	duration: number;
	score: number;
}

const STOP_WORDS = new Set([
	// German
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
	'ist',
	'sind',
	'bei',
	'nach',
	'vor',
	'über',
	'noch',
	'nicht',
	'sich',
	'auch',
	'mal',
	// English
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
	'is',
	'are',
	'not',
	'also',
]);

/**
 * Normalize and tokenize a title into significant words
 */
function tokenize(title: string): string[] {
	return title
		.toLowerCase()
		.replace(/[^a-zäöüßàáâãèéêëìíîïòóôõùúûü0-9\s]/g, '')
		.split(/\s+/)
		.filter((w) => w.length > 2 && !STOP_WORDS.has(w));
}

/**
 * Calculate Jaccard-like overlap between two token sets
 */
function titleOverlap(a: string[], b: string[]): number {
	if (a.length === 0 || b.length === 0) return 0;
	const setB = new Set(b);
	const shared = a.filter((w) => setB.has(w)).length;
	return shared / Math.max(a.length, b.length);
}

/**
 * Compute similarity score between a new task and a historical task
 */
function similarity(
	newTask: { title: string; projectId?: string | null; labelIds?: string[]; priority: string },
	historical: CompletedTaskData,
	newTokens: string[]
): number {
	let score = 0;

	// Same project is the strongest signal
	if (newTask.projectId && historical.projectId && newTask.projectId === historical.projectId) {
		score += 3;
	}

	// Shared labels
	if (newTask.labelIds && historical.labelIds) {
		const histSet = new Set(historical.labelIds);
		const shared = newTask.labelIds.filter((id) => histSet.has(id)).length;
		score += shared * 2;
	}

	// Same priority
	if (newTask.priority === historical.priority) {
		score += 1;
	}

	// Title word overlap (strongest for exact matches)
	const histTokens = tokenize(historical.title);
	const overlap = titleOverlap(newTokens, histTokens);
	if (overlap > 0.5) score += 3;
	else if (overlap > 0.2) score += 2;
	else if (overlap > 0) score += 1;

	return score;
}

/**
 * Get the effective duration of a completed task in minutes.
 * Prefers estimatedDuration if set, otherwise falls back to
 * time between creation and completion (capped at 8h).
 */
function getEffectiveDuration(task: CompletedTaskData): number | null {
	if (task.estimatedDuration && task.estimatedDuration > 0) {
		return task.estimatedDuration;
	}

	if (task.completedAt && task.createdAt) {
		const diff =
			(new Date(task.completedAt).getTime() - new Date(task.createdAt).getTime()) / 60000;
		// Only use creation-to-completion if it's reasonable (5min - 8h)
		if (diff >= 5 && diff <= 480) {
			return Math.round(diff);
		}
	}

	return null;
}

/**
 * Estimate duration for a new task based on completed task history.
 *
 * @param newTask - The task to estimate
 * @param history - Completed tasks with duration data
 * @param minSamples - Minimum similar tasks needed (default: 3)
 * @returns Estimate or null if insufficient data
 */
export function estimateDuration(
	newTask: { title: string; projectId?: string | null; labelIds?: string[]; priority: string },
	history: CompletedTaskData[],
	minSamples = 3
): DurationEstimate | null {
	const newTokens = tokenize(newTask.title);

	const scored: ScoredTask[] = [];
	for (const task of history) {
		const duration = getEffectiveDuration(task);
		if (duration === null) continue;

		const score = similarity(newTask, task, newTokens);
		if (score > 0) {
			scored.push({ duration, score });
		}
	}

	if (scored.length < minSamples) return null;

	// Sort by score descending, take top 20 for stability
	scored.sort((a, b) => b.score - a.score);
	const top = scored.slice(0, 20);

	// Weighted average
	let totalWeight = 0;
	let totalDuration = 0;
	for (const { duration, score } of top) {
		totalWeight += score;
		totalDuration += duration * score;
	}

	const minutes = Math.round(totalDuration / totalWeight);

	// Round to nice numbers
	const rounded = roundToNice(minutes);

	// Confidence based on sample size and score spread
	const maxScore = top[0].score;
	const confidence: DurationEstimate['confidence'] =
		top.length >= 10 && maxScore >= 5
			? 'high'
			: top.length >= 5 && maxScore >= 3
				? 'medium'
				: 'low';

	return { minutes: rounded, confidence, sampleSize: top.length };
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
