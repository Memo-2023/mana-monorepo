<!--
  SendModal — two-step send flow.

  1. User reviews/edits prefilled To / Subject / Body.
  2. Clicks "Öffnen & herunterladen":
     - PDF downloads immediately
     - mailto: link opens in user's default mail client
     - Modal switches to "sent-pending" state
  3. User returns to Mana after sending, clicks "Rechnung wurde versendet"
     → invoice status transitions draft → sent.

  Why two steps: the OS mail flow is async and opaque — we can't tell
  when the user hits "send" in their mail client. An explicit
  confirmation keeps the status transition honest, matches how the user
  actually experienced the act of sending, and lets them bail if the
  mail client crashed or they changed their mind.
-->
<script lang="ts">
	import { untrack } from 'svelte';
	import type { Invoice, InvoiceSettings } from '../types';
	import { buildInvoiceMailDraft, mailDraftToMailto, looksLikeEmail } from '../mail-template';
	import { invoicesStore } from '../stores/invoices.svelte';

	interface Props {
		invoice: Invoice;
		settings: InvoiceSettings;
		onClose: () => void;
		onSent?: () => void;
	}

	let { invoice, settings, onClose, onSent }: Props = $props();

	// Capture mail draft once at mount — re-opening the modal would remount
	// the component anyway, so we don't need reactivity on the props here.
	const initialDraft = untrack(() => buildInvoiceMailDraft(invoice, settings));

	let to = $state(initialDraft.to);
	let subject = $state(initialDraft.subject);
	let body = $state(initialDraft.body);
	let phase = $state<'compose' | 'handed-off' | 'marking-sent'>('compose');
	let error = $state<string | null>(null);

	const hasRecipient = $derived(looksLikeEmail(to));

	async function openAndDownload() {
		error = null;
		try {
			// 1. Download the PDF so the user can attach it. We don't wait for
			//    them to confirm download — the browser's download toast is
			//    visible in parallel with the mail compose window.
			// Dynamic import keeps pdf-lib + swissqrbill out of the route bundle;
			// by the time SendModal is mounted the user has already accepted a
			// small lazy-load delay on the parent DetailView.
			const { renderInvoicePdfBlob } = await import('../pdf/renderer');
			const blob = await renderInvoicePdfBlob(invoice, settings);
			const pdfUrl = URL.createObjectURL(blob);
			const a = document.createElement('a');
			a.href = pdfUrl;
			a.download = `Rechnung-${invoice.number}.pdf`;
			document.body.appendChild(a);
			a.click();
			a.remove();
			setTimeout(() => URL.revokeObjectURL(pdfUrl), 1000);

			// 2. Open the user's mail client. Using window.location (not
			//    window.open) is more reliable across browsers for mailto:
			//    — popup blockers tend to drop window.open(mailto) but let
			//    location navigations through.
			const url = mailDraftToMailto({ to, subject, body });
			window.location.href = url;

			phase = 'handed-off';
		} catch (e) {
			error = e instanceof Error ? e.message : 'Öffnen fehlgeschlagen';
		}
	}

	async function markSent() {
		phase = 'marking-sent';
		error = null;
		try {
			await invoicesStore.markSent(invoice.id);
			onSent?.();
			onClose();
		} catch (e) {
			phase = 'handed-off';
			error = e instanceof Error ? e.message : 'Markieren fehlgeschlagen';
		}
	}

	function onBackdropClick(e: MouseEvent) {
		if (e.target === e.currentTarget) onClose();
	}

	function onKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') onClose();
	}
</script>

<svelte:window onkeydown={onKeydown} />

<!-- Backdrop is presentational (click → close), not the dialog itself.
     The modal below carries the role + aria-* + focusable tabindex. -->
