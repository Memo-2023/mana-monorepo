# Plan: Mehrsprachige E-Mail-Templates für uLoad

## Executive Summary

Implementierung eines Systems für deutsche und englische E-Mail-Templates mit automatischer Spracherkennung basierend auf Nutzerpräferenzen.

---

## 🎯 Ziele

1. **Primär**: Deutsche und englische E-Mail-Templates
2. **Automatische Sprachauswahl** basierend auf Nutzerpräferenz
3. **Fallback**: Englisch als Standard
4. **Erweiterbar**: Einfach neue Sprachen hinzufügen

---

## 📊 Ansätze (von einfach zu komplex)

### Ansatz 1: PocketBase Collection-Erweiterung (⭐ Empfohlen)

**Konzept**: Nutzer-Sprachpräferenz in der users Collection speichern

#### Implementation:

1. **Users Collection erweitern**:

```javascript
// Neues Feld in users collection
{
  name: "language",
  type: "select",
  values: ["de", "en"],
  default: "de"
}
```

2. **Custom E-Mail-Service erstellen**:

```typescript
// src/lib/server/email-service.ts
import { pb } from '$lib/pocketbase';

export async function sendLocalizedEmail(
	userId: string,
	type: 'verification' | 'reset' | 'change',
	data: any
) {
	// Nutzer-Sprache abrufen
	const user = await pb.collection('users').getOne(userId);
	const lang = user.language || 'de';

	// Template basierend auf Sprache wählen
	const template = getTemplate(type, lang);

	// E-Mail senden
	await sendEmail({
		to: user.email,
		subject: template.subject,
		html: template.body(data)
	});
}
```

**Vorteile**:

- ✅ Einfache Implementation
- ✅ Nutzer kann Sprache in Settings ändern
- ✅ Funktioniert mit PocketBase

**Nachteile**:

- ❌ Erfordert Custom Email Handler
- ❌ PocketBase Standard-Mails umgehen

---

### Ansatz 2: Browser-Sprache + IP-Geolocation

**Konzept**: Automatische Spracherkennung ohne Nutzer-Input

#### Implementation:

```typescript
// src/routes/register/+page.server.ts
export const actions = {
	register: async ({ request, getClientAddress }) => {
		const clientIp = getClientAddress();
		const acceptLanguage = request.headers.get('accept-language');

		// Sprache ermitteln
		const language = detectLanguage(acceptLanguage, clientIp);

		// Bei User-Erstellung speichern
		await pb.collection('users').create({
			email,
			password,
			language // 'de' oder 'en'
		});
	}
};

function detectLanguage(acceptLanguage: string, ip: string): string {
	// 1. Browser-Sprache prüfen
	if (acceptLanguage?.startsWith('de')) return 'de';
	if (acceptLanguage?.startsWith('en')) return 'en';

	// 2. IP-Geolocation (optional)
	// const country = await getCountryFromIP(ip);
	// if (['DE', 'AT', 'CH'].includes(country)) return 'de';

	// 3. Fallback
	return 'en';
}
```

**Vorteile**:

- ✅ Automatisch ohne Nutzer-Aktion
- ✅ Nutzerfreundlich

**Nachteile**:

- ❌ Nicht immer akkurat
- ❌ Zusätzliche Geolocation-API nötig

---

### Ansatz 3: Custom PocketBase Extension (Advanced)

**Konzept**: PocketBase mit Go erweitern für native Unterstützung

#### Struktur:

```go
// pb_hooks/email_localization.go
package main

import (
    "github.com/pocketbase/pocketbase"
    "github.com/pocketbase/pocketbase/core"
)

func main() {
    app := pocketbase.New()

    app.OnRecordBeforeCreateRequest("users").Add(func(e *core.RecordCreateEvent) error {
        // Sprache aus Request Headers
        lang := e.HttpContext.Request().Header.Get("Accept-Language")
        e.Record.Set("language", parseLanguage(lang))
        return nil
    })

    app.OnMailerBeforeRecordVerificationSend().Add(func(e *core.MailerRecordEvent) error {
        user := e.Record
        lang := user.GetString("language")

        // Template basierend auf Sprache
        if lang == "de" {
            e.Message.Subject = "Bestätige deine E-Mail"
            e.Message.HTML = germanTemplate(e.Record, e.Token)
        } else {
            e.Message.Subject = "Verify your email"
            e.Message.HTML = englishTemplate(e.Record, e.Token)
        }

        return nil
    })

    app.Start()
}
```

**Vorteile**:

- ✅ Native PocketBase Integration
- ✅ Alle Standard-Features bleiben
- ✅ Beste Performance

**Nachteile**:

- ❌ Komplexe Implementation
- ❌ Go-Kenntnisse erforderlich
- ❌ Custom PocketBase Build

