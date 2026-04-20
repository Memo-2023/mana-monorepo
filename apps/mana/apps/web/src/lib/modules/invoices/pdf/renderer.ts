/**
 * PDF renderer — turns an invoice + sender settings into a PDF Uint8Array.
 *
 * Layout (top-down, single page for short invoices):
 *
 *   ┌─────────────────────────────────────────┐  ← MARGIN.top
 *   │ Sender block                Meta block  │
 *   │                                         │
 *   │ Rechnung an:                            │
 *   │ Client name + address                   │
 *   │                                         │
 *   │ RECHNUNG {number}                       │
 *   │ {subject}                               │
 *   │                                         │
 *   │ Position | Menge | Preis | MwSt | Total │
 *   │ ...                                     │
 *   │                                         │
 *   │                          Total: CHF x.y │
 *   │                                         │
 *   │ Notizen                                 │
 *   │ Zahlungsbedingungen                     │
 *   │                                         │
 *   │ ─────── (footer) ────────               │
 *   ├─────────────────────────────────────────┤  ← BODY_MIN_Y
 *   │ [reserved for QR-Bill — M5]             │
 *   └─────────────────────────────────────────┘
 *
 * Pagination kicks in only if the lines table overflows. Overflow pages
 * do not reserve QR space (only the page with the total does).
 *
 * Standard 14 PDF fonts only (Helvetica / Helvetica-Bold) — keeps the
 * output tiny (~7KB) and avoids shipping font bytes. Upgrade path: embed
 * Inter/Roboto via fetch in M7 when we care about brand typography.
 */

import { PDFDocument, StandardFonts, rgb, type PDFPage, type PDFFont } from 'pdf-lib';
import type { Invoice, InvoiceSettings } from '../types';
import { CURRENCIES } from '../constants';
import {
	A4,
	MARGIN,
	BODY_MIN_Y,
	FONT_SIZE,
	COLORS,
	LINE_COLS,
	SPACE,
	LINE_HEIGHT,
} from './templates/default';

// ─── Small geometry helpers ────────────────────────────────

type Color = { r: number; g: number; b: number };
const toRgb = (c: Color) => rgb(c.r, c.g, c.b);

interface RenderContext {
	doc: PDFDocument;
	page: PDFPage;
	regular: PDFFont;
	bold: PDFFont;
	/** Current Y cursor (drops as we render downward). */
	y: number;
	/** Right edge of the usable page area. */
	rightX: number;
	/** Left edge (same as MARGIN.left by default). */
	leftX: number;
	/** Content width (page - left - right). */
	contentWidth: number;
}

function newPage(ctx: RenderContext, withQrReserve: boolean): RenderContext {
	const page = ctx.doc.addPage([A4.width, A4.height]);
	return {
		...ctx,
		page,
		y: A4.height - MARGIN.top,
		// Footer / QR reserve only applies to the first page — continuation
		// pages can use the full body height.
		// (The caller passes `withQrReserve=false` for continuation pages.)
		...(withQrReserve ? {} : {}),
	};
}

function textWidth(font: PDFFont, text: string, size: number): number {
	return font.widthOfTextAtSize(text, size);
}

function drawText(
	ctx: RenderContext,
	text: string,
	x: number,
	y: number,
	opts: { size?: number; font?: PDFFont; color?: Color } = {}
): void {
	ctx.page.drawText(text, {
		x,
		y,
		size: opts.size ?? FONT_SIZE.body,
		font: opts.font ?? ctx.regular,
		color: toRgb(opts.color ?? COLORS.text),
	});
}

/**
 * Word-wrap for a given max width. Returns the list of lines (caller draws).
 * Tokenises on spaces + newlines; doesn't break mid-word (unusual for
 * invoice text, acceptable trade-off for the MVP).
 */
function wrapLines(font: PDFFont, text: string, size: number, maxWidth: number): string[] {
	const out: string[] = [];
	for (const paragraph of text.split('\n')) {
		const words = paragraph.split(/\s+/).filter(Boolean);
		if (words.length === 0) {
			out.push('');
			continue;
		}
		let current = '';
		for (const w of words) {
			const probe = current ? `${current} ${w}` : w;
			if (textWidth(font, probe, size) <= maxWidth) {
				current = probe;
			} else {
				if (current) out.push(current);
				current = w;
			}
		}
		if (current) out.push(current);
	}
	return out;
}

