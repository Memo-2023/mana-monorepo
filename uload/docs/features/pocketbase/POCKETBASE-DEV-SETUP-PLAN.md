# PocketBase Development Setup - Implementierungsplan

## 🎯 Ziel
Vollständige Trennung von Development und Production Datenbanken, ähnlich wie bei Redis.

## 📋 Aktuelle Situation

### Probleme:
- ❌ Beide Umgebungen nutzen Production DB (`https://pb.ulo.ad`)
- ❌ Gefahr von Testdaten in Production
- ❌ Keine lokale Entwicklungsumgebung
- ❌ Hardcoded Production URLs im Code
- ❌ Inkonsistente Environment-Variable-Nutzung

### Vorhandene Ressourcen:
- ✅ PocketBase Binary bereits in `backend/` vorhanden
- ✅ `npm run backend` Script existiert
- ✅ Lokale DB-Dateien in `backend/pb_data/`
- ✅ Schema-Migrations in `backend/pb_migrations/`

## 🛠 Implementierungsplan

### Phase 1: Lokale PocketBase einrichten (15 Min)

1. **PocketBase starten**
   ```bash
   cd backend
   ./pocketbase serve
   ```
   - Läuft auf http://localhost:8090
   - Admin UI: http://localhost:8090/_/

2. **Admin Account erstellen**
   - Beim ersten Start wird Admin-Account angelegt
   - Credentials sicher speichern

3. **Schema von Production kopieren**
   ```bash
   # Export von Production (manuell über Admin UI)
   # Import in lokale Instanz
   ```

### Phase 2: Environment Variables korrigieren (10 Min)

1. **.env.development anpassen**
   ```env
   # PocketBase Configuration (Local Development)
   PUBLIC_POCKETBASE_URL=http://localhost:8090
   POCKETBASE_URL=http://localhost:8090
   
   # PocketBase Admin (for local development)
   POCKETBASE_ADMIN_EMAIL=admin@localhost
   POCKETBASE_ADMIN_PASSWORD=localdevpassword123
   ```

2. **.env.production erstellen**
   ```env
   # PocketBase Configuration (Production)
   PUBLIC_POCKETBASE_URL=https://pb.ulo.ad
   POCKETBASE_URL=https://pb.ulo.ad
   ```

### Phase 3: Code-Anpassungen (20 Min)

1. **src/lib/pocketbase.ts**
   ```typescript
   import { dev } from '$app/environment';
   
   // Automatic environment detection
   const POCKETBASE_URL = import.meta.env.PUBLIC_POCKETBASE_URL || 
                         (dev ? 'http://localhost:8090' : 'https://pb.ulo.ad');
   ```

2. **Hardcoded URLs entfernen**
   - `src/routes/p/[username]/+page.server.ts:16`
   - `src/lib/scripts/update-links-collection.js:6`
   - `src/routes/api/verify/+server.ts:15`

3. **CSP Headers anpassen**
   - `src/hooks.server.ts` - Dynamische CSP basierend auf Environment

### Phase 4: Daten-Migration (30 Min)

1. **Test-Daten erstellen**
   ```bash
   # Script für Sample-Daten
   npm run seed:dev
   ```

2. **Production Snapshot (optional)**
   - Export wichtiger Test-Links
   - Anonymisierte User-Daten
   - Keine echten Produktionsdaten!

3. **Migrations synchronisieren**
   ```bash
   # Alle Migrations lokal ausführen
   cd backend
   ./pocketbase migrate up
   ```

### Phase 5: Development Workflow (10 Min)

1. **Start-Scripts optimieren**
   ```json
   {
     "scripts": {
       "dev": "npm run dev:frontend",
       "dev:frontend": "vite dev",
       "dev:backend": "cd backend && ./pocketbase serve",
       "dev:all": "concurrently \"npm:dev:backend\" \"npm:dev:frontend\"",
       "dev:setup": "npm run dev:backend:setup && npm run dev:seed"
     }
   }
   ```

2. **Docker Alternative (optional)**
   ```yaml
   # docker-compose.dev.yml
   services:
     pocketbase:
       image: ghcr.io/pocketbase/pocketbase:latest
       ports:
         - "8090:8090"
       volumes:
         - ./backend/pb_data:/pb_data
   ```

### Phase 6: Testing & Validation (15 Min)

1. **Connection Tests**
   - Verify localhost:8090 responds
   - Check Admin UI access
   - Test API endpoints

2. **Feature Tests**
   - Create link
   - Register user
   - Authentication flow
   - Stripe webhooks (mit lokaler URL)

3. **Data Isolation**
   - Verify no production data access
   - Check environment variables
   - Test fallback mechanisms

## 🚀 Quick Start (Nach Implementierung)

```bash
# 1. Backend starten
npm run dev:backend

# 2. In neuem Terminal: Frontend starten  
npm run dev:frontend

# Oder alles zusammen:
npm run dev:all
```

## ⚠️ Wichtige Überlegungen

### Daten-Synchronisation
- **NICHT** Production-Daten lokal spiegeln
- Nur Schema/Structure synchronisieren
- Test-Daten separat verwalten

### Secrets Management
- Lokale Admin-Credentials nur für Dev
- Keine Production-Secrets in .env.development
- Stripe Test-Keys für lokale Entwicklung

### Backup Strategy
- Lokale DB regelmäßig committen? (ohne sensible Daten)
- Schema-Änderungen als Migrations tracken
- Production Backups separat

## 📊 Vergleich: Vorher vs Nachher

| Aspekt | Vorher | Nachher |
|--------|---------|---------|
| Dev Database | Production (pb.ulo.ad) | Lokal (localhost:8090) |
| Test-Daten | In Production! | Isoliert lokal |
| Performance | Netzwerk-Latenz | Instant (lokal) |
| Sicherheit | Risiko für Prod-Daten | Vollständig getrennt |
| Offline-Arbeit | Nicht möglich | Voll funktionsfähig |

## 🔄 Migration Checkliste

- [ ] Lokale PocketBase starten
- [ ] Admin Account erstellen
- [ ] Schema importieren
- [ ] Environment Variables anpassen
- [ ] Code von hardcoded URLs befreien
- [ ] Test-Daten erstellen
- [ ] Alle Features lokal testen
- [ ] Team-Dokumentation aktualisieren
- [ ] CI/CD Pipeline anpassen

## 🎉 Vorteile nach Implementierung

1. **Sicherer** - Keine Produktionsdaten-Gefährdung
2. **Schneller** - Lokale DB ohne Netzwerk-Latenz
3. **Flexibler** - Experimente ohne Konsequenzen
4. **Offline-fähig** - Arbeiten ohne Internet
5. **Team-freundlich** - Jeder hat eigene DB

## 📚 Nächste Schritte

1. Entscheidung treffen: Sofort umsetzen oder planen?
2. Team informieren über Änderungen
3. Migration durchführen
4. Dokumentation für Team erstellen
5. CI/CD anpassen für neue Struktur