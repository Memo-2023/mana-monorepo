# Self-Hosting Guide - Manacore Monorepo

Komplette Anleitung zum Hosten aller Projekte auf eigener Infrastruktur (VPS).

## Projektübersicht

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          MANACORE MONOREPO                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │ MAERCHENZAUBER│  │   MANACORE   │  │   MANADECK   │  │    MEMORO    │    │
│  │  (Storyteller)│  │  (Auth Hub)  │  │  (Deck App)  │  │  (Voice App) │    │
│  ├──────────────┤  ├──────────────┤  ├──────────────┤  ├──────────────┤    │
│  │ • Web        │  │ • Web        │  │ • Web        │  │ • Web        │    │
│  │ • Mobile     │  │ • Mobile     │  │ • Mobile     │  │ • Mobile     │    │
│  │ • Landing    │  │ • Landing    │  │ • Landing    │  │ • Landing    │    │
│  │ • Backend    │  │              │  │ • Backend    │  │              │    │
│  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘    │
│                                                                              │
│  ┌──────────────┐  ┌──────────────┐                                         │
│  │   PICTURE    │  │    ULOAD     │                                         │
│  │ (Canvas App) │  │(URL Shortener)│                                         │
│  ├──────────────┤  ├──────────────┤                                         │
│  │ • Web        │  │ • Web        │                                         │
│  │ • Mobile     │  │              │                                         │
│  │ • Landing    │  │              │                                         │
│  └──────────────┘  └──────────────┘                                         │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Technologie-Stack pro Projekt

| Projekt            | Web App   | Landing | Backend | Mobile | Datenbank          |
| ------------------ | --------- | ------- | ------- | ------ | ------------------ |
| **Maerchenzauber** | SvelteKit | Astro   | NestJS  | Expo   | Supabase           |
| **Manacore**       | SvelteKit | Astro   | -       | Expo   | Supabase           |
| **Manadeck**       | SvelteKit | Astro   | NestJS  | Expo   | PostgreSQL         |
| **Memoro**         | SvelteKit | Astro   | -       | Expo   | Supabase           |
| **Picture**        | SvelteKit | Astro   | -       | Expo   | Supabase           |
| **uLoad**          | SvelteKit | -       | -       | -      | PostgreSQL + Redis |

---

## Deployment-Optionen im Überblick

### Option A: Single VPS mit Coolify (Empfohlen für Start)

- **Kosten:** ~€15-30/Monat
- **Komplexität:** Niedrig
- **Skalierung:** Begrenzt

### Option B: Multi-VPS mit Coolify

- **Kosten:** ~€50-100/Monat
- **Komplexität:** Mittel
- **Skalierung:** Gut

### Option C: Kubernetes (K3s)

- **Kosten:** ~€30-80/Monat
- **Komplexität:** Hoch
- **Skalierung:** Sehr gut

### Option D: Hybrid (Self-Hosted + Managed)

- **Kosten:** ~€20-50/Monat + Supabase
- **Komplexität:** Niedrig-Mittel
- **Skalierung:** Flexibel

---

# Option A: Single VPS mit Coolify

Die einfachste Lösung für den Start. Alle Services auf einem Server.

## Architektur

```
┌─────────────────────────────────────────────────────────────────┐
│                    Hetzner VPS (CX31+)                          │
│                    4 vCPU, 8GB RAM, 80GB                        │
├─────────────────────────────────────────────────────────────────┤
│                         COOLIFY                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                      TRAEFIK                             │   │
│  │              (Reverse Proxy + SSL)                       │   │
│  └─────────────────────────────────────────────────────────┘   │
│         │              │              │              │          │
│  ┌──────┴──────┐ ┌─────┴─────┐ ┌─────┴─────┐ ┌─────┴─────┐    │
│  │  Web Apps   │ │  Backends │ │ Databases │ │  Landing  │    │
│  │  (Node.js)  │ │ (NestJS)  │ │ (PG+Redis)│ │  (Astro)  │    │
│  │  :3000-3005 │ │ :4000-4001│ │ :5432,6379│ │  :8080+   │    │
│  └─────────────┘ └───────────┘ └───────────┘ └───────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

## Ressourcen-Anforderungen

| Komponente        | RAM      | CPU    | Disk      |
| ----------------- | -------- | ------ | --------- |
| PostgreSQL        | 1GB      | 0.5    | 10GB      |
| Redis             | 256MB    | 0.2    | 1GB       |
| Coolify           | 512MB    | 0.3    | 5GB       |
| Traefik           | 128MB    | 0.1    | -         |
| Pro Web App       | 256MB    | 0.3    | -         |
| Pro Backend       | 512MB    | 0.5    | -         |
| Pro Landing       | 64MB     | 0.1    | -         |
| **Gesamt (alle)** | **~6GB** | **~4** | **~30GB** |

**Empfohlener Server:** Hetzner CX31 (4 vCPU, 8GB RAM, 80GB) - €8.98/Monat

## Schritt-für-Schritt Setup

### 1. VPS bestellen und Coolify installieren

```bash
# SSH zum Server
ssh root@YOUR-IP

