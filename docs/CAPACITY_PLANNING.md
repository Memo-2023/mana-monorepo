# Kapazitaetsplanung & Hardware-Ressourcen

Stand: 2026-03-28

## Hardware-Uebersicht

### Mac Mini M4 (Produktionsserver)

| Ressource | Wert |
|-----------|------|
| **CPU** | Apple M4, 10 Cores (4P + 6E) |
| **RAM** | 16 GB Unified Memory |
| **GPU** | 10-Core Metal (geteilt mit CPU/RAM) |
| **Storage intern** | 228 GB SSD |
| **Storage extern** | 4 TB SSD (USB-C, ~1 GB/s) |
| **Netzwerk** | Cloudflare Tunnel (kein direktes Port-Forwarding) |

### Windows GPU Server (AI-Workloads)

| Ressource | Wert |
|-----------|------|
| **GPU** | NVIDIA RTX 3090, 24 GB VRAM |
| **Netzwerk** | LAN (192.168.178.11), Tunnel-Subdomains unter gpu-*.mana.how |
| **Services** | Ollama (11434), STT (3020), TTS (3022), Image Gen (3023) |
| **Status** | **Aktiv** — alle AI-Services vom Mac Mini hierher verlagert |

## Aktuelle Auslastung (Mac Mini)

### Container-Uebersicht (61 Container)

| Kategorie | Anzahl | Geschaetzter RAM |
|-----------|--------|------------------|
| Infrastruktur (Postgres, Redis, MinIO, Forgejo) | 7 | ~2.5 GB |
| Core Services (Auth, Credits, User, Subs, Analytics) | 5 | ~0.8 GB |
| Go Services (Gateway, Sync, Search, Notify, Crawler, Media) | 6 | ~0.3 GB |
| Web Apps (SvelteKit, 19 Apps) | 19 | ~3.0 GB |
| Backends (NestJS/Hono) | 3 | ~0.5 GB |
| Matrix (Synapse, Element, Bots) | 4 | ~1.0 GB |
| Monitoring (Grafana, Victoria, Loki, cAdvisor, etc.) | 13 | ~2.0 GB |
| Sonstiges (Watchtower, Landing Builder, LLM) | 4 | ~0.5 GB |
| **Gesamt** | **61** | **~10.6 GB** |

### Native Services (deaktiviert seit 2026-03-28)

Ollama, FLUX.2 und Telegram Bot wurden auf den GPU-Server migriert.
Keine nativen AI-Services mehr auf dem Mac Mini.

### RAM-Budget

```
Verfuegbar:           16.0 GB
Docker Container:    -10.6 GB
macOS Overhead:       -1.5 GB
─────────────────────────────
Frei fuer Builds/Peaks: 3.9 GB  ← stabil, kein Ollama-Konflikt
```

Keine RAM-Konkurrenz mit LLM-Modellen mehr. Build-Script muss Monitoring-Container
nur noch bei grossen Multi-App-Builds stoppen.

## Kapazitaetsschaetzung nach Workload-Typ

### Tier 1: Statische/Local-First Apps (wenig Server-Last)

Apps wie Todo, Calendar, Clock, Zitare, Contacts, etc.

| Metrik | Wert | Begruendung |
|--------|------|-------------|
| Gleichzeitige User | **100-200** | Local-first: Reads aus IndexedDB, Server nur fuer Sync |
| Sync-Connections (WebSocket) | **~50 aktiv** | mana-sync (Go) ist sehr effizient, ~10 KB/Connection |
| Bottleneck | Cloudflare Tunnel Latenz (~4s first byte) | Nicht die App selbst |

### Tier 2: API-lastige Apps (Chat, Questions, Context)

| Metrik | Wert | Begruendung |
|--------|------|-------------|
| Gleichzeitige User | **20-50** | Abhaengig von Postgres-Connections (max 20 pro Service) |
| API Requests/sec | **~100-200** | NestJS/Hono koennen mehr, DB ist Limit |
| Bottleneck | PostgreSQL Connections + RAM | |

### Tier 3: AI-Workloads (GPU-Server, RTX 3090)

| Metrik | Wert | Begruendung |
|--------|------|-------------|
| LLM gleichzeitig | **5** | OLLAMA_MAX_CONCURRENT=5, 24 GB VRAM |
| LLM Durchsatz | **~80-100 tokens/sec** (12B) | CUDA deutlich schneller als Metal |
| Bildgenerierung | **3-5 gleichzeitig** | ~0.5s pro 1024x1024 Bild |
| Bottleneck | **VRAM (24 GB)** | Aber kein Konflikt mit Hosting |

