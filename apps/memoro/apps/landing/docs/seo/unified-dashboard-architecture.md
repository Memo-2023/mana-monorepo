# Unified Analytics Dashboard - Architektur & Implementierung

## Datenquellen Overview

| Quelle                    | API           | Daten                         | Update-Frequenz |
| ------------------------- | ------------- | ----------------------------- | --------------- |
| **App Store Connect**     | REST API      | Downloads, Reviews, Crashes   | Täglich         |
| **Google Play Console**   | REST API      | Installs, Revenue, Ratings    | Täglich         |
| **Umami Analytics**       | REST API      | Pageviews, Sessions, Events   | Real-time       |
| **Google Search Console** | REST API      | Rankings, Clicks, Impressions | Täglich         |
| **RevenueCat**            | REST/Webhooks | Subscriptions, MRR, Churn     | Real-time       |
| **PostHog**               | REST API      | Events, Funnels, Retention    | Real-time       |

## Architektur-Optionen

### Option 1: **Airbyte + PostgreSQL + Metabase** (Empfehlung für dich)

```
[APIs] → [Airbyte] → [PostgreSQL] → [Metabase Dashboard]
                  ↓
            [Data Warehouse]
```

**Vorteile:**

- ✅ Open Source & kostenlos
- ✅ 350+ vorgefertigte Connectors
- ✅ Self-hosted möglich
- ✅ Einfaches Setup

**Setup:**

```bash
# Docker Compose Setup
docker-compose up -d airbyte
docker-compose up -d postgres
docker-compose up -d metabase
```

### Option 2: **n8n Workflow Automation**

```
[APIs] → [n8n Workflows] → [Database] → [Custom Dashboard]
```

**Vorteile:**

- ✅ Visual Workflow Builder
- ✅ Sehr flexibel
- ✅ Self-hosted
- ✅ Fair-Code Lizenz

### Option 3: **Apache Superset + Custom Scripts**

```
[APIs] → [Python Scripts] → [PostgreSQL] → [Superset]
```

**Vorteile:**

- ✅ Vollständig Open Source
- ✅ Mächtige Visualisierungen
- ✅ SQL-basiert

### Option 4: **Managed Solutions**

**Segment** (Customer Data Platform)

- Sammelt alle Events zentral
- 200+ Integrationen
- Ab $120/Monat

**Mixpanel**

- Unified Analytics
- Kostenlos bis 100k Events/Monat
- Gute Mobile + Web Integration

**Amplitude**

- Product Analytics fokussiert
- Kostenlos bis 10M Events/Monat
- Sehr gute Cohort Analysis

## Empfohlene Architektur für Memoro

### Tech Stack

```
Data Collection Layer:
├── Airbyte (ETL)
├── n8n (Workflow Automation)
└── Custom Python Scripts (Backup)

Storage Layer:
├── PostgreSQL (Primary Database)
├── Redis (Cache)
└── S3/Minio (File Storage)

Visualization Layer:
├── Metabase (Business Metrics)
├── Grafana (Technical Metrics)
└── Custom React Dashboard (Public)
```

## Implementation Guide

### Phase 1: Setup Airbyte + PostgreSQL

```yaml
# docker-compose.yml
version: '3.8'

services:
  postgres:
    image: postgres:14
    environment:
      POSTGRES_DB: analytics
      POSTGRES_USER: memoro
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - '5432:5432'

  airbyte:
    image: airbyte/airbyte:latest
    ports:
      - '8000:8000'
    environment:
      - DATABASE_URL=postgresql://memoro:${DB_PASSWORD}@postgres:5432/analytics
    depends_on:
      - postgres

  metabase:
    image: metabase/metabase:latest
    ports:
      - '3000:3000'
    environment:
      MB_DB_TYPE: postgres
      MB_DB_DBNAME: analytics
      MB_DB_PORT: 5432
      MB_DB_USER: memoro
      MB_DB_PASS: ${DB_PASSWORD}
      MB_DB_HOST: postgres
    depends_on:
      - postgres

volumes:
  postgres_data:
```

### Phase 2: Data Collection Scripts

