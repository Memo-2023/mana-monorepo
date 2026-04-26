/**
 * Campaigns store — mutation-only service.
 *
 * Status machine enforced here:
 *   draft → scheduled (schedule)
 *   draft → sending   (send)   [set by server orchestrator, not this store]
 *   sending → sent    (server-driven)
 *   draft | scheduled → cancelled (cancel)
 *
 * Only drafts are user-editable. Once a campaign starts sending, content
 * and audience freeze so the recipient graph can't shift mid-flight.
 */

import { encryptRecord } from '$lib/data/crypto';
import { emitDomainEvent } from '$lib/data/events';
import { campaignTable } from '../collections';
import { broadcastSettingsStore } from './settings.svelte';
import type { LocalCampaign, CampaignContent, AudienceDefinition, CampaignStatus } from '../types';

export interface CreateCampaignInput {
	name?: string;
	subject?: string;
	preheader?: string | null;
	fromName?: string;
	fromEmail?: string;
	replyTo?: string | null;
	content?: CampaignContent;
	audience?: AudienceDefinition;
	templateId?: string | null;
}

const EMPTY_TIPTAP = {
	type: 'doc',
	content: [{ type: 'paragraph' }],
};

const EMPTY_AUDIENCE: AudienceDefinition = {
	filters: [],
	estimatedCount: 0,
};

