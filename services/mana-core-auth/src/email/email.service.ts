import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as brevo from '@getbrevo/brevo';

export interface SendEmailOptions {
	to: string;
	subject: string;
	htmlContent: string;
	textContent?: string;
}

export interface PasswordResetEmailData {
	email: string;
	name?: string;
	resetUrl: string;
}

export interface InvitationEmailData {
	email: string;
	organizationName: string;
	inviterName?: string;
	invitationUrl: string;
}

export interface VerificationEmailData {
	email: string;
	name?: string;
	verificationUrl: string;
}

@Injectable()
export class EmailService {
	private readonly logger = new Logger(EmailService.name);
	private readonly apiInstance: brevo.TransactionalEmailsApi;
	private readonly fromEmail: string;
	private readonly fromName: string;
	private readonly isConfigured: boolean;

	constructor(private configService: ConfigService) {
		const apiKey = this.configService.get<string>('email.brevoApiKey');
		this.fromEmail = this.configService.get<string>('email.fromEmail') || 'noreply@manacore.app';
		this.fromName = this.configService.get<string>('email.fromName') || 'Mana Core';

		this.apiInstance = new brevo.TransactionalEmailsApi();

		if (apiKey) {
			this.apiInstance.setApiKey(brevo.TransactionalEmailsApiApiKeys.apiKey, apiKey);
			this.isConfigured = true;
			this.logger.log('Email service configured with Brevo');
		} else {
			this.isConfigured = false;
			this.logger.warn('Email service not configured - BREVO_API_KEY is missing');
		}
	}

	/**
	 * Send a transactional email via Brevo
	 */
	async sendEmail(options: SendEmailOptions): Promise<boolean> {
		if (!this.isConfigured) {
			this.logger.warn(`[DEV MODE] Would send email to ${options.to}: ${options.subject}`);
			this.logger.debug(`Email content: ${options.htmlContent}`);
			return true;
		}

		try {
			const sendSmtpEmail = new brevo.SendSmtpEmail();
			sendSmtpEmail.sender = { email: this.fromEmail, name: this.fromName };
			sendSmtpEmail.to = [{ email: options.to }];
			sendSmtpEmail.subject = options.subject;
			sendSmtpEmail.htmlContent = options.htmlContent;

			if (options.textContent) {
				sendSmtpEmail.textContent = options.textContent;
			}

			await this.apiInstance.sendTransacEmail(sendSmtpEmail);
			this.logger.log(`Email sent successfully to ${options.to}`);
			return true;
		} catch (error) {
			this.logger.error(`Failed to send email to ${options.to}:`, error);
			throw error;
		}
	}

	/**
	 * Send password reset email
	 */
	async sendPasswordResetEmail(data: PasswordResetEmailData): Promise<boolean> {
		const subject = 'Reset your Mana Core password';
		const htmlContent = this.getPasswordResetTemplate(data);
		const textContent = `
Reset your password

Hi${data.name ? ` ${data.name}` : ''},

You requested to reset your password. Click the link below to set a new password:

${data.resetUrl}

This link will expire in 1 hour.

If you didn't request this, you can safely ignore this email.

- The Mana Core Team
`.trim();

		return this.sendEmail({
			to: data.email,
			subject,
			htmlContent,
			textContent,
		});
	}

	/**
	 * Send organization invitation email
	 */
	async sendInvitationEmail(data: InvitationEmailData): Promise<boolean> {
		const subject = `You've been invited to join ${data.organizationName} on Mana Core`;
		const htmlContent = this.getInvitationTemplate(data);
		const textContent = `
You've been invited to ${data.organizationName}

Hi,

${data.inviterName ? `${data.inviterName} has` : 'You have been'} invited you to join ${data.organizationName} on Mana Core.

Click the link below to accept the invitation:

${data.invitationUrl}

This invitation will expire in 7 days.

- The Mana Core Team
`.trim();

		return this.sendEmail({
			to: data.email,
			subject,
			htmlContent,
			textContent,
		});
	}

	/**
	 * Send email verification email
	 */
	async sendVerificationEmail(data: VerificationEmailData): Promise<boolean> {
		const subject = 'Verify your Mana Core email address';
		const htmlContent = this.getVerificationTemplate(data);
		const textContent = `
Verify your email address

Hi${data.name ? ` ${data.name}` : ''},

Please verify your email address by clicking the link below:

${data.verificationUrl}

This link will expire in 24 hours.

If you didn't create a Mana Core account, you can safely ignore this email.

- The Mana Core Team
`.trim();

		return this.sendEmail({
			to: data.email,
			subject,
			htmlContent,
			textContent,
		});
	}

