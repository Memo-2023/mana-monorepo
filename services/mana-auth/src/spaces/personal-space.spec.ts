/**
 * Tests for personal-space slug derivation and uniqueness resolution.
 *
 * createPersonalSpaceFor is covered by an integration test (DB-backed)
 * once that harness exists — here we pin down the pure string logic and
 * the slug-collision loop.
 */

import { describe, it, expect } from 'bun:test';
import { candidateSlugFromEmail, resolveUniqueSlug, type SlugTakenLookup } from './personal-space';

describe('candidateSlugFromEmail', () => {
	it('takes the local part and lowercases it', () => {
		expect(candidateSlugFromEmail('Till@memoro.ai')).toBe('till');
		expect(candidateSlugFromEmail('Foo.Bar@X.de')).toBe('foo-bar');
	});

	it('strips non-alphanumerics and collapses dashes', () => {
		expect(candidateSlugFromEmail('a..b+c@x.de')).toBe('a-b-c');
	});

	it('trims leading/trailing dashes', () => {
		expect(candidateSlugFromEmail('--till--@x.de')).toBe('till');
	});

	it('caps at 30 characters', () => {
		const long = 'a'.repeat(60) + '@x.de';
		const slug = candidateSlugFromEmail(long);
		expect(slug.length).toBeLessThanOrEqual(30);
	});

	it('falls back to a random slug when stripping empties the string', () => {
		expect(candidateSlugFromEmail('_____@x.de')).toMatch(/^user-[a-z0-9]{6}$/);
	});

	it('falls back when local-part contains only whitespace', () => {
		expect(candidateSlugFromEmail('  @x.de')).toMatch(/^user-[a-z0-9]{6}$/);
	});

	it('preserves digits', () => {
		expect(candidateSlugFromEmail('user42@x.de')).toBe('user42');
	});
});

function lookupFor(taken: string[]): SlugTakenLookup {
	const set = new Set(taken);
	return async (slug) => set.has(slug);
}

describe('resolveUniqueSlug', () => {
	it('returns the base slug when free', async () => {
		expect(await resolveUniqueSlug('till', lookupFor([]))).toBe('till');
	});

	it('appends -2 on single collision', async () => {
		expect(await resolveUniqueSlug('till', lookupFor(['till']))).toBe('till-2');
	});

	it('walks through suffixes until free', async () => {
		expect(await resolveUniqueSlug('till', lookupFor(['till', 'till-2', 'till-3']))).toBe('till-4');
	});

	it('skips reserved slugs even when DB says free', async () => {
		expect(await resolveUniqueSlug('admin', lookupFor([]))).toBe('admin-2');
		expect(await resolveUniqueSlug('api', lookupFor([]))).toBe('api-2');
		expect(await resolveUniqueSlug('me', lookupFor([]))).toBe('me-2');
	});

	it('does NOT skip non-reserved slugs that happen to contain reserved words', async () => {
		// We only match the exact reserved set; `admins`, `apikey`, `myself` are fine.
		expect(await resolveUniqueSlug('admins', lookupFor([]))).toBe('admins');
		expect(await resolveUniqueSlug('myself', lookupFor([]))).toBe('myself');
	});
});
