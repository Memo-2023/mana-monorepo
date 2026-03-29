import { Resend } from 'resend';
import { env } from '$env/dynamic/private';
import { env as publicEnv } from '$env/dynamic/public';

// Initialize Resend client
const resend = new Resend(env.RESEND_API_KEY);

const FROM_EMAIL = env.RESEND_FROM_EMAIL || 'noreply@ulo.ad';
const APP_URL = publicEnv.PUBLIC_APP_URL || 'https://ulo.ad';

/**
 * Send a team invitation email
 */
export async function sendTeamInvitationEmail(
	recipientEmail: string,
	inviterName: string,
	inviteToken: string
): Promise<boolean> {
	try {
		const inviteUrl = `${APP_URL}/register?invite=${inviteToken}`;

		await resend.emails.send({
			from: `ulo.ad <${FROM_EMAIL}>`,
			to: recipientEmail,
			subject: `${inviterName} hat dich zu seinem Team eingeladen - ulo.ad`,
			html: `
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8fafc;">
  <!-- Logo/Header -->
  <div style="text-align: center; margin-bottom: 30px; padding: 20px;">
    <h1 style="color: #0ea5e9; font-size: 36px; margin: 0; font-weight: 700;">
      🔗 ulo.ad
    </h1>
  </div>

  <!-- Main Content Card -->
  <div style="background: #ffffff; border-radius: 16px; padding: 32px; box-shadow: 0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06);">
    <h2 style="color: #0f172a; font-size: 24px; margin-top: 0; margin-bottom: 16px; font-weight: 600;">
      Du wurdest zum Team eingeladen! 🎉
    </h2>

    <p style="color: #475569; font-size: 16px; line-height: 1.6; margin-bottom: 24px;">
      <strong>${inviterName}</strong> hat dich eingeladen, seinem Team bei ulo.ad beizutreten.
      Als Team-Mitglied kannst du Links erstellen und verwalten.
    </p>

    <!-- What you can do -->
    <div style="background: #f0f9ff; border-radius: 12px; padding: 16px; margin: 24px 0; border: 1px solid #bae6fd;">
      <p style="color: #0369a1; font-size: 14px; margin: 0 0 12px 0; font-weight: 600;">
        Als Team-Mitglied kannst du:
      </p>
      <ul style="color: #0c4a6e; font-size: 14px; margin: 0; padding-left: 20px; line-height: 1.8;">
        <li>Links erstellen und verwalten</li>
        <li>Deine eigenen Links bearbeiten und löschen</li>
        <li>Mit dem Team zusammenarbeiten</li>
      </ul>
    </div>

    <!-- CTA Button -->
    <div style="text-align: center; margin: 32px 0;">
      <a href="${inviteUrl}"
         style="display: inline-block; background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%);
                color: white; padding: 16px 40px; border-radius: 10px;
                text-decoration: none; font-weight: 600; font-size: 16px;
                box-shadow: 0 4px 14px rgba(14, 165, 233, 0.25);">
        ✉️ Einladung annehmen
      </a>
    </div>

    <!-- Alternative Link -->
    <div style="margin-top: 24px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
      <p style="color: #94a3b8; font-size: 13px; margin-bottom: 8px;">
        Falls der Button nicht funktioniert, kopiere diesen Link:
      </p>
      <p style="background: #f8fafc; padding: 12px; border-radius: 6px; word-break: break-all; font-size: 12px; color: #0ea5e9;">
        ${inviteUrl}
      </p>
    </div>

    <!-- Expiry Notice -->
    <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 12px; padding: 16px; margin-top: 24px;">
      <p style="color: #991b1b; font-size: 13px; margin: 0;">
        ⏰ Diese Einladung ist 7 Tage gültig
      </p>
    </div>
  </div>

  <!-- Footer -->
  <div style="text-align: center; margin-top: 32px; padding: 20px;">
    <p style="color: #94a3b8; font-size: 12px; margin: 8px 0;">
      Diese Einladung wurde an <strong>${recipientEmail}</strong> gesendet.
    </p>
    <p style="color: #cbd5e1; font-size: 11px; margin-top: 20px;">
      © ${new Date().getFullYear()} ulo.ad · <a href="https://ulo.ad" style="color: #0ea5e9; text-decoration: none;">ulo.ad</a>
    </p>
  </div>
</div>`,
		});

		console.log('[EMAIL] Team invitation sent to:', recipientEmail);
		return true;
	} catch (error) {
		console.error('[EMAIL] Failed to send invitation email:', error);
		return false;
	}
}

/**
 * Send notification when invitation is accepted
 */
