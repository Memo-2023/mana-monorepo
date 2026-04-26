/**
 * Reactive queries and pure helpers for the Broadcast module.
 *
 * Live queries decrypt + map to domain types, consistent with the
 * invoices / library modules. Scope-wrapping via `scopedForModule`
 * matches the post-Spaces convention so lists respect the active space.
 */

import { useScopedLiveQuery } from '$lib/data/scope/use-scoped-live-query.svelte';
import { deriveUpdatedAt } from '$lib/data/sync';
import { decryptRecords } from '$lib/data/crypto';
import { scopedForModule } from '$lib/data/scope';
import { campaignTable, templateTable, settingsTable } from './collections';
import { BROADCAST_SETTINGS_ID } from './constants';
import type {
	LocalCampaign,
	LocalBroadcastTemplate,
	LocalBroadcastSettings,
	Campaign,
	BroadcastTemplate,
	BroadcastSettings,
	CampaignStatus,
} from './types';

// ─── Type Converters ─────────────────────────────────────

export function toCampaign(local: LocalCampaign): Campaign {
	const now = new Date().toISOString();
	return {
		id: local.id,
		name: local.name,
		subject: local.subject,
		preheader: local.preheader ?? null,
		fromName: local.fromName,
		fromEmail: local.fromEmail,
		replyTo: local.replyTo ?? null,
		content: local.content,
		templateId: local.templateId ?? null,
		audience: local.audience,
		scheduledAt: local.scheduledAt ?? null,
		sentAt: local.sentAt ?? null,
		status: local.status,
		serverJobId: local.serverJobId ?? null,
		stats: local.stats ?? null,
		createdAt: local.createdAt ?? now,
		updatedAt: deriveUpdatedAt(local),
	};
}

export function toTemplate(local: LocalBroadcastTemplate): BroadcastTemplate {
	const now = new Date().toISOString();
	return {
		id: local.id,
		name: local.name,
		description: local.description ?? null,
		subject: local.subject ?? null,
		content: local.content,
		isBuiltIn: local.isBuiltIn,
		thumbnailUrl: local.thumbnailUrl ?? null,
		createdAt: local.createdAt ?? now,
	};
}

export function toSettings(local: LocalBroadcastSettings): BroadcastSettings {
	return {
		id: local.id,
		defaultFromName: local.defaultFromName ?? '',
		defaultFromEmail: local.defaultFromEmail ?? '',
		defaultReplyTo: local.defaultReplyTo ?? null,
		defaultFooter: local.defaultFooter ?? null,
		dnsCheck: local.dnsCheck ?? null,
		legalAddress: local.legalAddress ?? '',
		unsubscribeLandingCopy: local.unsubscribeLandingCopy ?? null,
	};
}

// ─── Live Queries ────────────────────────────────────────

/** All campaigns in the active space, newest first by updatedAt. */
export function useAllCampaigns() {
	return useScopedLiveQuery(async () => {
		const rows = await scopedForModule<LocalCampaign, string>(
			'broadcast',
			'broadcastCampaigns'
		).toArray();
		const visible = rows.filter((r) => !r.deletedAt);
		const decrypted = (await decryptRecords('broadcastCampaigns', visible)) as LocalCampaign[];
		return decrypted.map(toCampaign).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
	}, [] as Campaign[]);
}

export function useAllTemplates() {
	return useScopedLiveQuery(async () => {
		const rows = await scopedForModule<LocalBroadcastTemplate, string>(
			'broadcast',
			'broadcastTemplates'
		).toArray();
		const visible = rows.filter((r) => !r.deletedAt);
		const decrypted = (await decryptRecords(
			'broadcastTemplates',
			visible
		)) as LocalBroadcastTemplate[];
		return decrypted.map(toTemplate);
	}, [] as BroadcastTemplate[]);
}

// ─── Pure Helpers ────────────────────────────────────────

export function filterByStatus(campaigns: Campaign[], status: CampaignStatus): Campaign[] {
	return campaigns.filter((c) => c.status === status);
}

export function searchCampaigns(campaigns: Campaign[], query: string): Campaign[] {
	const q = query.toLowerCase();
	return campaigns.filter(
		(c) => c.name.toLowerCase().includes(q) || c.subject.toLowerCase().includes(q)
	);
}

// ─── Stats ───────────────────────────────────────────────

export interface BroadcastStats {
	totalByStatus: Record<CampaignStatus, number>;
	sentThisYear: number;
	avgOpenRate: number | null;
	avgClickRate: number | null;
	totalSubscribers: number;
}

export function computeStats(campaigns: Campaign[], year: number): BroadcastStats {
	const totalByStatus: Record<CampaignStatus, number> = {
		draft: 0,
		scheduled: 0,
		sending: 0,
		sent: 0,
		cancelled: 0,
	};
	let sentThisYear = 0;
	let openRateSum = 0;
	let openRateCount = 0;
	let clickRateSum = 0;
	let clickRateCount = 0;
	const yearPrefix = String(year);

	for (const c of campaigns) {
		totalByStatus[c.status]++;
		if (c.status === 'sent' && c.sentAt?.startsWith(yearPrefix)) {
			sentThisYear++;
		}
		if (c.stats && c.stats.sent > 0) {
			const openRate = c.stats.opened / c.stats.sent;
			const clickRate = c.stats.clicked / c.stats.sent;
			openRateSum += openRate;
			openRateCount++;
			clickRateSum += clickRate;
			clickRateCount++;
		}
	}

	return {
		totalByStatus,
		sentThisYear,
		avgOpenRate: openRateCount > 0 ? openRateSum / openRateCount : null,
		avgClickRate: clickRateCount > 0 ? clickRateSum / clickRateCount : null,
		totalSubscribers: 0, // TODO M7: derive from unique recipients across all campaigns
	};
}

// ─── Formatting ──────────────────────────────────────────

/** Format a rate (0..1) as a percentage with one decimal, e.g. 0.234 → "23.4%". */
export function formatRate(rate: number | null): string {
	if (rate === null) return '—';
	return `${(rate * 100).toFixed(1)}%`;
}

// ─── Settings singleton helpers ──────────────────────────

export { BROADCAST_SETTINGS_ID };
// Re-exported so UI consumers can `await settingsTable.get(BROADCAST_SETTINGS_ID)`
// without importing from two places.
export { settingsTable, campaignTable, templateTable };
