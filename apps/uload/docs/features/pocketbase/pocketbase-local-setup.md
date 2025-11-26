# PocketBase Local Development Setup

## ✅ Was wurde implementiert

### 1. Environment Separation
- **Development**: `http://localhost:8090` (lokal)
- **Production**: `https://pb.ulo.ad` (Coolify)
- Automatische Umgebungserkennung basierend auf `dev` Flag

### 2. Code-Änderungen
- ✅ `.env.development` - Lokale PocketBase URL
- ✅ `.env.production` - Production PocketBase URL  
- ✅ `src/lib/pocketbase.ts` - Dynamische URL-Auswahl
- ✅ `src/routes/p/[username]/+page.server.ts` - Environment-basierte URL
- ✅ `src/lib/scripts/update-links-collection.js` - Flexible URL
- ✅ `src/routes/api/verify/+server.ts` - Dynamische Redirect URL
- ✅ `src/hooks.server.ts` - CSP Headers für beide Umgebungen

### 3. Sicherheit
- Keine hardcoded Production URLs mehr
- Vollständige Trennung von Dev/Prod Daten
- Lokale Entwicklung ohne Internetverbindung möglich

## 🚀 Quick Start

### 1. PocketBase starten

```bash
# Terminal 1: Backend
cd backend
./pocketbase serve

# Läuft auf http://localhost:8090
# Admin UI: http://localhost:8090/_/
```

### 2. Admin Account erstellen

1. Öffne http://localhost:8090/_/
2. Erstelle Admin Account (nur beim ersten Mal)
3. Merke dir die Credentials

### 3. Schema importieren

**Option A: Manuell über UI**
1. Login als Admin
2. Settings → Import/Export
3. Load from JSON → `backend/pb_schema.json`
4. Review → Confirm

**Option B: Automatisch (wenn Collections existieren)**
```bash
# Schema ist bereits in backend/pb_migrations/
cd backend
./pocketbase migrate up
```

### 4. Test-Daten erstellen

```bash
# Seed Script ausführen
node scripts/seed-local-db.js
```

Erstellt:
- 2 Test-User (test@localhost, demo@localhost)
- 4 Test-Links (normal, protected, expired, limited)
- Sample Click-Daten

### 5. App starten

```bash
# Terminal 2: Frontend
npm run dev

# Oder alles zusammen:
npm run dev:all
```

## 📝 Test-Credentials

### Users
```
Email: test@localhost
Password: test123456

Email: demo@localhost  
Password: demo123456
```

### Links
- `http://localhost:5173/test1` - Normaler Link
- `http://localhost:5173/test2` - Mit Click-Limit (100)
- `http://localhost:5173/protected` - Password: `secret123`
- `http://localhost:5173/expired` - Abgelaufener Link

### Admin
```
URL: http://localhost:8090/_/
Email: [deine Admin Email]
Password: [dein Admin Password]
```

## 🔍 Verification

### 1. Environment Check
```bash
# In Browser Console sollte stehen:
🔧 PocketBase URL: http://localhost:8090
🔧 Environment: development
🔧 Dev mode: true
```

### 2. API Health
```bash
curl http://localhost:5173/health
# sollte zeigen: "pocketbase": "running"
```

### 3. Feature Tests
- [ ] User Registration
- [ ] Login/Logout
- [ ] Link erstellen
- [ ] Link redirect
- [ ] Password-geschützte Links
- [ ] Click-Tracking

## 🛠 Troubleshooting

### PocketBase startet nicht

```bash
# Port bereits belegt?
lsof -i :8090

# Process beenden
kill -9 [PID]

# Neu starten
cd backend && ./pocketbase serve
```

### "Collection not found" Fehler

1. Schema importieren (siehe oben)
2. Oder Collections manuell erstellen:
   - users (auth)
   - links
   - clicks
   - accounts

### Environment Variables nicht geladen

```bash
# .env.development muss existieren
cat .env.development

# Sollte enthalten:
PUBLIC_POCKETBASE_URL=http://localhost:8090
```

### CORS Fehler

PocketBase erlaubt standardmäßig alle Origins in Development.
Falls Probleme: Admin UI → Settings → API Rules

## 📊 Development vs Production

| Aspekt | Development | Production |
|--------|------------|------------|
| PocketBase URL | http://localhost:8090 | https://pb.ulo.ad |
| Datenbank | Lokal (SQLite) | Cloud (Coolify) |
| Auth | Test-Accounts | Echte User |
| Stripe | Test-Keys | Live-Keys |
| Redis | localhost:6379 | Coolify Redis |
| SSL | Nein (HTTP) | Ja (HTTPS) |
| CSP | Relaxed | Strict |

## 🔄 Daten-Synchronisation

### Schema Updates von Production holen

```bash
# 1. Export aus Production (Admin UI)
# 2. Speichern als backend/pb_schema.json
# 3. Lokal importieren
```

### Migrations erstellen

```bash
cd backend
./pocketbase migrate create "add_new_field"
# Edit migration file
./pocketbase migrate up
```

## 🎯 Best Practices

1. **Niemals Production-Daten lokal speichern**
2. **Separate Test-Accounts verwenden**
3. **Schema-Änderungen als Migrations tracken**
4. **Regelmäßig lokale DB zurücksetzen**

```bash
# Lokale DB reset
rm backend/pb_data/*.db
cd backend && ./pocketbase serve
# Schema neu importieren
```

## 🚢 Deployment

Beim Deployment nach Production:
1. Environment wird automatisch erkannt
2. Production URLs werden verwendet
3. Keine Code-Änderungen nötig!

```bash
# Build für Production
npm run build

# Preview Production Build lokal
npm run preview
# Nutzt automatisch Production-Config!
```

## 📚 Weitere Ressourcen

- [PocketBase Docs](https://pocketbase.io/docs/)
- [Admin UI Guide](https://pocketbase.io/docs/admin-ui/)
- [API Rules](https://pocketbase.io/docs/api-rules-and-filters/)
- [Migrations](https://pocketbase.io/docs/migrations/)