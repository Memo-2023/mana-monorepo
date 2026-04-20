<!--
  Invoices — ListView (M1 skeleton)
  Empty state + "+ Neu"-button placeholder. M2 brings the full list, filter
  chips, and stats cards. Plan: docs/plans/invoices-module.md.
-->
<script lang="ts">
	import { useLiveQueryWithDefault } from '@mana/local-store/svelte';
	import { decryptRecords } from '$lib/data/crypto';
	import { invoiceTable } from './collections';
	import { STATUS_LABELS, STATUS_COLORS, CURRENCIES } from './constants';
	import type { LocalInvoice } from './types';

	const invoices$ = useLiveQueryWithDefault(async () => {
		const rows = await invoiceTable.toArray();
		const visible = rows.filter((r) => !r.deletedAt);
		return (await decryptRecords('invoices', visible)) as LocalInvoice[];
	}, [] as LocalInvoice[]);
	const invoices = $derived(invoices$.value);

	function formatAmount(minor: number, currency: keyof typeof CURRENCIES): string {
		const { symbol, minorUnit } = CURRENCIES[currency];
		const value = minor / minorUnit;
		return `${symbol} ${value.toFixed(2)}`;
	}
</script>

<div class="invoices-shell">
	<header class="head">
		<div>
			<h1>Rechnungen</h1>
			<p class="subtitle">Outbound-Finance — Rechnungen stellen und verfolgen</p>
		</div>
		<button class="btn-primary" type="button" disabled title="M2">+ Neu</button>
	</header>

	{#if invoices.length === 0}
		<div class="empty">
			<div class="empty-icon">📄</div>
			<h2>Noch keine Rechnungen</h2>
			<p>Stelle deine erste Rechnung mit automatischem PDF-Export und Schweizer QR-Bill.</p>
			<p class="note">M1 Skelett — Erstellen-Flow folgt in M2.</p>
		</div>
	{:else}
		<ul class="list">
			{#each invoices as invoice (invoice.id)}
				<li class="row">
					<span class="number">{invoice.number}</span>
					<span class="client">{invoice.clientSnapshot?.name ?? '—'}</span>
					<span class="amount">{formatAmount(invoice.totals.gross, invoice.currency)}</span>
					<span class="status" style="--dot: {STATUS_COLORS[invoice.status]}">
						<span class="dot"></span>
						{STATUS_LABELS[invoice.status].de}
					</span>
				</li>
			{/each}
		</ul>
	{/if}
</div>

<style>
	.invoices-shell {
		padding: 1.5rem;
		max-width: 1000px;
		margin: 0 auto;
	}

	.head {
		display: flex;
		justify-content: space-between;
		align-items: flex-end;
		margin-bottom: 1.5rem;
	}

	.head h1 {
		margin: 0;
		font-size: 1.75rem;
		font-weight: 600;
	}

	.subtitle {
		margin: 0.25rem 0 0;
		color: var(--color-text-muted, #64748b);
		font-size: 0.9rem;
	}

	.btn-primary {
		background: #059669;
		color: white;
		padding: 0.5rem 1rem;
		border-radius: 0.5rem;
		border: 0;
		font-weight: 500;
		cursor: pointer;
	}

	.btn-primary:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.empty {
		text-align: center;
		padding: 4rem 1rem;
		color: var(--color-text-muted, #64748b);
	}

	.empty-icon {
		font-size: 3rem;
		margin-bottom: 0.75rem;
	}

	.empty h2 {
		margin: 0 0 0.5rem;
		font-size: 1.15rem;
		font-weight: 500;
		color: var(--color-text, #0f172a);
	}

	.empty p {
		margin: 0.25rem 0;
		font-size: 0.9rem;
	}

	.note {
		margin-top: 1rem !important;
		font-size: 0.8rem;
		opacity: 0.7;
	}

	.list {
		list-style: none;
		padding: 0;
		margin: 0;
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.row {
		display: grid;
		grid-template-columns: 7rem 1fr auto 7rem;
		gap: 1rem;
		align-items: center;
		padding: 0.75rem 1rem;
		background: var(--color-surface, #fff);
		border: 1px solid var(--color-border, #e2e8f0);
		border-radius: 0.5rem;
	}

	.number {
		font-variant-numeric: tabular-nums;
		font-size: 0.85rem;
		color: var(--color-text-muted, #64748b);
	}

	.client {
		font-weight: 500;
	}

	.amount {
		font-variant-numeric: tabular-nums;
		font-weight: 500;
	}

	.status {
		display: inline-flex;
		align-items: center;
		gap: 0.4rem;
		font-size: 0.85rem;
	}

	.status .dot {
		width: 8px;
		height: 8px;
		border-radius: 50%;
		background: var(--dot);
	}
</style>
