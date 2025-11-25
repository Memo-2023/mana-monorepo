# Vereinfachte E-Mail Templates für ulo.ad (ohne Emojis/Flags)

## Wichtig: Diese Templates funktionieren garantiert!

Falls die komplexen Templates mit Emojis und Flags Probleme machen, verwende diese vereinfachten Versionen. Sie enthalten denselben Inhalt, aber ohne problematische Sonderzeichen.

---

## 1. E-Mail-Verifizierung Template (Vereinfacht)

**Bereich:** Verification template

### Subject:

```
Bestätige deine E-Mail / Verify your email - ulo.ad
```

### Body (HTML):

```html
<div
	style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8fafc;"
>
	<!-- Header -->
	<div style="text-align: center; margin-bottom: 30px;">
		<h1 style="color: #0ea5e9; font-size: 36px; margin: 0;">ulo.ad</h1>
		<p style="color: #64748b; margin-top: 8px; font-size: 14px;">
			Deine Links. Dein Style. Deine Kontrolle.<br />
			Your links. Your style. Your control.
		</p>
	</div>

	<!-- Main Content -->
	<div
		style="background: #ffffff; border-radius: 12px; padding: 30px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);"
	>
		<!-- German Section -->
		<div style="margin-bottom: 30px;">
			<h2 style="color: #0f172a; font-size: 24px; margin: 0 0 16px 0;">
				[DE] Willkommen bei ulo.ad!
			</h2>
			<p style="color: #475569; font-size: 16px; line-height: 1.6;">
				Vielen Dank für deine Registrierung! Bitte bestätige deine E-Mail-Adresse, um alle Features
				freizuschalten.
			</p>
		</div>

		<!-- English Section -->
		<div style="margin-bottom: 30px;">
			<h2 style="color: #0f172a; font-size: 24px; margin: 0 0 16px 0;">[EN] Welcome to ulo.ad!</h2>
			<p style="color: #475569; font-size: 16px; line-height: 1.6;">
				Thank you for signing up! Please verify your email address to unlock all features.
			</p>
		</div>

		<!-- CTA Button -->
		<div style="text-align: center; margin: 40px 0;">
			<a
				href="{APP_URL}/verify-email?token={TOKEN}"
				style="display: inline-block; background: #0ea5e9; color: white; 
                padding: 16px 40px; border-radius: 8px; text-decoration: none; 
                font-weight: 600; font-size: 16px;"
			>
				E-Mail bestätigen / Verify Email
			</a>
		</div>

		<!-- Alternative Link -->
		<div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
			<p style="color: #94a3b8; font-size: 13px; margin-bottom: 8px;">
				[DE] Falls der Button nicht funktioniert, kopiere diesen Link:<br />
				[EN] If the button doesn't work, copy this link:
			</p>
			<p
				style="background: #f8fafc; padding: 12px; border-radius: 6px; word-break: break-all; font-size: 12px; color: #0ea5e9;"
			>
				{APP_URL}/verify-email?token={TOKEN}
			</p>
		</div>
	</div>

	<!-- Footer -->
	<div style="text-align: center; margin-top: 30px;">
		<p style="color: #94a3b8; font-size: 12px;">
			Diese E-Mail wurde an {EMAIL} gesendet.<br />
			This email was sent to {EMAIL}.
		</p>
		<p style="color: #cbd5e1; font-size: 11px; margin-top: 20px;">© 2025 ulo.ad</p>
	</div>
</div>
```

---

## 2. Passwort-Reset Template (Vereinfacht)

**Bereich:** Password reset template

### Subject:

```
Passwort zurücksetzen / Reset password - ulo.ad
```

### Body (HTML):

