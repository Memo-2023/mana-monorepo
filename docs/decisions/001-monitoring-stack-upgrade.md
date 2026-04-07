# ADR-001: Monitoring Stack Upgrade - VictoriaMetrics + DuckDB

**Status:** Accepted
**Date:** 2025-01-28
**Author:** Till Schneider
**Reviewers:** -

## Executive Summary

Upgrade des Mana Monitoring Stacks von Prometheus (30 Tage Retention) auf VictoriaMetrics (2 Jahre) + DuckDB (unbegrenzt) für langfristige Metriken-Speicherung und Business-Analytics.

---

## 1. Kontext & Problemstellung

### 1.1 Aktuelle Situation

Mana nutzt einen Standard-Prometheus + Grafana Stack für Monitoring:

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  NestJS Backends│────>│   Prometheus    │────>│     Grafana     │
│  (6 Services)   │     │   (30 Tage)     │     │  (5 Dashboards) │
└─────────────────┘     └─────────────────┘     └─────────────────┘
        │
        ├── mana-auth (Port 3001)
        ├── chat-backend (Port 3002)
        ├── todo-backend (Port 3018)
        ├── calendar-backend (Port 3016)
        ├── clock-backend (Port 3017)
        └── contacts-backend (Port 3015)
```

**Komponenten:**
- Prometheus v2.51.0 mit 30 Tagen Retention
- Grafana 10.4.1 mit 5 Dashboards
- Node Exporter, cAdvisor, PostgreSQL Exporter, Redis Exporter
- Alerting Rules (20+ Regeln)

### 1.2 Das Problem

**Nach 30 Tagen sind alle historischen Metriken unwiederbringlich verloren.**

| Betroffene Daten | Konsequenz |
|------------------|------------|
| User-Wachstum (`auth_users_total`) | Keine Trend-Analyse möglich |
| Historische Error Rates | Keine Langzeit-Vergleiche |
| Performance-Trends | Keine Kapazitätsplanung |
| Infrastruktur-Metriken | Keine saisonalen Muster erkennbar |

**Besonders kritisch:** Business-KPIs wie `auth_users_total`, `auth_users_created_this_month` sind Point-in-Time Snapshots. Ohne historische Daten ist es unmöglich zu rekonstruieren, wie viele User vor 2 Monaten existierten.

### 1.3 Anforderungen

| Anforderung | Priorität |
|-------------|-----------|
| Operative Metriken für mindestens 1-2 Jahre speichern | Hoch |
| Business-KPIs unbegrenzt speichern | Hoch |
| Keine Änderung an bestehenden Dashboards | Mittel |
| Minimaler zusätzlicher Ressourcenverbrauch | Mittel |
| Einfache Wartung und Backup | Mittel |

---

## 2. Evaluierte Optionen

### 2.1 Option A: Prometheus Retention erhöhen

**Ansatz:** `--storage.tsdb.retention.time=365d`

**Vorteile:**
- Keine Migration nötig
- Keine neuen Komponenten

**Nachteile:**
- Prometheus TSDB ist nicht für Langzeit optimiert
- RAM-Verbrauch steigt linear mit Retention
- Queries über alte Daten werden langsam
- Compaction-Overhead bei großen Datenmengen

**Bewertung:** Kurzfristige Lösung, skaliert nicht.

### 2.2 Option B: Thanos / Cortex

**Ansatz:** Prometheus + Langzeit-Storage-Layer (S3/MinIO)

**Vorteile:**
- Industriestandard für große Deployments
- Unbegrenzte Retention möglich

**Nachteile:**
- Hohe Komplexität (5+ zusätzliche Komponenten)
- Overkill für Mana's Größe (~50k Time Series)
- Signifikanter Ops-Overhead

**Bewertung:** Overengineered für unseren Use Case.

### 2.3 Option C: VictoriaMetrics (gewählt)

**Ansatz:** Drop-in Replacement für Prometheus

**Vorteile:**
- 100% Prometheus-kompatibel (PromQL, Config-Format, Exporters)
- 3-10x bessere Kompression
- 5-10x weniger RAM-Verbrauch
- Schnellere Queries über historische Daten
- Single Binary, einfaches Deployment
- Migration in 10 Minuten

**Nachteile:**
- Weniger bekannt als Prometheus (aber wachsende Community)
- CNCF Sandbox (nicht Graduated wie Prometheus)

**Bewertung:** Beste Balance aus Einfachheit und Leistung.

### 2.4 Option D: PostgreSQL für Business-Metriken

**Ansatz:** Tägliche Snapshots in PostgreSQL speichern

**Vorteile:**
- Bestehende Infrastruktur nutzen
- SQL für Queries
- Unbegrenzte Retention

**Nachteile:**
- Nicht optimiert für Analytics-Queries
- Connection-Pool Overhead
- Row-based Storage ineffizient für Aggregationen

**Bewertung:** Funktional, aber nicht optimal für Analytics.

### 2.5 Option E: DuckDB für Business-Metriken (gewählt)

**Ansatz:** Embedded OLAP-Datenbank für tägliche Business-KPI Snapshots

**Vorteile:**
- Kein Server nötig (embedded, single file)
- Column-oriented = perfekt für Analytics
- 10-100x schneller als PostgreSQL für Aggregationen
- Exzellente Kompression
- Native Parquet Import/Export
- SQL-kompatibel

**Nachteile:**
- Nicht für concurrent writes (irrelevant bei 1x täglich)
- Keine native Grafana-Integration (API-Endpoint nötig)

**Bewertung:** Perfekt für den Use Case (append-only, read-heavy, analytics).

---

## 3. Entscheidung

### 3.1 Gewählte Architektur

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    Mana Monitoring Stack v2                          │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  OPERATIVE METRIKEN (High-Frequency Time Series)                        │
│  ════════════════════════════════════════════════                       │
│                                                                          │
│  ┌──────────────┐     ┌──────────────────┐     ┌─────────────────┐     │
│  │   Backends   │────>│  VictoriaMetrics │────>│     Grafana     │     │
│  │   /metrics   │     │                  │     │                 │     │
│  │              │     │  Retention: 2y   │     │  Existing       │     │
│  │  + Exporters │     │  Scrape: 15-30s  │     │  Dashboards     │     │
│  └──────────────┘     └──────────────────┘     └─────────────────┘     │
│                                                        ▲                │
│                                                        │                │
│  BUSINESS METRIKEN (Daily Snapshots, Analytics)        │                │
│  ══════════════════════════════════════════════        │                │
│                                                        │                │
│  ┌──────────────┐     ┌──────────────────┐            │                │
│  │  Daily Cron  │────>│      DuckDB      │────────────┘                │
│  │  00:00 UTC   │     │                  │     (via JSON API)          │
│  │              │     │  Retention: ∞    │                             │
│  │  Snapshots:  │     │  File: metrics.db│                             │
│  │  - Users     │     │  Size: ~10MB/year│                             │
│  │  - Growth    │     │                  │                             │
│  │  - Features  │     │  Backup: cp file │                             │
│  └──────────────┘     └──────────────────┘                             │
│                              │                                          │
│                              ▼                                          │
│                       ┌──────────────┐                                  │
│                       │Parquet Export│                                  │
│                       │  (Archiv)    │                                  │
│                       └──────────────┘                                  │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### 3.2 Daten-Aufteilung

| Datentyp | Storage | Retention | Grund |
|----------|---------|-----------|-------|
| CPU, Memory, Disk | VictoriaMetrics | 2 Jahre | High-frequency, Time-Series |
| HTTP Requests, Latency | VictoriaMetrics | 2 Jahre | High-frequency, PromQL |
| Error Rates, Status Codes | VictoriaMetrics | 2 Jahre | Alerting, Debugging |
| Container Metrics | VictoriaMetrics | 2 Jahre | Kapazitätsplanung |
| **User Counts** | DuckDB | Unbegrenzt | Business KPI, Trend-Analyse |
| **User Growth** | DuckDB | Unbegrenzt | Business KPI |
| **Feature Usage** | DuckDB | Unbegrenzt | Product Analytics |
| **Revenue/Subscriptions** | DuckDB | Unbegrenzt | Business KPI |

### 3.3 Warum diese Kombination?

**VictoriaMetrics für operative Metriken:**
- Prometheus-kompatibel = keine Dashboard-Änderungen
- 2 Jahre Retention bei ~15GB Storage
- Schnelle Queries auch über historische Daten
- Bewährte Time-Series Datenbank

**DuckDB für Business-Metriken:**
- Perfekt für "1x täglich schreiben, oft lesen"
- SQL für komplexe Analytics-Queries
- Single-File = triviales Backup
- Kein zusätzlicher Server/Container
- Unbegrenzte Retention bei minimalem Footprint

---

## 4. Technische Details

### 4.1 VictoriaMetrics Konfiguration

```yaml
# docker-compose.macmini.yml
services:
  victoriametrics:
    image: victoriametrics/victoria-metrics:v1.99.0
    container_name: victoriametrics
    restart: unless-stopped
    command:
      - '-storageDataPath=/storage'
      - '-retentionPeriod=2y'
      - '-httpListenAddr=:8428'
      - '-promscrape.config=/etc/prometheus/prometheus.yml'
      - '-promscrape.config.strictParse=false'
    volumes:
      - vm-storage:/storage
      - ./prometheus/prometheus.yml:/etc/prometheus/prometheus.yml:ro
      - ./prometheus/alerts.yml:/etc/prometheus/alerts.yml:ro
    ports:
      - "8428:8428"
    networks:
      - mana-network