```python
# collectors/unified_collector.py
import asyncio
from datetime import datetime
import psycopg2
from typing import Dict, Any
import json

class UnifiedDataCollector:
    def __init__(self, db_config: Dict[str, str]):
        self.db = psycopg2.connect(**db_config)
        self.collectors = {
            'app_store': AppStoreCollector(),
            'google_play': GooglePlayCollector(),
            'umami': UmamiCollector(),
            'search_console': SearchConsoleCollector(),
            'revenuecat': RevenueCatCollector(),
            'posthog': PostHogCollector()
        }

    async def collect_all(self):
        """Sammelt Daten von allen Quellen parallel"""
        tasks = []
        for name, collector in self.collectors.items():
            tasks.append(self.collect_source(name, collector))

        results = await asyncio.gather(*tasks)
        return dict(zip(self.collectors.keys(), results))

    async def collect_source(self, name: str, collector):
        """Sammelt Daten von einer einzelnen Quelle"""
        try:
            print(f"📊 Collecting {name}...")
            data = await collector.fetch()
            await self.store_data(name, data)
            return {'status': 'success', 'records': len(data)}
        except Exception as e:
            print(f"❌ Error collecting {name}: {e}")
            return {'status': 'error', 'error': str(e)}

    async def store_data(self, source: str, data: Any):
        """Speichert Daten in PostgreSQL"""
        cursor = self.db.cursor()

        # Unified metrics table
        insert_sql = """
            INSERT INTO unified_metrics
            (source, metric_name, value, dimensions, timestamp)
            VALUES (%s, %s, %s, %s, %s)
            ON CONFLICT (source, metric_name, timestamp)
            DO UPDATE SET value = EXCLUDED.value
        """

        for record in data:
            cursor.execute(insert_sql, (
                source,
                record['metric'],
                record['value'],
                json.dumps(record.get('dimensions', {})),
                record['timestamp']
            ))

        self.db.commit()

# App Store Collector
class AppStoreCollector:
    def __init__(self):
        self.base_url = "https://api.appstoreconnect.apple.com/v1"
        self.token = self.generate_jwt()

    async def fetch(self):
        metrics = []

        # Downloads
        downloads = await self.get_downloads()
        metrics.extend([{
            'metric': 'app_downloads',
            'value': d['downloads'],
            'dimensions': {'country': d['country']},
            'timestamp': d['date']
        } for d in downloads])

        # Ratings
        ratings = await self.get_ratings()
        metrics.extend([{
            'metric': 'app_rating',
            'value': r['rating'],
            'dimensions': {'version': r['version']},
            'timestamp': datetime.now()
        } for r in ratings])

        return metrics

# Umami Collector
class UmamiCollector:
    def __init__(self):
        self.base_url = "https://analytics.memoro.ai/api"
        self.token = os.getenv('UMAMI_API_TOKEN')

    async def fetch(self):
        metrics = []

        # Website Stats
        stats = await self.get_stats('24h')
        metrics.append({
            'metric': 'website_visitors',
            'value': stats['visitors'],
            'timestamp': datetime.now()
        })
        metrics.append({
            'metric': 'website_pageviews',
            'value': stats['pageviews'],
            'timestamp': datetime.now()
        })

        # Top Pages
        pages = await self.get_top_pages()
        for page in pages[:10]:
            metrics.append({
                'metric': 'page_views',
                'value': page['views'],
                'dimensions': {'path': page['path']},
                'timestamp': datetime.now()
            })

        return metrics

# RevenueCat Collector
class RevenueCatCollector:
    def __init__(self):
        self.api_key = os.getenv('REVENUECAT_API_KEY')
        self.base_url = "https://api.revenuecat.com/v1"

    async def fetch(self):
        metrics = []

        # Overview Metrics
        overview = await self.get_overview()
        metrics.extend([
            {
                'metric': 'mrr',
                'value': overview['mrr'],
                'timestamp': datetime.now()
            },
            {
                'metric': 'active_subscriptions',
                'value': overview['active_subscriptions'],
                'timestamp': datetime.now()
            },
            {
                'metric': 'churn_rate',
                'value': overview['churn_rate'],
                'timestamp': datetime.now()
            }
        ])

        return metrics
```

### Phase 3: Unified Dashboard SQL Views

```sql
-- Create unified metrics table
CREATE TABLE unified_metrics (
    id SERIAL PRIMARY KEY,
    source VARCHAR(50),
    metric_name VARCHAR(100),
    value DECIMAL,
    dimensions JSONB,
    timestamp TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(source, metric_name, timestamp)
);

-- Create materialized view for dashboard
CREATE MATERIALIZED VIEW dashboard_summary AS
SELECT
    -- App Metrics
    (SELECT value FROM unified_metrics
     WHERE metric_name = 'app_downloads'
     AND timestamp >= NOW() - INTERVAL '24 hours'
     ORDER BY timestamp DESC LIMIT 1) as daily_downloads,

    -- Revenue Metrics
    (SELECT value FROM unified_metrics
     WHERE metric_name = 'mrr'
     ORDER BY timestamp DESC LIMIT 1) as current_mrr,

    -- Web Metrics
    (SELECT SUM(value) FROM unified_metrics
     WHERE metric_name = 'website_visitors'
     AND timestamp >= NOW() - INTERVAL '7 days') as weekly_visitors,

    -- SEO Metrics
    (SELECT AVG(value) FROM unified_metrics
     WHERE metric_name = 'search_position'
     AND dimensions->>'keyword' = 'meeting protokoll software'
     AND timestamp >= NOW() - INTERVAL '7 days') as keyword_position
WITH DATA;

-- Refresh every hour
CREATE OR REPLACE FUNCTION refresh_dashboard()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY dashboard_summary;
END;
$$ LANGUAGE plpgsql;

-- Schedule refresh
SELECT cron.schedule('refresh-dashboard', '0 * * * *', 'SELECT refresh_dashboard();');
```

