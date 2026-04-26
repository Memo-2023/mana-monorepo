<!--
  Invoices — ListView (M2)
  Status filter + stats cards (open / overdue / invoiced YTD / paid YTD) +
  search + row navigation. FAB → /invoices/new, settings icon → /invoices/settings.
-->
<script lang="ts">
	import { _ } from 'svelte-i18n';
	import { goto } from '$app/navigation';
	import { useAllInvoices, computeStats, formatAmount, searchInvoices } from './queries';
	import StatusBadge from './components/StatusBadge.svelte';
	import type { Invoice, InvoiceStatus, Currency } from './types';

	const invoices$ = useAllInvoices();
	const invoices = $derived(invoices$.value ?? []);

	let activeStatus = $state<InvoiceStatus | 'all'>('all');
	let searchQuery = $state('');

	const currentYear = new Date().getFullYear();
	const stats = $derived(computeStats(invoices, currentYear));

	const filtered = $derived.by(() => {
		let out = invoices;
		if (activeStatus !== 'all') out = out.filter((i) => i.status === activeStatus);
		if (searchQuery.trim()) out = searchInvoices(out, searchQuery.trim());
		return out;
	});

	function openInvoice(i: Invoice) {
		goto(`/invoices/${i.id}`);
	}

	/** Show the first currency that has any activity, falling back to CHF. */
	function primaryCurrency(map: Record<Currency, number>): Currency {
		for (const c of ['CHF', 'EUR', 'USD'] as Currency[]) {
			if (map[c] > 0) return c;
		}
		return 'CHF';
	}

	const openCurrency = $derived(primaryCurrency(stats.openByCurrency));
	const overdueCurrency = $derived(primaryCurrency(stats.overdueByCurrency));
	const ytdCurrency = $derived(primaryCurrency(stats.invoicedYtdByCurrency));
</script>