```

**Ressourcen-Vergleich (geschätzt):**

| Metrik | Prometheus (30d) | VictoriaMetrics (2y) |
|--------|------------------|----------------------|
| RAM | ~2 GB | ~500 MB |
| Disk | ~5 GB | ~15 GB |
| CPU | Höher (Compaction) | Niedriger |

### 4.2 DuckDB Schema

```sql
-- Haupt-Tabelle für tägliche Snapshots
CREATE TABLE daily_metrics (
    date DATE PRIMARY KEY,

    -- User Metrics
    total_users INTEGER NOT NULL,
    verified_users INTEGER NOT NULL,
    new_users_today INTEGER NOT NULL,
    new_users_week INTEGER NOT NULL,
    new_users_month INTEGER NOT NULL,

    -- Engagement (Platzhalter für Zukunft)
    daily_active_users INTEGER,
    weekly_active_users INTEGER,
    monthly_active_users INTEGER,

    -- Per-App Metrics (Platzhalter)
    chat_messages_sent INTEGER,
    pictures_generated INTEGER,

    -- Infrastructure Snapshots
    total_db_size_bytes BIGINT,
    total_storage_size_bytes BIGINT,

    -- Metadata
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index für schnelle Range-Queries
CREATE INDEX idx_daily_metrics_date ON daily_metrics(date);

-- View für monatliche Aggregation
CREATE VIEW monthly_metrics AS
SELECT
    DATE_TRUNC('month', date) AS month,
    MAX(total_users) AS total_users_eom,
    SUM(new_users_today) AS new_users,
    AVG(daily_active_users) AS avg_dau
FROM daily_metrics
GROUP BY DATE_TRUNC('month', date);
```

### 4.3 DuckDB Service Implementation

```typescript
// services/mana-auth/src/analytics/analytics.service.ts
@Injectable()
export class AnalyticsService {
  private db: Database;

  constructor(
    private readonly usersService: UsersService,
    private readonly configService: ConfigService,
  ) {
    const dbPath = this.configService.get('DUCKDB_PATH', '/data/metrics.duckdb');
    this.db = new Database(dbPath);
    this.initializeSchema();
  }

  @Cron('0 0 * * *') // Täglich um Mitternacht UTC
  async recordDailySnapshot(): Promise<void> {
    const today = new Date().toISOString().split('T')[0];

    const metrics = {
      date: today,
      total_users: await this.usersService.countTotal(),
      verified_users: await this.usersService.countVerified(),
      new_users_today: await this.usersService.countCreatedToday(),
      new_users_week: await this.usersService.countCreatedThisWeek(),
      new_users_month: await this.usersService.countCreatedThisMonth(),
      total_db_size_bytes: await this.getDbSize(),
    };

    this.db.run(`
      INSERT OR REPLACE INTO daily_metrics
      (date, total_users, verified_users, new_users_today,
       new_users_week, new_users_month, total_db_size_bytes)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [
      metrics.date,
      metrics.total_users,
      metrics.verified_users,
      metrics.new_users_today,
      metrics.new_users_week,
      metrics.new_users_month,
      metrics.total_db_size_bytes,
    ]);
  }

  async getUserGrowth(months: number = 12): Promise<GrowthData[]> {
    return this.db.all(`
      SELECT
        date,
        total_users,
        total_users - LAG(total_users) OVER (ORDER BY date) as growth
      FROM daily_metrics
      WHERE date > CURRENT_DATE - INTERVAL '${months} months'
      ORDER BY date
    `);
  }
}
```

### 4.4 Grafana Integration

**VictoriaMetrics:**
```yaml
# docker/grafana/provisioning/datasources/prometheus.yml
apiVersion: 1
datasources:
  - name: Prometheus
    type: prometheus
    url: http://victoriametrics:8428  # Nur URL ändert sich
    isDefault: true
    editable: false
```

**DuckDB (via JSON API):**
```yaml
# docker/grafana/provisioning/datasources/duckdb.yml
apiVersion: 1
datasources:
  - name: Business Metrics
    type: simpod-json-datasource
    url: http://mana-auth:3001/api/analytics
    isDefault: false
    editable: false
```

---

## 5. Migration

### 5.1 Migrationspfad

```
Phase 1: VictoriaMetrics Deployment (Zero Downtime)
═══════════════════════════════════════════════════
1. VictoriaMetrics Container hinzufügen
2. Parallel zu Prometheus laufen lassen
3. Grafana Datasource auf VM umstellen
4. Prometheus Container entfernen

Phase 2: DuckDB Integration
═══════════════════════════
1. DuckDB Dependency hinzufügen
2. Analytics Service implementieren
3. Cron-Job aktivieren
4. API Endpoints erstellen
5. Grafana Dashboard für Business Metrics

Phase 3: Historische Daten (Optional)
═════════════════════════════════════
1. Prometheus Daten exportieren
2. In VictoriaMetrics importieren
3. Initiale DuckDB-Befüllung aus Prometheus
```

### 5.2 Rollback-Plan

**VictoriaMetrics → Prometheus:**
- Gleiche Config-Datei funktioniert
- Grafana Datasource URL zurückändern
- Container tauschen

**DuckDB:**
- Service deaktivieren
- Keine Abhängigkeiten in anderen Services

---

## 6. Monitoring & Alerting

### 6.1 VictoriaMetrics Self-Monitoring

```yaml
# prometheus/alerts.yml (funktioniert auch mit VM)
groups:
  - name: victoriametrics
    rules:
      - alert: VMStorageSpaceLow
        expr: vm_free_disk_space_bytes / vm_available_disk_space_bytes < 0.1
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "VictoriaMetrics disk space low"
```

### 6.2 DuckDB Health Check

```typescript
// Endpoint: GET /api/analytics/health
{
  "status": "healthy",
  "database_size_bytes": 10485760,
  "last_snapshot": "2025-01-28",
  "total_records": 365
}
```

---

## 7. Backup-Strategie

### 7.1 VictoriaMetrics

```bash
# Snapshot erstellen (built-in)
curl -X POST "http://victoriametrics:8428/snapshot/create"

# Backup zu S3/MinIO
vmbackup -storageDataPath=/storage -snapshot.createURL="http://localhost:8428/snapshot/create" -dst=s3://backups/vm/
```

### 7.2 DuckDB

```bash
# Einfacher File-Copy (konsistent da single-writer)
cp /data/metrics.duckdb /backup/metrics-$(date +%Y-%m-%d).duckdb

# Oder Parquet-Export für Archivierung
duckdb /data/metrics.duckdb -c "COPY daily_metrics TO '/backup/metrics.parquet' (FORMAT PARQUET)"
```

---

## 8. Kosten & Ressourcen

### 8.1 Storage-Projektion (2 Jahre)

| Komponente | Jetzt | Nach Migration |
|------------|-------|----------------|
| Prometheus | 5 GB (30d) | 0 GB (entfernt) |
| VictoriaMetrics | 0 GB | ~15 GB (2y) |
| DuckDB | 0 GB | ~20 MB (2y) |
| **Total** | **5 GB** | **~15 GB** |

### 8.2 RAM-Projektion

| Komponente | Jetzt | Nach Migration |
|------------|-------|----------------|
| Prometheus | ~2 GB | 0 GB |
| VictoriaMetrics | 0 GB | ~500 MB |
| DuckDB | 0 GB | ~50 MB (on-demand) |
| **Total** | **~2 GB** | **~550 MB** |

---

## 9. Implementierungsplan

### Phase 1: VictoriaMetrics (Tag 1)
- [ ] docker-compose.macmini.yml aktualisieren
- [ ] VictoriaMetrics Container hinzufügen
- [ ] Grafana Datasource konfigurieren
- [ ] Bestehende Dashboards testen
- [ ] Prometheus Container entfernen

### Phase 2: DuckDB Service (Tag 1-2)
- [ ] duckdb Package installieren
- [ ] AnalyticsModule erstellen
- [ ] DuckDB Schema initialisieren
- [ ] Daily Snapshot Cron-Job
- [ ] API Endpoints für Grafana

### Phase 3: Dashboards & Dokumentation (Tag 2)
- [ ] Business Metrics Dashboard erstellen
- [ ] Master Overview Dashboard aktualisieren
- [ ] Dokumentation finalisieren
- [ ] Backup-Scripts erstellen

---

## 10. Entscheidungsmatrix

| Kriterium | Gewicht | Prometheus | VM + DuckDB | Score |
|-----------|---------|------------|-------------|-------|
| Langzeit-Retention | 30% | 2/10 | 10/10 | +2.4 |
| Ressourceneffizienz | 20% | 4/10 | 9/10 | +1.0 |
| Migrationsaufwand | 15% | 10/10 | 8/10 | -0.3 |
| Wartbarkeit | 15% | 7/10 | 8/10 | +0.15 |
| Analytics-Fähigkeit | 10% | 3/10 | 9/10 | +0.6 |
| Backup-Einfachheit | 10% | 5/10 | 9/10 | +0.4 |
| **Gesamt** | 100% | **4.7/10** | **9.1/10** | **+4.4** |

---

## 11. Risiken & Mitigationen

| Risiko | Wahrscheinlichkeit | Impact | Mitigation |
|--------|-------------------|--------|------------|
| VM nicht 100% PromQL-kompatibel | Niedrig | Mittel | Dashboards vorab testen |
| DuckDB Datenverlust | Niedrig | Hoch | Tägliches Backup |
| Cron-Job Ausfall | Mittel | Niedrig | Monitoring + Catch-up Logic |
| Storage voll | Niedrig | Mittel | Alerting bei 80% |

---

## 12. Referenzen

- [VictoriaMetrics Dokumentation](https://docs.victoriametrics.com/)
- [VictoriaMetrics vs Prometheus Benchmark](https://valyala.medium.com/prometheus-vs-victoriametrics-benchmark-on-node-exporter-metrics-4ca29c75590f)
- [DuckDB Dokumentation](https://duckdb.org/docs/)
- [Grafana JSON Datasource](https://grafana.com/grafana/plugins/simpod-json-datasource/)

---

## Appendix A: Bestehende Dashboards

| Dashboard | UID | Änderung nötig |
|-----------|-----|----------------|
| System Overview | `system-overview` | Keine |
| Backends & Docker | `backends-docker` | Keine |
| Application Details | `application-details` | Keine |
| Database Details | `database-details` | Keine |
| User Statistics | `user-statistics` | Keine |
| Master Overview | `master-overview` | Business Metrics hinzufügen |

## Appendix B: Prometheus Config Kompatibilität

Die bestehende `prometheus.yml` funktioniert ohne Änderung mit VictoriaMetrics:

```yaml
# Alle Scrape-Configs bleiben identisch
scrape_configs:
  - job_name: 'mana-auth'
    static_configs:
      - targets: ['mana-auth:3001']
    metrics_path: '/metrics'
    scrape_interval: 30s
  # ... alle anderen Jobs
```