```html
<div
	style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8fafc;"
>
	<!-- Header -->
	<div style="text-align: center; margin-bottom: 30px;">
		<h1 style="color: #0ea5e9; font-size: 36px; margin: 0;">ulo.ad</h1>
	</div>

	<!-- Main Content -->
	<div
		style="background: #ffffff; border-radius: 12px; padding: 30px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);"
	>
		<!-- German Section -->
		<div style="margin-bottom: 30px;">
			<h2 style="color: #0f172a; font-size: 24px; margin: 0 0 16px 0;">
				[DE] Passwort zurücksetzen
			</h2>
			<p style="color: #475569; font-size: 16px; line-height: 1.6;">
				Du hast eine Anfrage zum Zurücksetzen deines Passworts gestellt. Klicke auf den Button
				unten, um ein neues Passwort zu wählen.
			</p>
		</div>

		<!-- English Section -->
		<div style="margin-bottom: 30px;">
			<h2 style="color: #0f172a; font-size: 24px; margin: 0 0 16px 0;">[EN] Reset Password</h2>
			<p style="color: #475569; font-size: 16px; line-height: 1.6;">
				You have requested to reset your password. Click the button below to choose a new password.
			</p>
		</div>

		<!-- CTA Button -->
		<div style="text-align: center; margin: 40px 0;">
			<a
				href="{APP_URL}/reset-password?token={TOKEN}"
				style="display: inline-block; background: #0ea5e9; color: white; 
                padding: 16px 40px; border-radius: 8px; text-decoration: none; 
                font-weight: 600; font-size: 16px;"
			>
				Neues Passwort festlegen / Set New Password
			</a>
		</div>

		<!-- Warning -->
		<div
			style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 16px; margin: 20px 0;"
		>
			<p style="color: #991b1b; font-size: 14px; margin: 0;">
				<strong>[DE]</strong> Dieser Link ist nur 1 Stunde gültig.<br />
				<strong>[EN]</strong> This link is only valid for 1 hour.
			</p>
		</div>

		<!-- Alternative Link -->
		<div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
			<p style="color: #94a3b8; font-size: 13px; margin-bottom: 8px;">
				[DE] Falls der Button nicht funktioniert, kopiere diesen Link:<br />
				[EN] If the button doesn't work, copy this link:
			</p>
			<p
				style="background: #f8fafc; padding: 12px; border-radius: 6px; word-break: break-all; font-size: 12px; color: #0ea5e9;"
			>
				{APP_URL}/reset-password?token={TOKEN}
			</p>
		</div>
	</div>

	<!-- Footer -->
	<div style="text-align: center; margin-top: 30px;">
		<p style="color: #94a3b8; font-size: 12px;">
			[DE] Du hast kein neues Passwort angefordert? Ignoriere diese E-Mail.<br />
			[EN] You didn't request a new password? Ignore this email.
		</p>
		<p style="color: #cbd5e1; font-size: 11px; margin-top: 20px;">© 2025 ulo.ad</p>
	</div>
</div>
```

---

## 3. E-Mail-Änderung Template (Vereinfacht)

**Bereich:** Email change template

### Subject:

```
E-Mail-Adresse ändern / Change email address - ulo.ad
```

### Body (HTML):