function drawRightAligned(
	ctx: RenderContext,
	text: string,
	rightX: number,
	y: number,
	opts: { size?: number; font?: PDFFont; color?: Color } = {}
): void {
	const size = opts.size ?? FONT_SIZE.body;
	const font = opts.font ?? ctx.regular;
	const w = textWidth(font, text, size);
	drawText(ctx, text, rightX - w, y, opts);
}

/**
 * Draw horizontally-wrapped multi-line text starting at (x, y), dropping y
 * as it goes. Returns the new y (below the block).
 */
function drawBlock(
	ctx: RenderContext,
	text: string,
	x: number,
	y: number,
	opts: {
		size?: number;
		font?: PDFFont;
		color?: Color;
		maxWidth: number;
		lineHeight?: number;
	}
): number {
	const size = opts.size ?? FONT_SIZE.body;
	const font = opts.font ?? ctx.regular;
	const lh = size * (opts.lineHeight ?? LINE_HEIGHT.normal);
	const lines = wrapLines(font, text, size, opts.maxWidth);
	let cursor = y;
	for (const line of lines) {
		drawText(ctx, line, x, cursor, { size, font, color: opts.color });
		cursor -= lh;
	}
	return cursor;
}

function formatAmount(minor: number, currency: keyof typeof CURRENCIES): string {
	const { symbol, minorUnit } = CURRENCIES[currency];
	return `${symbol} ${(minor / minorUnit).toFixed(2)}`;
}

// ─── Section renderers ────────────────────────────────────

function renderHeader(ctx: RenderContext, invoice: Invoice, settings: InvoiceSettings): number {
	// Left: sender
	let leftY = ctx.y;
	drawText(ctx, settings.senderName || '—', ctx.leftX, leftY, {
		size: FONT_SIZE.brand,
		font: ctx.bold,
	});
	leftY -= FONT_SIZE.brand * LINE_HEIGHT.tight;

	const senderBody = [settings.senderAddress, settings.senderEmail, settings.senderIban]
		.filter(Boolean)
		.join('\n');
	leftY = drawBlock(ctx, senderBody, ctx.leftX, leftY, {
		size: FONT_SIZE.small,
		color: COLORS.muted,
		maxWidth: ctx.contentWidth * 0.55,
		lineHeight: LINE_HEIGHT.normal,
	});

	// Right: invoice meta (number, issue date, due date)
	let rightY = ctx.y;
	drawRightAligned(ctx, 'RECHNUNG', ctx.rightX, rightY, {
		size: FONT_SIZE.small,
		font: ctx.bold,
		color: COLORS.muted,
	});
	rightY -= FONT_SIZE.small * LINE_HEIGHT.tight;
	drawRightAligned(ctx, invoice.number, ctx.rightX, rightY, {
		size: FONT_SIZE.brand,
		font: ctx.bold,
	});
	rightY -= FONT_SIZE.brand * LINE_HEIGHT.tight + SPACE.sm;

	const metaRows: [string, string][] = [
		['Datum', invoice.issueDate],
		['Fällig am', invoice.dueDate],
	];
	if (settings.senderVatNumber) metaRows.push(['MwSt-Nr.', settings.senderVatNumber]);

	for (const [label, value] of metaRows) {
		drawRightAligned(ctx, `${label}: ${value}`, ctx.rightX, rightY, {
			size: FONT_SIZE.small,
			color: COLORS.muted,
		});
		rightY -= FONT_SIZE.small * LINE_HEIGHT.normal;
	}

	// Return the lower of the two Ys so the next section clears both columns.
	return Math.min(leftY, rightY) - SPACE.lg;
}

