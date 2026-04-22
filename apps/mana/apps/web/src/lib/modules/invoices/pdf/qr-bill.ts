/**
 * Swiss QR-Bill integration.
 *
 * ## Architecture
 *
 * `swissqrbill/pdf` targets PDFKit, not pdf-lib. So we use the `svg`
 * export, rasterise the SVG to PNG in the browser, and embed that PNG
 * at the bottom of the last page of the pdf-lib invoice.
 *
 *   invoice + settings
 *        │
 *        ▼
 *   buildQRBillData()     ← validation: CHF/EUR + valid IBAN + parseable address
 *        │
 *        ▼
 *   new SwissQRBill(data).toString()   ← SVG markup
 *        │
 *        ▼
 *   rasteriseSvgToPng()   ← canvas, 300 DPI target
 *        │
 *        ▼
 *   doc.embedPng(bytes) → page.drawImage(at y=0, full width, 105mm tall)
 *
 * Browser-only — canvas + Image are not available in SSR. The renderer
 * never runs during prerender (DetailView is client-only for PDF), so
 * this is safe.
 *
 * ## Address parsing
 *
 * The QR-Bill spec (v2022) requires structured addresses: street, city,
 * zip, country. Our sender/client snapshots hold free-text multi-line
 * addresses. `parseAddress()` is a heuristic for Swiss/DE addresses:
 *
 *   "Bahnhofstrasse 1\n8000 Zürich"
 *        ↓
 *   { street: "Bahnhofstrasse 1", zip: "8000", city: "Zürich" }
 *
 * If parsing fails (missing zip+city line), we throw `QRBillError` and
 * the renderer skips the Zahlteil with a visible warning to the user.
 */

import type { PDFDocument } from 'pdf-lib';
import { SwissQRBill } from 'swissqrbill/svg';
import { isIBANValid } from 'swissqrbill/utils';
import type { Data } from 'swissqrbill/types';
import type { Invoice, InvoiceSettings } from '../types';
import { CURRENCIES } from '../constants';
import { A4, mm } from './templates/default';
// Re-export so existing callers keep working, but prefer importing from
// './scor' directly (keeps swissqrbill/svg + pdf-lib out of the callers'
// bundle when they only need the reference string).
import { generateSCORReference } from './scor';
export { generateSCORReference };

export class QRBillError extends Error {
	constructor(
		message: string,
		public readonly reason:
			| 'invalid-currency'
			| 'missing-iban'
			| 'invalid-iban'
			| 'unparseable-sender-address'
			| 'unparseable-client-address'
			| 'missing-amount'
	) {
		super(message);
		this.name = 'QRBillError';
	}
}

// ─── Address parsing ─────────────────────────────────────

interface StructuredAddress {
	street: string;
	zip: string;
	city: string;
	country: string;
}

/**
 * Parse a free-text multi-line address into structured fields.
 * Expects two non-empty lines:
 *   Line 1: "Street + number"
 *   Line 2: "<zip> <city>" where zip is 4-5 digits (CH=4, DE=5, AT=4)
 * Returns null if the format isn't recognised.
 */
function parseAddress(text: string | undefined, defaultCountry = 'CH'): StructuredAddress | null {
	if (!text) return null;
	const lines = text
		.split('\n')
		.map((l) => l.trim())
		.filter(Boolean);
	if (lines.length < 2) return null;
	const last = lines[lines.length - 1];
	const match = last.match(/^(\d{4,5})\s+(.+)$/);
	if (!match) return null;
	const [, zip, city] = match;
	const street = lines.slice(0, -1).join(', ');
	if (!street) return null;
	return { street, zip, city, country: defaultCountry };
}

// ─── QR-Bill data assembly ────────────────────────────────

/**
 * Build the data object for swissqrbill, or throw QRBillError with the
 * specific reason. The caller catches and surfaces a warning in the UI.
 */
