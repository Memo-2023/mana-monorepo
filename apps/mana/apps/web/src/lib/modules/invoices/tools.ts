/**
 * Invoice Tools — LLM-accessible operations.
 *
 * Schema definitions live in @mana/shared-ai's AI_TOOL_CATALOG (the SSOT);
 * this file provides the matching `execute` fns that call the local store.
 * Amounts arrive from the LLM in major units (CHF 150.00) and get
 * converted to minor units (15000) here.
 */

import type { ModuleTool } from '$lib/data/tools/types';
import { invoiceTable } from './collections';
import { decryptRecords } from '$lib/data/crypto';
import { invoicesStore } from './stores/invoices.svelte';
import { toInvoice, computeStats, formatAmount } from './queries';
import { CURRENCIES } from './constants';
import type {
	LocalInvoice,
	LocalInvoiceLine,
	Invoice,
	InvoiceStatus,
	Currency,
	InvoiceClientSnapshot,
} from './types';

// ─── Helpers ────────────────────────────────────────────

async function listDecryptedInvoices(): Promise<Invoice[]> {
	const rows = await invoiceTable.toArray();
	const visible = rows.filter((r) => !r.deletedAt);
	const decrypted = await decryptRecords<LocalInvoice>('invoices', visible);
	const today = new Date().toISOString().slice(0, 10);
	return decrypted.map((local) => {
		const inv = toInvoice(local);
		if (inv.status === 'sent' && inv.dueDate < today) {
			return { ...inv, status: 'overdue' as InvoiceStatus };
		}
		return inv;
	});
}

interface RawLine {
	title?: string;
	quantity?: number;
	unitPrice?: number;
	vatRate?: number;
	unit?: string;
	description?: string;
	discount?: number;
}

/**
 * Coerce whatever the LLM produced for `lines` into LocalInvoiceLine[].
 * Accepts either a real array or a JSON-stringified one (some planners
 * emit strings for array params). Rejects when no usable entries remain.
 */
function coerceLines(raw: unknown, currency: Currency, defaultVatRate: number): LocalInvoiceLine[] {
	let parsed: RawLine[];
	if (typeof raw === 'string') {
		try {
			parsed = JSON.parse(raw) as RawLine[];
		} catch {
			throw new Error('Positionen konnten nicht geparst werden (ungültiges JSON).');
		}
	} else if (Array.isArray(raw)) {
		parsed = raw as RawLine[];
	} else {
		throw new Error('Positionen müssen als Array übergeben werden.');
	}

	const minor = CURRENCIES[currency].minorUnit;
	const lines: LocalInvoiceLine[] = [];
	for (const p of parsed) {
		if (!p.title || typeof p.quantity !== 'number' || typeof p.unitPrice !== 'number') {
			continue; // silently skip malformed entries so a single bad line doesn't kill the invoice
		}
		lines.push({
			id: crypto.randomUUID(),
			title: p.title,
			description: p.description ?? null,
			quantity: p.quantity,
			unit: p.unit ?? null,
			unitPrice: Math.round(p.unitPrice * minor),
			vatRate: typeof p.vatRate === 'number' ? p.vatRate : defaultVatRate,
			discount: typeof p.discount === 'number' ? p.discount : null,
		});
	}

	if (lines.length === 0) {
		throw new Error('Keine gültige Position — erwarte { title, quantity, unitPrice } je Eintrag.');
	}
	return lines;
}

// ─── Tools ──────────────────────────────────────────────

