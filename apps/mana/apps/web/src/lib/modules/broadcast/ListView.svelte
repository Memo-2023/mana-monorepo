<!--
  Broadcast — ListView (M7)
  Stats cards + status filter chips + search + row navigation.
-->
<script lang="ts">
	import { goto } from '$app/navigation';
	import { useAllCampaigns, computeStats, searchCampaigns, formatRate } from './queries';
	import { STATUS_COLORS } from './constants';
	import type { CampaignStatus } from './types';
	import { _ } from 'svelte-i18n';

	const campaigns$ = useAllCampaigns();
	const campaigns = $derived(campaigns$.value ?? []);

	let activeStatus = $state<CampaignStatus | 'all'>('all');
	let searchQuery = $state('');

	const currentYear = new Date().getFullYear();
	const stats = $derived(computeStats(campaigns, currentYear));

	const filtered = $derived.by(() => {
		let out = campaigns;
		if (activeStatus !== 'all') out = out.filter((c) => c.status === activeStatus);
		if (searchQuery.trim()) out = searchCampaigns(out, searchQuery.trim());
		return out;
	});

	function openCampaign(id: string, status: string) {
		if (status === 'draft') goto(`/broadcasts/${id}/edit`);
		else goto(`/broadcasts/${id}`);
	}

	function onNewCampaign() {
		goto('/broadcasts/new');
	}
</script>

