import { describe, it, expect } from 'vitest';
import { computeLineTotal, computeInvoiceTotals, EMPTY_TOTALS } from './totals';
import type { LocalInvoiceLine } from './types';

function line(overrides: Partial<LocalInvoiceLine> = {}): LocalInvoiceLine {
	return {
		id: 'l',
		title: 't',
		description: null,
		quantity: 1,
		unit: null,
		unitPrice: 10000,
		vatRate: 8.1,
		discount: null,
		...overrides,
	};
}

describe('computeLineTotal', () => {
	it('returns net+tax in minor units with no discount', () => {
		const { net, tax } = computeLineTotal(line({ quantity: 4, unitPrice: 15000, vatRate: 8.1 }));
		expect(net).toBe(60000);
		// 60000 * 8.1 / 100 = 4860
		expect(tax).toBe(4860);
	});

	it('applies percentage discount before VAT', () => {
		// 10.- at 10% discount = 9.- net; 19% VAT = 1.71
		const { net, tax } = computeLineTotal(
			line({ quantity: 1, unitPrice: 1000, vatRate: 19, discount: 10 })
		);
		expect(net).toBe(900);
		expect(tax).toBe(171);
	});

	it('rounds tax half-up at the per-line level', () => {
		// 123 @ 8.1% = 9.963 → rounds to 10
		const { tax } = computeLineTotal(line({ quantity: 1, unitPrice: 123, vatRate: 8.1 }));
		expect(tax).toBe(10);
	});

	it('handles zero VAT rate', () => {
		const { net, tax } = computeLineTotal(line({ quantity: 2, unitPrice: 5000, vatRate: 0 }));
		expect(net).toBe(10000);
		expect(tax).toBe(0);
	});
});

describe('computeInvoiceTotals', () => {
	it('returns EMPTY_TOTALS-equivalent for no lines', () => {
		const totals = computeInvoiceTotals([]);
		expect(totals.net).toBe(0);
		expect(totals.vat).toBe(0);
		expect(totals.gross).toBe(0);
		expect(totals.vatBreakdown).toEqual([]);
	});

	it('sums a single-rate invoice', () => {
		const totals = computeInvoiceTotals([
			line({ quantity: 2, unitPrice: 10000, vatRate: 8.1 }),
			line({ id: 'l2', quantity: 1, unitPrice: 5000, vatRate: 8.1 }),
		]);
		expect(totals.net).toBe(25000); // 20000 + 5000
		expect(totals.vat).toBe(1620 + 405); // 2025
		expect(totals.gross).toBe(totals.net + totals.vat);
		expect(totals.vatBreakdown).toHaveLength(1);
		expect(totals.vatBreakdown[0]).toEqual({ rate: 8.1, base: 25000, tax: 2025 });
	});

	it('groups by VAT rate and sorts breakdown ascending', () => {
		const totals = computeInvoiceTotals([
			line({ quantity: 1, unitPrice: 10000, vatRate: 8.1 }),
			line({ id: 'l2', quantity: 1, unitPrice: 5000, vatRate: 2.6 }),
			line({ id: 'l3', quantity: 1, unitPrice: 2000, vatRate: 8.1 }),
		]);
		expect(totals.vatBreakdown.map((b) => b.rate)).toEqual([2.6, 8.1]);
		const [low, high] = totals.vatBreakdown;
		expect(low.base).toBe(5000);
		expect(high.base).toBe(12000);
	});

	it('preserves the invariant: breakdown sums equal invoice totals', () => {
		// Critical for the PDF footer + dashboard — if this drifts, users
		// see "sum of VAT rows" ≠ "VAT total" and lose trust.
		const lines = [
			line({ quantity: 3.5, unitPrice: 7777, vatRate: 8.1 }),
			line({ id: 'l2', quantity: 1, unitPrice: 3333, vatRate: 2.6, discount: 15 }),
			line({ id: 'l3', quantity: 2, unitPrice: 999, vatRate: 0 }),
		];
		const totals = computeInvoiceTotals(lines);
		const breakdownBase = totals.vatBreakdown.reduce((s, b) => s + b.base, 0);
		const breakdownTax = totals.vatBreakdown.reduce((s, b) => s + b.tax, 0);
		expect(breakdownBase).toBe(totals.net);
		expect(breakdownTax).toBe(totals.vat);
	});

	it('EMPTY_TOTALS matches an empty computation', () => {
		expect(computeInvoiceTotals([])).toEqual(EMPTY_TOTALS);
	});
});
