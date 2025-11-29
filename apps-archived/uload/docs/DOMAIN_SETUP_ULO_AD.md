# Domain Setup: ulo.ad

## Übersicht

Diese Anleitung beschreibt die Verbindung der Domain **ulo.ad** mit der auf Hetzner/Coolify gehosteten Anwendung.

**Aktuelle Situation:**

- App läuft auf: `http://w848k4ksk88o8w84kcosw488.91.99.221.179.sslip.io`
- Server IP: `91.99.221.179`
- Ziel Domain: `ulo.ad`

---

## Schritt 1: DNS Konfiguration

### Bei deinem DNS Provider (Namecheap, Cloudflare, etc.)

Erstelle folgende DNS Records:

#### Hauptdomain (ulo.ad):

```
Type:   A
Name:   @
Value:  91.99.221.179
TTL:    3600 (oder Auto)
Proxy:  Aus (falls Cloudflare)
```

#### WWW Subdomain (www.ulo.ad):

```
Type:   CNAME
Name:   www
Value:  ulo.ad
TTL:    3600
```

#### Optional - App Subdomain (app.ulo.ad):

```
Type:   A
Name:   app
Value:  91.99.221.179
TTL:    3600
```

### DNS Einstellungen für verschiedene Provider:

#### **Cloudflare:**

1. DNS → Records → Add Record
2. Proxy Status: DNS only (graue Wolke) für Anfang
3. Nach erfolgreichem Test: Proxy aktivieren (orange Wolke)

#### **Namecheap:**

1. Domain List → Manage → Advanced DNS
2. Add New Record → A Record
3. Host: @ | Value: 91.99.221.179

#### **Hetzner DNS:**

1. DNS Console → Zone hinzufügen
2. Record hinzufügen → Type A
3. Name: @ | Value: 91.99.221.179

---

## Schritt 2: Coolify Konfiguration

### 2.1 Domain hinzufügen

1. **Login in Coolify Dashboard**

   ```
   http://91.99.221.179:8000
   ```

2. **Navigiere zu deiner Application**
   - Projects → Dein Projekt → Application

3. **Domains Tab öffnen**
   - Klicke auf "Domains"

4. **Domain hinzufügen**
   - Klicke "Add Domain"
   - Eingabe: `ulo.ad`
   - Für www auch: `www.ulo.ad`

5. **SSL Konfiguration**
   - ✅ **Generate SSL Certificate** (wichtig!)
   - ✅ **Force HTTPS Redirect**
   - ✅ **Auto redirect www to non-www** (oder umgekehrt)

### 2.2 Environment Variables anpassen

**KRITISCH: Diese müssen angepasst werden!**

1. **Gehe zu "Environment Variables"**

2. **Update folgende Variablen:**

   ```bash
   # Alte Werte (LÖSCHEN/UPDATEN):
   ORIGIN=http://w848k4ksk88o8w84kcosw488.91.99.221.179.sslip.io
   PUBLIC_POCKETBASE_URL=http://localhost:8090

   # NEUE WERTE:
   ORIGIN=https://ulo.ad
   PUBLIC_POCKETBASE_URL=https://ulo.ad/api

   # Admin Credentials (bleiben gleich):
   POCKETBASE_ADMIN_EMAIL=till.schneider@memoro.ai
   POCKETBASE_ADMIN_PASSWORD=p0ck3tRA1N
   ```

3. **Speichern und Deploy**
   - Save Changes
   - Klicke "Redeploy" oder "Restart"

---

## Schritt 3: Proxy Konfiguration (in Coolify)

Falls noch nicht vorhanden, füge diese Proxy Rules hinzu:

1. **Gehe zu "Proxy" Tab**

2. **Custom Nginx Configuration:**

   ```nginx
   # PocketBase API Routing
   location /api {
       rewrite ^/api/(.*) /$1 break;
       proxy_pass http://localhost:8090;
       proxy_http_version 1.1;
       proxy_set_header Upgrade $http_upgrade;
       proxy_set_header Connection 'upgrade';
       proxy_set_header Host $host;
       proxy_cache_bypass $http_upgrade;
       proxy_set_header X-Real-IP $remote_addr;
       proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
       proxy_set_header X-Forwarded-Proto $scheme;
   }

   # PocketBase Admin UI
   location /_/ {
       proxy_pass http://localhost:8090;
       proxy_http_version 1.1;
       proxy_set_header Upgrade $http_upgrade;
       proxy_set_header Connection 'upgrade';
       proxy_set_header Host $host;
   }

   # WebSocket Support
   location /api/realtime {
       proxy_pass http://localhost:8090;
       proxy_http_version 1.1;
       proxy_set_header Upgrade $http_upgrade;
       proxy_set_header Connection "upgrade";
       proxy_set_header Host $host;
   }
   ```

---

## Schritt 4: Deployment durchführen

1. **In Coolify:**
   - Klicke "Deploy" oder "Redeploy"
   - Warte bis Status "Running"

