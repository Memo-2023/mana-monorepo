# Zweisprachige E-Mail Templates für ulo.ad (DE/EN)

## Anleitung zum Einrichten

### Wo die Templates ändern:

1. Öffne PocketBase Admin: `http://localhost:8090/_/`
2. Gehe zu **Collections** → **users** (oder deine Auth-Collection)
3. Klicke auf **Options** (Zahnrad-Icon)
4. Scrolle zu den E-Mail-Templates Sektionen
5. Ersetze die Standard-Templates mit den unten stehenden Vorlagen
6. **Speichern** nicht vergessen!

### Sprachfeld zur User Collection hinzufügen:

1. Gehe zu **Collections** → **users**
2. Klicke auf **New field**
3. Füge folgendes Feld hinzu:
   - **Name**: `language`
   - **Type**: `Select`
   - **Options**: `de`, `en`, `fr`, `es`, `it`
   - **Default**: `de`
   - **Required**: false

---

## 1. E-Mail-Verifizierung Template (Zweisprachig)

**Bereich:** Verification template

### Subject:

```
Bestätige deine E-Mail / Verify your email - ulo.ad 🔗
```

### Body (HTML):

```html
<div
	style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8fafc;"
>
	<!-- Logo/Header -->
	<div style="text-align: center; margin-bottom: 30px; padding: 20px;">
		<h1 style="color: #0ea5e9; font-size: 36px; margin: 0; font-weight: 700;">🔗 ulo.ad</h1>
		<p style="color: #64748b; margin-top: 8px; font-size: 14px;">
			Deine Links. Dein Style. Deine Kontrolle.<br />
			Your links. Your style. Your control.
		</p>
	</div>

	<!-- Main Content Card DEUTSCH -->
	<div
		style="background: #ffffff; border-radius: 16px; padding: 32px; margin-bottom: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06);"
	>
		<div style="display: flex; align-items: center; margin-bottom: 16px;">
			<span style="font-size: 24px; margin-right: 10px;">🇩🇪</span>
			<h2 style="color: #0f172a; font-size: 24px; margin: 0; font-weight: 600;">
				Willkommen bei ulo.ad! 👋
			</h2>
		</div>

		<p style="color: #475569; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
			Vielen Dank für deine Registrierung! Du bist nur einen Klick davon entfernt, deine persönliche
			Link-Sammlung zu erstellen und zu verwalten.
		</p>

		<p style="color: #475569; font-size: 16px; line-height: 1.6; margin-bottom: 24px;">
			Bitte bestätige deine E-Mail-Adresse, um alle Features freizuschalten:
		</p>

		<!-- CTA Button Deutsch -->
		<div style="text-align: center; margin: 32px 0;">
			<a
				href="{APP_URL}/verify-email?token={TOKEN}"
				style="display: inline-block; background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%); 
                color: white; padding: 16px 40px; border-radius: 10px; 
                text-decoration: none; font-weight: 600; font-size: 16px;
                box-shadow: 0 4px 14px rgba(14, 165, 233, 0.25);
                transition: all 0.3s ease;"
			>
				✨ E-Mail-Adresse bestätigen
			</a>
		</div>

		<!-- Features Box Deutsch -->
		<div
			style="background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%); border-radius: 12px; padding: 20px; margin: 24px 0; border: 1px solid #bae6fd;"
		>
			<p style="color: #0369a1; font-size: 14px; margin: 0 0 12px 0; font-weight: 600;">
				🚀 Was dich bei ulo.ad erwartet:
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
	</div>

	<!-- Main Content Card ENGLISH -->
	<div
		style="background: #ffffff; border-radius: 16px; padding: 32px; margin-bottom: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06);"
	>
		<div style="display: flex; align-items: center; margin-bottom: 16px;">
			<span style="font-size: 24px; margin-right: 10px;">🇬🇧</span>
			<h2 style="color: #0f172a; font-size: 24px; margin: 0; font-weight: 600;">
				Welcome to ulo.ad! 👋
			</h2>
		</div>

		<p style="color: #475569; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
			Thank you for signing up! You're just one click away from creating and managing your personal
			link collection.
		</p>

		<p style="color: #475569; font-size: 16px; line-height: 1.6; margin-bottom: 24px;">
			Please verify your email address to unlock all features:
		</p>

		<!-- CTA Button English -->
		<div style="text-align: center; margin: 32px 0;">
			<a
				href="{APP_URL}/verify-email?token={TOKEN}"
				style="display: inline-block; background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%); 
                color: white; padding: 16px 40px; border-radius: 10px; 
                text-decoration: none; font-weight: 600; font-size: 16px;
                box-shadow: 0 4px 14px rgba(14, 165, 233, 0.25);
                transition: all 0.3s ease;"
			>
				✨ Verify Email Address
			</a>
		</div>

		<!-- Features Box English -->
		<div
			style="background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%); border-radius: 12px; padding: 20px; margin: 24px 0; border: 1px solid #bae6fd;"
		>
			<p style="color: #0369a1; font-size: 14px; margin: 0 0 12px 0; font-weight: 600;">
				🚀 What awaits you at ulo.ad:
			</p>
			<ul style="color: #0c4a6e; font-size: 14px; margin: 0; padding-left: 20px; line-height: 1.8;">
				<li>Short, memorable links with your own branding</li>
				<li>Detailed click analytics in real-time</li>
				<li>QR codes with customizable design</li>
				<li>Folders to organize your links</li>
				<li>Password protection for sensitive links</li>
				<li>Expiration dates for time-limited campaigns</li>
			</ul>
		</div>
	</div>

	<!-- Alternative Link -->
	<div
		style="background: #ffffff; border-radius: 16px; padding: 24px; margin-bottom: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06);"
	>
		<p style="color: #94a3b8; font-size: 13px; line-height: 1.6; margin: 0;">
			<strong>🇩🇪</strong> Falls der Button nicht funktioniert, kopiere diesen Link in deinen
			Browser:<br />
			<strong>🇬🇧</strong> If the button doesn't work, copy this link into your browser:
		</p>
		<div
			style="background: #f8fafc; border-radius: 8px; padding: 12px; margin-top: 8px; word-break: break-all;"
		>
			<a
				href="{APP_URL}/verify-email?token={TOKEN}"
				style="color: #0ea5e9; font-size: 12px; text-decoration: none;"
			>
				{APP_URL}/verify-email?token={TOKEN}
			</a>
		</div>
	</div>

	<!-- Footer -->
	<div style="text-align: center; margin-top: 32px; padding: 20px;">
		<p style="color: #94a3b8; font-size: 12px; margin: 8px 0;">
			<strong>🇩🇪</strong> Diese E-Mail wurde an <strong>{EMAIL}</strong> gesendet.<br />
			<strong>🇬🇧</strong> This email was sent to <strong>{EMAIL}</strong>.
		</p>
		<p style="color: #94a3b8; font-size: 12px; margin: 8px 0;">
			<strong>🇩🇪</strong> Falls du dich nicht bei ulo.ad registriert hast, kannst du diese E-Mail
			sicher ignorieren.<br />
			<strong>🇬🇧</strong> If you didn't sign up for ulo.ad, you can safely ignore this email.
		</p>

		<div style="margin-top: 24px; padding-top: 24px; border-top: 1px solid #e2e8f0;">
			<p style="color: #cbd5e1; font-size: 11px; margin: 0;">
				© 2025 ulo.ad · Built with ❤️ ·
				<a href="https://ulo.ad" style="color: #0ea5e9; text-decoration: none;">ulo.ad</a>
			</p>
		</div>
	</div>
</div>
```

