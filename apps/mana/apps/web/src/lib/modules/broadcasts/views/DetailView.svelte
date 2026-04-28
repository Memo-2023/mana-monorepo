<!--
  DetailView — read-only view for sent / scheduled / cancelled campaigns.
  Drafts still route to /broadcasts/[id]/edit (editable).

  Polls mana-mail for live tracking stats every 30s when a campaign is
  in 'sent' state. Stops polling after 30 minutes (diminishing returns)
  or when the tab loses focus.
-->
<script lang="ts">
	import { onDestroy, untrack } from 'svelte';
	import { goto } from '$app/navigation';
	import { STATUS_COLORS } from '../constants';
	import { _ } from 'svelte-i18n';
	import { get } from 'svelte/store';
	import { locale } from 'svelte-i18n';
	import { formatRate } from '../queries';
	import { broadcastCampaignsStore } from '../stores/campaigns.svelte';
	import { fetchCampaignStats } from '../api';
	import EmailPreview from '../preview/EmailPreview.svelte';
	import { broadcastSettingsStore } from '../stores/settings.svelte';
	import { renderEmailHtml } from '../render/email-html';
	import type { Campaign, BroadcastSettings, CampaignStats } from '../types';

	interface Props {
		campaign: Campaign;
	}

	let { campaign }: Props = $props();

	// Seed from the current campaign row; polling takes over after mount.
	// Route-level key ensures we remount when the id changes.
	let liveStats = $state<CampaignStats | null>(untrack(() => campaign.stats));
	let pollError = $state<string | null>(null);
	let settings = $state<BroadcastSettings | null>(null);
	let polling = $state(false);

	$effect(() => {
		broadcastSettingsStore.get().then((s) => {
			settings = s;
		});
	});

	// Poll stats for sent campaigns. 30s interval, max 30 minutes.
	// Stops earlier if the sum of opens/clicks stabilises (not
	// implemented yet — would need a 2-tick compare).
	$effect(() => {
		if (campaign.status !== 'sent') return;
		let cancelled = false;
		const pollStartedAt = Date.now();
		const POLL_INTERVAL_MS = 30_000;
		const POLL_TIMEOUT_MS = 30 * 60_000;

		async function poll() {
			if (cancelled) return;
			if (Date.now() - pollStartedAt > POLL_TIMEOUT_MS) return;
			polling = true;
			try {
				const stats = await fetchCampaignStats(campaign.id);
				if (stats && !cancelled) {
					liveStats = stats;
					// Persist back to Dexie so the list view + widget see
					// the updated numbers without hitting the server again.
					await broadcastCampaignsStore.applyServerStatus(campaign.id, {
						status: campaign.status,
						stats,
					});
				}
			} catch (e) {
				if (!cancelled)
					pollError =
						e instanceof Error ? e.message : $_('broadcast.detail_view.poll_error_prefix');
			} finally {
				polling = false;
			}
			if (!cancelled) setTimeout(poll, POLL_INTERVAL_MS);
		}

		poll();
		return () => {
			cancelled = true;
		};
	});

	const openRate = $derived(
		liveStats && liveStats.sent > 0 ? liveStats.opened / liveStats.sent : null
	);
	const clickRate = $derived(
		liveStats && liveStats.sent > 0 ? liveStats.clicked / liveStats.sent : null
	);
	const bounceRate = $derived(
		liveStats && liveStats.sent > 0 ? liveStats.bounced / liveStats.sent : null
	);
	const unsubRate = $derived(
		liveStats && liveStats.sent > 0 ? liveStats.unsubscribed / liveStats.sent : null
	);

	const previewHtml = $derived(
		settings
			? renderEmailHtml({
					tiptapHtml: campaign.content.html ?? '',
					campaign: {
						subject: campaign.subject,
						preheader: campaign.preheader,
						fromName: campaign.fromName,
						fromEmail: campaign.fromEmail,
					},
					settings,
				})
			: ''
	);

	async function onDuplicate() {
		const newId = await broadcastCampaignsStore.duplicate(campaign.id);
		goto(`/broadcasts/${newId}/edit`);
	}

	async function onCancel() {
		if (!confirm($_('broadcast.detail_view.confirm_cancel_scheduled'))) return;
		await broadcastCampaignsStore.cancel(campaign.id);
	}

	onDestroy(() => {
		// $effect cleanup already handles cancellation — this is a safety net.
	});
</script>

