import { pb } from '$lib/pocketbase';
import { EmailSender } from './email-sender';

export interface EmailOptions {
	to: string;
	subject: string;
	html: string;
	from?: string;
}

export interface InvitationEmailData {
	inviterName: string;
	inviterEmail: string;
	recipientEmail: string;
	token: string;
	appUrl: string;
	isNewUser: boolean;
}

export class EmailService {
	private static getBaseUrl(): string {
		if (typeof window !== 'undefined') {
			return window.location.origin;
		}
		return process.env.ORIGIN || 'http://localhost:5173';
	}

	static async sendTeamInvitation(data: InvitationEmailData): Promise<boolean> {
		const appUrl = this.getBaseUrl();
		const subject = `${data.inviterName || data.inviterEmail} hat dich zu seinem Team eingeladen / invited you to their team - ulo.ad 👥`;
		
		const html = data.isNewUser 
			? this.getNewUserInvitationTemplate({...data, appUrl})
			: this.getExistingUserInvitationTemplate({...data, appUrl});

		try {
			// Use the EmailSender to actually send the email
			return await EmailSender.sendEmail(data.recipientEmail, subject, html);
		} catch (error) {
			console.error('[EMAIL] Failed to send invitation:', error);
			return false;
		}
	}

	static getExistingUserInvitationTemplate(data: InvitationEmailData): string {
		return `
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
      👥 Team-Einladung / Team Invitation
    </h2>
    
    <p style="color: #475569; font-size: 16px; line-height: 1.6; margin-bottom: 24px;">
      <strong>🇩🇪</strong> ${data.inviterName || data.inviterEmail} hat dich eingeladen, Teil des Teams zu werden!<br>
      <strong>🇬🇧</strong> ${data.inviterName || data.inviterEmail} has invited you to join their team!
    </p>

    <!-- Invitation Details -->
    <div style="background: #f0f9ff; border-radius: 12px; padding: 16px; margin: 24px 0; border: 1px solid #bae6fd;">
      <p style="color: #0369a1; font-size: 14px; margin: 0;">
        <strong>Von / From:</strong> ${data.inviterEmail}<br>
        <strong>An / To:</strong> ${data.recipientEmail}
      </p>
    </div>

    <!-- What this means -->
    <div style="background: #f8fafc; border-radius: 12px; padding: 16px; margin: 24px 0;">
      <p style="color: #0f172a; font-size: 14px; margin: 0 0 12px 0; font-weight: 600;">
        💡 Was bedeutet das? / What does this mean?
      </p>
      <ul style="color: #475569; font-size: 13px; margin: 0; padding-left: 20px; line-height: 1.6;">
        <li>Du kannst Links unter dem Account von ${data.inviterName || data.inviterEmail} erstellen / You can create links under ${data.inviterName || data.inviterEmail}'s account</li>
        <li>Du kannst deine eigenen Links bearbeiten und löschen / You can edit and delete your own links</li>
        <li>Deine Links erscheinen unter der URL des Accountbesitzers / Your links will appear under the account owner's URL</li>
      </ul>
    </div>

    <!-- CTA Button -->
    <div style="text-align: center; margin: 32px 0;">
      <a href="${data.appUrl}/team/accept-invite?token=${data.token}" 
         style="display: inline-block; background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%); 
                color: white; padding: 16px 40px; border-radius: 10px; 
                text-decoration: none; font-weight: 600; font-size: 16px;
                box-shadow: 0 4px 14px rgba(14, 165, 233, 0.25);">
        ✅ Einladung annehmen / Accept Invitation
      </a>
    </div>

    <!-- Expiry Notice -->
    <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 12px; padding: 12px; margin: 24px 0; text-align: center;">
      <p style="color: #991b1b; font-size: 13px; margin: 0;">
        ⏱️ Diese Einladung ist 7 Tage gültig / This invitation is valid for 7 days
      </p>
    </div>
  </div>

  <!-- Alternative Link -->
  <div style="background: #ffffff; border-radius: 12px; padding: 16px; margin-top: 20px;">
    <p style="color: #94a3b8; font-size: 12px; margin: 0 0 8px 0;">
      Falls der Button nicht funktioniert / If the button doesn't work:
    </p>
    <p style="background: #f8fafc; padding: 12px; border-radius: 6px; word-break: break-all; font-size: 11px; color: #0ea5e9; margin: 0;">
      ${data.appUrl}/team/accept-invite?token=${data.token}
    </p>
  </div>

  <!-- Footer -->
  <div style="text-align: center; margin-top: 32px; padding: 20px;">
    <p style="color: #cbd5e1; font-size: 11px; margin: 0;">
      © 2025 ulo.ad · <a href="https://ulo.ad" style="color: #0ea5e9; text-decoration: none;">ulo.ad</a>
    </p>
  </div>
</div>`;
	}