```html
<div
	style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8fafc;"
>
	<!-- Header -->
	<div style="text-align: center; margin-bottom: 30px;">
		<h1 style="color: #0ea5e9; font-size: 36px; margin: 0;">ulo.ad</h1>
	</div>

	<!-- Main Content -->
	<div
		style="background: #ffffff; border-radius: 12px; padding: 30px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);"
	>
		<!-- German Section -->
		<div style="margin-bottom: 30px;">
			<h2 style="color: #0f172a; font-size: 24px; margin: 0 0 16px 0;">
				[DE] E-Mail-Adresse ändern
			</h2>
			<p style="color: #475569; font-size: 16px; line-height: 1.6;">
				Du hast eine Änderung deiner E-Mail-Adresse beantragt. Bitte bestätige die neue
				E-Mail-Adresse.
			</p>
		</div>

		<!-- English Section -->
		<div style="margin-bottom: 30px;">
			<h2 style="color: #0f172a; font-size: 24px; margin: 0 0 16px 0;">
				[EN] Change Email Address
			</h2>
			<p style="color: #475569; font-size: 16px; line-height: 1.6;">
				You have requested to change your email address. Please confirm the new email address.
			</p>
		</div>

		<!-- Info Box -->
		<div style="background: #f0f9ff; border-radius: 8px; padding: 16px; margin: 20px 0;">
			<p style="color: #0369a1; font-size: 14px; margin: 0;">
				<strong>Old Email:</strong> {EMAIL}<br />
				<strong>New Email:</strong> {NEW_EMAIL}
			</p>
		</div>

		<!-- CTA Button -->
		<div style="text-align: center; margin: 40px 0;">
			<a
				href="{APP_URL}/_/#/auth/confirm-email-change/{TOKEN}"
				style="display: inline-block; background: #0ea5e9; color: white; 
                padding: 16px 40px; border-radius: 8px; text-decoration: none; 
                font-weight: 600; font-size: 16px;"
			>
				Neue E-Mail bestätigen / Confirm New Email
			</a>
		</div>

		<!-- Alternative Link -->
		<div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
			<p style="color: #94a3b8; font-size: 13px; margin-bottom: 8px;">
				[DE] Falls der Button nicht funktioniert, kopiere diesen Link:<br />
				[EN] If the button doesn't work, copy this link:
			</p>
			<p
				style="background: #f8fafc; padding: 12px; border-radius: 6px; word-break: break-all; font-size: 12px; color: #0ea5e9;"
			>
				{APP_URL}/_/#/auth/confirm-email-change/{TOKEN}
			</p>
		</div>
	</div>

	<!-- Footer -->
	<div style="text-align: center; margin-top: 30px;">
		<p style="color: #cbd5e1; font-size: 11px;">© 2025 ulo.ad</p>
	</div>
</div>
```

---

## 4. OTP (One-Time Password) Template (Vereinfacht)

**Bereich:** OTP template

### Subject:

```
Einmal-Passwort / One-Time Password: {OTP} - ulo.ad
```

### Body (HTML):

```html
<div
	style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8fafc;"
>
	<!-- Header -->
	<div style="text-align: center; margin-bottom: 30px;">
		<h1 style="color: #0ea5e9; font-size: 36px; margin: 0;">ulo.ad</h1>
	</div>

	<!-- Main Content -->
	<div
		style="background: #ffffff; border-radius: 12px; padding: 30px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);"
	>
		<h2 style="color: #0f172a; font-size: 24px; margin: 0 0 16px 0; text-align: center;">
			[DE] Dein Einmal-Passwort<br />
			[EN] Your One-Time Password
		</h2>

		<p style="color: #475569; font-size: 16px; text-align: center;">
			[DE] Verwende diesen Code für die Anmeldung:<br />
			[EN] Use this code to log in:
		</p>

		<!-- OTP Code -->
		<div
			style="background: #0ea5e9; border-radius: 8px; padding: 20px; margin: 30px 0; text-align: center;"
		>
			<p
				style="color: white; font-size: 32px; margin: 0; font-weight: bold; letter-spacing: 4px; font-family: monospace;"
			>
				{OTP}
			</p>
		</div>

		<!-- Warning -->
		<div
			style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 16px; text-align: center;"
		>
			<p style="color: #991b1b; font-size: 14px; margin: 0;">
				[DE] Dieser Code ist nur 3 Minuten gültig<br />
				[EN] This code is only valid for 3 minutes
			</p>
		</div>
	</div>

	<!-- Footer -->
	<div style="text-align: center; margin-top: 30px;">
		<p style="color: #cbd5e1; font-size: 11px;">© 2025 ulo.ad</p>
	</div>
</div>
```

---

## 5. Login-Alert Template (Vereinfacht)

**Bereich:** Auth alert template

### Subject:

```
Neue Anmeldung / New login - ulo.ad
```

### Body (HTML):

