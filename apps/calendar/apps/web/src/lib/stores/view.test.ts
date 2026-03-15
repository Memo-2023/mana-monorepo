import { describe, it, expect, vi, beforeEach } from 'vitest';
import { startOfWeek, startOfMonth, endOfMonth, addDays, isSameDay } from 'date-fns';

// Mock $app/environment
vi.mock('$app/environment', () => ({
	browser: false,
}));

// Mock the settings store
vi.mock('./settings.svelte', () => ({
	settingsStore: {
		weekStartsOn: 1 as 0 | 1,
		customDayCount: 30,
		defaultView: 'week',
		initialize: vi.fn(),
	},
}));

// Mock @manacore/shared-stores
vi.mock('@manacore/shared-stores', () => ({
	createAppSettingsStore: vi.fn(() => ({
		settings: { weekStartsOn: 1, customDayCount: 30, defaultView: 'week' },
		initialize: vi.fn(),
		set: vi.fn(),
		update: vi.fn(),
		reset: vi.fn(),
		getDefaults: vi.fn(),
		toggleImmersiveMode: vi.fn(),
	})),
}));

// Mock user-settings store
vi.mock('./user-settings.svelte', () => ({
	userSettings: {
		loaded: false,
		currentDeviceAppSettings: {},
		updateDeviceAppSettings: vi.fn(),
	},
}));

import { viewStore } from './view.svelte';

describe('viewStore', () => {
	beforeEach(() => {
		viewStore.setDate(new Date('2026-03-15T12:00:00'));
		viewStore.setViewType('week');
	});

	describe('setDate / currentDate', () => {
		it('should update the current date', () => {
			const newDate = new Date('2026-06-01T00:00:00');
			viewStore.setDate(newDate);
			expect(isSameDay(viewStore.currentDate, newDate)).toBe(true);
		});
	});

	describe('setViewType / viewType', () => {
		it('should update the view type', () => {
			viewStore.setViewType('month');
			expect(viewStore.viewType).toBe('month');
		});

		it('should accept all valid view types', () => {
			const types = ['week', 'month', 'agenda'] as const;

			for (const type of types) {
				viewStore.setViewType(type);
				expect(viewStore.viewType).toBe(type);
			}
		});
	});

	describe('viewRange', () => {
		it('should return correct range for week view', () => {
			viewStore.setDate(new Date('2026-03-15T12:00:00')); // Sunday
			viewStore.setViewType('week');

			const range = viewStore.viewRange;
			const expected = startOfWeek(new Date('2026-03-15'), { weekStartsOn: 1 });
			expect(isSameDay(range.start, expected)).toBe(true);
		});

		it('should return correct range for month view', () => {
			viewStore.setDate(new Date('2026-03-15T12:00:00'));
			viewStore.setViewType('month');

			const range = viewStore.viewRange;
			expect(isSameDay(range.start, startOfMonth(new Date('2026-03-15')))).toBe(true);
			expect(isSameDay(range.end, endOfMonth(new Date('2026-03-15')))).toBe(true);
		});

		it('should return correct range for agenda view (30 days)', () => {
			viewStore.setDate(new Date('2026-03-15T12:00:00'));
			viewStore.setViewType('agenda');

			const range = viewStore.viewRange;
			expect(isSameDay(range.start, new Date('2026-03-15'))).toBe(true);
			expect(isSameDay(range.end, addDays(new Date('2026-03-15'), 30))).toBe(true);
		});
	});

	describe('goToNext / goToPrevious', () => {
		it('should navigate forward by 1 week in week view', () => {
			viewStore.setDate(new Date('2026-03-15T12:00:00'));
			viewStore.setViewType('week');

			viewStore.goToNext();
			expect(isSameDay(viewStore.currentDate, new Date('2026-03-22'))).toBe(true);
		});

		it('should navigate backward by 1 week in week view', () => {
			viewStore.setDate(new Date('2026-03-15T12:00:00'));
			viewStore.setViewType('week');

			viewStore.goToPrevious();
			expect(isSameDay(viewStore.currentDate, new Date('2026-03-08'))).toBe(true);
		});

		it('should navigate forward by 1 month in month view', () => {
			viewStore.setDate(new Date('2026-03-15T12:00:00'));
			viewStore.setViewType('month');

			viewStore.goToNext();
			expect(viewStore.currentDate.getMonth()).toBe(3); // April
			expect(viewStore.currentDate.getDate()).toBe(15);
		});

		it('should navigate backward by 1 month in month view', () => {
			viewStore.setDate(new Date('2026-03-15T12:00:00'));
			viewStore.setViewType('month');

			viewStore.goToPrevious();
			expect(viewStore.currentDate.getMonth()).toBe(1); // February
			expect(viewStore.currentDate.getDate()).toBe(15);
		});

		it('should navigate forward by 7 days in agenda view', () => {
			viewStore.setDate(new Date('2026-03-15T12:00:00'));
			viewStore.setViewType('agenda');

			viewStore.goToNext();
			expect(isSameDay(viewStore.currentDate, new Date('2026-03-22'))).toBe(true);
		});

		it('should navigate backward by 7 days in agenda view', () => {
			viewStore.setDate(new Date('2026-03-15T12:00:00'));
			viewStore.setViewType('agenda');

			viewStore.goToPrevious();
			expect(isSameDay(viewStore.currentDate, new Date('2026-03-08'))).toBe(true);
		});
	});

	describe('goToToday', () => {
		it('should set date to today', () => {
			viewStore.setDate(new Date('2020-01-01'));
			viewStore.goToToday();

			const today = new Date();
			expect(isSameDay(viewStore.currentDate, today)).toBe(true);
		});
	});
});