export const invoicesTools: ModuleTool[] = [
	{
		name: 'create_invoice',
		module: 'invoices',
		description:
			'Erstellt eine neue Rechnung als Entwurf. Setzt Kunde (Name + optional Adresse + E-Mail), Positionen (Titel, Menge, Einzelpreis in Hauptwaehrung), Faelligkeit. Nummer wird automatisch vergeben.',
		parameters: [
			{
				name: 'clientName',
				type: 'string',
				description: 'Name des Kunden (erforderlich)',
				required: true,
			},
			{
				name: 'clientEmail',
				type: 'string',
				description: 'E-Mail-Adresse des Kunden',
				required: false,
			},
			{
				name: 'clientAddress',
				type: 'string',
				description: 'Postanschrift des Kunden (mehrzeilig, Strasse + Nr, dann PLZ Ort)',
				required: false,
			},
			{
				name: 'subject',
				type: 'string',
				description: 'Kurzer Betreff (z.B. "Beratung April")',
				required: false,
			},
			{
				name: 'currency',
				type: 'string',
				description: 'Waehrung (Standard: CHF)',
				required: false,
				enum: ['CHF', 'EUR', 'USD'],
			},
			{
				name: 'dueDate',
				type: 'string',
				description: 'Faelligkeitsdatum (YYYY-MM-DD). Ohne Angabe: +30 Tage ab heute.',
				required: false,
			},
			{
				name: 'lines',
				type: 'array',
				description:
					'Array von Positionen: [{ title, quantity, unitPrice (Hauptwaehrung), vatRate?, unit? }]. Mindestens eine Position.',
				required: true,
			},
		],
		async execute(params) {
			const clientName = String(params.clientName ?? '').trim();
			if (!clientName) {
				return { success: false, message: 'Kundenname fehlt.' };
			}
			const currency = (params.currency as Currency) ?? 'CHF';
			// Keep the raw string on `address` (legacy fallback) — the QR-Bill
			// builder's heuristic parser lifts structured fields out of it on
			// render. A future iteration can ask the LLM for structured fields
			// directly via more tool params, but today the one-shot address
			// string is what planners tend to produce.
			const snapshot: InvoiceClientSnapshot = {
				name: clientName,
				address: (params.clientAddress as string | undefined)?.trim() || undefined,
				email: (params.clientEmail as string | undefined)?.trim() || undefined,
			};
			try {
				const lines = coerceLines(params.lines, currency, 8.1);
				const id = await invoicesStore.createInvoice({
					clientId: null,
					clientSource: 'invoice-client',
					clientSnapshot: snapshot,
					currency,
					dueDate: (params.dueDate as string | undefined) || undefined,
					lines,
					subject: (params.subject as string | undefined) || null,
				});
				// Re-read to get the generated number + total for the message.
				const row = await invoiceTable.get(id);
				const gross = row?.totals?.gross ?? 0;
				return {
					success: true,
					data: { id, number: row?.number, gross, currency },
					message: `Entwurf ${row?.number ?? '(neu)'} für ${clientName} über ${formatAmount(gross, currency)} angelegt.`,
				};
			} catch (e) {
				return {
					success: false,
					message: e instanceof Error ? e.message : 'Erstellen fehlgeschlagen',
				};
			}
		},
	},

	{
		name: 'mark_invoice_paid',
		module: 'invoices',
		description:
			'Markiert eine versendete oder ueberfaellige Rechnung als bezahlt. paidAt ist optional (Standard: heute, fuer rueckdatierte Eingaenge ein fruehes Datum setzen).',
		parameters: [
			{
				name: 'invoiceId',
				type: 'string',
				description: 'ID der Rechnung (aus list_invoices)',
				required: true,
			},
			{
				name: 'paidAt',
				type: 'string',
				description: 'Zahlungsdatum (ISO oder YYYY-MM-DD). Standard: jetzt.',
				required: false,
			},
		],
		async execute(params) {
			const id = String(params.invoiceId ?? '').trim();
			if (!id) return { success: false, message: 'Rechnungs-ID fehlt.' };
			const existing = await invoiceTable.get(id);
			if (!existing) return { success: false, message: `Rechnung ${id} nicht gefunden.` };
			// Normalise YYYY-MM-DD → ISO so markPaid's timestamp is consistent with
			// the UI path (which uses new Date().toISOString()).
			let paidAt = params.paidAt as string | undefined;
			if (paidAt && /^\d{4}-\d{2}-\d{2}$/.test(paidAt)) {
				paidAt = new Date(`${paidAt}T12:00:00.000Z`).toISOString();
			}
			await invoicesStore.markPaid(id, paidAt);
			return {
				success: true,
				data: { id, number: existing.number },
				message: `Rechnung ${existing.number} als bezahlt markiert.`,
			};
		},
	},

	{
		name: 'list_invoices',
		module: 'invoices',
		description:
			'Listet Rechnungen auf. Optional nach Status (draft/sent/paid/overdue/void) und Limit gefiltert. Gibt ID, Nummer, Kunde, Status, Betrag, Faelligkeit zurueck.',
		parameters: [
			{
				name: 'status',
				type: 'string',
				description: 'Nur diesen Status zeigen',
				required: false,
				enum: ['draft', 'sent', 'paid', 'overdue', 'void'],
			},
			{
				name: 'limit',
				type: 'number',
				description: 'Maximale Anzahl (Standard: 20)',
				required: false,
			},
		],
		async execute(params) {
			const all = await listDecryptedInvoices();
			const status = params.status as InvoiceStatus | undefined;
			const filtered = status ? all.filter((i) => i.status === status) : all;
			const limit = Number(params.limit ?? 20);
			const slice = filtered.slice(0, Math.max(1, limit));
			const data = slice.map((i) => ({
				id: i.id,
				number: i.number,
				status: i.status,
				client: i.clientSnapshot.name,
				gross: i.totals.gross / CURRENCIES[i.currency].minorUnit,
				currency: i.currency,
				issueDate: i.issueDate,
				dueDate: i.dueDate,
			}));
			return {
				success: true,
				data,
				message: `${slice.length} Rechnung${slice.length === 1 ? '' : 'en'}${status ? ` im Status ${status}` : ''}.`,
			};
		},
	},

	{
		name: 'get_invoice_stats',
		module: 'invoices',
		description:
			'Gibt Rechnungs-Kennzahlen zurueck: offene Summe, ueberfaellige Summe, YTD fakturiert + bezahlt (pro Waehrung, in Hauptwaehrung als Gleitkomma).',
		parameters: [],
		async execute() {
			const all = await listDecryptedInvoices();
			const year = new Date().getFullYear();
			const stats = computeStats(all, year);
			// Convert minor-unit maps to major-unit maps so the LLM can reason
			// with numbers that match the user's mental model.
			const toMajor = (map: Record<Currency, number>): Record<Currency, number> => ({
				CHF: map.CHF / 100,
				EUR: map.EUR / 100,
				USD: map.USD / 100,
			});
			return {
				success: true,
				data: {
					counts: stats.totalByStatus,
					openByCurrency: toMajor(stats.openByCurrency),
					overdueByCurrency: toMajor(stats.overdueByCurrency),
					invoicedYtdByCurrency: toMajor(stats.invoicedYtdByCurrency),
					paidYtdByCurrency: toMajor(stats.paidYtdByCurrency),
					year,
				},
				message: `${stats.totalByStatus.sent + stats.totalByStatus.overdue} offen, ${stats.totalByStatus.overdue} überfällig.`,
			};
		},
	},
];
