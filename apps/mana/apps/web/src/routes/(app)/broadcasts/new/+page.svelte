<!--
  /broadcasts/new — bootstraps a fresh draft and redirects to its
  edit view. Keeps the ComposeView stateful-only (no create/edit
  bifurcation inside the component itself).
-->
<script lang="ts">
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { broadcastCampaignsStore } from '$lib/modules/broadcasts/stores/campaigns.svelte';
	import { RoutePage } from '$lib/components/shell';

	let error = $state<string | null>(null);

	onMount(async () => {
		try {
			const id = await broadcastCampaignsStore.createCampaign();
			goto(`/broadcasts/${id}/edit`, { replaceState: true });
		} catch (e) {
			error = e instanceof Error ? e.message : 'Erstellen fehlgeschlagen';
		}
	});
</script>

<svelte:head>
	<title>Neue Kampagne - Mana</title>
</svelte:head>

<RoutePage appId="broadcasts" backHref="/broadcasts">
	<div class="page">
		{#if error}
			<div class="error">{error}</div>
			<a href="/broadcasts">Zurück</a>
		{:else}
			<p class="loading">Kampagne wird angelegt …</p>
		{/if}
	</div>
</RoutePage>

<style>
	.page {
		padding: 3rem 1.5rem;
		text-align: center;
		color: var(--color-text-muted, #64748b);
	}

	.error {
		background: #fef2f2;
		border: 1px solid #fecaca;
		color: #991b1b;
		padding: 1rem;
		border-radius: 0.5rem;
		margin-bottom: 1rem;
	}

	.loading {
		margin: 0;
	}
</style>
