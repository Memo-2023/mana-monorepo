import { describe, it, expect } from 'vitest';
import type { Task, Label } from '@todo/shared';
import { applyTaskFilters, type TaskFilterCriteria } from './task-filters';

const now = new Date().toISOString();

function makeLabel(overrides: Partial<Label>): Label {
	return {
		id: 'l',
		userId: 'user-1',
		name: 'Label',
		color: '#000',
		createdAt: now,
		updatedAt: now,
		...overrides,
	};
}

// Helper to create a minimal task for testing
function makeTask(overrides: Partial<Task> = {}): Task {
	return {
		id: 'task-1',
		userId: 'user-1',
		title: 'Test Task',
		priority: 'medium',
		status: 'pending',
		isCompleted: false,
		order: 0,
		createdAt: new Date().toISOString(),
		updatedAt: new Date().toISOString(),
		...overrides,
	};
}

const emptyFilters: TaskFilterCriteria = {
	priorities: [],
	labelIds: [],
	searchQuery: '',
};

describe('applyTaskFilters', () => {
	const tasks: Task[] = [
		makeTask({ id: '1', title: 'Buy groceries', priority: 'low' }),
		makeTask({
			id: '2',
			title: 'Urgent meeting',
			priority: 'urgent',
			labels: [makeLabel({ id: 'label-1', name: 'Work', color: '#f00' })],
		}),
		makeTask({
			id: '3',
			title: 'Write report',
			priority: 'high',
			description: 'Quarterly financial report',
			labels: [
				makeLabel({ id: 'label-1', name: 'Work', color: '#f00' }),
				makeLabel({ id: 'label-2', name: 'Important', color: '#0f0' }),
			],
		}),
		makeTask({ id: '4', title: 'Relax', priority: 'low' }),
	];

	it('returns all tasks when no filters are active', () => {
		const result = applyTaskFilters(tasks, emptyFilters);
		expect(result).toHaveLength(4);
	});

	it('returns empty array for empty input', () => {
		const result = applyTaskFilters([], emptyFilters);
		expect(result).toEqual([]);
	});

	// Priority filtering
	describe('priority filter', () => {
		it('filters by single priority', () => {
			const result = applyTaskFilters(tasks, { ...emptyFilters, priorities: ['urgent'] });
			expect(result).toHaveLength(1);
			expect(result[0].id).toBe('2');
		});

		it('filters by multiple priorities', () => {
			const result = applyTaskFilters(tasks, {
				...emptyFilters,
				priorities: ['low', 'high'],
			});
			expect(result).toHaveLength(3);
			expect(result.map((t) => t.id).sort()).toEqual(['1', '3', '4']);
		});

		it('returns nothing when priority matches no tasks', () => {
			const result = applyTaskFilters(tasks, { ...emptyFilters, priorities: ['medium'] });
			expect(result).toHaveLength(0);
		});
	});

	// Label filtering
	describe('label filter', () => {
		it('filters by single label', () => {
			const result = applyTaskFilters(tasks, { ...emptyFilters, labelIds: ['label-1'] });
			expect(result).toHaveLength(2);
			expect(result.map((t) => t.id).sort()).toEqual(['2', '3']);
		});

		it('filters by label that only one task has', () => {
			const result = applyTaskFilters(tasks, { ...emptyFilters, labelIds: ['label-2'] });
			expect(result).toHaveLength(1);
			expect(result[0].id).toBe('3');
		});

		it('matches tasks having any of the filter labels (OR logic)', () => {
			const result = applyTaskFilters(tasks, {
				...emptyFilters,
				labelIds: ['label-1', 'label-2'],
			});
			expect(result).toHaveLength(2);
		});

		it('excludes tasks with no labels', () => {
			const result = applyTaskFilters(tasks, { ...emptyFilters, labelIds: ['label-1'] });
			expect(result.find((t) => t.id === '1')).toBeUndefined();
			expect(result.find((t) => t.id === '4')).toBeUndefined();
		});
	});

	// Search query filtering
	describe('search query filter', () => {
		it('filters by title match (case insensitive)', () => {
			const result = applyTaskFilters(tasks, { ...emptyFilters, searchQuery: 'urgent' });
			expect(result).toHaveLength(1);
			expect(result[0].id).toBe('2');
		});

		it('filters by description match', () => {
			const result = applyTaskFilters(tasks, { ...emptyFilters, searchQuery: 'quarterly' });
			expect(result).toHaveLength(1);
			expect(result[0].id).toBe('3');
		});

		it('is case insensitive', () => {
			const result = applyTaskFilters(tasks, { ...emptyFilters, searchQuery: 'BUY' });
			expect(result).toHaveLength(1);
			expect(result[0].id).toBe('1');
		});

		it('ignores whitespace-only query', () => {
			const result = applyTaskFilters(tasks, { ...emptyFilters, searchQuery: '   ' });
			expect(result).toHaveLength(4);
		});

		it('matches partial strings', () => {
			const result = applyTaskFilters(tasks, { ...emptyFilters, searchQuery: 'rep' });
			expect(result).toHaveLength(1);
			expect(result[0].id).toBe('3');
		});
	});

	// Combined filters
	describe('combined filters', () => {
		it('applies priority + label filter together', () => {
			const result = applyTaskFilters(tasks, {
				...emptyFilters,
				priorities: ['high', 'urgent'],
				labelIds: ['label-1'],
			});
			expect(result).toHaveLength(2);
			expect(result.map((t) => t.id).sort()).toEqual(['2', '3']);
		});

		it('applies all filters together', () => {
			const result = applyTaskFilters(tasks, {
				priorities: ['high'],
				labelIds: ['label-1'],
				searchQuery: 'report',
			});
			expect(result).toHaveLength(1);
			expect(result[0].id).toBe('3');
		});

		it('returns empty when combined filters contradict', () => {
			const result = applyTaskFilters(tasks, {
				priorities: ['low'],
				labelIds: ['label-1'], // tasks 1,4 are low but have no label-1
				searchQuery: '',
			});
			expect(result).toHaveLength(0);
		});
	});
});
