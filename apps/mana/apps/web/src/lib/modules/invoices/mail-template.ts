/**
 * E-Mail-Vorlagen für den Rechnungsversand.
 *
 * Der tatsächliche Versand läuft über den Default-Mail-Client des Nutzers
 * (mailto:), weil das mana-mail-Backend aktuell keine Attachments kann.
 * Anhang wird separat heruntergeladen und manuell angehängt — Template
 * erwähnt das explizit, damit der Empfänger weiß, worauf er sich
 * bezieht.
 */

import type { Invoice, InvoiceSettings } from './types';
import { formatAmount } from './queries';

export interface MailDraft {
	to: string;
	subject: string;
	body: string;
}

/**
 * Build a draft mail for the invoice. Uses the client email from the
 * frozen snapshot (not a fresh contacts lookup) so a sent invoice's mail
 * stays aligned with whoever it was actually addressed to.
 */
export function buildInvoiceMailDraft(invoice: Invoice, settings: InvoiceSettings): MailDraft {
	const recipientName = invoice.clientSnapshot.name || 'Geehrte Damen und Herren';
	const senderName = settings.senderName || 'Mana';
	const subjectLine = invoice.subject
		? `Rechnung ${invoice.number} — ${invoice.subject}`
		: `Rechnung ${invoice.number}`;

	const gross = formatAmount(invoice.totals.gross, invoice.currency);

	const body =
		`Hallo ${recipientName},\n\n` +
		`im Anhang finden Sie die Rechnung ${invoice.number} über ${gross}, ` +
		`fällig am ${invoice.dueDate}.\n\n` +
		(invoice.currency === 'CHF'
			? `Die Rechnung enthält einen Schweizer QR-Einzahlungsschein für die Zahlung.\n\n`
			: '') +
		`Bei Fragen melde ich mich gerne.\n\n` +
		`Freundliche Grüsse\n` +
		`${senderName}`;

	return {
		to: invoice.clientSnapshot.email ?? '',
		subject: subjectLine,
		body,
	};
}

/**
 * Turn a MailDraft into a `mailto:` URL. Newlines become %0A, spaces %20
 * etc. via encodeURIComponent. Long bodies may trip the OS URL length
 * limit (~2000 chars on some Windows clients); the template is well
 * under that.
 */
export function mailDraftToMailto(draft: MailDraft): string {
	const params = new URLSearchParams({
		subject: draft.subject,
		body: draft.body,
	});
	// URLSearchParams uses `+` for spaces, which mailto: clients interpret
	// as literal plus signs. Patch to `%20` for robustness across macOS
	// Mail, Outlook, Thunderbird, Apple Mail on iOS.
	const query = params.toString().replace(/\+/g, '%20');
	return `mailto:${encodeURIComponent(draft.to)}?${query}`;
}

/** Very loose email check — intentionally permissive (catches empty + obvious typos). */
export function looksLikeEmail(value: string): boolean {
	return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}
