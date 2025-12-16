/**
 * Email Service using Brevo API
 *
 * Handles transactional emails for:
 * - Password reset
 * - Organization invitations
 * - Email verification (future)
 *
 * @see https://developers.brevo.com/reference/sendtransacemail
 */

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as brevo from '@getbrevo/brevo';

export interface SendEmailOptions {
	to: string;
	subject: string;
	htmlContent: string;
	textContent?: string;
}

export interface PasswordResetEmailOptions {
	email: string;
	name?: string;
	resetUrl: string;
}

export interface OrganizationInviteEmailOptions {
	email: string;
	organizationName: string;
	inviterName?: string;
	inviteUrl: string;
	role: string;
}

@Injectable()
export class EmailService {
	private readonly logger = new Logger(EmailService.name);
	private readonly apiInstance: brevo.TransactionalEmailsApi;
	private readonly senderEmail: string;
	private readonly senderName: string;
	private readonly isEnabled: boolean;

	constructor(private readonly configService: ConfigService) {
		const apiKey = this.configService.get<string>('BREVO_API_KEY');
		this.senderEmail =
			this.configService.get<string>('EMAIL_SENDER_ADDRESS') || 'noreply@manacore.app';
		this.senderName = this.configService.get<string>('EMAIL_SENDER_NAME') || 'ManaCore';
		this.isEnabled = !!apiKey;

		this.apiInstance = new brevo.TransactionalEmailsApi();

		if (apiKey) {
			this.apiInstance.setApiKey(brevo.TransactionalEmailsApiApiKeys.apiKey, apiKey);
			this.logger.log('Brevo email service initialized');
		} else {
			this.logger.warn('BREVO_API_KEY not set - emails will be logged to console only');
		}
	}

	/**
	 * Send a transactional email
	 */
	async sendEmail(options: SendEmailOptions): Promise<boolean> {
		const { to, subject, htmlContent, textContent } = options;

		if (!this.isEnabled) {
			this.logger.log('[DEV MODE] Email would be sent:');
			this.logger.log(`  To: ${to}`);
			this.logger.log(`  Subject: ${subject}`);
			this.logger.log(`  Content: ${htmlContent.substring(0, 200)}...`);
			return true;
		}

		try {
			const sendSmtpEmail = new brevo.SendSmtpEmail();
			sendSmtpEmail.subject = subject;
			sendSmtpEmail.htmlContent = htmlContent;
			sendSmtpEmail.textContent = textContent;
			sendSmtpEmail.sender = {
				name: this.senderName,
				email: this.senderEmail,
			};
			sendSmtpEmail.to = [{ email: to }];

			const response = await this.apiInstance.sendTransacEmail(sendSmtpEmail);
			this.logger.log(`Email sent successfully to ${to}, messageId: ${response.body.messageId}`);
			return true;
		} catch (error) {
			this.logger.error(`Failed to send email to ${to}:`, error);
			return false;
		}
	}

