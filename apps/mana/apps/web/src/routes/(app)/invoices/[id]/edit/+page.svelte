<script lang="ts">
	import { _ } from 'svelte-i18n';
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
	<title>{$_('invoices.routes.edit_doc_title')}</title>
</svelte:head>

<RoutePage appId="invoices" backHref="/invoices" title={$_('invoices.routes.detail_route_title')}>
	<div class="page">
		{#if !invoice && invoices$.value !== undefined}
			<div class="not-found">
				<p>{$_('invoices.routes.not_found')}</p>
				<a href="/invoices">{$_('invoices.routes.back_to_list')}</a>
			</div>
		{:else if invoice && !canEdit}
			<div class="not-editable">
				<h2>{$_('invoices.routes.not_editable_title')}</h2>
				<p>
					{$_('invoices.routes.not_editable_body_pre')}<strong
						>{$_('invoices.status.' + invoice.status)}</strong
					>{$_('invoices.routes.not_editable_body_post')}
				</p>
				<a href="/invoices/{invoice.id}">{$_('invoices.routes.back_to_detail')}</a>
			</div>
		{:else if invoice}
			<header class="head">
				<h1>
					{$_('invoices.routes.edit_heading', { values: { number: invoice.number } })}
				</h1>
			</header>
			<InvoiceForm existing={invoice} />
		{:else}
			<div class="loading">{$_('invoices.routes.loading')}</div>
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
