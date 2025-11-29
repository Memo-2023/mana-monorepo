# Airbyte - Der ultimative Guide für Memoro

## Was ist Airbyte?

Airbyte ist eine **Open-Source ELT (Extract, Load, Transform) Platform**, die Daten von 350+ Quellen in deine Datenbank synchronisiert. Stell dir vor: Ein Tool, das automatisch alle deine Business-Daten sammelt und zentral speichert.

```
[Datenquellen]  →  [Airbyte]  →  [Deine Datenbank]  →  [Dashboard]
   APIs             ELT Tool      PostgreSQL           Metabase
```

## Warum Airbyte perfekt für Memoro ist

### ✅ Deine Datenquellen sind bereits unterstützt:

| Datenquelle | Airbyte Connector | Status | Sync-Frequenz |
|-------------|------------------|---------|---------------|
| **Google Search Console** | ✅ Offiziell | Stable | Täglich |
| **Google Play Console** | ✅ Offiziell | Beta | Täglich |
| **App Store Connect** | ✅ Community | Beta | Täglich |
| **PostHog** | ✅ Offiziell | Stable | Stündlich |
| **RevenueCat** | ⚠️ Custom API | Machbar | Real-time |
| **Umami Analytics** | ⚠️ Custom API | Machbar | Stündlich |
| **PostgreSQL** (Backup) | ✅ Offiziell | Stable | Real-time |

### Kernfunktionen

1. **Incremental Sync** - Lädt nur neue Daten (spart Zeit & Ressourcen)
2. **Schema Management** - Erstellt automatisch Tabellen
3. **Error Handling** - Automatische Wiederholungen bei Fehlern
4. **Monitoring** - Dashboard zeigt Status aller Syncs
5. **Transformations** - Daten können beim Import bereinigt werden

## Wie funktioniert Airbyte?

### Architektur
```
┌─────────────────────────────────────────────────┐
│                  AIRBYTE CORE                    │
├───────────────────────────────────────────────────┤
│  Web UI  │  API  │  Scheduler  │  Worker Pool   │
└───────────────────────────────────────────────────┘
         ↓                              ↑
┌──────────────┐              ┌──────────────────┐
│  Connectors  │              │   Destinations   │
├──────────────┤              ├──────────────────┤
│ • APIs       │              │ • PostgreSQL     │
│ • Databases  │              │ • BigQuery       │
│ • Files      │              │ • Snowflake      │
│ • Webhooks   │              │ • S3             │
└──────────────┘              └──────────────────┘
```

### Sync-Prozess
1. **Extract**: Connector holt Daten von API
2. **Normalize**: Daten werden in einheitliches Format gebracht
3. **Load**: Daten werden in Ziel-DB geschrieben
4. **Log**: Alle Aktivitäten werden protokolliert

## Installation & Setup

### Option 1: Docker (Empfohlen für Entwicklung)

```bash
# 1. Airbyte herunterladen
git clone https://github.com/airbytehq/airbyte.git
cd airbyte

# 2. Starten (dauert ~5 Minuten beim ersten Mal)
./run-ab-platform.sh

# 3. Öffne Browser
# http://localhost:8000
# Username: airbyte
# Password: password
```

### Option 2: Docker Compose (Production)

```yaml
# docker-compose.yml
version: "3.8"

services:
  # PostgreSQL für Airbyte Metadata
  db:
    image: postgres:13-alpine
    restart: unless-stopped
    environment:
      POSTGRES_DB: airbyte
      POSTGRES_USER: airbyte
      POSTGRES_PASSWORD: ${DATABASE_PASSWORD}
    volumes:
      - db_data:/var/lib/postgresql/data

  # Airbyte Server
  server:
    image: airbyte/server:0.50.0
    restart: unless-stopped
    environment:
      DATABASE_URL: postgresql://airbyte:${DATABASE_PASSWORD}@db:5432/airbyte
      WORKSPACE_ROOT: /tmp/workspace
      LOCAL_ROOT: /tmp/airbyte_local
      TRACKING_STRATEGY: segment
    ports:
      - "8001:8001"
    volumes:
      - workspace:/tmp/workspace
      - local_data:/tmp/airbyte_local

  # Airbyte WebApp
  webapp:
    image: airbyte/webapp:0.50.0
    restart: unless-stopped
    ports:
      - "8000:80"
    environment:
      INTERNAL_API_HOST: server:8001

  # Airbyte Scheduler
  scheduler:
    image: airbyte/scheduler:0.50.0
    restart: unless-stopped
    environment:
      DATABASE_URL: postgresql://airbyte:${DATABASE_PASSWORD}@db:5432/airbyte
      WORKSPACE_ROOT: /tmp/workspace
    volumes:
      - workspace:/tmp/workspace

  # Workers für Sync Jobs
  worker:
    image: airbyte/worker:0.50.0
    restart: unless-stopped
    environment:
      DATABASE_URL: postgresql://airbyte:${DATABASE_PASSWORD}@db:5432/airbyte
      WORKSPACE_ROOT: /tmp/workspace
      LOCAL_ROOT: /tmp/airbyte_local
    volumes:
      - workspace:/tmp/workspace
      - local_data:/tmp/airbyte_local

  # Deine Analytics Datenbank (Ziel)
  analytics-db:
    image: postgres:14-alpine
    restart: unless-stopped
    environment:
      POSTGRES_DB: memoro_analytics
      POSTGRES_USER: memoro
      POSTGRES_PASSWORD: ${ANALYTICS_DB_PASSWORD}
    ports:
      - "5432:5432"
    volumes:
      - analytics_data:/var/lib/postgresql/data

volumes:
  db_data:
  workspace:
  local_data:
  analytics_data:
```

