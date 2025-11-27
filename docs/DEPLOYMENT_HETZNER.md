# Hetzner Deployment Guide

Dieses Dokument beschreibt verschiedene Deployment-Optionen für das Manacore Monorepo auf Hetzner Cloud Infrastructure.

## Inhaltsverzeichnis

- [Bestandsaufnahme](#bestandsaufnahme)
- [Option 1: Single Server](#option-1-single-server-einfach--günstig)
- [Option 2: Dual-Server mit Floating IP](#option-2-dual-server-mit-floating-ip)
- [Option 3: Kubernetes Cluster](#option-3-kubernetes-cluster-enterprise)
- [Option 4: Hybrid mit Docker Swarm](#option-4-hybrid-mit-docker-swarm-empfohlen)
- [Vergleichstabelle](#vergleichstabelle)
- [Empfehlung](#empfehlung)
- [Implementierungsdetails](#implementierungsdetails)

---

## Bestandsaufnahme

### Zu deployende Komponenten

| Typ | Anzahl | Technologie | Deployment-Ziel |
|-----|--------|-------------|-----------------|
| **Backends** | 10 | NestJS | Container |
| **Web Apps** | 11 | SvelteKit (SSR) | Container |
| **Landing Pages** | 11 | Astro (statisch) | CDN/Static |
| **Auth Service** | 1 | NestJS | Container |
| **Datenbanken** | 2 | PostgreSQL + Redis | Dedicated/Managed |
| **Mobile Apps** | 10 | Expo | App Stores (nicht Hetzner) |

### Backend-Services im Detail

| Service | Package | Port | Datenbank |
|---------|---------|------|-----------|
| mana-core-auth | `mana-core-auth` | 3001 | PostgreSQL + Redis |
| Chat Backend | `@chat/backend` | 3002 | PostgreSQL |
| Maerchenzauber Backend | `@maerchenzauber/backend` | 3003 | Supabase |
| Manadeck Backend | `@manadeck/backend` | 3004 | Supabase |
| Picture Backend | `@picture/backend` | 3005 | PostgreSQL |
| Transcriber Backend | `@transcriber/backend` | 3006 | Filesystem |
| Nutriphi Backend | `@nutriphi/backend` | 3007 | Supabase |
| News API | `@news/api` | 3008 | PostgreSQL |
| Quote Backend | `@quote/backend` | 3009 | PostgreSQL |
| Uload Backend | `@uload/backend` | 3010 | PostgreSQL |

### Ressourcenanforderungen (geschätzt)

| Komponente | RAM | CPU | Storage |
|------------|-----|-----|---------|
| NestJS Backend (pro Service) | 200-400 MB | 0.25 vCPU | 100 MB |
| SvelteKit Web App (pro App) | 150-300 MB | 0.25 vCPU | 50 MB |
| PostgreSQL | 1-2 GB | 1 vCPU | 10-50 GB |
| Redis | 256-512 MB | 0.25 vCPU | 1 GB |
| Traefik/Nginx | 128 MB | 0.25 vCPU | 100 MB |

**Gesamt (Minimum):** ~8 GB RAM, 4 vCPU, 100 GB Storage

---

## Option 1: Single Server (Einfach & Günstig)

### Kosten: ~€30-50/Monat

### Architektur

```
┌─────────────────────────────────────────────────────────┐
│                    Hetzner CX41/CX51                     │
│                   (8 vCPU, 16-32 GB RAM)                │
├─────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐     │
│  │   Traefik   │  │   Docker    │  │  PostgreSQL │     │
│  │  (Reverse   │  │  Compose    │  │    Redis    │     │
│  │   Proxy)    │  │  (All Apps) │  │             │     │
│  └─────────────┘  └─────────────┘  └─────────────┘     │
│                                                          │
│  Backends: 10 Container (~200MB RAM each)               │
│  Web Apps: 10 Container (SSR)                           │
│  Landing: Statisch via Traefik                          │
└─────────────────────────────────────────────────────────┘
```

### Hetzner Server Empfehlung

| Server | vCPU | RAM | Storage | Preis |
|--------|------|-----|---------|-------|
| CX41 | 8 | 16 GB | 160 GB | ~€28/Monat |
| CX51 | 16 | 32 GB | 240 GB | ~€58/Monat |

### Vorteile

- Einfache Verwaltung
- Günstig
- Schnelle Einrichtung
- Ein Server = ein Backup

### Nachteile

- Kein Failover (Single Point of Failure)
- Downtime bei Updates
- Keine horizontale Skalierung
- Server-Ausfall = kompletter Ausfall

### Wann geeignet?

- Entwicklung/Staging
- MVP/Early Stage
- Budget-kritische Projekte
- Wenig Traffic (<1000 DAU)

---

## Option 2: Dual-Server mit Floating IP

### Kosten: ~€80-120/Monat

### Architektur

```
                    ┌─────────────────┐
                    │  Floating IP    │
                    │  (Failover)     │
                    └────────┬────────┘
                             │
              ┌──────────────┴──────────────┐
              │                             │
    ┌─────────▼─────────┐       ┌──────────▼─────────┐
    │   Server 1 (CX31) │       │   Server 2 (CX31)  │
    │   PRIMARY         │       │   STANDBY          │
    ├───────────────────┤       ├────────────────────┤
    │ • Traefik         │       │ • Traefik          │
    │ • All Backends    │◄─────►│ • All Backends     │
    │ • Web Apps        │ sync  │ • Web Apps         │
    │ • PostgreSQL      │       │ • PostgreSQL       │
    │   (Primary)       │       │   (Replica)        │
    │ • Redis           │       │ • Redis Sentinel   │
    └───────────────────┘       └────────────────────┘
              │                             │
              └──────────────┬──────────────┘
                             │
                    ┌────────▼────────┐
                    │  Hetzner Volume │
                    │  (Shared Data)  │
                    └─────────────────┘
```

### Komponenten

| Komponente | Funktion |
|------------|----------|
| **Floating IP** | Virtuelle IP, die zwischen Servern wechseln kann |
| **Keepalived** | VRRP-Daemon für automatisches Failover |
| **PostgreSQL Streaming Replication** | Echtzeit-Datenbank-Replikation |
| **Redis Sentinel** | Redis High Availability |
| **Litestream/pgBackRest** | Kontinuierliche Backups |

### Server-Konfiguration

```yaml
# Server 1 & 2 identisch
Server: CX31
vCPU: 4
RAM: 8 GB
Storage: 80 GB
Kosten: ~€15/Monat pro Server

# Zusätzlich
Floating IP: €4/Monat
Volume (100GB): €4.40/Monat
```

### Failover-Prozess

1. Keepalived erkennt Server-Ausfall (Health Check)
2. Floating IP wird auf Standby-Server umgeleitet (~30 Sekunden)
3. PostgreSQL Replica wird zu Primary promoted
4. Redis Sentinel wählt neuen Master

### Vorteile

- Automatisches Failover (~30 Sekunden)
- Keine Downtime bei Updates (Rolling)
- Datenbank-Replikation
- Gutes Preis-Leistungs-Verhältnis

### Nachteile

- Mehr Komplexität als Single Server
- PostgreSQL Failover kann komplex sein
- Keepalived-Konfiguration erforderlich

### Wann geeignet?

- Produktions-Workloads
- 99.9% Uptime-Anforderung
- Mittlerer Traffic (1000-10000 DAU)

---

## Option 3: Kubernetes Cluster (Enterprise)

### Kosten: ~€150-300/Monat

### Architektur

```
                         ┌─────────────────┐
                         │  Hetzner LB     │
                         │  (Cloud-native) │
                         └────────┬────────┘
                                  │
        ┌─────────────────────────┼─────────────────────────┐
        │                         │                         │
┌───────▼───────┐       ┌────────▼────────┐       ┌────────▼───────┐
│   Node 1      │       │    Node 2       │       │    Node 3      │
│   (CX21)      │       │    (CX21)       │       │    (CX21)      │
├───────────────┤       ├─────────────────┤       ├────────────────┤
│  k3s Worker   │       │   k3s Worker    │       │  k3s Worker    │
│  • Pods       │       │   • Pods        │       │  • Pods        │
│  • Services   │       │   • Services    │       │  • Services    │
└───────────────┘       └─────────────────┘       └────────────────┘
        │                         │                         │
        └─────────────────────────┼─────────────────────────┘
                                  │
                    ┌─────────────┴─────────────┐
                    │                           │
           ┌────────▼────────┐       ┌──────────▼─────────┐
           │ Hetzner Managed │       │  Hetzner Volume    │
           │ PostgreSQL      │       │  (Persistent)      │
           │ (Optional)      │       │                    │
           └─────────────────┘       └────────────────────┘
```

### Kubernetes Stack

```yaml
Cluster:
  - k3s (leichtgewichtiges Kubernetes)
  - 3 Nodes minimum für HA Control Plane

Ingress:
  - Traefik (in k3s integriert)
  - oder NGINX Ingress Controller

TLS:
  - cert-manager
  - Let's Encrypt (automatische Zertifikate)

Storage:
  - Longhorn (Distributed Block Storage)
  - oder Hetzner CSI Driver

GitOps:
  - ArgoCD oder Flux
  - Automatische Deployments aus Git

Monitoring:
  - Prometheus
  - Grafana
  - Alertmanager

Logging:
  - Loki
  - Promtail
```

### Server-Konfiguration

```yaml
# k3s Nodes
3x CX21:
  vCPU: 2
  RAM: 4 GB
  Storage: 40 GB
  Kosten: ~€6/Monat pro Node = €18/Monat

# Oder für mehr Ressourcen
3x CX31:
  vCPU: 4
  RAM: 8 GB
  Storage: 80 GB
  Kosten: ~€15/Monat pro Node = €45/Monat

# Load Balancer
Hetzner LB: €5/Monat

# Volumes für Persistent Storage
3x 50GB Volumes: ~€7/Monat
```

### Vorteile

- Auto-Scaling (Horizontal Pod Autoscaler)
- Self-Healing (automatischer Pod-Restart)
- Rolling Updates ohne Downtime
- Deklarative Konfiguration
- Multi-Zone möglich
- Industry Standard

### Nachteile

- Hohe Komplexität
- Steile Lernkurve
- Overhead für kleine Teams
- Mehr Ressourcen für Control Plane

### Wann geeignet?

- Enterprise-Anforderungen
- Großes Team mit K8s-Erfahrung
- Hoher Traffic (>10000 DAU)
- Microservices-Architektur
- Multi-Tenant-Anforderungen

---

## Option 4: Hybrid mit Docker Swarm (Empfohlen)

### Kosten: ~€100-150/Monat

### Architektur

```
┌─────────────────────────────────────────────────────────────────┐
│                        HETZNER CLOUD                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   ┌─────────────────┐              ┌─────────────────┐          │
│   │  Load Balancer  │              │   Cloud Firewall │          │
│   │   (Hetzner LB)  │              │                  │          │
│   └────────┬────────┘              └──────────────────┘          │
│            │                                                     │
│   ┌────────┴────────────────────────────────┐                   │
│   │                                          │                   │
│   ▼                                          ▼                   │
│ ┌──────────────────┐              ┌──────────────────┐          │
│ │   App Server 1   │              │   App Server 2   │          │
│ │     (CX31)       │              │     (CX31)       │          │
│ ├──────────────────┤              ├──────────────────┤          │
│ │ Docker Swarm     │◄────────────►│ Docker Swarm     │          │
│ │ Manager + Worker │    Overlay   │ Manager + Worker │          │
│ │                  │    Network   │                  │          │
│ │ • All Backends   │              │ • All Backends   │          │
│ │ • Web Apps       │              │ • Web Apps       │          │
│ │ • Traefik        │              │ • Traefik        │          │
│ └──────────────────┘              └──────────────────┘          │
│            │                                │                    │
│            └────────────────┬───────────────┘                   │
│                             │                                    │
│                    ┌────────▼────────┐                          │
│                    │   DB Server     │                          │
│                    │    (CX21)       │                          │
│                    ├─────────────────┤                          │
│                    │ • PostgreSQL 16 │                          │
│                    │ • Redis 7       │                          │
│                    │ • Daily Backups │                          │
│                    │   → Object      │                          │
│                    │     Storage     │                          │
│                    └─────────────────┘                          │
│                                                                  │
│   ┌─────────────────────────────────────────────────────┐       │
│   │              Hetzner Object Storage                  │       │
│   │         (Backups, Static Assets, Media)              │       │
│   └─────────────────────────────────────────────────────┘       │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘

                              │
                              ▼
              ┌───────────────────────────────┐
              │        EXTERNAL CDN           │
              │      (Cloudflare Free)        │
              │  • Static Assets              │
              │  • DDoS Protection            │
              │  • SSL Termination            │
              └───────────────────────────────┘
```

### Warum Docker Swarm?

Docker Swarm bietet die wichtigsten Features von Kubernetes mit deutlich weniger Komplexität:

| Feature | Docker Swarm | Kubernetes |
|---------|--------------|------------|
| Lernkurve | Niedrig | Hoch |
| Setup-Zeit | Minuten | Stunden/Tage |
| Service Discovery | Built-in | Benötigt Config |
| Load Balancing | Built-in | Benötigt Ingress |
| Rolling Updates | Built-in | Built-in |
| Secrets Management | Built-in | Built-in |
| Ressourcen-Overhead | Minimal | Signifikant |

### Server-Konfiguration

```yaml
# App Server 1 & 2
2x CX31:
  vCPU: 4
  RAM: 8 GB
  Storage: 80 GB
  Kosten: €15/Monat × 2 = €30/Monat

# Database Server
1x CX21:
  vCPU: 2
  RAM: 4 GB
  Storage: 40 GB + 100GB Volume
  Kosten: €6/Monat + €4.40/Monat = €10.40/Monat

# Load Balancer
Hetzner LB:
  Kosten: €5/Monat

# Object Storage (Backups)
100 GB:
  Kosten: ~€5/Monat

# Cloud Firewall
Kostenlos

# Private Network
Kostenlos

─────────────────────────────
Gesamt: ~€50-55/Monat Basis
        + Traffic-Kosten
```

### Docker Swarm Stack

```yaml
# docker-stack.yml
version: "3.8"

services:
  # Reverse Proxy
  traefik:
    image: traefik:v3.0
    deploy:
      replicas: 2
      placement:
        constraints:
          - node.role == manager
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock:ro
      - traefik-certs:/letsencrypt

  # Auth Service
  mana-core-auth:
    image: ghcr.io/your-org/mana-core-auth:latest
    deploy:
      replicas: 2
      update_config:
        parallelism: 1
        delay: 10s
        failure_action: rollback
      restart_policy:
        condition: on-failure
    environment:
      - DATABASE_URL=postgresql://...
    labels:
      - "traefik.http.routers.auth.rule=Host(`auth.yourdomain.com`)"

  # Backend Services (repeat for each)
  chat-backend:
    image: ghcr.io/your-org/chat-backend:latest
    deploy:
      replicas: 2
    labels:
      - "traefik.http.routers.chat-api.rule=Host(`api.chat.yourdomain.com`)"

  # Web Apps (repeat for each)
  chat-web:
    image: ghcr.io/your-org/chat-web:latest
    deploy:
      replicas: 2
    labels:
      - "traefik.http.routers.chat-web.rule=Host(`chat.yourdomain.com`)"

volumes:
  traefik-certs:

networks:
  default:
    driver: overlay
    attachable: true
```

### Vorteile

- Einfacher als Kubernetes
- Native Docker-Erfahrung nutzbar
- Built-in Service Discovery & Load Balancing
- Rolling Updates ohne Downtime
- Overlay-Network für sichere Kommunikation
- Hetzner LB für echte HA

### Nachteile

- Weniger Features als Kubernetes
- Kleineres Ökosystem
- Kein HPA (Horizontal Pod Autoscaler)

### Wann geeignet?

- Produktions-Workloads
- Kleine bis mittlere Teams
- Docker-Erfahrung vorhanden
- Mittlerer Traffic (1000-50000 DAU)

---

## Vergleichstabelle

| Feature | Option 1 | Option 2 | Option 3 | Option 4 |
|---------|----------|----------|----------|----------|
| **Kosten/Monat** | €30-50 | €80-120 | €150-300 | €100-150 |
| **Ausfallsicherheit** | ❌ | ✅ | ✅✅ | ✅ |
| **Auto-Failover** | ❌ | ✅ (30s) | ✅ (<10s) | ✅ (10-30s) |
| **Komplexität** | Niedrig | Mittel | Hoch | Mittel |
| **Skalierbarkeit** | ❌ | ⚠️ | ✅✅ | ✅ |
| **Zero-Downtime Deploy** | ❌ | ✅ | ✅ | ✅ |
| **Wartungsaufwand** | Niedrig | Mittel | Hoch | Mittel |
| **Backup/Recovery** | Manuell | Auto | Auto | Auto |
| **Setup-Zeit** | 1 Tag | 2-3 Tage | 1 Woche | 2-3 Tage |
| **Team-Größe** | 1 Person | 1-2 Personen | 2+ Personen | 1-2 Personen |

---

## Empfehlung

### Für Manacore Monorepo: **Option 4 (Hybrid mit Docker Swarm)**

**Begründung:**

1. **Richtige Balance** zwischen Komplexität und Features
2. **Docker Swarm** ist deutlich einfacher als Kubernetes, bietet aber:
   - Service Discovery
   - Load Balancing
   - Rolling Updates
   - Health Checks
   - Secrets Management
3. **Hetzner Load Balancer** für echte HA ohne komplexe Floating-IP-Konfiguration
4. **Separater DB-Server** für:
   - Bessere Performance
   - Einfachere Backups
   - Unabhängige Skalierung
5. **Cloudflare** als kostenloses CDN + DDoS-Schutz
6. **Object Storage** für Backups und Media-Dateien

### Migrationspfad

```
Option 1 (Dev/Staging)
        ↓
Option 4 (Production)
        ↓
Option 3 (bei Bedarf für Enterprise-Scale)
```

---

## Implementierungsdetails

### Nächste Schritte

1. **Dockerfiles erstellen** für alle Services
2. **CI/CD Pipeline** mit GitHub Actions
3. **Hetzner Infrastruktur** provisionieren (Terraform)
4. **Docker Swarm** einrichten
5. **Monitoring** mit Prometheus/Grafana
6. **Backup-Strategie** implementieren

### Geschätzte Implementierungszeit

| Phase | Dauer | Beschreibung |
|-------|-------|--------------|
| Dockerfiles | 2-3 Tage | Alle Services containerisieren |
| CI/CD | 1-2 Tage | GitHub Actions Pipelines |
| Infrastruktur | 1 Tag | Hetzner Setup (Terraform) |
| Swarm Setup | 1 Tag | Cluster initialisieren |
| Deployment | 1-2 Tage | Services deployen & testen |
| Monitoring | 1 Tag | Prometheus, Grafana, Alerts |
| **Gesamt** | **~1-2 Wochen** | |

---

## Weiterführende Dokumente

- [DOCKERFILES.md](./DOCKERFILES.md) - Docker-Konfiguration für alle Services
- [CI_CD.md](./CI_CD.md) - GitHub Actions Pipelines
- [TERRAFORM.md](./TERRAFORM.md) - Infrastructure as Code
- [MONITORING.md](./MONITORING.md) - Prometheus & Grafana Setup
- [BACKUP_STRATEGY.md](./BACKUP_STRATEGY.md) - Backup & Recovery

---

*Erstellt: November 2025*
*Letzte Aktualisierung: November 2025*