```html
<div
	style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8fafc;"
>
	<!-- Header -->
	<div style="text-align: center; margin-bottom: 30px;">
		<h1 style="color: #0ea5e9; font-size: 36px; margin: 0;">ulo.ad</h1>
	</div>

	<!-- Main Content -->
	<div
		style="background: #ffffff; border-radius: 12px; padding: 30px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);"
	>
		<h2 style="color: #0f172a; font-size: 24px; margin: 0 0 16px 0;">
			[DE] Neue Anmeldung erkannt<br />
			[EN] New Login Detected
		</h2>

		<p style="color: #475569; font-size: 16px; line-height: 1.6;">
			[DE] Wir haben eine Anmeldung von einem neuen Standort erkannt.<br />
			[EN] We detected a login from a new location.
		</p>

		<!-- Login Details -->
		<div style="background: #f8fafc; border-radius: 8px; padding: 20px; margin: 20px 0;">
			<p style="color: #0f172a; font-size: 14px; margin: 0 0 12px 0; font-weight: 600;">
				Login Details:
			</p>
			<ul style="color: #475569; font-size: 14px; margin: 0; padding-left: 20px;">
				<li>Time: {TIME}</li>
				<li>Browser: {BROWSER}</li>
				<li>Device: {DEVICE}</li>
				<li>Location: {LOCATION}</li>
				<li>IP: {IP}</li>
			</ul>
		</div>

		<!-- Action Box -->
		<div
			style="background: #dcfce7; border: 1px solid #86efac; border-radius: 8px; padding: 16px; margin: 20px 0;"
		>
			<p style="color: #166534; font-size: 14px; margin: 0;">
				<strong>[DE]</strong> Warst du das? Dann kannst du diese E-Mail ignorieren.<br />
				<strong>[EN]</strong> Was this you? Then you can ignore this email.
			</p>
		</div>

		<!-- Warning Box -->
		<div
			style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 16px; margin: 20px 0;"
		>
			<p style="color: #991b1b; font-size: 14px; margin: 0 0 12px 0;">
				<strong>[DE]</strong> Warst du das NICHT? Ändere sofort dein Passwort!<br />
				<strong>[EN]</strong> Was this NOT you? Change your password immediately!
			</p>
			<div style="text-align: center; margin-top: 16px;">
				<a
					href="{APP_URL}/forgot-password"
					style="display: inline-block; background: #dc2626; color: white; 
                  padding: 12px 24px; border-radius: 6px; text-decoration: none; 
                  font-weight: 600; font-size: 14px;"
				>
					Passwort ändern / Change Password
				</a>
			</div>
		</div>
	</div>

	<!-- Footer -->
	<div style="text-align: center; margin-top: 30px;">
		<p style="color: #94a3b8; font-size: 12px;">
			Diese Sicherheitsbenachrichtigung wurde an {EMAIL} gesendet.<br />
			This security notification was sent to {EMAIL}.
		</p>
		<p style="color: #cbd5e1; font-size: 11px; margin-top: 20px;">© 2025 ulo.ad</p>
	</div>
</div>
```

---

## Wichtige Hinweise

### Warum vereinfachte Templates?

1. **Keine Emojis/Flags**: Manche SMTP-Server haben Probleme mit Unicode-Zeichen wie 🇩🇪, 🇬🇧, 🔗, etc.
2. **Einfacheres HTML**: Weniger verschachtelte Divs und Styles
3. **Kleinere Dateigröße**: Reduzierte HTML-Größe für bessere Zustellbarkeit
4. **Bessere Kompatibilität**: Funktioniert mit allen E-Mail-Clients

### Verwendung

1. **In PocketBase Admin** (`http://localhost:8090/_/`)
2. **Collections → users → Options**
3. **Jeweiliges Template-Feld** suchen
4. **HTML aus dieser Datei** kopieren und einfügen
5. **Speichern** und testen

### Test-Reihenfolge

1. **Zuerst**: Vereinfachtes Template verwenden
2. **Wenn es funktioniert**: Problem lag an den Emojis/komplexem HTML
3. **Optional**: Schrittweise Emojis wieder hinzufügen und testen

### URLs beachten

- **Verification**: `{APP_URL}/verify-email?token={TOKEN}`
- **Password Reset**: `{APP_URL}/reset-password?token={TOKEN}`
- **Email Change**: Standard PocketBase URL (nicht ändern)

---

_Erstellt: 15. Januar 2025_  
_Für: ulo.ad E-Mail-System (Fallback-Templates)_  
_Version: 1.0 Simplified_
