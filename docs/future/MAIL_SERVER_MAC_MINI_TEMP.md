# Mail-Server auf Mac Mini (Temporäre Lösung)

> **Status:** Bereit zur Umsetzung
> **Priorität:** Hoch
> **Dauer:** ~2 Stunden

## Übersicht

Temporäre Mail-Server-Installation auf dem Mac Mini bis ein dediziertes Gerät verfügbar ist.

### Vorteile
- Sofort nutzbar
- Keine zusätzliche Hardware nötig
- Eigene Email-Adressen (@manacore.ai)

### Nachteile
- Alle Dienste auf einem Gerät (Single Point of Failure)
- Mehr Last auf Mac Mini
- Bei Wartung sind Apps UND Email offline

## Voraussetzungen

### Aktuelle Mac Mini Auslastung

| Ressource | Aktuell | Nach Mail-Server | Verfügbar |
|-----------|---------|------------------|-----------|
| RAM | ~400 MB | ~2.5 GB | 16 GB ✅ |
| CPU | ~10% | ~15% | 10 Cores ✅ |
| Disk | 11 GB | ~15 GB | 228 GB ✅ |

→ **Genug Ressourcen vorhanden!**

### Netzwerk-Voraussetzungen

- [ ] Statische öffentliche IP oder DynDNS
- [ ] Zugang zum Router für Port-Forwarding
- [ ] Ports 25, 465, 587, 993 nicht vom ISP blockiert

### Port-Check

```bash
# Prüfen ob Port 25 erreichbar ist (von extern)
# Auf einem anderen Rechner/Server:
telnet <deine-öffentliche-ip> 25

# Oder online: https://www.yougetsignal.com/tools/open-ports/
```

**Wichtig:** Viele ISPs blockieren Port 25 ausgehend. Das betrifft aber nur das Senden AN andere Server, nicht das Empfangen.

## Installations-Plan

### Phase 1: Vorbereitung (15 min)

#### 1.1 DNS-Records anlegen

Bei Cloudflare für `manacore.ai`:

```
# A-Record für Mail-Server (OHNE Proxy!)
Type: A
Name: mail
Content: <Mac-Mini-Public-IP>
Proxy: DNS only (grey cloud)

# MX-Record
Type: MX
Name: @
Content: mail.manacore.ai
Priority: 10

# SPF-Record
Type: TXT
Name: @
Content: v=spf1 mx a:mail.manacore.ai ~all

# DMARC-Record
Type: TXT
Name: _dmarc
Content: v=DMARC1; p=none; rua=mailto:till@manacore.ai
```

#### 1.2 Router Port-Forwarding

Im Router konfigurieren:

| Externer Port | Interner Port | Ziel | Protokoll |
|---------------|---------------|------|-----------|
| 25 | 25 | Mac-Mini-IP | TCP |
| 465 | 465 | Mac-Mini-IP | TCP |
| 587 | 587 | Mac-Mini-IP | TCP |
| 993 | 993 | Mac-Mini-IP | TCP |

#### 1.3 Cloudflare Tunnel erweitern

Alternativ zu Port-Forwarding: Cloudflare Tunnel für Webmail (Port 443 ist bereits getunnelt).

SMTP-Ports (25, 465, 587, 993) können NICHT über Cloudflare Tunnel laufen → Port-Forwarding nötig.

### Phase 2: Mailcow Installation (45 min)

#### 2.1 Docker Compose erweitern

Neue Datei `docker-compose.mail.yml`:

