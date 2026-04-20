/**
 * Pure totals computation — kept out of the store so it's trivially unit-
 * testable and can be called from the form for live preview without hitting
 * Dexie. Money is always integer minor units (Rappen / cents).
 *
 * Rounding: bankers / half-even would be stricter but the default Math.round
 * (half-away-from-zero) matches what most Swiss bookkeeping tools do at the
 * invoice level. Per-line tax is rounded first, then summed per rate, so
 * the breakdown equals sum-of-lines exactly.
 */

import type { InvoiceLine, LocalInvoiceLine, InvoiceTotals, VatBreakdownEntry } from './types';

type AnyLine = InvoiceLine | LocalInvoiceLine;

/**
 * Compute a single line's net + tax in minor units.
 *   net = quantity × unitPrice × (1 − discount/100)
 *   tax = net × vatRate / 100
 *
 * Discount is applied before tax (standard invoicing convention: the customer
 * owes tax on the discounted price, not the list price).
 */
export function computeLineTotal(line: AnyLine): { net: number; tax: number } {
	const rawNet = line.quantity * line.unitPrice;
	const discount = line.discount ?? 0;
	const net = Math.round(rawNet * (1 - discount / 100));
	const tax = Math.round((net * line.vatRate) / 100);
	return { net, tax };
}

/**
 * Compute the full totals envelope for an invoice. Groups tax by rate so the
 * PDF footer can show a per-rate breakdown (required in CH for invoices that
 * mix reduced and standard-rate positions).
 */
export function computeInvoiceTotals(lines: readonly AnyLine[]): InvoiceTotals {
	const byRate = new Map<number, { base: number; tax: number }>();
	let net = 0;
	let vat = 0;

	for (const line of lines) {
		const { net: lineNet, tax: lineTax } = computeLineTotal(line);
		net += lineNet;
		vat += lineTax;
		const bucket = byRate.get(line.vatRate) ?? { base: 0, tax: 0 };
		bucket.base += lineNet;
		bucket.tax += lineTax;
		byRate.set(line.vatRate, bucket);
	}

	const vatBreakdown: VatBreakdownEntry[] = [...byRate.entries()]
		.sort(([a], [b]) => a - b)
		.map(([rate, { base, tax }]) => ({ rate, base, tax }));

	return { net, vat, gross: net + vat, vatBreakdown };
}

/** Zero total — useful as initial state before any lines exist. */
export const EMPTY_TOTALS: InvoiceTotals = {
	net: 0,
	vat: 0,
	gross: 0,
	vatBreakdown: [],
};
