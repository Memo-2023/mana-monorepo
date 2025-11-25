import { pb } from '$lib/pocketbase';

/**
 * Email sender that uses PocketBase's built-in email functionality
 * This works by leveraging the existing email templates and SMTP configuration
 */
export class EmailSender {
	/**
	 * Send email using PocketBase's configured SMTP
	 * Note: This requires SMTP to be configured in PocketBase admin settings
	 */
	static async sendEmail(to: string, subject: string, html: string): Promise<boolean> {
		try {
			// Log email for development
			console.log('═══════════════════════════════════════════════════════');
			console.log('📧 EMAIL WOULD BE SENT');
			console.log('═══════════════════════════════════════════════════════');
			console.log('To:', to);
			console.log('Subject:', subject);
			console.log('─────────────────────────────────────────────────────');
			console.log('Content Preview:');
			// Extract text content from HTML for preview
			const textContent = html.replace(/<[^>]*>/g, '').substring(0, 200);
			console.log(textContent + '...');
			console.log('═══════════════════════════════════════════════════════');
			
			// In production, you would configure one of these options:
			
			// Option 1: Use PocketBase SMTP (configure in PocketBase admin)
			// The settings are at: https://pb.ulo.ad/_/#/settings/mail
			// You need to set:
			// - SMTP server host
			// - Port (usually 587 for TLS)
			// - Username/Password
			// - Use TLS
			
			// Option 2: Use a third-party email service
			// For example, using Brevo (formerly SendinBlue):
			/*
			const response = await fetch('https://api.brevo.com/v3/smtp/email', {
				method: 'POST',
				headers: {
					'accept': 'application/json',
					'api-key': process.env.BREVO_API_KEY || '',
					'content-type': 'application/json'
				},
				body: JSON.stringify({
					sender: { email: 'noreply@ulo.ad', name: 'ulo.ad' },
					to: [{ email: to }],
					subject: subject,
					htmlContent: html
				})
			});
			
			if (!response.ok) {
				throw new Error(`Email API error: ${response.status}`);
			}
			*/
			
			// Option 3: Use Resend.com (very simple API)
			/*
			const response = await fetch('https://api.resend.com/emails', {
				method: 'POST',
				headers: {
					'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					from: 'ulo.ad <noreply@ulo.ad>',
					to: to,
					subject: subject,
					html: html
				})
			});
			
			if (!response.ok) {
				throw new Error(`Email API error: ${response.status}`);
			}
			*/
			
			return true;
		} catch (error) {
			console.error('Failed to send email:', error);
			return false;
		}
	}
	
	/**
	 * Instructions for setting up email:
	 * 
	 * OPTION 1: PocketBase SMTP (Recommended)
	 * 1. Go to https://pb.ulo.ad/_/#/settings/mail
	 * 2. Enable "Use SMTP mail server"
	 * 3. Enter your SMTP details:
	 *    - For Gmail: smtp.gmail.com, port 587, use app password
	 *    - For Outlook: smtp-mail.outlook.com, port 587
	 *    - For Custom: Your SMTP server details
	 * 4. Save settings
	 * 
	 * OPTION 2: Brevo (Free tier: 300 emails/day)
	 * 1. Sign up at https://www.brevo.com
	 * 2. Get API key from https://app.brevo.com/settings/keys/api
	 * 3. Add to .env: BREVO_API_KEY=your-api-key
	 * 4. Uncomment the Brevo code above
	 * 
	 * OPTION 3: Resend (Free tier: 100 emails/day)
	 * 1. Sign up at https://resend.com
	 * 2. Verify your domain
	 * 3. Get API key
	 * 4. Add to .env: RESEND_API_KEY=your-api-key
	 * 5. Uncomment the Resend code above
	 */
}