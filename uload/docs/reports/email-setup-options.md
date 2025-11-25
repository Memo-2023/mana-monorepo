# E-Mail Setup Optionen für uLoad

## Übersicht

Dieser Bericht analysiert verschiedene Möglichkeiten zur E-Mail-Integration in der uLoad-Anwendung, von kostenlosen bis zu selbst-gehosteten Lösungen.

---

## 1. Aktuelle Situation

### PocketBase E-Mail System

- **Status**: Integriert, aber nicht konfiguriert
- **Verwendung**: Password Reset, E-Mail-Verifikation, Benachrichtigungen
- **Konfiguration**: Über PocketBase Admin Panel → Settings → Mail settings

### Benötigte E-Mail-Typen

1. **Transaktionale E-Mails** (kritisch)
   - Password Reset
   - E-Mail-Verifikation
   - Account-Benachrichtigungen

2. **Marketing E-Mails** (optional)
   - Newsletter
   - Feature-Ankündigungen
   - Nutzer-Engagement

---

## 2. E-Mail Service Provider Optionen

### A. Kostenlose/Günstige Services

#### **Resend** ⭐ Empfohlen für Start

- **Kosten**: 100 E-Mails/Tag kostenlos, dann $20/Monat für 5.000
- **Vorteile**:
  - Moderne API
  - Excellent für Entwickler
  - React Email Templates
  - Gute Deliverability
- **Integration**:

```javascript
// Beispiel: Resend mit SvelteKit
import { Resend } from 'resend';
const resend = new Resend('re_YOUR_API_KEY');

await resend.emails.send({
	from: 'noreply@yourdomain.com',
	to: user.email,
	subject: 'Password Reset',
	html: '<p>Click here to reset...</p>'
});
```

#### **Brevo (ehem. Sendinblue)**

- **Kosten**: 300 E-Mails/Tag kostenlos
- **Vorteile**:
  - SMTP + API
  - Marketing-Tools inklusive
  - EU-Server (DSGVO)
- **SMTP-Einstellungen**:

```
Host: smtp-relay.brevo.com
Port: 587
Username: Ihre E-Mail
Password: API-Key
```

#### **SendGrid**

- **Kosten**: 100 E-Mails/Tag kostenlos
- **Vorteile**:
  - Zuverlässig
  - Gute Analytics
  - Twilio-Integration
- **Nachteile**: Setup etwas komplexer

#### **Mailgun**

- **Kosten**: 5.000 E-Mails/Monat für 3 Monate kostenlos
- **Vorteile**:
  - Entwicklerfreundlich
  - Gute API
  - E-Mail-Validierung

### B. Premium Services

#### **Amazon SES**

- **Kosten**: $0.10 pro 1.000 E-Mails
- **Vorteile**:
  - Extrem günstig bei Volumen
  - AWS-Integration
  - Hohe Deliverability
- **Nachteile**: Komplexeres Setup

#### **Postmark**

- **Kosten**: Ab $15/Monat für 10.000 E-Mails
- **Vorteile**:
  - Beste Deliverability
  - Trennung Transaktional/Marketing
  - Exzellenter Support

---

## 3. Selbst-Hosting Optionen

### A. Eigener SMTP Server

#### **Postal** ⭐ Empfohlen für Self-Hosting

- **Type**: Open Source Mail Server
- **Features**:
  - Web-UI
  - API
  - Multi-Domain
  - Tracking
- **Installation**:

```bash
# Docker Installation
git clone https://github.com/postalserver/postal
cd postal
docker-compose up -d
```

#### **Mail-in-a-Box**

- **Type**: Komplette E-Mail-Lösung
- **Features**:
  - SMTP, IMAP, Webmail
  - Automatisches SSL
  - DNS-Management
- **Voraussetzungen**:
  - Dedizierter Server
  - Saubere IP (nicht blacklisted)

#### **Mailcow**

- **Type**: Docker-basierte Lösung
- **Features**:
  - Modern UI
  - Anti-Spam
  - Webmail (SOGo)
- **Installation**:

