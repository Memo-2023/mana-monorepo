# E-Mail Templates für uLoad

## Anleitung zum Einrichten

### Wo die Templates ändern:

1. Öffne PocketBase Admin: `http://localhost:8090/_/`
2. Gehe zu **Collections** → **users** (oder deine Auth-Collection)
3. Klicke auf **Options** (Zahnrad-Icon)
4. Scrolle zu den E-Mail-Templates Sektionen
5. Ersetze die Standard-Templates mit den unten stehenden Vorlagen
6. **Speichern** nicht vergessen!

---

## 1. E-Mail-Verifizierung Template

**Bereich:** Verification template

### Subject:

```
Bestätige deine E-Mail-Adresse für uLoad 🔗
```

### Body (HTML):

```html
<div
	style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8fafc;"
>
	<!-- Logo/Header -->
	<div style="text-align: center; margin-bottom: 30px; padding: 20px;">
		<h1 style="color: #0ea5e9; font-size: 36px; margin: 0; font-weight: 700;">🔗 uLoad</h1>
		<p style="color: #64748b; margin-top: 8px; font-size: 14px;">
			Deine Links. Dein Style. Deine Kontrolle.
		</p>
	</div>

	<!-- Main Content Card -->
	<div
		style="background: #ffffff; border-radius: 16px; padding: 32px; box-shadow: 0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06);"
	>
		<h2
			style="color: #0f172a; font-size: 24px; margin-top: 0; margin-bottom: 16px; font-weight: 600;"
		>
			Willkommen bei uLoad! 👋
		</h2>

		<p style="color: #475569; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
			Vielen Dank für deine Registrierung! Du bist nur einen Klick davon entfernt, deine persönliche
			Link-Sammlung zu erstellen und zu verwalten.
		</p>

		<p style="color: #475569; font-size: 16px; line-height: 1.6; margin-bottom: 24px;">
			Bitte bestätige deine E-Mail-Adresse, um alle Features freizuschalten:
		</p>

		<!-- CTA Button -->
		<div style="text-align: center; margin: 32px 0;">
			<a
				href="{APP_URL}/_/#/auth/confirm-verification/{TOKEN}"
				style="display: inline-block; background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%); 
                color: white; padding: 16px 40px; border-radius: 10px; 
                text-decoration: none; font-weight: 600; font-size: 16px;
                box-shadow: 0 4px 14px rgba(14, 165, 233, 0.25);
                transition: all 0.3s ease;"
			>
				✨ E-Mail-Adresse bestätigen
			</a>
		</div>

		<!-- Features Box -->
		<div
			style="background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%); border-radius: 12px; padding: 20px; margin: 24px 0; border: 1px solid #bae6fd;"
		>
			<p style="color: #0369a1; font-size: 14px; margin: 0 0 12px 0; font-weight: 600;">
				🚀 Was dich bei uLoad erwartet:
			</p>
			<ul style="color: #0c4a6e; font-size: 14px; margin: 0; padding-left: 20px; line-height: 1.8;">
				<li>Kurze, merkbare Links mit eigenem Branding</li>
				<li>Detaillierte Klick-Analysen in Echtzeit</li>
				<li>QR-Codes mit anpassbarem Design</li>
				<li>Ordner zur Organisation deiner Links</li>
				<li>Passwortschutz für sensible Links</li>
				<li>Ablaufdatum für zeitlich begrenzte Kampagnen</li>
			</ul>
		</div>

		<!-- Alternative Link -->
		<div style="margin-top: 24px; padding-top: 24px; border-top: 1px solid #e2e8f0;">
			<p style="color: #94a3b8; font-size: 13px; line-height: 1.6; margin: 0;">
				Falls der Button nicht funktioniert, kopiere diesen Link in deinen Browser:
			</p>
			<div
				style="background: #f8fafc; border-radius: 8px; padding: 12px; margin-top: 8px; word-break: break-all;"
			>
				<a
					href="{APP_URL}/_/#/auth/confirm-verification/{TOKEN}"
					style="color: #0ea5e9; font-size: 12px; text-decoration: none;"
				>
					{APP_URL}/_/#/auth/confirm-verification/{TOKEN}
				</a>
			</div>
		</div>
	</div>

	<!-- Footer -->
	<div style="text-align: center; margin-top: 32px; padding: 20px;">
		<p style="color: #94a3b8; font-size: 12px; margin: 8px 0;">
			Diese E-Mail wurde an <strong>{EMAIL}</strong> gesendet.
		</p>
		<p style="color: #94a3b8; font-size: 12px; margin: 8px 0;">
			Falls du dich nicht bei uLoad registriert hast, kannst du diese E-Mail sicher ignorieren.
		</p>

		<div style="margin-top: 24px; padding-top: 24px; border-top: 1px solid #e2e8f0;">
			<p style="color: #cbd5e1; font-size: 11px; margin: 0;">
				© 2025 uLoad · Built with ❤️ ·
				<a href="https://ulo.ad" style="color: #0ea5e9; text-decoration: none;">ulo.ad</a>
			</p>
		</div>
	</div>
</div>
```

