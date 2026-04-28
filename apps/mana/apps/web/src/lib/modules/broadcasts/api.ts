/**
 * Broadcast API client — talks to mana-mail's bulk-send + stats endpoints.
 *
 * Recipient resolution happens client-side because contacts live in
 * Dexie (local-first, end-to-end encrypted). The server never sees the
 * user's contact graph. We filter locally, then ship a flat list.
 */

import { browser } from '$app/environment';
import type { Contact } from '$lib/modules/contacts/types';
import type { Campaign, BroadcastSettings, CampaignStats } from './types';
import { filterAudience } from './audience/segment-builder';
import { renderEmailHtml } from './render/email-html';
import { renderPlainText } from './render/plain-text';

function getMailUrl(): string {
	if (browser) {
		const fromWindow = (window as unknown as { __PUBLIC_MANA_MAIL_URL__?: string })
			.__PUBLIC_MANA_MAIL_URL__;
		if (fromWindow) return fromWindow;
	}
	return import.meta.env.PUBLIC_MANA_MAIL_URL || 'http://localhost:3042';
}

async function fetchWithAuth(path: string, init: RequestInit = {}): Promise<Response> {
	// mana-mail's JWT auth reads cookies across the *.mana.how SSO origin.
	return fetch(`${getMailUrl()}${path}`, {
		...init,
		credentials: 'include',
		headers: {
			'Content-Type': 'application/json',
			...(init.headers ?? {}),
		},
	});
}

export interface BulkSendResult {
	campaignId: string;
	accepted: number;
	delivered: number;
	failed: number;
	errors: Array<{ email: string; reason: string }>;
}

/**
 * Trigger a bulk send. Resolves recipients from contacts locally, renders
 * HTML + plaintext with the full email shell (placeholders for per-
 * recipient URLs), and posts the whole package to mana-mail.
 *
 * The server substitutes placeholders + open pixel + signed URLs per-
 * recipient; this function doesn't know about tracking tokens.
 */
export async function sendCampaign(
	campaign: Campaign,
	settings: BroadcastSettings,
	contacts: Contact[]
): Promise<BulkSendResult> {
	const audience = filterAudience(contacts, campaign.audience);
	if (audience.length === 0) {
		throw new Error('Keine Empfänger — Filter liefern eine leere Liste.');
	}
	if (!settings.legalAddress?.trim()) {
		throw new Error(
			'Impressum fehlt in den Einstellungen — laut DSGVO Pflicht in jedem Newsletter.'
		);
	}

	const recipients = audience.map((c) => ({
		email: c.email as string, // filterAudience drops null-email contacts
		name: c.displayName ?? undefined,
		contactId: c.id,
	}));

	const htmlBody = renderEmailHtml({
		tiptapHtml: campaign.content.html ?? '',
		campaign,
		settings,
		unsubscribeUrl: '{{unsubscribe_url}}',
		webViewUrl: '{{web_view_url}}',
	});
	const textBody = renderPlainText({
		tiptapText: campaign.content.plainText ?? '',
		campaign,
		settings,
		unsubscribeUrl: '{{unsubscribe_url}}',
		webViewUrl: '{{web_view_url}}',
	});

	const res = await fetchWithAuth('/api/v1/mail/bulk-send', {
		method: 'POST',
		body: JSON.stringify({
			campaignId: campaign.id,
			subject: campaign.subject,
			fromName: campaign.fromName,
			fromEmail: campaign.fromEmail,
			replyTo: campaign.replyTo ?? undefined,
			htmlBody,
			textBody,
			recipients,
		}),
	});

	if (!res.ok) {
		const errorText = await res.text();
		throw new Error(`Versand fehlgeschlagen (${res.status}): ${errorText}`);
	}
	return (await res.json()) as BulkSendResult;
}

/**
 * Run a DNS authentication check for the user's sending domain.
 * Returns null on auth / 404 so the UI can treat "service down" and
 * "nothing to report" the same way.
 */
export interface DnsCheckResult {
	domain: string;
	spf: { status: 'ok' | 'missing' | 'wrong' | 'weak'; record: string | null; message: string };
	dkim: {
		status: 'ok' | 'missing' | 'wrong' | 'weak';
		record: string | null;
		selector: string;
		message: string;
	};
	dmarc: { status: 'ok' | 'missing' | 'wrong' | 'weak'; record: string | null; message: string };
	checkedAt: string;
	suggested: {
		spfAdd: string;
		dmarcRecord: string;
	};
}

export async function runDnsCheck(domain: string, selector?: string): Promise<DnsCheckResult> {
	const params = new URLSearchParams({ domain });
	if (selector) params.set('selector', selector);
	const res = await fetchWithAuth(`/api/v1/mail/dns-check?${params.toString()}`);
	if (!res.ok) {
		const errorText = await res.text();
		throw new Error(`DNS-Check fehlgeschlagen (${res.status}): ${errorText}`);
	}
	return (await res.json()) as DnsCheckResult;
}

/**
 * Fetch aggregate stats for a campaign from mana-mail. Safe to poll on a
 * timer from the DetailView (M7) — server returns cached rollups.
 */
export async function fetchCampaignStats(campaignId: string): Promise<CampaignStats | null> {
	const res = await fetchWithAuth(`/api/v1/mail/campaigns/${campaignId}/events`);
	if (res.status === 404) return null;
	if (!res.ok) throw new Error(`Stats-Fetch fehlgeschlagen (${res.status})`);
	const data = (await res.json()) as {
		totalRecipients: number;
		delivery: {
			sent: number;
			delivered: number;
			bounced: number;
			unsubscribed: number;
		};
		opens: { unique: number };
		clicks: { unique: number };
		lastSyncedAt: string;
	};
	return {
		totalRecipients: data.totalRecipients,
		sent: data.delivery.sent,
		delivered: data.delivery.delivered,
		bounced: data.delivery.bounced,
		opened: data.opens.unique,
		clicked: data.clicks.unique,
		unsubscribed: data.delivery.unsubscribed,
		lastSyncedAt: data.lastSyncedAt,
	};
}
