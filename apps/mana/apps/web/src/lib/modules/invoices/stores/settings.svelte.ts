/**
 * Invoice settings store — singleton row per user.
 *
 * The settings hold the sender profile (used on every PDF) and the number
 * sequence state. `takeNextNumber()` is the only path that should hand out
 * invoice numbers — a Dexie transaction wraps read + increment so a fast
 * double-click or two parallel create flows on the same device can't
 * hand out duplicate numbers.
 *
 * ## Transaction boundaries and crypto
 *
 * Web Crypto calls inside a Dexie rw transaction break the transaction
 * (any non-Dexie await suspends it). Number-sequence fields (`nextNumber`,
 * `numberPrefix`, `numberPadding`) are plaintext per the encryption
 * registry, so we can read and write them atomically without a decrypt
 * step inside the transaction.
 *
 * ## Sync collision (offline multi-device) — known gap, M2
 *
 * Two devices offline both reading `nextNumber=42` → both assign
 * "2026-0042". Not handled in M2 because:
 *   (1) the MVP target is solo freelancers (one active device),
 *   (2) sync LWW on `nextNumber` converges on the max so subsequent
 *       invoices stop colliding — only the two in-flight numbers dupe,
 *   (3) proper detection needs a scan-on-apply hook in the sync layer;
 *       better to solve once, cleanly, in Phase 2 than patch in M2.
 * Users can manually renumber via the edit form in the meantime.
 */

import { db } from '$lib/data/database';
import { encryptRecord, decryptRecords } from '$lib/data/crypto';
import { emitDomainEvent } from '$lib/data/events';
import { invoiceSettingsTable } from '../collections';
import type { LocalInvoiceSettings, InvoiceSettings, Currency } from '../types';
import {
	INVOICE_SETTINGS_ID,
	DEFAULT_DUE_DAYS,
	DEFAULT_NUMBER_PREFIX,
	DEFAULT_NUMBER_PADDING,
} from '../constants';

function toInvoiceSettings(local: LocalInvoiceSettings): InvoiceSettings {
	return {
		id: local.id,
		senderName: local.senderName ?? '',
		senderAddress: local.senderAddress ?? '',
		senderEmail: local.senderEmail ?? '',
		senderVatNumber: local.senderVatNumber ?? null,
		senderIban: local.senderIban ?? '',
		senderBic: local.senderBic ?? null,
		logoMediaId: local.logoMediaId ?? null,
		accentColor: local.accentColor ?? '#059669',
		footer: local.footer ?? null,
		numberPrefix: local.numberPrefix ?? DEFAULT_NUMBER_PREFIX,
		numberPadding: local.numberPadding ?? DEFAULT_NUMBER_PADDING,
		nextNumber: local.nextNumber ?? 1,
		defaultCurrency: local.defaultCurrency ?? 'CHF',
		defaultVatRate: local.defaultVatRate ?? 8.1,
		defaultDueDays: local.defaultDueDays ?? DEFAULT_DUE_DAYS,
		defaultTerms: local.defaultTerms ?? null,
	};
}

/**
 * Get or create the singleton settings row. Must be called OUTSIDE any
 * Dexie rw transaction because encryptRecord runs Web Crypto.
 */
async function ensureSettings(): Promise<LocalInvoiceSettings> {
	const existing = await invoiceSettingsTable.get(INVOICE_SETTINGS_ID);
	if (existing) return existing;

	const defaults: LocalInvoiceSettings = {
		id: INVOICE_SETTINGS_ID,
		senderName: '',
		senderAddress: '',
		senderEmail: '',
		senderVatNumber: null,
		senderIban: '',
		senderBic: null,
		logoMediaId: null,
		accentColor: '#059669',
		footer: null,
		numberPrefix: DEFAULT_NUMBER_PREFIX,
		numberPadding: DEFAULT_NUMBER_PADDING,
		nextNumber: 1,
		defaultCurrency: 'CHF',
		defaultVatRate: 8.1,
		defaultDueDays: DEFAULT_DUE_DAYS,
		defaultTerms: null,
	};
	const wrapped = { ...defaults };
	await encryptRecord('invoiceSettings', wrapped);
	await invoiceSettingsTable.add(wrapped);
	return wrapped;
}

function formatNumber(prefix: string, n: number, padding: number): string {
	return `${prefix}${String(n).padStart(padding, '0')}`;
}

export const invoiceSettingsStore = {
	async get(): Promise<InvoiceSettings> {
		await ensureSettings();
		const row = await invoiceSettingsTable.get(INVOICE_SETTINGS_ID);
		if (!row) throw new Error('[invoices] settings row missing after ensureSettings');
		const [decrypted] = (await decryptRecords('invoiceSettings', [row])) as LocalInvoiceSettings[];
		return toInvoiceSettings(decrypted);
	},

	/**
	 * Atomic: pull the next number, increment the counter, hand the formatted
	 * string back. Number-sequence fields are plaintext, so no crypto needs to
	 * run inside the transaction. Caller must have awaited `ensureSettings()`
	 * at some earlier point — we don't call it here to keep the hot path fast
	 * and to avoid nesting an async boundary inside the rw transaction.
	 */
	async takeNextNumber(): Promise<string> {
		await ensureSettings();
		let out = '';
		await db.transaction('rw', invoiceSettingsTable, async () => {
			const current = await invoiceSettingsTable.get(INVOICE_SETTINGS_ID);
			if (!current) throw new Error('[invoices] settings row vanished mid-transaction');
			const nextN = current.nextNumber ?? 1;
			const prefix = current.numberPrefix ?? DEFAULT_NUMBER_PREFIX;
			const padding = current.numberPadding ?? DEFAULT_NUMBER_PADDING;
			out = formatNumber(prefix, nextN, padding);
			await invoiceSettingsTable.update(INVOICE_SETTINGS_ID, {
				nextNumber: nextN + 1,
				updatedAt: new Date().toISOString(),
			});
		});
		return out;
	},

	async update(patch: Partial<Omit<LocalInvoiceSettings, 'id'>>) {
		await ensureSettings();
		const wrapped = { ...patch } as Record<string, unknown>;
		await encryptRecord('invoiceSettings', wrapped);
		await invoiceSettingsTable.update(INVOICE_SETTINGS_ID, {
			...wrapped,
			updatedAt: new Date().toISOString(),
		});
		emitDomainEvent('InvoiceSettingsUpdated', 'invoices', 'invoiceSettings', INVOICE_SETTINGS_ID, {
			fields: Object.keys(patch),
		});
	},

	/** Convenience: defaults extracted for the InvoiceForm's initial state. */
	async getDefaults(): Promise<{
		currency: Currency;
		vatRate: number;
		dueDays: number;
		terms: string | null;
		senderIban: string;
	}> {
		const s = await this.get();
		return {
			currency: s.defaultCurrency,
			vatRate: s.defaultVatRate,
			dueDays: s.defaultDueDays,
			terms: s.defaultTerms,
			senderIban: s.senderIban,
		};
	},
};

export { ensureSettings };