# System updaten
apt update && apt upgrade -y

# Coolify installieren
curl -fsSL https://cdn.coollabs.io/coolify/install.sh | bash
```

### 2. Datenbank-Services erstellen

**PostgreSQL:**

```
Name: shared-postgres
Version: 16-alpine
Databases: manacore, manadeck, uload
```

**Redis:**

```
Name: shared-redis
Version: 7-alpine
```

### 3. Projekte deployen

#### Deployment-Reihenfolge (wichtig!)

1. **Datenbanken** (PostgreSQL, Redis)
2. **Backends** (Maerchenzauber, Manadeck)
3. **Web Apps** (alle)
4. **Landing Pages** (alle)

#### Konfiguration pro Projekt

**Alle SvelteKit Web Apps:**

```
Base Directory: /
Dockerfile: {projekt}/apps/web/Dockerfile  # Falls vorhanden
oder
Build Pack: Nixpacks
Build Command: cd {projekt}/apps/web && pnpm build
Start Command: cd {projekt}/apps/web && node build
Port: 3000
```

**Alle Astro Landing Pages:**

```
Build Pack: Static
Base Directory: {projekt}/apps/landing
Build Command: pnpm build
Publish Directory: dist
```

**NestJS Backends:**

```
Base Directory: /
Dockerfile: {projekt}/apps/backend/Dockerfile
oder
Dockerfile: {projekt}/backend/Dockerfile
Port: 4000
```

### 4. Domain-Mapping

| Service                | Domain                | Port |
| ---------------------- | --------------------- | ---- |
| uload-web              | ulo.ad                | 3000 |
| maerchenzauber-web     | app.maerchenzauber.de | 3001 |
| maerchenzauber-landing | maerchenzauber.de     | 8080 |
| maerchenzauber-backend | api.maerchenzauber.de | 4000 |
| manacore-web           | app.manacore.io       | 3002 |
| manacore-landing       | manacore.io           | 8081 |
| manadeck-web           | app.manadeck.de       | 3003 |
| manadeck-landing       | manadeck.de           | 8082 |
| manadeck-backend       | api.manadeck.de       | 4001 |
| memoro-web             | app.memoro.ai         | 3004 |
| memoro-landing         | memoro.ai             | 8083 |
| picture-web            | app.picture.io        | 3005 |
| picture-landing        | picture.io            | 8084 |

---

# Option B: Multi-VPS mit Coolify

Bessere Isolation und Skalierung durch mehrere Server.

## Architektur

```
                           ┌─────────────────┐
                           │   DNS / CDN     │
                           │  (Cloudflare)   │
                           └────────┬────────┘
                                    │
        ┌───────────────────────────┼───────────────────────────┐
        │                           │                           │
        ▼                           ▼                           ▼
┌───────────────┐         ┌───────────────┐         ┌───────────────┐
│    VPS 1      │         │    VPS 2      │         │    VPS 3      │
│   (Apps)      │         │  (Backends)   │         │ (Databases)   │
│   CX21        │         │    CX21       │         │    CX31       │
├───────────────┤         ├───────────────┤         ├───────────────┤
│ • Web Apps    │ ◄─────► │ • NestJS APIs │ ◄─────► │ • PostgreSQL  │
│ • Landing     │         │ • Workers     │         │ • Redis       │
│   Pages       │         │               │         │ • Backups     │
└───────────────┘         └───────────────┘         └───────────────┘
```

## Server-Aufteilung

### VPS 1: Frontend (CX21 - €4.49/Monat)

- Alle SvelteKit Web Apps
- Alle Astro Landing Pages
- Traefik Reverse Proxy

### VPS 2: Backends (CX21 - €4.49/Monat)

- Maerchenzauber NestJS Backend
- Manadeck NestJS Backend
- Background Workers

### VPS 3: Datenbanken (CX31 - €8.98/Monat)

- PostgreSQL (shared)
- Redis (shared)
- Automated Backups

**Gesamtkosten:** ~€18/Monat

## Einrichtung

### VPS 3 (Datenbanken) zuerst

```bash
# Coolify installieren
curl -fsSL https://cdn.coollabs.io/coolify/install.sh | bash

