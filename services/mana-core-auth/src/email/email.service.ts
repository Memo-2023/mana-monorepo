/**
 * Email Service
 *
 * Sends transactional emails via Brevo SMTP for:
 * - Password reset
 * - Email verification
 * - Organization invitations
 */

import * as nodemailer from 'nodemailer';
import { getLogger } from '../common/logger';

const logger = getLogger('EmailService');

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
		logger.warn('SMTP credentials not configured, emails will be logged only');
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

	logger.info('Sending email', { to, subject });

	const transport = getTransporter();

	if (!transport) {
		logger.debug('No SMTP configured, email not sent', { to, subject });
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

		logger.info('Email sent successfully', { to, messageId: result.messageId });
		return true;
	} catch (error) {
		logger.error('Failed to send email', error instanceof Error ? error.stack : undefined, { to });
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
 * Send email verification email
 */
export async function sendVerificationEmail(
	email: string,
	verificationUrl: string,
	userName?: string
): Promise<boolean> {
	const name = userName || email.split('@')[0];

	return sendEmail({
		to: email,
		subject: 'E-Mail bestätigen - ManaCore',
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

  <p>Willkommen bei ManaCore! Bitte bestätige deine E-Mail-Adresse, um deinen Account zu aktivieren:</p>

  <div style="text-align: center; margin: 30px 0;">
    <a href="${verificationUrl}" style="background-color: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: 500; display: inline-block;">E-Mail bestätigen</a>
  </div>

  <p style="color: #666; font-size: 14px;">Dieser Link ist 24 Stunden gültig. Falls du dich nicht bei ManaCore registriert hast, kannst du diese E-Mail ignorieren.</p>

  <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">

  <p style="color: #999; font-size: 12px; text-align: center;">
    Diese E-Mail wurde automatisch von ManaCore gesendet.<br>
    Falls der Button nicht funktioniert, kopiere diesen Link in deinen Browser:<br>
    <a href="${verificationUrl}" style="color: #2563eb; word-break: break-all;">${verificationUrl}</a>
  </p>
</body>
</html>
`,
	});
}

/**
 * Send account deletion confirmation email
 */
export async function sendAccountDeletionEmail(email: string, userName?: string): Promise<boolean> {
	const name = userName || email.split('@')[0];

	return sendEmail({
		to: email,
		subject: 'Dein ManaCore-Konto wurde gelöscht',
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

  <p>dein ManaCore-Konto und alle damit verbundenen Daten wurden erfolgreich gelöscht.</p>

  <div style="background-color: #f8f9fa; border-radius: 8px; padding: 20px; margin: 20px 0;">
    <p style="margin: 0 0 10px 0; font-weight: 600;">Folgende Daten wurden entfernt:</p>
    <ul style="margin: 0; padding-left: 20px; color: #666;">
      <li>Benutzerprofil und Anmeldedaten</li>
      <li>Alle Sessions und verknüpften Accounts</li>
      <li>Credits und Transaktionshistorie</li>
      <li>Daten in allen verbundenen Apps</li>
    </ul>
  </div>

  <p style="color: #666;">Diese Aktion ist unwiderruflich. Falls du ManaCore erneut nutzen möchtest, kannst du jederzeit ein neues Konto erstellen.</p>

  <p style="color: #666;">Bei Fragen erreichst du uns unter <a href="mailto:support@mana.how" style="color: #2563eb;">support@mana.how</a>.</p>

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
