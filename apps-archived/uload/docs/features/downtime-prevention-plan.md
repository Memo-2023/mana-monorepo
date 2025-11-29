# Downtime Prevention Plan für uLoad

## Problemanalyse

Das uLoad-Projekt war kürzlich komplett down, was zu kritischen Problemen geführt hat:

- Hauptanwendung nicht erreichbar
- Weiterleitungen funktionierten nicht
- Benutzererfahrung stark beeinträchtigt
- Potentieller Datenverlust/Inkonsistenz

## Aktuelle Architektur-Analyse

### Technology Stack

- **Frontend:** SvelteKit 2.22 mit Svelte 5.0
- **Backend:** PocketBase (https://pb.ulo.ad)
- **Hosting:** Hetzner VPS mit Coolify
- **Database:** PocketBase SQLite mit persistentem Volume
- **Deployment:** Docker mit Supervisor (Multi-Service Container)

### Kritische Single Points of Failure

1. **PocketBase Dependency**
   - Gesamte Anwendung abhängig von PocketBase Verfügbarkeit
   - Keine Fallback-Mechanismen implementiert
   - Timeout-Konfiguration zu aggressiv (5 Sekunden)

2. **Single Server Setup**
   - Ein Hetzner VPS für gesamte Infrastruktur
   - Keine Redundanz oder Load Balancing
   - Coolify als Single Point of Failure

3. **Container Architecture**
   - SvelteKit und PocketBase in einem Container
   - Supervisor als Process Manager
   - Keine Health Checks zwischen Services

4. **Rate Limiting**
   - In-Memory Store (verliert Daten bei Restart)
   - Keine Redis-Backend für Persistenz
   - Potentielle Blockierung legitimer Traffic

## Sofortmaßnahmen (Quick Wins)

### 1. Verbesserte Error Handling & Fallbacks

#### PocketBase Connection Resilience

```typescript
// src/lib/pocketbase-resilient.ts
class ResilientPocketBase {
	private retryCount = 0;
	private maxRetries = 3;
	private backoffMs = 1000;

	async withRetry<T>(operation: () => Promise<T>): Promise<T> {
		for (let i = 0; i <= this.maxRetries; i++) {
			try {
				return await operation();
			} catch (error) {
				if (i === this.maxRetries) throw error;
				await this.delay(this.backoffMs * Math.pow(2, i));
			}
		}
		throw new Error('Max retries exceeded');
	}

	private delay(ms: number): Promise<void> {
		return new Promise((resolve) => setTimeout(resolve, ms));
	}
}
```

#### Graceful Degradation

- Cache-basierte Fallbacks für kritische Daten
- Offline-Mode für Basis-Funktionalität
- Error Boundaries in allen Komponenten

### 2. Enhanced Monitoring

#### Health Check Verbesserung

```typescript
// src/routes/health/+server.ts erweitern
export const GET: RequestHandler = async () => {
	const health = {
		status: 'healthy',
		timestamp: new Date().toISOString(),
		environment: building ? 'build' : 'runtime',
		services: {
			sveltekit: 'running',
			pocketbase: await checkPocketBaseDetailed(),
			database: await checkDatabaseHealth(),
			memory: process.memoryUsage(),
			uptime: process.uptime(),
		},
		checks: {
			canCreateLink: await testLinkCreation(),
			canAuthenticate: await testAuthentication(),
			canServeStatic: await testStaticFiles(),
		},
	};

	const overallStatus = Object.values(health.services).every((s) => s === 'running')
		? 'healthy'
		: 'degraded';

	return json(health, {
		status: overallStatus === 'healthy' ? 200 : 503,
	});
};
```

#### Externes Monitoring Setup

- Uptime Robot/Pingdom für externe Überwachung
- Slack/Discord Webhooks für Alerts
- Grafana Dashboard für Metriken

### 3. Improved Rate Limiting

#### Redis-Backend für Rate Limiting

```typescript
// src/lib/server/redis-rate-limiter.ts
import Redis from 'ioredis';

class RedisRateLimiter {
	private redis: Redis;

	constructor() {
		this.redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
	}

	async checkLimit(key: string, limit: number, windowMs: number): Promise<boolean> {
		const multi = this.redis.multi();
		multi.incr(key);
		multi.expire(key, Math.ceil(windowMs / 1000));
		const results = await multi.exec();

		const count = results?.[0]?.[1] as number;
		return count <= limit;
	}
}
```

### 4. Database Backup Strategy

#### Automatisierte PocketBase Backups

```bash
#!/bin/bash
# scripts/backup-pocketbase.sh
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/app/backups"
PB_DATA="/app/pb_data"

mkdir -p $BACKUP_DIR

# Create backup
tar -czf "$BACKUP_DIR/pb_backup_$DATE.tar.gz" -C $PB_DATA .

# Keep only last 7 days
find $BACKUP_DIR -name "pb_backup_*.tar.gz" -mtime +7 -delete

# Upload to S3/Object Storage (optional)
if [ -n "$S3_BUCKET" ]; then
  aws s3 cp "$BACKUP_DIR/pb_backup_$DATE.tar.gz" "s3://$S3_BUCKET/backups/"
fi
```

## Mittelfristige Maßnahmen (1-4 Wochen)

### 1. Infrastructure Redundancy

#### Load Balancer Setup

```yaml
# docker-compose.prod-ha.yml
version: '3.8'
services:
  nginx-lb:
    image: nginx:alpine
    ports:
      - '80:80'
      - '443:443'
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
    depends_on:
      - app1
      - app2

  app1:
    build: .
    environment:
      - INSTANCE_ID=app1
    volumes:
      - pb_data:/app/pb_data

  app2:
    build: .
    environment:
      - INSTANCE_ID=app2
    volumes:
      - pb_data:/app/pb_data

volumes:
  pb_data:
```

#### Multi-Region Deployment

- Hauptserver: Hetzner Deutschland
- Backup Server: AWS/DigitalOcean anderer Region
- DNS Failover mit niedrigem TTL (60 Sekunden)

### 2. Separated Services Architecture

#### PocketBase als separater Service

```yaml
# docker-compose.services.yml
services:
  pocketbase:
    image: spectado/pocketbase:latest
    volumes:
      - ./pb_data:/pb/pb_data
    ports:
      - '8090:8090'
    restart: unless-stopped
    healthcheck:
      test: ['CMD', 'curl', '-f', 'http://localhost:8090/api/health']
      interval: 30s
      timeout: 10s
      retries: 3

  app:
    build: .
    environment:
      - POCKETBASE_URL=http://pocketbase:8090
    depends_on:
      pocketbase:
        condition: service_healthy
    restart: unless-stopped
```

### 3. Caching Layer

#### Redis für Caching & Sessions

```typescript
// src/lib/cache/redis-cache.ts
export class CacheManager {
	private redis: Redis;

	async get<T>(key: string): Promise<T | null> {
		const cached = await this.redis.get(key);
		return cached ? JSON.parse(cached) : null;
	}

	async set(key: string, value: any, ttlSeconds: number = 3600): Promise<void> {
		await this.redis.setex(key, ttlSeconds, JSON.stringify(value));
	}

	// Cache häufig abgerufene Daten
	async getCachedLinks(userId: string): Promise<Link[]> {
		const cacheKey = `user:${userId}:links`;
		let links = await this.get<Link[]>(cacheKey);

		if (!links) {
			links = await pb.collection('links').getFullList({ filter: `user_id="${userId}"` });
			await this.set(cacheKey, links, 300); // 5 Minuten Cache
		}

		return links;
	}
}
```

## Langfristige Maßnahmen (1-3 Monate)

### 1. Database Migration Strategy

#### PostgreSQL als Primary Database

```typescript
// Alternative zu PocketBase für bessere Skalierbarkeit
// src/lib/database/postgresql.ts
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

const connectionString = process.env.DATABASE_URL!;
const client = postgres(connectionString);
export const db = drizzle(client);

// Migration zu PostgreSQL mit:
// - Bessere Performance bei hoher Last
// - Replication Support
// - Backup/Recovery Tools
// - Connection Pooling
```

#### Database Cluster Setup

- Master-Slave Replication
- Read Replicas für Analytics
- Automated Failover

### 2. CDN Integration

#### Cloudflare Setup

```typescript
// src/app.html erweitern
// DNS-Level Protection gegen DDoS
// Edge Caching für statische Assets
// SSL/TLS Termination
// Rate Limiting auf Edge-Level
```

### 3. Microservices Architecture

#### Service Separation

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   API Gateway   │    │   Auth Service  │
│   (SvelteKit)   │    │   (Kong/Nginx)  │    │   (Custom)      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
         ┌───────────────────────┼───────────────────────┐
         │                       │                       │
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Link Service  │    │  Analytics Svc  │    │  Redirect Svc   │
│   (Create/CRUD) │    │  (Tracking)     │    │  (Core Feature) │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Deployment & Operations

### 1. CI/CD Pipeline Verbesserung

#### GitHub Actions Workflow

```yaml
# .github/workflows/deploy.yml
name: Deploy to Production
on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Run Tests
        run: |
          npm ci
          npm run test
          npm run test:e2e

  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to Primary
        run: |
          # Coolify Deployment
          curl -X POST ${{ secrets.COOLIFY_WEBHOOK }}

      - name: Health Check
        run: |
          # Warte auf erfolgreiche Deployment
          for i in {1..30}; do
            if curl -f https://ulo.ad/health; then
              echo "Deployment successful"
              exit 0
            fi
            sleep 10
          done
          exit 1

      - name: Rollback on Failure
        if: failure()
        run: |
          # Automatisches Rollback bei Fehler
          curl -X POST ${{ secrets.COOLIFY_ROLLBACK_WEBHOOK }}
```

### 2. Monitoring & Alerting

#### Prometheus + Grafana Setup

```yaml
# monitoring/docker-compose.yml
services:
  prometheus:
    image: prom/prometheus
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
    ports:
      - '9090:9090'

  grafana:
    image: grafana/grafana
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
    ports:
      - '3001:3000'
    volumes:
      - grafana-storage:/var/lib/grafana

  alertmanager:
    image: prom/alertmanager
    ports:
      - '9093:9093'
    volumes:
      - ./alertmanager.yml:/etc/alertmanager/alertmanager.yml
```

#### Custom Metrics

```typescript
// src/lib/metrics/prometheus.ts
import { register, collectDefaultMetrics, Counter, Histogram } from 'prom-client';

collectDefaultMetrics();

export const httpRequestsTotal = new Counter({
	name: 'http_requests_total',
	help: 'Total number of HTTP requests',
	labelNames: ['method', 'route', 'status_code'],
});

export const httpRequestDuration = new Histogram({
	name: 'http_request_duration_seconds',
	help: 'Duration of HTTP requests in seconds',
	labelNames: ['method', 'route'],
});

export const linkRedirects = new Counter({
	name: 'link_redirects_total',
	help: 'Total number of link redirects',
	labelNames: ['short_code', 'success'],
});
```

### 3. Disaster Recovery Plan

#### Automated Recovery Scripts

```bash
#!/bin/bash
# scripts/disaster-recovery.sh

# 1. Check service status
check_services() {
  if ! curl -f https://ulo.ad/health; then
    echo "Primary service down, starting recovery..."
    return 1
  fi
}

# 2. Switch to backup server
activate_backup() {
  # Update DNS to point to backup server
  curl -X PUT "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/dns_records/$DNS_RECORD_ID" \
    -H "Authorization: Bearer $CF_API_TOKEN" \
    -H "Content-Type: application/json" \
    --data '{"content":"'$BACKUP_SERVER_IP'"}'
}

# 3. Restore from backup
restore_from_backup() {
  # Download latest backup
  aws s3 cp s3://$BACKUP_BUCKET/latest.tar.gz /tmp/restore.tar.gz

  # Extract and restore
  tar -xzf /tmp/restore.tar.gz -C /app/pb_data/

  # Restart services
  docker-compose restart
}

# Main recovery flow
if ! check_services; then
  activate_backup
  restore_from_backup

  # Send alert
  curl -X POST $SLACK_WEBHOOK -d '{"text":"Disaster recovery activated for ulo.ad"}'
fi
```

## Testing & Validation

### 1. Chaos Engineering

#### Fault Injection Tests

```typescript
// tests/chaos/network-failures.test.ts
describe('Network Failure Scenarios', () => {
	test('should handle PocketBase timeout gracefully', async () => {
		// Simulate PocketBase timeout
		const mockPb = mockPocketBaseTimeout();

		const response = await app.request('/api/links', {
			method: 'POST',
			body: JSON.stringify({ url: 'https://example.com' }),
		});

		// Should return cached response or graceful error
		expect(response.status).toBeLessThan(500);
	});

	test('should fallback to cached data when database is unavailable', async () => {
		// Simulate database outage
		mockDatabaseDown();

		const response = await app.request('/my/links');

		// Should serve from cache
		expect(response.status).toBe(200);
		expect(response.headers.get('x-served-from')).toBe('cache');
	});
});
```

### 2. Load Testing

#### Performance Benchmarks

```bash
# scripts/load-test.sh
#!/bin/bash

# Test link creation under load
ab -n 1000 -c 10 -H "Authorization: Bearer $TOKEN" \
   -p link-payload.json -T application/json \
   https://ulo.ad/api/links

# Test redirect performance
ab -n 10000 -c 50 https://ulo.ad/test-link

# Test concurrent user scenarios
k6 run performance-tests/user-journey.js
```

## Implementation Roadmap

### Phase 1 (Sofort - 1 Woche)

- [x] Analyse der aktuellen Architektur
- [ ] Verbesserte Error Handling implementieren
- [ ] Health Check Endpoints erweitern
- [ ] Monitoring Setup (Uptime Robot)
- [ ] Backup-Scripts erstellen

### Phase 2 (2-4 Wochen)

- [ ] Redis für Rate Limiting & Caching
- [ ] Load Balancer Setup
- [ ] Service Separation (PocketBase)
- [ ] CI/CD Pipeline mit Health Checks
- [ ] Disaster Recovery Scripts

### Phase 3 (1-3 Monate)

- [ ] PostgreSQL Migration evaluieren
- [ ] CDN Integration (Cloudflare)
- [ ] Microservices Architecture
- [ ] Chaos Engineering Tests
- [ ] Multi-Region Deployment

## Kosten-Nutzen-Analyse

### Zusätzliche Infrastruktur-Kosten

- **Redis Server:** €5-10/Monat
- **Backup Server:** €5-15/Monat
- **Monitoring Tools:** €0-20/Monat (Uptime Robot Free, Grafana Cloud)
- **CDN:** €0-50/Monat (Cloudflare Free Tier)

**Gesamtkosten:** €10-95/Monat zusätzlich

### Nutzen

- **99.9% Uptime** (vs. aktuell ~95%)
- **Automatische Recovery** bei Ausfällen
- **Bessere Performance** durch Caching
- **Proaktive Überwachung** vor Problemen
- **Datenintegrität** durch Backups

## Metriken & KPIs

### Verfügbarkeit

- **Target:** 99.9% Uptime
- **MTTR (Mean Time To Recovery):** < 5 Minuten
- **MTBF (Mean Time Between Failures):** > 30 Tage

### Performance

- **Response Time:** < 200ms (95th percentile)
- **Redirect Time:** < 50ms
- **Error Rate:** < 0.1%

### Monitoring

- **Alert Response Time:** < 2 Minuten
- **Backup Success Rate:** 100%
- **Health Check Success:** > 99.5%

## Fazit

Das aktuelle Single-Point-of-Failure Setup birgt erhebliche Risiken für die Verfügbarkeit von uLoad. Mit den vorgeschlagenen Maßnahmen kann die Infrastruktur deutlich robuster und ausfallsicherer gestaltet werden.

**Empfohlene Prioritäten:**

1. **Sofort:** Verbessertes Error Handling und Monitoring
2. **Kurzfristig:** Service Separation und Backup-Strategie
3. **Mittelfristig:** Load Balancing und Caching
4. **Langfristig:** Microservices und Multi-Region

Der Plan bietet einen gestuften Ansatz, um die Ausfallsicherheit schrittweise zu erhöhen, ohne die laufende Entwicklung zu blockieren.
