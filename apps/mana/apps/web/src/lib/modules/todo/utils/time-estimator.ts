/**
 * Smart Duration Estimation — History-based task duration estimation.
 *
 * Analyzes completed tasks with known durations to suggest durations for new tasks.
 * Uses weighted scoring by: labels, title similarity, priority.
 * Fully offline — reads from IndexedDB.
 */

import { taskTable } from '../collections';
import type { LocalTask, TaskPriority } from '../types';

export interface DurationEstimate {
	minutes: number;
	confidence: 'low' | 'medium' | 'high';
	sampleSize: number;
}

/**
 * Estimate duration for a new task based on historical data.
 */
export async function estimateDuration(
	title: string,
	options?: {
		priority?: TaskPriority;
		labelIds?: string[];
		defaultDuration?: number;
	}
): Promise<DurationEstimate | null> {
	const allTasks = await taskTable.toArray();
	const completed = allTasks.filter(
		(t) => t.isCompleted && t.estimatedDuration && t.estimatedDuration > 0 && !t.deletedAt
	);

	if (completed.length < 3) return null;

	// Score each historical task by relevance
	const scored = completed.map((t) => {
		let score = 1;

		// Title similarity (simple word overlap)
		const titleWords = new Set(
			title
				.toLowerCase()
				.split(/\s+/)
				.filter((w) => w.length > 2)
		);
		const taskWords = new Set(
			t.title
				.toLowerCase()
				.split(/\s+/)
				.filter((w) => w.length > 2)
		);
		let overlap = 0;
		for (const w of titleWords) {
			if (taskWords.has(w)) overlap++;
		}
		if (titleWords.size > 0) {
			score += (overlap / titleWords.size) * 3;
		}

		// Priority match
		if (options?.priority && t.priority === options.priority) {
			score += 1;
		}

		// Label overlap
		if (options?.labelIds && options.labelIds.length > 0) {
			const taskLabels: string[] = (t.metadata as { labelIds?: string[] })?.labelIds ?? [];
			const labelOverlap = options.labelIds.filter((id) => taskLabels.includes(id)).length;
			score += labelOverlap * 1.5;
		}

		return { task: t, score, duration: t.estimatedDuration! };
	});

	// Sort by score descending and take top matches
	scored.sort((a, b) => b.score - a.score);
	const top = scored.slice(0, 10);

	if (top.length === 0) return null;

	// Weighted average
	const totalWeight = top.reduce((sum, s) => sum + s.score, 0);
	const weightedAvg = top.reduce((sum, s) => sum + s.duration * s.score, 0) / totalWeight;

	// Round to nearest 5 minutes
	const minutes = Math.round(weightedAvg / 5) * 5;

	// Determine confidence
	const maxScore = Math.max(...top.map((s) => s.score));
	let confidence: DurationEstimate['confidence'] = 'low';
	if (top.length >= 5 && maxScore > 3) confidence = 'high';
	else if (top.length >= 3 && maxScore > 2) confidence = 'medium';

	return {
		minutes: Math.max(5, minutes),
		confidence,
		sampleSize: top.length,
	};
}