```yaml
# Mail-Server Stack für Mac Mini
# Basiert auf Mailcow-Dockerized (vereinfacht)

version: '3.8'

services:
  # ===========================================
  # Database
  # ===========================================
  mysql-mailcow:
    image: mariadb:10.11
    container_name: mailcow-mysql
    restart: unless-stopped
    volumes:
      - mysql-vol:/var/lib/mysql
    environment:
      MYSQL_ROOT_PASSWORD: ${DBROOT}
      MYSQL_DATABASE: mailcow
      MYSQL_USER: mailcow
      MYSQL_PASSWORD: ${DBPASS}
    networks:
      - mailcow-network

  # ===========================================
  # Redis
  # ===========================================
  redis-mailcow:
    image: redis:7-alpine
    container_name: mailcow-redis
    restart: unless-stopped
    volumes:
      - redis-vol:/data
    networks:
      - mailcow-network

  # ===========================================
  # Postfix (SMTP)
  # ===========================================
  postfix-mailcow:
    image: mailcow/postfix:latest
    container_name: mailcow-postfix
    restart: unless-stopped
    depends_on:
      - mysql-mailcow
    ports:
      - "25:25"
      - "465:465"
      - "587:587"
    volumes:
      - postfix-vol:/var/spool/postfix
      - crypt-vol:/var/lib/zeyple
      - rspamd-vol:/var/lib/rspamd
    environment:
      - DBNAME=mailcow
      - DBUSER=mailcow
      - DBPASS=${DBPASS}
    networks:
      - mailcow-network

  # ===========================================
  # Dovecot (IMAP)
  # ===========================================
  dovecot-mailcow:
    image: mailcow/dovecot:latest
    container_name: mailcow-dovecot
    restart: unless-stopped
    depends_on:
      - mysql-mailcow
    ports:
      - "993:993"
      - "995:995"
    volumes:
      - vmail-vol:/var/vmail
      - crypt-vol:/mail_crypt
    environment:
      - DBNAME=mailcow
      - DBUSER=mailcow
      - DBPASS=${DBPASS}
    networks:
      - mailcow-network

  # ===========================================
  # Rspamd (Spam Filter)
  # ===========================================
  rspamd-mailcow:
    image: mailcow/rspamd:latest
    container_name: mailcow-rspamd
    restart: unless-stopped
    volumes:
      - rspamd-vol:/var/lib/rspamd
    networks:
      - mailcow-network

  # ===========================================
  # SOGo (Webmail)
  # ===========================================
  sogo-mailcow:
    image: mailcow/sogo:latest
    container_name: mailcow-sogo
    restart: unless-stopped
    depends_on:
      - mysql-mailcow
    environment:
      - DBNAME=mailcow
      - DBUSER=mailcow
      - DBPASS=${DBPASS}
    networks:
      - mailcow-network

  # ===========================================
  # Nginx (Webmail Frontend)
  # ===========================================
  nginx-mailcow:
    image: nginx:alpine
    container_name: mailcow-nginx
    restart: unless-stopped
    ports:
      - "8443:443"
    depends_on:
      - sogo-mailcow
    networks:
      - mailcow-network

networks:
  mailcow-network:
    driver: bridge

volumes:
  mysql-vol:
  redis-vol:
  postfix-vol:
  vmail-vol:
  crypt-vol:
  rspamd-vol:
```

#### 2.2 Einfachere Alternative: Vollständiges Mailcow

```bash
# Auf Mac Mini
ssh mana-server

# Mailcow in separatem Verzeichnis
cd ~
git clone https://github.com/mailcow/mailcow-dockerized
cd mailcow-dockerized

# Konfiguration generieren
./generate_config.sh
# Hostname: mail.manacore.ai
# Timezone: Europe/Berlin

# Ports anpassen (falls Konflikte)
# In mailcow.conf:
# HTTP_PORT=8080
# HTTPS_PORT=8443

# Starten
docker compose pull
docker compose up -d
```

### Phase 3: Konfiguration (30 min)

#### 3.1 Admin-Zugang

```
URL: https://mail.manacore.ai:8443 (oder via Tunnel)
User: admin
Password: moohoo (SOFORT ÄNDERN!)
```

#### 3.2 Domain hinzufügen

1. Configuration → Mail Setup → Domains
2. Add domain: `manacore.ai`
3. DKIM-Key kopieren → in Cloudflare DNS eintragen

#### 3.3 Postfächer erstellen

| Adresse | Quota | Verwendung |
|---------|-------|------------|
| till@manacore.ai | 5 GB | Haupt-Postfach |
| alerts@manacore.ai | 1 GB | Server-Alerts |
| noreply@manacore.ai | 500 MB | Automatische Emails |

#### 3.4 Aliases erstellen

| Alias | Ziel |
|-------|------|
| support@manacore.ai | till@manacore.ai |
| info@manacore.ai | till@manacore.ai |
| admin@manacore.ai | till@manacore.ai |

### Phase 4: Cloudflare Tunnel erweitern (15 min)

#### 4.1 Webmail über Tunnel

In `~/.cloudflared/config.yml` hinzufügen:

```yaml
ingress:
  # ... bestehende Einträge ...

  - hostname: mail.manacore.ai
    service: https://localhost:8443
    originRequest:
      noTLSVerify: true

  - service: http_status:404
```

#### 4.2 Tunnel neustarten

```bash
launchctl stop com.cloudflare.cloudflared
launchctl start com.cloudflare.cloudflared
```

### Phase 5: Mac Mini Alerts umstellen (15 min)

#### 5.1 msmtp Konfiguration

```bash
# ~/.msmtprc aktualisieren
cat > ~/.msmtprc << 'EOF'
defaults
auth           on
tls            on
tls_starttls   on
logfile        ~/.msmtp.log

# Eigener Mail-Server
account        manacore
host           localhost
port           587
from           alerts@manacore.ai
user           alerts@manacore.ai
password       <alerts-password>

# Gmail als Fallback
account        gmail
host           smtp.gmail.com
port           587
from           tills95@gmail.com
user           tills95@gmail.com
password       oeyabfavixcaqzvr

account default : manacore
EOF

chmod 600 ~/.msmtprc
```

#### 5.2 .env.notifications aktualisieren

```bash
# Telegram (unverändert)
TELEGRAM_BOT_TOKEN=8531397113:AAHmvzpQoWfnSGJo2-vaHuDNrpJSMOjs-AU
TELEGRAM_CHAT_ID=7117174865

# Email (neuer Server)
EMAIL_TO=till@manacore.ai
EMAIL_FROM=alerts@manacore.ai
```