---

## 2. Passwort-Reset Template (Zweisprachig)

**Bereich:** Password reset template

### Subject:

```
Passwort zurücksetzen / Reset password - ulo.ad 🔐
```

### Body (HTML):

```html
<div
	style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8fafc;"
>
	<!-- Logo/Header -->
	<div style="text-align: center; margin-bottom: 30px; padding: 20px;">
		<h1 style="color: #0ea5e9; font-size: 36px; margin: 0; font-weight: 700;">🔗 ulo.ad</h1>
	</div>

	<!-- Main Content Card DEUTSCH -->
	<div
		style="background: #ffffff; border-radius: 16px; padding: 32px; margin-bottom: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06);"
	>
		<div style="display: flex; align-items: center; margin-bottom: 16px;">
			<span style="font-size: 24px; margin-right: 10px;">🇩🇪</span>
			<h2 style="color: #0f172a; font-size: 24px; margin: 0; font-weight: 600;">
				Passwort zurücksetzen 🔐
			</h2>
		</div>

		<p style="color: #475569; font-size: 16px; line-height: 1.6; margin-bottom: 24px;">
			Du hast eine Anfrage zum Zurücksetzen deines Passworts gestellt. Klicke auf den Button unten,
			um ein neues Passwort zu wählen:
		</p>

		<!-- CTA Button Deutsch -->
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

		<!-- Security Notice Deutsch -->
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
	</div>

	<!-- Main Content Card ENGLISH -->
	<div
		style="background: #ffffff; border-radius: 16px; padding: 32px; margin-bottom: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06);"
	>
		<div style="display: flex; align-items: center; margin-bottom: 16px;">
			<span style="font-size: 24px; margin-right: 10px;">🇬🇧</span>
			<h2 style="color: #0f172a; font-size: 24px; margin: 0; font-weight: 600;">
				Reset Password 🔐
			</h2>
		</div>

		<p style="color: #475569; font-size: 16px; line-height: 1.6; margin-bottom: 24px;">
			You have requested to reset your password. Click the button below to choose a new password:
		</p>

		<!-- CTA Button English -->
		<div style="text-align: center; margin: 32px 0;">
			<a
				href="{APP_URL}/reset-password?token={TOKEN}"
				style="display: inline-block; background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%); 
                color: white; padding: 16px 40px; border-radius: 10px; 
                text-decoration: none; font-weight: 600; font-size: 16px;
                box-shadow: 0 4px 14px rgba(14, 165, 233, 0.25);"
			>
				🔄 Set New Password
			</a>
		</div>

		<!-- Security Notice English -->
		<div style="background: #f0f9ff; border-radius: 12px; padding: 16px; margin: 24px 0;">
			<p style="color: #0369a1; font-size: 14px; margin: 0 0 8px 0; font-weight: 600;">
				🔒 Security tips for your new password:
			</p>
			<ul style="color: #0c4a6e; font-size: 13px; margin: 0; padding-left: 20px; line-height: 1.6;">
				<li>At least 8 characters long</li>
				<li>Combination of letters, numbers, and special characters</li>
				<li>Don't use a password you already use elsewhere</li>
			</ul>
		</div>
	</div>

	<!-- Warning Box -->
	<div
		style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 12px; padding: 16px; margin: 0 20px 24px 20px;"
	>
		<p style="color: #991b1b; font-size: 14px; margin: 0; line-height: 1.5;">
			⚠️ <strong>🇩🇪 Wichtiger Hinweis:</strong> Dieser Link ist aus Sicherheitsgründen nur
			<strong>1 Stunde</strong> gültig.<br />
			⚠️ <strong>🇬🇧 Important Notice:</strong> This link is only valid for
			<strong>1 hour</strong> for security reasons.
		</p>
	</div>

	<!-- Alternative Link -->
	<div
		style="background: #ffffff; border-radius: 16px; padding: 24px; margin-bottom: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06);"
	>
		<p style="color: #94a3b8; font-size: 13px; line-height: 1.6; margin: 0;">
			<strong>🇩🇪</strong> Falls der Button nicht funktioniert, kopiere diesen Link in deinen
			Browser:<br />
			<strong>🇬🇧</strong> If the button doesn't work, copy this link into your browser:
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
	<div style="background: #f8fafc; border-radius: 8px; padding: 16px; margin: 0 20px;">
		<p style="color: #64748b; font-size: 13px; margin: 0;">
			<strong>🇩🇪 Du hast kein neues Passwort angefordert?</strong><br />
			Dann kannst du diese E-Mail einfach ignorieren. Dein Passwort bleibt unverändert.<br /><br />
			<strong>🇬🇧 You didn't request a new password?</strong><br />
			Then you can simply ignore this email. Your password remains unchanged.
		</p>
	</div>

	<!-- Footer -->
	<div style="text-align: center; margin-top: 32px; padding: 20px;">
		<p style="color: #94a3b8; font-size: 12px; margin: 8px 0;">
			<strong>🇩🇪</strong> Diese E-Mail wurde an <strong>{EMAIL}</strong> gesendet.<br />
			<strong>🇬🇧</strong> This email was sent to <strong>{EMAIL}</strong>.
		</p>

		<div style="margin-top: 24px; padding-top: 24px; border-top: 1px solid #e2e8f0;">
			<p style="color: #cbd5e1; font-size: 11px; margin: 0;">
				© 2025 ulo.ad · Sicher und privat / Safe and private ·
				<a href="https://ulo.ad" style="color: #0ea5e9; text-decoration: none;">ulo.ad</a>
			</p>
		</div>
	</div>
</div>
```

