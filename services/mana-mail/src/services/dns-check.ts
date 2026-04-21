/**
 * DNS-based email-auth check: SPF / DKIM / DMARC.
 *
 * Queries Cloudflare's 1.1.1.1 DoH (DNS-over-HTTPS) JSON endpoint so
 * the check works everywhere (no local resolver / UDP concerns). Bun
 * has a native `dns.resolveTxt` but it can be flaky in containerised
 * environments — DoH is boringly reliable.
 *
 * Splitting parse from fetch keeps the test surface pure: feed a
 * record string to the parser, assert the status.
 */

import { getMailDomain } from './dns-check-env';

export type DnsRecordStatus = 'ok' | 'missing' | 'wrong' | 'weak';

export interface DnsCheckResult {
	domain: string;
	spf: { status: DnsRecordStatus; record: string | null; message: string };
	dkim: {
		status: DnsRecordStatus;
		record: string | null;
		selector: string;
		message: string;
	};
	dmarc: { status: DnsRecordStatus; record: string | null; message: string };
	checkedAt: string;
	/** Copy-paste records the user should publish, given the hosting setup. */
	suggested: {
		spfAdd: string;
		dmarcRecord: string;
	};
}

// ─── DNS-over-HTTPS fetch ────────────────────────────────

interface DoHAnswer {
	name: string;
	type: number;
	TTL: number;
	data: string;
}

interface DoHResponse {
	Status: number;
	Answer?: DoHAnswer[];
}

/**
 * Look up TXT records for a name via Cloudflare DoH. Returns the
 * `data` field of each answer (Cloudflare returns TXT records wrapped
 * in double quotes; we strip them).
 */
export async function lookupTxt(name: string): Promise<string[]> {
	const url = `https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(name)}&type=TXT`;
	const res = await fetch(url, {
		headers: { accept: 'application/dns-json' },
	});
	if (!res.ok) throw new Error(`DoH lookup failed: ${res.status}`);
	const body = (await res.json()) as DoHResponse;
	if (body.Status !== 0 || !body.Answer) return [];
	return body.Answer.filter((a) => a.type === 16).map((a) => stripQuotes(a.data));
}

function stripQuotes(s: string): string {
	// TXT records get returned as `"v=spf1 ..."` and multi-string TXT
	// come as `"part1" "part2"`. Concatenate everything inside quotes.
	const parts = s.match(/"([^"]*)"/g);
	if (!parts) return s.replace(/^"|"$/g, '');
	return parts.map((p) => p.slice(1, -1)).join('');
}

// ─── Record parsers (pure, testable) ─────────────────────

/**
 * SPF check. Our send path goes through the user's Stalwart account,
 * so SPF on the user's domain should include the Mana sending host.
 * We accept three shapes:
 *   - Explicit `include:<mailDomain>` — the canonical form we
 *     recommend in the suggested-records UI.
 *   - A `+mx` / `mx` token — covers users who already route via their
 *     own MX; correct but needs the MX to be Mana.
 *   - Plain presence of `v=spf1` with `all` qualifier — weak: parses
 *     but doesn't actually authorise us.
 */
export function parseSpf(
	records: string[],
	mailDomain: string
): { status: DnsRecordStatus; record: string | null; message: string } {
	const spfRecords = records.filter((r) => r.toLowerCase().startsWith('v=spf1'));
	if (spfRecords.length === 0) {
		return { status: 'missing', record: null, message: 'Kein SPF-Record gefunden.' };
	}
	if (spfRecords.length > 1) {
		// RFC 7208 §3.2 — multiple SPF records = PermError for resolvers.
		return {
			status: 'wrong',
			record: spfRecords.join(' | '),
			message: 'Mehrere SPF-Records. Erlaubt ist genau einer — überflüssige entfernen.',
		};
	}
	const record = spfRecords[0];
	const lower = record.toLowerCase();
	if (lower.includes(`include:${mailDomain.toLowerCase()}`)) {
		return {
			status: 'ok',
			record,
			message: `SPF erlaubt Versand über ${mailDomain}.`,
		};
	}
	// Accept a catch-all `+all` or `+mx` as a permissive pass, but warn.
	if (lower.includes(' +all') || lower.endsWith('+all')) {
		return {
			status: 'weak',
			record,
			message: '+all erlaubt jedem Server zu senden — Einladung zum Spoofing. Spezifischer werden.',
		};
	}
	return {
		status: 'wrong',
		record,
		message: `SPF enthält kein include:${mailDomain}. Mails könnten in Spam landen.`,
	};
}

