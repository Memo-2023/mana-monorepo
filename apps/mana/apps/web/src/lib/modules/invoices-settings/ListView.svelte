<!--
  Invoices → Settings — workbench card.

  Wraps SenderProfileForm so the standalone route
  (/invoices/settings) and the workbench card share the same UI.
-->
<script lang="ts">
	import SenderProfileForm from '$lib/modules/invoices/components/SenderProfileForm.svelte';
</script>

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
