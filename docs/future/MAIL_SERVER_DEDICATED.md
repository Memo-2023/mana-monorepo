# Mail-Server auf dediziertem Gerät

> **Status:** Geplant für später
> **Priorität:** Mittel
> **Voraussetzung:** Separates Gerät (Raspberry Pi 5 oder Mini-PC)

## Übersicht

Einrichtung eines vollständigen Mail-Servers auf einem separaten Gerät für:
- Eigene Email-Adressen (@mana.how, @mana.how)
- Ausfallsichere Alert-Benachrichtigungen
- Unabhängigkeit von Gmail/externen Diensten

## Hardware-Empfehlung

### Option A: Raspberry Pi 5 (Empfohlen)

| Komponente | Produkt | Preis |
|------------|---------|-------|
| Board | Raspberry Pi 5 8GB | ~75€ |
| Netzteil | Official USB-C 27W | ~15€ |
| Gehäuse | Argon ONE V3 (passiv) | ~25€ |
| Storage | Samsung 256GB NVMe + Adapter | ~40€ |
| **Gesamt** | | **~155€** |

**Bezugsquellen:**
- BerryBase: https://www.berrybase.de
- Reichelt: https://www.reichelt.de
- Amazon

### Option B: Mini-PC Intel N100

| Produkt | Preis |
|---------|-------|
| Beelink Mini S12 Pro (16GB/500GB) | ~180€ |
| Minisforum UN100 | ~170€ |
| Trigkey G4 | ~160€ |

**Vorteile gegenüber Pi:**
- x86-Architektur (mehr Software-Kompatibilität)
- Mehr RAM/Storage out-of-the-box
- SATA/NVMe bereits integriert

## Software-Stack: Mailcow

Mailcow ist eine Docker-basierte Mail-Server-Suite mit allem dabei:

```
┌─────────────────────────────────────────────────────────────┐
│  Mailcow Dockerized                                         │
│                                                             │
│  ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐   │
│  │  Postfix  │ │  Dovecot  │ │  Rspamd   │ │   SOGo    │   │
│  │  (SMTP)   │ │  (IMAP)   │ │  (Spam)   │ │ (Webmail) │   │
│  └───────────┘ └───────────┘ └───────────┘ └───────────┘   │
│                                                             │
│  ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐   │
│  │  MySQL    │ │   Redis   │ │   Nginx   │ │  ClamAV   │   │
│  │(Database) │ │  (Cache)  │ │  (Proxy)  │ │ (Antivir) │   │
│  └───────────┘ └───────────┘ └───────────┘ └───────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Mailcow Admin UI (https://mail.mana.how)        │   │
│  │  - Domain-Verwaltung                                │   │
│  │  - Postfach-Erstellung                              │   │
│  │  - Alias-Management                                 │   │
│  │  - Spam-Regeln                                      │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### Systemanforderungen

| Ressource | Minimum | Empfohlen |
|-----------|---------|-----------|
| RAM | 2 GB | 4 GB |
| CPU | 2 Cores | 4 Cores |
| Disk | 20 GB | 50 GB+ |
| OS | Debian 11/12, Ubuntu 22.04 | Debian 12 |

## Netzwerk-Architektur

```
Internet
    │
    ├── Port 25 (SMTP)
    ├── Port 465 (SMTPS)
    ├── Port 587 (Submission)
    ├── Port 993 (IMAPS)
    └── Port 443 (Webmail)
    │
    ▼
┌─────────────────┐
│  Router/Modem   │
│  Port-Forwards  │
└─────────────────┘
    │
    ▼
