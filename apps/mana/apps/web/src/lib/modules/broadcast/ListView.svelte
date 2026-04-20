<!--
  Broadcast — ListView (M2)
  Real campaign list + working "+ Neue Kampagne" entry point. Stats
  cards, filter chips, and search land in M7.
-->
<script lang="ts">
	import { goto } from '$app/navigation';
	import { useAllCampaigns } from './queries';
	import { STATUS_LABELS, STATUS_COLORS } from './constants';

	const campaigns$ = useAllCampaigns();
	const campaigns = $derived(campaigns$.value ?? []);

	function openCampaign(id: string, status: string) {
		// Drafts go straight to edit; sent/scheduled to a detail view
		// (detail lands in M7; until then, edit is the entry for drafts
		// and we bounce sent ones back to the list — see canEdit guard
		// in the edit route).
		if (status === 'draft') goto(`/broadcasts/${id}/edit`);
		else goto(`/broadcasts/${id}/edit`);
	}

	function onNewCampaign() {
		goto('/broadcasts/new');
	}
</script>

<div class="broadcast-shell">
	<header class="head">
		<div>
			<h1>Broadcasts</h1>
			<p class="subtitle">Newsletter und Kampagnen an deine Kontakte</p>
		</div>
		<button class="btn-primary" type="button" onclick={onNewCampaign}>+ Neue Kampagne</button>
	</header>

	{#if campaigns.length === 0}
		<div class="empty">
			<div class="empty-icon">📣</div>
			<h2>Noch keine Kampagnen</h2>
			<p>
				Verschicke deinen ersten Newsletter — mit Rich-Text-Editor, Tracking und DSGVO-konformem
				Abmelden.
			</p>
			<button class="btn-primary" onclick={onNewCampaign}>Erste Kampagne</button>
		</div>
	{:else}
		<ul class="list" role="list">
			{#each campaigns as campaign (campaign.id)}
				<li>
					<button class="row" onclick={() => openCampaign(campaign.id, campaign.status)}>
						<span class="subject">
							<span class="campaign-name">{campaign.name}</span>
							{#if campaign.subject}
								<span class="campaign-subject">{campaign.subject}</span>
							{/if}
						</span>
						<span class="recipient-count">
							{campaign.audience?.estimatedCount ?? 0} Empfänger
						</span>
						<span class="status" style="--dot: {STATUS_COLORS[campaign.status]}">
							<span class="dot"></span>
							{STATUS_LABELS[campaign.status].de}
						</span>
					</button>
				</li>
			{/each}
		</ul>
	{/if}
</div>

<style>
	.broadcast-shell {
		padding: 1.5rem;
		max-width: 1000px;
		margin: 0 auto;
	}

	.head {
		display: flex;
		justify-content: space-between;
		align-items: flex-end;
		margin-bottom: 1.5rem;
	}

	.head h1 {
		margin: 0;
		font-size: 1.75rem;
		font-weight: 600;
	}

	.subtitle {
		margin: 0.25rem 0 0;
		color: var(--color-text-muted, #64748b);
		font-size: 0.9rem;
	}

	.btn-primary {
		background: #6366f1;
		color: white;
		padding: 0.55rem 1.1rem;
		border-radius: 0.5rem;
		border: 0;
		font-weight: 500;
		cursor: pointer;
		font-size: 0.95rem;
	}

	.empty {
		text-align: center;
		padding: 4rem 1rem;
		color: var(--color-text-muted, #64748b);
	}

	.empty-icon {
		font-size: 3rem;
		margin-bottom: 0.75rem;
	}

	.empty h2 {
		margin: 0 0 0.5rem;
		font-size: 1.15rem;
		font-weight: 500;
		color: var(--color-text, #0f172a);
	}

	.empty p {
		margin: 0.25rem 0 1rem;
		font-size: 0.9rem;
	}

	.list {
		list-style: none;
		padding: 0;
		margin: 0;
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.row {
		display: grid;
		grid-template-columns: 1fr auto 9rem;
		gap: 1rem;
		align-items: center;
		width: 100%;
		padding: 0.75rem 1rem;
		background: var(--color-surface, #fff);
		border: 1px solid var(--color-border, #e2e8f0);
		border-radius: 0.5rem;
		cursor: pointer;
		text-align: left;
		font: inherit;
	}

	.row:hover {
		border-color: #6366f1;
		background: #eef2ff;
	}

	.subject {
		display: flex;
		flex-direction: column;
		min-width: 0;
	}

	.campaign-name {
		font-weight: 500;
	}

	.campaign-subject {
		font-size: 0.8rem;
		color: var(--color-text-muted, #64748b);
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.recipient-count {
		font-size: 0.85rem;
		color: var(--color-text-muted, #64748b);
	}

	.status {
		display: inline-flex;
		align-items: center;
		gap: 0.4rem;
		font-size: 0.85rem;
	}

	.status .dot {
		width: 8px;
		height: 8px;
		border-radius: 50%;
		background: var(--dot);
	}
</style>