---

## 3. E-Mail-Änderung Template (Zweisprachig)

**Bereich:** Email change template

### Subject:

```
E-Mail-Adresse ändern / Change email address - ulo.ad 📧
```

### Body (HTML):

```html
<div
	style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8fafc;"
>
	<!-- Logo/Header -->
	<div style="text-align: center; margin-bottom: 30px; padding: 20px;">
		<h1 style="color: #0ea5e9; font-size: 36px; margin: 0; font-weight: 700;">🔗 ulo.ad</h1>
	</div>

	<!-- Main Content Card DEUTSCH -->
	<div
		style="background: #ffffff; border-radius: 16px; padding: 32px; margin-bottom: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06);"
	>
		<div style="display: flex; align-items: center; margin-bottom: 16px;">
			<span style="font-size: 24px; margin-right: 10px;">🇩🇪</span>
			<h2 style="color: #0f172a; font-size: 24px; margin: 0; font-weight: 600;">
				E-Mail-Adresse ändern 📧
			</h2>
		</div>

		<p style="color: #475569; font-size: 16px; line-height: 1.6; margin-bottom: 24px;">
			Du hast eine Änderung deiner E-Mail-Adresse beantragt. Bitte bestätige die neue
			E-Mail-Adresse, um die Änderung abzuschließen:
		</p>

		<!-- Info Box Deutsch -->
		<div
			style="background: #f0f9ff; border-radius: 12px; padding: 16px; margin: 24px 0; border: 1px solid #bae6fd;"
		>
			<p style="color: #0369a1; font-size: 14px; margin: 0;">
				<strong>Alte E-Mail:</strong> {EMAIL}<br />
				<strong>Neue E-Mail:</strong> {NEW_EMAIL}
			</p>
		</div>

		<!-- CTA Button Deutsch -->
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
	</div>

	<!-- Main Content Card ENGLISH -->
	<div
		style="background: #ffffff; border-radius: 16px; padding: 32px; margin-bottom: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06);"
	>
		<div style="display: flex; align-items: center; margin-bottom: 16px;">
			<span style="font-size: 24px; margin-right: 10px;">🇬🇧</span>
			<h2 style="color: #0f172a; font-size: 24px; margin: 0; font-weight: 600;">
				Change Email Address 📧
			</h2>
		</div>

		<p style="color: #475569; font-size: 16px; line-height: 1.6; margin-bottom: 24px;">
			You have requested to change your email address. Please confirm the new email address to
			complete the change:
		</p>

		<!-- Info Box English -->
		<div
			style="background: #f0f9ff; border-radius: 12px; padding: 16px; margin: 24px 0; border: 1px solid #bae6fd;"
		>
			<p style="color: #0369a1; font-size: 14px; margin: 0;">
				<strong>Old Email:</strong> {EMAIL}<br />
				<strong>New Email:</strong> {NEW_EMAIL}
			</p>
		</div>

		<!-- CTA Button English -->
		<div style="text-align: center; margin: 32px 0;">
			<a
				href="{APP_URL}/_/#/auth/confirm-email-change/{TOKEN}"
				style="display: inline-block; background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%); 
                color: white; padding: 16px 40px; border-radius: 10px; 
                text-decoration: none; font-weight: 600; font-size: 16px;
                box-shadow: 0 4px 14px rgba(14, 165, 233, 0.25);"
			>
				✅ Confirm New Email
			</a>
		</div>
	</div>

	<!-- Warning Box -->
	<div
		style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 12px; padding: 16px; margin: 0 20px 24px 20px;"
	>
		<p style="color: #991b1b; font-size: 14px; margin: 0;">
			⚠️ <strong>🇩🇪 Wichtig:</strong> Nach der Bestätigung musst du dich mit deiner neuen
			E-Mail-Adresse anmelden.<br />
			⚠️ <strong>🇬🇧 Important:</strong> After confirmation, you must log in with your new email
			address.
		</p>
	</div>

	<!-- Alternative Link -->
	<div
		style="background: #ffffff; border-radius: 16px; padding: 24px; margin-bottom: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06);"
	>
		<p style="color: #94a3b8; font-size: 13px; line-height: 1.6; margin: 0;">
			<strong>🇩🇪</strong> Falls der Button nicht funktioniert, kopiere diesen Link in deinen
			Browser:<br />
			<strong>🇬🇧</strong> If the button doesn't work, copy this link into your browser:
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

	<!-- Footer -->
	<div style="text-align: center; margin-top: 32px; padding: 20px;">
		<p style="color: #94a3b8; font-size: 12px; margin: 8px 0;">
			<strong>🇩🇪</strong> Falls du diese Änderung nicht beantragt hast, ignoriere diese E-Mail.<br />
			<strong>🇬🇧</strong> If you didn't request this change, ignore this email.
		</p>

		<div style="margin-top: 24px; padding-top: 24px; border-top: 1px solid #e2e8f0;">
			<p style="color: #cbd5e1; font-size: 11px; margin: 0;">
				© 2025 ulo.ad ·
				<a href="https://ulo.ad" style="color: #0ea5e9; text-decoration: none;">ulo.ad</a>
			</p>
		</div>
	</div>
</div>
```