	/**
	 * Password reset email template
	 */
	private getPasswordResetTemplate(data: PasswordResetEmailData): string {
		return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset your password</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td style="padding: 40px 20px;">
        <table role="presentation" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);">
          <tr>
            <td style="padding: 40px; text-align: center;">
              <h1 style="margin: 0 0 24px; font-size: 24px; font-weight: 600; color: #1a1a1a;">Reset your password</h1>
              <p style="margin: 0 0 24px; font-size: 16px; line-height: 1.5; color: #4a4a4a;">
                Hi${data.name ? ` ${data.name}` : ''},<br><br>
                You requested to reset your password. Click the button below to set a new password:
              </p>
              <a href="${data.resetUrl}" style="display: inline-block; padding: 14px 32px; background-color: #6366f1; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 500; font-size: 16px;">
                Reset Password
              </a>
              <p style="margin: 24px 0 0; font-size: 14px; color: #6b7280;">
                This link will expire in 1 hour.<br>
                If you didn't request this, you can safely ignore this email.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding: 24px 40px; background-color: #f9fafb; border-top: 1px solid #e5e7eb; border-radius: 0 0 8px 8px;">
              <p style="margin: 0; font-size: 12px; color: #9ca3af; text-align: center;">
                © ${new Date().getFullYear()} Mana Core. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`.trim();
	}

	/**
	 * Organization invitation email template
	 */
	private getInvitationTemplate(data: InvitationEmailData): string {
		return `
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
      <td style="padding: 40px 20px;">
        <table role="presentation" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);">
          <tr>
            <td style="padding: 40px; text-align: center;">
              <h1 style="margin: 0 0 24px; font-size: 24px; font-weight: 600; color: #1a1a1a;">You've been invited!</h1>
              <p style="margin: 0 0 24px; font-size: 16px; line-height: 1.5; color: #4a4a4a;">
                ${data.inviterName ? `${data.inviterName} has` : 'You have been'} invited you to join <strong>${data.organizationName}</strong> on Mana Core.
              </p>
              <a href="${data.invitationUrl}" style="display: inline-block; padding: 14px 32px; background-color: #6366f1; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 500; font-size: 16px;">
                Accept Invitation
              </a>
              <p style="margin: 24px 0 0; font-size: 14px; color: #6b7280;">
                This invitation will expire in 7 days.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding: 24px 40px; background-color: #f9fafb; border-top: 1px solid #e5e7eb; border-radius: 0 0 8px 8px;">
              <p style="margin: 0; font-size: 12px; color: #9ca3af; text-align: center;">
                © ${new Date().getFullYear()} Mana Core. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`.trim();
	}

	/**
	 * Email verification template
	 */
	private getVerificationTemplate(data: VerificationEmailData): string {
		return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verify your email</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td style="padding: 40px 20px;">
        <table role="presentation" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);">
          <tr>
            <td style="padding: 40px; text-align: center;">
              <h1 style="margin: 0 0 24px; font-size: 24px; font-weight: 600; color: #1a1a1a;">Verify your email</h1>
              <p style="margin: 0 0 24px; font-size: 16px; line-height: 1.5; color: #4a4a4a;">
                Hi${data.name ? ` ${data.name}` : ''},<br><br>
                Thanks for signing up! Please verify your email address by clicking the button below:
              </p>
              <a href="${data.verificationUrl}" style="display: inline-block; padding: 14px 32px; background-color: #6366f1; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 500; font-size: 16px;">
                Verify Email
              </a>
              <p style="margin: 24px 0 0; font-size: 14px; color: #6b7280;">
                This link will expire in 24 hours.<br>
                If you didn't create a Mana Core account, you can safely ignore this email.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding: 24px 40px; background-color: #f9fafb; border-top: 1px solid #e5e7eb; border-radius: 0 0 8px 8px;">
              <p style="margin: 0; font-size: 12px; color: #9ca3af; text-align: center;">
                © ${new Date().getFullYear()} Mana Core. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`.trim();
	}
}