┌─────────────────┐      ┌─────────────────┐
│   Mail-Server   │      │    Mac Mini     │
│  (Pi/Mini-PC)   │◄────►│  (Mana)     │
│  192.168.1.x    │ LAN  │  192.168.1.x    │
└─────────────────┘      └─────────────────┘
```

## DNS-Konfiguration

Für `mana.how` bei Cloudflare:

### MX Record
```
Type: MX
Name: @
Content: mail.mana.how
Priority: 10
Proxy: DNS only (grey cloud)
```

### A Record für Mail-Server
```
Type: A
Name: mail
Content: <Öffentliche-IP>
Proxy: DNS only (grey cloud)  # WICHTIG: Kein Proxy für Mail!
```

### SPF Record
```
Type: TXT
Name: @
Content: v=spf1 mx a:mail.mana.how ~all
```

### DKIM Record
```
Type: TXT
Name: dkim._domainkey
Content: <wird von Mailcow generiert>
```

### DMARC Record
```
Type: TXT
Name: _dmarc
Content: v=DMARC1; p=quarantine; rua=mailto:dmarc@mana.how
```

### Autodiscover (für Mail-Clients)
```
Type: CNAME
Name: autodiscover
Content: mail.mana.how

Type: CNAME
Name: autoconfig
Content: mail.mana.how

Type: SRV
Name: _autodiscover._tcp
Content: 0 1 443 mail.mana.how
```

## Installation

### 1. Betriebssystem installieren

**Raspberry Pi:**
```bash
# Raspberry Pi Imager verwenden
# OS: Raspberry Pi OS Lite (64-bit)
# Hostname: mail
# SSH aktivieren
# User: till
```

**Mini-PC:**
```bash
# Debian 12 Netinstall
# Minimal installation
# SSH server
```

### 2. System vorbereiten

```bash
# System updaten
sudo apt update && sudo apt upgrade -y

# Docker installieren
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER

# Docker Compose installieren
sudo apt install docker-compose-plugin -y

# Neustart
sudo reboot
```

### 3. Mailcow installieren

```bash
# Ins opt-Verzeichnis
cd /opt

# Mailcow klonen
sudo git clone https://github.com/mailcow/mailcow-dockerized
cd mailcow-dockerized

# Konfiguration generieren
sudo ./generate_config.sh
# Hostname eingeben: mail.mana.how
# Timezone: Europe/Berlin

# Container starten
sudo docker compose pull
sudo docker compose up -d
```

### 4. Admin-Zugang

```
URL: https://mail.mana.how
User: admin
Password: moohoo (SOFORT ÄNDERN!)
```

### 5. Domain hinzufügen

1. Admin UI → Configuration → Mail Setup → Domains
2. "Add domain" → `mana.how`
3. DKIM-Key generieren und in DNS eintragen

### 6. Postfächer erstellen

1. Admin UI → Configuration → Mail Setup → Mailboxes
2. "Add mailbox":
   - Username: `till`
   - Domain: `mana.how`
   - Password: sicheres Passwort
   - Quota: 5 GB

## Postfächer-Plan

| Adresse | Typ | Verwendung |
|---------|-----|------------|
| till@mana.how | Postfach | Haupt-Email |
| alerts@mana.how | Postfach | Server-Benachrichtigungen |
| noreply@mana.how | Alias → till | Automatische Emails |
| support@mana.how | Alias → till | Kundenanfragen |
| info@mana.how | Alias → till | Allgemeine Anfragen |
| *@mana.how | Catch-All → till | Alles andere |

## Integration mit Mac Mini

### Alerts vom Mac Mini

Nach Mail-Server Setup, `.env.notifications` anpassen:

```bash
# Email über eigenen Server
EMAIL_TO=alerts@mana.how
EMAIL_FROM=alerts@mana.how
SMTP_HOST=mail.mana.how
SMTP_PORT=587
SMTP_USER=alerts@mana.how
SMTP_PASS=<password>
```

### msmtp Konfiguration

```bash
# ~/.msmtprc auf Mac Mini
account mana
host mail.mana.how
port 587
from alerts@mana.how
user alerts@mana.how
password <password>
auth on
tls on

