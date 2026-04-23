/**
 * Tests for the slug / path validators. Pure regex — no I/O.
 */

import { describe, it, expect } from 'vitest';
import { isValidSlug, isReservedSlug, SLUG_REGEX, RESERVED_SLUGS } from './constants';
import { isValidPath } from './stores/pages.svelte';

describe('slug validation', () => {
	it('accepts valid slugs', () => {
		const valid = [
			'ab', // minimum length
			'hello',
			'hello-world',
			'portfolio-2026',
			'a-b-c',
			'1234',
			'a'.repeat(40), // maximum length
		];
		for (const s of valid) {
			expect(isValidSlug(s), `"${s}" should be valid`).toBe(true);
			expect(SLUG_REGEX.test(s), `"${s}" should match regex`).toBe(true);
		}
	});

	it('rejects invalid formats', () => {
		const invalid = [
			'', // empty
			'a', // too short
			'a'.repeat(41), // too long
			'Hello', // uppercase
			'-abc', // leading hyphen
			'abc-', // trailing hyphen
			'ab--cd', // double hyphen is technically OK by regex — sanity-check inverted expectation below
			'ab cd', // space
			'ab.cd', // dot
			'ab_cd', // underscore
			'ab/cd', // slash
			'üöä', // non-ASCII
			'🌟', // emoji
		];
		// Double-hyphen: the plan's regex ALLOWS it (no explicit ban).
		// If we ever forbid it, remove from this list and move to valid.
		const expected = invalid.filter((s) => s !== 'ab--cd');
		for (const s of expected) {
			expect(isValidSlug(s), `"${s}" should be invalid`).toBe(false);
		}
		expect(isValidSlug('ab--cd'), 'double-hyphen currently allowed').toBe(true);
	});

	it('rejects reserved slugs even if format is valid', () => {
		for (const reserved of RESERVED_SLUGS) {
			expect(isReservedSlug(reserved)).toBe(true);
			expect(isValidSlug(reserved), `"${reserved}" is reserved`).toBe(false);
		}
	});

	it('reserved-slug check is case-insensitive', () => {
		expect(isReservedSlug('API')).toBe(true);
		expect(isReservedSlug('Api')).toBe(true);
		expect(isReservedSlug('admin')).toBe(true);
	});

	it('covers the minimum reserved names that would shadow app routes', () => {
		const mustHave = ['app', 'api', 'auth', 'admin', 's', 'www'];
		for (const name of mustHave) {
			expect(RESERVED_SLUGS.includes(name), `${name} must be reserved`).toBe(true);
		}
	});
});

describe('page path validation', () => {
	it('accepts valid paths', () => {
		const valid = [
			'/',
			'/about',
			'/about-us',
			'/docs/getting-started',
			'/blog/2026/04/hello',
			'/a',
			'/a/b/c/d',
		];
		for (const p of valid) {
			expect(isValidPath(p), `"${p}" should be valid`).toBe(true);
		}
	});

	it('rejects invalid paths', () => {
		const invalid = [
			'', // must start with /
			'about', // no leading slash
			'/about/', // trailing slash (per current regex)
			'/About', // uppercase
			'/foo bar', // space
			'/foo.html', // dot
			'/foo//bar', // double slash
			'//', // just slashes
			'/ä', // non-ASCII
		];
		for (const p of invalid) {
			expect(isValidPath(p), `"${p}" should be invalid`).toBe(false);
		}
	});

	it('root path "/" is always valid', () => {
		expect(isValidPath('/')).toBe(true);
	});
});
