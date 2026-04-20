import { describe, it, expect } from 'vitest';
import { isSCORReferenceValid } from 'swissqrbill/utils';
import { generateSCORReference, buildQRBillData, QRBillError } from './qr-bill';
import type { Invoice, InvoiceSettings } from '../types';

// ─── Factories ─────────────────────────────────────────

function makeSettings(overrides: Partial<InvoiceSettings> = {}): InvoiceSettings {
	return {
		id: 'invoice-settings',
		senderName: 'Muster AG',
		senderAddress: 'Bahnhofstrasse 1\n8000 Zürich',
		senderStreet: null,
		senderZip: null,
		senderCity: null,
		senderCountry: 'CH',
		senderEmail: 'hello@muster.ch',
		senderVatNumber: null,
		senderIban: 'CH9300762011623852957',
		senderBic: null,
		logoMediaId: null,
		accentColor: '#059669',
		footer: null,
		numberPrefix: '2026-',
		numberPadding: 4,
		nextNumber: 1,
		defaultCurrency: 'CHF',
		defaultVatRate: 8.1,
		defaultDueDays: 30,
		defaultTerms: null,
		...overrides,
	};
}

function makeInvoice(overrides: Partial<Invoice> = {}): Invoice {
	return {
		id: 'i1',
		number: '2026-0042',
		status: 'draft',
		clientId: null,
		clientSource: 'invoice-client',
		clientSnapshot: {
			name: 'Kunde GmbH',
			address: 'Seefeldstrasse 5\n8008 Zürich',
			email: 'kunde@example.ch',
		},
		currency: 'CHF',
		issueDate: '2026-04-20',
		dueDate: '2026-05-20',
		sentAt: null,
		paidAt: null,
		lines: [],
		subject: 'Beratung',
		notes: null,
		terms: null,
		referenceNumber: null,
		pdfBlobKey: null,
		totals: {
			net: 10000,
			vat: 810,
			gross: 10810,
			vatBreakdown: [{ rate: 8.1, base: 10000, tax: 810 }],
		},
		createdAt: '2026-04-20T00:00:00.000Z',
		updatedAt: '2026-04-20T00:00:00.000Z',
		...overrides,
	};
}

// ─── SCOR reference ─────────────────────────────────────

describe('generateSCORReference', () => {
	it('produces a spec-valid SCOR reference', () => {
		const ref = generateSCORReference('2026-0042');
		expect(isSCORReferenceValid(ref)).toBe(true);
	});

	it('starts with RF', () => {
		expect(generateSCORReference('2026-0042')).toMatch(/^RF/);
	});

	it('is deterministic for the same invoice number', () => {
		expect(generateSCORReference('2026-0042')).toBe(generateSCORReference('2026-0042'));
	});

	it('strips non-alphanumerics from the payload', () => {
		const ref = generateSCORReference('2026-0042');
		expect(ref).not.toContain('-');
	});

	it('truncates payloads to 21 chars so the overall reference fits spec (25)', () => {
		const ref = generateSCORReference('AAAAAAAAAAAAAAAAAAAAAAAAAAAAAA');
		// RF + 2 check digits + ≤21 payload = 25 chars total
		expect(ref.length).toBeLessThanOrEqual(25);
	});

	it('falls back for all-separator input', () => {
		const ref = generateSCORReference('---');
		expect(isSCORReferenceValid(ref)).toBe(true);
	});
});

// ─── buildQRBillData ─────────────────────────────────────

