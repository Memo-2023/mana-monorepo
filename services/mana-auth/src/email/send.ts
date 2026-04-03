/**
 * Email sending via mana-notify service.
 * All emails are routed through the central notification service
 * which handles SMTP, retries, and queuing.
 */

const NOTIFY_URL = process.env.MANA_NOTIFY_URL || 'http://localhost:3013';
const SERVICE_KEY = process.env.MANA_CORE_SERVICE_KEY || 'dev-service-key';

async function send(to: string, subject: string, html: string): Promise<boolean> {
	try {
		const res = await fetch(`${NOTIFY_URL}/api/v1/notifications/send`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'X-Service-Key': SERVICE_KEY,
			},
			body: JSON.stringify({
				channel: 'email',
				appId: 'mana-auth',
				recipient: to,
				subject,
				body: html,
			}),
		});
		if (!res.ok) {
			console.error('mana-notify error:', res.status, await res.text());
			return false;
		}
		return true;
	} catch (error) {
		console.error('Failed to send via mana-notify:', error);
		return false;
	}
}

export async function sendVerificationEmail(email: string, url: string, name?: string) {
	return send(
		email,
		'E-Mail bestätigen — ManaCore',
		`<p>Hallo ${name || ''},</p><p>Bitte bestätige deine E-Mail-Adresse:</p><p><a href="${url}">E-Mail bestätigen</a></p><p>Oder kopiere diesen Link: ${url}</p>`
	);
}

export async function sendPasswordResetEmail(email: string, url: string, name?: string) {
	return send(
		email,
		'Passwort zurücksetzen — ManaCore',
		`<p>Hallo ${name || ''},</p><p>Klicke hier um dein Passwort zurückzusetzen:</p><p><a href="${url}">Passwort zurücksetzen</a></p><p>Der Link ist 1 Stunde gültig.</p>`
	);
}

export async function sendInvitationEmail(
	email: string,
	orgName: string,
	inviterName: string,
	url: string
) {
	return send(
		email,
		`Einladung: ${orgName} — ManaCore`,
		`<p>${inviterName} hat dich zu <strong>${orgName}</strong> eingeladen.</p><p><a href="${url}">Einladung annehmen</a></p>`
	);
}

export async function sendMagicLinkEmail(email: string, url: string) {
	return send(
		email,
		'Login-Link — ManaCore',
		`<p>Klicke hier um dich anzumelden:</p><p><a href="${url}">Jetzt anmelden</a></p><p>Der Link ist 10 Minuten gültig.</p>`
	);
}

export async function sendAccountDeletionEmail(email: string, name?: string) {
	return send(
		email,
		'Konto gelöscht — ManaCore',
		`<p>Hallo ${name || ''},</p><p>Dein ManaCore-Konto wurde erfolgreich gelöscht. Alle deine Daten wurden entfernt.</p>`
	);
}
