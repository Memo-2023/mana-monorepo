<!--
  InvoiceForm — create or edit a draft invoice.
  Edit is disabled for non-draft statuses; the DetailView routes to this
  form only when status === 'draft'.
-->
<script lang="ts">
	import { untrack } from 'svelte';
	import { _ } from 'svelte-i18n';
	import { goto } from '$app/navigation';
	import ClientPicker from './ClientPicker.svelte';
	import LinesEditor from './LinesEditor.svelte';
	import { invoiceSettingsStore } from '../stores/settings.svelte';
	import { invoicesStore } from '../stores/invoices.svelte';
	import { computeInvoiceTotals } from '../totals';
	import { formatAmount } from '../queries';
	import { CURRENCIES } from '../constants';
	import type {
		Invoice,
		LocalInvoiceLine,
		InvoiceClientSnapshot,
		ClientSource,
		Currency,
	} from '../types';

	interface Props {
		existing?: Invoice;
	}

	let { existing }: Props = $props();

	const isEdit = $derived(Boolean(existing));

	// ─── Form state ──────────────────────────────────────────
	// `existing` is captured once at mount — the form is keyed on invoice id
	// at the route level, so prop changes remount rather than re-initialise
	// mid-edit. `untrack` makes that intent explicit to svelte-check.
	const initial = untrack(() => existing);
	let clientId = $state<string | null>(initial?.clientId ?? null);
	let clientSource = $state<ClientSource>(initial?.clientSource ?? 'invoice-client');
	let snapshot = $state<InvoiceClientSnapshot>(
		initial?.clientSnapshot ?? { name: '', address: '', email: '' }
	);
	let currency = $state<Currency>(initial?.currency ?? 'CHF');
	let issueDate = $state(initial?.issueDate ?? new Date().toISOString().slice(0, 10));
	let dueDate = $state(initial?.dueDate ?? '');
	let subject = $state<string>(initial?.subject ?? '');
	let notes = $state<string>(initial?.notes ?? '');
	let terms = $state<string>(initial?.terms ?? '');
	let lines = $state<LocalInvoiceLine[]>(
		initial?.lines?.map((l) => ({
			id: l.id,
			title: l.title,
			description: l.description,
			quantity: l.quantity,
			unit: l.unit,
			unitPrice: l.unitPrice,
			vatRate: l.vatRate,
			discount: l.discount,
		})) ?? []
	);

	let saving = $state(false);
	let error = $state<string | null>(null);

	// ─── Defaults from settings ──────────────────────────────
	$effect(() => {
		if (isEdit) return;
		invoiceSettingsStore.getDefaults().then((d) => {
			if (!currency) currency = d.currency;
			if (!terms) terms = d.terms ?? '';
			if (!dueDate) {
				const base = new Date(issueDate);
				base.setDate(base.getDate() + d.dueDays);
				dueDate = base.toISOString().slice(0, 10);
			}
		});
	});

	// ─── Derived totals (live preview) ───────────────────────
	const totals = $derived(computeInvoiceTotals(lines));
	const vatRegime = $derived<'CH' | 'DE'>(currency === 'EUR' ? 'DE' : 'CH');

	// ─── Save ────────────────────────────────────────────────
	async function saveDraft() {
		error = null;
		if (!snapshot.name?.trim()) {
			error = $_('invoices.form.err_client_required');
			return;
		}
		if (lines.length === 0) {
			error = $_('invoices.form.err_min_one_line');
			return;
		}
		saving = true;
		try {
			if (isEdit && existing) {
				await invoicesStore.updateLines(existing.id, lines);
				await invoicesStore.updateInvoice(existing.id, {
					clientId,
					clientSource,
					clientSnapshot: snapshot,
					currency,
					issueDate,
					dueDate,
					subject: subject || null,
					notes: notes || null,
					terms: terms || null,
				});
				goto(`/invoices/${existing.id}`);
			} else {
				const newId = await invoicesStore.createInvoice({
					clientId,
					clientSource,
					clientSnapshot: snapshot,
					currency,
					issueDate,
					dueDate,
					lines,
					subject: subject || null,
					notes: notes || null,
					terms: terms || null,
				});
				goto(`/invoices/${newId}`);
			}
		} catch (e) {
			error = e instanceof Error ? e.message : $_('invoices.form.err_save');
		} finally {
			saving = false;
		}
	}
</script>

<form
	onsubmit={(e) => {
		e.preventDefault();
		saveDraft();
	}}
	class="form"
