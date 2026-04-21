import { describe, it, expect } from 'bun:test';
import { rewriteClickLinks } from './link-rewriter';

const TOKEN = 'abc.def';
const BASE = 'https://mail.mana.how';
const EMPTY_SKIP = new Set<string>();

describe('rewriteClickLinks', () => {
	it('rewrites a simple https link', () => {
		const { html, rewritten } = rewriteClickLinks(
			'<a href="https://example.com">click</a>',
			TOKEN,
			BASE,
			EMPTY_SKIP
		);
		expect(rewritten).toBe(1);
		expect(html).toContain(`${BASE}/api/v1/track/click/${TOKEN}?url=`);
		expect(html).toContain(encodeURIComponent('https://example.com'));
	});

	it('rewrites http:// links too', () => {
		const { rewritten } = rewriteClickLinks(
			'<a href="http://old-site.ch">x</a>',
			TOKEN,
			BASE,
			EMPTY_SKIP
		);
		expect(rewritten).toBe(1);
	});

	it('leaves mailto: alone', () => {
		const input = '<a href="mailto:foo@bar.ch">mail</a>';
		const { html, rewritten } = rewriteClickLinks(input, TOKEN, BASE, EMPTY_SKIP);
		expect(rewritten).toBe(0);
		expect(html).toBe(input);
	});

	it('leaves tel: alone', () => {
		const input = '<a href="tel:+41443000000">call</a>';
		const { html, rewritten } = rewriteClickLinks(input, TOKEN, BASE, EMPTY_SKIP);
		expect(rewritten).toBe(0);
		expect(html).toBe(input);
	});

	it('leaves anchor fragments alone', () => {
		const input = '<a href="#section-2">down</a>';
		const { html, rewritten } = rewriteClickLinks(input, TOKEN, BASE, EMPTY_SKIP);
		expect(rewritten).toBe(0);
		expect(html).toBe(input);
	});

	it('skips URLs listed in skipUrls (unsubscribe, web-view)', () => {
		const unsub = 'https://mail.mana.how/api/v1/track/unsubscribe/xxx.yyy';
		const input = `<a href="${unsub}">abbestellen</a><a href="https://other.ch">other</a>`;
		const { html, rewritten } = rewriteClickLinks(input, TOKEN, BASE, new Set([unsub]));
		expect(rewritten).toBe(1);
		expect(html).toContain(unsub); // untouched
		expect(html).toContain(encodeURIComponent('https://other.ch')); // rewritten
	});

	it('preserves other attributes on the anchor', () => {
		const { html } = rewriteClickLinks(
			'<a class="btn" href="https://example.com" style="color:red">x</a>',
			TOKEN,
			BASE,
			EMPTY_SKIP
		);
		expect(html).toContain('class="btn"');
		expect(html).toContain('style="color:red"');
	});

	it('counts multiple rewrites', () => {
		const input =
			'<a href="https://a.ch">a</a> <a href="https://b.ch">b</a> <a href="mailto:x@y.z">x</a>';
		const { rewritten } = rewriteClickLinks(input, TOKEN, BASE, EMPTY_SKIP);
		expect(rewritten).toBe(2);
	});

	it('handles single-quoted href attributes', () => {
		const { rewritten, html } = rewriteClickLinks(
			"<a href='https://example.com'>x</a>",
			TOKEN,
			BASE,
			EMPTY_SKIP
		);
		expect(rewritten).toBe(1);
		// Output should still be single-quoted.
		expect(html).toContain("href='");
	});

	it('is idempotent for skip URLs — passing them again does not double-wrap', () => {
		const wrapped = `${BASE}/api/v1/track/click/${TOKEN}?url=${encodeURIComponent('https://x.ch')}`;
		const input = `<a href="${wrapped}">x</a>`;
		const { rewritten, html } = rewriteClickLinks(input, TOKEN, BASE, new Set([wrapped]));
		expect(rewritten).toBe(0);
		expect(html).toBe(input);
	});

	it('returns count even when no links match', () => {
		const { rewritten, html } = rewriteClickLinks(
			'<p>Just some text, no links.</p>',
			TOKEN,
			BASE,
			EMPTY_SKIP
		);
		expect(rewritten).toBe(0);
		expect(html).toBe('<p>Just some text, no links.</p>');
	});
});