---

## 2. Passwort-Reset Template

**Bereich:** Password reset template

### Subject:

```
Passwort zurücksetzen für uLoad 🔐
```

### Body (HTML):

```html
<div
	style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8fafc;"
>
	<!-- Logo/Header -->
	<div style="text-align: center; margin-bottom: 30px; padding: 20px;">
		<h1 style="color: #0ea5e9; font-size: 36px; margin: 0; font-weight: 700;">🔗 uLoad</h1>
	</div>

	<!-- Main Content Card -->
	<div
		style="background: #ffffff; border-radius: 16px; padding: 32px; box-shadow: 0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06);"
	>
		<h2
			style="color: #0f172a; font-size: 24px; margin-top: 0; margin-bottom: 16px; font-weight: 600;"
		>
			Passwort zurücksetzen 🔐
		</h2>

		<p style="color: #475569; font-size: 16px; line-height: 1.6; margin-bottom: 24px;">
			Du hast eine Anfrage zum Zurücksetzen deines Passworts gestellt. Klicke auf den Button unten,
			um ein neues Passwort zu wählen:
		</p>

		<!-- CTA Button -->
		<div style="text-align: center; margin: 32px 0;">
			<a
				href="{APP_URL}/reset-password?token={TOKEN}"
				style="display: inline-block; background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%); 
                color: white; padding: 16px 40px; border-radius: 10px; 
                text-decoration: none; font-weight: 600; font-size: 16px;
                box-shadow: 0 4px 14px rgba(14, 165, 233, 0.25);"
			>
				🔄 Neues Passwort festlegen
			</a>
		</div>

		<!-- Warning Box -->
		<div
			style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 12px; padding: 16px; margin: 24px 0;"
		>
			<p style="color: #991b1b; font-size: 14px; margin: 0; line-height: 1.5;">
				⚠️ <strong>Wichtiger Hinweis:</strong><br />
				Dieser Link ist aus Sicherheitsgründen nur <strong>1 Stunde</strong> gültig. Danach musst du
				eine neue Anfrage stellen.
			</p>
		</div>

		<!-- Security Notice -->
		<div style="background: #f0f9ff; border-radius: 12px; padding: 16px; margin: 24px 0;">
			<p style="color: #0369a1; font-size: 14px; margin: 0 0 8px 0; font-weight: 600;">
				🔒 Sicherheitstipps für dein neues Passwort:
			</p>
			<ul style="color: #0c4a6e; font-size: 13px; margin: 0; padding-left: 20px; line-height: 1.6;">
				<li>Mindestens 8 Zeichen lang</li>
				<li>Kombination aus Buchstaben, Zahlen und Sonderzeichen</li>
				<li>Verwende kein Passwort, das du bereits woanders nutzt</li>
			</ul>
		</div>

		<!-- Alternative Link -->
		<div style="margin-top: 24px; padding-top: 24px; border-top: 1px solid #e2e8f0;">
			<p style="color: #94a3b8; font-size: 13px; line-height: 1.6; margin: 0;">
				Falls der Button nicht funktioniert, kopiere diesen Link in deinen Browser:
			</p>
			<div
				style="background: #f8fafc; border-radius: 8px; padding: 12px; margin-top: 8px; word-break: break-all;"
			>
				<a
					href="{APP_URL}/reset-password?token={TOKEN}"
					style="color: #0ea5e9; font-size: 12px; text-decoration: none;"
				>
					{APP_URL}/reset-password?token={TOKEN}
				</a>
			</div>
		</div>

		<!-- Ignore Notice -->
		<div style="margin-top: 24px; padding: 16px; background: #f8fafc; border-radius: 8px;">
			<p style="color: #64748b; font-size: 13px; margin: 0;">
				<strong>Du hast kein neues Passwort angefordert?</strong><br />
				Dann kannst du diese E-Mail einfach ignorieren. Dein Passwort bleibt unverändert und niemand
				kann ohne Zugriff auf deine E-Mails dein Passwort ändern.
			</p>
		</div>
	</div>

	<!-- Footer -->
	<div style="text-align: center; margin-top: 32px; padding: 20px;">
		<p style="color: #94a3b8; font-size: 12px; margin: 8px 0;">
			Diese E-Mail wurde an <strong>{EMAIL}</strong> gesendet.
		</p>

		<div style="margin-top: 24px; padding-top: 24px; border-top: 1px solid #e2e8f0;">
			<p style="color: #cbd5e1; font-size: 11px; margin: 0;">
				© 2025 uLoad · Sicher und privat ·
				<a href="https://ulo.ad" style="color: #0ea5e9; text-decoration: none;">ulo.ad</a>
			</p>
			<p style="color: #cbd5e1; font-size: 10px; margin-top: 8px;">
				Aus Sicherheitsgründen speichern wir deine IP-Adresse bei Passwort-Änderungen.
			</p>
		</div>
	</div>
</div>
```

