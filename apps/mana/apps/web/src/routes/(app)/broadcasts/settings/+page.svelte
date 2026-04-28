<!--
  /broadcasts/settings — sender defaults, impressum, footer for new campaigns.
  Reached via the ⚙ button in the broadcast module; not a workbench card.
-->
<script lang="ts">
	import SettingsForm from '$lib/modules/broadcasts/components/SettingsForm.svelte';
	import { RoutePage } from '$lib/components/shell';
</script>

<svelte:head>
	<title>Broadcast-Einstellungen — Mana</title>
</svelte:head>

<RoutePage appId="broadcasts" backHref="/broadcasts">
	<div class="pane">
		<header class="bar">
			<div class="title">
				<strong>Broadcast-Einstellungen</strong>
				<span class="sub">Sender-Defaults, Impressum und Footer</span>
			</div>
		</header>
		<SettingsForm />
	</div>
</RoutePage>

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
