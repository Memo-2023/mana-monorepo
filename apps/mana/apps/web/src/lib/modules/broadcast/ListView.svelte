<!--
  Broadcast — ListView (M1 skeleton)
  Empty state + "+ Neue Kampagne"-button placeholder. Real list, filters,
  and stats cards land in M2/M7. Plan: docs/plans/broadcast-module.md.
-->
<script lang="ts">
	import { useLiveQueryWithDefault } from '@mana/local-store/svelte';
	import { decryptRecords } from '$lib/data/crypto';
	import { scopedForModule } from '$lib/data/scope';
	import { STATUS_LABELS, STATUS_COLORS } from './constants';
	import type { LocalCampaign } from './types';

	const campaigns$ = useLiveQueryWithDefault(async () => {
		const rows = await scopedForModule<LocalCampaign, string>(
			'broadcast',
			'broadcastCampaigns'
		).toArray();
		const visible = rows.filter((r) => !r.deletedAt);
		return (await decryptRecords('broadcastCampaigns', visible)) as LocalCampaign[];
	}, [] as LocalCampaign[]);
	const campaigns = $derived(campaigns$.value ?? []);
</script>

<div class="broadcast-shell">
	<header class="head">
		<div>
			<h1>Broadcasts</h1>
			<p class="subtitle">Newsletter und Kampagnen an deine Kontakte</p>
		</div>
		<button class="btn-primary" type="button" disabled title="M2">+ Neue Kampagne</button>
	</header>

	{#if campaigns.length === 0}
		<div class="empty">
			<div class="empty-icon">📣</div>
			<h2>Noch keine Kampagnen</h2>
			<p>
				Verschicke deinen ersten Newsletter — mit Rich-Text-Editor, Tracking und DSGVO-konformem
				Abmelden.
			</p>
			<p class="note">M1 Skelett — Compose-Flow folgt in M2.</p>
		</div>
	{:else}
		<ul class="list">
			{#each campaigns as campaign (campaign.id)}
				<li class="row">
					<span class="subject">{campaign.subject}</span>
					<span class="recipient-count">
						{campaign.audience?.estimatedCount ?? 0} Empfänger
					</span>
					<span class="status" style="--dot: {STATUS_COLORS[campaign.status]}">
						<span class="dot"></span>
						{STATUS_LABELS[campaign.status].de}
					</span>
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
		padding: 0.5rem 1rem;
		border-radius: 0.5rem;
		border: 0;
		font-weight: 500;
		cursor: pointer;
	}

	.btn-primary:disabled {
		opacity: 0.5;
		cursor: not-allowed;
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
		margin: 0.25rem 0;
		font-size: 0.9rem;
	}

	.note {
		margin-top: 1rem !important;
		font-size: 0.8rem;
		opacity: 0.7;
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
		grid-template-columns: 1fr auto 8rem;
		gap: 1rem;
		align-items: center;
		padding: 0.75rem 1rem;
		background: var(--color-surface, #fff);
		border: 1px solid var(--color-border, #e2e8f0);
		border-radius: 0.5rem;
	}

	.subject {
		font-weight: 500;
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
