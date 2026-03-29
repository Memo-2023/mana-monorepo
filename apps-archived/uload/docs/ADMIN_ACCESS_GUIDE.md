# 🔑 Admin Panel Zugang - Schnellanleitung

## Der EINFACHSTE Weg:

### 1️⃣ **Coolify Terminal nutzen**

1. Login in Coolify: https://coolify.ulo.ad (oder deine Coolify-URL)
2. Navigiere zu: **Applications → uLoad → Terminal**
3. Führe aus:

```bash
# Admin-Account erstellen
./pocketbase superuser create

# Eingabe:
# Email: admin@ulo.ad
# Password: [sicheres Passwort]
```

### 2️⃣ **SSH Tunnel einrichten** (von deinem Computer)

```bash
# Windows (PowerShell/Terminal):
ssh -L 8090:localhost:8090 root@91.99.221.179

# Mac/Linux:
ssh -L 8090:localhost:8090 root@91.99.221.179

# Passwort eingeben (dein Server-Root-Passwort)
```

### 3️⃣ **Admin Panel öffnen**

Browser öffnen und navigieren zu:

```
http://localhost:8090/_/
```

Mit den Zugangsdaten aus Schritt 1 einloggen.

---

## Alternative: Temporärer Web-Zugang

**⚠️ NUR für initiale Einrichtung!**

1. In Coolify → Configuration → Advanced → Custom Nginx:

```nginx
location /temp-admin/ {
    allow 91.99.221.179;  # DEINE IP hier!
    deny all;

    rewrite ^/temp-admin/(.*)$ /$1 break;
    proxy_pass http://127.0.0.1:8090;
}
```

2. Speichern & Redeploy

3. Zugriff über: `https://ulo.ad/temp-admin/_/`

4. **WICHTIG**: Nach Setup wieder entfernen!

---

## Was du im Admin Panel tun solltest:

1. ✅ **Admin-Account sichern**
   - Starkes Passwort setzen
   - 2FA aktivieren (wenn verfügbar)

2. ✅ **Collections prüfen**
   - `users` → Username-Feld vorhanden?
   - `links` → use_username Feld vorhanden?
   - `folders` → Struktur korrekt?

3. ✅ **Test-User anlegen**
   - Username: till
   - Email: deine@email.de
   - Passwort setzen

4. ✅ **API Rules kontrollieren**
   - users: Öffentliche Profile erlaubt?
   - links: Richtige Berechtigungen?

---

## Troubleshooting:

**Problem: SSH Connection refused**

```bash
# Prüfe ob SSH auf dem Server läuft
ssh root@91.99.221.179 "echo SSH works"
```

**Problem: localhost:8090 zeigt nichts**

```bash
# Prüfe ob PocketBase läuft (im SSH):
curl http://localhost:8090/api/health
```

**Problem: Permission denied im Terminal**

```bash
# Als root ausführen:
sudo su
cd /app
./pocketbase superuser create
```

---

## Sicherheits-Checkliste:

- [ ] Admin-Account mit starkem Passwort
- [ ] SSH-Key statt Passwort für Server
- [ ] Keine öffentliche Admin-Route
- [ ] Regelmäßige Backups eingerichtet
- [ ] Monitoring aktiviert

Der SSH-Tunnel ist die sicherste Methode!
