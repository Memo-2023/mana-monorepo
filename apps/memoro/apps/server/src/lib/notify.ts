/**
 * Notification client for Memoro server.
 * Sends emails via mana-notify service.
 */

import { NotifyClient } from '@manacore/notify-client';

let client: NotifyClient | null = null;

function getClient(): NotifyClient | null {
	const serviceUrl = process.env.MANA_NOTIFY_URL;
	const serviceKey = process.env.MANA_CORE_SERVICE_KEY;

	if (!serviceUrl || !serviceKey) return null;

	if (!client) {
		client = new NotifyClient({
			serviceUrl,
			serviceKey,
			appId: 'memoro',
		});
	}

	return client;
}

/**
 * Send a space invite email. Fails silently if notify is not configured.
 */
export async function sendInviteEmail(params: {
	email: string;
	spaceName: string;
	inviterName?: string;
}): Promise<void> {
	const notify = getClient();
	if (!notify) {
		console.log('[notify] Skipping invite email — MANA_NOTIFY_URL not configured');
		return;
	}

	const { email, spaceName, inviterName } = params;
	const inviter = inviterName ?? 'Someone';

	try {
		await notify.sendEmail({
			to: email,
			subject: `${inviter} hat dich zu "${spaceName}" eingeladen — Memoro`,
			body: `
				<h2>Du wurdest eingeladen!</h2>
				<p><strong>${inviter}</strong> hat dich zum Space <strong>"${spaceName}"</strong> in Memoro eingeladen.</p>
				<p>Öffne Memoro, um die Einladung anzunehmen.</p>
			`,
		});
		console.log(`[notify] Invite email sent to ${email} for space "${spaceName}"`);
	} catch (err) {
		console.error(`[notify] Failed to send invite email to ${email}:`, err);
	}
}
