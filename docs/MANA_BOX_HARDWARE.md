# Mana Box — On-Premise Appliance Hardware-Planung

**Stand:** 2026-03-30
**Status:** Recherche / Evaluierung

## Vision

Jeder Kunde (KMU, Verein, Schule, Agentur etc.) kauft eine **Mana Box** — einen kleinen, vorkonfigurierten Server mit dem gesamten Mana-Stack vorinstalliert. Alle Daten liegen on-premise beim Kunden. Optional kann der Kunde auch Websites, Intranets o.a. darauf hosten.

### Warum On-Premise?

- **Datensouveranitat**: Kundendaten verlassen nie das Gebaude
- **DSGVO-Compliance**: Keine Cloud-Abhaengigkeiten, keine Auftragsverarbeitung noetig
- **Unabhaengigkeit**: Funktioniert auch ohne Internet (Offline-First-Architektur)
- **Planbare Kosten**: Einmaliger Hardwarekauf + optionales Support-Abo
- **B2B-Differenzierung**: Kein Vendor-Lock-in, Kunde besitzt die Infrastruktur

## Architektur: Single-Node Appliance

Da jede Mana Box ein einzelner Server ist (kein Cluster), vereinfacht sich der Stack erheblich:

| Komponente | Cluster-Ansatz (verworfen) | Mana Box (Single Node) |
|---|---|---|
| Orchestrierung | K3s (Kubernetes) | **Docker Compose** |
| Datenbank | YugabyteDB (verteilt) | **PostgreSQL** (lokal) |
| Netzwerk | 10 GbE + Headscale Mesh | **1 GbE LAN** |
| High Availability | 3-Node Failover | **Backup-Strategie** |
| Management | kubectl | **Portainer oder CLI** |

### Stack pro Mana Box

```
┌─────────────────────────────────────────────┐
│                  Mana Box                    │
├─────────────────────────────────────────────┤
│  Docker Compose                             │
│  ├── mana-auth         (Hono/Bun)           │
│  ├── mana-credits      (Hono/Bun)           │
│  ├── mana-user         (Hono/Bun)           │
│  ├── mana-sync         (Go)                 │
│  ├── mana-search       (Go)                 │
│  ├── mana-notify       (Go)                 │
│  ├── mana-api-gateway  (Go)                 │
│  ├── mana-media        (Hono/Bun)           │
│  ├── App-Backends      (NestJS / Hono)      │
│  ├── App-Webs          (SvelteKit, static)  │
│  ├── PostgreSQL                             │
│  ├── Redis                                  │
│  ├── MinIO                                  │
│  ├── Traefik           (Reverse Proxy)      │
│  └── Tailscale         (Remote-Management)  │
├─────────────────────────────────────────────┤
│  Debian/Ubuntu Minimal + unattended-upgrades│
└─────────────────────────────────────────────┘
```

## Hardware-Anforderungen

### Prioritaeten (anders als bei eigenem Cluster)

| Anforderung | Prioritaet | Begruendung |
|---|---|---|
| **Stueckpreis** | Kritisch | Bestimmt Verkaufspreis und Marge |
| **Zuverlaessigkeit** | Kritisch | Kein IT-Personal beim Kunden |
| **Lautstaerke** | Sehr hoch | Steht im Buero, nicht im Rack |
| **Stromverbrauch** | Hoch | Kunde zahlt Strom, 24/7 Betrieb |
| **Linux nativ** | Pflicht | Docker Compose direkt auf Host |
| **Kompakte Groesse** | Mittel | Schreibtisch oder Serverschrank |
| **RAM aufruetbar** | Niedrig | Wird vor Versand konfiguriert |

### RAM-Sizing nach Kundengroesse

| Tier | User | Typische Apps | RAM-Bedarf |
|---|---|---|---|
| **S** (Klein) | 5-15 | Auth + 3-4 Apps + DB + Redis | 6-8 GB |
| **M** (Mittel) | 15-30 | Auth + 8-10 Apps + DB + Redis + MinIO | 10-14 GB |
| **L** (Gross) | 30-50+ | Alle Apps + alle Services + MinIO | 16-20 GB |

