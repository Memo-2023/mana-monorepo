<script lang="ts">
	import { page } from '$app/stores';
	import { useAllInvoices } from '$lib/modules/invoices/queries';
	import InvoiceForm from '$lib/modules/invoices/components/InvoiceForm.svelte';
	import { RoutePage } from '$lib/components/shell';

	const invoices$ = useAllInvoices();
	const invoices = $derived(invoices$.value ?? []);
	const id = $derived($page.params.id);
	const invoice = $derived(invoices.find((i) => i.id === id));
	const canEdit = $derived(invoice?.status === 'draft');
</script>

<svelte:head>
	<title>Rechnung bearbeiten - Mana</title>
</svelte:head>

<RoutePage appId="invoices" backHref="/invoices" title="Rechnung">
	<div class="page">
		{#if !invoice && invoices$.value !== undefined}
			<div class="not-found">
				<p>Rechnung nicht gefunden.</p>
				<a href="/invoices">Zurück zur Übersicht</a>
			</div>
		{:else if invoice && !canEdit}
			<div class="not-editable">
				<h2>Rechnung kann nicht bearbeitet werden</h2>
				<p>
					Nur Entwürfe sind editierbar. Diese Rechnung hat Status
					<strong>{invoice.status}</strong>. Um eine versendete Rechnung zu ändern, storniere sie
					und dupliziere sie als neuen Entwurf.
				</p>
				<a href="/invoices/{invoice.id}">Zurück zum Detail</a>
			</div>
		{:else if invoice}
			<header class="head">
				<h1>Rechnung {invoice.number} bearbeiten</h1>
			</header>
			<InvoiceForm existing={invoice} />
		{:else}
			<div class="loading">Lädt …</div>
		{/if}
	</div>
</RoutePage>

<style>
	.page {
		max-width: 960px;
		margin: 0 auto;
		padding: 1.5rem;
	}

	.head {
		margin-bottom: 1.5rem;
	}

	h1 {
		margin: 0;
		font-size: 1.5rem;
		font-weight: 600;
	}

	.not-found,
	.loading,
	.not-editable {
		padding: 3rem 1rem;
		text-align: center;
		color: var(--color-text-muted, #64748b);
	}

	.not-editable h2 {
		color: var(--color-text, #0f172a);
	}

	.not-editable p {
		max-width: 40ch;
		margin: 0.5rem auto;
	}
</style>