2. **Deployment verifizieren:**
   - Container Logs prüfen
   - Keine Errors sollten erscheinen

---

## Schritt 5: DNS Propagation & Testing

### Warten auf DNS Propagation

- **Dauer:** 5 Minuten bis 48 Stunden (meist < 1 Stunde)
- **Tipp:** .ad Domains können etwas länger dauern

### DNS Status prüfen:

```bash
# Terminal/Command Line:
nslookup ulo.ad
# Sollte zeigen: 91.99.221.179

# Oder online:
# https://www.whatsmydns.net/#A/ulo.ad
```

### SSL Zertifikat prüfen:

```bash
# Nach DNS Propagation (wichtig!):
curl -I https://ulo.ad
# Sollte HTTP/2 200 zeigen
```

---

## Schritt 6: Testen

### URLs die funktionieren sollten:

1. **Hauptseite:**

   ```
   https://ulo.ad
   ```

2. **Health Check:**

   ```
   https://ulo.ad/health
   ```

3. **PocketBase Admin:**

   ```
   https://ulo.ad/_/
   ```

   Login: till.schneider@memoro.ai

4. **API Endpoint:**
   ```
   https://ulo.ad/api/health
   ```

---

## Troubleshooting

### Problem: "DNS_PROBE_FINISHED_NXDOMAIN"

**Ursache:** DNS noch nicht propagiert
**Lösung:**

- Warte 30-60 Minuten
- Prüfe DNS Records beim Provider
- Cache leeren: `ipconfig /flushdns` (Windows) oder `dscacheutil -flushcache` (Mac)

### Problem: "SSL_ERROR" oder "Your connection is not private"

**Ursache:** SSL Zertifikat noch nicht generiert
**Lösung:**

1. Warte bis DNS vollständig propagiert
2. In Coolify: "Force Renew Certificate"
3. Container neu starten

### Problem: "502 Bad Gateway"

**Ursache:** App nicht gestartet oder ENV Variables falsch
**Lösung:**

1. Environment Variables prüfen (besonders ORIGIN)
2. Container Logs in Coolify prüfen
3. Container neu starten

### Problem: "404 Not Found"

**Ursache:** Routing Problem oder App nicht gestartet
**Lösung:**

1. Proxy Configuration prüfen
2. Health Check testen: `https://ulo.ad/health`
3. Container Logs prüfen

### Problem: PocketBase Admin nicht erreichbar

**Ursache:** Proxy Rules fehlen
**Lösung:**

1. Nginx Proxy Config prüfen (siehe oben)
2. Direct URL testen: `http://91.99.221.179:8090/_/`

---

## Zeitplan

1. **DNS Setup:** 5 Minuten
2. **Coolify Config:** 10 Minuten
3. **DNS Propagation:** 5-60 Minuten
4. **SSL Generation:** 2-5 Minuten (nach DNS)
5. **Testing:** 5 Minuten

**Total:** ~30-90 Minuten (abhängig von DNS)

---

## Finale URLs

Nach erfolgreichem Setup:

| Service      | URL                   | Beschreibung           |
| ------------ | --------------------- | ---------------------- |
| Hauptseite   | https://ulo.ad        | SvelteKit Frontend     |
| WWW          | https://www.ulo.ad    | Redirect zu Hauptseite |
| Admin Panel  | https://ulo.ad/_/     | PocketBase Admin       |
| API          | https://ulo.ad/api    | PocketBase API         |
| Health Check | https://ulo.ad/health | System Status          |

---

## Sicherheits-Checkliste

- [ ] SSL Zertifikat aktiv (HTTPS)
- [ ] Force HTTPS Redirect aktiviert
- [ ] Environment Variables gesetzt
- [ ] PocketBase Admin Passwort geändert
- [ ] Firewall Rules aktiv
- [ ] Backup Strategy implementiert

---

## Nächste Schritte nach Domain Setup

1. **Cloudflare Integration (optional):**
   - Proxy aktivieren für DDoS Schutz
   - Caching Rules einrichten
   - Web Application Firewall

2. **Monitoring einrichten:**
   - Uptime Monitoring (z.B. UptimeRobot)
   - SSL Expiry Monitoring
   - Performance Monitoring

3. **Backups konfigurieren:**
   - Automated Backups in Coolify
   - External Backup zu S3/B2

4. **Short Links testen:**
   - Erstelle Test-Links
   - QR Codes generieren
   - Analytics prüfen

---

## Support Kontakte

**Domain Issues:** DNS Provider Support
**Server/Coolify:** Hetzner Support / Coolify Discord
**Application:** Internal Team

**Wichtige IPs/URLs:**

- Server IP: `91.99.221.179`
- Coolify Dashboard: `http://91.99.221.179:8000`
- Temp URL: `http://w848k4ksk88o8w84kcosw488.91.99.221.179.sslip.io`

---

_Dokumentation erstellt für ulo.ad Domain Setup - August 2024_