---

## 3. E-Mail-Änderung Template

**Bereich:** Email change template

### Subject:

```
Bestätige deine neue E-Mail-Adresse für uLoad 📧
```

### Body (HTML):

```html
<div
	style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8fafc;"
>
	<!-- Logo/Header -->
	<div style="text-align: center; margin-bottom: 30px; padding: 20px;">
		<h1 style="color: #0ea5e9; font-size: 36px; margin: 0; font-weight: 700;">🔗 uLoad</h1>
	</div>

	<!-- Main Content Card -->
	<div
		style="background: #ffffff; border-radius: 16px; padding: 32px; box-shadow: 0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06);"
	>
		<h2
			style="color: #0f172a; font-size: 24px; margin-top: 0; margin-bottom: 16px; font-weight: 600;"
		>
			E-Mail-Adresse ändern 📧
		</h2>

		<p style="color: #475569; font-size: 16px; line-height: 1.6; margin-bottom: 24px;">
			Du hast eine Änderung deiner E-Mail-Adresse beantragt. Bitte bestätige die neue
			E-Mail-Adresse, um die Änderung abzuschließen:
		</p>

		<!-- Info Box -->
		<div
			style="background: #f0f9ff; border-radius: 12px; padding: 16px; margin: 24px 0; border: 1px solid #bae6fd;"
		>
			<p style="color: #0369a1; font-size: 14px; margin: 0;">
				<strong>Alte E-Mail:</strong> {EMAIL}<br />
				<strong>Neue E-Mail:</strong> {NEW_EMAIL}
			</p>
		</div>

		<!-- CTA Button -->
		<div style="text-align: center; margin: 32px 0;">
			<a
				href="{APP_URL}/_/#/auth/confirm-email-change/{TOKEN}"
				style="display: inline-block; background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%); 
                color: white; padding: 16px 40px; border-radius: 10px; 
                text-decoration: none; font-weight: 600; font-size: 16px;
                box-shadow: 0 4px 14px rgba(14, 165, 233, 0.25);"
			>
				✅ Neue E-Mail bestätigen
			</a>
		</div>

		<!-- Warning Box -->
		<div
			style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 12px; padding: 16px; margin: 24px 0;"
		>
			<p style="color: #991b1b; font-size: 14px; margin: 0;">
				⚠️ <strong>Wichtig:</strong> Nach der Bestätigung musst du dich mit deiner neuen
				E-Mail-Adresse anmelden.
			</p>
		</div>

		<!-- Alternative Link -->
		<div style="margin-top: 24px; padding-top: 24px; border-top: 1px solid #e2e8f0;">
			<p style="color: #94a3b8; font-size: 13px; line-height: 1.6; margin: 0;">
				Falls der Button nicht funktioniert, kopiere diesen Link in deinen Browser:
			</p>
			<div
				style="background: #f8fafc; border-radius: 8px; padding: 12px; margin-top: 8px; word-break: break-all;"
			>
				<a
					href="{APP_URL}/_/#/auth/confirm-email-change/{TOKEN}"
					style="color: #0ea5e9; font-size: 12px; text-decoration: none;"
				>
					{APP_URL}/_/#/auth/confirm-email-change/{TOKEN}
				</a>
			</div>
		</div>
	</div>

	<!-- Footer -->
	<div style="text-align: center; margin-top: 32px; padding: 20px;">
		<p style="color: #94a3b8; font-size: 12px; margin: 8px 0;">
			Falls du diese Änderung nicht beantragt hast, ignoriere diese E-Mail und melde dich bei uns,
			falls du Sicherheitsbedenken hast.
		</p>

		<div style="margin-top: 24px; padding-top: 24px; border-top: 1px solid #e2e8f0;">
			<p style="color: #cbd5e1; font-size: 11px; margin: 0;">
				© 2025 uLoad ·
				<a href="https://ulo.ad" style="color: #0ea5e9; text-decoration: none;">ulo.ad</a>
			</p>
		</div>
	</div>
</div>
```

