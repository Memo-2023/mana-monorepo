<script lang="ts">
	/**
	 * InvoicesOpenWidget — offene + überfällige Summen + die 3 ältesten
	 * überfälligen Rechnungen, direkt aus Dexie gelesen.
	 *
	 * Zeigt pro Primär-Währung (zuerst CHF → EUR → USD) die offene +
	 * überfällige Summe. Mehrwährungs-Setups sehen nur die Leitwährung;
	 * detaillierte Aufschlüsselung gibt's im ListView.
	 */

	import { liveQuery } from 'dexie';
	import { invoiceTable } from '$lib/modules/invoices/collections';
	import { decryptRecords } from '$lib/data/crypto';
	import { toInvoice, computeStats, formatAmount } from '$lib/modules/invoices/queries';
	import type { Invoice, InvoiceStatus, Currency } from '$lib/modules/invoices/types';

	let invoices = $state<Invoice[]>([]);
	let loading = $state(true);

	$effect(() => {
		const sub = liveQuery(async () => {
			const rows = await invoiceTable.toArray();
			const visible = rows.filter((r) => !r.deletedAt);
			const decrypted = await decryptRecords('invoices', visible);
			const today = new Date().toISOString().slice(0, 10);
			return decrypted.map((local) => {
				const inv = toInvoice(local);
				if (inv.status === 'sent' && inv.dueDate < today) {
					return { ...inv, status: 'overdue' as InvoiceStatus };
				}
				return inv;
			});
		}).subscribe({
			next: (result) => {
				invoices = result;
				loading = false;
			},
			error: () => {
				loading = false;
			},
		});
		return () => sub.unsubscribe();
	});

	const currentYear = new Date().getFullYear();
	const stats = $derived(computeStats(invoices, currentYear));

	function primaryCurrency(map: Record<Currency, number>): Currency {
		for (const c of ['CHF', 'EUR', 'USD'] as Currency[]) {
			if (map[c] > 0) return c;
		}
		return 'CHF';
	}

	const openCurrency = $derived(primaryCurrency(stats.openByCurrency));
	const overdueCount = $derived(stats.totalByStatus.overdue);
	const openSum = $derived(stats.openByCurrency[openCurrency]);
	const overdueSum = $derived(stats.overdueByCurrency[openCurrency]);

	// Top 3 oldest overdue — the ones the user should chase first.
	const topOverdue = $derived(
		invoices
			.filter((i) => i.status === 'overdue')
			.sort((a, b) => a.dueDate.localeCompare(b.dueDate))
			.slice(0, 3)
	);

	function daysSince(dueDate: string): number {
		const due = new Date(`${dueDate}T00:00:00`);
		const now = new Date();
		return Math.floor((now.getTime() - due.getTime()) / (1000 * 60 * 60 * 24));
	}
</script>

<div>
	<div class="mb-3 flex items-center justify-between">
		<h3 class="flex items-center gap-2 text-lg font-semibold">
			<span aria-hidden="true">📄</span>
			Rechnungen
		</h3>
		<a href="/invoices" class="text-xs text-muted-foreground hover:text-foreground"> Alle → </a>
	</div>

	{#if loading}
		<div class="space-y-2">
			{#each Array(3) as _}
				<div class="h-10 animate-pulse rounded bg-surface-hover"></div>
			{/each}
		</div>
	{:else if invoices.length === 0}
		<div class="py-4 text-center">
			<p class="text-sm text-muted-foreground">Noch keine Rechnungen gestellt.</p>
			<a
				href="/invoices/new"
				class="mt-3 inline-block rounded-lg bg-primary/10 px-4 py-2 text-sm font-medium text-primary hover:bg-primary/20"
			>
				Erste Rechnung
			</a>
		</div>
	{:else}
		<div class="mb-3 grid grid-cols-2 gap-2">
			<div class="rounded-lg bg-surface-hover p-2.5">
				<div class="text-xs text-muted-foreground">Offen</div>
				<div class="text-lg font-semibold tabular-nums">
					{formatAmount(openSum, openCurrency)}
				</div>
			</div>
			<div
				class="rounded-lg p-2.5"
				class:bg-surface-hover={overdueSum === 0}
				class:bg-red-50={overdueSum > 0}
			>
				<div class="text-xs text-muted-foreground">Überfällig</div>
				<div class="text-lg font-semibold tabular-nums" class:text-red-700={overdueSum > 0}>
					{formatAmount(overdueSum, openCurrency)}
				</div>
				{#if overdueCount > 0}
					<div class="text-[10px] text-red-700">{overdueCount} Rechnungen</div>
				{/if}
			</div>
		</div>

		{#if topOverdue.length > 0}
			<div class="space-y-1.5">
				{#each topOverdue as invoice (invoice.id)}
					<a
						href="/invoices/{invoice.id}"
						class="flex items-center justify-between rounded-lg p-2 transition-colors hover:bg-surface-hover"
					>
						<div class="min-w-0 flex-1">
							<div class="truncate text-sm font-medium">
								{invoice.clientSnapshot.name}
							</div>
							<div class="text-xs text-red-700">
								{daysSince(invoice.dueDate)} Tage überfällig
							</div>
						</div>
						<div class="ml-2 text-sm font-medium tabular-nums">
							{formatAmount(invoice.totals.gross, invoice.currency)}
						</div>
					</a>
				{/each}
			</div>
		{/if}
	{/if}
</div>
