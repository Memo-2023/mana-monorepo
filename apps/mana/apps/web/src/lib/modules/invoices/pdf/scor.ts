/**
 * ISO 11649 Creditor Reference (SCOR) generator — extracted from
 * qr-bill.ts so the invoice store can derive a reference number when a
 * new invoice is created, without statically pulling in swissqrbill/svg
 * (which drags pdf-lib + the whole SVG renderer into the list-view
 * bundle).
 *
 * qr-bill.ts re-exports `generateSCORReference` for backwards compat;
 * new callers should import from here.
 */

import { calculateSCORReferenceChecksum } from 'swissqrbill/utils';

/**
 * Generate an ISO 11649 Creditor Reference (SCOR) for the invoice. Uses
 * the invoice number as payload so the reference is stable across re-
 * renders. Format: `RF{check}{payload}`.
 *
 *   invoice.number "2026-0042" → payload "20260042" → RF{check}20260042
 *
 * Non-alphanumerics are stripped (the spec allows only [0-9A-Z] in the
 * payload). The payload is truncated to 21 chars (SCOR max).
 */
export function generateSCORReference(invoiceNumber: string): string {
	const payload = invoiceNumber
		.replace(/[^0-9A-Za-z]/g, '')
		.toUpperCase()
		.slice(0, 21);
	if (!payload) {
		// Degenerate input (e.g. all dashes) — fall back to a literal.
		return `RF${calculateSCORReferenceChecksum('INVOICE')}INVOICE`;
	}
	const checksum = calculateSCORReferenceChecksum(payload);
	return `RF${checksum}${payload}`;
}