**Sweet Spot: 16 GB RAM** deckt die grosse Mehrheit der KMU-Kunden ab.
32 GB nur fuer Power-User oder lokale LLM-Inferenz.

## Hardware-Kandidaten

### Vergleichstabelle

| Geraet | CPU | Cores | RAM | Preis (EK) | Luefter | Idle | Linux | Eignung |
|---|---|---|---|---|---|---|---|---|
| **Intel N100 Mini PC** (diverse) | Intel N100 | 4C/4T | 16 GB (aufr.) | 120-180 EUR | Luefterlos | ~6W | Nativ | Budget, nur 4 Cores |
| **Intel N305 Mini PC** (z.B. Beelink EQ14) | Intel N305 | 8C/8T | 16 GB (aufr.) | 200-280 EUR | Luefterlos | ~8W | Nativ | **Bester Kandidat fuer Box S** |
| **Beelink SER8** | Ryzen 7 8845HS | 8C/16T | 32 GB DDR5 (aufr.) | ~680 EUR | Aktiv (leise) | ~8W | Nativ | Overpowered fuer die meisten |
| **Beelink SER9 Pro (H255)** | Ryzen 7 H255 | 8C/16T | 32 GB LPDDR5X (fix) | ab 779 EUR | Aktiv (leise) | ~8W | Nativ | Gut, aber RAM verloetet |
| **Beelink SER9 Pro (HX 370)** | Ryzen AI 9 HX 370 | 12C/24T | 32 GB LPDDR5X (fix) | ab 1.029 EUR | Aktiv (leise) | ~10W | Nativ | Overkill, RAM verloetet |
| **Minisforum UM790 Pro** | Ryzen 9 7940HS | 8C/16T | bis 64 GB (aufr.) | ab 399 EUR | Aktiv (leise) | ~8W | Nativ | Gutes Preis/Leistung |
| **Minisforum UM890 Pro** | Ryzen 9 8945HS | 8C/16T | bis 64 GB (aufr.) | ab 463 EUR | Aktiv (leise) | ~8W | Nativ | Homelab-Favorit |
| **GEEKOM A8** | Ryzen 7 8745HS | 8C/16T | 16 GB DDR5 (aufr.) | ab 659 EUR | Aktiv (leise) | ~8W | Nativ | Dual 2.5 GbE, solide |
| **Lenovo M75q Gen 2** (refurb) | Ryzen 5 PRO 5650GE | 6C/12T | bis 64 GB (aufr.) | 150-250 EUR | Aktiv (leise) | ~10W | Nativ | **Guenstigster Kandidat** |
| **Lenovo M75q Gen 5** (neu) | Ryzen 7 PRO 8700GE | 8C/16T | bis 64 GB DDR5 (aufr.) | 500-600 EUR | Aktiv (leise) | ~10W | Nativ | Premium, Enterprise-Qualitaet |
| **ASUS NUC 14 Pro** (Barebone) | Core Ultra 7 155H | 14C/18T | bis 96 GB (aufr.) | ab 547 EUR | Aktiv (leise) | ~10W | Nativ | Viele Cores, flexibel |
| **HP Elite Mini 800 G9** (refurb) | Core i7-12700 | 12C/20T | 32 GB (aufr.) | ~350-500 EUR | Aktiv (leise) | ~12W | Nativ | Enterprise-refurb |
| **Raspberry Pi 5** | Cortex-A76 | 4C/4T | 8 GB (fix) | ~100 EUR | Passiv moegl. | ~3W | Nativ | Zu wenig RAM, ARM-Limits |

### Detailbewertung der Top-Kandidaten

#### Intel N305 Mini PCs (z.B. Beelink EQ14) — Box S

