---
title: 'Mana Cluster & Federation Architecture'
description: 'Architektur-Entscheidungen für ein selbstheilendes, dezentrales Multi-Node-Cluster mit Open-Source-Stack, verteilter Datenbank und Federation-Modell für B2B/B2C-Trennung'
date: 2026-01-31
author: 'Till Schneider'
category: 'architecture'
status: 'accepted'
tags:
  [
    'kubernetes',
    'k3s',
    'yugabytedb',
    'federation',
    'distributed-computing',
    'open-source',
    'self-healing',
    'multi-tenant',
    'b2b',
    'b2c',
    'on-premise',
  ]
featured: true
readTime: 45
decisionDate: 2026-01-31
---

# Mana Cluster & Federation Architecture

Dieses Dokument beschreibt die Architektur-Entscheidungen für die nächste Generation der Mana-Infrastruktur: Ein selbstheilendes, dezentrales Cluster-System mit echtem Open-Source-Stack, das sowohl B2C-Nutzer als auch B2B-Kunden mit On-Premise-Lösungen unterstützt.

---

## Inhaltsverzeichnis

1. [Problemstellung](#problemstellung)
2. [Ziele & Anforderungen](#ziele--anforderungen)
3. [Entscheidung: Orchestrierung](#entscheidung-orchestrierung)
4. [Entscheidung: Datenbank](#entscheidung-datenbank)
5. [Entscheidung: Mesh-Networking](#entscheidung-mesh-networking)
6. [B2C/B2B-Architektur](#b2cb2b-architektur)
7. [Federation & Compute-Sharing](#federation--compute-sharing)
8. [Der Open-Source-Stack](#der-open-source-stack)
9. [Hardware-Empfehlungen](#hardware-empfehlungen)
10. [Migrations-Roadmap](#migrations-roadmap)
11. [Appendix: Technologie-Vergleiche](#appendix-technologie-vergleiche)

---

## Problemstellung

### Aktueller Zustand

Die gesamte Mana-Infrastruktur läuft aktuell auf einem einzigen Mac Mini M4:

```
┌─────────────────────────────────────────────────────────────┐
│  Mac Mini M4 (Single Point of Failure)                      │
│                                                             │
│  • ~50 Docker Container                                     │
│  • PostgreSQL (einzelne Instanz)                           │
│  • Redis (einzelne Instanz)                                │
│  • MinIO (einzelne Instanz)                                │
│  • Ollama (native, LLM-Inferenz)                           │
│  • FLUX.2 (native, Bildgenerierung)                        │
│  • Cloudflare Tunnel (öffentlicher Zugang)                 │
└─────────────────────────────────────────────────────────────┘
```

**Risiken:**
- **Kein Failover:** Fällt der Mac Mini aus, sind alle Services offline
- **Keine Redundanz:** Datenverlust bei Hardware-Defekt möglich
- **Keine Skalierung:** Ressourcen sind auf ein Gerät beschränkt
- **Kein Kunden-Deployment:** B2B-Kunden brauchen eigene Instanzen

### Zukünftige Anforderungen

1. **Redundanz:** Mindestens 2 Nodes für High Availability
2. **Selbstheilung:** Automatisches Failover ohne manuellen Eingriff
3. **Dezentralisierung:** Kein einzelner Ausfallpunkt
4. **Heterogenität:** Verschiedene Hardware (Mac, Raspberry Pi, Windows)
5. **B2B-Support:** Kunden können eigene On-Premise-Cluster betreiben
6. **Federation:** B2B-Kunden können optional Compute-Ressourcen beitragen
7. **Open Source:** Keine Vendor-Lock-in-Risiken durch proprietäre Lizenzen

---

## Ziele & Anforderungen

### Funktionale Anforderungen

| ID | Anforderung | Priorität |
|----|-------------|-----------|
| F1 | Automatisches Failover bei Node-Ausfall (<30 Sekunden) | Kritisch |
| F2 | Daten-Replikation über Nodes hinweg | Kritisch |
| F3 | Support für ARM64 und x86_64 Architekturen | Hoch |
| F4 | B2B-Kunden können isolierte On-Premise-Instanzen betreiben | Hoch |
| F5 | Optional: B2B-Kunden können Compute zum Netzwerk beitragen | Mittel |
| F6 | Distributed Computing für große Aufgaben (LLM, Bildgenerierung) | Mittel |
| F7 | Geo-Distribution für globale Nutzer | Niedrig |

### Nicht-funktionale Anforderungen

| ID | Anforderung | Zielwert |
|----|-------------|----------|
| N1 | Verfügbarkeit | 99.9% (8.76h Downtime/Jahr) |
| N2 | Recovery Time Objective (RTO) | < 5 Minuten |
| N3 | Recovery Point Objective (RPO) | < 1 Minute |
| N4 | Lizenzkosten | 0€ (Open Source) |
| N5 | Minimale Node-Anzahl für HA | 2 (Control Plane) |
| N6 | RAM pro Node (Minimum) | 8GB |

### Lizenz-Anforderungen

**Kritisch:** Alle Kernkomponenten müssen echte Open-Source-Lizenzen haben:

| Lizenz | Status | Beispiele |
|--------|--------|-----------|
| Apache 2.0 | ✅ Akzeptiert | Kubernetes, YugabyteDB |
| MIT | ✅ Akzeptiert | Ollama, viele npm-Pakete |
| BSD | ✅ Akzeptiert | FreeBSD, Headscale |
| MPL 2.0 | ✅ Akzeptiert | OpenTofu |
| AGPL 3.0 | ⚠️ Mit Vorsicht | MinIO (SaaS-Implikationen) |
| BSL | ❌ Abgelehnt | HashiCorp, CockroachDB |
| SSPL | ❌ Abgelehnt | MongoDB, Elasticsearch |

---

## Entscheidung: Orchestrierung

### Bewertete Optionen

#### Option A: Kubernetes (K3s)

**K3s** ist eine CNCF-zertifizierte, leichtgewichtige Kubernetes-Distribution.

| Aspekt | Bewertung |
|--------|-----------|
| **Lizenz** | Apache 2.0 ✅ |
| **Governance** | CNCF (Linux Foundation) - neutral, community-driven |
| **Community** | >100.000 GitHub Stars, Industriestandard |
| **Multi-Arch** | ARM64 + x86_64 nativ unterstützt |
| **Ressourcen** | ~500MB RAM pro Node |
| **Lernkurve** | Steil, aber Investition zahlt sich aus |
| **Ecosystem** | Riesig (Helm, Operators, Service Mesh, etc.) |

#### Option B: Nomad (HashiCorp)

| Aspekt | Bewertung |
|--------|-----------|
| **Lizenz** | BSL (Business Source License) ❌ |
| **Governance** | HashiCorp (Vendor-controlled) |
| **Community** | ~15.000 GitHub Stars |
| **Multi-Arch** | ARM64 + x86_64 unterstützt |
| **Ressourcen** | ~100MB RAM pro Node |
| **Lernkurve** | Flacher als Kubernetes |
| **Ecosystem** | Begrenzt |

**Kritisches Problem mit HashiCorp:**

Im August 2023 wechselte HashiCorp von MPL zu BSL (Business Source License):

```
┌─────────────────────────────────────────────────────────────────────┐
│                    LIZENZ-WARNUNG: HashiCorp                         │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  BSL ist KEINE Open-Source-Lizenz nach OSI-Definition!              │
│                                                                      │
│  Betroffene Produkte:                                               │
│  • Terraform → Community-Fork: OpenTofu (Linux Foundation)          │
│  • Vault → Community-Fork: OpenBao                                  │
│  • Nomad → Kein stabiler Fork verfügbar                            │
│  • Consul → Kein stabiler Fork verfügbar                           │
│                                                                      │
│  BSL-Einschränkungen:                                               │
│  • Keine konkurrierenden Produkte/Services bauen                    │
│  • Keine Hosting-Services anbieten die mit HashiCorp konkurrieren   │
│  • Rechtliche Grauzone für kommerzielle Nutzung                     │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

#### Option C: Docker Swarm

| Aspekt | Bewertung |
|--------|-----------|
| **Lizenz** | Apache 2.0 ✅ |
| **Status** | Faktisch deprecated, kaum Weiterentwicklung |
| **Features** | Begrenzt im Vergleich zu K8s |

### Entscheidung

**✅ Kubernetes (K3s)** wird als Orchestrierungsplattform gewählt.

**Begründung:**

1. **Echtes Open Source:** Apache 2.0 Lizenz, CNCF-Governance
2. **Zukunftssicherheit:** Industriestandard, wird nicht plötzlich BSL
3. **Ecosystem:** Helm Charts existieren für fast alles
4. **Portabilität:** Läuft identisch auf Cloud, Edge, On-Premise
5. **Job-Markt:** Kubernetes-Wissen ist wertvoll und übertragbar
6. **HA-Support:** Native HA-Konfiguration mit mehreren Control Plane Nodes

**Architektur:**

```
┌─────────────────────────────────────────────────────────────────────┐
│                         K3s HA Cluster                               │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  Control Plane (HA)                                                 │
│  ┌─────────────────────┐  ┌─────────────────────┐                   │
│  │    Mac Mini 1       │  │    Mac Mini 2       │                   │
│  │    (Server Node)    │◄─►│    (Server Node)    │                   │
│  │                     │  │                     │                   │
│  │  • etcd (embedded)  │  │  • etcd (embedded)  │                   │
│  │  • API Server       │  │  • API Server       │                   │
│  │  • Scheduler        │  │  • Scheduler        │                   │
│  │  • Controller       │  │  • Controller       │                   │
│  └─────────────────────┘  └─────────────────────┘                   │
│            │                        │                                │
│            └────────────┬───────────┘                                │
│                         │                                            │
│  Worker Nodes (optional)│                                            │
│  ┌──────────┬───────────┴────────┬──────────────┐                   │
│  │ MacBook  │ Raspberry Pi       │ Windows PC   │                   │
│  │ (Agent)  │ (Agent)            │ (Agent/WSL)  │                   │
│  └──────────┴────────────────────┴──────────────┘                   │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Entscheidung: Datenbank

### Bewertete Optionen

#### Option A: CockroachDB

| Aspekt | Bewertung |
|--------|-----------|
| **Lizenz** | BSL (Core), Proprietär (Enterprise) ❌ |
| **PostgreSQL-Kompatibilität** | ~95% |
| **Geo-Distribution** | Nur Enterprise |
| **Triggers** | Nicht unterstützt |
| **Stored Procedures** | Eingeschränkt |

#### Option B: YugabyteDB

| Aspekt | Bewertung |
|--------|-----------|
| **Lizenz** | Apache 2.0 ✅ |
| **PostgreSQL-Kompatibilität** | ~99% |
| **Geo-Distribution** | Open Source verfügbar |
| **Triggers** | ✅ Unterstützt |
| **Stored Procedures** | ✅ Unterstützt |
| **Zusätzliche API** | Cassandra-kompatibel (YCQL) |

#### Option C: TiDB

| Aspekt | Bewertung |
|--------|-----------|
| **Lizenz** | Apache 2.0 ✅ |
| **Kompatibilität** | MySQL (nicht PostgreSQL) |
| **Migration** | Würde Drizzle-Schemas brechen |

### Entscheidung

**✅ YugabyteDB** wird als verteilte Datenbank gewählt.

**Begründung:**

1. **Echtes Open Source:** Apache 2.0 ohne Feature-Gating
2. **PostgreSQL-Kompatibilität:** Drizzle ORM funktioniert ohne Änderungen
3. **Geo-Distribution:** Ohne Enterprise-Lizenz verfügbar
4. **Vollständige Features:** Triggers, Stored Procedures, pg_dump
5. **ARM64-Support:** Läuft auf Mac Mini M4

**PostgreSQL-Kompatibilität für Mana-Apps:**

| Feature | PostgreSQL | YugabyteDB | CockroachDB |
|---------|------------|------------|-------------|
| Basic CRUD | ✅ | ✅ | ✅ |
| JOINs | ✅ | ✅ | ✅ |
| Transactions | ✅ | ✅ | ✅ |
| JSONB | ✅ | ✅ | ✅ |
| Drizzle ORM | ✅ | ✅ | ✅ |
| Triggers | ✅ | ✅ | ❌ |
| pg_dump/restore | ✅ | ✅ | ⚠️ |
| LISTEN/NOTIFY | ✅ | ❌ | ❌ |

**Wichtig:** LISTEN/NOTIFY wird nicht unterstützt. Falls verwendet, muss auf Redis Pub/Sub umgestellt werden.

**Cluster-Architektur:**

```
┌─────────────────────────────────────────────────────────────────────┐
│                    YugabyteDB Cluster (RF=3)                         │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐      │
│  │   Mac Mini 1    │  │   Mac Mini 2    │  │  Optional Node  │      │
│  │                 │  │                 │  │  (Raspberry Pi) │      │
│  │  ┌───────────┐  │  │  ┌───────────┐  │  │  ┌───────────┐  │      │
│  │  │ YB-Master │  │  │  │ YB-Master │  │  │  │ YB-Master │  │      │
│  │  └───────────┘  │  │  └───────────┘  │  │  └───────────┘  │      │
│  │  ┌───────────┐  │  │  ┌───────────┐  │  │  ┌───────────┐  │      │
│  │  │ YB-TServer│  │  │  │ YB-TServer│  │  │  │ YB-TServer│  │      │
│  │  │ (Tablets) │  │  │  │ (Tablets) │  │  │  │ (Tablets) │  │      │
│  │  └───────────┘  │  │  └───────────┘  │  │  └───────────┘  │      │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘      │
│                                                                      │
│  Raft Consensus: Jedes Tablet hat 3 Replicas                        │
│  Automatisches Re-Balancing bei Node-Ausfall                        │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Entscheidung: Mesh-Networking

### Bewertete Optionen

#### Option A: Tailscale / Headscale

| Aspekt | Bewertung |
|--------|-----------|
| **Tailscale (SaaS)** | Proprietär, kostenlos bis 100 Devices |
| **Headscale (Self-hosted)** | BSD-Lizenz ✅ |
| **Protokoll** | WireGuard (schnell, sicher) |
| **NAT Traversal** | Exzellent |
| **Setup** | Zero-Config |

#### Option B: ZeroTier

| Aspekt | Bewertung |
|--------|-----------|
| **Lizenz** | BSL ❌ |
| **Performance** | Gut |
| **Setup** | Einfach |

#### Option C: Nebula (Slack)

| Aspekt | Bewertung |
|--------|-----------|
| **Lizenz** | MIT ✅ |
| **Performance** | Gut |
| **Setup** | Komplexer als Tailscale |

### Entscheidung

**✅ Headscale** (Self-hosted Tailscale) wird für Mesh-Networking gewählt.

**Begründung:**

1. **Open Source:** BSD-Lizenz
2. **WireGuard:** Modernes, schnelles VPN-Protokoll
3. **Zero-Config:** Nodes finden sich automatisch
4. **NAT Traversal:** Funktioniert durch Firewalls
5. **Kompatibilität:** Tailscale-Clients funktionieren mit Headscale

**Architektur:**

```
┌─────────────────────────────────────────────────────────────────────┐
│                       Headscale Mesh Network                         │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│   Standort A (Zuhause)     Standort B (Büro)    Standort C (Mobil)  │
│   ┌─────────────────┐      ┌─────────────────┐  ┌─────────────────┐ │
│   │   Mac Mini 1    │◄────►│   Mac Mini 2    │◄►│   MacBook Pro   │ │
│   │   100.x.x.1     │      │   100.x.x.2     │  │   100.x.x.3     │ │
│   └────────┬────────┘      └────────┬────────┘  └─────────────────┘ │
│            │                        │                                │
│            ▼                        ▼                                │
│   ┌─────────────────┐      ┌─────────────────┐                      │
│   │  Raspberry Pi   │      │   Windows PC    │                      │
│   │   100.x.x.4     │      │   100.x.x.5     │                      │
│   └─────────────────┘      └─────────────────┘                      │
│                                                                      │
│   Alle Nodes können direkt miteinander kommunizieren                │
│   Verschlüsselt via WireGuard                                       │
│   Automatische Key-Rotation                                         │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## B2C/B2B-Architektur

### Multi-Tenancy-Strategie

```
┌─────────────────────────────────────────────────────────────────────┐
│                    Mana Deployment-Modelle                           │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │                     B2C (Consumer)                           │    │
│  │                                                              │    │
│  │  • Alle Nutzer auf Mana Central Cluster                     │    │
│  │  • Multi-Tenancy via user_id + Row-Level Security (RLS)     │    │
│  │  • Shared YugabyteDB Cluster                                │    │
│  │  • Shared Compute-Ressourcen                                │    │
│  │  • Mana-Credits für Nutzung                                 │    │
│  │                                                              │    │
│  └─────────────────────────────────────────────────────────────┘    │
│                                                                      │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │                     B2B (Business)                           │    │
│  │                                                              │    │
│  │  4 Deployment-Tiers verfügbar:                              │    │
│  │                                                              │    │
│  │  Tier 1: Isolated (Strengste Trennung)                      │    │
│  │  ├── Komplett eigenes Cluster                               │    │
│  │  ├── Keine Verbindung zu Mana Network                       │    │
│  │  ├── Nur Software-Updates von Mana                          │    │
│  │  └── Für: Banken, Behörden, Militär, Gesundheitswesen       │    │
│  │                                                              │    │
│  │  Tier 2: Federated Compute                                  │    │
│  │  ├── Eigene Datenbank (isoliert)                            │    │
│  │  ├── Verbunden via Mesh VPN                                 │    │
│  │  ├── Kann anonymisierte Compute-Tasks ausführen             │    │
│  │  └── Für: Mittelstand, Tech-Unternehmen                     │    │
│  │                                                              │    │
│  │  Tier 3: Federated Learning                                 │    │
│  │  ├── Wie Tier 2, plus lokales ML-Training                   │    │
│  │  ├── Nur Modell-Updates werden geteilt                      │    │
│  │  └── Für: Unternehmen mit viel eigenem Content              │    │
│  │                                                              │    │
│  │  Tier 4: Full Federation                                    │    │
│  │  ├── Maximum Sharing mit Privacy-Garantien                  │    │
│  │  ├── Differential Privacy, ZK-Proofs                        │    │
│  │  └── Für: Community-Partner, Open-Source-Projekte           │    │
│  │                                                              │    │
│  └─────────────────────────────────────────────────────────────┘    │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### B2B Tier-Details

#### Tier 1: Isolated

```
┌─────────────────────────────────────────────────────────────────────┐
│                         B2B Tier 1: Isolated                         │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  Kunde (On-Premise)                    Mana                         │
│  ┌───────────────────────────┐        ┌───────────────────────┐     │
│  │                           │        │                       │     │
│  │  ┌─────────────────────┐  │        │  Software Releases    │     │
│  │  │  K3s Cluster        │  │◄───────│  (Container Images)   │     │
│  │  │                     │  │  HTTPS │                       │     │
│  │  │  ┌───────────────┐  │  │        │  Support (optional)   │     │
│  │  │  │ YugabyteDB    │  │  │        │                       │     │
│  │  │  │ (isoliert)    │  │  │        └───────────────────────┘     │
│  │  │  └───────────────┘  │  │                                      │
│  │  │                     │  │        Keine Daten fließen           │
│  │  │  ┌───────────────┐  │  │        zu Mana zurück!               │
│  │  │  │ Mana Apps     │  │  │                                      │
│  │  │  └───────────────┘  │  │                                      │
│  │  │                     │  │                                      │
│  │  │  ┌───────────────┐  │  │                                      │
│  │  │  │ Ollama (LLM)  │  │  │                                      │
│  │  │  └───────────────┘  │  │                                      │
│  │  └─────────────────────┘  │                                      │
│  │                           │                                      │
│  └───────────────────────────┘                                      │
│                                                                      │
│  Anwendungsfälle:                                                   │
│  • Banken mit strikten Regulierungen                                │
│  • Behörden und öffentlicher Sektor                                 │
│  • Gesundheitswesen (HIPAA, etc.)                                   │
│  • Verteidigung und Sicherheit                                      │
│                                                                      │
│  Lizenzmodell: Jährliche Lizenzgebühr + Support-Vertrag             │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

#### Tier 2: Federated Compute

```
┌─────────────────────────────────────────────────────────────────────┐
│                     B2B Tier 2: Federated Compute                    │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  Mana Central                          Kunde (On-Premise)           │
│  ┌───────────────────────────┐        ┌───────────────────────┐     │
│  │                           │        │                       │     │
│  │  Compute Coordinator      │        │  K3s Cluster          │     │
│  │  ┌─────────────────────┐  │        │                       │     │
│  │  │ Task Queue          │  │◄──────►│  ┌─────────────────┐  │     │
│  │  │ (anonymisierte Jobs)│  │  Mesh  │  │ Ray Worker      │  │     │
│  │  └─────────────────────┘  │  VPN   │  │ (Compute)       │  │     │
│  │                           │        │  └─────────────────┘  │     │
│  │  Beispiel-Tasks:          │        │                       │     │
│  │  • Bildgenerierung        │        │  ┌─────────────────┐  │     │
│  │  • LLM-Inferenz           │        │  │ Eigene DB       │  │     │
│  │  • Video-Transcoding      │        │  │ (isoliert)      │  │     │
│  │                           │        │  └─────────────────┘  │     │
│  │  KEINE Kundendaten!       │        │                       │     │
│  │                           │        │  Daten bleiben lokal  │     │
│  └───────────────────────────┘        └───────────────────────┘     │
│                                                                      │
│  Was fließt:                                                        │
│  ✅ Generische Compute-Tasks (z.B. "Generiere Bild für Prompt X")   │
│  ✅ Anonymisierte Workloads                                         │
│  ❌ Kundendaten                                                     │
│  ❌ Nutzeridentitäten                                               │
│                                                                      │
│  Lizenzmodell: Reduzierte Lizenzgebühr + Compute-Credits            │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

#### Tier 3: Federated Learning

```
┌─────────────────────────────────────────────────────────────────────┐
│                     B2B Tier 3: Federated Learning                   │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  Funktionsweise:                                                    │
│  ─────────────────────────────────────────────────────────────────  │
│                                                                      │
│  1. Mana verteilt Basis-Modell an alle Teilnehmer                   │
│  2. Jeder Teilnehmer trainiert lokal auf eigenen Daten              │
│  3. Nur Modell-Updates (Gradienten) werden zurückgeschickt          │
│  4. Mana aggregiert Updates → verbessertes Modell für alle          │
│                                                                      │
│                                                                      │
│     Mana Central                                                    │
│     ┌─────────────────────────────────────────────┐                 │
│     │           Federated Learning Server          │                 │
│     │  ┌───────────────────────────────────────┐  │                 │
│     │  │         Global Model v1.0             │  │                 │
│     │  └───────────────────────────────────────┘  │                 │
│     └──────────────────┬──────────────────────────┘                 │
│                        │                                            │
│           ┌────────────┼────────────┐                               │
│           │            │            │                               │
│           ▼            ▼            ▼                               │
│     ┌──────────┐ ┌──────────┐ ┌──────────┐                         │
│     │ Kunde A  │ │ Kunde B  │ │ Kunde C  │                         │
│     │          │ │          │ │          │                         │
│     │ Lokales  │ │ Lokales  │ │ Lokales  │                         │
│     │ Training │ │ Training │ │ Training │                         │
│     │ auf      │ │ auf      │ │ auf      │                         │
│     │ eigenen  │ │ eigenen  │ │ eigenen  │                         │
│     │ Daten    │ │ Daten    │ │ Daten    │                         │
│     └────┬─────┘ └────┬─────┘ └────┬─────┘                         │
│          │            │            │                               │
│          ▼            ▼            ▼                               │
│     ┌──────────┐ ┌──────────┐ ┌──────────┐                         │
│     │ΔA (Grad.)│ │ΔB (Grad.)│ │ΔC (Grad.)│                         │
│     └────┬─────┘ └────┬─────┘ └────┬─────┘                         │
│          │            │            │                               │
│          └────────────┼────────────┘                               │
│                       │                                            │
│                       ▼                                            │
│     ┌─────────────────────────────────────────────┐                │
│     │  Aggregation: Model v1.1 = v1.0 + avg(Δ)   │                │
│     │  Verbessertes Modell für ALLE Teilnehmer   │                │
│     └─────────────────────────────────────────────┘                │
│                                                                     │
│  Frameworks: Flower (Apache 2.0), PySyft                           │
│                                                                     │
│  Was fließt:                                                       │
│  ✅ Modell-Gewichte und Gradienten                                 │
│  ❌ Rohdaten (bleiben immer lokal)                                 │
│  ❌ Individuelle Nutzerinformationen                               │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

#### Tier 4: Full Federation

```
┌─────────────────────────────────────────────────────────────────────┐
│                     B2B Tier 4: Full Federation                      │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  Alle Features von Tier 2 + 3, plus:                                │
│                                                                      │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │                   Differential Privacy                       │    │
│  │                                                              │    │
│  │  • Aggregierte Statistiken mit Rauschen                     │    │
│  │  • Einzelne Datenpunkte nicht rekonstruierbar               │    │
│  │  • Nutzungsstatistiken für Produktverbesserung              │    │
│  │                                                              │    │
│  │  Beispiel:                                                   │    │
│  │  Echte Nutzungszahlen: [100, 150, 80, 200]                  │    │
│  │  Mit DP-Rauschen:      [98, 153, 82, 197]                   │    │
│  │  Durchschnitt bleibt korrekt, Einzelwerte geschützt         │    │
│  │                                                              │    │
│  └─────────────────────────────────────────────────────────────┘    │
│                                                                      │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │                   Zero-Knowledge Proofs                      │    │
│  │                                                              │    │
│  │  • SLA-Verifizierung ohne Daten-Offenlegung                 │    │
│  │  • Compliance-Nachweise                                      │    │
│  │  • Aggregierte Berichte                                      │    │
│  │                                                              │    │
│  │  Beispiel:                                                   │    │
│  │  Kunde: "Unsere Uptime war >99.9%"                          │    │
│  │  Mana: "Beweise es ohne Log-Daten zu zeigen"                │    │
│  │  Kunde: ZK-Proof ✅ (verifizierbar, aber keine Rohdaten)    │    │
│  │                                                              │    │
│  └─────────────────────────────────────────────────────────────┘    │
│                                                                      │
│  Lizenzmodell: Maximale Rabatte, Community-Benefits                 │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Federation & Compute-Sharing

### Privacy-Technologien im Überblick

#### 1. Federated Learning

```
Traditionelles ML:           Federated Learning:
─────────────────────────    ─────────────────────────
Daten → Zentraler Server     Modell → Zu den Daten
Server trainiert             Lokal trainieren
                             Nur Updates zurück

❌ Daten verlassen Kunde     ✅ Daten bleiben lokal
```

**Frameworks:**
- **Flower** (Apache 2.0) - Empfohlen
- **PySyft** (Apache 2.0) - OpenMined Projekt
- **TensorFlow Federated** (Apache 2.0) - Google

#### 2. Secure Enclaves (Hardware-Isolation)

```
┌─────────────────────────────────────────────────────────────────────┐
│                           CPU                                        │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │                    Secure Enclave                            │    │
│  │  ┌─────────────────────────────────────────────────────┐    │    │
│  │  │  • Verschlüsselter Speicher                         │    │    │
│  │  │  • Isolierte Ausführung                             │    │    │
│  │  │  • Nicht mal OS/Admin kann zugreifen                │    │    │
│  │  │  • Cryptographic Attestation                        │    │    │
│  │  └─────────────────────────────────────────────────────┘    │    │
│  └─────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────┘

Technologien:
• Intel SGX (x86)
• AMD SEV (x86)
• ARM TrustZone (ARM, auch Apple Silicon!) ✅
```

#### 3. Homomorphic Encryption

```
Konzept: Rechnen auf verschlüsselten Daten

Klartext:  5 + 3 = 8

Mit HE:
Enc(5) = "xK9#mL"
Enc(3) = "pQ2@nR"
Enc(5) + Enc(3) = "zT7$vW"
Dec("zT7$vW") = 8 ✅

Der Server sieht NIE die Werte 5, 3 oder 8!

Status: Noch 100-1000x langsamer als Klartext
Frameworks: Microsoft SEAL, OpenFHE, Zama Concrete
```

#### 4. Differential Privacy

```
Konzept: Rauschen hinzufügen, sodass Aggregate korrekt bleiben,
         aber Einzelwerte nicht rekonstruierbar sind.

Echte Werte:    [50k, 60k, 55k, 70k]
Mit Rauschen:   [52k, 58k, 56k, 68k]
Durchschnitt:    58.5k ≈ 58.75k (fast korrekt)

Frameworks: Google DP Library, OpenDP (Harvard), PyDP
```

### Compute-Federation Architektur

```
┌─────────────────────────────────────────────────────────────────────┐
│                    Mana Compute Federation                           │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  Layer 1: Mesh Networking                                           │
│  ─────────────────────────                                          │
│  Headscale (WireGuard-basiert, Ende-zu-Ende verschlüsselt)          │
│                                                                      │
│  Layer 2: Orchestration                                             │
│  ──────────────────────                                             │
│  K3s Cluster (federated, jeder B2B-Kunde eigener Namespace)         │
│                                                                      │
│  Layer 3: Compute Distribution                                      │
│  ─────────────────────────────                                      │
│  Ray Cluster (distributed task execution)                           │
│                                                                      │
│  Layer 4: Privacy Layer                                             │
│  ──────────────────────                                             │
│  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐           │
│  │ Federated     │  │ Differential  │  │ Zero-Knowledge│           │
│  │ Learning      │  │ Privacy       │  │ Proofs        │           │
│  │ (Flower)      │  │ (OpenDP)      │  │ (ZoKrates)    │           │
│  └───────────────┘  └───────────────┘  └───────────────┘           │
│                                                                      │
│  Layer 5: Task Types                                                │
│  ───────────────────                                                │
│  ┌───────────────────────────────────────────────────────────┐     │
│  │ Safe Tasks (können auf jedem Node laufen):                 │     │
│  │ • LLM-Inferenz (Prompt → Response)                        │     │
│  │ • Bildgenerierung (Text → Bild)                           │     │
│  │ • Video-Transcoding                                        │     │
│  │ • Allgemeine Berechnungen                                  │     │
│  └───────────────────────────────────────────────────────────┘     │
│  ┌───────────────────────────────────────────────────────────┐     │
│  │ Sensitive Tasks (nur auf eigenem Cluster):                 │     │
│  │ • Datenbankzugriffe                                        │     │
│  │ • Nutzerauthentifizierung                                  │     │
│  │ • Personenbezogene Daten                                   │     │
│  └───────────────────────────────────────────────────────────┘     │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Der Open-Source-Stack

### Finaler Stack

```
┌─────────────────────────────────────────────────────────────────────┐
│                    Mana Open-Source Stack                            │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  Kategorie            │ Technologie           │ Lizenz              │
│  ─────────────────────┼───────────────────────┼─────────────────────│
│  Orchestration        │ K3s                   │ Apache 2.0 ✅        │
│  Mesh Networking      │ Headscale             │ BSD ✅               │
│  Database             │ YugabyteDB            │ Apache 2.0 ✅        │
│  Object Storage       │ MinIO                 │ AGPL 3.0 ✅          │
│  Cache                │ Redis/Dragonfly      │ BSD / BSL ⚠️         │
│  Message Queue        │ NATS                  │ Apache 2.0 ✅        │
│  LLM Runtime          │ Ollama                │ MIT ✅               │
│  Distributed Compute  │ Ray                   │ Apache 2.0 ✅        │
│  Federated ML         │ Flower                │ Apache 2.0 ✅        │
│  Diff Privacy         │ OpenDP                │ MIT ✅               │
│  Secrets Management   │ Infisical             │ MIT ✅               │
│  IaC                  │ OpenTofu              │ MPL 2.0 ✅           │
│  Monitoring           │ VictoriaMetrics       │ Apache 2.0 ✅        │
│  Visualization        │ Grafana               │ AGPL 3.0 ✅          │
│  Logging              │ Loki                  │ AGPL 3.0 ✅          │
│  Tracing              │ Jaeger                │ Apache 2.0 ✅        │
│  Service Mesh         │ Linkerd               │ Apache 2.0 ✅        │
│  Ingress              │ Traefik               │ MIT ✅               │
│  Cert Management      │ cert-manager          │ Apache 2.0 ✅        │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### Vermiedene Technologien (BSL/SSPL)

```
┌─────────────────────────────────────────────────────────────────────┐
│                    ❌ NICHT VERWENDEN                                │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  HashiCorp Stack (BSL seit August 2023):                            │
│  ├── Terraform → Ersetzt durch: OpenTofu                            │
│  ├── Vault → Ersetzt durch: Infisical, OpenBao                      │
│  ├── Nomad → Ersetzt durch: K3s                                     │
│  └── Consul → Ersetzt durch: K8s Service Discovery                  │
│                                                                      │
│  Datenbanken (BSL/SSPL):                                            │
│  ├── CockroachDB (BSL) → Ersetzt durch: YugabyteDB                  │
│  ├── MongoDB (SSPL) → Ersetzt durch: PostgreSQL/YugabyteDB          │
│  └── Elasticsearch (SSPL) → Ersetzt durch: OpenSearch, Meilisearch  │
│                                                                      │
│  Andere:                                                             │
│  └── ZeroTier (BSL) → Ersetzt durch: Headscale                      │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Hardware-Empfehlungen

### Für Mana Central

```
┌─────────────────────────────────────────────────────────────────────┐
│                    Mana Central Cluster                              │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  Minimal HA (2 Nodes):                                              │
│  ─────────────────────                                              │
│  2x Mac Mini M4 (16GB RAM, 512GB SSD)                               │
│  Kosten: ~2.400€                                                    │
│                                                                      │
│  Empfohlen (3 Nodes):                                               │
│  ───────────────────                                                │
│  2x Mac Mini M4 Pro (24GB RAM, 512GB SSD) - Control Plane           │
│  1x Mac Mini M4 (16GB RAM) oder Raspberry Pi 5 - Tiebreaker         │
│  Kosten: ~4.000€                                                    │
│                                                                      │
│  Enterprise (5+ Nodes):                                             │
│  ─────────────────────                                              │
│  3x Mac Mini M4 Pro (48GB RAM) - Control Plane + Heavy Workloads    │
│  2x GPU-Workstation - LLM/Bildgenerierung                           │
│  Kosten: ~10.000€+                                                  │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### Für B2B-Kunden

```
┌─────────────────────────────────────────────────────────────────────┐
│                    B2B Cluster-Kits                                  │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  Starter (Tier 1-2):                                                │
│  ───────────────────                                                │
│  2x Mac Mini M4 (16GB)                                              │
│  Kosten: ~2.400€                                                    │
│  Kapazität: ~50 concurrent users                                    │
│                                                                      │
│  Professional (Tier 2-3):                                           │
│  ─────────────────────────                                          │
│  2x Mac Mini M4 Pro (24GB)                                          │
│  1x NAS für Backups                                                 │
│  Kosten: ~4.500€                                                    │
│  Kapazität: ~200 concurrent users                                   │
│                                                                      │
│  Enterprise (Tier 3-4):                                             │
│  ─────────────────────────                                          │
│  3x Mac Mini M4 Pro (48GB)                                          │
│  1x GPU-Server für lokale AI                                        │
│  Redundante Stromversorgung                                         │
│  Kosten: ~15.000€+                                                  │
│  Kapazität: ~1000+ concurrent users                                 │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### Unterstützte Geräte

| Gerät | K3s Support | YugabyteDB | Ollama | Bemerkungen |
|-------|-------------|------------|--------|-------------|
| Mac Mini M4 | ✅ | ✅ | ✅ | Ideal für Control Plane |
| MacBook Pro M-Series | ✅ | ✅ | ✅ | Guter Worker wenn aktiv |
| Raspberry Pi 5 | ✅ | ⚠️ (4GB min) | ⚠️ | Gut für Monitoring/Tiebreaker |
| Raspberry Pi 4 | ✅ | ⚠️ | ❌ | Nur leichte Services |
| Linux x86 Server | ✅ | ✅ | ✅ | Volle Kompatibilität |
| Windows (WSL2) | ✅ | ✅ | ✅ | Funktioniert, aber mehr Overhead |
| Steam Deck | ✅ | ⚠️ | ✅ | Interessant für portable AI |
| **PlayStation 5** | ❌ | ❌ | ❌ | Kein Linux-Support |
| **Xbox** | ❌ | ❌ | ❌ | Kein relevanter Zugriff |

---

## Migrations-Roadmap

### Phase 1: Zweiter Mac Mini (Woche 1-2)

```
┌─────────────────────────────────────────────────────────────────────┐
│  Ziel: Basis-HA mit zwei Nodes                                      │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  [ ] Hardware: Zweiten Mac Mini M4 beschaffen                       │
│  [ ] Networking: Headscale aufsetzen                                │
│  [ ] K3s: HA Cluster mit beiden Nodes initialisieren                │
│  [ ] Storage: Shared Storage Strategie (Longhorn oder NFS)          │
│  [ ] Migration: Bestehende Docker Compose → K8s Manifests           │
│  [ ] Cloudflare: Load Balancer für beide Nodes konfigurieren        │
│                                                                      │
│  Ergebnis:                                                          │
│  • Automatisches Failover bei Node-Ausfall                          │
│  • PostgreSQL noch als einzelne Instanz (wird Phase 2)              │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### Phase 2: Verteilte Datenbank (Woche 3-4)

```
┌─────────────────────────────────────────────────────────────────────┐
│  Ziel: PostgreSQL → YugabyteDB Migration                            │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  [ ] YugabyteDB Cluster aufsetzen (3 Nodes)                         │
│  [ ] Testumgebung: Schema-Kompatibilität prüfen                     │
│  [ ] Drizzle ORM: Connection String anpassen                        │
│  [ ] Datenmigration: pg_dump → ysqlsh                               │
│  [ ] Anwendungen testen                                             │
│  [ ] LISTEN/NOTIFY → Redis Pub/Sub migrieren (falls verwendet)      │
│  [ ] Cutover mit minimalem Downtime                                 │
│                                                                      │
│  Ergebnis:                                                          │
│  • Daten automatisch auf alle Nodes repliziert                      │
│  • Kein Datenverlust bei Node-Ausfall                               │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### Phase 3: Compute Distribution (Woche 5-6)

```
┌─────────────────────────────────────────────────────────────────────┐
│  Ziel: Verteilte AI-Workloads                                       │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  [ ] Ray Cluster aufsetzen                                          │
│  [ ] Ollama Load Balancing zwischen Nodes                           │
│  [ ] mana-llm: Multi-Backend Support                                │
│  [ ] Bildgenerierung: Verteilung auf verfügbare GPUs                │
│  [ ] Metriken: Auslastung pro Node visualisieren                    │
│                                                                      │
│  Ergebnis:                                                          │
│  • AI-Workloads automatisch auf Nodes verteilt                      │
│  • Bessere Ressourcennutzung                                        │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### Phase 4: B2B Deployment Kit (Woche 7-8)

```
┌─────────────────────────────────────────────────────────────────────┐
│  Ziel: Kunden können eigene Cluster deployen                        │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  [ ] Helm Charts für alle Mana-Services                             │
│  [ ] Installer-Script für Mac Mini Cluster                          │
│  [ ] Dokumentation: Setup-Guide für Kunden                          │
│  [ ] Tier 1: Isolated Deployment testen                             │
│  [ ] Lizenzierung: License-Key-System                               │
│  [ ] Support-Tooling: Remote-Diagnose (opt-in)                      │
│                                                                      │
│  Ergebnis:                                                          │
│  • B2B-Kunden können Self-Hosted Cluster aufsetzen                  │
│  • Standardisiertes Deployment                                       │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### Phase 5: Federation (Woche 9-12)

```
┌─────────────────────────────────────────────────────────────────────┐
│  Ziel: B2B-Kunden können zum Netzwerk beitragen                     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  [ ] Tier 2: Federated Compute implementieren                       │
│  [ ] Task-Queue für verteilte Jobs                                  │
│  [ ] Abrechnungssystem für Compute-Beiträge                         │
│  [ ] Tier 3: Flower für Federated Learning                          │
│  [ ] Tier 4: Differential Privacy für Statistiken                   │
│  [ ] Dashboard für Federation-Status                                │
│                                                                      │
│  Ergebnis:                                                          │
│  • Dezentrales Compute-Netzwerk                                     │
│  • Win-Win: Kunden sparen, Mana skaliert                            │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Appendix: Technologie-Vergleiche

### A1: Kubernetes-Distributionen

| Distribution | Lizenz | Gewicht | HA-Support | ARM64 | Besonderheit |
|--------------|--------|---------|------------|-------|--------------|
| K3s | Apache 2.0 | Leicht (~50MB) | ✅ Embedded etcd | ✅ | CNCF-zertifiziert |
| K0s | Apache 2.0 | Leicht | ✅ | ✅ | Zero-Friction |
| MicroK8s | Apache 2.0 | Mittel | ✅ | ✅ | Canonical/Ubuntu |
| RKE2 | Apache 2.0 | Mittel | ✅ | ✅ | FIPS-konform |
| kubeadm | Apache 2.0 | Standard | ✅ | ✅ | Vanilla K8s |

**Entscheidung: K3s** - Leichtestes Gewicht, beste Edge-Unterstützung, CNCF-zertifiziert.

### A2: Distributed Databases

| Datenbank | Lizenz | SQL-Kompatibilität | Consensus | Min. Nodes | ARM64 |
|-----------|--------|-------------------|-----------|------------|-------|
| YugabyteDB | Apache 2.0 | PostgreSQL 99% | Raft | 3 | ✅ |
| CockroachDB | BSL | PostgreSQL 95% | Raft | 3 | ✅ |
| TiDB | Apache 2.0 | MySQL 95% | Raft | 3 | ✅ |
| Vitess | Apache 2.0 | MySQL | - | 3 | ✅ |
| CrateDB | Apache 2.0 | PostgreSQL subset | Raft | 3 | ✅ |

**Entscheidung: YugabyteDB** - Beste PostgreSQL-Kompatibilität, echtes Open Source.

### A3: Mesh VPN Lösungen

| Lösung | Lizenz | Protokoll | Self-hosted | NAT Traversal |
|--------|--------|-----------|-------------|---------------|
| Headscale | BSD | WireGuard | ✅ | Exzellent |
| Tailscale | Proprietär | WireGuard | ❌ (SaaS) | Exzellent |
| Nebula | MIT | Custom | ✅ | Gut |
| ZeroTier | BSL | Custom | ⚠️ | Gut |
| WireGuard | GPL | WireGuard | ✅ | Manuell |

**Entscheidung: Headscale** - Self-hosted, WireGuard, Zero-Config, BSD-Lizenz.

---

## Fazit

Diese Architektur ermöglicht:

1. **Selbstheilendes Cluster** - Automatisches Failover bei Node-Ausfällen
2. **Echtes Open Source** - Kein Vendor Lock-in, keine BSL-Überraschungen
3. **Flexible Skalierung** - Von 2 Mac Minis bis zu global verteilten Clustern
4. **B2B-Ready** - Kunden können isolierte oder föderierte Instanzen betreiben
5. **Privacy by Design** - Federated Learning und Differential Privacy ermöglichen Zusammenarbeit ohne Daten zu teilen
6. **Heterogene Hardware** - Mac, Linux, Windows, Raspberry Pi - alles im selben Cluster

Die nächsten Schritte sind die Beschaffung des zweiten Mac Mini und der Start der Migration zu K3s und YugabyteDB.

---

*Dieses Dokument wurde am 31. Januar 2026 erstellt und beschreibt die Architektur-Entscheidungen für Mana Cluster v2.*