---

## 4. OTP (One-Time Password) Template (Zweisprachig)

**Bereich:** OTP template (falls aktiviert)

### Subject:

```
Einmal-Passwort / One-Time Password: {OTP} - ulo.ad 🔑
```

### Body (HTML):

```html
<div
	style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8fafc;"
>
	<!-- Logo/Header -->
	<div style="text-align: center; margin-bottom: 30px; padding: 20px;">
		<h1 style="color: #0ea5e9; font-size: 36px; margin: 0; font-weight: 700;">🔗 ulo.ad</h1>
	</div>

	<!-- Main Content Card -->
	<div
		style="background: #ffffff; border-radius: 16px; padding: 32px; box-shadow: 0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06);"
	>
		<h2
			style="color: #0f172a; font-size: 24px; margin-top: 0; margin-bottom: 16px; font-weight: 600; text-align: center;"
		>
			🇩🇪 Dein Einmal-Passwort<br />
			🇬🇧 Your One-Time Password
		</h2>

		<p
			style="color: #475569; font-size: 16px; line-height: 1.6; margin-bottom: 24px; text-align: center;"
		>
			<strong>🇩🇪</strong> Verwende diesen Code, um dich bei ulo.ad anzumelden:<br />
			<strong>🇬🇧</strong> Use this code to log in to ulo.ad:
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
				⏱️ <strong>🇩🇪</strong> Dieser Code ist nur <strong>3 Minuten</strong> gültig<br />
				⏱️ <strong>🇬🇧</strong> This code is only valid for <strong>3 minutes</strong>
			</p>
		</div>

		<p style="color: #64748b; font-size: 14px; line-height: 1.6;">
			<strong>🇩🇪</strong> Falls du diesen Code nicht angefordert hast, hat möglicherweise jemand
			versucht, sich mit deiner E-Mail-Adresse anzumelden. Du kannst diese E-Mail in diesem Fall
			ignorieren.<br /><br />
			<strong>🇬🇧</strong> If you didn't request this code, someone may have tried to log in with
			your email address. You can ignore this email in that case.
		</p>
	</div>

	<!-- Footer -->
	<div style="text-align: center; margin-top: 32px; padding: 20px;">
		<p style="color: #cbd5e1; font-size: 11px; margin: 0;">
			© 2025 ulo.ad · Sicher und privat / Safe and private ·
			<a href="https://ulo.ad" style="color: #0ea5e9; text-decoration: none;">ulo.ad</a>
		</p>
	</div>
</div>
```

