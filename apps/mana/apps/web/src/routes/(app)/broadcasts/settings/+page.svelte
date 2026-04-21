<script lang="ts">
	import SettingsForm from '$lib/modules/broadcast/components/SettingsForm.svelte';
</script>

<svelte:head>
	<title>Broadcast-Einstellungen - Mana</title>
</svelte:head>

<div class="page">
	<header class="head">
		<h1>Broadcast-Einstellungen</h1>
		<p class="subtitle">Sender-Defaults, Impressum und Footer für alle neuen Kampagnen.</p>
	</header>

	<SettingsForm />
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
