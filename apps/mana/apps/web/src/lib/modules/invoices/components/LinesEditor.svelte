<!--
  LinesEditor — the per-line table on the InvoiceForm.
  Two-way binds the array so the parent sees edits immediately; parent
  recomputes totals from the same array via the pure helper in totals.ts.

  Input convention: unitPrice comes in as MAJOR units (150.00 CHF) from the
  UI because users type "150.00"; we convert to minor units (15000) on
  blur / emit. All in-component math uses minor units.
-->
<script lang="ts">
	import { _ } from 'svelte-i18n';
	import { VAT_RATES_CH, VAT_RATES_DE, CURRENCIES } from '../constants';
	import { computeLineTotal } from '../totals';
	import type { LocalInvoiceLine, Currency } from '../types';

	interface Props {
		lines: LocalInvoiceLine[];
		currency: Currency;
		vatRegime?: 'CH' | 'DE';
	}

	let { lines = $bindable([]), currency, vatRegime = 'CH' }: Props = $props();

	const vatOptions = $derived(vatRegime === 'CH' ? VAT_RATES_CH : VAT_RATES_DE);
	const minorUnit = $derived(CURRENCIES[currency].minorUnit);

	function majorToMinor(val: number): number {
		return Math.round(val * minorUnit);
	}

	function minorToMajor(val: number): number {
		return val / minorUnit;
	}

	function addLine() {
		lines = [
			...lines,
			{
				id: crypto.randomUUID(),
				title: '',
				description: null,
				quantity: 1,
				unit: null,
				unitPrice: 0,
				vatRate: vatRegime === 'CH' ? 8.1 : 19,
				discount: null,
			},
		];
	}

	function removeLine(id: string) {
		lines = lines.filter((l) => l.id !== id);
	}

	function moveLine(id: string, dir: -1 | 1) {
		const idx = lines.findIndex((l) => l.id === id);
		if (idx < 0) return;
		const next = idx + dir;
		if (next < 0 || next >= lines.length) return;
		const copy = [...lines];
		[copy[idx], copy[next]] = [copy[next], copy[idx]];
		lines = copy;
	}

	function updateLine(id: string, patch: Partial<LocalInvoiceLine>) {
		lines = lines.map((l) => (l.id === id ? { ...l, ...patch } : l));
	}

	function formatMinor(minor: number): string {
		return (minor / minorUnit).toFixed(2);
	}
</script>