	static getNewUserInvitationTemplate(data: InvitationEmailData): string {
		return `
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
      🎉 Willkommen bei ulo.ad / Welcome to ulo.ad
    </h2>
    
    <p style="color: #475569; font-size: 16px; line-height: 1.6; margin-bottom: 24px;">
      <strong>🇩🇪</strong> ${data.inviterName || data.inviterEmail} hat dich eingeladen, Teil des Teams zu werden!<br>
      <strong>🇬🇧</strong> ${data.inviterName || data.inviterEmail} has invited you to join their team!
    </p>

    <!-- New User Notice -->
    <div style="background: #dcfce7; border: 1px solid #86efac; border-radius: 12px; padding: 16px; margin: 24px 0;">
      <p style="color: #14532d; font-size: 14px; margin: 0 0 12px 0; font-weight: 600;">
        🆕 Neu bei ulo.ad? / New to ulo.ad?
      </p>
      <p style="color: #166534; font-size: 13px; margin: 0;">
        <strong>🇩🇪</strong> Kein Problem! Erstelle einfach einen kostenlosen Account und die Einladung wird automatisch angenommen.<br>
        <strong>🇬🇧</strong> No problem! Simply create a free account and the invitation will be accepted automatically.
      </p>
    </div>

    <!-- What is ulo.ad -->
    <div style="background: #f8fafc; border-radius: 12px; padding: 16px; margin: 24px 0;">
      <p style="color: #0f172a; font-size: 14px; margin: 0 0 12px 0; font-weight: 600;">
        🔗 Was ist ulo.ad? / What is ulo.ad?
      </p>
      <ul style="color: #475569; font-size: 13px; margin: 0; padding-left: 20px; line-height: 1.6;">
        <li>Erstelle kurze, merkbare Links / Create short, memorable links</li>
        <li>Teile Inhalte mit deinem Team / Share content with your team</li>
        <li>Verfolge Klicks und Statistiken / Track clicks and statistics</li>
        <li>100% kostenlos für Teams / 100% free for teams</li>
      </ul>
    </div>

    <!-- CTA Button -->
    <div style="text-align: center; margin: 32px 0;">
      <a href="${data.appUrl}/register?invite=${data.token}" 
         style="display: inline-block; background: linear-gradient(135deg, #10b981 0%, #059669 100%); 
                color: white; padding: 16px 40px; border-radius: 10px; 
                text-decoration: none; font-weight: 600; font-size: 16px;
                box-shadow: 0 4px 14px rgba(16, 185, 129, 0.25);">
        🚀 Account erstellen & Team beitreten / Create Account & Join Team
      </a>
    </div>

    <!-- Expiry Notice -->
    <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 12px; padding: 12px; margin: 24px 0; text-align: center;">
      <p style="color: #991b1b; font-size: 13px; margin: 0;">
        ⏱️ Diese Einladung ist 7 Tage gültig / This invitation is valid for 7 days
      </p>
    </div>
  </div>

  <!-- Alternative Link -->
  <div style="background: #ffffff; border-radius: 12px; padding: 16px; margin-top: 20px;">
    <p style="color: #94a3b8; font-size: 12px; margin: 0 0 8px 0;">
      Falls der Button nicht funktioniert / If the button doesn't work:
    </p>
    <p style="background: #f8fafc; padding: 12px; border-radius: 6px; word-break: break-all; font-size: 11px; color: #0ea5e9; margin: 0;">
      ${data.appUrl}/register?invite=${data.token}
    </p>
  </div>

  <!-- Footer -->
  <div style="text-align: center; margin-top: 32px; padding: 20px;">
    <p style="color: #cbd5e1; font-size: 11px; margin: 0;">
      © 2025 ulo.ad · <a href="https://ulo.ad" style="color: #0ea5e9; text-decoration: none;">ulo.ad</a>
    </p>
  </div>
</div>`;
	}

