<script lang="ts">
	import { _ } from 'svelte-i18n';
	import InvoiceForm from '$lib/modules/invoices/components/InvoiceForm.svelte';
	import { RoutePage } from '$lib/components/shell';
</script>

<svelte:head>
	<title>{$_('invoices.routes.new_doc_title')}</title>
</svelte:head>

<RoutePage appId="invoices" backHref="/invoices">
	<div class="page">
		<header class="head">
			<h1>{$_('invoices.routes.new_heading')}</h1>
			<p class="subtitle">{$_('invoices.routes.new_subtitle')}</p>
		</header>

		<InvoiceForm />
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

	.subtitle {
		margin: 0.25rem 0 0;
		color: var(--color-text-muted, #64748b);
		font-size: 0.9rem;
	}
</style>
