<!--
  /invoices/settings — sender profile, number range, invoice defaults.
  Reached via the ⚙ button in the invoices module; not a workbench card.
-->
<script lang="ts">
	import SenderProfileForm from '$lib/modules/invoices/components/SenderProfileForm.svelte';
</script>

<svelte:head>
	<title>Rechnungs-Einstellungen — Mana</title>
</svelte:head>

<div class="pane">
	<header class="bar">
		<div class="title">
			<strong>Rechnungs-Einstellungen</strong>
			<span class="sub">Absender, Nummernkreis und Standards</span>
		</div>
	</header>
	<SenderProfileForm />
</div>

<style>
	.pane {
		max-width: 720px;
		margin: 0 auto;
		padding: 1rem;
		color: hsl(var(--color-foreground));
	}
	.bar {
		margin-bottom: 1rem;
	}
	.bar .title strong {
		font-size: 1rem;
		font-weight: 600;
	}
	.bar .sub {
		margin-left: 0.5rem;
		font-size: 0.8125rem;
		color: hsl(var(--color-muted-foreground));
	}
</style>
