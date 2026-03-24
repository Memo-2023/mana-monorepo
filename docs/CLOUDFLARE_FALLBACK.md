# Cloudflare Tunnel Fallback-Plan

> Was tun wenn Cloudflare ausfällt oder den Account sperrt?

## Risiko

Cloudflare Tunnel ist der **einzige** Weg vom Internet zum Mac Mini. Wenn Cloudflare nicht erreichbar ist:
- Alle *.mana.how Subdomains sind offline
- SSH nur im lokalen Netzwerk möglich
- Kein Deployment, kein Monitoring

**Wahrscheinlichkeit:** Gering (Cloudflare hat >99.99% Uptime), aber Accountsperren oder Policy-Änderungen sind ein Risiko.

## Plan B: WireGuard + Caddy auf Hetzner VPS

### Architektur

```
Internet
    │
    ▼
Hetzner VPS (€3.79/Monat, CX22)
├── Caddy (Reverse Proxy + Auto-TLS)
├── WireGuard Server
└── DNS: *.mana.how → VPS IP
    │
    │ WireGuard Tunnel (verschlüsselt)
    │
    ▼
Mac Mini (WireGuard Client)
├── Alle Services auf localhost
└── Erreichbar über WireGuard-IP (z.B. 10.0.0.2)
```

### Vorteile

- **Kein Vendor Lock-in:** Hetzner ist deutscher Anbieter
- **Eigene IP:** Keine Abhängigkeit von Cloudflare Proxy
- **WireGuard:** Schneller als Cloudflare Tunnel (~10% weniger Latenz)
- **Let's Encrypt:** Caddy macht TLS automatisch
- **Kosten:** €3.79/Monat (CX22: 2 vCPU, 4 GB RAM, 40 GB SSD)

### Einrichtung VPS (einmalig, ~1 Stunde)

#### 1. Hetzner VPS erstellen

```bash
# CX22 (kleinster mit genug RAM für Caddy + WireGuard)
# Standort: Falkenstein (DE) oder Nürnberg (DE)
# OS: Ubuntu 24.04
# SSH Key: Mac Mini public key
```

#### 2. WireGuard installieren

**Auf dem VPS:**
```bash
apt update && apt install -y wireguard

# Keys generieren
wg genkey | tee /etc/wireguard/server_private.key | wg pubkey > /etc/wireguard/server_public.key
chmod 600 /etc/wireguard/server_private.key

# Config erstellen
cat > /etc/wireguard/wg0.conf << EOF
[Interface]
Address = 10.0.0.1/24
PrivateKey = $(cat /etc/wireguard/server_private.key)
ListenPort = 51820

[Peer]
# Mac Mini
PublicKey = <MAC_MINI_PUBLIC_KEY>
AllowedIPs = 10.0.0.2/32
EOF

systemctl enable --now wg-quick@wg0
```

**Auf dem Mac Mini:**
```bash
brew install wireguard-tools

# Keys generieren
wg genkey | tee /etc/wireguard/client_private.key | wg pubkey > /etc/wireguard/client_public.key

# Config
cat > /etc/wireguard/wg0.conf << EOF
[Interface]
Address = 10.0.0.2/24
PrivateKey = $(cat /etc/wireguard/client_private.key)

[Peer]
PublicKey = <VPS_PUBLIC_KEY>
Endpoint = <VPS_IP>:51820
AllowedIPs = 10.0.0.0/24
PersistentKeepalive = 25
EOF

wg-quick up wg0
```

#### 3. Caddy installieren (VPS)

```bash
apt install -y debian-keyring debian-archive-keyring apt-transport-https
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | tee /etc/apt/sources.list.d/caddy-stable.list
apt update && apt install caddy
```

#### 4. Caddyfile erstellen (VPS)