# PostgreSQL mit externem Zugriff
# In Coolify: Network → Enable External Access
```

### VPS 2 (Backends)

```bash
# Coolify installieren
# Backends deployen mit DATABASE_URL zu VPS 3
```

### VPS 1 (Frontends)

```bash
# Coolify installieren
# Web Apps deployen mit API_URL zu VPS 2
```

## Netzwerk-Sicherheit

```bash
# Auf VPS 3 (Datenbanken): Nur VPS 1+2 erlauben
ufw allow from VPS1-IP to any port 5432
ufw allow from VPS2-IP to any port 5432
ufw allow from VPS1-IP to any port 6379
ufw allow from VPS2-IP to any port 6379
ufw deny 5432
ufw deny 6379
```

---

# Option C: Kubernetes mit K3s

Für maximale Skalierung und Automatisierung.

## Architektur

```
┌─────────────────────────────────────────────────────────────────┐
│                      K3s Cluster                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                    INGRESS (Traefik)                       │ │
│  └────────────────────────────────────────────────────────────┘ │
│                              │                                   │
│  ┌───────────────────────────┼───────────────────────────────┐  │
│  │                           │                               │  │
│  │   ┌─────────────┐   ┌─────────────┐   ┌─────────────┐    │  │
│  │   │  Namespace  │   │  Namespace  │   │  Namespace  │    │  │
│  │   │   uload     │   │ maerchen-   │   │  manadeck   │    │  │
│  │   │             │   │   zauber    │   │             │    │  │
│  │   │ ┌─────────┐ │   │ ┌─────────┐ │   │ ┌─────────┐ │    │  │
│  │   │ │ web:3   │ │   │ │ web:2   │ │   │ │ web:2   │ │    │  │
│  │   │ │ replicas│ │   │ │ backend │ │   │ │ backend │ │    │  │
│  │   │ └─────────┘ │   │ │ landing │ │   │ │ landing │ │    │  │
│  │   └─────────────┘   │ └─────────┘ │   │ └─────────┘ │    │  │
│  │                     └─────────────┘   └─────────────┘    │  │
│  │                                                           │  │
│  │   ┌─────────────────────────────────────────────────┐    │  │
│  │   │              Shared Services                     │    │  │
│  │   │  PostgreSQL (StatefulSet) │ Redis (StatefulSet) │    │  │
│  │   └─────────────────────────────────────────────────┘    │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                  │
│  Node 1 (CX21)        Node 2 (CX21)        Node 3 (CX21)        │
└─────────────────────────────────────────────────────────────────┘
```

## K3s Setup

### Master Node installieren

```bash
# Auf Node 1
curl -sfL https://get.k3s.io | sh -

# Token für Worker holen
cat /var/lib/rancher/k3s/server/node-token
```

### Worker Nodes hinzufügen

```bash
# Auf Node 2 und 3
curl -sfL https://get.k3s.io | K3S_URL=https://NODE1-IP:6443 K3S_TOKEN=TOKEN sh -
```

### Helm Charts deployen

```yaml
# values-uload.yaml
replicaCount: 2
image:
  repository: ghcr.io/your-org/uload-web
  tag: latest
service:
  port: 3000
ingress:
  enabled: true
  hosts:
    - host: ulo.ad
      paths:
        - path: /
env:
  - name: DATABASE_URL
    valueFrom:
      secretKeyRef:
        name: db-credentials
        key: url
