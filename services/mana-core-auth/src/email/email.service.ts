/**
 * Email Service
 *
 * Sends transactional emails via Brevo SMTP for:
 * - Password reset
 * - Email verification
 * - Organization invitations
 */

import * as nodemailer from 'nodemailer';

interface EmailOptions {
	to: string;
	subject: string;
	html: string;
	text?: string;
}

// Create reusable transporter
let transporter: nodemailer.Transporter | null = null;

function getTransporter(): nodemailer.Transporter {
	if (transporter) {
		return transporter;
	}

	const host = process.env.SMTP_HOST || 'smtp-relay.brevo.com';
	const port = parseInt(process.env.SMTP_PORT || '587', 10);
	const user = process.env.SMTP_USER;
	const pass = process.env.SMTP_PASSWORD;

	if (!user || !pass) {
		console.warn('[Email] SMTP credentials not configured, emails will be logged only');
		return null as any;
	}

	transporter = nodemailer.createTransport({
		host,
		port,
		secure: port === 465, // true for 465, false for other ports
		auth: {
			user,
			pass,
		},
	});

	return transporter;
}

/**
 * Send an email via Brevo SMTP
 */
export async function sendEmail(options: EmailOptions): Promise<boolean> {
	const { to, subject, html, text } = options;
	const from = process.env.SMTP_FROM || 'ManaCore <noreply@mana.how>';

	console.log(`[Email] Sending to: ${to}, subject: ${subject}`);

	const transport = getTransporter();

	if (!transport) {
		console.log('[Email] No SMTP configured, logging email content:');
		console.log(`  To: ${to}`);
		console.log(`  Subject: ${subject}`);
		console.log(`  HTML: ${html.substring(0, 200)}...`);
		return false;
	}

	try {
		const result = await transport.sendMail({
			from,
			to,
			subject,
			html,
			text: text || html.replace(/<[^>]*>/g, ''), // Strip HTML for text version
		});

		console.log(`[Email] Sent successfully, messageId: ${result.messageId}`);
		return true;
	} catch (error) {
		console.error('[Email] Failed to send:', error);
		return false;
	}
}

/**
 * Send password reset email
 */
export async function sendPasswordResetEmail(
	email: string,
	resetUrl: string,
	userName?: string
): Promise<boolean> {
	const name = userName || email.split('@')[0];

	return sendEmail({
		to: email,
		subject: 'Passwort zurücksetzen - ManaCore',
		html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="text-align: center; margin-bottom: 30px;">
    <h1 style="color: #2563eb; margin: 0;">ManaCore</h1>
  </div>

  <p>Hallo ${name},</p>

  <p>Du hast eine Anfrage zum Zurücksetzen deines Passworts gestellt. Klicke auf den Button unten, um ein neues Passwort zu erstellen:</p>

  <div style="text-align: center; margin: 30px 0;">
    <a href="${resetUrl}" style="background-color: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: 500; display: inline-block;">Passwort zurücksetzen</a>
  </div>

  <p style="color: #666; font-size: 14px;">Dieser Link ist 1 Stunde gültig. Falls du diese Anfrage nicht gestellt hast, kannst du diese E-Mail ignorieren.</p>

  <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">

  <p style="color: #999; font-size: 12px; text-align: center;">
    Diese E-Mail wurde automatisch von ManaCore gesendet.<br>
    Falls der Button nicht funktioniert, kopiere diesen Link in deinen Browser:<br>
    <a href="${resetUrl}" style="color: #2563eb; word-break: break-all;">${resetUrl}</a>
  </p>
</body>
</html>
`,
	});
}

/**
 * Send organization invitation email
 */
export async function sendInvitationEmail(
	email: string,
	organizationName: string,
	inviterName: string,
	inviteUrl: string
): Promise<boolean> {
	return sendEmail({
		to: email,
		subject: `Einladung zu ${organizationName} - ManaCore`,
		html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="text-align: center; margin-bottom: 30px;">
    <h1 style="color: #2563eb; margin: 0;">ManaCore</h1>
  </div>

  <p>Hallo,</p>

  <p><strong>${inviterName}</strong> hat dich eingeladen, der Organisation <strong>${organizationName}</strong> auf ManaCore beizutreten.</p>

  <div style="text-align: center; margin: 30px 0;">
    <a href="${inviteUrl}" style="background-color: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: 500; display: inline-block;">Einladung annehmen</a>
  </div>

  <p style="color: #666; font-size: 14px;">Diese Einladung ist 7 Tage gültig.</p>

  <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">

  <p style="color: #999; font-size: 12px; text-align: center;">
    Diese E-Mail wurde automatisch von ManaCore gesendet.
  </p>
</body>
</html>
`,
	});
}

/**
 * Send welcome/verification email
 */
export async function sendWelcomeEmail(
	email: string,
	userName?: string,
	verificationUrl?: string
): Promise<boolean> {
	const name = userName || email.split('@')[0];
	const hasVerification = !!verificationUrl;

	return sendEmail({
		to: email,
		subject: 'Willkommen bei ManaCore!',
		html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="text-align: center; margin-bottom: 30px;">
    <h1 style="color: #2563eb; margin: 0;">ManaCore</h1>
  </div>

  <p>Hallo ${name},</p>

  <p>Willkommen bei ManaCore! Dein Account wurde erfolgreich erstellt.</p>

  ${
		hasVerification
			? `
  <p>Bitte bestätige deine E-Mail-Adresse, indem du auf den Button unten klickst:</p>

  <div style="text-align: center; margin: 30px 0;">
    <a href="${verificationUrl}" style="background-color: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: 500; display: inline-block;">E-Mail bestätigen</a>
  </div>
  `
			: `
  <p>Du kannst dich jetzt mit deiner E-Mail-Adresse und deinem Passwort anmelden.</p>

  <div style="text-align: center; margin: 30px 0;">
    <a href="https://mana.how" style="background-color: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: 500; display: inline-block;">Zu ManaCore</a>
  </div>
  `
	}

  <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">

  <p style="color: #999; font-size: 12px; text-align: center;">
    Diese E-Mail wurde automatisch von ManaCore gesendet.
  </p>
</body>
</html>
`,
	});
}