/**
 * DKIM check. The selector is `mana` (or whatever Stalwart's config
 * uses) at `<selector>._domainkey.<domain>`. We don't try to verify
 * the key matches — just that a record of the right shape exists.
 */
export function parseDkim(
	records: string[],
	selector: string
): { status: DnsRecordStatus; record: string | null; selector: string; message: string } {
	const dkim = records.find((r) => r.toLowerCase().startsWith('v=dkim1'));
	if (!dkim) {
		return {
			status: 'missing',
			record: null,
			selector,
			message: `Kein DKIM-Record auf ${selector}._domainkey — Mail wird nicht signiert.`,
		};
	}
	// Loose validity check: needs a p= public-key segment.
	if (!/\bp=[A-Za-z0-9+/=]+/i.test(dkim)) {
		return {
			status: 'wrong',
			record: dkim,
			selector,
			message: 'DKIM-Record ohne gültiges p= (Public-Key fehlt).',
		};
	}
	return {
		status: 'ok',
		record: dkim,
		selector,
		message: `DKIM signiert mit Selector "${selector}".`,
	};
}

/**
 * DMARC check. Policy `none` parses but doesn't actually enforce
 * anything — flagged as weak. `quarantine` and `reject` both OK.
 */
export function parseDmarc(records: string[]): {
	status: DnsRecordStatus;
	record: string | null;
	message: string;
} {
	const dmarc = records.find((r) => r.toLowerCase().startsWith('v=dmarc1'));
	if (!dmarc) {
		return {
			status: 'missing',
			record: null,
			message:
				'Kein DMARC-Record auf _dmarc — Gmail/Yahoo behandeln Bulk-Mails ohne DMARC strenger.',
		};
	}
	const policy = dmarc.match(/\bp=(none|quarantine|reject)\b/i);
	if (!policy) {
		return {
			status: 'wrong',
			record: dmarc,
			message: 'DMARC ohne p= (Policy). Setze mindestens p=none.',
		};
	}
	if (policy[1].toLowerCase() === 'none') {
		return {
			status: 'weak',
			record: dmarc,
			message:
				'p=none loggt nur — Phishing wird nicht abgewiesen. Nach Monitoring auf quarantine/reject gehen.',
		};
	}
	return {
		status: 'ok',
		record: dmarc,
		message: `DMARC aktiv mit Policy ${policy[1]}.`,
	};
}

// ─── Orchestrator ────────────────────────────────────────

export async function checkDomain(
	domain: string,
	opts: { mailDomain?: string; dkimSelector?: string } = {}
): Promise<DnsCheckResult> {
	const mailDomain = opts.mailDomain ?? getMailDomain();
	const selector = opts.dkimSelector ?? 'mana';

	const [spfRecords, dkimRecords, dmarcRecords] = await Promise.all([
		lookupTxt(domain).catch(() => []),
		lookupTxt(`${selector}._domainkey.${domain}`).catch(() => []),
		lookupTxt(`_dmarc.${domain}`).catch(() => []),
	]);

	return {
		domain,
		spf: parseSpf(spfRecords, mailDomain),
		dkim: parseDkim(dkimRecords, selector),
		dmarc: parseDmarc(dmarcRecords),
		checkedAt: new Date().toISOString(),
		suggested: {
			spfAdd: `v=spf1 include:${mailDomain} ~all`,
			dmarcRecord: `v=DMARC1; p=none; rua=mailto:dmarc-reports@${domain}`,
		},
	};
}
