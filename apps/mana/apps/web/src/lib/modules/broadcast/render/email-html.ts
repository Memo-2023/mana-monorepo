/**
 * Render a complete email HTML document around Tiptap-generated content.
 *
 * The job is split across two environments:
 *   - THIS file (client-side): wraps the user's content in an email-
 *     compatible shell with preheader + footer + unsubscribe. Uses
 *     inline style="" attributes throughout because email clients have
 *     patchy support for <style> blocks, CSS variables, Flexbox, or Grid.
 *     Good enough for Gmail / Apple Mail / iOS Mail / Outlook.com.
 *   - M4's server-side inlining pass (juice in mana-mail): expands the
 *     remaining shorthand / hover / @media rules into inline styles per-
 *     recipient. Only relevant if we ever add richer CSS.
 *
 * For now, everything already-inline client-side means the preview the
 * user sees = what the recipient sees (minus the substituted URLs).
 *
 * Placeholders substituted at send time (mana-mail):
 *   {{unsubscribe_url}} — HMAC-signed one-click abmelden link
 *   {{web_view_url}}    — public URL to the rendered campaign
 *
 * In preview, those stay as literal `#unsubscribe-preview` etc. so the
 * user can still click them without hitting a broken server route.
 */

import type { Campaign, BroadcastSettings } from '../types';

export interface RenderEmailInput {
	/** HTML produced by Tiptap's getHTML(). Assumed safe — Tiptap's schema
	 *  doesn't emit <script>, on* handlers, or unknown attributes. */
	tiptapHtml: string;
	campaign: Pick<Campaign, 'subject' | 'preheader' | 'fromName' | 'fromEmail'>;
	settings: Pick<BroadcastSettings, 'defaultFooter' | 'legalAddress'>;
	/** Pass `'#preview'` for the client preview; mana-mail overrides with
	 *  the signed per-recipient URL at send time. */
	unsubscribeUrl?: string;
	webViewUrl?: string;
}

/**
 * Escape a string for safe HTML attribute / text node insertion. Covers
 * the five chars that matter for XSS in an HTML context.
 */
function escapeHtml(s: string): string {
	return s
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&#39;');
}

/**
 * Invisible preheader: Gmail / Apple Mail show whatever follows the
 * subject in the inbox list. This is the one place where an invisible
 * span is standard best practice — we hide the text with zero font-size
 * and zero opacity, then pad with whitespace so nothing else bleeds
 * through into the preview. 120 chars of padding is what Mailchimp
 * uses; good enough.
 */
function preheaderBlock(preheader: string): string {
	const text = escapeHtml(preheader);
	// Eight Unicode zero-width non-joiners interleaved with nbsps — pushes
	// the preview cutoff past the preheader without visible characters.
	const padding = '&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;'.repeat(
		15
	);
	return `<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;font-size:1px;line-height:1px;color:#ffffff;opacity:0;">${text}${padding}</div>`;
}

/**
 * Render the complete email HTML. Pure function — callers are
 * responsible for providing the final URLs.
 */
export function renderEmailHtml(input: RenderEmailInput): string {
	const subject = escapeHtml(input.campaign.subject || '');
	const fromName = escapeHtml(input.campaign.fromName || '');
	const preheader = input.campaign.preheader ? preheaderBlock(input.campaign.preheader) : '';
	const unsubscribeUrl = input.unsubscribeUrl ?? '#unsubscribe-preview';
	const webViewUrl = input.webViewUrl ?? '#web-view-preview';
	const footerHtml = input.settings.defaultFooter
		? escapeHtml(input.settings.defaultFooter).replace(/\n/g, '<br>')
		: '';
	const legalAddress = escapeHtml(input.settings.legalAddress ?? '').replace(/\n/g, '<br>');

	// Body is NOT escaped — it's Tiptap's output which we trust.
	const body = input.tiptapHtml || '<p>&nbsp;</p>';

	// Single-cell table layout is the most portable container across
	// Outlook + Gmail + Apple Mail. Wider than 600px looks bad on mobile;
	// narrower than 560 loses density on desktop.
	return `<!doctype html>
<html lang="de"><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta http-equiv="x-ua-compatible" content="ie=edge">
<title>${subject}</title>
</head><body style="margin:0;padding:0;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;color:#0f172a;line-height:1.55;">
${preheader}
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f1f5f9;padding:24px 12px;">
<tr><td align="center">
	<table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(15,23,42,0.06);">

	<tr><td style="padding:12px 24px;font-size:12px;color:#64748b;text-align:right;">
		<a href="${escapeHtml(webViewUrl)}" style="color:#64748b;text-decoration:underline;">Im Browser ansehen</a>
	</td></tr>

	<tr><td style="padding:0 24px 8px;">
		<div style="font-size:18px;font-weight:600;color:#0f172a;">${fromName}</div>
	</td></tr>

	<tr><td style="padding:8px 24px 24px;font-size:16px;color:#0f172a;">
		${body}
	</td></tr>

	<tr><td style="padding:16px 24px;border-top:1px solid #e2e8f0;font-size:12px;color:#64748b;">
		${footerHtml ? `<div style="margin-bottom:8px;">${footerHtml}</div>` : ''}
		<div style="margin-bottom:8px;">
			Du erhältst diese E-Mail, weil du dich dafür angemeldet hast.
			<a href="${escapeHtml(unsubscribeUrl)}" style="color:#6366f1;text-decoration:underline;">Abbestellen</a>
		</div>
		<div style="color:#94a3b8;">
			${legalAddress}
		</div>
	</td></tr>

	</table>
</td></tr>
</table>
</body></html>`;
}