### Option 3: Airbyte Cloud (Managed)

```bash
# Kostenlos bis 1GB/Monat
# Registriere dich: https://cloud.airbyte.com
# Keine Installation nötig!
```

## Schritt-für-Schritt: Erste Datenquelle verbinden

### Beispiel: Google Search Console → PostgreSQL

#### 1. Source einrichten (Google Search Console)

```javascript
// In Airbyte UI:
// Sources → New Source → Search Console

{
  "site_urls": ["https://memoro.ai"],
  "start_date": "2024-01-01",
  "authorization": {
    "auth_type": "Service",
    "service_account_info": "credentials.json content"
  },
  "custom_reports": [
    {
      "name": "keyword_performance",
      "dimensions": ["query", "page", "country", "device"],
      "metrics": ["clicks", "impressions", "ctr", "position"]
    }
  ]
}
```

#### 2. Destination einrichten (PostgreSQL)

```javascript
{
  "host": "localhost",
  "port": 5432,
  "database": "memoro_analytics",
  "username": "memoro",
  "password": "your_password",
  "schema": "search_console",  // Namespace für diese Daten
  "ssl": true
}
```

#### 3. Connection erstellen

```javascript
{
  "name": "Search Console to PostgreSQL",
  "source": "google-search-console",
  "destination": "postgres",
  "sync_frequency": "24 hours",
  "sync_mode": "incremental",  // Nur neue Daten
  "streams": [
    {
      "name": "search_analytics",
      "sync_mode": "incremental",
      "cursor_field": "date"
    }
  ]
}
```

## Praktisches Beispiel: Alle Memoro-Daten sammeln

### 1. Setup Script

```python
# setup_airbyte_connections.py
import requests
import json
from typing import Dict, Any

class AirbyteSetup:
    def __init__(self, host="http://localhost:8000"):
        self.base_url = f"{host}/api/v1"
        self.headers = {"Content-Type": "application/json"}
    
    def create_source(self, config: Dict[str, Any]):
        """Erstellt eine neue Datenquelle"""
        response = requests.post(
            f"{self.base_url}/sources/create",
            json=config,
            headers=self.headers
        )
        return response.json()
    
    def create_destination(self, config: Dict[str, Any]):
        """Erstellt ein neues Ziel"""
        response = requests.post(
            f"{self.base_url}/destinations/create",
            json=config,
            headers=self.headers
        )
        return response.json()
    
    def create_connection(self, source_id: str, destination_id: str, config: Dict[str, Any]):
        """Verbindet Source mit Destination"""
        config.update({
            "sourceId": source_id,
            "destinationId": destination_id
        })
        response = requests.post(
            f"{self.base_url}/connections/create",
            json=config,
            headers=self.headers
        )
        return response.json()

def setup_memoro_analytics():
    airbyte = AirbyteSetup()
    
    # 1. PostgreSQL Destination
    print("📦 Creating PostgreSQL destination...")
    destination = airbyte.create_destination({
        "name": "Memoro Analytics DB",
        "destinationDefinitionId": "25c5221d-dce2-4163-ade9-739ef790f503",  # PostgreSQL
        "connectionConfiguration": {
            "host": "localhost",
            "port": 5432,
            "database": "memoro_analytics",
            "username": "memoro",
            "password": "secure_password",
            "schema": "public"
        }
    })
    dest_id = destination["destinationId"]
    
    # 2. Google Search Console Source
    print("🔍 Setting up Search Console...")
    search_console = airbyte.create_source({
        "name": "Google Search Console",
        "sourceDefinitionId": "eb4c9e00-db83-4d63-a386-39cfa91012a8",
        "connectionConfiguration": {
            "site_urls": ["https://memoro.ai"],
            "start_date": "2024-01-01",
            "authorization": {
                "auth_type": "Service",
                "service_account_info": json.dumps(load_credentials())
            }
        }
    })
    
    # 3. PostHog Source
    print("📊 Setting up PostHog...")
    posthog = airbyte.create_source({
        "name": "PostHog Analytics",
        "sourceDefinitionId": "af6d50ee-dddf-4126-a8ee-7faee990774f",
        "connectionConfiguration": {
            "api_key": "phc_xxxxxxxxxxxxx",
            "base_url": "https://app.posthog.com",
            "start_date": "2024-01-01T00:00:00Z"
        }
    })
    
    # 4. Create Connections
    print("🔗 Creating connections...")
    
    # Search Console → PostgreSQL
    airbyte.create_connection(
        search_console["sourceId"],
        dest_id,
        {
            "name": "Search Console → Analytics DB",
            "schedule": {
                "units": 24,
                "timeUnit": "hours"
            },
            "syncCatalog": {
                "streams": [{
                    "stream": {
                        "name": "search_analytics",
                        "jsonSchema": {},
                        "supportedSyncModes": ["incremental"]
                    },
                    "config": {
                        "syncMode": "incremental",
                        "cursorField": ["date"],
                        "destinationSyncMode": "append_dedup",
                        "primaryKey": [["date"], ["query"], ["page"]]
                    }
                }]
            }
        }
    )
    
    print("✅ Setup complete!")

if __name__ == "__main__":
    setup_memoro_analytics()
```

