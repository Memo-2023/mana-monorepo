/**
 * Calendar Email Service
 *
 * Sends transactional emails via Brevo SMTP for:
 * - Event reminders
 * - Calendar share invitations
 */

import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

interface EmailOptions {
	to: string;
	subject: string;
	html: string;
	text?: string;
}

@Injectable()
export class EmailService {
	private readonly logger = new Logger(EmailService.name);
	private transporter: nodemailer.Transporter | null = null;

	private getTransporter(): nodemailer.Transporter | null {
		if (this.transporter) {
			return this.transporter;
		}

		const host = process.env.SMTP_HOST || 'smtp-relay.brevo.com';
		const port = parseInt(process.env.SMTP_PORT || '587', 10);
		const user = process.env.SMTP_USER;
		const pass = process.env.SMTP_PASSWORD;

		if (!user || !pass) {
			this.logger.warn('SMTP credentials not configured, emails will be logged only');
			return null;
		}

		this.transporter = nodemailer.createTransport({
			host,
			port,
			secure: port === 465,
			auth: {
				user,
				pass,
			},
		});

		return this.transporter;
	}

	/**
	 * Send an email via Brevo SMTP
	 */
	async sendEmail(options: EmailOptions): Promise<boolean> {
		const { to, subject, html, text } = options;
		const from = process.env.SMTP_FROM || 'ManaCore Calendar <calendar@mana.how>';

		this.logger.log(`Sending email to: ${to}, subject: ${subject}`);

		const transport = this.getTransporter();

		if (!transport) {
			this.logger.log('No SMTP configured, logging email content:');
			this.logger.log(`  To: ${to}`);
			this.logger.log(`  Subject: ${subject}`);
			this.logger.debug(`  HTML: ${html.substring(0, 200)}...`);
			return false;
		}

		try {
			const result = await transport.sendMail({
				from,
				to,
				subject,
				html,
				text: text || html.replace(/<[^>]*>/g, ''),
			});

			this.logger.log(`Sent successfully, messageId: ${result.messageId}`);
			return true;
		} catch (error) {
			this.logger.error('Failed to send email:', error);
			return false;
		}
	}

	/**
	 * Send event reminder email
	 */
	async sendReminderEmail(
		email: string,
		eventTitle: string,
		eventTime: Date,
		minutesBefore: number
	): Promise<boolean> {
		const formattedTime = eventTime.toLocaleString('de-DE', {
			dateStyle: 'full',
			timeStyle: 'short',
			timeZone: 'Europe/Berlin',
		});

		const timeLabel = this.formatMinutesBefore(minutesBefore);

		return this.sendEmail({
			to: email,
			subject: `Erinnerung: ${eventTitle} - ${timeLabel}`,
			html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="text-align: center; margin-bottom: 30px;">
    <h1 style="color: #3B82F6; margin: 0;">ManaCore Kalender</h1>
  </div>

  <div style="background-color: #EFF6FF; border-left: 4px solid #3B82F6; padding: 20px; border-radius: 4px; margin-bottom: 20px;">
    <h2 style="margin: 0 0 10px 0; color: #1E40AF;">${eventTitle}</h2>
    <p style="margin: 0; color: #1E40AF; font-size: 18px;">${formattedTime}</p>
  </div>

  <p style="color: #666;">Dein Termin beginnt ${timeLabel}.</p>

  <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">

  <p style="color: #999; font-size: 12px; text-align: center;">
    Diese Erinnerung wurde automatisch von ManaCore Kalender gesendet.
  </p>
</body>
</html>
`,
		});
	}

	/**
	 * Send calendar share invitation email
	 */
	async sendCalendarInvitationEmail(
		email: string,
		calendarName: string,
		inviterName: string,
		permission: string,
		acceptUrl: string
	): Promise<boolean> {
		const permissionLabel = this.formatPermission(permission);

		return this.sendEmail({
			to: email,
			subject: `Kalender-Einladung: ${calendarName}`,
			html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="text-align: center; margin-bottom: 30px;">
    <h1 style="color: #3B82F6; margin: 0;">ManaCore Kalender</h1>
  </div>

  <p>Hallo,</p>

  <p><strong>${inviterName}</strong> hat den Kalender <strong>${calendarName}</strong> mit dir geteilt.</p>

  <div style="background-color: #F3F4F6; padding: 15px; border-radius: 6px; margin: 20px 0;">
    <p style="margin: 0; color: #666;">Berechtigung: <strong>${permissionLabel}</strong></p>
  </div>

  <div style="text-align: center; margin: 30px 0;">
    <a href="${acceptUrl}" style="background-color: #3B82F6; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: 500; display: inline-block;">Einladung annehmen</a>
  </div>

  <p style="color: #666; font-size: 14px;">Diese Einladung ist 7 Tage gültig.</p>

  <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">

  <p style="color: #999; font-size: 12px; text-align: center;">
    Diese E-Mail wurde automatisch von ManaCore Kalender gesendet.<br>
    Falls der Button nicht funktioniert, kopiere diesen Link in deinen Browser:<br>
    <a href="${acceptUrl}" style="color: #3B82F6; word-break: break-all;">${acceptUrl}</a>
  </p>
</body>
</html>
`,
		});
	}

	private formatMinutesBefore(minutes: number): string {
		if (minutes === 0) {
			return 'jetzt';
		}
		if (minutes < 60) {
			return `in ${minutes} Minuten`;
		}
		if (minutes < 1440) {
			const hours = Math.round(minutes / 60);
			return `in ${hours} ${hours === 1 ? 'Stunde' : 'Stunden'}`;
		}
		const days = Math.round(minutes / 1440);
		return `in ${days} ${days === 1 ? 'Tag' : 'Tagen'}`;
	}

	private formatPermission(permission: string): string {
		switch (permission) {
			case 'read':
				return 'Nur Lesen';
			case 'write':
				return 'Bearbeiten';
			case 'admin':
				return 'Vollzugriff';
			default:
				return permission;
		}
	}
}
