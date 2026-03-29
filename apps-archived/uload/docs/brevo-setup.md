# Brevo E-Mail Setup für uLoad

## 1. SMTP Key erstellen

1. Login bei [Brevo](https://app.brevo.com)
2. Gehe zu: **SMTP & API** → **SMTP Settings**
3. Klicke auf **Generate a new SMTP key**
4. Gib dem Key einen Namen (z.B. "uload-app")
5. **WICHTIG**: Kopiere den Key sofort! Er wird nur einmal angezeigt

## 2. PocketBase Konfiguration

### Option A: Über PocketBase Admin UI

1. Öffne PocketBase Admin: `http://localhost:8090/_/`
2. Gehe zu: **Settings** → **Mail settings**
3. Aktiviere: **Use SMTP mail server**
4. Fülle die Felder aus:

```
SMTP server host: smtp-relay.brevo.com
Port: 587
Username: [Deine Brevo E-Mail]
Password: [Dein SMTP Key von Schritt 1]
TLS encryption: ✓ (aktiviert)
AUTH method: PLAIN
```

5. Sender Einstellungen:

```
Sender name: uLoad
Sender address: noreply@[deine-domain].com
```

### Option B: Über Environment Variables

Erstelle eine `.env` Datei im PocketBase Ordner:

```bash
# .env
PB_SMTP_ENABLED=true
PB_SMTP_HOST=smtp-relay.brevo.com
PB_SMTP_PORT=587
PB_SMTP_USER=deine-email@example.com
PB_SMTP_PASSWORD=xsmtpsib-dein-smtp-key-hier
PB_SMTP_TLS=true
PB_SMTP_AUTH_METHOD=PLAIN
PB_SENDER_NAME=uLoad
PB_SENDER_ADDRESS=noreply@yourdomain.com
```

## 3. Domain Verifizierung (Wichtig!)

Für bessere Deliverability solltest du deine Domain verifizieren:

1. In Brevo: **Senders & IPs** → **Domains**
2. Klicke **Add a domain**
3. Gib deine Domain ein
4. Füge diese DNS Records hinzu:

### SPF Record

```
Type: TXT
Name: @
Value: v=spf1 include:spf.brevo.com ~all
```

### DKIM Records

Brevo zeigt dir 3 DKIM Records an. Füge alle bei deinem DNS Provider hinzu:

```
Type: TXT
Name: brevo._domainkey
Value: [von Brevo bereitgestellt]

Type: TXT
Name: brevo2._domainkey
Value: [von Brevo bereitgestellt]

Type: TXT
Name: brevo3._domainkey
Value: [von Brevo bereitgestellt]
```

### DMARC Record (Optional aber empfohlen)

```
Type: TXT
Name: _dmarc
Value: v=DMARC1; p=none; rua=mailto:dmarc@yourdomain.com
```

## 4. Test der E-Mail-Funktionalität

### Test 1: PocketBase Test-Mail

1. In PocketBase Admin → Settings → Mail settings
2. Scrolle nach unten zu **Send test email**
3. Gib deine E-Mail ein
4. Klicke **Send test email**

### Test 2: Password Reset Test

```bash
# Teste Password Reset
curl -X POST http://localhost:8090/api/collections/users/request-password-reset \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com"}'
```

### Test 3: In der App

1. Gehe zu `/forgot-password`
2. Gib eine registrierte E-Mail ein
3. Check deine E-Mail

## 5. E-Mail Templates anpassen

Die E-Mail Templates findest du in PocketBase Admin:

1. **Settings** → **Mail settings**
2. Scrolle zu den verschiedenen Templates:
   - Verification template
   - Password reset template
   - Email change template

### Beispiel: Custom Password Reset Template

```html
<p>Hallo,</p>
<p>Du hast ein neues Passwort für deinen uLoad Account angefordert.</p>
<p>
	<a class="btn" href="{APP_URL}/reset-password?token={TOKEN}" target="_blank" rel="noopener">
		Passwort zurücksetzen
	</a>
</p>
<p>Dieser Link ist 1 Stunde gültig.</p>
<p><i>Falls du das nicht warst, ignoriere diese E-Mail.</i></p>
<p>
	Viele Grüße,<br />
	Dein uLoad Team
</p>
```

**WICHTIG**: Ändere die URL zu deiner Custom Reset Page:

- Original: `{APP_URL}/_/#/auth/confirm-password-reset/{TOKEN}`
- Custom: `{APP_URL}/reset-password?token={TOKEN}`

## 6. Monitoring & Limits

### Brevo Free Plan Limits:

- **300 E-Mails pro Tag**
- Unbegrenzte Kontakte
- E-Mail Statistics verfügbar

### Dashboard checken:

1. Login bei Brevo
2. **Dashboard** → **Email Activity**
3. Hier siehst du:
   - Gesendete E-Mails
   - Öffnungsrate
   - Bounce Rate
   - Spam Reports

## 7. Troubleshooting

### Problem: E-Mails kommen nicht an

1. **Check SMTP Key**: Ist er korrekt kopiert?
2. **Check Sender Address**: Nutzt du eine verifizierte Domain?
3. **Check Spam Folder**: Landen E-Mails im Spam?
4. **Check Brevo Dashboard**: Zeigt es gesendete E-Mails?

### Problem: "Invalid credentials"

- Nutze deine **Brevo Account E-Mail** als Username
- Nutze den **SMTP Key** (nicht dein Passwort!) als Password
- Der Key startet mit `xsmtpsib-`

### Problem: E-Mails landen im Spam

1. Verifiziere deine Domain (SPF, DKIM)
2. Setze eine richtige Sender-Adresse
3. Vermeide Spam-Trigger-Wörter
4. Füge Unsubscribe-Link hinzu (für Marketing-Mails)

## 8. Production Checklist

- [ ] SMTP Key sicher in Environment Variables speichern
- [ ] Domain verifiziert (SPF, DKIM, DMARC)
- [ ] Custom E-Mail Templates erstellt
- [ ] Rate Limiting implementiert
- [ ] Monitoring eingerichtet
- [ ] Backup SMTP Service konfiguriert (falls Brevo down)

## 9. Code für direkten Brevo API Zugriff (Optional)

Falls du später die API direkt nutzen willst:

```typescript
// src/lib/email/brevo.ts
import * as brevo from '@getbrevo/brevo';

const apiInstance = new brevo.TransactionalEmailsApi();
apiInstance.setApiKey(brevo.TransactionalEmailsApiApiKeys.apiKey, 'YOUR_API_KEY');

export async function sendEmail(to: string, subject: string, htmlContent: string) {
	const sendSmtpEmail = new brevo.SendSmtpEmail();

	sendSmtpEmail.subject = subject;
	sendSmtpEmail.htmlContent = htmlContent;
	sendSmtpEmail.sender = { name: 'uLoad', email: 'noreply@yourdomain.com' };
	sendSmtpEmail.to = [{ email: to }];

	try {
		const data = await apiInstance.sendTransacEmail(sendSmtpEmail);
		console.log('Email sent successfully:', data.messageId);
		return data;
	} catch (error) {
		console.error('Error sending email:', error);
		throw error;
	}
}
```

---

_Erstellt: 15. Januar 2025_
_Für: uLoad Projekt_
_Service: Brevo (ehem. Sendinblue)_
