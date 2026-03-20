import { describe, it, expect, vi, beforeEach } from 'vitest';

// Polyfill PointerEvent for jsdom
if (typeof globalThis.PointerEvent === 'undefined') {
	globalThis.PointerEvent = class PointerEvent extends MouseEvent {
		constructor(type: string, params: PointerEventInit = {}) {
			super(type, params);
		}
	} as unknown as typeof PointerEvent;
}

vi.mock('$lib/utils/calendarConstants', () => ({
	SNAP_INTERVAL_MINUTES: 15,
}));

import { useDragToCreate } from './useDragToCreate.svelte';

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
	const firstHour = 0;
	const totalHours = 24;
	const adjusted = minutes - firstHour * 60;
	return (adjusted / (totalHours * 60)) * 100;
}

describe('useDragToCreate', () => {
	let onCreateEnd: ReturnType<typeof vi.fn>;

	function createInstance(overrides = {}) {
		const container = createMockContainer();
		onCreateEnd = vi.fn();
		return useDragToCreate(() => ({
			containerEl: container,
			days: makeDays(),
			firstVisibleHour: 0,
			lastVisibleHour: 24,
			totalVisibleHours: 24,
			hourHeight: 40,
			minutesToPercent,
			isOtherOperationActive: () => false,
			onCreateEnd,
			...overrides,
		}));
	}

	it('should start in idle state', () => {
		const dtc = createInstance();
		expect(dtc.isCreating).toBe(false);
		expect(dtc.createTargetDay).toBeNull();
	});

	it('should not start create if other operation is active', () => {
		const dtc = createInstance({ isOtherOperationActive: () => true });
		const target = document.createElement('div');
		const event = new PointerEvent('pointerdown', { clientX: 100, clientY: 200 });
		Object.defineProperty(event, 'target', { value: target });
		dtc.startCreate(event);
		expect(dtc.isCreating).toBe(false);
	});

	it('should cancel on cancel()', () => {
		const dtc = createInstance();
		const target = document.createElement('div');
		const event = new PointerEvent('pointerdown', { clientX: 100, clientY: 200 });
		Object.defineProperty(event, 'target', { value: target });
		dtc.startCreate(event);
		dtc.cancel();
		expect(dtc.isCreating).toBe(false);
		expect(dtc.createTargetDay).toBeNull();
	});

	it('should generate correct preview time format', () => {
		const dtc = createInstance();
		// getCreatePreviewTime uses internal state, returns HH:MM - HH:MM format
		const time = dtc.getCreatePreviewTime();
		expect(time).toMatch(/^\d{2}:\d{2} - \d{2}:\d{2}$/);
	});
});