function renderRecipient(ctx: RenderContext, invoice: Invoice, y: number): number {
	drawText(ctx, 'Rechnung an', ctx.leftX, y, {
		size: FONT_SIZE.small,
		font: ctx.bold,
		color: COLORS.muted,
	});
	y -= FONT_SIZE.small * LINE_HEIGHT.normal;

	drawText(ctx, invoice.clientSnapshot.name, ctx.leftX, y, {
		size: FONT_SIZE.body,
		font: ctx.bold,
	});
	y -= FONT_SIZE.body * LINE_HEIGHT.tight;

	if (invoice.clientSnapshot.address) {
		y = drawBlock(ctx, invoice.clientSnapshot.address, ctx.leftX, y, {
			maxWidth: ctx.contentWidth * 0.55,
		});
	}
	if (invoice.clientSnapshot.vatNumber) {
		drawText(ctx, `MwSt-Nr.: ${invoice.clientSnapshot.vatNumber}`, ctx.leftX, y, {
			size: FONT_SIZE.small,
			color: COLORS.muted,
		});
		y -= FONT_SIZE.small * LINE_HEIGHT.normal;
	}
	return y - SPACE.lg;
}

function renderSubject(ctx: RenderContext, invoice: Invoice, y: number): number {
	if (!invoice.subject) return y;
	drawText(ctx, invoice.subject, ctx.leftX, y, {
		size: FONT_SIZE.h1,
		font: ctx.bold,
	});
	return y - FONT_SIZE.h1 * LINE_HEIGHT.normal - SPACE.md;
}

/**
 * Draws the invoice lines table. If it overflows, opens a continuation page
 * and keeps going. Returns { ctx, y } — the ctx may have swapped pages so
 * later sections must use the returned one.
 */
function renderLinesTable(ctx: RenderContext, invoice: Invoice): { ctx: RenderContext; y: number } {
	let cur = ctx;
	let y = cur.y;
	const cw = cur.contentWidth;

	const colX = {
		title: cur.leftX,
		qty: cur.leftX + cw * LINE_COLS.title,
		unit: cur.leftX + cw * (LINE_COLS.title + LINE_COLS.qty),
		unitPrice: cur.leftX + cw * (LINE_COLS.title + LINE_COLS.qty + LINE_COLS.unit),
		vat: cur.leftX + cw * (LINE_COLS.title + LINE_COLS.qty + LINE_COLS.unit + LINE_COLS.unitPrice),
		total:
			cur.leftX +
			cw * (LINE_COLS.title + LINE_COLS.qty + LINE_COLS.unit + LINE_COLS.unitPrice + LINE_COLS.vat),
	};
	const rightEdge = cur.rightX;

	const drawHeaderRow = () => {
		drawText(cur, 'Position', colX.title, y, {
			size: FONT_SIZE.tableHeader,
			font: cur.bold,
			color: COLORS.muted,
		});
		drawText(cur, 'Menge', colX.qty, y, {
			size: FONT_SIZE.tableHeader,
			font: cur.bold,
			color: COLORS.muted,
		});
		drawText(cur, 'Einheit', colX.unit, y, {
			size: FONT_SIZE.tableHeader,
			font: cur.bold,
			color: COLORS.muted,
		});
		drawRightAligned(cur, 'Einzelpreis', colX.vat - SPACE.sm, y, {
			size: FONT_SIZE.tableHeader,
			font: cur.bold,
			color: COLORS.muted,
		});
		drawText(cur, 'MwSt.', colX.vat, y, {
			size: FONT_SIZE.tableHeader,
			font: cur.bold,
			color: COLORS.muted,
		});
		drawRightAligned(cur, 'Total', rightEdge, y, {
			size: FONT_SIZE.tableHeader,
			font: cur.bold,
			color: COLORS.muted,
		});
		y -= FONT_SIZE.tableHeader * LINE_HEIGHT.normal;
		cur.page.drawLine({
			start: { x: cur.leftX, y: y + SPACE.xs },
			end: { x: rightEdge, y: y + SPACE.xs },
			thickness: 0.5,
			color: toRgb(COLORS.border),
		});
		y -= SPACE.sm;
	};

	drawHeaderRow();

	for (const line of invoice.lines) {
		// Wrap the title so long descriptions don't run into the qty column.
		const titleMax = cw * LINE_COLS.title - SPACE.sm;
		const titleLines = wrapLines(cur.regular, line.title || '—', FONT_SIZE.tableCell, titleMax);
		const descriptionLines = line.description
			? wrapLines(cur.regular, line.description, FONT_SIZE.small, titleMax)
			: [];

		const rowHeight =
			Math.max(
				titleLines.length * FONT_SIZE.tableCell * LINE_HEIGHT.tight +
					descriptionLines.length * FONT_SIZE.small * LINE_HEIGHT.tight,
				FONT_SIZE.tableCell * LINE_HEIGHT.normal
			) + SPACE.sm;

		// Paginate: if this row would cross into the reserved footer, open
		// a new page and redraw the header there.
		if (y - rowHeight < BODY_MIN_Y) {
			cur = newPage(cur, false);
			y = cur.y;
			drawHeaderRow();
		}

		// Title + optional description, wrapped
		let titleY = y;
		for (const tl of titleLines) {
			drawText(cur, tl, colX.title, titleY, { size: FONT_SIZE.tableCell });
			titleY -= FONT_SIZE.tableCell * LINE_HEIGHT.tight;
		}
		for (const dl of descriptionLines) {
			drawText(cur, dl, colX.title, titleY, {
				size: FONT_SIZE.small,
				color: COLORS.muted,
			});
			titleY -= FONT_SIZE.small * LINE_HEIGHT.tight;
		}

		// Single-line fields (qty / unit / price / vat / total)
		const qtyText = String(line.quantity);
		drawText(cur, qtyText, colX.qty, y, { size: FONT_SIZE.tableCell });
		if (line.unit) {
			drawText(cur, line.unit, colX.unit, y, {
				size: FONT_SIZE.tableCell,
				color: COLORS.muted,
			});
		}
		drawRightAligned(cur, formatAmount(line.unitPrice, invoice.currency), colX.vat - SPACE.sm, y, {
			size: FONT_SIZE.tableCell,
		});
		drawText(cur, `${line.vatRate}%`, colX.vat, y, {
			size: FONT_SIZE.tableCell,
			color: COLORS.muted,
		});
		const rowTotal = line.quantity * line.unitPrice * (1 - (line.discount ?? 0) / 100);
		drawRightAligned(cur, formatAmount(rowTotal, invoice.currency), rightEdge, y, {
			size: FONT_SIZE.tableCell,
		});

		y -= rowHeight;
	}

	// Separator before totals
	cur.page.drawLine({
		start: { x: cur.leftX, y },
		end: { x: rightEdge, y },
		thickness: 0.5,
		color: toRgb(COLORS.border),
	});
	return { ctx: cur, y: y - SPACE.md };
}