### Phase 4: Real-time Dashboard (Next.js)

```typescript
// pages/api/metrics.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { Pool } from 'pg';

const pool = new Pool({
	connectionString: process.env.DATABASE_URL,
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
	const { source, metric, range = '7d' } = req.query;

	try {
		const query = `
      SELECT 
        date_trunc('day', timestamp) as date,
        metric_name,
        AVG(value) as value
      FROM unified_metrics
      WHERE 
        ($1::text IS NULL OR source = $1)
        AND ($2::text IS NULL OR metric_name = $2)
        AND timestamp >= NOW() - INTERVAL $3
      GROUP BY date, metric_name
      ORDER BY date DESC
    `;

		const result = await pool.query(query, [source, metric, range]);

		res.status(200).json({
			data: result.rows,
			summary: await getSummaryStats(),
		});
	} catch (error) {
		res.status(500).json({ error: error.message });
	}
}

async function getSummaryStats() {
	const result = await pool.query('SELECT * FROM dashboard_summary');
	return result.rows[0];
}
```

```tsx
// components/UnifiedDashboard.tsx
import { useQuery } from '@tanstack/react-query';
import { Line, Bar } from 'recharts';

export default function UnifiedDashboard() {
	const { data, isLoading } = useQuery({
		queryKey: ['metrics'],
		queryFn: () => fetch('/api/metrics').then((r) => r.json()),
		refetchInterval: 60000, // Refresh every minute
	});

	if (isLoading) return <div>Loading...</div>;

	return (
		<div className="grid grid-cols-4 gap-4 p-6">
			{/* KPI Cards */}
			<MetricCard title="MRR" value={`€${data.summary.current_mrr}`} change="+12%" trend="up" />
			<MetricCard
				title="Daily Downloads"
				value={data.summary.daily_downloads}
				change="+23%"
				trend="up"
			/>
			<MetricCard
				title="Website Visitors"
				value={data.summary.weekly_visitors}
				change="+18%"
				trend="up"
			/>
			<MetricCard
				title="SEO Position"
				value={data.summary.keyword_position?.toFixed(1)}
				change="-2.3"
				trend="up"
			/>

			{/* Charts */}
			<div className="col-span-2">
				<RevenueChart data={data.revenue} />
			</div>
			<div className="col-span-2">
				<TrafficChart data={data.traffic} />
			</div>
		</div>
	);
}
```

## Automatisierung mit GitHub Actions

```yaml
# .github/workflows/data-collection.yml
name: Collect Analytics Data

on:
  schedule:
    - cron: '0 */6 * * *' # Every 6 hours
  workflow_dispatch:

jobs:
  collect:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Setup Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.11'

      - name: Install dependencies
        run: |
          pip install -r requirements.txt

      - name: Run collectors
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
          UMAMI_API_TOKEN: ${{ secrets.UMAMI_API_TOKEN }}
          REVENUECAT_API_KEY: ${{ secrets.REVENUECAT_API_KEY }}
          POSTHOG_API_KEY: ${{ secrets.POSTHOG_API_KEY }}
          APPLE_KEY_ID: ${{ secrets.APPLE_KEY_ID }}
          GOOGLE_CREDENTIALS: ${{ secrets.GOOGLE_CREDENTIALS }}
        run: |
          python collectors/unified_collector.py

      - name: Send notification
        if: failure()
        run: |
          curl -X POST ${{ secrets.SLACK_WEBHOOK }} \
            -H 'Content-Type: application/json' \
            -d '{"text":"⚠️ Analytics collection failed"}'
```

## Kosten-Nutzen-Analyse

| Lösung                         | Setup-Zeit | Monatliche Kosten | Skalierbarkeit |
| ------------------------------ | ---------- | ----------------- | -------------- |
| **Airbyte + Metabase**         | 2-3 Tage   | €0-50 (Server)    | Hoch           |
| **n8n + Grafana**              | 3-4 Tage   | €0-30 (Server)    | Mittel         |
| **Custom Python + PostgreSQL** | 5-7 Tage   | €20-40 (Server)   | Sehr hoch      |
| **Segment + Mixpanel**         | 1 Tag      | €200-500          | Sehr hoch      |
| **Amplitude**                  | 1 Tag      | €0-300            | Hoch           |

## Empfehlung für Memoro

**Start mit:** Airbyte + PostgreSQL + Metabase

- Schnelles Setup
- Alle Datenquellen unterstützt
- Kostenlos bei Self-Hosting
- Einfache Visualisierungen

**Später erweitern mit:**

- Custom React Dashboard für öffentliche Metriken
- Grafana für technische Metriken
- n8n für komplexe Workflows

## Next Steps

1. **Woche 1:** PostgreSQL + Airbyte Setup
2. **Woche 2:** Erste Datenquellen verbinden (Search Console, Umami)
3. **Woche 3:** RevenueCat + App Store Integration
4. **Woche 4:** Metabase Dashboards erstellen
5. **Monat 2:** Custom Dashboard entwickeln
