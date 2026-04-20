<!--
  DetailView — read-only display of an invoice with action bar.
  M4 adds PDF preview on the right; M6 adds the send flow.
-->
<script lang="ts">
	import { goto } from '$app/navigation';
	import StatusBadge from '../components/StatusBadge.svelte';
	import SendModal from '../components/SendModal.svelte';
	import { invoicesStore } from '../stores/invoices.svelte';
	import { invoiceSettingsStore } from '../stores/settings.svelte';
	import { renderInvoicePdfBlob, qrBillStatus } from '../pdf/renderer';
	import { formatAmount } from '../queries';
	import type { Invoice, InvoiceSettings } from '../types';
	import { STATUS_LABELS } from '../constants';

	interface Props {
		invoice: Invoice;
	}

	let { invoice }: Props = $props();

	let actionError = $state<string | null>(null);
	let busy = $state(false);

	// ─── PDF preview ─────────────────────────────────────────
	// Render lazily on mount, whenever the invoice content changes, or after
	// a mutation (status transitions don't re-render the PDF body but do
	// change the output — e.g. paid watermark in M4+). Revoke the previous
	// blob URL before creating a new one so we don't leak memory.
	let pdfUrl = $state<string | null>(null);
	let pdfError = $state<string | null>(null);
	let renderingPdf = $state(false);
	let qrWarning = $state<string | null>(null);
	let showSendModal = $state(false);
	let settingsCache = $state<InvoiceSettings | null>(null);

	async function renderPdf() {
		renderingPdf = true;
		pdfError = null;
		try {
			const settings: InvoiceSettings = await invoiceSettingsStore.get();
			settingsCache = settings;
			// Compute QR-Bill eligibility first so we can show a warning even
			// if the rest of the PDF renders fine. The renderer will silently
			// omit the Zahlteil when not eligible.
			const status = qrBillStatus(invoice, settings);
			qrWarning = status.ok ? null : status.message;
			const blob = await renderInvoicePdfBlob(invoice, settings);
			if (pdfUrl) URL.revokeObjectURL(pdfUrl);
			pdfUrl = URL.createObjectURL(blob);
		} catch (e) {
			pdfError = e instanceof Error ? e.message : 'PDF-Rendering fehlgeschlagen';
		} finally {
			renderingPdf = false;
		}
	}

	async function openSendModal() {
		// Ensure settings are loaded before showing the modal — the send
		// flow needs them for the template + the PDF re-render.
		if (!settingsCache) settingsCache = await invoiceSettingsStore.get();
		showSendModal = true;
	}

	// Re-render when invoice id or updatedAt changes (mutations bump updatedAt).
	$effect(() => {
		void invoice.id;
		void invoice.updatedAt;
		renderPdf();
	});

	// Blob URLs leak memory until revoked. Clean up on unmount.
	$effect(() => {
		return () => {
			if (pdfUrl) URL.revokeObjectURL(pdfUrl);
		};
	});

	async function downloadPdf() {
		try {
			const settings: InvoiceSettings = await invoiceSettingsStore.get();
			const blob = await renderInvoicePdfBlob(invoice, settings);
			const url = URL.createObjectURL(blob);
			const a = document.createElement('a');
			a.href = url;
			a.download = `Rechnung-${invoice.number}.pdf`;
			document.body.appendChild(a);
			a.click();
			a.remove();
			// Revoke after the browser has started the download.
			setTimeout(() => URL.revokeObjectURL(url), 1000);
		} catch (e) {
			pdfError = e instanceof Error ? e.message : 'Download fehlgeschlagen';
		}
	}

	async function run(label: string, fn: () => Promise<void>) {
		actionError = null;
		busy = true;
		try {
			await fn();
		} catch (e) {
			actionError = e instanceof Error ? e.message : `${label} fehlgeschlagen`;
		} finally {
			busy = false;
		}
	}

	async function onMarkSent() {
		await run('Als versendet markieren', () => invoicesStore.markSent(invoice.id));
	}

	async function onMarkPaid() {
		await run('Als bezahlt markieren', () => invoicesStore.markPaid(invoice.id));
	}

	async function onVoid() {
		if (!confirm('Diese Rechnung stornieren?')) return;
		await run('Stornieren', () => invoicesStore.voidInvoice(invoice.id));
	}

	async function onDuplicate() {
		await run('Duplizieren', async () => {
			const newId = await invoicesStore.duplicate(invoice.id);
			goto(`/invoices/${newId}`);
		});
	}

	async function onDelete() {
		if (!confirm('Rechnung endgültig löschen?')) return;
		await run('Löschen', async () => {
			await invoicesStore.deleteInvoice(invoice.id);
			goto('/invoices');
		});
	}

	function onEdit() {
		goto(`/invoices/${invoice.id}/edit`);
	}