function renderTotals(ctx: RenderContext, invoice: Invoice, y: number): number {
	const labelX = ctx.rightX - 180;
	const rows: [string, string, boolean][] = [];

	rows.push(['Netto', formatAmount(invoice.totals.net, invoice.currency), false]);
	for (const b of invoice.totals.vatBreakdown) {
		rows.push([`MwSt. ${b.rate}%`, formatAmount(b.tax, invoice.currency), false]);
	}
	rows.push(['Total', formatAmount(invoice.totals.gross, invoice.currency), true]);

	for (const [label, value, gross] of rows) {
		const size = gross ? FONT_SIZE.h2 : FONT_SIZE.body;
		const font = gross ? ctx.bold : ctx.regular;
		drawText(ctx, label, labelX, y, { size, font });
		drawRightAligned(ctx, value, ctx.rightX, y, { size, font });
		y -= size * LINE_HEIGHT.normal;
		if (gross) break;
	}

	// Underline the gross row
	ctx.page.drawLine({
		start: { x: labelX, y: y + SPACE.xs },
		end: { x: ctx.rightX, y: y + SPACE.xs },
		thickness: 1,
		color: toRgb(COLORS.accent),
	});
	return y - SPACE.lg;
}

function renderNotesAndTerms(ctx: RenderContext, invoice: Invoice, y: number): number {
	if (invoice.notes) {
		drawText(ctx, 'Notizen', ctx.leftX, y, {
			size: FONT_SIZE.small,
			font: ctx.bold,
			color: COLORS.muted,
		});
		y -= FONT_SIZE.small * LINE_HEIGHT.normal;
		y = drawBlock(ctx, invoice.notes, ctx.leftX, y, {
			size: FONT_SIZE.body,
			maxWidth: ctx.contentWidth,
		});
		y -= SPACE.md;
	}
	if (invoice.terms) {
		drawText(ctx, 'Zahlungsbedingungen', ctx.leftX, y, {
			size: FONT_SIZE.small,
			font: ctx.bold,
			color: COLORS.muted,
		});
		y -= FONT_SIZE.small * LINE_HEIGHT.normal;
		y = drawBlock(ctx, invoice.terms, ctx.leftX, y, {
			size: FONT_SIZE.body,
			maxWidth: ctx.contentWidth,
		});
	}
	return y;
}

