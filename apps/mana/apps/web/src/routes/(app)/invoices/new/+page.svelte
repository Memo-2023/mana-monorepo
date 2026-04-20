<script lang="ts">
	import InvoiceForm from '$lib/modules/invoices/components/InvoiceForm.svelte';
</script>

<svelte:head>
	<title>Neue Rechnung - Mana</title>
</svelte:head>

<div class="page">
	<header class="head">
		<h1>Neue Rechnung</h1>
		<p class="subtitle">Entwurf erstellen — wird nach dem Speichern noch nicht versendet.</p>
	</header>

	<InvoiceForm />
</div>

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
