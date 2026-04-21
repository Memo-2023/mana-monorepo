<!--
  Broadcast → Settings — workbench card.

  Wraps the existing SettingsForm so both the standalone route
  (/broadcasts/settings) and the workbench card render the same UI.
-->
<script lang="ts">
	import SettingsForm from '$lib/modules/broadcast/components/SettingsForm.svelte';
</script>

<div class="pane">
	<header class="bar">
		<div class="title">
			<strong>Broadcast-Einstellungen</strong>
			<span class="sub">Sender-Defaults, Impressum und Footer</span>
		</div>
	</header>
	<SettingsForm />
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