- **Preis:** 200-280 EUR
- **Vorteile:** Luefterlos, 8W idle, 8 Cores, extrem zuverlaessig, guenstig
- **Nachteile:** Nur E-Cores (kein Performance-Core), max ~16 GB typisch
- **Ideal fuer:** Kleine Kunden (5-15 User), Basic-Setup
- **Luefterlos = keine beweglichen Teile = hoechste Zuverlaessigkeit**

#### Minisforum UM890 Pro — Box M

- **Preis:** ab 463 EUR (Barebone), ~600-700 EUR konfiguriert
- **Vorteile:** Ryzen 9, aufruetbar bis 64 GB, sehr leise, bewahrt im Homelab
- **Nachteile:** Aktiver Luefter (wenn auch leise)
- **Ideal fuer:** Mittelgrosse Kunden (15-50 User)

#### Beelink SER8 — Box L

- **Preis:** ~680 EUR mit 32 GB/1 TB
- **Vorteile:** Ryzen 7 8845HS, DDR5 SO-DIMM aufruetbar bis 256 GB, 2.5 GbE
- **Nachteile:** Auslaufmodell (Nachfolger SER9 hat verloeteten RAM)
- **Ideal fuer:** Grosse Kunden, LLM-Workloads, Website-Hosting
- **Achtung:** Verfuegbarkeit pruefen — wird vom SER9 abgeloest

#### Lenovo M75q Gen 2 (refurbished) — Budget-Option

- **Preis:** 150-250 EUR (refurbished mit 12-24 Monate Garantie)
- **Vorteile:** Enterprise-Qualitaet, extrem guenstig, aufruetbar bis 64 GB
- **Nachteile:** Aeltere CPU (Ryzen 5 5650GE), DDR4, keine USB4
- **Bezugsquellen DE:** it-goods.de, notebookswieneu.de, thinkstore24.de
- **Ideal fuer:** Budget-bewusste Kunden, Prototyp-Phase

## Produkt-Tiers

### Mana Box S — 599-799 EUR (VK)

| Komponente | Spezifikation |
|---|---|
| Hardware | Intel N305 Mini PC, luefterlos |
| RAM | 16 GB DDR5 |
| Speicher | 512 GB NVMe SSD |
| Netzwerk | 1 GbE |
| Strom | ~8W idle |
| EK Hardware | ~250-300 EUR |
| Zielgruppe | 5-15 User |
| Apps | Auth + 3-5 Kern-Apps |

### Mana Box M — 999-1.299 EUR (VK)

| Komponente | Spezifikation |
|---|---|
| Hardware | Minisforum UM890 Pro oder Lenovo M75q Gen 5 |
| RAM | 32 GB DDR5 |
| Speicher | 1 TB NVMe SSD |
| Netzwerk | 2.5 GbE |
| Strom | ~10W idle |
| EK Hardware | ~500-650 EUR |
| Zielgruppe | 15-50 User |
| Apps | Auth + 8-15 Apps + MinIO |

### Mana Box L — 1.499-1.999 EUR (VK)

| Komponente | Spezifikation |
|---|---|
| Hardware | Beelink SER8 oder Minisforum MS-A1 |
| RAM | 64 GB DDR5 |
| Speicher | 2 TB NVMe SSD |
| Netzwerk | 2.5 GbE (oder 10 GbE bei MS-A1) |
| Strom | ~12W idle |
| EK Hardware | ~800-1.000 EUR |
| Zielgruppe | 50+ User, LLM lokal |
| Apps | Alle Apps + LLM-Inferenz |

## Betrieb & Management

### Provisioning

1. Debian 12 Minimal-Image mit vorinstalliertem Docker + Mana Stack
2. Image wird auf SSD geflasht (vor Versand oder per USB-Stick)
3. Kunde schliesst Box an Strom + LAN → Box startet automatisch
4. Ersteinrichtung via Web-UI (Admin-Account, Domain, App-Auswahl)