export function buildQRBillData(invoice: Invoice, settings: InvoiceSettings): Data {
	if (invoice.currency !== 'CHF' && invoice.currency !== 'EUR') {
		throw new QRBillError(
			`QR-Rechnung unterstützt nur CHF und EUR (nicht ${invoice.currency}).`,
			'invalid-currency'
		);
	}
	const iban = (settings.senderIban ?? '').replace(/\s+/g, '');
	if (!iban) {
		throw new QRBillError(
			'IBAN fehlt in den Rechnungs-Einstellungen. Bitte ergänzen.',
			'missing-iban'
		);
	}
	if (!isIBANValid(iban)) {
		throw new QRBillError('Die hinterlegte IBAN ist ungültig.', 'invalid-iban');
	}

	// Prefer the structured fields set in SenderProfileForm. If empty
	// (pre-migration settings / minimal onboarding), fall back to parsing
	// the legacy free-text address so QR-Bills keep working for users who
	// haven't opened the new form yet.
	const creditorAddr: StructuredAddress | null =
		settings.senderStreet && settings.senderZip && settings.senderCity
			? {
					street: settings.senderStreet,
					zip: settings.senderZip,
					city: settings.senderCity,
					country: settings.senderCountry || 'CH',
				}
			: parseAddress(settings.senderAddress);
	if (!creditorAddr) {
		throw new QRBillError(
			'Absender-Adresse fehlt oder konnte nicht geparst werden. Trage Strasse, PLZ und Ort in den Einstellungen ein.',
			'unparseable-sender-address'
		);
	}

	const amount = invoice.totals.gross / CURRENCIES[invoice.currency].minorUnit;
	if (!Number.isFinite(amount) || amount <= 0) {
		throw new QRBillError('Rechnungsbetrag muss grösser als 0 sein.', 'missing-amount');
	}

	// Client side: same preference order — structured fields first, then
	// legacy free-text. Debtor is optional per spec; if neither path
	// produces a structured address, we still emit the QR-Bill without a
	// debtor so the user can fill it in when paying.
	const snap = invoice.clientSnapshot;
	const debtorAddr: StructuredAddress | null =
		snap.street && snap.zip && snap.city
			? {
					street: snap.street,
					zip: snap.zip,
					city: snap.city,
					country: snap.country || 'CH',
				}
			: parseAddress(snap.address);

	// Prefer the reference persisted on the invoice (set at create time) so
	// the reference is stable even if invoice.number is later edited. Fall
	// back to a fresh derivation for pre-M5 invoices that have null.
	const reference = invoice.referenceNumber ?? generateSCORReference(invoice.number);

	const data: Data = {
		currency: invoice.currency as 'CHF' | 'EUR',
		amount,
		reference,
		message: invoice.subject ?? undefined,
		creditor: {
			account: iban,
			name: settings.senderName,
			address: creditorAddr.street,
			zip: creditorAddr.zip,
			city: creditorAddr.city,
			country: creditorAddr.country,
		},
	};

	if (debtorAddr && invoice.clientSnapshot.name) {
		data.debtor = {
			name: invoice.clientSnapshot.name,
			address: debtorAddr.street,
			zip: debtorAddr.zip,
			city: debtorAddr.city,
			country: debtorAddr.country,
		};
	}

	return data;
}

// ─── SVG → PNG rasterisation ─────────────────────────────

/**
 * Rasterise the QR-Bill SVG to a PNG byte array via the browser's native
 * Image + Canvas path. Target ~300 DPI across 210×105mm so the QR code
 * stays crisp when scaled back down to the embedded size.
 *
 * QR-Bill modules need to stay at least 1mm per module — at 300 DPI
 * that's ~12 px per module, safely above any scanner threshold.
 */
async function rasteriseSvgToPng(svg: string): Promise<Uint8Array> {
	// Target canvas pixel size at 300 DPI (25.4mm per inch):
	//   210mm × (300/25.4) ≈ 2480 px
	//   105mm × (300/25.4) ≈ 1240 px
	const widthPx = 2480;
	const heightPx = 1240;

	const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
	const url = URL.createObjectURL(blob);
	try {
		const img = await loadImage(url);
		const canvas = document.createElement('canvas');
		canvas.width = widthPx;
		canvas.height = heightPx;
		const ctx = canvas.getContext('2d');
		if (!ctx) throw new Error('Canvas 2D-Kontext nicht verfügbar');
		// White background so the QR has the required contrast (spec requires
		// the Zahlteil to be printed on white).
		ctx.fillStyle = '#ffffff';
		ctx.fillRect(0, 0, widthPx, heightPx);
		ctx.drawImage(img, 0, 0, widthPx, heightPx);

		const pngBlob: Blob = await new Promise((resolve, reject) => {
			canvas.toBlob(
				(b) => (b ? resolve(b) : reject(new Error('toBlob() lieferte null'))),
				'image/png'
			);
		});
		const arrayBuf = await pngBlob.arrayBuffer();
		return new Uint8Array(arrayBuf);
	} finally {
		URL.revokeObjectURL(url);
	}
}

function loadImage(src: string): Promise<HTMLImageElement> {
	return new Promise((resolve, reject) => {
		const img = new Image();
		img.onload = () => resolve(img);
		img.onerror = () => reject(new Error('SVG konnte nicht in Bild geladen werden'));
		img.src = src;
	});
}

// ─── Public API ──────────────────────────────────────────

/**
 * Render the QR-Bill for `invoice + settings` into a PNG + metadata. Does
 * not touch pdf-lib — callers embed the PNG where they need it. Throws
 * `QRBillError` if the invoice isn't eligible.
 */
export async function renderQRBillPng(
	invoice: Invoice,
	settings: InvoiceSettings
): Promise<{ bytes: Uint8Array; widthPt: number; heightPt: number }> {
	const data = buildQRBillData(invoice, settings);
	const svg = new SwissQRBill(data).toString();
	const bytes = await rasteriseSvgToPng(svg);
	return {
		bytes,
		widthPt: A4.width, // 210mm
		heightPt: mm(105), // official QR-Bill height
	};
}

/**
 * Attach the QR-Bill to the given pdf-lib document — embeds the PNG at
 * the bottom of the LAST page, spanning the full page width × 105mm.
 *
 * Assumes the renderer reserved those bottom 105mm (BODY_MIN_Y guard in
 * templates/default.ts). If the invoice content overflowed and opened a
 * continuation page, that last page becomes the QR-Bill carrier.
 */
export async function attachQRBillToPdf(
	doc: PDFDocument,
	invoice: Invoice,
	settings: InvoiceSettings
): Promise<void> {
	const { bytes, widthPt, heightPt } = await renderQRBillPng(invoice, settings);
	const png = await doc.embedPng(bytes);
	const pages = doc.getPages();
	const lastPage = pages[pages.length - 1];
	lastPage.drawImage(png, {
		x: 0,
		y: 0,
		width: widthPt,
		height: heightPt,
	});
}
