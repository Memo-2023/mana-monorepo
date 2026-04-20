/**
 * Default PDF layout constants — A4, margins chosen so a Swiss QR-Bill
 * (M5) will fit in the bottom ~105mm without further layout changes.
 *
 * pdf-lib coordinates: origin is BOTTOM-LEFT, Y increases upward. All
 * "top-of-page" anchors therefore compute `pageHeight - offset`.
 * Units are PDF points (1pt = 1/72 inch ≈ 0.353mm).
 */

// ─── Page & units ─────────────────────────────────────────

/** A4 in points (210 × 297 mm). */
export const A4 = { width: 595.28, height: 841.89 } as const;

export const MM_TO_PT = 72 / 25.4;

export function mm(millimetres: number): number {
	return millimetres * MM_TO_PT;
}

// ─── Margins ─────────────────────────────────────────────

export const MARGIN = {
	top: mm(20),
	right: mm(20),
	bottom: mm(20),
	left: mm(20),
} as const;

/**
 * Reserved vertical space at the bottom of the invoice page for the QR-Bill
 * (M5). Covers the whole Zahlteil + Empfangsschein strip including the
 * perforation indicator. The renderer must never draw into this region.
 * If the invoice body overflows, it paginates to a continuation page.
 */
export const QR_BILL_RESERVED = mm(105);

/** Minimum Y below which the first-page body must not descend. */
export const BODY_MIN_Y = MARGIN.bottom + QR_BILL_RESERVED;

// ─── Typography ───────────────────────────────────────────

export const FONT_SIZE = {
	brand: 14,
	h1: 18,
	h2: 11,
	body: 10,
	small: 8.5,
	tableHeader: 9,
	tableCell: 9.5,
} as const;

export const LINE_HEIGHT = {
	tight: 1.25,
	normal: 1.4,
	loose: 1.6,
} as const;

// ─── Colors (RGB 0..1 for pdf-lib) ────────────────────────

export const COLORS = {
	text: { r: 0.06, g: 0.09, b: 0.16 }, // slate-900
	muted: { r: 0.39, g: 0.45, b: 0.55 }, // slate-500
	border: { r: 0.89, g: 0.91, b: 0.94 }, // slate-200
	accent: { r: 0.02, g: 0.59, b: 0.41 }, // emerald-600 — matches app icon
	danger: { r: 0.73, g: 0.11, b: 0.11 },
	surfaceMuted: { r: 0.97, g: 0.98, b: 0.99 }, // slate-50
} as const;

// ─── Lines table geometry ─────────────────────────────────
// Column widths are fractions of the content width; sum must equal 1.

export const LINE_COLS = {
	title: 0.46,
	qty: 0.09,
	unit: 0.08,
	unitPrice: 0.14,
	vat: 0.08,
	total: 0.15,
} as const;

// ─── Spacing scale ────────────────────────────────────────

export const SPACE = {
	xs: mm(1),
	sm: mm(2),
	md: mm(4),
	lg: mm(8),
	xl: mm(12),
} as const;