<div class="invoices-shell">
	<header class="head">
		<div>
			<h1>{$_('invoices.list.title')}</h1>
			<p class="subtitle">{$_('invoices.list.subtitle')}</p>
		</div>
		<div class="head-actions">
			<button
				class="btn-icon"
				type="button"
				title={$_('invoices.list.settings_aria')}
				aria-label={$_('invoices.list.settings_aria')}
				onclick={() => goto('/invoices/settings')}
			>
				⚙
			</button>
			<button class="btn-primary" type="button" onclick={() => goto('/invoices/new')}>
				{$_('invoices.list.new_invoice')}
			</button>
		</div>
	</header>

	<section class="stats">
		<div class="stat">
			<div class="stat-label">{$_('invoices.list.stat_open')}</div>
			<div class="stat-value">{formatAmount(stats.openByCurrency[openCurrency], openCurrency)}</div>
			<div class="stat-sub">
				{$_('invoices.list.stat_count', {
					values: { count: stats.totalByStatus.sent + stats.totalByStatus.overdue },
				})}
			</div>
		</div>
		<div class="stat stat-warn" class:empty={stats.overdueByCurrency[overdueCurrency] === 0}>
			<div class="stat-label">{$_('invoices.list.stat_overdue')}</div>
			<div class="stat-value">
				{formatAmount(stats.overdueByCurrency[overdueCurrency], overdueCurrency)}
			</div>
			<div class="stat-sub">
				{$_('invoices.list.stat_count', { values: { count: stats.totalByStatus.overdue } })}
			</div>
		</div>
		<div class="stat">
			<div class="stat-label">
				{$_('invoices.list.stat_invoiced_ytd', { values: { year: currentYear } })}
			</div>
			<div class="stat-value">
				{formatAmount(stats.invoicedYtdByCurrency[ytdCurrency], ytdCurrency)}
			</div>
		</div>
		<div class="stat">
			<div class="stat-label">
				{$_('invoices.list.stat_paid_ytd', { values: { year: currentYear } })}
			</div>
			<div class="stat-value">
				{formatAmount(stats.paidYtdByCurrency[ytdCurrency], ytdCurrency)}
			</div>
		</div>
	</section>

	<section class="filters">
		<div class="chips">
			<button
				class="chip"
				class:active={activeStatus === 'all'}
				onclick={() => (activeStatus = 'all')}
			>
				{$_('invoices.list.chip_all')} <span class="count">{invoices.length}</span>
			</button>
			{#each ['draft', 'sent', 'overdue', 'paid', 'void'] as status (status)}
				<button
					class="chip"
					class:active={activeStatus === status}
					onclick={() => (activeStatus = status as InvoiceStatus)}
				>
					{$_('invoices.status.' + status)}
					<span class="count">{stats.totalByStatus[status as InvoiceStatus]}</span>
				</button>
			{/each}
		</div>
		<input
			class="search"
			type="search"
			placeholder={$_('invoices.list.search_placeholder')}
			bind:value={searchQuery}
		/>
	</section>

	{#if invoices.length === 0}
		<div class="empty">
			<div class="empty-icon">📄</div>
			<h2>{$_('invoices.list.empty_title')}</h2>
			<p>{$_('invoices.list.empty_body')}</p>
			<button class="btn-primary" onclick={() => goto('/invoices/new')}>
				{$_('invoices.list.empty_cta')}
			</button>
		</div>
	{:else if filtered.length === 0}
		<div class="empty">
			<p>{$_('invoices.list.empty_filtered')}</p>
		</div>
	{:else}
		<ul class="list" role="list">
			{#each filtered as invoice (invoice.id)}
				<li>
					<button class="row" onclick={() => openInvoice(invoice)}>
						<span class="number">{invoice.number}</span>
						<span class="client">
							<span class="client-name">{invoice.clientSnapshot.name}</span>
							{#if invoice.subject}
								<span class="client-subject">{invoice.subject}</span>
							{/if}
						</span>
						<span class="date">{invoice.dueDate}</span>
						<span class="amount">
							{formatAmount(invoice.totals.gross, invoice.currency)}
						</span>
						<span class="status"><StatusBadge status={invoice.status} /></span>
					</button>
				</li>
			{/each}
		</ul>
	{/if}
</div>

<style>
	.invoices-shell {
		padding: 1.5rem;
		max-width: 1100px;
		margin: 0 auto;
	}

	.head {
		display: flex;
		justify-content: space-between;
		align-items: flex-end;
		margin-bottom: 1.5rem;
		gap: 1rem;
		flex-wrap: wrap;
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

	.head-actions {
		display: flex;
		gap: 0.5rem;
		align-items: center;
	}

	.btn-primary {
		background: #059669;
		color: white;
		padding: 0.55rem 1.1rem;
		border-radius: 0.4rem;
		border: 0;
		font-weight: 500;
		cursor: pointer;
		font-size: 0.95rem;
	}

	.btn-icon {
		width: 2.25rem;
		height: 2.25rem;
		background: white;
		border: 1px solid var(--color-border, #e2e8f0);
		border-radius: 0.4rem;
		cursor: pointer;
		font-size: 1rem;
	}

	.stats {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
		gap: 0.75rem;
		margin-bottom: 1rem;
	}

	.stat {
		padding: 0.9rem 1rem;
		background: var(--color-surface, #fff);
		border: 1px solid var(--color-border, #e2e8f0);
		border-radius: 0.5rem;
	}

	.stat-label {
		font-size: 0.8rem;
		color: var(--color-text-muted, #64748b);
		text-transform: uppercase;
		letter-spacing: 0.03em;
	}

	.stat-value {
		margin-top: 0.25rem;
		font-size: 1.3rem;
		font-weight: 600;
		font-variant-numeric: tabular-nums;
	}

	.stat-sub {
		margin-top: 0.15rem;
		font-size: 0.8rem;
		color: var(--color-text-muted, #64748b);
	}

	.stat-warn:not(.empty) {
		border-color: #fecaca;
		background: #fef2f2;
	}

	.stat-warn:not(.empty) .stat-value {
		color: #b91c1c;
	}

	.filters {
		display: flex;
		gap: 1rem;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 1rem;
		flex-wrap: wrap;
	}

	.chips {
		display: flex;
		gap: 0.4rem;
		flex-wrap: wrap;
	}

	.chip {
		display: inline-flex;
		align-items: center;
		gap: 0.35rem;
		padding: 0.35rem 0.75rem;
		background: white;
		border: 1px solid var(--color-border, #e2e8f0);
		border-radius: 999px;
		cursor: pointer;
		font-size: 0.85rem;
	}

	.chip.active {
		background: #065f46;
		color: white;
		border-color: #065f46;
	}

	.chip .count {
		background: rgba(0, 0, 0, 0.08);
		padding: 0 0.4rem;
		border-radius: 999px;
		font-size: 0.75rem;
	}

	.chip.active .count {
		background: rgba(255, 255, 255, 0.2);
	}

	.search {
		padding: 0.45rem 0.75rem;
		border: 1px solid var(--color-border, #e2e8f0);
		border-radius: 0.4rem;
		font-size: 0.9rem;
		min-width: 240px;
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
		margin: 0.25rem 0 1rem;
		font-size: 0.9rem;
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
		grid-template-columns: 7rem 1fr auto 7rem 7rem;
		gap: 1rem;
		align-items: center;
		width: 100%;
		padding: 0.75rem 1rem;
		background: var(--color-surface, #fff);
		border: 1px solid var(--color-border, #e2e8f0);
		border-radius: 0.5rem;
		cursor: pointer;
		text-align: left;
		font: inherit;
	}

	.row:hover {
		border-color: #059669;
		background: #f0fdf4;
	}

	.number {
		font-variant-numeric: tabular-nums;
		font-size: 0.85rem;
		color: var(--color-text-muted, #64748b);
	}

	.client {
		display: flex;
		flex-direction: column;
		min-width: 0;
	}

	.client-name {
		font-weight: 500;
	}

	.client-subject {
		font-size: 0.8rem;
		color: var(--color-text-muted, #64748b);
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.date,
	.amount {
		font-variant-numeric: tabular-nums;
		font-size: 0.9rem;
	}

	.amount {
		font-weight: 500;
	}
</style>
