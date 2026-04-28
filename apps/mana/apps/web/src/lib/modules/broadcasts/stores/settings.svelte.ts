/**
 * Broadcast settings store — singleton row per user/space.
 *
 * Same pattern as invoices settings: stable sentinel id, lazy create on
 * first read, plaintext structural fields stay out of the Dexie-tx crypto
 * boundary so ensure/get paths don't need crypto ops inside a transaction.
 */

import { encryptRecord, decryptRecords } from '$lib/data/crypto';
import { emitDomainEvent } from '$lib/data/events';
import { settingsTable } from '../collections';
import { BROADCAST_SETTINGS_ID } from '../constants';
import type { LocalBroadcastSettings, BroadcastSettings } from '../types';
import { toSettings } from '../queries';

async function ensureSettings(): Promise<LocalBroadcastSettings> {
	const existing = await settingsTable.get(BROADCAST_SETTINGS_ID);
	if (existing) return existing;

	const defaults: LocalBroadcastSettings = {
		id: BROADCAST_SETTINGS_ID,
		defaultFromName: '',
		defaultFromEmail: '',
		defaultReplyTo: null,
		defaultFooter: null,
		dnsCheck: null,
		legalAddress: '',
		unsubscribeLandingCopy: null,
	};
	const wrapped = { ...defaults };
	await encryptRecord('broadcastSettings', wrapped);
	await settingsTable.add(wrapped);
	return wrapped;
}

export const broadcastSettingsStore = {
	async get(): Promise<BroadcastSettings> {
		await ensureSettings();
		const row = await settingsTable.get(BROADCAST_SETTINGS_ID);
		if (!row) throw new Error('[broadcast] settings row vanished after ensure');
		const [decrypted] = (await decryptRecords('broadcastSettings', [
			row,
		])) as LocalBroadcastSettings[];
		return toSettings(decrypted);
	},

	async update(patch: Partial<Omit<LocalBroadcastSettings, 'id'>>) {
		await ensureSettings();
		const wrapped = { ...patch } as Record<string, unknown>;
		await encryptRecord('broadcastSettings', wrapped);
		await settingsTable.update(BROADCAST_SETTINGS_ID, {
			...wrapped,
		});
		emitDomainEvent(
			'BroadcastSettingsUpdated',
			'broadcasts',
			'broadcastSettings',
			BROADCAST_SETTINGS_ID,
			{ fields: Object.keys(patch) }
		);
	},

	/** Quick-read defaults for a fresh campaign. */
	async getDefaults(): Promise<{
		fromName: string;
		fromEmail: string;
		replyTo: string | null;
		footer: string | null;
		legalAddress: string;
	}> {
		const s = await this.get();
		return {
			fromName: s.defaultFromName,
			fromEmail: s.defaultFromEmail,
			replyTo: s.defaultReplyTo,
			footer: s.defaultFooter,
			legalAddress: s.legalAddress,
		};
	},
};

export { ensureSettings };