```bash
git clone https://github.com/mailcow/mailcow-dockerized
cd mailcow-dockerized
./generate_config.sh
docker-compose up -d
```

### B. Lightweight SMTP Relay

#### **msmtp**

- Minimaler SMTP Client
- Gut für kleine Projekte
- Konfiguration:

```conf
# ~/.msmtprc
account default
host smtp.gmail.com
port 587
auth on
user your-email@gmail.com
password your-app-password
from your-email@gmail.com
tls on
```

---

## 4. Implementierung: E-Mails selbst versenden

### Option 1: Nodemailer Integration

```typescript
// src/lib/email/mailer.ts
import nodemailer from 'nodemailer';
import { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } from '$env/static/private';

const transporter = nodemailer.createTransport({
	host: SMTP_HOST,
	port: SMTP_PORT,
	secure: false,
	auth: {
		user: SMTP_USER,
		pass: SMTP_PASS
	}
});

export async function sendPasswordResetEmail(email: string, token: string) {
	const resetUrl = `https://yourdomain.com/reset-password?token=${token}`;

	const mailOptions = {
		from: '"uLoad" <noreply@yourdomain.com>',
		to: email,
		subject: 'Password Reset Request',
		html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Password Reset</h2>
        <p>You requested a password reset. Click the link below to set a new password:</p>
        <a href="${resetUrl}" style="display: inline-block; padding: 10px 20px; background-color: #0ea5e9; color: white; text-decoration: none; border-radius: 5px;">
          Reset Password
        </a>
        <p>If you didn't request this, please ignore this email.</p>
        <p>This link will expire in 1 hour.</p>
      </div>
    `
	};

	await transporter.sendMail(mailOptions);
}
```

### Option 2: API Route für E-Mail-Versand

```typescript
// src/routes/api/email/send/+server.ts
import { json } from '@sveltejs/kit';
import { sendEmail } from '$lib/email/mailer';

export async function POST({ request }) {
	const { to, subject, template, data } = await request.json();

	try {
		await sendEmail({
			to,
			subject,
			template,
			data
		});

		return json({ success: true });
	} catch (error) {
		return json({ error: 'Failed to send email' }, { status: 500 });
	}
}
```

### Option 3: Queue-basierter Versand

```typescript
// src/lib/email/queue.ts
import Bull from 'bull';
import { sendEmail } from './mailer';

const emailQueue = new Bull('email', {
	redis: {
		host: 'localhost',
		port: 6379
	}
});

emailQueue.process(async (job) => {
	const { to, subject, template, data } = job.data;
	await sendEmail({ to, subject, template, data });
});

export async function queueEmail(emailData: EmailData) {
	await emailQueue.add(emailData, {
		attempts: 3,
		backoff: {
			type: 'exponential',
			delay: 2000
		}
	});
}
```

---

## 5. E-Mail Templates

### React Email (Moderne Lösung)

```tsx
// emails/PasswordReset.tsx
import {
	Body,
	Button,
	Container,
	Head,
	Html,
	Preview,
	Section,
	Text
} from '@react-email/components';

export default function PasswordResetEmail({ resetUrl }: { resetUrl: string }) {
	return (
		<Html>
			<Head />
			<Preview>Reset your password</Preview>
			<Body style={main}>
				<Container style={container}>
					<Section>
						<Text style={heading}>Password Reset</Text>
						<Text style={paragraph}>Click the button below to reset your password:</Text>
						<Button style={button} href={resetUrl}>
							Reset Password
						</Button>
					</Section>
				</Container>
			</Body>
		</Html>
	);
}

const main = { backgroundColor: '#f6f9fc' };
const container = { margin: '0 auto', padding: '20px' };
const heading = { fontSize: '24px', fontWeight: 'bold' };
const paragraph = { fontSize: '16px', lineHeight: '26px' };
const button = { backgroundColor: '#0ea5e9', color: '#fff', padding: '12px 20px' };
```

---

## 6. Empfehlungen nach Projektphase

### 🚀 **MVP/Entwicklung**

1. **Gmail SMTP** mit App-Password
2. Einfach und kostenlos
3. Limitiert auf 500 E-Mails/Tag

### 📈 **Launch/Wachstum**

1. **Resend** oder **Brevo**
2. Kostenlose Stufe ausreichend
3. Einfache Integration

### 🏢 **Produktion/Scale**

1. **Amazon SES** für Kosten-Effizienz
2. **Postmark** für beste Deliverability
3. **Eigener Mail-Server** für volle Kontrolle

---

## 7. Implementierungs-Checkliste

### Sofort (für MVP):

- [ ] Gmail App-Password erstellen
- [ ] PocketBase SMTP konfigurieren
- [ ] Password Reset testen
- [ ] E-Mail-Verifikation aktivieren

### Kurzfristig (vor Launch):

- [ ] E-Mail Service Provider wählen
- [ ] Domain-Verifikation (SPF, DKIM, DMARC)
- [ ] E-Mail Templates erstellen
- [ ] Transaktionale E-Mails implementieren

### Langfristig (Skalierung):

- [ ] E-Mail-Queue implementieren
- [ ] Analytics/Tracking einrichten
- [ ] A/B Testing für Templates
- [ ] Bounce-Handling

---

## 8. Sicherheits-Überlegungen

### Best Practices:

1. **Rate Limiting**: Max 3 Password Resets pro Stunde
2. **Token Expiry**: 1 Stunde für Reset-Links
3. **Keine E-Mail-Enumeration**: Immer gleiche Response
4. **SPF/DKIM/DMARC**: DNS-Records konfigurieren
5. **Unsubscribe**: One-Click Unsubscribe für Marketing

### Beispiel Rate Limiting:

```typescript
// src/lib/rateLimit.ts
const attempts = new Map();

export function checkRateLimit(email: string): boolean {
	const key = `reset:${email}`;
	const now = Date.now();
	const hourAgo = now - 3600000;

	const userAttempts = attempts.get(key) || [];
	const recentAttempts = userAttempts.filter((time) => time > hourAgo);

	if (recentAttempts.length >= 3) {
		return false;
	}

	attempts.set(key, [...recentAttempts, now]);
	return true;
}
```

---

## 9. Kosten-Nutzen-Analyse

| Lösung      | Kosten/Monat | E-Mails   | Setup      | Deliverability | Empfohlen für |
| ----------- | ------------ | --------- | ---------- | -------------- | ------------- |
| Gmail SMTP  | €0           | 500/Tag   | ⭐⭐⭐⭐⭐ | ⭐⭐⭐         | MVP           |
| Resend      | €0-20        | 100-5k    | ⭐⭐⭐⭐   | ⭐⭐⭐⭐       | Startups      |
| Brevo       | €0-25        | 300-40k   | ⭐⭐⭐     | ⭐⭐⭐⭐       | SMBs          |
| Amazon SES  | €1-10        | 10k-100k  | ⭐⭐       | ⭐⭐⭐⭐⭐     | Scale         |
| Self-hosted | €5-20        | Unlimited | ⭐         | ⭐⭐⭐         | Control       |

---

## 10. Fazit & Nächste Schritte

### Sofort-Maßnahme für uLoad:

1. **Gmail SMTP** für Development einrichten
2. **Resend** Account erstellen (kostenlos)
3. PocketBase mit Resend SMTP konfigurieren

### Code-Snippet für .env:

```env
# E-Mail Configuration
SMTP_HOST=smtp.resend.com
SMTP_PORT=587
SMTP_USER=resend
SMTP_PASS=re_YOUR_API_KEY
SMTP_FROM=noreply@yourdomain.com
```

### PocketBase Konfiguration:

```javascript
// In PocketBase Admin Panel eintragen
{
  "enabled": true,
  "host": "smtp.resend.com",
  "port": 587,
  "username": "resend",
  "password": "re_YOUR_API_KEY",
  "tls": true,
  "authMethod": "PLAIN",
  "localName": "yourdomain.com"
}
```

---

_Erstellt am: 15. Januar 2025_
_Autor: Claude für uLoad Projekt_
_Status: Zur Implementierung bereit_