	/**
	 * Send password reset email
	 */
	async sendPasswordResetEmail(options: PasswordResetEmailOptions): Promise<boolean> {
		const { email, name, resetUrl } = options;
		const displayName = name || 'there';

		const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Your Password</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table role="presentation" style="width: 100%; max-width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <tr>
            <td style="padding: 40px 40px 20px;">
              <h1 style="margin: 0 0 20px; font-size: 24px; font-weight: 600; color: #1a1a1a;">Reset Your Password</h1>
              <p style="margin: 0 0 20px; font-size: 16px; line-height: 24px; color: #4a4a4a;">
                Hi ${displayName},
              </p>
              <p style="margin: 0 0 20px; font-size: 16px; line-height: 24px; color: #4a4a4a;">
                We received a request to reset the password for your ManaCore account. Click the button below to choose a new password:
              </p>
              <table role="presentation" style="margin: 30px 0;">
                <tr>
                  <td>
                    <a href="${resetUrl}" style="display: inline-block; padding: 14px 28px; font-size: 16px; font-weight: 600; color: #ffffff; background-color: #6366f1; text-decoration: none; border-radius: 6px;">
                      Reset Password
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin: 0 0 20px; font-size: 14px; line-height: 22px; color: #6b6b6b;">
                This link will expire in 1 hour. If you didn't request a password reset, you can safely ignore this email.
              </p>
              <hr style="border: none; border-top: 1px solid #e5e5e5; margin: 30px 0;">
              <p style="margin: 0; font-size: 12px; line-height: 18px; color: #999999;">
                If the button above doesn't work, copy and paste this URL into your browser:<br>
                <a href="${resetUrl}" style="color: #6366f1; word-break: break-all;">${resetUrl}</a>
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding: 20px 40px 40px;">
              <p style="margin: 0; font-size: 12px; line-height: 18px; color: #999999; text-align: center;">
                &copy; ${new Date().getFullYear()} ManaCore. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

		const textContent = `
Reset Your Password

Hi ${displayName},

We received a request to reset the password for your ManaCore account.

Reset your password by visiting this link:
${resetUrl}

This link will expire in 1 hour. If you didn't request a password reset, you can safely ignore this email.

© ${new Date().getFullYear()} ManaCore. All rights reserved.
`;

		return this.sendEmail({
			to: email,
			subject: 'Reset Your Password - ManaCore',
			htmlContent,
			textContent,
		});
	}

	/**
	 * Send organization invitation email
	 */
	async sendOrganizationInviteEmail(options: OrganizationInviteEmailOptions): Promise<boolean> {
		const { email, organizationName, inviterName, inviteUrl, role } = options;
		const inviterText = inviterName ? `${inviterName} has invited you` : 'You have been invited';

		const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Organization Invitation</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table role="presentation" style="width: 100%; max-width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <tr>
            <td style="padding: 40px 40px 20px;">
              <h1 style="margin: 0 0 20px; font-size: 24px; font-weight: 600; color: #1a1a1a;">You're Invited!</h1>
              <p style="margin: 0 0 20px; font-size: 16px; line-height: 24px; color: #4a4a4a;">
                ${inviterText} to join <strong>${organizationName}</strong> on ManaCore as a <strong>${role}</strong>.
              </p>
              <table role="presentation" style="margin: 30px 0;">
                <tr>
                  <td>
                    <a href="${inviteUrl}" style="display: inline-block; padding: 14px 28px; font-size: 16px; font-weight: 600; color: #ffffff; background-color: #6366f1; text-decoration: none; border-radius: 6px;">
                      Accept Invitation
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin: 0 0 20px; font-size: 14px; line-height: 22px; color: #6b6b6b;">
                This invitation will expire in 7 days. If you don't want to join this organization, you can safely ignore this email.
              </p>
              <hr style="border: none; border-top: 1px solid #e5e5e5; margin: 30px 0;">
              <p style="margin: 0; font-size: 12px; line-height: 18px; color: #999999;">
                If the button above doesn't work, copy and paste this URL into your browser:<br>
                <a href="${inviteUrl}" style="color: #6366f1; word-break: break-all;">${inviteUrl}</a>
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding: 20px 40px 40px;">
              <p style="margin: 0; font-size: 12px; line-height: 18px; color: #999999; text-align: center;">
                &copy; ${new Date().getFullYear()} ManaCore. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

		const textContent = `
You're Invited!

${inviterText} to join ${organizationName} on ManaCore as a ${role}.

Accept your invitation by visiting this link:
${inviteUrl}

This invitation will expire in 7 days. If you don't want to join this organization, you can safely ignore this email.

© ${new Date().getFullYear()} ManaCore. All rights reserved.
`;

		return this.sendEmail({
			to: email,
			subject: `You're invited to join ${organizationName} - ManaCore`,
			htmlContent,
			textContent,
		});
	}
}
