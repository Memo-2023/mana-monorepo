/**
 * External Calendars Store - Manages CalDAV/iCal/Google calendar connections
 */

import type { ExternalCalendar, ConnectExternalCalendarInput } from '@calendar/shared';
import * as api from '$lib/api/sync';
import { toastStore } from '@manacore/shared-ui';
import { get } from 'svelte/store';
import { _ } from 'svelte-i18n';

// State
let externalCalendars = $state<ExternalCalendar[]>([]);
let loading = $state(false);
let error = $state<string | null>(null);
let syncingIds = $state<Set<string>>(new Set());

function getArray(): ExternalCalendar[] {
	const arr = externalCalendars ?? [];
	return Array.isArray(arr) ? arr : [];
}

export const externalCalendarsStore = {
	get calendars() {
		return externalCalendars;
	},
	get loading() {
		return loading;
	},
	get error() {
		return error;
	},

	isSyncing(id: string) {
		return syncingIds.has(id);
	},

	async fetchCalendars() {
		loading = true;
		error = null;

		const result = await api.getExternalCalendars();

		if (result.error) {
			error = result.error.message;
			externalCalendars = [];
		} else {
			externalCalendars = result.data || [];
		}

		loading = false;
		return result;
	},

	async connect(data: ConnectExternalCalendarInput) {
		const result = await api.connectExternalCalendar(data);

		if (result.error) {
			toastStore.error(get(_)('toast.connectionError') + ': ' + result.error.message);
		} else if (result.data) {
			externalCalendars = [...externalCalendars, result.data];
			toastStore.success(get(_)('toast.calendarConnected', { values: { name: data.name } }));
		}

		return result;
	},

	async update(id: string, data: api.UpdateExternalCalendarInput) {
		const result = await api.updateExternalCalendar(id, data);

		if (result.error) {
			toastStore.error(get(_)('toast.updateError') + ': ' + result.error.message);
		} else if (result.data) {
			externalCalendars = getArray().map((c) => (c.id === id ? result.data! : c));
		}

		return result;
	},

	async disconnect(id: string) {
		const cal = getArray().find((c) => c.id === id);
		const result = await api.disconnectExternalCalendar(id);

		if (result.error) {
			toastStore.error(get(_)('toast.connectionError') + ': ' + result.error.message);
		} else {
			externalCalendars = getArray().filter((c) => c.id !== id);
			toastStore.success(
				get(_)('toast.calendarDisconnected', {
					values: { name: cal?.name || get(_)('common.calendar') },
				})
			);
		}

		return result;
	},

	async triggerSync(id: string) {
		syncingIds = new Set([...syncingIds, id]);

		const result = await api.triggerSync(id);

		if (result.error) {
			toastStore.error(get(_)('toast.syncError') + ': ' + result.error.message);
			// Update last sync error in local state
			externalCalendars = getArray().map((c) =>
				c.id === id ? { ...c, lastSyncError: result.error!.message } : c
			);
		} else {
			toastStore.success(get(_)('toast.syncCompleted'));
			// Update local state with new sync time
			externalCalendars = getArray().map((c) =>
				c.id === id ? { ...c, lastSyncAt: new Date().toISOString(), lastSyncError: null } : c
			);
		}

		const newSet = new Set(syncingIds);
		newSet.delete(id);
		syncingIds = newSet;

		return result;
	},

	async discoverCalDav(serverUrl: string, username: string, password: string) {
		return api.discoverCalDav(serverUrl, username, password);
	},

	async getGoogleAuthUrl() {
		return api.getGoogleAuthUrl();
	},

	getById(id: string) {
		return getArray().find((c) => c.id === id);
	},

	clear() {
		externalCalendars = [];
		error = null;
	},
};