>
	<section class="section">
		<h3>{$_('invoices.form.section_client')}</h3>
		<ClientPicker bind:clientId bind:clientSource bind:snapshot />
	</section>

	<section class="section">
		<h3>{$_('invoices.form.section_invoice')}</h3>
		<div class="grid-3">
			<label class="field">
				<span>{$_('invoices.form.label_subject')}</span>
				<input
					type="text"
					placeholder={$_('invoices.form.placeholder_subject')}
					bind:value={subject}
				/>
			</label>
			<label class="field">
				<span>{$_('invoices.form.label_currency')}</span>
				<select bind:value={currency}>
					{#each Object.keys(CURRENCIES) as c (c)}
						<option value={c}>{c}</option>
					{/each}
				</select>
			</label>
			<label class="field">
				<span>{$_('invoices.form.label_issue_date')}</span>
				<input type="date" bind:value={issueDate} />
			</label>
			<label class="field">
				<span>{$_('invoices.form.label_due_date')}</span>
				<input type="date" bind:value={dueDate} />
			</label>
		</div>
	</section>

	<section class="section">
		<h3>{$_('invoices.form.section_lines')}</h3>
		<LinesEditor bind:lines {currency} {vatRegime} />
	</section>

	<section class="section totals-section">
		<h3>{$_('invoices.form.section_totals')}</h3>
		<dl class="totals">
			<dt>{$_('invoices.form.total_label_net')}</dt>
			<dd>{formatAmount(totals.net, currency)}</dd>
			{#each totals.vatBreakdown as b (b.rate)}
				<dt>{$_('invoices.form.total_label_vat', { values: { rate: b.rate } })}</dt>
				<dd>{formatAmount(b.tax, currency)}</dd>
			{/each}
			<dt class="gross-label">{$_('invoices.form.total_label_total')}</dt>
			<dd class="gross-value">{formatAmount(totals.gross, currency)}</dd>
		</dl>
	</section>

	<section class="section">
		<h3>{$_('invoices.form.section_notes')}</h3>
		<label class="field">
			<span>{$_('invoices.form.label_notes')}</span>
			<textarea rows="2" bind:value={notes}></textarea>
		</label>
		<label class="field">
			<span>{$_('invoices.form.label_terms')}</span>
			<textarea rows="2" bind:value={terms}></textarea>
		</label>
	</section>

	{#if error}
		<div class="error">{error}</div>
	{/if}

	<div class="actions">
		<button type="button" class="btn-secondary" onclick={() => history.back()}>
			{$_('invoices.form.cancel')}
		</button>
		<button type="submit" class="btn-primary" disabled={saving}>
			{saving
				? $_('invoices.form.saving')
				: isEdit
					? $_('invoices.form.submit_update')
					: $_('invoices.form.submit_create')}
		</button>
	</div>
</form>

<style>
	.form {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}

	.section {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	h3 {
		margin: 0;
		font-size: 1rem;
		font-weight: 600;
	}

	.field {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		min-width: 0;
	}

	.field > span {
		font-size: 0.85rem;
		color: var(--color-text-muted, #64748b);
	}

	.field input,
	.field textarea,
	.field select {
		padding: 0.5rem 0.65rem;
		border: 1px solid var(--color-border, #e2e8f0);
		border-radius: 0.4rem;
		font-size: 0.95rem;
		font-family: inherit;
	}

	.grid-3 {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		gap: 0.75rem;
	}

	.totals-section {
		background: var(--color-surface-muted, #f8fafc);
		border: 1px solid var(--color-border, #e2e8f0);
		border-radius: 0.5rem;
		padding: 1rem;
	}

	.totals {
		display: grid;
		grid-template-columns: 1fr auto;
		gap: 0.25rem 1rem;
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

	.gross-label,
	.gross-value {
		margin-top: 0.5rem;
		padding-top: 0.5rem;
		border-top: 1px solid var(--color-border, #e2e8f0);
		font-weight: 600;
	}

	.error {
		background: #fef2f2;
		border: 1px solid #fecaca;
		color: #991b1b;
		padding: 0.75rem 1rem;
		border-radius: 0.4rem;
		font-size: 0.9rem;
	}

	.actions {
		display: flex;
		justify-content: flex-end;
		gap: 0.75rem;
	}

	.btn-primary,
	.btn-secondary {
		padding: 0.55rem 1.25rem;
		border-radius: 0.4rem;
		font-weight: 500;
		cursor: pointer;
		font-size: 0.95rem;
	}

	.btn-primary {
		background: #059669;
		color: white;
		border: 0;
	}

	.btn-primary:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.btn-secondary {
		background: white;
		color: var(--color-text, #0f172a);
		border: 1px solid var(--color-border, #e2e8f0);
	}
</style>
