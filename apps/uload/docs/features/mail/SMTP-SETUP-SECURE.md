# SICHERE SMTP Konfiguration

## ⚠️ NIEMALS Credentials teilen!

### 1. Erstelle einen neuen SMTP Key in Brevo:

1. Login bei Brevo
2. SMTP & API → SMTP Settings
3. Lösche den kompromittierten Key
4. "Generate new SMTP key"
5. Kopiere den neuen Key (startet mit `xsmtpsib-`)

### 2. Konfiguriere PocketBase SICHER:

**Option A: Direkt in PocketBase UI** (für lokale Entwicklung OK)

- Gehe zu PocketBase Admin → Settings → Mail settings
- Trage ein:
  ```
  Host: smtp-relay.brevo.com
  Port: 587
  Username: till.schneider@memoro.ai
  Password: [NEUER SMTP KEY - NICHT TEILEN!]
  TLS: ✓ aktiviert
  ```

**Option B: Environment Variables** (für Production)
Erstelle eine `.env.local` Datei (NICHT committen!):

```bash
# .env.local (zu .gitignore hinzufügen!)
PB_SMTP_HOST=smtp-relay.brevo.com
PB_SMTP_PORT=587
PB_SMTP_USER=till.schneider@memoro.ai
PB_SMTP_PASSWORD=xsmtpsib-[DEIN-NEUER-KEY-HIER]
PB_SMTP_TLS=true
```

### 3. Füge .env.local zu .gitignore hinzu:

```gitignore
# Secrets
.env.local
.env.production
*.key
*.pem
```

### 4. Für Team-Mitglieder:

Nutze einen Password Manager oder sichere Kommunikation:

- 1Password
- Bitwarden
- Signal/verschlüsselte Nachricht

## WICHTIGE REGELN:

1. **NIEMALS** Passwörter/Keys in:
   - GitHub Issues
   - Commits
   - Öffentlichen Chats
   - Unverschlüsselten E-Mails

2. **IMMER** nutzen:
   - Environment Variables
   - .env.local Files (nicht committed)
   - Secret Management Tools

3. **Bei Leak** (wie gerade):
   - Sofort Key invalidieren
   - Neuen Key erstellen
   - Alle Systeme updaten

## Test-Kommando (OHNE echte Credentials):

```bash
# Teste ob SMTP funktioniert (mit env vars)
curl -X POST http://localhost:8090/api/test-email \
  -H "Content-Type: application/json" \
  -d '{"to": "test@example.com"}'
```

---

**ERINNERUNG**: Der alte Key ist jetzt kompromittiert und muss gelöscht werden!
