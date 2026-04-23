/**
 * Slug + hostname validator tests. Pure — no DB, no DNS.
 */

import { describe, it, expect } from 'vitest';
import { isValidSlug, RESERVED_SLUGS, isValidHostname, RESERVED_HOSTNAMES } from './reserved-slugs';

describe('isValidSlug (server)', () => {
	it('accepts 2-40 lowercase alphanumerics + hyphens', () => {
		for (const s of ['ab', 'hello', 'hello-world', '1234', 'a'.repeat(40)]) {
			expect(isValidSlug(s), `"${s}"`).toBe(true);
		}
	});

	it('rejects single chars, too-long, uppercase, edge hyphens, non-ASCII', () => {
		for (const s of ['', 'a', 'a'.repeat(41), 'Hello', '-x', 'x-', 'a b', 'ä']) {
			expect(isValidSlug(s), `"${s}"`).toBe(false);
		}
	});

	it('rejects every entry in RESERVED_SLUGS', () => {
		for (const slug of RESERVED_SLUGS) {
			expect(isValidSlug(slug), `reserved "${slug}"`).toBe(false);
		}
	});

	it('reserved-list covers the minimum app routes', () => {
		for (const must of ['app', 'api', 'auth', 'admin', 's', 'www']) {
			expect(RESERVED_SLUGS.includes(must), `${must} must be reserved`).toBe(true);
		}
	});
});

describe('isValidHostname', () => {
	it('accepts reasonable external domains', () => {
		const valid = [
			'example.com',
			'portfolio.example.com',
			'my-site.deine-domain.de',
			'a.b.c.d.example.com', // deep subdomain
			'abc.io',
		];
		for (const h of valid) {
			expect(isValidHostname(h), `"${h}"`).toBe(true);
		}
	});

	it('rejects malformed hostnames', () => {
		const invalid = [
			'',
			'localhost', // no dot
			'example', // no TLD
			'.example.com', // leading dot
			'example..com', // double dot
			'exa mple.com', // space
			'example.com.', // trailing dot
			'-example.com', // leading hyphen
			'example-.com', // trailing hyphen on label
			'EXAMPLE.COM', // uppercase — we lowercase but still must match; let's verify current behaviour
			'192.168.1.1', // IP rejected (TLD must be letters)
			'foo.1', // TLD needs 2+ letters
		];
		for (const h of invalid) {
			// EXAMPLE.COM currently passes because isValidHostname lowercases
			// before regex. That's intentional.
			if (h === 'EXAMPLE.COM') {
				expect(isValidHostname(h)).toBe(true);
				continue;
			}
			expect(isValidHostname(h), `"${h}"`).toBe(false);
		}
	});

	it('rejects anything under .mana.how', () => {
		for (const h of [
			'mana.how',
			'www.mana.how',
			'todo.mana.how',
			'random-user.mana.how',
			'a.b.c.mana.how',
		]) {
			expect(isValidHostname(h), `"${h}"`).toBe(false);
		}
	});

	it('rejects every RESERVED_HOSTNAMES entry', () => {
		for (const h of RESERVED_HOSTNAMES) {
			expect(isValidHostname(h), `reserved "${h}"`).toBe(false);
		}
	});

	it('trims whitespace before validating', () => {
		expect(isValidHostname('  example.com  ')).toBe(true);
	});

	it('respects length limit (253 chars RFC)', () => {
		const tooLong = 'a.'.repeat(130) + 'com'; // > 253
		expect(isValidHostname(tooLong)).toBe(false);
	});
});