---

## 🚀 Empfohlene Lösung: Hybrid-Ansatz

### Phase 1: Quick Win (1-2 Tage)

1. **User Collection erweitern**:

```sql
ALTER TABLE users ADD COLUMN language TEXT DEFAULT 'de';
```

2. **Settings-Page Update**:

```svelte
<!-- src/routes/(app)/settings/+page.svelte -->
<select name="language" bind:value={user.language}>
	<option value="de">🇩🇪 Deutsch</option>
	<option value="en">🇬🇧 English</option>
</select>
```

3. **Template-Struktur**:

```
docs/mail/templates/
├── de/
│   ├── verification.html
│   ├── reset.html
│   └── change.html
└── en/
    ├── verification.html
    ├── reset.html
    └── change.html
```

### Phase 2: Custom Email Handler (3-5 Tage)

```typescript
// src/lib/server/email/index.ts
import { readFileSync } from 'fs';
import { compile } from 'handlebars';

export class EmailService {
	private templates: Map<string, Function> = new Map();

	constructor() {
		this.loadTemplates();
	}

	private loadTemplates() {
		const languages = ['de', 'en'];
		const types = ['verification', 'reset', 'change'];

		for (const lang of languages) {
			for (const type of types) {
				const path = `./templates/${lang}/${type}.html`;
				const template = readFileSync(path, 'utf-8');
				const compiled = compile(template);
				this.templates.set(`${lang}-${type}`, compiled);
			}
		}
	}

	async send(userId: string, type: string, data: any) {
		const user = await pb.collection('users').getOne(userId);
		const lang = user.language || 'de';

		const template = this.templates.get(`${lang}-${type}`);
		if (!template) throw new Error('Template not found');

		const html = template({
			...data,
			user,
			appUrl: PUBLIC_APP_URL,
			currentYear: new Date().getFullYear()
		});

		await this.sendViaBrevo({
			to: user.email,
			subject: this.getSubject(lang, type),
			html
		});
	}

	private getSubject(lang: string, type: string): string {
		const subjects = {
			'de-verification': 'Bestätige deine E-Mail für uLoad 🔗',
			'en-verification': 'Verify your email for uLoad 🔗',
			'de-reset': 'Passwort zurücksetzen für uLoad 🔐',
			'en-reset': 'Reset your password for uLoad 🔐'
			// ...
		};
		return subjects[`${lang}-${type}`];
	}
}
```

### Phase 3: API Routes (1 Tag)

```typescript
// src/routes/api/auth/verify/+server.ts
import { EmailService } from '$lib/server/email';

export async function POST({ request }) {
	const { userId, token } = await request.json();

	const emailService = new EmailService();
	await emailService.send(userId, 'verification', { token });

	return json({ success: true });
}
```

---

## 🌍 Sprach-Detection Strategien

### 1. Bei Registrierung:

```typescript
// Prioritäten:
1. URL-Parameter: ?lang=de
2. Browser Accept-Language Header
3. IP-Geolocation
4. Default: de (für DACH-Region)
```

### 2. Implementation:

```typescript
export function detectUserLanguage(request: Request): 'de' | 'en' {
	// 1. Check URL param
	const url = new URL(request.url);
	const urlLang = url.searchParams.get('lang');
	if (urlLang === 'de' || urlLang === 'en') return urlLang;

	// 2. Check browser language
	const acceptLang = request.headers.get('accept-language') || '';
	const browserLang = acceptLang.split(',')[0].split('-')[0].toLowerCase();

	if (browserLang === 'de') return 'de';
	if (browserLang === 'en') return 'en';

	// 3. Check cookie (if user changed language before)
	const cookies = parseCookies(request.headers.get('cookie'));
	if (cookies.lang === 'de' || cookies.lang === 'en') return cookies.lang;

	// 4. Default
	return 'de'; // DACH-focused app
}
```

---

## 📁 Datei-Struktur

```
src/
├── lib/
│   ├── server/
│   │   ├── email/
│   │   │   ├── index.ts           # EmailService class
│   │   │   ├── templates.ts       # Template loader
│   │   │   └── brevo.ts          # Brevo API wrapper
│   │   └── i18n/
│   │       ├── detector.ts        # Language detection
│   │       └── translations.ts    # Email translations
│   └── stores/
│       └── language.ts            # Client-side language store
├── routes/
│   ├── api/
│   │   ├── user/language/+server.ts  # Update language preference
│   │   └── email/send/+server.ts     # Custom email sender
│   └── (app)/
│       └── settings/
│           └── +page.svelte       # Language selector
└── hooks.server.ts               # Language detection on request
```

---

## 🔄 Migration Plan

### Woche 1:

- [ ] Users Collection um `language` Feld erweitern
- [ ] Settings-Page mit Sprachauswahl
- [ ] Deutsche & englische Templates erstellen

### Woche 2:

- [ ] EmailService Klasse implementieren
- [ ] API Routes für Custom Emails
- [ ] Auto-Detection bei Registrierung

### Woche 3:

- [ ] Testing mit verschiedenen Sprachen
- [ ] Fallback-Mechanismen
- [ ] Documentation

---

## 💡 Quick Start (Minimal Version)

Für einen schnellen Start ohne große Änderungen:

### 1. Zwei PocketBase Instanzen:

```bash
# Deutsche Version
PB_LANG=de ./pocketbase serve --http=127.0.0.1:8090

# Englische Version
PB_LANG=en ./pocketbase serve --http=127.0.0.1:8091
```

### 2. Nginx Proxy:

```nginx
server {
  listen 80;
  server_name api.ulo.ad;

  # Route basierend auf Accept-Language
  if ($http_accept_language ~* "^de") {
    proxy_pass http://127.0.0.1:8090;
  }

  proxy_pass http://127.0.0.1:8091; # Default EN
}
```

**Vorteil**: Keine Code-Änderungen nötig
**Nachteil**: Doppelte Wartung

---

## 🎨 Template Management

### Option 1: Handlebars Templates

```handlebars
<!-- templates/de/verification.hbs -->
<h1>Willkommen {{user.name}}!</h1>
<p>Bitte bestätige deine E-Mail:</p>
<a href='{{appUrl}}/verify?token={{token}}'>Bestätigen</a>
```

### Option 2: React Email (Modern)

```tsx
// emails/Verification.tsx
export function VerificationEmail({ user, token, lang }) {
	const t = translations[lang];

	return (
		<Html>
			<Head />
			<Body>
				<Container>
					<Heading>
						{t.welcome} {user.name}!
					</Heading>
					<Text>{t.pleaseVerify}</Text>
					<Button href={`${APP_URL}/verify?token=${token}`}>{t.verifyButton}</Button>
				</Container>
			</Body>
		</Html>
	);
}
```

### Option 3: JSON-basierte Templates

```json
{
	"de": {
		"verification": {
			"subject": "Bestätige deine E-Mail",
			"heading": "Willkommen {name}!",
			"body": "Bitte bestätige deine E-Mail-Adresse.",
			"button": "E-Mail bestätigen"
		}
	},
	"en": {
		"verification": {
			"subject": "Verify your email",
			"heading": "Welcome {name}!",
			"body": "Please verify your email address.",
			"button": "Verify Email"
		}
	}
}
```

---

## 🚦 Entscheidungsmatrix

| Kriterium      | Ansatz 1   | Ansatz 2 | Ansatz 3   |
| -------------- | ---------- | -------- | ---------- |
| Aufwand        | ⭐⭐       | ⭐⭐⭐   | ⭐⭐⭐⭐⭐ |
| Flexibilität   | ⭐⭐⭐⭐   | ⭐⭐⭐   | ⭐⭐⭐⭐⭐ |
| Wartbarkeit    | ⭐⭐⭐⭐   | ⭐⭐⭐   | ⭐⭐       |
| Performance    | ⭐⭐⭐     | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| Zukunftssicher | ⭐⭐⭐⭐⭐ | ⭐⭐⭐   | ⭐⭐⭐     |

**Empfehlung**: Starte mit Ansatz 1, plane für Ansatz 3

---

## ✅ Nächste Schritte

1. **Sofort (Tag 1)**:
   - [ ] Language Feld zu users Collection hinzufügen
   - [ ] Settings-Page um Sprachauswahl erweitern
2. **Kurzfristig (Woche 1)**:
   - [ ] Templates in DE/EN erstellen
   - [ ] Template-Loader implementieren
3. **Mittelfristig (Woche 2-3)**:
   - [ ] EmailService mit Sprach-Support
   - [ ] Auto-Detection bei Registration
4. **Langfristig (Monat 2)**:
   - [ ] Weitere Sprachen (FR, ES, IT)
   - [ ] A/B Testing für Templates
   - [ ] Analytics pro Sprache

---

## 📚 Ressourcen

- [PocketBase Hooks Documentation](https://pocketbase.io/docs/hooks)
- [Accept-Language Parser](https://www.npmjs.com/package/accept-language-parser)
- [React Email i18n](https://react.email/docs/integrations/i18n)
- [Handlebars i18n Helper](https://github.com/handlebars-lang/handlebars.js/issues/1646)

---

_Erstellt: 15. Januar 2025_  
_Status: Bereit zur Diskussion_  
_Priorität: Mittel_  
_Geschätzter Aufwand: 5-10 Tage für vollständige Implementation_