### Gesamtschaetzung (nach GPU-Offload)

| Szenario | Max. gleichzeitige User |
|----------|------------------------|
| Nur Local-First Apps | ~200 |
| Mixed (Local-First + API) | ~100-150 |
| Mit aktiver LLM-Nutzung | ~80-120 |
| Peak (alle Services + LLM + Bildgen) | **~80-150** |

## Bottleneck-Analyse

| Rang | Bottleneck | Auswirkung | Loesung |
|------|-----------|------------|---------|
| 1 | **Cloudflare Tunnel Latenz** | ~4s TTFB fuer erste Requests | CDN/Workers fuer statische Assets |
| 2 | **PostgreSQL Connections** | Max 20 pro Service, shared DB | Connection Pooling (PgBouncer) |
| 3 | **Single Server** | Kein Failover, kein horizontales Scaling | Zweiter Mac Mini oder Cloud-Burst |
| 4 | **GPU-Server LAN-Latenz** | <1ms, vernachlaessigbar | Kein Handlungsbedarf |

## Scaling-Roadmap

### Phase 1: Optimierung (0 EUR)

- [x] GPU-Server ueber LAN anbinden → alle AI-Last vom Mac Mini verlagert
- [x] Ollama/FLUX.2/Telegram-Bot auf Mac Mini deaktiviert
- [x] Registrierungslimit implementiert (MAX_DAILY_SIGNUPS, default: unlimitiert)
- [x] Health-Checks und status.sh auf GPU-Server umgestellt
- [x] Docker Desktop → Colima migrieren (~10 GB RAM gespart, MIT-Lizenz)
- [ ] PgBouncer fuer Connection Pooling einrichten
- [ ] Cloudflare Cache Rules fuer statische Assets
- [ ] Registrierungslimit aktivieren (5/Tag) in .env auf Server

### Phase 2: RAM-Upgrade (~700 EUR)

- [ ] Neuer Mac Mini M4 mit 32 GB → doppelte Kapazitaet
- [ ] Oder: gebrauchter Mac Mini M2 als zweiter Server
- [ ] Registrierungslimit auf 15/Tag erhoehen

### Phase 3: Horizontales Scaling (~50 EUR/Monat)

- [ ] Hetzner VPS fuer statische Web-Apps (CAX21: 8 GB, 4 vCPU, ~8 EUR/Monat)
- [ ] Oder: Coolify/Kamal auf dediziertem Server
- [ ] Registrierungslimit auf 50/Tag erhoehen

### Phase 4: Production-Grade (~200 EUR/Monat)

- [ ] Managed PostgreSQL (z.B. Supabase, Neon)
- [ ] CDN fuer alle Web-Apps
- [ ] Multi-Server mit Load Balancing
- [ ] Registrierungslimit entfernen oder auf 500/Tag

## Registrierungslimit ("Organic Growth Gate")

Siehe Implementierung in `services/mana-auth/src/services/signup-limit.ts`.

### Konzept

Pro Tag koennen sich maximal X neue Nutzer registrieren. Das Limit ist konfigurierbar und waechst mit der Hardware.

### Vorteile

1. **Infrastruktur-Schutz:** Hardware waechst mit der Community
2. **Exklusivitaet:** "Heute noch 2 Plaetze frei" erzeugt Nachfrage
3. **Qualitaet:** Fruehe User geben besseres Feedback
4. **Kostenlos:** Kein Over-Provisioning noetig

### Geplante Limits

| Phase | Limit | Kumuliert/30 Tage | Hardware |
|-------|-------|-------------------|----------|
| Start | 5/Tag | ~150 User | Mac Mini 16 GB |
| Phase 2 | 15/Tag | ~450 User | Mac Mini 32 GB |
| Phase 3 | 50/Tag | ~1500 User | Multi-Server |

## Load Testing

Load Tests liegen in `load-tests/`. Siehe `load-tests/README.md` fuer Ausfuehrung.

### Empfohlene Test-Zyklen

1. **Vor jedem Hardware-Upgrade:** Baseline messen
2. **Nach Limit-Erhoehung:** Verifizieren dass Hardware haelt
3. **Monatlich:** Regression erkennen
