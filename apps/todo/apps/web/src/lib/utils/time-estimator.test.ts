import { describe, it, expect } from 'vitest';
import { estimateDuration, type CompletedTaskData } from './time-estimator';

function makeTask(overrides: Partial<CompletedTaskData> = {}): CompletedTaskData {
	return {
		title: 'Default task',
		projectId: null,
		labelIds: [],
		priority: 'medium',
		estimatedDuration: 30,
		completedAt: '2026-03-28T12:00:00Z',
		createdAt: '2026-03-28T11:30:00Z',
		...overrides,
	};
}

describe('estimateDuration', () => {
	it('should return null with insufficient data', () => {
		const result = estimateDuration(
			{ title: 'New task', priority: 'medium' },
			[makeTask(), makeTask()] // only 2, need 3
		);
		expect(result).toBeNull();
	});

	it('should estimate from similar tasks in same project', () => {
		const history = Array.from({ length: 5 }, () =>
			makeTask({ projectId: 'proj-1', estimatedDuration: 60 })
		);

		const result = estimateDuration(
			{ title: 'Something', projectId: 'proj-1', priority: 'medium' },
			history
		);

		expect(result).not.toBeNull();
		expect(result!.minutes).toBe(60);
		expect(result!.sampleSize).toBe(5);
	});

	it('should weight title overlap higher', () => {
		const history = [
			// 3 "Einkaufen" tasks at 45min
			makeTask({ title: 'Einkaufen Rewe', estimatedDuration: 45 }),
			makeTask({ title: 'Einkaufen Aldi', estimatedDuration: 45 }),
			makeTask({ title: 'Einkaufen Edeka', estimatedDuration: 45 }),
			// 3 unrelated tasks at 120min, different priority to avoid matching
			makeTask({ title: 'Report schreiben', priority: 'high', estimatedDuration: 120 }),
			makeTask({ title: 'Meeting vorbereiten', priority: 'high', estimatedDuration: 120 }),
			makeTask({ title: 'Docs updaten', priority: 'high', estimatedDuration: 120 }),
		];

		const result = estimateDuration({ title: 'Einkaufen Lidl', priority: 'medium' }, history);

		expect(result).not.toBeNull();
		// Should be closer to 45 than 120 because title overlap matters more
		expect(result!.minutes).toBeLessThan(60);
	});

	it('should use completedAt - createdAt when no estimatedDuration', () => {
		const history = Array.from({ length: 5 }, () =>
			makeTask({
				title: 'Meeting',
				estimatedDuration: null,
				createdAt: '2026-03-28T10:00:00Z',
				completedAt: '2026-03-28T10:30:00Z', // 30 min
			})
		);

		const result = estimateDuration({ title: 'Meeting prep', priority: 'medium' }, history);

		expect(result).not.toBeNull();
		expect(result!.minutes).toBe(30);
	});

	it('should round to nice numbers', () => {
		const history = Array.from({ length: 5 }, () =>
			makeTask({ projectId: 'p1', estimatedDuration: 37 })
		);

		const result = estimateDuration(
			{ title: 'Task', projectId: 'p1', priority: 'medium' },
			history
		);

		expect(result).not.toBeNull();
		// 37 minutes should round to 35 or 40 (nearest 5)
		expect(result!.minutes % 5).toBe(0);
	});

	it('should return higher confidence with more samples and better scores', () => {
		const history = Array.from({ length: 15 }, () =>
			makeTask({
				title: 'Standup Meeting',
				projectId: 'proj-1',
				labelIds: ['label-1'],
				estimatedDuration: 15,
			})
		);

		const result = estimateDuration(
			{ title: 'Standup Meeting', projectId: 'proj-1', labelIds: ['label-1'], priority: 'medium' },
			history
		);

		expect(result).not.toBeNull();
		expect(result!.confidence).toBe('high');
	});

	it('should ignore tasks with unreasonable completion times', () => {
		const history = [
			// These have no estimatedDuration, and completion took >8h (unreasonable)
			...Array.from({ length: 3 }, () =>
				makeTask({
					title: 'Quick task',
					estimatedDuration: null,
					createdAt: '2026-03-20T10:00:00Z',
					completedAt: '2026-03-28T10:00:00Z', // 8 days - unreasonable
				})
			),
			// These have proper durations
			...Array.from({ length: 3 }, () =>
				makeTask({
					title: 'Quick task',
					estimatedDuration: 15,
				})
			),
		];

		const result = estimateDuration({ title: 'Quick task', priority: 'medium' }, history);

		expect(result).not.toBeNull();
		expect(result!.minutes).toBe(15);
	});
});
