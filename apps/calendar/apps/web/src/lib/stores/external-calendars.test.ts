import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('$lib/api/sync', () => ({
	getExternalCalendars: vi.fn(),
	connectExternalCalendar: vi.fn(),
	updateExternalCalendar: vi.fn(),
	disconnectExternalCalendar: vi.fn(),
	triggerSync: vi.fn(),
	discoverCalDav: vi.fn(),
	getGoogleAuthUrl: vi.fn(),
}));

vi.mock('@manacore/shared-ui', () => ({
	toastStore: { error: vi.fn(), success: vi.fn() },
}));

import * as api from '$lib/api/sync';
import { externalCalendarsStore } from './external-calendars.svelte';
import type { ExternalCalendar } from '@calendar/shared';

const mockFetch = vi.mocked(api.getExternalCalendars);
const mockConnect = vi.mocked(api.connectExternalCalendar);
const mockUpdate = vi.mocked(api.updateExternalCalendar);
const mockDisconnect = vi.mocked(api.disconnectExternalCalendar);
const mockSync = vi.mocked(api.triggerSync);

function makeCal(overrides: Partial<ExternalCalendar> = {}): ExternalCalendar {
	return {
		id: 'ext-1',
		userId: 'user-1',
		name: 'Google',
		provider: 'google',
		calendarUrl: 'https://google.com/cal',
		syncEnabled: true,
		syncDirection: 'both',
		syncInterval: 15,
		lastSyncAt: null,
		lastSyncError: null,
		color: '#4285f4',
		isVisible: true,
		providerData: null,
		createdAt: '2026-03-01',
		updatedAt: '2026-03-01',
		...overrides,
	};
}

describe('externalCalendarsStore', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		externalCalendarsStore.clear();
	});

	it('should load calendars', async () => {
		mockFetch.mockResolvedValue({
			data: [makeCal({ id: 'ext-1' }), makeCal({ id: 'ext-2' })],
			error: null,
		});
		await externalCalendarsStore.fetchCalendars();
		expect(externalCalendarsStore.calendars).toHaveLength(2);
		expect(externalCalendarsStore.loading).toBe(false);
	});

	it('should set error on fetch failure', async () => {
		mockFetch.mockResolvedValue({
			data: null,
			error: { message: 'fail', code: 'ERR', status: 500 },
		});
		await externalCalendarsStore.fetchCalendars();
		expect(externalCalendarsStore.error).toBe('fail');
	});

	it('should add calendar on connect', async () => {
		mockConnect.mockResolvedValue({ data: makeCal({ id: 'new' }), error: null });
		await externalCalendarsStore.connect({ name: 'X', provider: 'caldav', calendarUrl: 'url' });
		expect(externalCalendarsStore.calendars).toHaveLength(1);
	});

	it('should remove calendar on disconnect', async () => {
		mockFetch.mockResolvedValue({ data: [makeCal()], error: null });
		await externalCalendarsStore.fetchCalendars();
		mockDisconnect.mockResolvedValue({ data: { success: true }, error: null });
		await externalCalendarsStore.disconnect('ext-1');
		expect(externalCalendarsStore.calendars).toHaveLength(0);
	});

	it('should update calendar', async () => {
		mockFetch.mockResolvedValue({ data: [makeCal({ syncEnabled: true })], error: null });
		await externalCalendarsStore.fetchCalendars();
		mockUpdate.mockResolvedValue({ data: makeCal({ syncEnabled: false }), error: null });
		await externalCalendarsStore.update('ext-1', { syncEnabled: false });
		expect(externalCalendarsStore.calendars[0].syncEnabled).toBe(false);
	});

	it('should update lastSyncAt on sync success', async () => {
		mockFetch.mockResolvedValue({ data: [makeCal({ lastSyncAt: null })], error: null });
		await externalCalendarsStore.fetchCalendars();
		mockSync.mockResolvedValue({ data: { success: true }, error: null });
		await externalCalendarsStore.triggerSync('ext-1');
		expect(externalCalendarsStore.calendars[0].lastSyncAt).not.toBeNull();
		expect(externalCalendarsStore.isSyncing('ext-1')).toBe(false);
	});

	it('should set error on sync failure', async () => {
		mockFetch.mockResolvedValue({ data: [makeCal()], error: null });
		await externalCalendarsStore.fetchCalendars();
		mockSync.mockResolvedValue({
			data: null,
			error: { message: 'Timeout', code: 'T', status: 504 },
		});
		await externalCalendarsStore.triggerSync('ext-1');
		expect(externalCalendarsStore.calendars[0].lastSyncError).toBe('Timeout');
	});

	it('should find by ID', async () => {
		mockFetch.mockResolvedValue({ data: [makeCal({ name: 'Found' })], error: null });
		await externalCalendarsStore.fetchCalendars();
		expect(externalCalendarsStore.getById('ext-1')?.name).toBe('Found');
		expect(externalCalendarsStore.getById('nope')).toBeUndefined();
	});
});
