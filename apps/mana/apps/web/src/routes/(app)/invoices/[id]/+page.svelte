<script lang="ts">
	import { _ } from 'svelte-i18n';
	import { page } from '$app/stores';
	import { useAllInvoices } from '$lib/modules/invoices/queries';
	import DetailView from '$lib/modules/invoices/views/DetailView.svelte';
	import { RoutePage } from '$lib/components/shell';

	const invoices$ = useAllInvoices();
	const invoices = $derived(invoices$.value ?? []);
	const id = $derived($page.params.id);
	const invoice = $derived(invoices.find((i) => i.id === id));
</script>

<svelte:head>
	<title
		>{$_('invoices.routes.detail_doc_title', {
			values: { number: invoice?.number ?? $_('invoices.routes.detail_title_fallback') },
		})}</title
	>
</svelte:head>

<RoutePage appId="invoices" backHref="/invoices" title={$_('invoices.routes.detail_route_title')}>
	{#if invoice}
		<DetailView {invoice} />
	{:else if invoices$.value !== undefined}
		<div class="not-found">
			<p>{$_('invoices.routes.not_found')}</p>
			<a href="/invoices">{$_('invoices.routes.back_to_list')}</a>
		</div>
	{:else}
		<div class="loading">{$_('invoices.routes.loading')}</div>
	{/if}
</RoutePage>

<style>
	.not-found,
	.loading {
		padding: 3rem 1rem;
		text-align: center;
		color: var(--color-text-muted, #64748b);
	}
</style>