### Remote-Management

| Funktion | Technologie |
|---|---|
| VPN-Tunnel | Tailscale (oder WireGuard + eigener Koordinator) |
| Health-Monitoring | Phone-Home an Mana-Zentrale (Heartbeat, Metriken) |
| Remote-Shell | SSH via Tailscale (nur mit Kunden-Zustimmung) |
| Logs | Promtail → zentrale Loki-Instanz (optional, opt-in) |

### Updates

| Aspekt | Loesung |
|---|---|
| OS-Updates | unattended-upgrades (Debian) |
| App-Updates | Docker Image Pull + Compose Restart |
| Update-Kanal | Staging → Stable (Kunden koennen waehlen) |
| Rollback | Vorheriges Image bleibt lokal, 1-Click Rollback |
| Zeitfenster | Konfigurierbares Wartungsfenster (z.B. 03:00-05:00) |

### Backup

| Aspekt | Loesung |
|---|---|
| Datenbank | pg_dump, taeglich, verschluesselt |
| Dateien | MinIO/Medien-Backup |
| Ziel | Lokal (USB/NAS) und/oder verschluesselt in Mana Cloud |
| Retention | 7 Tage lokal, 30 Tage Cloud |

## Preiskalkulation (Beispiel Box M)

| Posten | Kosten |
|---|---|
| Hardware (EK) | ~600 EUR |
| Zusammenbau + Imaging + QA | ~50 EUR |
| Verpackung + Versand | ~30 EUR |
| **Gesamtkosten** | **~680 EUR** |
| **Verkaufspreis** | **999-1.299 EUR** |
| **Marge** | **~320-620 EUR (32-48%)** |

Zusaetzliche Einnahmen:
- Support-Abo: 29-99 EUR/Monat (Remote-Management, Updates, Monitoring)
- Erweiterungen: Zusaetzliche Apps, mehr Speicher, LLM-Modul

## Eigene Infrastruktur (weiterhin noetig)

Die Mana Boxen beim Kunden ersetzen nicht die eigene Infrastruktur. Weiterhin benoetigt:

| Zweck | Loesung |
|---|---|
| SaaS-Variante fuer Einzelnutzer | Mac Mini Cluster (2-3 Nodes) |
| Update-Server (Docker Registry) | Eigener Registry-Mirror |
| Health-Dashboard | Grafana + VictoriaMetrics |
| Tailscale Coordination | Headscale (self-hosted) |
| Landing Pages + Marketing | Cloudflare Pages |
| CI/CD (Image-Builds) | Forgejo Actions |

## Offene Fragen

- [ ] Welche Linux-Distribution? Debian 12 (stabil) vs. Ubuntu LTS (breiter Support)?
- [ ] Branding: Eigenes Gehaeuse/Aufkleber oder neutraler Mini PC?
- [ ] Garantie/Support: 1 Jahr vs. 2 Jahre? Austauschgeraet bei Defekt?
- [ ] App-Lizenzierung: Alle Apps inklusive oder modulares Lizenzmodell?
- [ ] LLM lokal: Ollama als optionales Modul? Welche Modelle passen in 16/32 GB?
- [ ] Backup-Cloud: Eigene S3-Instanz oder Hetzner Storage Box als Backup-Ziel?
- [ ] Pilotprojekt: Welcher Kunde/Anwendungsfall fuer den ersten Prototyp?

## Naechste Schritte

1. **Prototyp bauen**: N305 Mini PC oder M75q Gen 2 bestellen, Mana Stack als Docker Compose aufsetzen
2. **Benchmarken**: RAM/CPU-Verbrauch mit 5, 15, 30 simulierten Usern messen
3. **Provisioning-Image**: Reproduzierbares Debian-Image mit Packer oder cloud-init erstellen
4. **Remote-Management**: Tailscale/Headscale Setup testen
5. **Pricing validieren**: Gespraeche mit potenziellen Pilotkunden fuehren