---

## 5. Login-Alert Template (Neue Anmeldung) (Zweisprachig)

**Bereich:** Auth alert template

### Subject:

```
Neue Anmeldung / New login - ulo.ad 🔔
```

### Body (HTML):

```html
<div
	style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8fafc;"
>
	<!-- Logo/Header -->
	<div style="text-align: center; margin-bottom: 30px; padding: 20px;">
		<h1 style="color: #0ea5e9; font-size: 36px; margin: 0; font-weight: 700;">🔗 ulo.ad</h1>
	</div>

	<!-- Main Content Card -->
	<div
		style="background: #ffffff; border-radius: 16px; padding: 32px; box-shadow: 0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06);"
	>
		<h2
			style="color: #0f172a; font-size: 24px; margin-top: 0; margin-bottom: 16px; font-weight: 600;"
		>
			🇩🇪 Neue Anmeldung erkannt 🔔<br />
			🇬🇧 New Login Detected 🔔
		</h2>

		<p style="color: #475569; font-size: 16px; line-height: 1.6; margin-bottom: 24px;">
			<strong>🇩🇪</strong> Wir haben eine Anmeldung bei deinem ulo.ad Account von einem neuen
			Standort erkannt.<br />
			<strong>🇬🇧</strong> We detected a login to your ulo.ad account from a new location.
		</p>

		<!-- Login Details -->
		<div
			style="background: #f8fafc; border-radius: 12px; padding: 20px; margin: 24px 0; border: 1px solid #e2e8f0;"
		>
			<p style="color: #0f172a; font-size: 14px; margin: 0 0 12px 0; font-weight: 600;">
				📍 Login Details / Anmelde-Details:
			</p>
			<ul style="color: #475569; font-size: 14px; margin: 0; padding-left: 20px; line-height: 1.8;">
				<li><strong>Zeit / Time:</strong> {TIME}</li>
				<li><strong>Browser:</strong> {BROWSER}</li>
				<li><strong>Gerät / Device:</strong> {DEVICE}</li>
				<li><strong>Standort / Location:</strong> {LOCATION}</li>
				<li><strong>IP-Adresse / IP Address:</strong> {IP}</li>
			</ul>
		</div>

		<!-- Action Box - Were you? -->
		<div
			style="background: #dcfce7; border: 1px solid #86efac; border-radius: 12px; padding: 16px; margin: 24px 0;"
		>
			<p style="color: #14532d; font-size: 14px; margin: 0 0 12px 0; font-weight: 600;">
				✅ <strong>🇩🇪</strong> Warst du das? / <strong>🇬🇧</strong> Was this you?
			</p>
			<p style="color: #166534; font-size: 13px; margin: 0;">
				<strong>🇩🇪</strong> Wenn ja, kannst du diese E-Mail ignorieren. Dein Account ist sicher.<br />
				<strong>🇬🇧</strong> If yes, you can ignore this email. Your account is safe.
			</p>
		</div>

		<!-- Warning Box - Not you? -->
		<div
			style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 12px; padding: 16px; margin: 24px 0;"
		>
			<p style="color: #991b1b; font-size: 14px; margin: 0 0 12px 0; font-weight: 600;">
				⚠️ <strong>🇩🇪</strong> Warst du das NICHT? / <strong>🇬🇧</strong> Was this NOT you?
			</p>
			<p style="color: #7f1d1d; font-size: 13px; margin: 0 0 16px 0;">
				<strong>🇩🇪</strong> Ändere sofort dein Passwort, um deinen Account zu sichern:<br />
				<strong>🇬🇧</strong> Change your password immediately to secure your account:
			</p>
			<div style="text-align: center;">
				<a
					href="{APP_URL}/forgot-password"
					style="display: inline-block; background: #dc2626; 
                  color: white; padding: 12px 24px; border-radius: 8px; 
                  text-decoration: none; font-weight: 600; font-size: 14px;"
				>
					🔐 Passwort ändern / Change Password
				</a>
			</div>
		</div>
	</div>

	<!-- Footer -->
	<div style="text-align: center; margin-top: 32px; padding: 20px;">
		<p style="color: #94a3b8; font-size: 12px; margin: 8px 0;">
			<strong>🇩🇪</strong> Diese Sicherheitsbenachrichtigung wurde an
			<strong>{EMAIL}</strong> gesendet.<br />
			<strong>🇬🇧</strong> This security notification was sent to <strong>{EMAIL}</strong>.
		</p>

		<div style="margin-top: 24px; padding-top: 24px; border-top: 1px solid #e2e8f0;">
			<p style="color: #cbd5e1; font-size: 11px; margin: 0;">
				© 2025 ulo.ad · Deine Sicherheit ist uns wichtig / Your security is important to us ·
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
| `{APP_NAME}`  | Name der App (ulo.ad)              |
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
  - Alt: `{APP_URL}/_/#/auth/confirm-verification/{TOKEN}`
  - Neu: `{APP_URL}/verify-email?token={TOKEN}`

### Test-Empfehlungen:

1. **Nach dem Einrichten**: Sende Test-Mails an dich selbst
2. **Verschiedene E-Mail-Clients**: Teste in Gmail, Outlook, Apple Mail
3. **Mobile Ansicht**: Prüfe die Darstellung auf Smartphones
4. **Spam-Check**: Stelle sicher, dass E-Mails nicht im Spam landen

### Design-Konsistenz:

- **Farben**: Verwende die ulo.ad-Farben (#0ea5e9 für Primary)
- **Schriften**: System-Fonts für beste Kompatibilität
- **Logo**: Emoji 🔗 als einfaches Branding-Element
- **Responsive**: Alle Templates sind mobile-optimiert
- **Zweisprachig**: Alle E-Mails enthalten deutsche und englische Texte

---

_Erstellt: 15. Januar 2025_  
_Für: ulo.ad E-Mail-System (Zweisprachig)_  
_Version: 2.0_