account default : mana
```

## Wartung

### Updates

```bash
cd /opt/mailcow-dockerized
sudo ./update.sh
```

### Backup

```bash
# Backup-Skript
cd /opt/mailcow-dockerized
sudo ./helper-scripts/backup_and_restore.sh backup all

# Speicherort: /opt/mailcow-dockerized/backup/
```

### Logs

```bash
# Alle Logs
sudo docker compose logs -f

# Nur Postfix
sudo docker compose logs -f postfix-mailcow

# Spam-Logs
sudo docker compose logs -f rspamd-mailcow
```

## Monitoring

### Mailcow Status
```bash
cd /opt/mailcow-dockerized
sudo docker compose ps
```

### Queue prüfen
```bash
sudo docker compose exec postfix-mailcow postqueue -p
```

### Mail-Test
```bash
# Test-Email senden
echo "Test" | mail -s "Test" till@mana.how
```

## Kosten-Übersicht

### Einmalig
| Position | Preis |
|----------|-------|
| Hardware (Pi 5 Kit oder Mini-PC) | 150-180€ |
| **Gesamt einmalig** | **~165€** |

### Monatlich
| Position | Preis |
|----------|-------|
| Strom (~5W × 24h × 30d × 0.30€) | ~1€ |
| Domain (bereits vorhanden) | 0€ |
| **Gesamt monatlich** | **~1€** |

### Vergleich mit Alternativen

| Lösung | Monatlich | Jährlich |
|--------|-----------|----------|
| **Eigener Server** | 1€ | 12€ + 165€ einmalig |
| Google Workspace | 6€/User | 72€/User |
| Microsoft 365 | 5€/User | 60€/User |
| Mailbox.org | 3€ | 36€ |
| Hetzner Mail | 1€ | 12€ |

→ Ab Jahr 2 ist eigener Server die günstigste Lösung!

## Troubleshooting

### Emails landen im Spam

1. SPF/DKIM/DMARC prüfen: https://mxtoolbox.com
2. IP-Reputation prüfen: https://www.spamhaus.org/lookup/
3. Blacklist-Check: https://multirbl.valli.org

### Keine Emails empfangen

1. MX-Record prüfen: `dig MX mana.how`
2. Port 25 offen? `telnet mail.mana.how 25`
3. Firewall/Router Portforwarding prüfen

### Zertifikat-Fehler

```bash
# SSL erneuern
cd /opt/mailcow-dockerized
sudo docker compose exec acme-mailcow /etc/scripts/renew-ssl.sh
```

## Checkliste vor Inbetriebnahme

- [ ] Hardware bestellt und eingerichtet
- [ ] Statische IP oder DynDNS konfiguriert
- [ ] Ports 25, 465, 587, 993, 443 weitergeleitet
- [ ] Debian/Ubuntu installiert
- [ ] Docker installiert
- [ ] Mailcow installiert
- [ ] DNS-Records erstellt (MX, A, SPF, DKIM, DMARC)
- [ ] Admin-Passwort geändert
- [ ] Domain hinzugefügt
- [ ] DKIM-Key in DNS eingetragen
- [ ] Postfächer erstellt
- [ ] Test-Emails gesendet und empfangen
- [ ] Spam-Test bestanden (mail-tester.com)
- [ ] Backup eingerichtet
- [ ] Mac Mini auf neuen Server umgestellt

## Zeitplan

| Phase | Dauer | Beschreibung |
|-------|-------|--------------|
| Hardware beschaffen | 1-3 Tage | Bestellung/Lieferung |
| OS installieren | 30 min | Debian/Ubuntu Setup |
| Mailcow installieren | 1 Stunde | Docker + Mailcow |
| DNS konfigurieren | 30 min | Records anlegen |
| Postfächer einrichten | 15 min | Users anlegen |
| Testing | 1-2 Stunden | Senden/Empfangen testen |
| Mac Mini umstellen | 15 min | msmtp anpassen |
| **Gesamt** | **~1 Tag** | |
