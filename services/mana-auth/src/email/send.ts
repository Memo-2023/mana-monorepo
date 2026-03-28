/**
 * Email sending functions using nodemailer.
 * German language emails with Brevo SMTP.
 */

import nodemailer from 'nodemailer';

let transporter: nodemailer.Transporter | null = null;

export function initializeEmail(smtp: { host: string; port: number; user: string; pass: string }) {
	if (!smtp.host || !smtp.user) {
		console.warn('SMTP not configured — emails will be logged to console');
		return;
	}
	transporter = nodemailer.createTransport({
		host: smtp.host,
		port: smtp.port,
		secure: false,
		auth: { user: smtp.user, pass: smtp.pass },
	});
}

async function send(to: string, subject: string, html: string): Promise<boolean> {
	if (!transporter) {
		console.log(`[EMAIL] To: ${to} | Subject: ${subject}`);
		return true;
	}
	try {
		await transporter.sendMail({
			from: '"ManaCore" <noreply@mana.how>',
			to,
			subject,
			html,
		});
		return true;
	} catch (error) {
		console.error('Failed to send email:', error);
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