<div class="broadcast-shell">
	<header class="head">
		<div>
			<h1>{$_('broadcast.list_view.title')}</h1>
			<p class="subtitle">{$_('broadcast.list_view.subtitle')}</p>
		</div>
		<div class="head-actions">
			<button
				class="btn-icon"
				type="button"
				title={$_('broadcast.list_view.action_settings')}
				aria-label={$_('broadcast.list_view.action_settings')}
				onclick={() => goto('/broadcasts/settings')}
			>
				⚙
			</button>
			<button class="btn-primary" type="button" onclick={onNewCampaign}>
				{$_('broadcast.list_view.action_new')}
			</button>
		</div>
	</header>

	{#if campaigns.length > 0}
		<section class="stats">
			<div class="stat">
				<div class="stat-label">
					{$_('broadcast.list_view.stat_sent_year', { values: { year: currentYear } })}
				</div>
				<div class="stat-value">{stats.sentThisYear}</div>
				<div class="stat-sub">{$_('broadcast.list_view.stat_campaigns')}</div>
			</div>
			<div class="stat">
				<div class="stat-label">{$_('broadcast.list_view.stat_avg_open')}</div>
				<div class="stat-value">{formatRate(stats.avgOpenRate)}</div>
				<div class="stat-sub">{$_('broadcast.list_view.stat_over_all')}</div>
			</div>
			<div class="stat">
				<div class="stat-label">{$_('broadcast.list_view.stat_avg_click')}</div>
				<div class="stat-value">{formatRate(stats.avgClickRate)}</div>
				<div class="stat-sub">{$_('broadcast.list_view.stat_over_all')}</div>
			</div>
			<div class="stat">
				<div class="stat-label">{$_('broadcast.list_view.stat_drafts')}</div>
				<div class="stat-value">{stats.totalByStatus.draft}</div>
				<div class="stat-sub">{$_('broadcast.list_view.stat_drafts_sub')}</div>
			</div>
		</section>

		<section class="filters">
			<div class="chips">
				<button
					class="chip"
					class:active={activeStatus === 'all'}
					onclick={() => (activeStatus = 'all')}
				>
					{$_('broadcast.list_view.chip_all')} <span class="count">{campaigns.length}</span>
				</button>
				{#each ['draft', 'scheduled', 'sending', 'sent', 'cancelled'] as status (status)}
					<button
						class="chip"
						class:active={activeStatus === status}
						onclick={() => (activeStatus = status as CampaignStatus)}
					>
						{$_('broadcast.statuses.' + status)}
						<span class="count">{stats.totalByStatus[status as CampaignStatus]}</span>
					</button>
				{/each}
			</div>
			<input
				class="search"
				type="search"
				placeholder={$_('broadcast.list_view.search_placeholder')}
				bind:value={searchQuery}
			/>
		</section>
	{/if}

	{#if campaigns.length === 0}
		<div class="empty">
			<div class="empty-icon">📣</div>
			<h2>{$_('broadcast.list_view.empty_heading')}</h2>
			<p>
				{$_('broadcast.list_view.empty_body')}
			</p>
			<button class="btn-primary" onclick={onNewCampaign}
				>{$_('broadcast.list_view.empty_action')}</button
			>
		</div>
	{:else if filtered.length === 0}
		<div class="empty">
			<p>{$_('broadcast.list_view.empty_no_match')}</p>
		</div>
	{:else}
		<ul class="list" role="list">
			{#each filtered as campaign (campaign.id)}
				{@const openRate =
					campaign.stats && campaign.stats.sent > 0
						? campaign.stats.opened / campaign.stats.sent
						: null}
				<li>
					<button class="row" onclick={() => openCampaign(campaign.id, campaign.status)}>
						<span class="subject">
							<span class="campaign-name">{campaign.name}</span>
							{#if campaign.subject}
								<span class="campaign-subject">{campaign.subject}</span>
							{/if}
						</span>
						<span class="recipient-count">
							{$_('broadcast.list_view.row_recipients', {
								values: { n: campaign.audience?.estimatedCount ?? 0 },
							})}
						</span>
						{#if campaign.status === 'sent' && openRate !== null}
							<span class="open-rate" title={$_('broadcast.list_view.row_open_rate_title')}>
								{formatRate(openRate)} 👀
							</span>
						{:else}
							<span class="open-rate empty-rate">—</span>
						{/if}
						<span class="status" style="--dot: {STATUS_COLORS[campaign.status]}">
							<span class="dot"></span>
							{$_('broadcast.statuses.' + campaign.status)}
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
		max-width: 1100px;
		margin: 0 auto;
	}

	.head {
		display: flex;
		justify-content: space-between;
		align-items: flex-end;
		margin-bottom: 1.5rem;
		gap: 1rem;
		flex-wrap: wrap;
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

	.head-actions {
		display: flex;
		gap: 0.5rem;
		align-items: center;
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

	.btn-icon {
		width: 2.25rem;
		height: 2.25rem;
		background: white;
		border: 1px solid var(--color-border, #e2e8f0);
		border-radius: 0.4rem;
		cursor: pointer;
		font-size: 1rem;
	}

	.stats {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
		gap: 0.75rem;
		margin-bottom: 1rem;
	}

	.stat {
		padding: 0.9rem 1rem;
		background: var(--color-surface, #fff);
		border: 1px solid var(--color-border, #e2e8f0);
		border-radius: 0.5rem;
	}

	.stat-label {
		font-size: 0.8rem;
		color: var(--color-text-muted, #64748b);
		text-transform: uppercase;
		letter-spacing: 0.03em;
	}

	.stat-value {
		margin-top: 0.25rem;
		font-size: 1.3rem;
		font-weight: 600;
		font-variant-numeric: tabular-nums;
	}

	.stat-sub {
		margin-top: 0.15rem;
		font-size: 0.8rem;
		color: var(--color-text-muted, #64748b);
	}

	.filters {
		display: flex;
		gap: 1rem;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 1rem;
		flex-wrap: wrap;
	}

	.chips {
		display: flex;
		gap: 0.4rem;
		flex-wrap: wrap;
	}

	.chip {
		display: inline-flex;
		align-items: center;
		gap: 0.35rem;
		padding: 0.35rem 0.75rem;
		background: white;
		border: 1px solid var(--color-border, #e2e8f0);
		border-radius: 999px;
		cursor: pointer;
		font-size: 0.85rem;
	}

	.chip.active {
		background: #4338ca;
		color: white;
		border-color: #4338ca;
	}

	.chip .count {
		background: rgba(0, 0, 0, 0.08);
		padding: 0 0.4rem;
		border-radius: 999px;
		font-size: 0.75rem;
	}

	.chip.active .count {
		background: rgba(255, 255, 255, 0.2);
	}

	.search {
		padding: 0.45rem 0.75rem;
		border: 1px solid var(--color-border, #e2e8f0);
		border-radius: 0.4rem;
		font-size: 0.9rem;
		min-width: 240px;
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
		grid-template-columns: 1fr auto 6rem 9rem;
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

	.open-rate {
		font-size: 0.85rem;
		font-variant-numeric: tabular-nums;
		text-align: right;
	}

	.empty-rate {
		color: var(--color-text-muted, #94a3b8);
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
