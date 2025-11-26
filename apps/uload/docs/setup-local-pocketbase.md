# Lokale PocketBase Setup - Anleitung

## 🚀 PocketBase läuft bereits!

PocketBase ist bereits gestartet auf: http://localhost:8090

## 📝 Nächste Schritte:

### 1. Admin Account erstellen

Öffne im Browser: http://localhost:8090/_/

- Beim ersten Besuch wirst du aufgefordert einen Admin-Account zu erstellen
- Verwende sichere Credentials (nur für lokale Entwicklung)

### 2. Schema importieren

Nach dem Login als Admin:

1. Gehe zu "Settings" → "Import/Export"
2. Wähle "Load from JSON file"
3. Lade die Datei: `backend/pb_schema.json`
4. Klicke "Review" und dann "Confirm"

### 3. Test-Daten erstellen

Erstelle ein paar Test-Einträge:

**Test User:**
- Email: test@localhost
- Password: test123456

**Test Links:**
- Kurz-Code: test1
- Original URL: https://example.com
- Aktiv: Ja

### 4. App mit lokaler DB testen

```bash
# Terminal 1: PocketBase läuft bereits
# Terminal 2: Frontend starten
npm run dev
```

Die App sollte jetzt http://localhost:8090 als Backend nutzen!

## ✅ Verification

1. Öffne http://localhost:5173
2. Check Console für: "🔧 PocketBase URL: http://localhost:8090"
3. Registriere einen Test-User
4. Erstelle einen Test-Link

## 🎉 Fertig!

Deine lokale Entwicklungsumgebung ist jetzt vollständig von Production getrennt!