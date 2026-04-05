# ADR-002: Mana Cluster & Federation Architecture

**Status:** Accepted
**Date:** 2026-01-31
**Author:** Till Schneider
**Category:** Architecture, Infrastructure

## Context

Die gesamte Mana-Infrastruktur läuft aktuell auf einem einzigen Mac Mini M4. Dies stellt ein erhebliches Risiko dar:

- **Single Point of Failure:** Fällt der Mac Mini aus, sind alle Services offline
- **Keine Daten-Redundanz:** Hardware-Defekt kann zu Datenverlust führen
- **Keine Skalierungsmöglichkeit:** Ressourcen auf ein Gerät beschränkt
- **Kein B2B-Support:** Keine Möglichkeit für Kunden, eigene Instanzen zu betreiben

## Decision

Wir implementieren ein selbstheilendes, dezentrales Multi-Node-Cluster mit folgenden Technologie-Entscheidungen:

### 1. Orchestrierung: K3s (Kubernetes)

**Gewählt:** K3s
**Abgelehnt:** Nomad (HashiCorp), Docker Swarm

**Begründung:**
- Apache 2.0 Lizenz (echtes Open Source)
- CNCF-Governance (neutral, community-driven)
- Industriestandard mit riesigem Ecosystem
- Native HA-Unterstützung
- ARM64 + x86_64 Support

**Kritischer Faktor:** HashiCorp wechselte im August 2023 zu BSL (Business Source License). Dies ist keine Open-Source-Lizenz und birgt langfristige Risiken für kommerzielle Nutzung.

### 2. Datenbank: YugabyteDB

**Gewählt:** YugabyteDB
**Abgelehnt:** CockroachDB, TiDB

**Begründung:**
- Apache 2.0 Lizenz (keine Feature-Gating wie bei CockroachDB)
- 99% PostgreSQL-Kompatibilität (Drizzle ORM funktioniert ohne Änderungen)
- Geo-Distribution ohne Enterprise-Lizenz
- Trigger und Stored Procedures unterstützt

**Migration:** Bestehende PostgreSQL-Datenbanken können via pg_dump/ysqlsh migriert werden.

### 3. Mesh Networking: Headscale

**Gewählt:** Headscale (self-hosted Tailscale)
**Abgelehnt:** ZeroTier (BSL), natives WireGuard

**Begründung:**
- BSD-Lizenz
- WireGuard-basiert (modern, schnell, sicher)
- Zero-Config für neue Nodes
- Exzellentes NAT Traversal

### 4. Distributed Computing: Ray

**Gewählt:** Ray
**Begründung:**
- Apache 2.0 Lizenz
- Python-native (passt zu ML-Workloads)
- Einfache Task-Distribution
- Integration mit Ollama möglich

### 5. Federated Learning: Flower

**Gewählt:** Flower
**Begründung:**
- Apache 2.0 Lizenz
- Einfache Integration
- Privacy-by-Design

## Consequences

### Positive

1. **High Availability:** Automatisches Failover bei Node-Ausfall
2. **Keine Vendor Lock-in:** Alle Kernkomponenten echtes Open Source
3. **Skalierbarkeit:** Von 2 Nodes bis zu global verteilten Clustern
4. **B2B-Ready:** Kunden können isolierte oder föderierte Instanzen betreiben
5. **Heterogene Hardware:** Mac, Linux, Windows, Raspberry Pi im selben Cluster

### Negative

1. **Komplexität:** Kubernetes hat steilere Lernkurve als Docker Compose
2. **Migration:** Bestehende docker-compose.yml muss zu K8s Manifests konvertiert werden
3. **Ressourcen:** K3s benötigt ~500MB RAM pro Node (mehr als Nomad)

### Neutral

1. **LISTEN/NOTIFY:** Nicht von YugabyteDB unterstützt, muss auf Redis Pub/Sub migriert werden (falls verwendet)

## B2B Deployment Tiers

| Tier | Name | Beschreibung | Datenisolation |
|------|------|--------------|----------------|
| 1 | Isolated | Komplett eigenes Cluster, keine Verbindung zu Mana | 100% |
| 2 | Federated Compute | Eigene DB, kann anonymisierte Compute-Tasks ausführen | 100% |
| 3 | Federated Learning | Wie Tier 2, plus lokales ML-Training mit Gradienten-Sharing | 100% |
| 4 | Full Federation | Maximum Sharing mit Differential Privacy und ZK-Proofs | 100% |

## Open-Source Stack

```
Orchestration:     K3s (Apache 2.0)
Mesh Networking:   Headscale (BSD)
Database:          YugabyteDB (Apache 2.0)
Object Storage:    MinIO (AGPL 3.0)
LLM Runtime:       Ollama (MIT)
Distributed AI:    Ray (Apache 2.0)
Federated ML:      Flower (Apache 2.0)
Secrets:           Infisical (MIT)
IaC:               OpenTofu (MPL 2.0)
Monitoring:        VictoriaMetrics (Apache 2.0)
```

## Vermiedene Technologien (BSL/SSPL)

- HashiCorp: Terraform, Vault, Nomad, Consul
- CockroachDB
- MongoDB
- Elasticsearch
- ZeroTier

## Hardware-Empfehlungen

### Mana Central (Minimal HA)
- 2x Mac Mini M4 (16GB RAM, 512GB SSD)
- Kosten: ~2.400€

### Mana Central (Empfohlen)
- 2x Mac Mini M4 Pro (24GB RAM)
- 1x Raspberry Pi 5 (Tiebreaker)
- Kosten: ~4.000€

## Migrations-Roadmap

1. **Phase 1 (Woche 1-2):** Zweiter Mac Mini, K3s HA Cluster, Headscale
2. **Phase 2 (Woche 3-4):** PostgreSQL → YugabyteDB Migration
3. **Phase 3 (Woche 5-6):** Ray Cluster für verteilte AI-Workloads
4. **Phase 4 (Woche 7-8):** B2B Deployment Kit (Helm Charts)
5. **Phase 5 (Woche 9-12):** Federation Features (Tier 2-4)

## References

- [K3s Documentation](https://docs.k3s.io/)
- [YugabyteDB Documentation](https://docs.yugabyte.com/)
- [Headscale GitHub](https://github.com/juanfont/headscale)
- [Ray Documentation](https://docs.ray.io/)
- [Flower Documentation](https://flower.dev/docs/)
- [HashiCorp BSL Announcement](https://www.hashicorp.com/blog/hashicorp-adopts-business-source-license)

## Full Documentation

Siehe auch: `apps/mana/apps/landing/src/content/blueprints/001-mana-cluster-federation-architecture.md` für die ausführliche Version mit Diagrammen.
