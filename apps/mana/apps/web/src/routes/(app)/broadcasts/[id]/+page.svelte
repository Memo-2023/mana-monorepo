<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { useAllCampaigns } from '$lib/modules/broadcasts/queries';
	import DetailView from '$lib/modules/broadcasts/views/DetailView.svelte';
	import { RoutePage } from '$lib/components/shell';

	const campaigns$ = useAllCampaigns();
	const campaigns = $derived(campaigns$.value ?? []);
	const id = $derived($page.params.id);
	const campaign = $derived(campaigns.find((c) => c.id === id));

	// Drafts bounce straight to the edit route — Compose is the
	// canonical view for drafts; DetailView is read-only for sent /
	// scheduled / cancelled.
	$effect(() => {
		if (campaign?.status === 'draft') {
			goto(`/broadcasts/${campaign.id}/edit`, { replaceState: true });
		}
	});
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
	{:else if campaign && campaign.status !== 'draft'}
		<DetailView {campaign} />
	{:else}
		<div class="loading">Lädt …</div>
	{/if}
</RoutePage>

<style>
	.not-found,
	.loading {
		padding: 3rem 1rem;
		text-align: center;
		color: var(--color-text-muted, #64748b);
	}
</style>
