<script lang="ts">
	import { page } from '$app/stores';
	import { useAllInvoices } from '$lib/modules/invoices/queries';
	import DetailView from '$lib/modules/invoices/views/DetailView.svelte';

	const invoices$ = useAllInvoices();
	const invoices = $derived(invoices$.value ?? []);
	const id = $derived($page.params.id);
	const invoice = $derived(invoices.find((i) => i.id === id));
</script>

<svelte:head>
	<title>{invoice?.number ?? 'Rechnung'} - Mana</title>
</svelte:head>

{#if invoice}
	<DetailView {invoice} />
{:else if invoices$.value !== undefined}
	<div class="not-found">
		<p>Rechnung nicht gefunden.</p>
		<a href="/invoices">Zurück zur Übersicht</a>
	</div>
{:else}
	<div class="loading">Lädt …</div>
{/if}

<style>
	.not-found,
	.loading {
		padding: 3rem 1rem;
		text-align: center;
		color: var(--color-text-muted, #64748b);
	}
</style>
