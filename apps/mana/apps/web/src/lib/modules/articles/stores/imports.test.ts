/**
 * Tests for the pure `parseUrls` URL-list parser. The store's mutation
 * methods (createJob, pauseJob, …) are integration-shaped (need Dexie
 * + the scope hook) and live under the integration suite; this file
 * only covers the parser, which is the deterministic part.
 *
 * Plan: docs/plans/articles-bulk-import.md.
 */

import { describe, it, expect } from 'vitest';
import { parseUrls } from '../parse-urls';

describe('parseUrls', () => {
	it('returns empty arrays for an empty input', () => {
		expect(parseUrls('')).toEqual({ valid: [], invalid: [], duplicates: [] });
		expect(parseUrls('   \n\t  ')).toEqual({ valid: [], invalid: [], duplicates: [] });
	});

	it('parses a single newline-separated list', () => {
		const r = parseUrls('https://example.com/a\nhttps://example.com/b\nhttps://example.com/c');
		expect(r.valid).toEqual([
			'https://example.com/a',
			'https://example.com/b',
			'https://example.com/c',
		]);
		expect(r.invalid).toEqual([]);
		expect(r.duplicates).toEqual([]);
	});

	it('accepts whitespace + comma + tabs as separators', () => {
		const r = parseUrls('https://a.com  https://b.com,\thttps://c.com\nhttps://d.com');
		expect(r.valid).toEqual([
			'https://a.com/',
			'https://b.com/',
			'https://c.com/',
			'https://d.com/',
		]);
	});

	it('accepts http and https, rejects everything else', () => {
		const r = parseUrls(
			[
				'http://insecure.example',
				'https://secure.example',
				'ftp://files.example',
				'javascript:alert(1)',
				'mailto:foo@bar.com',
				'file:///etc/passwd',
			].join('\n')
		);
		expect(r.valid).toEqual(['http://insecure.example/', 'https://secure.example/']);
		expect(r.invalid).toHaveLength(4);
		expect(r.invalid).toContain('javascript:alert(1)');
		expect(r.invalid).toContain('mailto:foo@bar.com');
	});

	it('rejects scheme-less domains (URL accepts them as opaque)', () => {
		const r = parseUrls('example.com\ngoogle.com\nhttps://valid.com');
		expect(r.valid).toEqual(['https://valid.com/']);
		expect(r.invalid).toEqual(['example.com', 'google.com']);
	});

	it('flags duplicate URLs as duplicates, keeps the first occurrence', () => {
		const r = parseUrls(
			'https://example.com/a\nhttps://example.com/b\nhttps://example.com/a\nhttps://example.com/b'
		);
		expect(r.valid).toEqual(['https://example.com/a', 'https://example.com/b']);
		expect(r.duplicates).toEqual(['https://example.com/a', 'https://example.com/b']);
	});

	it('canonicalises URLs (trailing slash on root, identical query order) so dupes are caught', () => {
		const r = parseUrls('https://example.com\nhttps://example.com/');
		expect(r.valid).toEqual(['https://example.com/']);
		expect(r.duplicates).toEqual(['https://example.com/']);
	});

	it('preserves first-occurrence order across mixed valid/invalid/dup tokens', () => {
		const r = parseUrls(
			[
				'https://first.com',
				'not-a-url',
				'https://second.com',
				'https://first.com', // duplicate of first
				'https://third.com',
			].join('\n')
		);
		expect(r.valid).toEqual(['https://first.com/', 'https://second.com/', 'https://third.com/']);
		expect(r.invalid).toEqual(['not-a-url']);
		expect(r.duplicates).toEqual(['https://first.com/']);
	});

	it('handles realistic paste with title prefixes (extracts URL-shaped tokens only)', () => {
		// User pasted from a chat where each line had a title before the URL
		// — our parser splits on whitespace, so this leaves bare URL tokens
		// + title-noise as "invalid". That's the correct behaviour for a
		// strict parser; the UI surfaces both counters so the user sees it.
		const r = parseUrls(
			'Awesome article: https://nytimes.com/article-1\nAnother one: https://wsj.com/x'
		);
		expect(r.valid).toEqual(['https://nytimes.com/article-1', 'https://wsj.com/x']);
		expect(r.invalid).toContain('Awesome');
		expect(r.invalid).toContain('article:');
	});

	it('keeps query strings + fragments in canonical form', () => {
		const r = parseUrls(
			'https://example.com/a?x=1&y=2#section\nhttps://example.com/a?x=1&y=2#section'
		);
		expect(r.valid).toEqual(['https://example.com/a?x=1&y=2#section']);
		expect(r.duplicates).toEqual(['https://example.com/a?x=1&y=2#section']);
	});

	it('handles a 50-URL input without choking', () => {
		const urls = Array.from({ length: 50 }, (_, i) => `https://example.com/article-${i}`);
		const r = parseUrls(urls.join('\n'));
		expect(r.valid).toHaveLength(50);
		expect(r.invalid).toEqual([]);
		expect(r.duplicates).toEqual([]);
	});
});