---

## 4. OTP (One-Time Password) Template

**Bereich:** OTP template (falls aktiviert)

### Subject:

```
Dein uLoad Einmal-Passwort: {OTP} 🔑
```

### Body (HTML):

```html
<div
	style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8fafc;"
>
	<!-- Logo/Header -->
	<div style="text-align: center; margin-bottom: 30px; padding: 20px;">
		<h1 style="color: #0ea5e9; font-size: 36px; margin: 0; font-weight: 700;">🔗 uLoad</h1>
	</div>

	<!-- Main Content Card -->
	<div
		style="background: #ffffff; border-radius: 16px; padding: 32px; box-shadow: 0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06);"
	>
		<h2
			style="color: #0f172a; font-size: 24px; margin-top: 0; margin-bottom: 16px; font-weight: 600;"
		>
			Dein Einmal-Passwort 🔑
		</h2>

		<p style="color: #475569; font-size: 16px; line-height: 1.6; margin-bottom: 24px;">
			Verwende diesen Code, um dich bei uLoad anzumelden:
		</p>

		<!-- OTP Code Box -->
		<div
			style="background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%); border-radius: 12px; padding: 24px; margin: 24px 0; text-align: center;"
		>
			<p
				style="color: white; font-size: 32px; margin: 0; font-weight: 700; letter-spacing: 8px; font-family: 'Courier New', monospace;"
			>
				{OTP}
			</p>
		</div>

		<!-- Timer Warning -->
		<div
			style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 12px; padding: 16px; margin: 24px 0; text-align: center;"
		>
			<p style="color: #991b1b; font-size: 14px; margin: 0;">
				⏱️ Dieser Code ist nur <strong>3 Minuten</strong> gültig
			</p>
		</div>

		<p style="color: #64748b; font-size: 14px; line-height: 1.6;">
			Falls du diesen Code nicht angefordert hast, hat möglicherweise jemand versucht, sich mit
			deiner E-Mail-Adresse anzumelden. Du kannst diese E-Mail in diesem Fall ignorieren.
		</p>
	</div>

	<!-- Footer -->
	<div style="text-align: center; margin-top: 32px; padding: 20px;">
		<p style="color: #cbd5e1; font-size: 11px; margin: 0;">
			© 2025 uLoad · Sicher und privat ·
			<a href="https://ulo.ad" style="color: #0ea5e9; text-decoration: none;">ulo.ad</a>
		</p>
	</div>
</div>
```

---

## 5. Login-Alert Template (Neue Anmeldung)

**Bereich:** Auth alert template

### Subject:

```
Neue Anmeldung bei deinem uLoad Account 🔔
```

### Body (HTML):

