/**
 * Plain-text fallback for the email.
 *
 * RFC 2822 allows multipart/alternative with text + html bodies; anti-
 * spam scoring (SpamAssassin etc.) penalises html-only campaigns because
 * legit mail usually has both. Tiptap already produces plain text via
 * getText(); we format it minimally and append the same footer signals
 * (sender, unsubscribe, legal address) as the HTML version.
 *
 * Wrapping: email clients still honour the ancient 78-char line limit
 * from RFC 2822. We soft-wrap at 72 so there's headroom for quote
 * prefixes when someone forwards.
 */

import type { Campaign, BroadcastSettings } from '../types';

export interface RenderPlainTextInput {
	tiptapText: string;
	campaign: Pick<Campaign, 'fromName'>;
	settings: Pick<BroadcastSettings, 'defaultFooter' | 'legalAddress'>;
	unsubscribeUrl?: string;
	webViewUrl?: string;
}

/**
 * Greedy word-wrap at `width` characters. Doesn't break inside words —
 * a very long URL stays on one line (gets line-wrapped by the mail
 * client if it has to). Preserves existing newlines.
 */
function softWrap(text: string, width: number): string {
	const out: string[] = [];
	for (const paragraph of text.split('\n')) {
		if (paragraph.length <= width) {
			out.push(paragraph);
			continue;
		}
		let line = '';
		for (const word of paragraph.split(/\s+/)) {
			if (!word) continue;
			const probe = line ? `${line} ${word}` : word;
			if (probe.length <= width) {
				line = probe;
			} else {
				if (line) out.push(line);
				line = word;
			}
		}
		if (line) out.push(line);
	}
	return out.join('\n');
}

export function renderPlainText(input: RenderPlainTextInput): string {
	const body = softWrap((input.tiptapText ?? '').trim(), 72);
	const fromName = input.campaign.fromName || '';
	const footer = input.settings.defaultFooter?.trim();
	const legal = input.settings.legalAddress?.trim();
	const unsubscribeUrl = input.unsubscribeUrl ?? '[Abmelde-Link wird beim Versand eingefügt]';
	const webViewUrl = input.webViewUrl ?? '[Browser-Link wird beim Versand eingefügt]';

	const parts: string[] = [];

	if (webViewUrl && !webViewUrl.startsWith('[')) {
		parts.push(`Im Browser ansehen: ${webViewUrl}`, '');
	}
	if (fromName) parts.push(fromName, '');
	if (body) parts.push(body, '');

	parts.push('---');
	if (footer) {
		parts.push(softWrap(footer, 72), '');
	}
	parts.push(
		'Du erhältst diese E-Mail, weil du dich dafür angemeldet hast.',
		`Abbestellen: ${unsubscribeUrl}`,
		''
	);
	if (legal) parts.push(softWrap(legal, 72));

	return parts.join('\n');
}