function renderFooter(ctx: RenderContext, settings: InvoiceSettings): void {
	if (!settings.footer) return;
	const y = MARGIN.bottom + ctx.contentWidth * 0; // just above the margin
	drawBlock(ctx, settings.footer, ctx.leftX, MARGIN.bottom + FONT_SIZE.small * 2.5, {
		size: FONT_SIZE.small,
		color: COLORS.muted,
		maxWidth: ctx.contentWidth,
	});
	// Hairline rule above footer
	ctx.page.drawLine({
		start: { x: ctx.leftX, y: MARGIN.bottom + FONT_SIZE.small * 3 },
		end: { x: ctx.rightX, y: MARGIN.bottom + FONT_SIZE.small * 3 },
		thickness: 0.25,
		color: toRgb(COLORS.border),
	});
	void y;
}

// ─── Public API ───────────────────────────────────────────

/**
 * Render an invoice to PDF bytes. Call-site is responsible for wrapping the
 * output into a Blob, iframe URL, or File attachment.
 */
export async function renderInvoicePdf(
	invoice: Invoice,
	settings: InvoiceSettings
): Promise<Uint8Array> {
	const doc = await PDFDocument.create();
	doc.setTitle(`Rechnung ${invoice.number}`);
	doc.setAuthor(settings.senderName || 'Mana');
	doc.setCreator('Mana — Rechnungen');
	doc.setProducer('pdf-lib');
	doc.setCreationDate(new Date());

	const [regular, bold] = await Promise.all([
		doc.embedFont(StandardFonts.Helvetica),
		doc.embedFont(StandardFonts.HelveticaBold),
	]);

	const page = doc.addPage([A4.width, A4.height]);
	const leftX = MARGIN.left;
	const rightX = A4.width - MARGIN.right;

	let ctx: RenderContext = {
		doc,
		page,
		regular,
		bold,
		y: A4.height - MARGIN.top,
		leftX,
		rightX,
		contentWidth: rightX - leftX,
	};

	ctx.y = renderHeader(ctx, invoice, settings);
	ctx.y = renderRecipient(ctx, invoice, ctx.y);
	ctx.y = renderSubject(ctx, invoice, ctx.y);
	const linesResult = renderLinesTable(ctx, invoice);
	ctx = linesResult.ctx;
	ctx.y = linesResult.y;
	ctx.y = renderTotals(ctx, invoice, ctx.y);
	ctx.y = renderNotesAndTerms(ctx, invoice, ctx.y);

	// Footer only draws on the *first* page — it contains the sender's
	// legal line and a separator. Later we'll add page numbers for the
	// multi-page case.
	const firstPage = doc.getPage(0);
	const firstCtx: RenderContext = { ...ctx, page: firstPage };
	renderFooter(firstCtx, settings);

	return await doc.save();
}

/**
 * Convenience: render + wrap into a Blob, ready for object URL / download /
 * email attachment. The MIME type is `application/pdf`.
 */
export async function renderInvoicePdfBlob(
	invoice: Invoice,
	settings: InvoiceSettings
): Promise<Blob> {
	const bytes = await renderInvoicePdf(invoice, settings);
	// `.slice(0)` copies into a fresh ArrayBuffer-backed Uint8Array so the
	// Blob constructor types match (SharedArrayBuffer is not a BlobPart).
	return new Blob([bytes.slice(0) as BlobPart], { type: 'application/pdf' });
}