<article class="detail">
	<header class="head">
		<div class="head-left">
			<h1>{campaign.name}</h1>
			<span class="status" style="--dot: {STATUS_COLORS[campaign.status]}">
				<span class="dot"></span>
				{$_('broadcast.statuses.' + campaign.status)}
			</span>
			<p class="subject">{campaign.subject}</p>
		</div>
		<div class="head-right">
			{#if campaign.sentAt}
				<div class="sent-at">
					{$_('broadcast.detail_view.sent_at', {
						values: { date: new Date(campaign.sentAt).toLocaleString(get(locale) ?? 'de') },
					})}
				</div>
			{/if}
			{#if campaign.scheduledAt}
				<div class="sent-at">
					{$_('broadcast.detail_view.scheduled_for', {
						values: { date: new Date(campaign.scheduledAt).toLocaleString(get(locale) ?? 'de') },
					})}
				</div>
			{/if}
		</div>
	</header>

	<div class="actions">
		<button class="btn" onclick={onDuplicate}>{$_('broadcast.detail_view.action_duplicate')}</button
		>
		{#if campaign.status === 'scheduled'}
			<button class="btn btn-danger" onclick={onCancel}
				>{$_('broadcast.detail_view.action_cancel')}</button
			>
		{/if}
		<a class="btn" href="/broadcasts">{$_('broadcast.detail_view.action_overview')}</a>
	</div>

	{#if liveStats}
		<section class="stats-grid">
			<div class="stat">
				<div class="stat-label">{$_('broadcast.detail_view.stat_sent')}</div>
				<div class="stat-value">{liveStats.sent}</div>
				<div class="stat-sub">
					{$_('broadcast.detail_view.stat_sent_sub', {
						values: { n: liveStats.totalRecipients },
					})}
				</div>
			</div>
			<div class="stat">
				<div class="stat-label">{$_('broadcast.detail_view.stat_opened')}</div>
				<div class="stat-value">{formatRate(openRate)}</div>
				<div class="stat-sub">
					{$_('broadcast.detail_view.stat_opened_sub', { values: { n: liveStats.opened } })}
				</div>
			</div>
			<div class="stat">
				<div class="stat-label">{$_('broadcast.detail_view.stat_clicked')}</div>
				<div class="stat-value">{formatRate(clickRate)}</div>
				<div class="stat-sub">
					{$_('broadcast.detail_view.stat_clicked_sub', { values: { n: liveStats.clicked } })}
				</div>
			</div>
			<div class="stat" class:stat-warn={liveStats.bounced > 0}>
				<div class="stat-label">{$_('broadcast.detail_view.stat_bounced')}</div>
				<div class="stat-value">{formatRate(bounceRate)}</div>
				<div class="stat-sub">{liveStats.bounced}</div>
			</div>
			<div class="stat" class:stat-warn={liveStats.unsubscribed > 0}>
				<div class="stat-label">{$_('broadcast.detail_view.stat_unsubscribed')}</div>
				<div class="stat-value">{formatRate(unsubRate)}</div>
				<div class="stat-sub">{liveStats.unsubscribed}</div>
			</div>
		</section>

		<p class="poll-hint">
			{#if polling}
				{$_('broadcast.detail_view.poll_live')}
			{:else}
				{$_('broadcast.detail_view.poll_last_update', {
					values: {
						time: new Date(liveStats.lastSyncedAt).toLocaleTimeString(get(locale) ?? 'de'),
					},
				})}
			{/if}
		</p>
	{/if}

	{#if pollError}
		<div class="poll-error">
			{$_('broadcast.detail_view.poll_error_inline', { values: { error: pollError } })}
		</div>
	{/if}

	{#if settings && previewHtml}
		<section class="preview-section">
			<h3>{$_('broadcast.detail_view.section_preview')}</h3>
			<EmailPreview html={previewHtml} viewport="desktop" />
		</section>
	{/if}
</article>

<style>
	.detail {
		max-width: 900px;
		margin: 0 auto;
		padding: 1.5rem;
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}

	.head {
		display: flex;
		justify-content: space-between;
		align-items: flex-end;
		gap: 1rem;
		flex-wrap: wrap;
	}

	.head-left,
	.head-right {
		display: flex;
		flex-direction: column;
		gap: 0.35rem;
	}

	.head-right {
		align-items: flex-end;
	}

	.head h1 {
		margin: 0;
		font-size: 1.5rem;
		font-weight: 600;
	}

	.subject {
		margin: 0;
		font-size: 0.95rem;
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

	.sent-at {
		font-size: 0.85rem;
		color: var(--color-text-muted, #64748b);
	}

	.actions {
		display: flex;
		gap: 0.5rem;
	}

	.btn {
		padding: 0.5rem 1rem;
		background: white;
		border: 1px solid var(--color-border, #e2e8f0);
		border-radius: 0.4rem;
		cursor: pointer;
		font-size: 0.9rem;
		color: var(--color-text, #0f172a);
		text-decoration: none;
	}

	.btn-danger {
		color: #b91c1c;
		border-color: #fecaca;
	}

	.stats-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
		gap: 0.75rem;
	}

	.stat {
		background: var(--color-surface, #fff);
		border: 1px solid var(--color-border, #e2e8f0);
		border-radius: 0.5rem;
		padding: 0.9rem 1rem;
	}

	.stat-warn {
		border-color: #fecaca;
		background: #fef2f2;
	}

	.stat-label {
		font-size: 0.8rem;
		color: var(--color-text-muted, #64748b);
		text-transform: uppercase;
		letter-spacing: 0.03em;
	}

	.stat-value {
		margin-top: 0.25rem;
		font-size: 1.5rem;
		font-weight: 600;
		font-variant-numeric: tabular-nums;
	}

	.stat-warn .stat-value {
		color: #b91c1c;
	}

	.stat-sub {
		margin-top: 0.15rem;
		font-size: 0.8rem;
		color: var(--color-text-muted, #64748b);
	}

	.poll-hint {
		margin: -0.5rem 0 0;
		font-size: 0.8rem;
		color: var(--color-text-muted, #64748b);
		text-align: center;
	}

	.poll-error {
		background: #fef2f2;
		border: 1px solid #fecaca;
		color: #991b1b;
		padding: 0.6rem 0.9rem;
		border-radius: 0.4rem;
		font-size: 0.85rem;
	}

	.preview-section {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.preview-section h3 {
		margin: 0;
		font-size: 0.95rem;
		font-weight: 600;
		color: var(--color-text-muted, #64748b);
		text-transform: uppercase;
		letter-spacing: 0.02em;
	}
</style>
