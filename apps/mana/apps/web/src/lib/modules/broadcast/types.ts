/**
 * Broadcast module types.
 *
 * 1:N email campaigns (newsletters + announcements) sent via mana-mail's
 * bulk-send endpoint. Plan: `docs/plans/broadcast-module.md`.
 *
 * Critical invariants:
 *   - `content.html` + `content.plainText` are **derived** from
 *     `content.tiptap`; they get regenerated on every save so the editor
 *     JSON stays the source of truth.
 *   - `status` can only advance forward: draft → scheduled → sending →
 *     sent (cancelled is the only off-ramp, allowed from draft/scheduled).
 *   - `stats` is a plaintext cache of the server-side events table — it
 *     can lag; liveQuery consumers should tolerate missing / stale data.
 */

import type { BaseRecord } from '@mana/local-store';

// ─── Discriminators & Enums ──────────────────────────────

export type CampaignStatus = 'draft' | 'scheduled' | 'sending' | 'sent' | 'cancelled';

// ─── Audience segment ────────────────────────────────────

export type AudienceField = 'tag' | 'email' | 'custom';
export type AudienceOp = 'has' | 'not-has' | 'eq' | 'contains';

export interface AudienceFilter {
	field: AudienceField;
	op: AudienceOp;
	value: string;
}

export interface AudienceDefinition {
	filters: AudienceFilter[];
	/** Cached count so the list doesn't have to recompute on every render.
	 *  Not authoritative — the send-time resolver always re-runs the query. */
	estimatedCount: number;
}

// ─── Campaign content ────────────────────────────────────

/**
 * Tiptap JSON + derived outputs. HTML + plainText are regenerated on
 * save; we persist them so the PDF-less send path doesn't need an
 * editor round-trip just to re-render.
 */
export interface CampaignContent {
	tiptap: object;
	html?: string;
	plainText?: string;
}

// ─── Campaign stats (mirror of server events) ────────────

export interface CampaignStats {
	totalRecipients: number;
	sent: number;
	delivered: number;
	bounced: number;
	opened: number;
	clicked: number;
	unsubscribed: number;
	/** ISO timestamp — how fresh is this snapshot? */
	lastSyncedAt: string;
}

// ─── DNS check ───────────────────────────────────────────

export type DnsRecordStatus = 'ok' | 'missing' | 'wrong' | 'weak';

export interface DnsCheck {
	domain: string;
	spf: DnsRecordStatus;
	dkim: DnsRecordStatus;
	dmarc: DnsRecordStatus;
	checkedAt: string;
}

// ─── Local Records (Dexie) ───────────────────────────────

export interface LocalCampaign extends BaseRecord {
	/** Internal working title; not sent. */
	name: string;
	/** What lands in the recipient's mailbox subject line. */
	subject: string;
	/** "Preheader" — the grey excerpt shown next to the subject in Gmail. */
	preheader?: string | null;
	fromName: string;
	fromEmail: string;
	replyTo?: string | null;
	content: CampaignContent;
	templateId?: string | null;
	audience: AudienceDefinition;
	/** For scheduled sends — when should mana-mail pick this up? */
	scheduledAt?: string | null;
	/** When was the send actually fired. */
	sentAt?: string | null;
	status: CampaignStatus;
	/** Server-side orchestrator job id (mana-mail). */
	serverJobId?: string | null;
	stats?: CampaignStats | null;
}

export interface LocalBroadcastTemplate extends BaseRecord {
	name: string;
	description?: string | null;
	subject?: string | null;
	content: CampaignContent;
	/** Built-ins ship with the app; users can't delete them, only clone. */
	isBuiltIn: boolean;
	thumbnailUrl?: string | null;
}

export interface LocalBroadcastSettings extends BaseRecord {
	defaultFromName: string;
	defaultFromEmail: string;
	defaultReplyTo?: string | null;
	defaultFooter?: string | null;
	dnsCheck?: DnsCheck | null;
	/** Impressumspflicht — lands at the bottom of every campaign HTML. */
	legalAddress: string;
	unsubscribeLandingCopy?: string | null;
}

// ─── Domain Types (plaintext, UI) ────────────────────────

export interface Campaign {
	id: string;
	name: string;
	subject: string;
	preheader: string | null;
	fromName: string;
	fromEmail: string;
	replyTo: string | null;
	content: CampaignContent;
	templateId: string | null;
	audience: AudienceDefinition;
	scheduledAt: string | null;
	sentAt: string | null;
	status: CampaignStatus;
	serverJobId: string | null;
	stats: CampaignStats | null;
	createdAt: string;
	updatedAt: string;
}

export interface BroadcastTemplate {
	id: string;
	name: string;
	description: string | null;
	subject: string | null;
	content: CampaignContent;
	isBuiltIn: boolean;
	thumbnailUrl: string | null;
	createdAt: string;
}

export interface BroadcastSettings {
	id: string;
	defaultFromName: string;
	defaultFromEmail: string;
	defaultReplyTo: string | null;
	defaultFooter: string | null;
	dnsCheck: DnsCheck | null;
	legalAddress: string;
	unsubscribeLandingCopy: string | null;
}