	static async sendAcceptanceNotification(inviterEmail: string, acceptedByEmail: string): Promise<boolean> {
		const subject = `${acceptedByEmail} hat deine Einladung angenommen / accepted your invitation - ulo.ad ✅`;
		const html = this.getInvitationAcceptedTemplate(inviterEmail, acceptedByEmail);
		
		try {
			return await EmailSender.sendEmail(inviterEmail, subject, html);
		} catch (error) {
			console.error('[EMAIL] Failed to send acceptance notification:', error);
			return false;
		}
	}

	static getInvitationAcceptedTemplate(inviterEmail: string, acceptedByEmail: string): string {
		return `
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8fafc;">
  <!-- Logo/Header -->
  <div style="text-align: center; margin-bottom: 30px; padding: 20px;">
    <h1 style="color: #0ea5e9; font-size: 36px; margin: 0; font-weight: 700;">
      🔗 ulo.ad
    </h1>
  </div>

  <!-- Main Content Card -->
  <div style="background: #ffffff; border-radius: 16px; padding: 32px; box-shadow: 0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06);">
    <div style="text-align: center; margin-bottom: 24px;">
      <div style="display: inline-block; background: #dcfce7; border-radius: 50%; padding: 16px;">
        <span style="font-size: 48px;">✅</span>
      </div>
    </div>

    <h2 style="color: #0f172a; font-size: 24px; margin-top: 0; margin-bottom: 16px; font-weight: 600; text-align: center;">
      Einladung angenommen / Invitation Accepted
    </h2>
    
    <p style="color: #475569; font-size: 16px; line-height: 1.6; margin-bottom: 24px; text-align: center;">
      <strong>🇩🇪</strong> ${acceptedByEmail} hat deine Team-Einladung angenommen!<br>
      <strong>🇬🇧</strong> ${acceptedByEmail} has accepted your team invitation!
    </p>

    <!-- Team Member Info -->
    <div style="background: #f0f9ff; border-radius: 12px; padding: 16px; margin: 24px 0; border: 1px solid #bae6fd;">
      <p style="color: #0369a1; font-size: 14px; margin: 0;">
        <strong>Neues Teammitglied / New team member:</strong> ${acceptedByEmail}<br>
        <strong>Status:</strong> ✅ Aktiv / Active
      </p>
    </div>

    <!-- CTA Button -->
    <div style="text-align: center; margin: 32px 0;">
      <a href="${this.getBaseUrl()}/settings/team" 
         style="display: inline-block; background: #0ea5e9; 
                color: white; padding: 12px 24px; border-radius: 8px; 
                text-decoration: none; font-weight: 600; font-size: 14px;">
        👥 Team verwalten / Manage Team
      </a>
    </div>
  </div>

  <!-- Footer -->
  <div style="text-align: center; margin-top: 32px; padding: 20px;">
    <p style="color: #cbd5e1; font-size: 11px; margin: 0;">
      © 2025 ulo.ad · <a href="https://ulo.ad" style="color: #0ea5e9; text-decoration: none;">ulo.ad</a>
    </p>
  </div>
</div>`;
	}
}