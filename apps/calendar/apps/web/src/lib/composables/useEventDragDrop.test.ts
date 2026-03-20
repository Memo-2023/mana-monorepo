import { describe, it, expect, vi, beforeEach } from 'vitest';

// Polyfill PointerEvent for jsdom
if (typeof globalThis.PointerEvent === 'undefined') {
	globalThis.PointerEvent = class PointerEvent extends MouseEvent {
		constructor(type: string, params: PointerEventInit = {}) {
			super(type, params);
		}
	} as unknown as typeof PointerEvent;
}

vi.mock('$lib/utils/eventDateHelpers', () => ({
	toDate: (d: string | Date) => new Date(d),
}));

vi.mock('$lib/stores/events.svelte', () => ({
	eventsStore: {
		isDraftEvent: vi.fn(() => false),
		updateDraftEvent: vi.fn(),
		updateEvent: vi.fn().mockResolvedValue({ data: {}, error: null }),
	},
}));

vi.mock('$lib/utils/calendarConstants', () => ({
	SNAP_INTERVAL_MINUTES: 15,
}));

import { useEventDragDrop } from './useEventDragDrop.svelte';

function createMockContainer() {
	return {
		getBoundingClientRect: () => ({
			left: 0,
			top: 0,
			right: 700,
			bottom: 960,
			width: 700,
			height: 960,
		}),
		parentElement: { scrollTop: 0 },
	} as unknown as HTMLElement;
}

function makeDays(): Date[] {
	return Array.from({ length: 7 }, (_, i) => {
		const d = new Date('2026-03-02');
		d.setDate(d.getDate() + i);
		return d;
	});
}

function minutesToPercent(minutes: number): number {
	return (minutes / (24 * 60)) * 100;
}

function makeConfig() {
	return {
		containerEl: createMockContainer(),
		days: makeDays(),
		firstVisibleHour: 0,
		lastVisibleHour: 24,
		totalVisibleHours: 24,
		hourHeight: 40,
		minutesToPercent,
	};
}

describe('useEventDragDrop', () => {
	it('should start in idle state', () => {
		const dd = useEventDragDrop(() => makeConfig());
		expect(dd.isDragging).toBe(false);
		expect(dd.isResizing).toBe(false);
		expect(dd.draggedEvent).toBeNull();
		expect(dd.resizeEvent).toBeNull();
		expect(dd.hasMoved).toBe(false);
	});

	it('should set isDragging when startDrag is called', () => {
		const dd = useEventDragDrop(() => makeConfig());
		const event = {
			id: 'evt-1',
			startTime: '2026-03-02T10:00:00',
			endTime: '2026-03-02T11:00:00',
		};
		const pointerEvent = new PointerEvent('pointerdown', {
			clientX: 100,
			clientY: 200,
		});

		dd.startDrag(event as any, pointerEvent);

		expect(dd.isDragging).toBe(true);
		expect(dd.draggedEvent).toBeTruthy();
		expect(dd.draggedEvent!.id).toBe('evt-1');

		// Cleanup
		dd.cancel();
	});

	it('should set isResizing when startResize is called', () => {
		const dd = useEventDragDrop(() => makeConfig());
		const event = {
			id: 'evt-1',
			startTime: '2026-03-02T10:00:00',
			endTime: '2026-03-02T11:00:00',
		};
		const pointerEvent = new PointerEvent('pointerdown', {
			clientX: 100,
			clientY: 200,
		});

		dd.startResize(event as any, 'bottom', pointerEvent);

		expect(dd.isResizing).toBe(true);
		expect(dd.resizeEvent).toBeTruthy();

		dd.cancel();
	});

	it('should reset all state on cancel', () => {
		const dd = useEventDragDrop(() => makeConfig());
		const event = {
			id: 'evt-1',
			startTime: '2026-03-02T10:00:00',
			endTime: '2026-03-02T11:00:00',
		};
		const pointerEvent = new PointerEvent('pointerdown', {
			clientX: 100,
			clientY: 200,
		});

		dd.startDrag(event as any, pointerEvent);
		expect(dd.isDragging).toBe(true);

		dd.cancel();
		expect(dd.isDragging).toBe(false);
		expect(dd.draggedEvent).toBeNull();
	});

	it('should reset hasMoved on resetHasMoved', () => {
		const dd = useEventDragDrop(() => makeConfig());
		// hasMoved starts false
		expect(dd.hasMoved).toBe(false);
		dd.resetHasMoved();
		expect(dd.hasMoved).toBe(false);
	});

	it('should return empty string for getResizePreviewTime when not resizing', () => {
		const dd = useEventDragDrop(() => makeConfig());
		expect(dd.getResizePreviewTime()).toBe('');
	});

	it('should calculate preview positions on drag start', () => {
		const dd = useEventDragDrop(() => makeConfig());
		const event = {
			id: 'evt-1',
			startTime: '2026-03-02T12:00:00', // noon
			endTime: '2026-03-02T13:00:00', // 1pm
		};
		const pointerEvent = new PointerEvent('pointerdown', {
			clientX: 100,
			clientY: 480, // middle of container
		});

		dd.startDrag(event as any, pointerEvent);

		// Preview top should be around 50% (12:00 = 720 min / 1440 min)
		expect(dd.dragPreviewTop).toBeCloseTo(50, 0);
		// Height should be ~4.17% (60 min / 1440 min)
		expect(dd.dragPreviewHeight).toBeCloseTo(4.17, 0);

		dd.cancel();
	});
});
