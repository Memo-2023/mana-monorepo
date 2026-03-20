import { describe, it, expect, vi } from 'vitest';

// Polyfill PointerEvent for jsdom
if (typeof globalThis.PointerEvent === 'undefined') {
	globalThis.PointerEvent = class PointerEvent extends MouseEvent {
		constructor(type: string, params: PointerEventInit = {}) {
			super(type, params);
		}
	} as unknown as typeof PointerEvent;
}

vi.mock('$lib/stores/todos.svelte', () => ({
	todosStore: {
		updateTodo: vi.fn().mockResolvedValue(undefined),
	},
}));

vi.mock('$lib/utils/calendarConstants', () => ({
	SNAP_INTERVAL_MINUTES: 15,
}));

import { useTaskDragDrop } from './useTaskDragDrop.svelte';

function createMockContainer() {
	const el = {
		getBoundingClientRect: () => ({
			left: 0,
			top: 0,
			right: 700,
			bottom: 960,
			width: 700,
			height: 960,
		}),
		querySelectorAll: () => [],
		querySelector: () => null,
		parentElement: { scrollTop: 0 },
	} as unknown as HTMLElement;
	return el;
}

function makeDays(): Date[] {
	return Array.from({ length: 7 }, (_, i) => {
		const d = new Date('2026-03-02');
		d.setDate(d.getDate() + i);
		return d;
	});
}

describe('useTaskDragDrop', () => {
	function createInstance() {
		return useTaskDragDrop(() => ({
			containerEl: createMockContainer(),
			days: makeDays(),
			firstVisibleHour: 0,
			totalVisibleHours: 24,
		}));
	}

	it('should start in idle state', () => {
		const td = createInstance();
		expect(td.isTaskDragging).toBe(false);
		expect(td.isTaskResizing).toBe(false);
		expect(td.draggedTask).toBeNull();
		expect(td.resizeTask).toBeNull();
		expect(td.hasMoved).toBe(false);
	});

	it('should set isTaskDragging when startDrag is called', () => {
		const td = createInstance();
		const task = {
			id: 'task-1',
			scheduledStartTime: '10:00',
			estimatedDuration: 30,
		};
		const event = new PointerEvent('pointerdown', { clientX: 100, clientY: 200 });

		td.startDrag(task as any, event);

		expect(td.isTaskDragging).toBe(true);
		expect(td.draggedTask).toBeTruthy();
		expect(td.draggedTask!.id).toBe('task-1');

		td.cancel();
	});

	it('should set isTaskResizing when startResize is called', () => {
		const td = createInstance();
		const task = {
			id: 'task-1',
			scheduledStartTime: '10:00',
			estimatedDuration: 30,
		};
		const event = new PointerEvent('pointerdown', { clientX: 100, clientY: 200 });

		td.startResize(task as any, 'bottom', event);

		expect(td.isTaskResizing).toBe(true);
		expect(td.resizeTask).toBeTruthy();

		td.cancel();
	});

	it('should reset state on cancel', () => {
		const td = createInstance();
		const task = { id: 'task-1', scheduledStartTime: '10:00', estimatedDuration: 30 };
		const event = new PointerEvent('pointerdown', { clientX: 100, clientY: 200 });

		td.startDrag(task as any, event);
		expect(td.isTaskDragging).toBe(true);

		td.cancel();
		expect(td.isTaskDragging).toBe(false);
		expect(td.draggedTask).toBeNull();
	});

	it('should calculate preview position from task time', () => {
		const td = createInstance();
		const task = {
			id: 'task-1',
			scheduledStartTime: '12:00', // noon
			estimatedDuration: 60,
		};
		const event = new PointerEvent('pointerdown', { clientX: 100, clientY: 480 });

		td.startDrag(task as any, event);

		// Preview top should be around 50% (12:00 / 24:00)
		expect(td.taskDragPreviewTop).toBeCloseTo(50, 0);
		// Height should be ~4.17% (60 min / 1440 min)
		expect(td.taskDragPreviewHeight).toBeCloseTo(4.17, 0);

		td.cancel();
	});
});