export const broadcastCampaignsStore = {
	/**
	 * Create a new campaign in status `draft`. Sender fields + footer default
	 * to the user's broadcast settings so first-time use feels like "start
	 * typing and go" rather than "fill out ten fields before you can type".
	 */
	async createCampaign(input: CreateCampaignInput = {}): Promise<string> {
		const defaults = await broadcastSettingsStore.getDefaults();
		const now = new Date().toISOString();

		const newLocal: LocalCampaign = {
			id: crypto.randomUUID(),
			name: input.name ?? 'Neue Kampagne',
			subject: input.subject ?? '',
			preheader: input.preheader ?? null,
			fromName: input.fromName ?? defaults.fromName,
			fromEmail: input.fromEmail ?? defaults.fromEmail,
			replyTo: input.replyTo ?? defaults.replyTo,
			content: input.content ?? { tiptap: EMPTY_TIPTAP },
			templateId: input.templateId ?? null,
			audience: input.audience ?? EMPTY_AUDIENCE,
			scheduledAt: null,
			sentAt: null,
			status: 'draft',
			serverJobId: null,
			stats: null,
			createdAt: now,
		};

		await encryptRecord('broadcastCampaigns', newLocal);
		await campaignTable.add(newLocal);
		emitDomainEvent('BroadcastCampaignCreated', 'broadcast', 'broadcastCampaigns', newLocal.id, {
			campaignId: newLocal.id,
			name: newLocal.name,
		});
		return newLocal.id;
	},

	/**
	 * Generic metadata patch — only valid in `draft`. Sending and onward
	 * freeze the row to preserve the "what you saw is what went out"
	 * invariant for the recipient.
	 */
	async updateCampaign(
		id: string,
		patch: Partial<
			Pick<
				LocalCampaign,
				'name' | 'subject' | 'preheader' | 'fromName' | 'fromEmail' | 'replyTo' | 'templateId'
			>
		>
	) {
		const existing = await campaignTable.get(id);
		if (!existing) return;
		if (existing.status !== 'draft') {
			throw new Error('[broadcast] only drafts can be edited; duplicate to revise a sent campaign');
		}
		const wrapped = { ...patch } as Record<string, unknown>;
		await encryptRecord('broadcastCampaigns', wrapped);
		await campaignTable.update(id, wrapped as never);
	},

	/**
	 * Replace content (Tiptap JSON + derived HTML/plaintext). Derived
	 * outputs are passed in by the caller because rendering happens
	 * client-side in the editor component; the store stays dumb about
	 * Tiptap's schema.
	 */
	async updateContent(id: string, content: CampaignContent) {
		const existing = await campaignTable.get(id);
		if (!existing) return;
		if (existing.status !== 'draft') {
			throw new Error('[broadcast] only drafts can be edited');
		}
		const patch = { content } as Record<string, unknown>;
		await encryptRecord('broadcastCampaigns', patch);
		await campaignTable.update(id, patch as never);
	},

	async updateAudience(id: string, audience: AudienceDefinition) {
		const existing = await campaignTable.get(id);
		if (!existing) return;
		if (existing.status !== 'draft') {
			throw new Error('[broadcast] only drafts can be edited');
		}
		const patch = { audience } as Record<string, unknown>;
		await encryptRecord('broadcastCampaigns', patch);
		await campaignTable.update(id, patch as never);
	},

	/**
	 * Flip draft → scheduled with a future timestamp. Actual send happens
	 * server-side when mana-mail's cron sees the row; this store just
	 * arms the trigger.
	 */
	async schedule(id: string, scheduledAt: string) {
		const existing = await campaignTable.get(id);
		if (!existing) return;
		if (existing.status !== 'draft') return;
		await campaignTable.update(id, {
			status: 'scheduled' as CampaignStatus,
			scheduledAt,
		});
		emitDomainEvent('BroadcastCampaignScheduled', 'broadcast', 'broadcastCampaigns', id, {
			campaignId: id,
			scheduledAt,
		});
	},

	/** Revoke a scheduled send before it fires. Can be reactivated as draft. */
	async cancel(id: string) {
		const existing = await campaignTable.get(id);
		if (!existing) return;
		if (existing.status !== 'draft' && existing.status !== 'scheduled') {
			throw new Error('[broadcast] only drafts or scheduled campaigns can be cancelled');
		}
		await campaignTable.update(id, {
			status: 'cancelled' as CampaignStatus,
			scheduledAt: null,
		});
		emitDomainEvent('BroadcastCampaignCancelled', 'broadcast', 'broadcastCampaigns', id, {
			campaignId: id,
		});
	},

	/**
	 * Duplicate an existing campaign (typically a sent one being reused as
	 * template-of-the-moment). Produces a fresh draft with the same
	 * content + audience but new number / status.
	 */
	async duplicate(id: string): Promise<string> {
		const existing = await campaignTable.get(id);
		if (!existing) throw new Error('[broadcast] duplicate: source not found');
		const { decryptRecords } = await import('$lib/data/crypto');
		const [decrypted] = (await decryptRecords('broadcastCampaigns', [existing])) as LocalCampaign[];
		return this.createCampaign({
			name: `Kopie von ${decrypted.name}`,
			subject: decrypted.subject,
			preheader: decrypted.preheader,
			fromName: decrypted.fromName,
			fromEmail: decrypted.fromEmail,
			replyTo: decrypted.replyTo,
			content: decrypted.content,
			audience: decrypted.audience,
			templateId: decrypted.templateId,
		});
	},

	async deleteCampaign(id: string) {
		const existing = await campaignTable.get(id);
		if (!existing) return;
		if (existing.status === 'sending' || existing.status === 'sent') {
			throw new Error(
				'[broadcast] versendete oder laufende Kampagnen können nicht gelöscht werden (Bookkeeping)'
			);
		}
		await campaignTable.update(id, {
			deletedAt: new Date().toISOString(),
		});
		emitDomainEvent('BroadcastCampaignDeleted', 'broadcast', 'broadcastCampaigns', id, {
			campaignId: id,
		});
	},

	/**
	 * Server-side hook surface: once M4's orchestrator accepts a send, it
	 * writes back here to reflect progress. Exposed as a store method so
	 * callers share the encryption/event plumbing.
	 */
	async applyServerStatus(
		id: string,
		patch: {
			status: CampaignStatus;
			serverJobId?: string | null;
			sentAt?: string | null;
			stats?: LocalCampaign['stats'];
		}
	) {
		await campaignTable.update(id, {
			...patch,
		});
	},
};
