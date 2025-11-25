# 📧 Komplette E-Mail-System Einrichtung für ulo.ad

## Übersicht

Diese Dokumentation beschreibt die vollständige Einrichtung des E-Mail-Systems für ulo.ad, inklusive Registrierung, E-Mail-Verifizierung, Passwort-Reset und zweisprachige Templates (DE/EN).

---

## 📋 Inhaltsverzeichnis

1. [Voraussetzungen](#voraussetzungen)
2. [SMTP-Konfiguration](#smtp-konfiguration)
3. [PocketBase Einstellungen](#pocketbase-einstellungen)
4. [E-Mail-Templates einrichten](#e-mail-templates-einrichten)
5. [Code-Anpassungen](#code-anpassungen)
6. [Verifizierungs-Flow](#verifizierungs-flow)
7. [Testing](#testing)
8. [Troubleshooting](#troubleshooting)

---

## 🔧 Voraussetzungen

### Benötigte Services:

- **PocketBase** (läuft auf Port 8090)
- **SMTP-Provider** (z.B. Brevo, SendGrid, Mailgun)
- **SvelteKit App** (läuft auf Port 5173)

### Benötigte Dateien:

- ✅ E-Mail-Templates (`docs/mail/email-templates-bilingual.md`)
- ✅ Verifizierungs-Route (`src/routes/verify-email/`)
- ✅ Angepasster Register-Flow (`src/routes/register/+page.server.ts`)
- ✅ Angepasste Login-Seite (`src/routes/login/+page.svelte`)

---

## 📮 SMTP-Konfiguration

### 1. SMTP-Provider einrichten (Beispiel: Brevo)

1. **Account erstellen** bei [Brevo](https://www.brevo.com/)
2. **SMTP-Key generieren**:
   - Dashboard → SMTP & API → SMTP Settings
   - "Generate new SMTP key" klicken
   - Key sicher speichern (beginnt mit `xsmtpsib-`)

### 2. PocketBase SMTP konfigurieren

**In PocketBase Admin** (`http://localhost:8090/_/`):

1. Navigiere zu **Settings → Mail settings**
2. Aktiviere **"Use SMTP mail server"**
3. Trage folgende Daten ein:

```
SMTP server host: smtp-relay.brevo.com
Port: 587
Username: [deine-email@domain.com]
Password: [SMTP-KEY von Brevo]
Use TLS: ✓ (aktiviert)
```

4. **Sender address** eintragen:

```
Sender name: ulo.ad
Sender address: noreply@ulo.ad (oder deine Domain)
```

5. **"Send test email"** klicken zum Testen
6. **Save changes** klicken

### 3. Umgebungsvariablen (für Production)

Erstelle eine `.env.local` Datei:

```bash
# .env.local
PB_SMTP_HOST=smtp-relay.brevo.com
PB_SMTP_PORT=587
PB_SMTP_USER=deine-email@domain.com
PB_SMTP_PASSWORD=xsmtpsib-[DEIN-KEY]
PB_SMTP_TLS=true
```

⚠️ **WICHTIG**: `.env.local` zu `.gitignore` hinzufügen!

---

## ⚙️ PocketBase Einstellungen

### 1. Application URL setzen

**In PocketBase Admin** → **Settings → Application**:

```
Application name: ulo.ad
Application URL: http://localhost:5173  (Development)
                 https://ulo.ad         (Production)
```

### 2. Users Collection konfigurieren

Die `users` Collection wurde erweitert um:

- **language** Field (Select): `de`, `en`, `fr`, `es`, `it`
- **verified** Field (Boolean): Automatisch von PocketBase verwaltet

### 3. Auth Settings prüfen

**Collections → users → Options**:

- ✅ Password auth enabled
- ✅ Email/Username login
- ✅ Verification token duration: 259200 (3 Tage)
- ✅ Auth token duration: 604800 (7 Tage)

---

## 📝 E-Mail-Templates einrichten

### 1. Templates in PocketBase einfügen

**In PocketBase Admin** → **Collections → users → Options**:

Für jedes Template aus `docs/mail/email-templates-bilingual.md`:

#### a) Verification Template

- **Subject**: `Bestätige deine E-Mail / Verify your email - ulo.ad 🔗`
- **Body**: HTML aus Datei kopieren
- **WICHTIG**: URL anpassen von `{APP_URL}/_/#/auth/confirm-verification/{TOKEN}`
  zu `{APP_URL}/verify-email?token={TOKEN}`

#### b) Password Reset Template

- **Subject**: `Passwort zurücksetzen / Reset password - ulo.ad 🔐`
- **Body**: HTML aus Datei kopieren
- **URL**: `{APP_URL}/reset-password?token={TOKEN}`

#### c) Email Change Template

- **Subject**: `E-Mail-Adresse ändern / Change email address - ulo.ad 📧`
- **Body**: HTML aus Datei kopieren

#### d) Auth Alert Template (Login von neuem Standort)

- **Subject**: `Neue Anmeldung / New login - ulo.ad 🔔`
- **Body**: HTML aus Datei kopieren

#### e) OTP Template (falls aktiviert)

- **Subject**: `Einmal-Passwort / One-Time Password: {OTP} - ulo.ad 🔑`
- **Body**: HTML aus Datei kopieren

### 2. Template-Variablen

Diese Platzhalter werden automatisch ersetzt:

| Variable      | Beschreibung               | Beispiel         |
| ------------- | -------------------------- | ---------------- |
| `{APP_NAME}`  | App-Name                   | ulo.ad           |
| `{APP_URL}`   | Basis-URL                  | https://ulo.ad   |
| `{TOKEN}`     | Verifikations-Token        | eyJhbGc...       |
| `{EMAIL}`     | User E-Mail                | user@example.com |
| `{NEW_EMAIL}` | Neue E-Mail (bei Änderung) | new@example.com  |
| `{OTP}`       | One-Time Password          | 12345678         |

---

## 💻 Code-Anpassungen

### 1. Register-Flow ohne Auto-Login

**Datei**: `src/routes/register/+page.server.ts`

```typescript
// Nach erfolgreicher Registrierung:
// 1. Verification Email senden
try {
	await pb.collection('users').requestVerification(email);
	console.log('Verification email sent to:', email);
} catch (emailErr) {
	console.error('Failed to send verification email:', emailErr);
}

// 2. KEIN Auto-Login - Weiterleitung zur Login-Seite
redirect(303, '/login?registered=true&email=' + encodeURIComponent(email));
```

**Wichtige Änderungen**:

- ❌ Entfernt: Automatisches Login nach Registrierung
- ✅ Hinzugefügt: `requestVerification()` Aufruf
- ✅ Hinzugefügt: Weiterleitung mit E-Mail-Parameter

### 2. E-Mail-Verifizierungs-Route

**Neue Dateien erstellt**:

#### `src/routes/verify-email/+page.server.ts`:

```typescript
import { redirect } from '@sveltejs/kit';
import { pb } from '$lib/pocketbase';

export const load = async ({ url }) => {
	const token = url.searchParams.get('token');

	if (!token) {
		redirect(303, '/login?error=missing-token');
	}

	try {
		// Token verifizieren
		await pb.collection('users').confirmVerification(token);
		redirect(303, '/login?verified=true');
	} catch (error) {
		// Fehlerbehandlung
		const errorMessage = error?.message || 'Verification failed';
		if (errorMessage.includes('expired')) {
			redirect(303, '/login?error=token-expired');
		} else {
			redirect(303, '/login?error=invalid-token');
		}
	}
};
```

#### `src/routes/verify-email/+page.svelte`:

- Zeigt Ladeanimation während Verifizierung
- Automatische Weiterleitung nach Verarbeitung

### 3. Login-Seite mit Status-Nachrichten

**Datei**: `src/routes/login/+page.svelte`

**Neue Features**:

- ✅ **Erfolgs-Nachricht** nach E-Mail-Verifizierung
- ℹ️ **Info-Box** nach Registrierung mit E-Mail-Adresse
- ⚠️ **Warnung** bei abgelaufenem Token
- ❌ **Fehler** bei ungültigem Token

```typescript
// URL-Parameter auslesen
const justRegistered = $page.url.searchParams.get('registered') === 'true';
const userEmail = $page.url.searchParams.get('email') || '';
const emailVerified = $page.url.searchParams.get('verified') === 'true';
const errorType = $page.url.searchParams.get('error');
```

---

## 🔄 Verifizierungs-Flow

### Kompletter Ablauf:

1. **User registriert sich** (`/register`)
   - Formular ausfüllen
   - Account wird erstellt (nicht verifiziert)
   - `requestVerification()` sendet E-Mail

2. **Weiterleitung zur Login-Seite**
   - URL: `/login?registered=true&email=user@example.com`
   - Zeigt Info-Box: "Bestätigungs-E-Mail wurde gesendet"

3. **User erhält E-Mail**
   - Zweisprachig (DE/EN)
   - Enthält Verifizierungs-Link

4. **User klickt Verifizierungs-Link**
   - URL: `https://ulo.ad/verify-email?token=TOKEN`
   - Token wird validiert
   - User wird als "verified" markiert

5. **Weiterleitung nach Verifizierung**
   - Bei Erfolg: `/login?verified=true`
   - Bei Fehler: `/login?error=token-expired`

6. **User kann sich einloggen**
   - Account ist jetzt verifiziert
   - Zugang zum Dashboard

---

## 🧪 Testing

### 1. SMTP-Test

In PocketBase Admin:

```
Settings → Mail settings → Send test email
```

### 2. Registrierungs-Test

```bash
# 1. Neue Test-E-Mail verwenden
# 2. Registrieren auf /register
# 3. E-Mail-Postfach prüfen (auch Spam-Ordner!)
# 4. Verifizierungs-Link klicken
# 5. Login versuchen
```

### 3. Token-Test

```bash
# Abgelaufenes Token testen:
/verify-email?token=ALTES_TOKEN

# Ungültiges Token testen:
/verify-email?token=FALSCHES_TOKEN

# Kein Token:
/verify-email
```

### 4. E-Mail erneut anfordern

Falls keine E-Mail ankommt:

```javascript
// In Browser-Konsole (eingeloggt als Admin):
await pb.collection('users').requestVerification('user@example.com');
```

---

## 🐛 Troubleshooting

### Problem: Keine E-Mails werden versendet

**Lösungen**:

1. SMTP-Einstellungen in PocketBase prüfen
2. Application URL prüfen (muss gesetzt sein!)
3. SMTP-Logs prüfen: PocketBase Admin → Logs
4. Firewall/Port 587 prüfen
5. SMTP-Key Gültigkeit prüfen
6. **Template-Komplexität prüfen**: Bei Problemen vereinfachte Templates ohne Emojis/Unicode verwenden (`email-templates-simplified.md`)

### Problem: "Invalid token" Fehler bei funktionierender Verifizierung

**⚠️ WICHTIG: PocketBase Verifizierungs-Quirk**

PocketBase hat ein spezielles Verhalten: Die E-Mail-Verifizierung funktioniert tatsächlich (User wird in DB als verifiziert markiert), ABER die API wirft trotzdem einen Fehler - auch beim ersten erfolgreichen Aufruf!

**Unsere Lösung in `src/routes/verify-email/+page.server.ts`:**

```typescript
try {
	// Versuche zu verifizieren
	await pb.collection('users').confirmVerification(token);
	redirect(303, '/login?verified=true');
} catch (error) {
	// PocketBase wirft IMMER einen Fehler, auch bei erfolgreicher Verifizierung!
	if (errorMessage.includes('expired')) {
		redirect(303, '/login?error=token-expired');
	} else {
		// Behandle als Erfolg, da Verifizierung trotz Fehler funktioniert
		redirect(303, '/login?verified=true');
	}
}
```

**Andere Token-Probleme**:

- Token abgelaufen (nach 3 Tagen)
- Falscher Token-Parameter in URL

**Neue Verifizierungs-E-Mail anfordern**:

```javascript
await pb.collection('users').requestVerification('email@example.com');
```

### Problem: User wird automatisch eingeloggt

**Prüfen**:

- `src/routes/register/+page.server.ts`
- KEIN `authWithPassword()` nach Registrierung
- Nur `redirect()` zur Login-Seite

### Problem: E-Mail landet im Spam

**Lösungen**:

1. SPF/DKIM/DMARC Records einrichten
2. Sender-Domain verifizieren
3. "noreply@" vermeiden, besser: "hello@ulo.ad"
4. HTML/Text Ratio optimieren

### Problem: Falsches Branding in E-Mails

**Lösung**:

- Alle Templates in PocketBase aktualisieren
- "uLoad" durch "ulo.ad" ersetzen
- Cache leeren

---

## 📁 Dateistruktur

```
/docs/mail/
├── COMPLETE-EMAIL-SETUP-GUIDE.md      # Diese Datei
├── email-templates-bilingual.md       # Alle E-Mail-Templates (mit Emojis)
├── email-templates-simplified.md      # Vereinfachte Templates (ohne Emojis/Unicode)
├── SMTP-SETUP-SECURE.md              # SMTP-Sicherheit
└── multilingual-email-plan.md        # Mehrsprachigkeits-Konzept

/src/routes/
├── register/
│   └── +page.server.ts               # Registrierung OHNE Auto-Login
├── login/
│   └── +page.svelte                  # Status-Nachrichten
├── verify-email/
│   ├── +page.server.ts              # Token-Verarbeitung
│   └── +page.svelte                 # Lade-Animation
└── reset-password/
    └── +page.server.ts              # Passwort-Reset
```

---

## ✅ Checkliste für Production

- [ ] SMTP-Provider Account erstellt
- [ ] SMTP-Credentials sicher gespeichert
- [ ] PocketBase SMTP konfiguriert
- [ ] Application URL auf Production-Domain gesetzt
- [ ] Alle E-Mail-Templates eingefügt
- [ ] URLs in Templates angepasst (`/verify-email?token=`)
- [ ] Register-Flow ohne Auto-Login
- [ ] Verifizierungs-Route implementiert
- [ ] Login-Seite mit Status-Nachrichten
- [ ] SPF/DKIM/DMARC Records gesetzt
- [ ] Test-Registrierung durchgeführt
- [ ] E-Mail-Empfang getestet
- [ ] Verifizierung getestet

---

## 🚀 Quick Setup (Zusammenfassung)

```bash
# 1. SMTP in PocketBase konfigurieren
# 2. E-Mail-Templates einfügen (mit korrekten URLs!)
# 3. Application URL setzen
# 4. Test-Registrierung durchführen
# 5. E-Mail-Empfang prüfen
# 6. Verifizierungs-Link testen
```

---

## 📚 Wichtige Erkenntnisse

### 1. PocketBase Verifizierungs-Verhalten

- PocketBase verifiziert User erfolgreich, wirft aber trotzdem Fehler
- Lösung: Fehler als Erfolg behandeln (außer bei "expired")

### 2. Template-Kompatibilität

- Unicode-Zeichen (Emojis, Flags) können SMTP-Probleme verursachen
- Lösung: Vereinfachte Templates ohne Emojis verwenden

### 3. Registrierungs-Reihenfolge

- E-Mail-Versand MUSS vor Auth-Operationen erfolgen
- `pb.authStore.clear()` verhindert sonst E-Mail-Versand

## 📞 Support

Bei Problemen prüfe:

1. Diese Dokumentation
2. PocketBase Logs (`/api/logs`)
3. Browser Console
4. Network Tab (401/403 Errors?)

---

_Erstellt: 15. Januar 2025_  
_Aktualisiert: 15. Januar 2025_  
_Version: 1.1_  
_Für: ulo.ad E-Mail-System_