```

```bash
helm install uload ./charts/sveltekit -f values-uload.yaml
```

## Vorteile K8s

- Auto-Scaling bei Last
- Rolling Updates ohne Downtime
- Self-Healing bei Ausfällen
- Resource Limits pro App

## Nachteile K8s

- Höhere Komplexität
- Mehr Overhead (RAM für K8s selbst)
- Lernkurve

---

# Option D: Hybrid (Self-Hosted + Managed)

Kombination aus Self-Hosting und Managed Services für beste Balance.

## Architektur

```
┌─────────────────────────────────────────────────────────────────┐
│                        MANAGED SERVICES                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │   SUPABASE   │  │  CLOUDFLARE  │  │   VERCEL/    │          │
│  │  (Database)  │  │    (CDN)     │  │   NETLIFY    │          │
│  │  PostgreSQL  │  │  DNS, Cache  │  │  (Landing)   │          │
│  │  Auth, Store │  │  DDoS Prot.  │  │  Static      │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│         │                  │                  │                  │
└─────────┼──────────────────┼──────────────────┼──────────────────┘
          │                  │                  │
          ▼                  ▼                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                      SELF-HOSTED (VPS)                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                    Hetzner CX21                           │   │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐         │   │
│  │  │  Web Apps  │  │  Backends  │  │   uLoad    │         │   │
│  │  │ (SvelteKit)│  │  (NestJS)  │  │   + DB     │         │   │
│  │  └────────────┘  └────────────┘  └────────────┘         │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Was wo hosten?

### Managed Services (empfohlen)

| Service       | Anbieter       | Kosten     | Grund                     |
| ------------- | -------------- | ---------- | ------------------------- |
| Datenbank     | Supabase       | Free-$25/M | Auth + Realtime inklusive |
| Landing Pages | Vercel/Netlify | Free       | CDN + Edge                |
| CDN           | Cloudflare     | Free       | DDoS + Caching            |
| Email         | Resend         | Free-$20/M | Deliverability            |
| Payments      | Stripe         | % per Tx   | Compliance                |

### Self-Hosted (VPS)

| Service  | Grund                                  |
| -------- | -------------------------------------- |
| Web Apps | Volle Kontrolle, günstiger bei Traffic |
| Backends | Custom Code, API Keys                  |
| uLoad    | Komplett eigene Infra gewünscht        |
| Redis    | Falls benötigt                         |

## Setup

### 1. Supabase Projekt erstellen

Für: Maerchenzauber, Manacore, Memoro, Picture

```bash
# Supabase CLI
supabase init
supabase db push
```

### 2. Landing Pages auf Vercel

```bash
# In jedem Landing-Projekt
cd maerchenzauber/apps/landing
vercel deploy --prod
```

### 3. VPS für Web Apps + Backends

```bash
# Coolify auf Hetzner CX21
curl -fsSL https://cdn.coollabs.io/coolify/install.sh | bash

# Apps deployen mit Supabase URLs
```

## Kosten-Vergleich

| Komponente | Full Self-Hosted | Hybrid             |
| ---------- | ---------------- | ------------------ |
| VPS        | €9-18/Monat      | €4.50/Monat        |
| Supabase   | -                | Free-€25/Monat     |
| Vercel     | -                | Free               |
| Cloudflare | -                | Free               |
| **Gesamt** | **€9-18/Monat**  | **€4.50-30/Monat** |

---

# Dockerfiles für alle Projekte

## SvelteKit Web Apps (Template)

Erstelle für jedes Projekt ohne Dockerfile:

```dockerfile
# {projekt}/apps/web/Dockerfile

FROM node:20-alpine AS builder
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate
WORKDIR /app

# Monorepo files
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY {projekt}/apps/web/ ./{projekt}/apps/web/
COPY packages/ ./packages/

# Install and build
RUN pnpm install --filter @{projekt}/web... --shamefully-hoist
WORKDIR /app/{projekt}/apps/web
RUN pnpm build

# Runner
FROM node:20-alpine
RUN adduser -D sveltekit
WORKDIR /app
COPY --from=builder /app/{projekt}/apps/web/build ./build
COPY --from=builder /app/{projekt}/apps/web/package.json ./
COPY --from=builder /app/node_modules ./node_modules

USER sveltekit
ENV NODE_ENV=production PORT=3000
EXPOSE 3000
CMD ["node", "build"]
```

## Astro Landing Pages