</script>

<article class="detail">
	<header class="head">
		<div class="head-left">
			<div class="number">{invoice.number}</div>
			<h1>{invoice.subject || 'Rechnung'}</h1>
			<StatusBadge status={invoice.status} />
		</div>
		<div class="head-right">
			<div class="amount">{formatAmount(invoice.totals.gross, invoice.currency)}</div>
			<div class="due">
				Fällig {invoice.dueDate}
			</div>
		</div>
	</header>

	<div class="actions">
		{#if invoice.status === 'draft'}
			<button class="btn" onclick={onEdit}>Bearbeiten</button>
			<button class="btn btn-primary" onclick={openSendModal}>Per Mail versenden</button>
			<button class="btn" onclick={onMarkSent} disabled={busy}>Als versendet markieren</button>
		{/if}
		{#if invoice.status === 'sent' || invoice.status === 'overdue'}
			<button class="btn btn-primary" onclick={onMarkPaid} disabled={busy}>
				Als bezahlt markieren
			</button>
		{/if}
		<button class="btn" onclick={downloadPdf}>PDF herunterladen</button>
		<button class="btn" onclick={onDuplicate} disabled={busy}>Duplizieren</button>
		{#if invoice.status !== 'paid' && invoice.status !== 'void'}
			<button class="btn btn-danger" onclick={onVoid} disabled={busy}> Stornieren </button>
		{/if}
		{#if invoice.status === 'draft' || invoice.status === 'void'}
			<button class="btn btn-danger" onclick={onDelete} disabled={busy}> Löschen </button>
		{/if}
	</div>

	{#if actionError}
		<div class="error">{actionError}</div>
	{/if}

	<section class="block pdf-preview-block">
		<div class="preview-head">
			<h3>Vorschau</h3>
			{#if renderingPdf}
				<span class="preview-status">Rendert …</span>
			{/if}
		</div>
		{#if qrWarning}
			<div class="warning">
				<strong>QR-Rechnung nicht eingefügt:</strong>
				{qrWarning}
				<a href="/invoices/settings">Einstellungen öffnen →</a>
			</div>
		{/if}
		{#if pdfError}
			<div class="error">PDF-Fehler: {pdfError}</div>
		{:else if pdfUrl}
			<iframe
				class="pdf-frame"
				src={pdfUrl}
				title="Vorschau Rechnung {invoice.number}"
				loading="lazy"
			></iframe>
		{/if}
	</section>

	<details class="raw-details">
		<summary>Strukturierte Daten anzeigen</summary>

		<section class="block">
			<h3>Empfänger</h3>
			<div class="client">
				<div class="client-name">{invoice.clientSnapshot.name}</div>
				{#if invoice.clientSnapshot.address}
					<pre class="client-address">{invoice.clientSnapshot.address}</pre>
				{/if}
				{#if invoice.clientSnapshot.email}
					<div class="client-meta">{invoice.clientSnapshot.email}</div>
				{/if}
				{#if invoice.clientSnapshot.vatNumber}
					<div class="client-meta">MwSt-Nr.: {invoice.clientSnapshot.vatNumber}</div>
				{/if}
			</div>
		</section>

		<section class="block">
			<h3>Positionen</h3>
			<table class="lines">
				<thead>
					<tr>
						<th>Position</th>
						<th>Menge</th>
						<th>Einzelpreis</th>
						<th>MwSt.</th>
						<th class="right">Netto</th>
					</tr>
				</thead>
				<tbody>
					{#each invoice.lines as line (line.id)}
						<tr>
							<td>
								<div>{line.title}</div>
								{#if line.description}<div class="muted">{line.description}</div>{/if}
							</td>
							<td>{line.quantity}{line.unit ? ` ${line.unit}` : ''}</td>
							<td>{formatAmount(line.unitPrice, invoice.currency)}</td>
							<td>{line.vatRate}%</td>
							<td class="right">
								{formatAmount(line.quantity * line.unitPrice, invoice.currency)}
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</section>

		<section class="block totals-block">
			<h3>Summe</h3>
			<dl class="totals">
				<dt>Netto</dt>
				<dd>{formatAmount(invoice.totals.net, invoice.currency)}</dd>
				{#each invoice.totals.vatBreakdown as b (b.rate)}
					<dt>MwSt. {b.rate}%</dt>
					<dd>{formatAmount(b.tax, invoice.currency)}</dd>
				{/each}
				<dt class="gross">Total</dt>
				<dd class="gross">{formatAmount(invoice.totals.gross, invoice.currency)}</dd>
			</dl>
		</section>

		{#if invoice.notes}
			<section class="block">
				<h3>Notizen</h3>
				<p class="prose">{invoice.notes}</p>
			</section>
		{/if}

		{#if invoice.terms}
			<section class="block">
				<h3>Zahlungsbedingungen</h3>
				<p class="prose">{invoice.terms}</p>
			</section>
		{/if}
	</details>

	<footer class="meta">
		<div>Status: {STATUS_LABELS[invoice.status].de}</div>
		{#if invoice.sentAt}<div>Versendet: {new Date(invoice.sentAt).toLocaleString()}</div>{/if}
		{#if invoice.paidAt}<div>Bezahlt: {new Date(invoice.paidAt).toLocaleString()}</div>{/if}
	</footer>
</article>

{#if showSendModal && settingsCache}
	<SendModal {invoice} settings={settingsCache} onClose={() => (showSendModal = false)} />
{/if}

<style>
	.detail {
		max-width: 800px;
		margin: 0 auto;
		padding: 1.5rem;
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}

	.head {
		display: flex;
		justify-content: space-between;
		align-items: flex-end;
		gap: 1rem;
		flex-wrap: wrap;
	}

	.head-left,
	.head-right {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.head-right {
		align-items: flex-end;
	}

	.number {
		font-variant-numeric: tabular-nums;
		color: var(--color-text-muted, #64748b);
		font-size: 0.9rem;
	}

	h1 {
		margin: 0;
		font-size: 1.5rem;
		font-weight: 600;
	}

	.amount {
		font-size: 1.75rem;
		font-weight: 600;
		font-variant-numeric: tabular-nums;
	}

	.due {
		font-size: 0.85rem;
		color: var(--color-text-muted, #64748b);
	}

	.actions {
		display: flex;
		gap: 0.5rem;
		flex-wrap: wrap;
	}

	.btn {
		padding: 0.5rem 1rem;
		background: white;
		border: 1px solid var(--color-border, #e2e8f0);
		border-radius: 0.4rem;
		cursor: pointer;
		font-size: 0.9rem;
	}

	.btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.btn-primary {
		background: #059669;
		color: white;
		border-color: #059669;
	}

	.btn-danger {
		color: #b91c1c;
		border-color: #fecaca;
	}

	.pdf-preview-block {
		gap: 0.5rem;
	}

	.warning {
		background: #fffbeb;
		border: 1px solid #fde68a;
		color: #92400e;
		padding: 0.65rem 0.9rem;
		border-radius: 0.4rem;
		font-size: 0.85rem;
		display: flex;
		gap: 0.5rem;
		flex-wrap: wrap;
		align-items: center;
	}

	.warning a {
		color: #92400e;
		font-weight: 500;
		text-decoration: underline;
	}

	.preview-head {
		display: flex;
		justify-content: space-between;
		align-items: baseline;
	}

	.preview-status {
		font-size: 0.8rem;
		color: var(--color-text-muted, #64748b);
	}

	.pdf-frame {
		width: 100%;
		height: 860px;
		border: 1px solid var(--color-border, #e2e8f0);
		border-radius: 0.4rem;
		background: var(--color-surface-muted, #f8fafc);
	}

	.raw-details {
		border: 1px solid var(--color-border, #e2e8f0);
		border-radius: 0.5rem;
		padding: 0.75rem 1rem;
	}

	.raw-details summary {
		cursor: pointer;
		font-size: 0.85rem;
		color: var(--color-text-muted, #64748b);
		user-select: none;
	}

	.raw-details[open] summary {
		margin-bottom: 1rem;
		padding-bottom: 0.5rem;
		border-bottom: 1px solid var(--color-border, #e2e8f0);
	}

	.error {
		background: #fef2f2;
		border: 1px solid #fecaca;
		color: #991b1b;
		padding: 0.75rem 1rem;
		border-radius: 0.4rem;
		font-size: 0.9rem;
	}

	.block {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	h3 {
		margin: 0;
		font-size: 0.95rem;
		font-weight: 600;
		color: var(--color-text-muted, #64748b);
		text-transform: uppercase;
		letter-spacing: 0.02em;
	}

	.client {
		padding: 0.75rem 1rem;
		background: var(--color-surface-muted, #f8fafc);
		border-radius: 0.4rem;
	}

	.client-name {
		font-weight: 500;
	}

	.client-address {
		margin: 0.25rem 0;
		font-family: inherit;
		white-space: pre-wrap;
		font-size: 0.9rem;
	}

	.client-meta {
		font-size: 0.85rem;
		color: var(--color-text-muted, #64748b);
	}

	.lines {
		width: 100%;
		border-collapse: collapse;
		font-size: 0.9rem;
	}

	.lines th,
	.lines td {
		padding: 0.5rem 0.5rem;
		border-bottom: 1px solid var(--color-border, #e2e8f0);
		text-align: left;
	}

	.lines th {
		font-weight: 500;
		color: var(--color-text-muted, #64748b);
		font-size: 0.8rem;
	}

	.lines .right {
		text-align: right;
		font-variant-numeric: tabular-nums;
	}

	.lines .muted {
		font-size: 0.8rem;
		color: var(--color-text-muted, #64748b);
	}

	.totals-block {
		align-items: flex-end;
	}

	.totals {
		display: grid;
		grid-template-columns: auto auto;
		gap: 0.25rem 2rem;
		margin: 0;
		font-variant-numeric: tabular-nums;
	}

	.totals dt,
	.totals dd {
		margin: 0;
	}

	.totals dd {
		text-align: right;
	}

	.totals .gross {
		margin-top: 0.5rem;
		padding-top: 0.5rem;
		border-top: 1px solid var(--color-border, #e2e8f0);
		font-weight: 600;
		font-size: 1.05rem;
	}

	.prose {
		white-space: pre-wrap;
		margin: 0;
		line-height: 1.5;
	}

	.meta {
		display: flex;
		gap: 1.5rem;
		font-size: 0.8rem;
		color: var(--color-text-muted, #64748b);
		border-top: 1px solid var(--color-border, #e2e8f0);
		padding-top: 1rem;
	}
</style>