<div class="editor">
	<div class="head">
		<span class="col-title">{$_('invoices.lines_editor.th_position')}</span>
		<span class="col-qty">{$_('invoices.lines_editor.th_quantity')}</span>
		<span class="col-unit">{$_('invoices.lines_editor.th_unit')}</span>
		<span class="col-price">{$_('invoices.lines_editor.th_unit_price')}</span>
		<span class="col-vat">{$_('invoices.lines_editor.th_vat')}</span>
		<span class="col-total">{$_('invoices.lines_editor.th_total')}</span>
		<span class="col-actions"></span>
	</div>

	{#if lines.length === 0}
		<p class="empty">{$_('invoices.lines_editor.empty')}</p>
	{/if}

	{#each lines as line (line.id)}
		{@const { net, tax } = computeLineTotal(line)}
		<div class="row">
			<input
				class="col-title"
				type="text"
				placeholder={$_('invoices.lines_editor.placeholder_title')}
				value={line.title}
				oninput={(e) => updateLine(line.id, { title: e.currentTarget.value })}
			/>
			<input
				class="col-qty"
				type="number"
				min="0"
				step="0.01"
				value={line.quantity}
				oninput={(e) => updateLine(line.id, { quantity: Number(e.currentTarget.value) || 0 })}
			/>
			<input
				class="col-unit"
				type="text"
				placeholder={$_('invoices.lines_editor.placeholder_unit')}
				value={line.unit ?? ''}
				oninput={(e) => updateLine(line.id, { unit: e.currentTarget.value || null })}
			/>
			<input
				class="col-price"
				type="number"
				min="0"
				step="0.01"
				value={minorToMajor(line.unitPrice)}
				oninput={(e) =>
					updateLine(line.id, { unitPrice: majorToMinor(Number(e.currentTarget.value) || 0) })}
			/>
			<select
				class="col-vat"
				value={line.vatRate}
				onchange={(e) => updateLine(line.id, { vatRate: Number(e.currentTarget.value) })}
			>
				{#each vatOptions as option (option.value)}
					<option value={option.value}>{$_(option.i18nKey)}</option>
				{/each}
			</select>
			<span class="col-total total-cell">
				<strong>{formatMinor(net + tax)}</strong>
				<small
					>{$_('invoices.lines_editor.label_total_net', {
						values: { amount: formatMinor(net) },
					})}</small
				>
			</span>
			<span class="col-actions">
				<button
					type="button"
					title={$_('invoices.lines_editor.aria_move_up')}
					onclick={() => moveLine(line.id, -1)}
					aria-label={$_('invoices.lines_editor.aria_move_up')}>↑</button
				>
				<button
					type="button"
					title={$_('invoices.lines_editor.aria_move_down')}
					onclick={() => moveLine(line.id, 1)}
					aria-label={$_('invoices.lines_editor.aria_move_down')}>↓</button
				>
				<button
					type="button"
					class="remove"
					title={$_('invoices.lines_editor.aria_remove')}
					onclick={() => removeLine(line.id)}
					aria-label={$_('invoices.lines_editor.aria_remove')}>×</button
				>
			</span>
		</div>
	{/each}

	<button type="button" class="add" onclick={addLine}>{$_('invoices.lines_editor.add_line')}</button
	>
</div>

<style>
	.editor {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.head,
	.row {
		display: grid;
		grid-template-columns: 3fr 0.8fr 0.8fr 1.2fr 1.4fr 1.2fr auto;
		gap: 0.5rem;
		align-items: center;
	}

	.head {
		font-size: 0.75rem;
		text-transform: uppercase;
		letter-spacing: 0.02em;
		color: var(--color-text-muted, #64748b);
		padding: 0 0.5rem;
	}

	.row {
		background: var(--color-surface, #fff);
		border: 1px solid var(--color-border, #e2e8f0);
		border-radius: 0.5rem;
		padding: 0.5rem;
	}

	.row input,
	.row select {
		padding: 0.4rem 0.5rem;
		border: 1px solid var(--color-border, #e2e8f0);
		border-radius: 0.35rem;
		font-size: 0.9rem;
		min-width: 0;
	}

	input.col-title {
		width: 100%;
	}

	.total-cell {
		display: flex;
		flex-direction: column;
		font-variant-numeric: tabular-nums;
		text-align: right;
	}

	.total-cell small {
		color: var(--color-text-muted, #64748b);
		font-size: 0.75rem;
	}

	.col-actions {
		display: flex;
		gap: 0.2rem;
	}

	.col-actions button {
		width: 1.8rem;
		height: 1.8rem;
		border: 1px solid var(--color-border, #e2e8f0);
		background: white;
		border-radius: 0.25rem;
		cursor: pointer;
		font-size: 0.9rem;
	}

	.col-actions .remove {
		color: #ef4444;
	}

	.empty {
		padding: 1rem;
		color: var(--color-text-muted, #64748b);
		text-align: center;
		font-size: 0.9rem;
		background: var(--color-surface-muted, #f8fafc);
		border: 1px dashed var(--color-border, #e2e8f0);
		border-radius: 0.5rem;
		margin: 0;
	}

	.add {
		align-self: flex-start;
		padding: 0.4rem 0.75rem;
		border: 1px dashed var(--color-border, #e2e8f0);
		background: transparent;
		border-radius: 0.35rem;
		cursor: pointer;
		color: var(--color-text-muted, #64748b);
		font-size: 0.85rem;
	}

	.add:hover {
		border-color: #059669;
		color: #059669;
	}
</style>