### 2. Custom Connector für Umami/RevenueCat

```yaml
# umami_connector_spec.yaml
documentationUrl: https://umami.is/docs/api
connectionSpecification:
  $schema: http://json-schema.org/draft-07/schema#
  title: Umami Analytics Spec
  type: object
  required:
    - api_url
    - api_key
    - website_id
  properties:
    api_url:
      type: string
      description: Umami API URL
      default: https://analytics.memoro.ai/api
    api_key:
      type: string
      description: API Key
      airbyte_secret: true
    website_id:
      type: string
      description: Website ID to track
    start_date:
      type: string
      format: date
      description: Start date for data sync
```

```python
# umami_source.py
from airbyte_cdk import AirbyteLogger
from airbyte_cdk.sources import AbstractSource
from airbyte_cdk.sources.streams import Stream
from airbyte_cdk.sources.streams.http import HttpStream
import requests

class UmamiStream(HttpStream):
    url_base = "https://analytics.memoro.ai/api/"
    
    def path(self, **kwargs) -> str:
        return f"websites/{self.website_id}/stats"
    
    def request_params(self, **kwargs) -> Dict[str, Any]:
        return {
            "start_date": self.start_date,
            "end_date": "today",
            "unit": "day"
        }
    
    def parse_response(self, response: requests.Response, **kwargs):
        data = response.json()
        for record in data["data"]:
            yield {
                "date": record["date"],
                "visitors": record["visitors"],
                "pageviews": record["pageviews"],
                "sessions": record["sessions"],
                "bounces": record["bounces"],
                "duration": record["duration"]
            }

class SourceUmami(AbstractSource):
    def check_connection(self, logger, config) -> bool:
        """Test API connection"""
        try:
            response = requests.get(
                f"{config['api_url']}/websites",
                headers={"Authorization": f"Bearer {config['api_key']}"}
            )
            return response.status_code == 200
        except Exception:
            return False
    
    def streams(self, config: Dict[str, Any]) -> List[Stream]:
        return [
            UmamiStream(
                authenticator=TokenAuthenticator(token=config["api_key"]),
                website_id=config["website_id"],
                start_date=config["start_date"]
            )
        ]
```

## Daten-Transformation mit dbt

Nach dem Import kannst du die Daten mit dbt transformieren:

```sql
-- models/marts/unified_metrics.sql
WITH search_console AS (
  SELECT 
    date,
    'search_console' as source,
    SUM(clicks) as value,
    'clicks' as metric
  FROM {{ source('search_console', 'search_analytics') }}
  GROUP BY date
),

posthog_events AS (
  SELECT 
    DATE(timestamp) as date,
    'posthog' as source,
    COUNT(*) as value,
    'events' as metric  
  FROM {{ source('posthog', 'events') }}
  GROUP BY DATE(timestamp)
),

umami_stats AS (
  SELECT 
    date,
    'umami' as source,
    visitors as value,
    'visitors' as metric
  FROM {{ source('umami', 'daily_stats') }}
)

SELECT * FROM search_console
UNION ALL
SELECT * FROM posthog_events  
UNION ALL
SELECT * FROM umami_stats
```

