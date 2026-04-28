<script lang="ts">
	import { page } from '$app/stores';
	import { useAllCampaigns } from '$lib/modules/broadcasts/queries';
	import ComposeView from '$lib/modules/broadcasts/views/ComposeView.svelte';
	import { RoutePage } from '$lib/components/shell';

	const campaigns$ = useAllCampaigns();
	const campaigns = $derived(campaigns$.value ?? []);
	const id = $derived($page.params.id);
	const campaign = $derived(campaigns.find((c) => c.id === id));
	const canEdit = $derived(campaign?.status === 'draft');
</script>

<svelte:head>
	<title>{campaign?.name ?? 'Kampagne'} - Mana</title>
</svelte:head>

<RoutePage appId="broadcasts" backHref="/broadcasts" title="Broadcast">
	{#if !campaign && campaigns$.value !== undefined}
		<div class="not-found">
			<p>Kampagne nicht gefunden.</p>
			<a href="/broadcasts">Zurück zur Übersicht</a>
		</div>
	{:else if campaign && !canEdit}
		<div class="not-editable">
			<h2>Kampagne kann nicht bearbeitet werden</h2>
			<p>
				Status: <strong>{campaign.status}</strong>. Nur Entwürfe sind editierbar. Dupliziere die
				Kampagne, um eine neue Version zu erstellen.
			</p>
			<a href="/broadcasts">Zurück</a>
		</div>
	{:else if campaign}
		<ComposeView existing={campaign} />
	{:else}
		<div class="loading">Lädt …</div>
	{/if}
</RoutePage>

<style>
	.not-found,
	.loading,
	.not-editable {
		padding: 3rem 1rem;
		text-align: center;
		color: var(--color-text-muted, #64748b);
	}

	.not-editable h2 {
		color: var(--color-text, #0f172a);
	}

	.not-editable p {
		max-width: 40ch;
		margin: 0.5rem auto;
	}
</style>
