/**
 * HTML anchor-href rewriter for click tracking.
 *
 * Walks the body HTML and rewrites each `<a href="http…">` to
 * `.../api/v1/track/click/{token}?url={encoded_original}` so clicks go
 * through the tracking endpoint first. Non-http schemes (mailto:, tel:,
 * sms:, anchor fragments) are left alone — tracking them is both
 * pointless and potentially harmful (mailto: tracking would break the
 * recipient's mail client hand-off).
 *
 * URLs listed in `skipUrls` are passed through untouched. That's how
 * the unsubscribe-URL and web-view-URL (already signed tracking URLs)
 * avoid double-wrapping.
 *
 * Regex-based because Tiptap's output is well-formed HTML — we don't
 * need a full parser. If users ever get to paste arbitrary HTML, we
 * swap to parse5.
 */

/**
 * Replace anchor href attributes in the HTML body with tracked URLs.
 * Returns the rewritten HTML plus a count of how many links were
 * touched (useful for stats / debugging).
 */
export function rewriteClickLinks(
	html: string,
	token: string,
	baseUrl: string,
	skipUrls: Set<string>
): { html: string; rewritten: number } {
	let rewritten = 0;
	const trackBase = `${baseUrl}/api/v1/track/click/${token}`;

	// Match only anchor tags — image src / form action aren't clicks.
	// The pattern is deliberately loose on whitespace and attribute
	// order to survive minor Tiptap formatting variations.
	const pattern = /<a\b([^>]*?)href=(["'])([^"']+)\2([^>]*)>/gi;

	const out = html.replace(pattern, (match, preAttrs, quote, url, postAttrs) => {
		// Keep non-http(s) untouched: mailto / tel / anchor fragments
		// should land in the native handler, not the tracker.
		if (!/^https?:\/\//i.test(url)) return match;
		if (skipUrls.has(url)) return match;

		const wrappedUrl = `${trackBase}?url=${encodeURIComponent(url)}`;
		rewritten++;
		return `<a${preAttrs}href=${quote}${wrappedUrl}${quote}${postAttrs}>`;
	});

	return { html: out, rewritten };
}