export async function sendInvitationAcceptedEmail(
	ownerEmail: string,
	memberName: string
): Promise<boolean> {
	try {
		await resend.emails.send({
			from: `ulo.ad <${FROM_EMAIL}>`,
			to: ownerEmail,
			subject: `${memberName} hat deine Einladung angenommen - ulo.ad`,
			html: `
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8fafc;">
  <!-- Logo/Header -->
  <div style="text-align: center; margin-bottom: 30px; padding: 20px;">
    <h1 style="color: #0ea5e9; font-size: 36px; margin: 0; font-weight: 700;">
      🔗 ulo.ad
    </h1>
  </div>

  <!-- Main Content Card -->
  <div style="background: #ffffff; border-radius: 16px; padding: 32px; box-shadow: 0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06);">
    <h2 style="color: #0f172a; font-size: 24px; margin-top: 0; margin-bottom: 16px; font-weight: 600;">
      Neues Team-Mitglied! 🎊
    </h2>

    <p style="color: #475569; font-size: 16px; line-height: 1.6; margin-bottom: 24px;">
      <strong>${memberName}</strong> hat deine Einladung angenommen und ist jetzt Teil deines Teams.
    </p>

    <!-- Success Box -->
    <div style="background: #dcfce7; border: 1px solid #86efac; border-radius: 12px; padding: 16px; margin: 24px 0;">
      <p style="color: #14532d; font-size: 14px; margin: 0;">
        ✅ Das Team-Mitglied kann jetzt Links in deinem Account erstellen und verwalten.
      </p>
    </div>

    <!-- CTA Button -->
    <div style="text-align: center; margin: 32px 0;">
      <a href="${APP_URL}/settings/team"
         style="display: inline-block; background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%);
                color: white; padding: 16px 40px; border-radius: 10px;
                text-decoration: none; font-weight: 600; font-size: 16px;
                box-shadow: 0 4px 14px rgba(14, 165, 233, 0.25);">
        👥 Team verwalten
      </a>
    </div>
  </div>

  <!-- Footer -->
  <div style="text-align: center; margin-top: 32px; padding: 20px;">
    <p style="color: #cbd5e1; font-size: 11px; margin: 0;">
      © ${new Date().getFullYear()} ulo.ad · <a href="https://ulo.ad" style="color: #0ea5e9; text-decoration: none;">ulo.ad</a>
    </p>
  </div>
</div>`,
		});

		console.log('[EMAIL] Acceptance notification sent to:', ownerEmail);
		return true;
	} catch (error) {
		console.error('[EMAIL] Failed to send acceptance notification:', error);
		return false;
	}
}

/**
 * Send welcome email to new users
 */
export async function sendWelcomeEmail(to: string, username: string): Promise<boolean> {
	try {
		await resend.emails.send({
			from: `ulo.ad <${FROM_EMAIL}>`,
			to,
			subject: 'Willkommen bei ulo.ad!',
			html: `
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8fafc;">
  <div style="text-align: center; margin-bottom: 30px; padding: 20px;">
    <h1 style="color: #0ea5e9; font-size: 36px; margin: 0; font-weight: 700;">
      🔗 ulo.ad
    </h1>
  </div>

  <div style="background: #ffffff; border-radius: 16px; padding: 32px; box-shadow: 0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06);">
    <h1 style="color: #0f172a; font-size: 24px; margin-top: 0;">Willkommen, ${username}!</h1>
    <p style="color: #475569; font-size: 16px; line-height: 1.6;">Danke, dass du bei ulo.ad dabei bist. Wir freuen uns, dich an Bord zu haben.</p>
    <p style="color: #475569; font-size: 16px; line-height: 1.6;">Mit ulo.ad kannst du:</p>
    <ul style="color: #475569; font-size: 16px; line-height: 1.8;">
      <li>URLs kürzen und anpassen</li>
      <li>Click-Analytics verfolgen</li>
      <li>Links mit Tags und Workspaces organisieren</li>
      <li>QR-Codes generieren</li>
      <li>Ablaufdaten und Click-Limits setzen</li>
    </ul>
    <div style="text-align: center; margin: 32px 0;">
      <a href="${APP_URL}/my/links" style="display: inline-block; background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%); color: white; padding: 16px 40px; border-radius: 10px; text-decoration: none; font-weight: 600; font-size: 16px;">
        Los geht's
      </a>
    </div>
  </div>

  <div style="text-align: center; margin-top: 32px; padding: 20px;">
    <p style="color: #cbd5e1; font-size: 11px;">
      © ${new Date().getFullYear()} ulo.ad
    </p>
  </div>
</div>`,
		});

		return true;
	} catch (error) {
		console.error('[EMAIL] Failed to send welcome email:', error);
		return false;
	}
}