## Monitoring & Alerting

### Airbyte Monitoring API

```python
# monitor.py
import requests
from datetime import datetime, timedelta

def check_sync_status():
    """Prüft Status aller Sync Jobs"""
    response = requests.get("http://localhost:8000/api/v1/jobs/list")
    jobs = response.json()["jobs"]
    
    failed_jobs = []
    stale_syncs = []
    
    for job in jobs:
        # Check for failures
        if job["status"] == "failed":
            failed_jobs.append({
                "connection": job["connectionName"],
                "error": job["failureReason"],
                "time": job["createdAt"]
            })
        
        # Check for stale data (no sync in 48h)
        last_sync = datetime.fromisoformat(job["createdAt"])
        if datetime.now() - last_sync > timedelta(hours=48):
            stale_syncs.append({
                "connection": job["connectionName"],
                "last_sync": last_sync
            })
    
    if failed_jobs or stale_syncs:
        send_alert(failed_jobs, stale_syncs)

def send_alert(failed_jobs, stale_syncs):
    """Sendet Slack Alert"""
    webhook_url = "https://hooks.slack.com/services/xxx"
    
    message = "⚠️ *Airbyte Alert*\n"
    
    if failed_jobs:
        message += "\n❌ *Failed Syncs:*\n"
        for job in failed_jobs:
            message += f"• {job['connection']}: {job['error']}\n"
    
    if stale_syncs:
        message += "\n⏰ *Stale Data:*\n"
        for sync in stale_syncs:
            message += f"• {sync['connection']}: Last sync {sync['last_sync']}\n"
    
    requests.post(webhook_url, json={"text": message})

# Run every hour
if __name__ == "__main__":
    check_sync_status()
```

## Kosten & Performance

### Self-Hosted Kosten
- **Server**: ~20-50€/Monat (4GB RAM minimum)
- **Storage**: ~0.10€/GB/Monat
- **Beispiel**: 10GB Daten = ~30€/Monat total

### Airbyte Cloud Preise
- **Free**: 1GB/Monat
- **Starter**: $100/Monat für 10GB
- **Pro**: Custom Pricing

### Performance-Tipps
1. **Incremental Sync** verwenden wo möglich
2. **Sync-Frequenz** anpassen (nicht alles muss stündlich sein)
3. **Deduplizierung** in Destination aktivieren
4. **Monitoring** für Failed Syncs einrichten

## Troubleshooting

### Häufige Probleme

**Problem: "Connection refused"**
```bash
# Docker läuft nicht
docker ps
# Wenn leer:
./run-ab-platform.sh
```

**Problem: "Out of Memory"**
```yaml
# docker-compose.yml anpassen
services:
  worker:
    mem_limit: 4g
    environment:
      JAVA_OPTS: "-Xmx3g"
```

**Problem: "Sync dauert ewig"**
```sql
-- Check active syncs
SELECT * FROM airbyte_internal.jobs 
WHERE status = 'running' 
ORDER BY created_at DESC;

-- Cancel stuck job
UPDATE airbyte_internal.jobs 
SET status = 'cancelled' 
WHERE id = 'stuck-job-id';
```

## Alternative zu Airbyte: Meltano

Falls Airbyte zu komplex ist, schau dir **Meltano** an:

```bash
# Installation
pip install meltano

# Project erstellen
meltano init memoro-analytics

# Google Search Console Tap hinzufügen
meltano add extractor tap-google-search-console
meltano add loader target-postgres

# Konfigurieren & Ausführen
meltano config tap-google-search-console set ...
meltano run tap-google-search-console target-postgres
```

## Zusammenfassung

**Airbyte ist perfekt für Memoro weil:**
- ✅ Alle deine Datenquellen werden unterstützt
- ✅ Open Source = keine Vendor Lock-in
- ✅ Einfaches UI für nicht-technische Team-Mitglieder
- ✅ Skaliert mit deinem Wachstum
- ✅ Active Community & Support

**Nächste Schritte:**
1. Airbyte lokal installieren (30 Min)
2. Erste Datenquelle verbinden (15 Min)
3. PostgreSQL als Destination einrichten (10 Min)
4. Metabase für Visualisierung installieren (20 Min)
5. Ersten Dashboard erstellen (30 Min)

**= In 2 Stunden hast du ein funktionierendes Analytics System!**