# Email Configuration Guide for ulo.ad

The team invitation system is fully implemented and ready to send emails. To enable actual email sending, choose one of the following options:

## Option 1: PocketBase SMTP (Recommended) ⭐

1. **Access PocketBase Admin Panel**
   - Go to: https://pb.ulo.ad/_/
   - Login with your admin credentials

2. **Navigate to Mail Settings**
   - Go to Settings → Mail settings
   - Or direct link: https://pb.ulo.ad/_/#/settings/mail

3. **Configure SMTP**
   - Enable "Use SMTP mail server"
   - Enter your SMTP details:

   **For Gmail:**
   - SMTP Host: `smtp.gmail.com`
   - Port: `587`
   - Username: Your Gmail address
   - Password: Generate an [App Password](https://support.google.com/accounts/answer/185833)
   - Use TLS: ✅

   **For Outlook/Hotmail:**
   - SMTP Host: `smtp-mail.outlook.com`
   - Port: `587`
   - Username: Your Outlook email
   - Password: Your password
   - Use TLS: ✅

   **For Custom Domain (e.g., Zoho, FastMail):**
   - Check your email provider's SMTP settings

4. **Save Settings**
   - Click "Save changes"
   - Test by inviting a team member

## Option 2: Brevo (Free - 300 emails/day)

1. **Sign up at [Brevo](https://www.brevo.com)**
2. **Get your API key**
   - Go to: https://app.brevo.com/settings/keys/api
   - Copy the API key

3. **Add to `.env`**

   ```env
   BREVO_API_KEY=your-api-key-here
   ```

4. **Update `/src/lib/services/email-sender.ts`**
   - Uncomment the Brevo code section (lines 35-50)
   - Comment out the console.log section

## Option 3: Resend (Free - 100 emails/day)

1. **Sign up at [Resend](https://resend.com)**
2. **Verify your domain**
3. **Get your API key**

4. **Add to `.env`**

   ```env
   RESEND_API_KEY=your-api-key-here
   ```

5. **Update `/src/lib/services/email-sender.ts`**
   - Uncomment the Resend code section (lines 52-66)
   - Comment out the console.log section

## Testing Email Setup

1. **Restart the dev server** (if you added environment variables)

   ```bash
   npm run dev
   ```

2. **Test invitation flow:**
   - Go to Settings → Team Management
   - Invite a team member by email
   - Check the console/logs to see if email was sent
   - Check recipient's inbox

## Current Status

✅ **Email templates are ready**
✅ **Invitation flow is complete**
✅ **Email logging is active** (you'll see emails in console)
⏳ **SMTP configuration needed** (choose one option above)

## Email Templates Included

1. **Team invitation for existing users** - Sent when inviting registered users
2. **Team invitation for new users** - Sent when inviting non-registered emails
3. **Invitation accepted notification** - Sent to owner when invitation is accepted

All templates are bilingual (German/English) and mobile-responsive.

## Troubleshooting

- **Emails not sending?** Check PocketBase logs: Admin → Logs
- **SMTP errors?** Verify credentials and port settings
- **Gmail blocking?** Use App Password, not regular password
- **Rate limits?** Free tiers have daily limits

For production, we recommend using PocketBase SMTP with a professional email service like SendGrid, Mailgun, or Amazon SES.
