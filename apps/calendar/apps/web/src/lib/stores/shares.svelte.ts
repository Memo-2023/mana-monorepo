/**
 * Calendar Shares Store - Manages calendar sharing and invitations
 */

import type { CalendarShare, CalendarShareWithDetails } from '@calendar/shared';
import * as api from '$lib/api/shares';
import { toastStore } from '@manacore/shared-ui';

// State
let shares = $state<Map<string, CalendarShare[]>>(new Map());
let invitations = $state<CalendarShare[]>([]);
let sharedWithMe = $state<CalendarShare[]>([]);
let loading = $state(false);

export const sharesStore = {
	get loading() {
		return loading;
	},
	get invitations() {
		return invitations;
	},
	get sharedWithMe() {
		return sharedWithMe;
	},

	getSharesForCalendar(calendarId: string): CalendarShare[] {
		return shares.get(calendarId) || [];
	},

	async fetchSharesForCalendar(calendarId: string) {
		const result = await api.getShares(calendarId);
		if (result.data) {
			const arr = Array.isArray(result.data) ? result.data : [];
			shares = new Map(shares).set(calendarId, arr);
		}
		return result;
	},

	async fetchInvitations() {
		const result = await api.getInvitations();
		if (result.data) {
			invitations = Array.isArray(result.data) ? result.data : [];
		}
		return result;
	},

	async fetchSharedWithMe() {
		const result = await api.getSharedWithMe();
		if (result.data) {
			sharedWithMe = Array.isArray(result.data) ? result.data : [];
		}
		return result;
	},

	async shareCalendar(calendarId: string, email: string, permission: 'read' | 'write' | 'admin') {
		const result = await api.createShare(calendarId, { calendarId, email, permission });

		if (result.error) {
			toastStore.error(`Freigabe fehlgeschlagen: ${result.error.message}`);
		} else {
			toastStore.success(`Kalender mit ${email} geteilt`);
			await this.fetchSharesForCalendar(calendarId);
		}

		return result;
	},

	async createShareLink(calendarId: string, permission: 'read' | 'write') {
		const result = await api.createShare(calendarId, {
			calendarId,
			permission,
			createLink: true,
		});

		if (result.error) {
			toastStore.error(`Link-Erstellung fehlgeschlagen: ${result.error.message}`);
		} else {
			toastStore.success('Freigabe-Link erstellt');
			await this.fetchSharesForCalendar(calendarId);
		}

		return result;
	},

	async acceptInvitation(shareId: string) {
		const result = await api.acceptShare(shareId);

		if (result.error) {
			toastStore.error(`Annahme fehlgeschlagen: ${result.error.message}`);
		} else {
			toastStore.success('Einladung angenommen');
			invitations = invitations.filter((i) => i.id !== shareId);
			await this.fetchSharedWithMe();
		}

		return result;
	},

	async declineInvitation(shareId: string) {
		const result = await api.declineShare(shareId);

		if (result.error) {
			toastStore.error(`Ablehnung fehlgeschlagen: ${result.error.message}`);
		} else {
			invitations = invitations.filter((i) => i.id !== shareId);
		}

		return result;
	},

	async removeShare(calendarId: string, shareId: string) {
		const result = await api.deleteShare(calendarId, shareId);

		if (result.error) {
			toastStore.error(`Entfernen fehlgeschlagen: ${result.error.message}`);
		} else {
			toastStore.success('Freigabe entfernt');
			const current = shares.get(calendarId) || [];
			shares = new Map(shares).set(
				calendarId,
				current.filter((s) => s.id !== shareId)
			);
		}

		return result;
	},

	async updatePermission(shareId: string, permission: 'read' | 'write' | 'admin') {
		const result = await api.updateShare(shareId, { permission });

		if (result.error) {
			toastStore.error(`Aktualisierung fehlgeschlagen: ${result.error.message}`);
		}

		return result;
	},

	clear() {
		shares = new Map();
		invitations = [];
		sharedWithMe = [];
	},
};
