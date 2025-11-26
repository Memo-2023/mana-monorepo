# 🔐 Security Best Practices für uLoad Deployment

## Aktuelle Risiken

### 1. **Öffentliches Admin Panel** 🚨

- **Problem**: PocketBase Admin unter `/api/_/` ist für jeden erreichbar
- **Risiko**: Brute-Force, unauthorisierter Zugriff
- **Lösung**: Zugriff beschränken (siehe unten)

### 2. **Keine Rate Limiting** ⚠️

- **Problem**: API kann überlastet werden
- **Risiko**: DDoS, Ressourcen-Erschöpfung
- **Lösung**: Nginx rate limiting implementieren

## Empfohlene Architektur

### Option 1: **SSH Tunnel für Admin** (SICHERSTE) ✅

```bash
# Admin Panel NUR über SSH erreichbar machen
# Keine öffentliche Route für /_/ einrichten!

# Zugriff über SSH Tunnel:
ssh -L 8090:localhost:8090 user@ulo.ad
# Dann lokal: http://localhost:8090/_/
```

**Vorteile:**

- Admin Panel nie öffentlich
- Maximale Sicherheit
- Keine Angriffsfläche

### Option 2: **VPN/Wireguard** 🔒

```yaml
# Nur im privaten Netzwerk erreichbar
# Admin Panel hinter VPN
# Öffentliche API für App
```

### Option 3: **Basic Auth + IP-Whitelist** 🛡️

```nginx
location /api/_/ {
    # Nur deine IP
    allow 91.99.221.179;
    deny all;

    # Plus Basic Auth
    auth_basic "Admin";
    auth_basic_user_file /etc/nginx/.htpasswd;

    proxy_pass http://127.0.0.1:8090/_/;
}
```

## Empfohlene Konfiguration

### Für Produktion:

```javascript
// 1. Separate URLs für Frontend und Admin
const config = {
	// App nutzt API
	app: 'https://ulo.ad',
	api: 'https://ulo.ad/api/collections/',

	// Admin NUR über SSH oder separaten Port
	admin: 'Nicht öffentlich!'
};
```

### 2. Environment Variables

```env
# .env.production
PUBLIC_POCKETBASE_URL=https://ulo.ad/api
POCKETBASE_ADMIN_URL=http://localhost:8090  # Nur intern!
```

### 3. Firewall Rules (in Coolify/Hetzner)

```bash
# Nur benötigte Ports öffnen
ufw allow 80/tcp   # HTTP (redirect zu HTTPS)
ufw allow 443/tcp  # HTTPS
ufw allow 22/tcp   # SSH

# PocketBase Port NICHT öffnen!
# ufw allow 8090  # NEIN!
```

## Monitoring & Alerts

### 1. Fail2Ban einrichten

```bash
# Für wiederholte fehlgeschlagene Logins
apt install fail2ban
```

### 2. Logs überwachen

```bash
# In Coolify Alerts einrichten für:
- Fehlgeschlagene Admin-Logins
- Ungewöhnlich viele API-Anfragen
- 404 auf /_/ Route
```

## Beste Praxis für dein Setup

### 🎯 **EMPFEHLUNG:**

1. **KEIN öffentliches Admin Panel**
2. **API nur für benötigte Endpoints**
3. **Admin-Zugriff nur über SSH**

### Sichere nginx.conf:

```nginx
# NUR diese Routes öffentlich:
location /api/collections/ { ... }  # App-Funktionalität
location /api/health { ... }         # Health Check

# Admin NICHT öffentlich
# Zugriff nur über SSH Tunnel
```

### Admin-Zugriff:

```bash
# Wenn du ins Admin Panel musst:
ssh user@ulo.ad
cd /app
./pocketbase admin

# Oder SSH Tunnel:
ssh -L 8090:localhost:8090 user@ulo.ad
# Browser: http://localhost:8090/_/
```

## Zusammenfassung

**Aktuelles Setup ist NICHT sicher**, weil:

- Admin Panel öffentlich
- Keine Zugriffsbeschränkung
- Keine Rate Limits

**Bessere Lösung:**

- Admin nur über SSH
- API mit Rate Limiting
- Monitoring aktivieren

Möchtest du die sichere Variante implementieren?
