/**
 * Broadcast Tools — LLM-accessible operations.
 *
 * Schema definitions live in @mana/shared-ai's AI_TOOL_CATALOG; this
 * file wires execute fns to the local store + query layer.
 *
 * Mission example:
 *   "Schreib jeden Freitag einen Newsletter-Entwurf aus meinen Notizen
 *    der Woche" → auto-list_notes + propose create_campaign_draft.
 */

import type { ModuleTool } from '$lib/data/tools/types';
import { campaignTable } from './collections';
import { decryptRecords } from '$lib/data/crypto';
import { broadcastCampaignsStore } from './stores/campaigns.svelte';
import { toCampaign, formatRate } from './queries';
import type { LocalCampaign, CampaignStatus, CampaignContent } from './types';

/**
 * Pragmatic HTML → Tiptap-JSON shim. The planner produces flat HTML
 * (the tool schema explicitly limits which tags are allowed), and
 * Tiptap's Editor accepts HTML at init time via setContent(html).
 * We persist a minimal valid Tiptap doc that the editor will replace
 * on first open via its `content: html` init path.
 *
 * Storing both html and tiptap means the ListView + preview render
 * without the editor having to remount.
 */
function htmlToCampaignContent(html: string): CampaignContent {
	return {
		// Tiptap-JSON placeholder — editor re-parses from html on open.
		// Valid Tiptap doc structure so runtime doesn't choke on null.
		tiptap: { type: 'doc', content: [{ type: 'paragraph' }] },
		html,
		plainText: stripHtml(html),
	};
}

/** Crude but adequate: remove tags + collapse whitespace. */
function stripHtml(html: string): string {
	return html
		.replace(/<\/(p|div|h[1-6]|li|br)>/gi, '\n')
		.replace(/<[^>]+>/g, '')
		.replace(/&nbsp;/g, ' ')
		.replace(/&amp;/g, '&')
		.replace(/&lt;/g, '<')
		.replace(/&gt;/g, '>')
		.replace(/[ \t]+\n/g, '\n')
		.replace(/\n{3,}/g, '\n\n')
		.trim();
}

async function listDecryptedCampaigns(): Promise<ReturnType<typeof toCampaign>[]> {
	const rows = await campaignTable.toArray();
	const visible = rows.filter((r) => !r.deletedAt);
	const decrypted = (await decryptRecords('broadcastCampaigns', visible)) as LocalCampaign[];
	return decrypted.map(toCampaign);
}

export const broadcastTools: ModuleTool[] = [
	{
		name: 'create_campaign_draft',
		module: 'broadcasts',
		description:
			'Erstellt einen Newsletter-/Kampagnen-Entwurf mit Name, Betreff, optionalem Preheader und fertigem HTML-Body.',
		parameters: [
			{ name: 'name', type: 'string', description: 'Arbeitstitel', required: true },
			{ name: 'subject', type: 'string', description: 'E-Mail-Betreff', required: true },
			{ name: 'preheader', type: 'string', description: 'Preheader', required: false },
			{
				name: 'htmlContent',
				type: 'string',
				description: 'HTML-Body (p, h1-3, ul, ol, li, a, strong, em, br)',
				required: true,
			},
		],
		async execute(params) {
			const name = String(params.name ?? '').trim() || 'Neue Kampagne';
			const subject = String(params.subject ?? '').trim();
			if (!subject) return { success: false, message: 'Betreff fehlt.' };
			const htmlContent = String(params.htmlContent ?? '');
			if (!htmlContent.trim()) return { success: false, message: 'Inhalt fehlt.' };

			const id = await broadcastCampaignsStore.createCampaign({
				name,
				subject,
				preheader: (params.preheader as string | undefined) || null,
				content: htmlToCampaignContent(htmlContent),
			});
			return {
				success: true,
				data: { id, name, subject },
				message: `Entwurf „${name}" angelegt. Empfänger in der UI wählen, dann versenden.`,
			};
		},
	},

	{
		name: 'list_campaigns',
		module: 'broadcasts',
		description: 'Listet Kampagnen (id, name, subject, status, Empfängerzahl, sentAt).',
		parameters: [
			{
				name: 'status',
				type: 'string',
				description: 'Filter auf Status',
				required: false,
				enum: ['draft', 'scheduled', 'sending', 'sent', 'cancelled'],
			},
			{ name: 'limit', type: 'number', description: 'Maximale Anzahl', required: false },
		],
		async execute(params) {
			const all = await listDecryptedCampaigns();
			const status = params.status as CampaignStatus | undefined;
			const filtered = status ? all.filter((c) => c.status === status) : all;
			const limit = Number(params.limit ?? 20);
			const slice = filtered.slice(0, Math.max(1, limit));
			return {
				success: true,
				data: slice.map((c) => ({
					id: c.id,
					name: c.name,
					subject: c.subject,
					status: c.status,
					recipients: c.audience?.estimatedCount ?? 0,
					sentAt: c.sentAt,
				})),
				message: `${slice.length} Kampagne${slice.length === 1 ? '' : 'n'}${status ? ` im Status ${status}` : ''}.`,
			};
		},
	},

	{
		name: 'get_campaign_stats',
		module: 'broadcasts',
		description: 'Gibt Raten zu einer Kampagne zurück: Öffnungs-, Klick-, Bounce- und Abmelderate.',
		parameters: [{ name: 'campaignId', type: 'string', description: 'ID', required: true }],
		async execute(params) {
			const id = String(params.campaignId ?? '').trim();
			if (!id) return { success: false, message: 'campaignId fehlt.' };
			const all = await listDecryptedCampaigns();
			const campaign = all.find((c) => c.id === id);
			if (!campaign) return { success: false, message: `Kampagne ${id} nicht gefunden.` };
			const s = campaign.stats;
			if (!s || s.sent === 0) {
				return {
					success: true,
					data: {
						campaignId: id,
						name: campaign.name,
						status: campaign.status,
						stats: null,
					},
					message: `Kampagne „${campaign.name}" hat noch keine Sendestatistik.`,
				};
			}
			const openRate = s.opened / s.sent;
			const clickRate = s.clicked / s.sent;
			const bounceRate = s.bounced / s.sent;
			const unsubRate = s.unsubscribed / s.sent;
			return {
				success: true,
				data: {
					campaignId: id,
					name: campaign.name,
					status: campaign.status,
					stats: {
						totalRecipients: s.totalRecipients,
						sent: s.sent,
						openRate,
						clickRate,
						bounceRate,
						unsubscribeRate: unsubRate,
					},
				},
				message: `„${campaign.name}": ${s.sent} versendet, ${formatRate(openRate)} geöffnet, ${formatRate(clickRate)} geklickt.`,
			};
		},
	},
];