describe('buildQRBillData', () => {
	it('builds a valid data object for CHF invoice with all fields set', () => {
		const data = buildQRBillData(makeInvoice(), makeSettings());
		expect(data.currency).toBe('CHF');
		expect(data.creditor.account).toBe('CH9300762011623852957');
		expect(data.creditor.zip).toBe('8000');
		expect(data.creditor.city).toBe('Zürich');
		expect(data.debtor?.zip).toBe('8008');
		expect(data.amount).toBeCloseTo(108.1, 2);
		expect(data.reference).toBeTruthy();
	});

	it('rejects USD (only CHF + EUR allowed)', () => {
		const invoice = makeInvoice({ currency: 'USD' });
		expect(() => buildQRBillData(invoice, makeSettings())).toThrow(QRBillError);
		try {
			buildQRBillData(invoice, makeSettings());
		} catch (e) {
			expect(e).toBeInstanceOf(QRBillError);
			expect((e as QRBillError).reason).toBe('invalid-currency');
		}
	});

	it('rejects missing IBAN with a specific reason', () => {
		try {
			buildQRBillData(makeInvoice(), makeSettings({ senderIban: '' }));
			throw new Error('should have thrown');
		} catch (e) {
			expect(e).toBeInstanceOf(QRBillError);
			expect((e as QRBillError).reason).toBe('missing-iban');
		}
	});

	it('rejects invalid IBAN (bad checksum)', () => {
		try {
			buildQRBillData(makeInvoice(), makeSettings({ senderIban: 'CH0000000000000000000' }));
			throw new Error('should have thrown');
		} catch (e) {
			expect(e).toBeInstanceOf(QRBillError);
			expect((e as QRBillError).reason).toBe('invalid-iban');
		}
	});

	it('rejects unparseable sender address', () => {
		try {
			buildQRBillData(makeInvoice(), makeSettings({ senderAddress: 'eine Zeile nur' }));
			throw new Error('should have thrown');
		} catch (e) {
			expect(e).toBeInstanceOf(QRBillError);
			expect((e as QRBillError).reason).toBe('unparseable-sender-address');
		}
	});

	it('rejects zero / negative amount', () => {
		const invoice = makeInvoice({
			totals: { net: 0, vat: 0, gross: 0, vatBreakdown: [] },
		});
		try {
			buildQRBillData(invoice, makeSettings());
			throw new Error('should have thrown');
		} catch (e) {
			expect(e).toBeInstanceOf(QRBillError);
			expect((e as QRBillError).reason).toBe('missing-amount');
		}
	});

	it('accepts unparseable client address and omits the debtor block', () => {
		// Debtor is optional per spec — we still emit the QR-Bill, the user
		// can fill the payer side by hand when paying.
		const invoice = makeInvoice({
			clientSnapshot: { name: 'Bar', address: 'nur eine zeile' },
		});
		const data = buildQRBillData(invoice, makeSettings());
		expect(data.debtor).toBeUndefined();
	});

	it('prefers structured sender fields over legacy senderAddress', () => {
		// Post-migration settings: structured fields set, legacy blob junky.
		// QR-Bill should use the structured source — legacy is the fallback,
		// not a co-equal override.
		const data = buildQRBillData(
			makeInvoice(),
			makeSettings({
				senderAddress: 'this is garbage and should be ignored',
				senderStreet: 'Musterweg 42',
				senderZip: '3000',
				senderCity: 'Bern',
				senderCountry: 'CH',
			})
		);
		expect(data.creditor.address).toBe('Musterweg 42');
		expect(data.creditor.zip).toBe('3000');
		expect(data.creditor.city).toBe('Bern');
	});

	it('prefers structured client fields over snapshot.address', () => {
		const invoice = makeInvoice({
			clientSnapshot: {
				name: 'Strukturiert AG',
				address: 'muss ignoriert werden',
				street: 'Hauptgasse 7',
				zip: '4000',
				city: 'Basel',
				country: 'CH',
			},
		});
		const data = buildQRBillData(invoice, makeSettings());
		expect(data.debtor?.address).toBe('Hauptgasse 7');
		expect(data.debtor?.zip).toBe('4000');
		expect(data.debtor?.city).toBe('Basel');
	});

	it('falls back to legacy senderAddress when structured fields are empty', () => {
		// Existing users who haven't opened the updated settings form still
		// get a working QR-Bill from their free-text address.
		const data = buildQRBillData(
			makeInvoice(),
			makeSettings({
				senderAddress: 'Bahnhofstrasse 1\n8000 Zürich',
				senderStreet: null,
				senderZip: null,
				senderCity: null,
			})
		);
		expect(data.creditor.address).toBe('Bahnhofstrasse 1');
	});

	it('parses multi-line street with house number on line 1', () => {
		const data = buildQRBillData(
			makeInvoice(),
			makeSettings({ senderAddress: 'Bahnhofstrasse 1\nPostfach\n8000 Zürich' })
		);
		// Lines 1+2 join as street; line 3 is the zip+city.
		expect(data.creditor.address).toBe('Bahnhofstrasse 1, Postfach');
		expect(data.creditor.zip).toBe('8000');
	});

	it('parses 5-digit German postcodes', () => {
		const data = buildQRBillData(
			makeInvoice({ currency: 'EUR' }),
			makeSettings({
				senderIban: 'DE89370400440532013000',
				senderAddress: 'Hauptstraße 5\n10115 Berlin',
			})
		);
		expect(data.creditor.zip).toBe('10115');
		expect(data.creditor.city).toBe('Berlin');
	});

	it('uses referenceNumber from invoice when set (preferred over regen)', () => {
		const invoice = makeInvoice({ referenceNumber: 'RF18539007547034' });
		const data = buildQRBillData(invoice, makeSettings());
		expect(data.reference).toBe('RF18539007547034');
	});

	it('regenerates reference when invoice.referenceNumber is null (migration path)', () => {
		const invoice = makeInvoice({ referenceNumber: null });
		const data = buildQRBillData(invoice, makeSettings());
		expect(data.reference).toBeTruthy();
		expect(data.reference).toMatch(/^RF/);
	});
});
