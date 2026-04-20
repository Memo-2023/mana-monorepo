import { describe, it, expect } from 'vitest';
import { buildInvoiceMailDraft, mailDraftToMailto, looksLikeEmail } from './mail-template';
import type { Invoice, InvoiceSettings } from './types';

const settings: InvoiceSettings = {
	id: 'invoice-settings',
	senderName: 'Till',
	senderAddress: 'Bahnhofstrasse 1\n8000 Zürich',
	senderEmail: 'till@example.ch',
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
};

function makeInvoice(overrides: Partial<Invoice> = {}): Invoice {
	return {
		id: 'i',
		number: '2026-0001',
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
		subject: null,
		notes: null,
		terms: null,
		referenceNumber: null,
		pdfBlobKey: null,
		totals: {
			net: 15000,
			vat: 1215,
			gross: 16215,
			vatBreakdown: [{ rate: 8.1, base: 15000, tax: 1215 }],
		},
		createdAt: '',
		updatedAt: '',
		...overrides,
	};
}

describe('buildInvoiceMailDraft', () => {
	it('prefills recipient from the frozen snapshot', () => {
		const draft = buildInvoiceMailDraft(makeInvoice(), settings);
		expect(draft.to).toBe('kunde@example.ch');
	});

	it('empty recipient when snapshot has no email', () => {
		const invoice = makeInvoice({
			clientSnapshot: { name: 'Kunde', address: 'foo\n8000 bar' },
		});
		const draft = buildInvoiceMailDraft(invoice, settings);
		expect(draft.to).toBe('');
	});

	it('includes the invoice number in the subject', () => {
		const draft = buildInvoiceMailDraft(makeInvoice(), settings);
		expect(draft.subject).toContain('2026-0001');
	});

	it('appends subject when present', () => {
		const draft = buildInvoiceMailDraft(makeInvoice({ subject: 'Beratung April' }), settings);
		expect(draft.subject).toContain('Beratung April');
		expect(draft.subject).toBe('Rechnung 2026-0001 — Beratung April');
	});

	it('omits the em-dash when subject is blank', () => {
		const draft = buildInvoiceMailDraft(makeInvoice({ subject: null }), settings);
		expect(draft.subject).toBe('Rechnung 2026-0001');
	});

	it('mentions QR-Einzahlungsschein only for CHF', () => {
		const chf = buildInvoiceMailDraft(makeInvoice({ currency: 'CHF' }), settings);
		expect(chf.body).toContain('QR-Einzahlungsschein');
		const eur = buildInvoiceMailDraft(makeInvoice({ currency: 'EUR' }), settings);
		expect(eur.body).not.toContain('QR-Einzahlungsschein');
	});

	it('signs off with sender name', () => {
		const draft = buildInvoiceMailDraft(makeInvoice(), settings);
		expect(draft.body).toContain('Till');
	});

	it('falls back to a generic salutation when no client name', () => {
		const invoice = makeInvoice({
			clientSnapshot: { name: '', address: '', email: '' },
		});
		const draft = buildInvoiceMailDraft(invoice, settings);
		expect(draft.body).toContain('Geehrte Damen und Herren');
	});

	it('includes gross amount and due date', () => {
		const draft = buildInvoiceMailDraft(makeInvoice(), settings);
		expect(draft.body).toContain('2026-05-20');
		expect(draft.body).toContain('CHF 162.15');
	});
});

describe('mailDraftToMailto', () => {
	it('starts with mailto: and encodes the recipient', () => {
		const url = mailDraftToMailto({ to: 'foo@bar.ch', subject: 's', body: 'b' });
		expect(url.startsWith('mailto:')).toBe(true);
		expect(url).toContain('foo%40bar.ch');
	});

	it('encodes spaces as %20 (not `+`) for cross-client compatibility', () => {
		// URLSearchParams defaults to `+` which macOS Mail / Outlook take
		// literally — our patch ensures Apple Mail / iOS render "Hello World"
		// and not "Hello+World" in the subject field.
		const url = mailDraftToMailto({ to: 'x@y.z', subject: 'Hello World', body: 'a b c' });
		expect(url).not.toContain('+');
		expect(url).toContain('Hello%20World');
	});

	it('preserves newlines in the body', () => {
		const url = mailDraftToMailto({ to: 'x@y.z', subject: 's', body: 'line1\nline2' });
		expect(url).toContain('line1%0Aline2');
	});
});

describe('looksLikeEmail', () => {
	it.each([
		['kontakt@memoro.ai', true],
		['a@b.co', true],
		['spaces inside@bad.com', false],
		['no-at.com', false],
		['trailing@', false],
		['', false],
		['  padded@example.com  ', true], // allows leading/trailing whitespace (trimmed)
	])('%s → %s', (input, expected) => {
		expect(looksLikeEmail(input)).toBe(expected);
	});
});