```dockerfile
# {projekt}/apps/landing/Dockerfile

FROM node:20-alpine AS builder
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate
WORKDIR /app

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY {projekt}/apps/landing/ ./{projekt}/apps/landing/
COPY packages/ ./packages/

RUN pnpm install --filter @{projekt}/landing... --shamefully-hoist
WORKDIR /app/{projekt}/apps/landing
RUN pnpm build

# Nginx for static files
FROM nginx:alpine
COPY --from=builder /app/{projekt}/apps/landing/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

## NestJS Backends

Bereits vorhanden in:

- `maerchenzauber/apps/backend/Dockerfile`
- `manadeck/backend/Dockerfile`

---

# Environment Variables

## Gemeinsame Variablen (alle Projekte)

```env
NODE_ENV=production
```

## Supabase-basierte Projekte

```env
# Maerchenzauber, Manacore, Memoro, Picture
PUBLIC_SUPABASE_URL=https://xxx.supabase.co
PUBLIC_SUPABASE_ANON_KEY=eyJxx...
SUPABASE_SERVICE_ROLE_KEY=eyJxx...  # Nur Backend
```

## PostgreSQL-basierte Projekte

```env
# Manadeck, uLoad
DATABASE_URL=postgresql://user:pass@host:5432/db
```

## Projekt-spezifische Variablen

### Maerchenzauber Backend

```env
AZURE_OPENAI_ENDPOINT=https://xxx.openai.azure.com
AZURE_OPENAI_API_KEY=xxx
GOOGLE_GEMINI_API_KEY=xxx
REPLICATE_API_TOKEN=xxx
GOOGLE_APPLICATION_CREDENTIALS=/path/to/credentials.json
```

### Manadeck Backend

```env
GOOGLE_GEMINI_API_KEY=xxx
```

### uLoad

```env
REDIS_URL=redis://localhost:6379
STRIPE_SECRET_KEY=sk_live_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
RESEND_API_KEY=re_xxx
R2_ACCESS_KEY_ID=xxx
R2_SECRET_ACCESS_KEY=xxx
R2_BUCKET_NAME=xxx
R2_ENDPOINT=https://xxx.r2.cloudflarestorage.com
AUTH_SECRET=xxx
```

---

# Checkliste: Komplettes Self-Hosting

## Infrastruktur

- [ ] VPS bestellt (Hetzner CX21/CX31)
- [ ] SSH-Zugang eingerichtet
- [ ] Coolify installiert
- [ ] Firewall konfiguriert

## Datenbanken

- [ ] PostgreSQL läuft
- [ ] Redis läuft (falls benötigt)
- [ ] Backups eingerichtet
- [ ] Connection Strings notiert

## Projekte (für jedes)

- [ ] Dockerfile erstellt/geprüft
- [ ] Environment Variables gesetzt
- [ ] Domain konfiguriert
- [ ] SSL-Zertifikat aktiv
- [ ] Health-Check funktioniert

## DNS (für jede Domain)

- [ ] A-Record auf Server-IP
- [ ] www CNAME (optional)
- [ ] Propagation geprüft

## Monitoring

- [ ] Logs erreichbar
- [ ] Alerting eingerichtet (optional)
- [ ] Uptime-Monitoring (optional)

## Backups

- [ ] Datenbank-Backup automatisiert
- [ ] Backup-Test durchgeführt
- [ ] Offsite-Backup (optional)

---

# Empfehlung

## Für den Start: Option D (Hybrid)

1. **Supabase** für Datenbank + Auth (Free Tier)
2. **Vercel/Netlify** für Landing Pages (Free)
3. **Hetzner CX21** für Web Apps + Backends (€4.50/Monat)
4. **Cloudflare** für DNS + CDN (Free)

**Vorteile:**

- Schneller Start
- Geringe Kosten
- Managed Auth & Realtime
- Einfache Skalierung später

## Für Wachstum: Option B (Multi-VPS)

Wenn Traffic steigt:

1. Datenbanken auf eigenen VPS migrieren
2. Frontend/Backend trennen
3. Load Balancing hinzufügen

## Für Enterprise: Option C (Kubernetes)

Wenn benötigt:

- Auto-Scaling
- Zero-Downtime Deployments
- Multi-Region

---

# Support & Links

- **Coolify Docs:** https://coolify.io/docs
- **Hetzner:** https://www.hetzner.com/cloud
- **Supabase:** https://supabase.com/docs
- **K3s:** https://k3s.io
- **Traefik:** https://doc.traefik.io/traefik/