### Phase 6: Testing (30 min)

#### 6.1 Senden testen

```bash
# Von Mac Mini
echo "Test vom Mac Mini" | msmtp -a manacore till@manacore.ai

# Von extern
# Email an till@manacore.ai senden
```

#### 6.2 Empfangen testen

```bash
# Webmail öffnen
open https://mail.manacore.ai

# Oder IMAP-Client konfigurieren
# Server: mail.manacore.ai
# Port: 993 (IMAPS)
# User: till@manacore.ai
```

#### 6.3 Spam-Score testen

1. Gehe zu https://www.mail-tester.com
2. Sende Email an die angezeigte Adresse
3. Ziel: Score ≥ 8/10

#### 6.4 Health Check testen

```bash
# Manuell Fehler simulieren
docker stop manacore-chat-backend

# Health Check ausführen
./scripts/mac-mini/health-check.sh

# Prüfen ob Alert ankommt (Telegram + Email)

# Container wieder starten
docker start manacore-chat-backend
```

## Ressourcen-Monitoring

### Nach Installation prüfen

```bash
# Docker Stats
docker stats --no-stream

# Erwartete Werte für Mailcow:
# mysql-mailcow:    ~200-400 MB RAM
# dovecot-mailcow:  ~100-200 MB RAM
# postfix-mailcow:  ~50-100 MB RAM
# rspamd-mailcow:   ~200-400 MB RAM
# sogo-mailcow:     ~200-300 MB RAM
# redis-mailcow:    ~50 MB RAM
# nginx-mailcow:    ~20 MB RAM
# ---------------------------------
# Gesamt:           ~1-2 GB RAM
```

## Skripte

### Mail-Server starten

```bash
#!/bin/bash
# scripts/mac-mini/start-mail.sh

cd ~/mailcow-dockerized
docker compose up -d
```

### Mail-Server stoppen

```bash
#!/bin/bash
# scripts/mac-mini/stop-mail.sh

cd ~/mailcow-dockerized
docker compose down
```

### Mail-Server Status

```bash
#!/bin/bash
# scripts/mac-mini/mail-status.sh

cd ~/mailcow-dockerized
docker compose ps
echo ""
echo "=== Queue ==="
docker compose exec postfix-mailcow postqueue -p
```

## Backup

### Mailcow Backup

```bash
# Backup erstellen
cd ~/mailcow-dockerized
./helper-scripts/backup_and_restore.sh backup all

# Backup-Verzeichnis: ~/mailcow-dockerized/backup/
```

### Automatisches Backup (cron)

```bash
# Täglich um 3 Uhr
0 3 * * * cd ~/mailcow-dockerized && ./helper-scripts/backup_and_restore.sh backup all
```

## Migration zu dediziertem Server

Wenn später ein separates Gerät verfügbar ist:

1. Mailcow auf neuem Gerät installieren
2. Backup vom Mac Mini erstellen
3. Backup auf neuem Gerät wiederherstellen
4. DNS-Records auf neue IP ändern
5. Mac Mini Mail-Container stoppen
6. msmtp auf neuen Server umstellen

## Checkliste

### Vorbereitung
- [ ] Öffentliche IP oder DynDNS eingerichtet
- [ ] Port 25 nicht vom ISP blockiert (testen!)
- [ ] Router-Zugang für Port-Forwarding

### DNS (Cloudflare)
- [ ] A-Record: mail.manacore.ai → IP (ohne Proxy)
- [ ] MX-Record: manacore.ai → mail.manacore.ai
- [ ] SPF-Record hinzugefügt
- [ ] DMARC-Record hinzugefügt

### Router
- [ ] Port 25 → Mac Mini
- [ ] Port 465 → Mac Mini
- [ ] Port 587 → Mac Mini
- [ ] Port 993 → Mac Mini

### Mailcow
- [ ] Installiert und gestartet
- [ ] Admin-Passwort geändert
- [ ] Domain hinzugefügt
- [ ] DKIM-Key in DNS eingetragen
- [ ] Postfächer erstellt

### Cloudflare Tunnel
- [ ] mail.manacore.ai hinzugefügt
- [ ] Tunnel neugestartet
- [ ] Webmail erreichbar

### Testing
- [ ] Email senden funktioniert
- [ ] Email empfangen funktioniert
- [ ] Webmail funktioniert
- [ ] IMAP funktioniert
- [ ] Spam-Score ≥ 8/10
- [ ] Health Check Alert kommt an

### Alerts
- [ ] msmtp auf eigenen Server umgestellt
- [ ] .env.notifications aktualisiert
- [ ] Test-Alert erfolgreich

## Zeitschätzung

| Phase | Dauer |
|-------|-------|
| DNS + Router | 30 min |
| Mailcow Installation | 45 min |
| Konfiguration | 30 min |
| Cloudflare Tunnel | 15 min |
| Testing | 30 min |
| **Gesamt** | **~2.5 Stunden** |