```html
<div
	style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8fafc;"
>
	<!-- Logo/Header -->
	<div style="text-align: center; margin-bottom: 30px; padding: 20px;">
		<h1 style="color: #0ea5e9; font-size: 36px; margin: 0; font-weight: 700;">🔗 uLoad</h1>
	</div>

	<!-- Main Content Card -->
	<div
		style="background: #ffffff; border-radius: 16px; padding: 32px; box-shadow: 0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06);"
	>
		<h2
			style="color: #0f172a; font-size: 24px; margin-top: 0; margin-bottom: 16px; font-weight: 600;"
		>
			Neue Anmeldung erkannt 🔔
		</h2>

		<p style="color: #475569; font-size: 16px; line-height: 1.6; margin-bottom: 24px;">
			Wir haben eine Anmeldung bei deinem uLoad Account von einem neuen Standort erkannt.
		</p>

		<!-- Login Details -->
		<div
			style="background: #f8fafc; border-radius: 12px; padding: 20px; margin: 24px 0; border: 1px solid #e2e8f0;"
		>
			<p style="color: #0f172a; font-size: 14px; margin: 0 0 12px 0; font-weight: 600;">
				📍 Anmelde-Details:
			</p>
			<ul style="color: #475569; font-size: 14px; margin: 0; padding-left: 20px; line-height: 1.8;">
				<li><strong>Zeit:</strong> {TIME}</li>
				<li><strong>Browser:</strong> {BROWSER}</li>
				<li><strong>Gerät:</strong> {DEVICE}</li>
				<li><strong>Standort:</strong> {LOCATION}</li>
				<li><strong>IP-Adresse:</strong> {IP}</li>
			</ul>
		</div>

		<!-- Action Box - Warst du das? -->
		<div
			style="background: #dcfce7; border: 1px solid #86efac; border-radius: 12px; padding: 16px; margin: 24px 0;"
		>
			<p style="color: #14532d; font-size: 14px; margin: 0 0 12px 0; font-weight: 600;">
				✅ Warst du das?
			</p>
			<p style="color: #166534; font-size: 13px; margin: 0;">
				Wenn ja, kannst du diese E-Mail ignorieren. Dein Account ist sicher.
			</p>
		</div>

		<!-- Warning Box - Warst du das nicht? -->
		<div
			style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 12px; padding: 16px; margin: 24px 0;"
		>
			<p style="color: #991b1b; font-size: 14px; margin: 0 0 12px 0; font-weight: 600;">
				⚠️ Warst du das NICHT?
			</p>
			<p style="color: #7f1d1d; font-size: 13px; margin: 0 0 16px 0;">
				Ändere sofort dein Passwort, um deinen Account zu sichern:
			</p>
			<div style="text-align: center;">
				<a
					href="{APP_URL}/forgot-password"
					style="display: inline-block; background: #dc2626; 
                  color: white; padding: 12px 24px; border-radius: 8px; 
                  text-decoration: none; font-weight: 600; font-size: 14px;"
				>
					🔐 Passwort jetzt ändern
				</a>
			</div>
		</div>
	</div>

	<!-- Footer -->
	<div style="text-align: center; margin-top: 32px; padding: 20px;">
		<p style="color: #94a3b8; font-size: 12px; margin: 8px 0;">
			Diese Sicherheitsbenachrichtigung wurde an <strong>{EMAIL}</strong> gesendet.
		</p>

		<div style="margin-top: 24px; padding-top: 24px; border-top: 1px solid #e2e8f0;">
			<p style="color: #cbd5e1; font-size: 11px; margin: 0;">
				© 2025 uLoad · Deine Sicherheit ist uns wichtig ·
				<a href="https://ulo.ad" style="color: #0ea5e9; text-decoration: none;">ulo.ad</a>
			</p>
		</div>
	</div>
</div>
```

---

## Verfügbare Variablen

Diese Platzhalter werden automatisch von PocketBase ersetzt:

| Variable      | Beschreibung                       |
| ------------- | ---------------------------------- |
| `{APP_NAME}`  | Name der App (uload)               |
| `{APP_URL}`   | Basis-URL deiner App               |
| `{TOKEN}`     | Verifikations-/Reset-Token         |
| `{EMAIL}`     | E-Mail-Adresse des Empfängers      |
| `{NEW_EMAIL}` | Neue E-Mail-Adresse (bei Änderung) |
| `{OTP}`       | Einmal-Passwort                    |
| `{TIME}`      | Login-Zeit                         |
| `{BROWSER}`   | Browser-Information                |
| `{DEVICE}`    | Gerät-Information                  |
| `{LOCATION}`  | Standort                           |
| `{IP}`        | IP-Adresse                         |

---

## Wichtige Hinweise

### URLs anpassen:

⚠️ **WICHTIG**: Die Standard-PocketBase-URLs müssen auf unsere Custom-Pages umgeleitet werden:

- **Password Reset**:
  - Alt: `{APP_URL}/_/#/auth/confirm-password-reset/{TOKEN}`
  - Neu: `{APP_URL}/reset-password?token={TOKEN}`

- **E-Mail Verifikation**:
  - Standard: `{APP_URL}/_/#/auth/confirm-verification/{TOKEN}`
  - Kann so bleiben oder zu einer Custom-Page geändert werden

### Test-Empfehlungen:

1. **Nach dem Einrichten**: Sende Test-Mails an dich selbst
2. **Verschiedene E-Mail-Clients**: Teste in Gmail, Outlook, Apple Mail
3. **Mobile Ansicht**: Prüfe die Darstellung auf Smartphones
4. **Spam-Check**: Stelle sicher, dass E-Mails nicht im Spam landen

### Design-Konsistenz:

- **Farben**: Verwende die uLoad-Farben (#0ea5e9 für Primary)
- **Schriften**: System-Fonts für beste Kompatibilität
- **Logo**: Emoji 🔗 als einfaches Branding-Element
- **Responsive**: Alle Templates sind mobile-optimiert

---

_Erstellt: 15. Januar 2025_  
_Für: uLoad E-Mail-System_  
_Version: 1.0_
