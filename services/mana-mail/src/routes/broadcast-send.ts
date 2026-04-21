/**
 * POST /v1/mail/bulk-send — JWT auth.
 *
 * The webapp resolves recipients client-side (contacts live in Dexie) and
 * POSTs a flat list here. Hard-capped at config.broadcastMaxRecipients so
 * a misbehaving client can't send 100k mails in one request.
 */

import { Hono } from 'hono';
import { z } from 'zod';
import type { BroadcastOrchestrator } from '../services/broadcast-orchestrator';
import type { AuthUser } from '../middleware/jwt-auth';

const recipientSchema = z.object({
	email: z.string().email(),
	name: z.string().optional(),
	contactId: z.string().optional(),
});

const bulkSendSchema = z.object({
	campaignId: z.string().min(1),
	subject: z.string().min(1),
	fromName: z.string().min(1),
	fromEmail: z.string().email(),
	replyTo: z.string().email().optional(),
	htmlBody: z.string().min(1),
	textBody: z.string().min(1),
	recipients: z.array(recipientSchema).min(1).max(5000),
});

export function createBroadcastSendRoutes(
	orchestrator: BroadcastOrchestrator,
	maxRecipients: number
) {
	return new Hono<{ Variables: { user: AuthUser } }>().post('/bulk-send', async (c) => {
		const user = c.get('user');
		const body = bulkSendSchema.parse(await c.req.json());

		if (body.recipients.length > maxRecipients) {
			return c.json(
				{
					error: `Recipient count ${body.recipients.length} exceeds configured cap ${maxRecipients}`,
				},
				400
			);
		}

		const result = await orchestrator.run({
			userId: user.userId,
			campaignId: body.campaignId,
			subject: body.subject,
			fromName: body.fromName,
			fromEmail: body.fromEmail,
			replyTo: body.replyTo,
			htmlBody: body.htmlBody,
			textBody: body.textBody,
			recipients: body.recipients,
			maxRecipients,
		});

		return c.json(result);
	});
}