<div class="backdrop" onclick={onBackdropClick} role="presentation">
	<div class="modal" role="dialog" aria-modal="true" aria-labelledby="send-title" tabindex="-1">
		<header class="head">
			<h2 id="send-title">Rechnung {invoice.number} versenden</h2>
			<button type="button" class="close" onclick={onClose} aria-label="Schließen">×</button>
		</header>

		{#if phase === 'compose'}
			<div class="body">
				<p class="intro">
					Die PDF wird heruntergeladen und dein Mail-Programm öffnet sich mit vorausgefüllten
					Feldern. <strong>Die PDF musst du manuell anhängen</strong>
					— Mana kann Anhänge (noch) nicht automatisch einbetten.
				</p>

				<label class="field">
					<span>An</span>
					<input type="email" bind:value={to} placeholder="kontakt@kunde.ch" />
					{#if !hasRecipient}
						<span class="hint-warn">
							Keine gültige E-Mail — du kannst sie gleich im Mail-Programm ergänzen.
						</span>
					{/if}
				</label>

				<label class="field">
					<span>Betreff</span>
					<input type="text" bind:value={subject} />
				</label>

				<label class="field">
					<span>Nachricht</span>
					<textarea rows="10" bind:value={body}></textarea>
				</label>

				{#if error}<div class="error">{error}</div>{/if}
			</div>

			<footer class="foot">
				<button type="button" class="btn" onclick={onClose}>Abbrechen</button>
				<button type="button" class="btn btn-primary" onclick={openAndDownload}>
					Öffnen & herunterladen
				</button>
			</footer>
		{:else if phase === 'handed-off' || phase === 'marking-sent'}
			<div class="body handoff">
				<div class="check-row">
					<span class="check">✓</span>
					<span>PDF wurde heruntergeladen</span>
				</div>
				<div class="check-row">
					<span class="check">✓</span>
					<span>Mail-Programm wurde geöffnet</span>
				</div>

				<p class="handoff-hint">
					Hänge die heruntergeladene PDF an und sende die Mail. Kehre danach hierher zurück und
					markiere die Rechnung als versendet.
				</p>

				{#if error}<div class="error">{error}</div>{/if}
			</div>

			<footer class="foot">
				<button type="button" class="btn" onclick={onClose}>Später</button>
				<button
					type="button"
					class="btn btn-primary"
					onclick={markSent}
					disabled={phase === 'marking-sent'}
				>
					{phase === 'marking-sent' ? 'Markiere …' : 'Rechnung wurde versendet'}
				</button>
			</footer>
		{/if}
	</div>
</div>

<style>
	.backdrop {
		position: fixed;
		inset: 0;
		background: rgba(15, 23, 42, 0.5);
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 1rem;
		z-index: 100;
	}

	.modal {
		background: white;
		border-radius: 0.75rem;
		max-width: 560px;
		width: 100%;
		max-height: 90vh;
		display: flex;
		flex-direction: column;
		box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
	}

	.head {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 1rem 1.25rem;
		border-bottom: 1px solid var(--color-border, #e2e8f0);
	}

	.head h2 {
		margin: 0;
		font-size: 1.1rem;
		font-weight: 600;
	}

	.close {
		background: transparent;
		border: 0;
		font-size: 1.25rem;
		cursor: pointer;
		color: var(--color-text-muted, #64748b);
		padding: 0.25rem 0.5rem;
		line-height: 1;
	}

	.body {
		padding: 1.25rem;
		overflow-y: auto;
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.intro {
		margin: 0 0 0.5rem;
		font-size: 0.9rem;
		color: var(--color-text-muted, #64748b);
		line-height: 1.5;
	}

	.field {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.field > span {
		font-size: 0.85rem;
		color: var(--color-text-muted, #64748b);
	}

	.field input,
	.field textarea {
		padding: 0.5rem 0.65rem;
		border: 1px solid var(--color-border, #e2e8f0);
		border-radius: 0.4rem;
		font-size: 0.9rem;
		font-family: inherit;
	}

	.hint-warn {
		font-size: 0.8rem !important;
		color: #92400e !important;
	}

	.handoff {
		gap: 1rem;
	}

	.check-row {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.95rem;
	}

	.check {
		display: inline-flex;
		width: 1.5rem;
		height: 1.5rem;
		align-items: center;
		justify-content: center;
		background: #059669;
		color: white;
		border-radius: 50%;
		font-size: 0.85rem;
	}

	.handoff-hint {
		margin: 0.25rem 0 0;
		font-size: 0.9rem;
		color: var(--color-text-muted, #64748b);
		line-height: 1.5;
	}

	.error {
		background: #fef2f2;
		border: 1px solid #fecaca;
		color: #991b1b;
		padding: 0.65rem 0.9rem;
		border-radius: 0.4rem;
		font-size: 0.85rem;
	}

	.foot {
		display: flex;
		justify-content: flex-end;
		gap: 0.5rem;
		padding: 0.85rem 1.25rem;
		border-top: 1px solid var(--color-border, #e2e8f0);
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
</style>
