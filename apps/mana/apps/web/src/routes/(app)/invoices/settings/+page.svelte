<script lang="ts">
	import SenderProfileForm from '$lib/modules/invoices/components/SenderProfileForm.svelte';
</script>

<svelte:head>
	<title>Rechnungs-Einstellungen - Mana</title>
</svelte:head>

<div class="page">
	<header class="head">
		<h1>Rechnungs-Einstellungen</h1>
		<p class="subtitle">Absender, Nummernkreis und Standards für alle neuen Rechnungen.</p>
	</header>

	<SenderProfileForm />
</div>

<style>
	.page {
		max-width: 720px;
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
