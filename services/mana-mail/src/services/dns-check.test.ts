import { describe, it, expect } from 'bun:test';
import { parseSpf, parseDkim, parseDmarc } from './dns-check';

// ─── SPF ────────────────────────────────────────────────

describe('parseSpf', () => {
	it('missing when no v=spf1 record', () => {
		const r = parseSpf([], 'mana.how');
		expect(r.status).toBe('missing');
		expect(r.record).toBeNull();
	});

	it('wrong when multiple SPF records (RFC 7208 §3.2)', () => {
		const r = parseSpf(
			['v=spf1 include:_spf.google.com ~all', 'v=spf1 include:mailgun.org ~all'],
			'mana.how'
		);
		expect(r.status).toBe('wrong');
		expect(r.message.toLowerCase()).toContain('mehrere');
	});

	it('ok when include:<mailDomain> is present', () => {
		const r = parseSpf(['v=spf1 include:mana.how ~all'], 'mana.how');
		expect(r.status).toBe('ok');
		expect(r.record).toContain('include:mana.how');
	});

	it('ok match is case-insensitive on both sides', () => {
		const r = parseSpf(['V=SPF1 INCLUDE:MANA.HOW ~ALL'], 'Mana.How');
		expect(r.status).toBe('ok');
	});

	it('weak on +all even without our include', () => {
		const r = parseSpf(['v=spf1 +all'], 'mana.how');
		expect(r.status).toBe('weak');
		expect(r.message.toLowerCase()).toContain('spoofing');
	});

	it('wrong when SPF exists but omits our include', () => {
		const r = parseSpf(['v=spf1 include:_spf.google.com ~all'], 'mana.how');
		expect(r.status).toBe('wrong');
		expect(r.message).toContain('include:mana.how');
	});
});

// ─── DKIM ───────────────────────────────────────────────

describe('parseDkim', () => {
	it('missing when no v=DKIM1 record', () => {
		const r = parseDkim([], 'mana');
		expect(r.status).toBe('missing');
		expect(r.selector).toBe('mana');
	});

	it('wrong when p= key is absent', () => {
		const r = parseDkim(['v=DKIM1; k=rsa'], 'mana');
		expect(r.status).toBe('wrong');
		expect(r.message.toLowerCase()).toContain('public-key');
	});

	it('ok when v=DKIM1 + p=<base64> is present', () => {
		const r = parseDkim(['v=DKIM1; k=rsa; p=MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8A'], 'mana');
		expect(r.status).toBe('ok');
		expect(r.selector).toBe('mana');
	});

	it('case-insensitive on v=DKIM1', () => {
		const r = parseDkim(['V=dkim1; p=ABCDEF'], 'mana');
		expect(r.status).toBe('ok');
	});
});

// ─── DMARC ──────────────────────────────────────────────

describe('parseDmarc', () => {
	it('missing when no v=DMARC1 record', () => {
		const r = parseDmarc([]);
		expect(r.status).toBe('missing');
	});

	it('wrong without p= policy', () => {
		const r = parseDmarc(['v=DMARC1; rua=mailto:a@b.ch']);
		expect(r.status).toBe('wrong');
	});

	it('weak on p=none', () => {
		const r = parseDmarc(['v=DMARC1; p=none; rua=mailto:a@b.ch']);
		expect(r.status).toBe('weak');
		expect(r.message.toLowerCase()).toContain('quarantine');
	});

	it('ok on p=quarantine', () => {
		const r = parseDmarc(['v=DMARC1; p=quarantine']);
		expect(r.status).toBe('ok');
		expect(r.message).toContain('quarantine');
	});

	it('ok on p=reject', () => {
		const r = parseDmarc(['v=DMARC1; p=reject']);
		expect(r.status).toBe('ok');
		expect(r.message).toContain('reject');
	});

	it('case-insensitive on policy value', () => {
		const r = parseDmarc(['v=DMARC1; p=REJECT']);
		expect(r.status).toBe('ok');
	});
});