```Caddyfile
# /etc/caddy/Caddyfile
# Alle Domains → Mac Mini via WireGuard

mana.how {
    reverse_proxy 10.0.0.2:5000
}

auth.mana.how {
    reverse_proxy 10.0.0.2:3001
}

chat.mana.how {
    reverse_proxy 10.0.0.2:5010
}

chat-api.mana.how {
    reverse_proxy 10.0.0.2:3030
}

todo.mana.how {
    reverse_proxy 10.0.0.2:5011
}

todo-api.mana.how {
    reverse_proxy 10.0.0.2:3031
}

calendar.mana.how {
    reverse_proxy 10.0.0.2:5012
}

calendar-api.mana.how {
    reverse_proxy 10.0.0.2:3032
}

clock.mana.how {
    reverse_proxy 10.0.0.2:5013
}

clock-api.mana.how {
    reverse_proxy 10.0.0.2:3033
}

contacts.mana.how {
    reverse_proxy 10.0.0.2:5014
}

contacts-api.mana.how {
    reverse_proxy 10.0.0.2:3034
}

storage.mana.how {
    reverse_proxy 10.0.0.2:5015
}

storage-api.mana.how {
    reverse_proxy 10.0.0.2:3035
}

presi.mana.how {
    reverse_proxy 10.0.0.2:5016
}

presi-api.mana.how {
    reverse_proxy 10.0.0.2:3036
}

nutriphi.mana.how {
    reverse_proxy 10.0.0.2:5017
}

nutriphi-api.mana.how {
    reverse_proxy 10.0.0.2:3037
}

photos.mana.how {
    reverse_proxy 10.0.0.2:5019
}

photos-api.mana.how {
    reverse_proxy 10.0.0.2:3039
}

mukke.mana.how {
    reverse_proxy 10.0.0.2:5180
}

picture.mana.how {
    reverse_proxy 10.0.0.2:5021
}

picture-api.mana.how {
    reverse_proxy 10.0.0.2:3040
}

playground.mana.how {
    reverse_proxy 10.0.0.2:5090
}

matrix.mana.how {
    reverse_proxy 10.0.0.2:4000
}

element.mana.how {
    reverse_proxy 10.0.0.2:4080
}

grafana.mana.how {
    reverse_proxy 10.0.0.2:8000
}

stats.mana.how {
    reverse_proxy 10.0.0.2:8010
}

glitchtip.mana.how {
    reverse_proxy 10.0.0.2:8020
}
```

#### 5. DNS umstellen (Failover-Schritt)

Beim Ausfall von Cloudflare Tunnel:

```bash
# 1. WireGuard-Verbindung prüfen
ssh mana-server "ping -c1 10.0.0.1"  # Ping VPS via WireGuard

# 2. DNS bei Cloudflare umstellen (alle *.mana.how → VPS IP)
#    Cloudflare Dashboard → DNS → *.mana.how → A Record → <VPS_IP>
#    ODER falls Cloudflare komplett down:
#    Domain zu anderem DNS-Provider transferieren (vorher vorbereiten!)

# 3. Caddy starten
ssh vps "systemctl start caddy"

# 4. Prüfen
curl https://mana.how  # Sollte über VPS → WireGuard → Mac Mini routen
```

## Failover-Checkliste

| # | Schritt | Zeit | Verantwortlich |
|---|---------|------|----------------|
| 1 | Feststellen: Cloudflare Tunnel ist down | Auto (Health Check Alert) | Automatisch |
| 2 | VPS WireGuard-Verbindung prüfen | 1 Min | Admin |
| 3 | DNS auf VPS-IP umstellen | 5 Min | Admin (Cloudflare Dashboard) |
| 4 | Caddy aktivieren | 1 Min | Admin (SSH zu VPS) |
| 5 | TLS-Zertifikate generieren lassen | 2-5 Min | Automatisch (Caddy + Let's Encrypt) |
| 6 | Alle Services testen | 5 Min | Admin |
| **Gesamt** | | **~15 Min** | |

## Vorbereitung (jetzt erledigen)

- [ ] Hetzner Account erstellen
- [ ] VPS bestellen (CX22, €3.79/Monat)
- [ ] WireGuard einrichten (VPS + Mac Mini)
- [ ] WireGuard-Verbindung testen
- [ ] Caddyfile erstellen (alle Domains)
- [ ] DNS-Failover-Prozedur testen (mit Test-Subdomain)
- [ ] Failover-Checkliste ausdrucken / im Wiki speichern

## Plan C: Direkte IP

Falls auch Hetzner nicht verfügbar:
1. ISP kontaktieren für feste IP-Adresse
2. Port-Forwarding auf Router einrichten (80, 443)
3. Let's Encrypt Zertifikat via DNS-Challenge (kein HTTP nötig)
4. DNS bei einem dritten Provider (z.B. Hetzner DNS, Gandi)

**Nachteil:** Consumer-ISPs blockieren oft Port 25 (E-Mail) und Port 80/443 ist nicht garantiert.
