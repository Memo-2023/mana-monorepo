/**
 * Standalone email sender for Better Auth callbacks
 *
 * This module provides email sending functionality that can be used
 * outside of the NestJS DI context (e.g., in Better Auth callbacks).
 */

import * as brevo from '@getbrevo/brevo';

interface EmailConfig {
	apiKey?: string;
	fromEmail: string;
	fromName: string;
}

function getEmailConfig(): EmailConfig {
	return {
		apiKey: process.env.BREVO_API_KEY,
		fromEmail: process.env.BREVO_FROM_EMAIL || 'noreply@manacore.app',
		fromName: process.env.BREVO_FROM_NAME || 'Mana Core',
	};
}

let apiInstance: brevo.TransactionalEmailsApi | null = null;

function getApiInstance(): brevo.TransactionalEmailsApi | null {
	const config = getEmailConfig();

	if (!config.apiKey) {
		return null;
	}

	if (!apiInstance) {
		apiInstance = new brevo.TransactionalEmailsApi();
		apiInstance.setApiKey(brevo.TransactionalEmailsApiApiKeys.apiKey, config.apiKey);
	}

	return apiInstance;
}

/**
 * Send password reset email
 */
export async function sendPasswordResetEmail(
	email: string,
	resetUrl: string,
	userName?: string
): Promise<void> {
	const config = getEmailConfig();
	const api = getApiInstance();

	if (!api) {
		console.log('[DEV MODE] Password reset email would be sent to:', email);
		console.log('[DEV MODE] Reset URL:', resetUrl);
		return;
	}

	const sendSmtpEmail = new brevo.SendSmtpEmail();
	sendSmtpEmail.sender = { email: config.fromEmail, name: config.fromName };
	sendSmtpEmail.to = [{ email }];
	sendSmtpEmail.subject = 'Reset your Mana Core password';
	sendSmtpEmail.htmlContent = getPasswordResetTemplate(resetUrl, userName);
	sendSmtpEmail.textContent = `
Reset your password

Hi${userName ? ` ${userName}` : ''},

You requested to reset your password. Click the link below to set a new password:

${resetUrl}

This link will expire in 1 hour.

If you didn't request this, you can safely ignore this email.

- The Mana Core Team
`.trim();

	try {
		await api.sendTransacEmail(sendSmtpEmail);
		console.log(`Password reset email sent to ${email}`);
	} catch (error) {
		console.error(`Failed to send password reset email to ${email}:`, error);
		throw error;
	}
}

/**
 * Send organization invitation email
 */
export async function sendOrganizationInvitationEmail(
	email: string,
	organizationName: string,
	invitationUrl: string,
	inviterName?: string
): Promise<void> {
	const config = getEmailConfig();
	const api = getApiInstance();

	if (!api) {
		console.log('[DEV MODE] Invitation email would be sent to:', email);
		console.log('[DEV MODE] Organization:', organizationName);
		console.log('[DEV MODE] Invitation URL:', invitationUrl);
		return;
	}

	const sendSmtpEmail = new brevo.SendSmtpEmail();
	sendSmtpEmail.sender = { email: config.fromEmail, name: config.fromName };
	sendSmtpEmail.to = [{ email }];
	sendSmtpEmail.subject = `You've been invited to join ${organizationName} on Mana Core`;
	sendSmtpEmail.htmlContent = getInvitationTemplate(organizationName, invitationUrl, inviterName);
	sendSmtpEmail.textContent = `
You've been invited to ${organizationName}

Hi,

${inviterName ? `${inviterName} has` : 'You have been'} invited you to join ${organizationName} on Mana Core.

Click the link below to accept the invitation:

${invitationUrl}

This invitation will expire in 7 days.

- The Mana Core Team
`.trim();

	try {
		await api.sendTransacEmail(sendSmtpEmail);
		console.log(`Invitation email sent to ${email}`);
	} catch (error) {
		console.error(`Failed to send invitation email to ${email}:`, error);
		throw error;
	}
}

/**
 * Send email verification email
 */
export async function sendVerificationEmail(
	email: string,
	verificationUrl: string,
	userName?: string
): Promise<void> {
	const config = getEmailConfig();
	const api = getApiInstance();

	if (!api) {
		console.log('[DEV MODE] Verification email would be sent to:', email);
		console.log('[DEV MODE] Verification URL:', verificationUrl);
		return;
	}

	const sendSmtpEmail = new brevo.SendSmtpEmail();
	sendSmtpEmail.sender = { email: config.fromEmail, name: config.fromName };
	sendSmtpEmail.to = [{ email }];
	sendSmtpEmail.subject = 'Verify your Mana Core email address';
	sendSmtpEmail.htmlContent = getVerificationTemplate(verificationUrl, userName);
	sendSmtpEmail.textContent = `
Verify your email address

Hi${userName ? ` ${userName}` : ''},

Please verify your email address by clicking the link below:

${verificationUrl}

This link will expire in 24 hours.

If you didn't create a Mana Core account, you can safely ignore this email.

- The Mana Core Team
`.trim();

	try {
		await api.sendTransacEmail(sendSmtpEmail);
		console.log(`Verification email sent to ${email}`);
	} catch (error) {
		console.error(`Failed to send verification email to ${email}:`, error);
		throw error;
	}
}

function getPasswordResetTemplate(resetUrl: string, userName?: string): string {
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
                Hi${userName ? ` ${userName}` : ''},<br><br>
                You requested to reset your password. Click the button below to set a new password:
              </p>
              <a href="${resetUrl}" style="display: inline-block; padding: 14px 32px; background-color: #6366f1; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 500; font-size: 16px;">
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

function getInvitationTemplate(
	organizationName: string,
	invitationUrl: string,
	inviterName?: string
): string {
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
                ${inviterName ? `${inviterName} has` : 'You have been'} invited you to join <strong>${organizationName}</strong> on Mana Core.
              </p>
              <a href="${invitationUrl}" style="display: inline-block; padding: 14px 32px; background-color: #6366f1; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 500; font-size: 16px;">
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

function getVerificationTemplate(verificationUrl: string, userName?: string): string {
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
                Hi${userName ? ` ${userName}` : ''},<br><br>
                Thanks for signing up! Please verify your email address by clicking the button below:
              </p>
              <a href="${verificationUrl}" style="display: inline-block; padding: 14px 32px; background-color: #6366f1; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 500; font-size: 16px;">
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
