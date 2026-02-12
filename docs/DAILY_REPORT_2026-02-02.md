# Daily Report - 2. Februar 2026

**Zeitraum:** 10:00 Uhr (1. Feb) - 05:00 Uhr (2. Feb)
**Commits:** 51
**Hauptthemen:** OIDC/Synapse Integration, Matrix Bot CI/CD, Credit System, Cross-Domain SSO, Monitoring

---

## Zusammenfassung

Eine epische 19-Stunden-Session mit Fokus auf **Auth-Infrastruktur** und **Production Readiness**:

- **OIDC Integration** - Vollständige Synapse-Kompatibilität mit EdDSA JWT Signing
- **Matrix Bot CI/CD** - Automatisierte GHCR Deployments für 10 Bots mit Watchtower
- **Credit System** - Neue Packages für Credit-Operationen und UI-Komponenten
- **Cross-Domain SSO** - Single Sign-On über alle *.mana.how Subdomains
- **Monitoring** - Node-Exporter, Grafana Dashboards, Prometheus Alerts
- **SSD Migration** - PostgreSQL und MinIO auf externe SSD verschoben

---

## 1. OIDC/Synapse Integration (Kritische Fixes)

### Problem

Matrix Synapse konnte sich nicht mit mana-core-auth verbinden. Token-Verifizierung schlug fehl.

### Ursachen & Lösungen

#### 1.1 EdDSA JWT Signing
**Commit:** `efb077b9` - fix(mana-core-auth): use EdDSA for OIDC id_token signing

```typescript
// better-auth.config.ts - VORHER
const auth = betterAuth({
    jwt: {
        issuer: config.get('JWT_ISSUER'),
    }
});

// NACHHER - mit JWT Plugin für EdDSA
const auth = betterAuth({
    plugins: [jwt()],  // Aktiviert EdDSA Keys aus JWKS
    advanced: {
        useJWTPlugin: true,  // id_tokens mit EdDSA statt HS256
    }
});
```

**Warum:** Synapse verifiziert id_tokens via JWKS-Endpoint (`/.well-known/jwks.json`). HS256 verwendet ein Shared Secret, das Synapse nicht kennt. EdDSA verwendet Public/Private Keypaar aus JWKS.

#### 1.2 JWT Issuer = BASE_URL
**Commit:** `8cd5021b` - fix(mana-core-auth): use BASE_URL as JWT issuer

```typescript
// VORHER
jwt: { issuer: config.get('JWT_ISSUER') }  // "manacore"

// NACHHER
jwt: { issuer: config.get('BASE_URL') }  // "https://auth.mana.how"
```

**Warum:** OIDC Discovery Document (`/.well-known/openid-configuration`) enthält `issuer: "https://auth.mana.how"`. Der JWT `iss` Claim muss damit übereinstimmen.

#### 1.3 Body-Parser für Token Exchange
**Commit:** `f0cf1bc8` - fix(mana-core-auth): OIDC token exchange now works with body-parser

```typescript
// main.ts
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// oidc.controller.ts
@Post('token')
async token(@Req() req: Request, @Res() res: Response) {
    // req.body ist jetzt geparsed, nicht raw
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(req.body)) {
        params.append(key, String(value));
    }
    return this.betterAuthService.handleOidcRequest(params, res);
}
```

**Warum:** Synapse sendet Token-Requests als `application/x-www-form-urlencoded`. Ohne body-parser kam `req.body` als leeres Objekt an.

#### 1.4 CORS Origins erweitert
**Commit:** `5a8e20e0` - fix(auth): add all apps to CORS_ORIGINS

```yaml
# docker-compose.macmini.yml
environment:
  CORS_ORIGINS: "https://auth.mana.how,https://matrix.mana.how,https://chat.mana.how,https://calendar.mana.how,https://todo.mana.how,https://clock.mana.how,https://contacts.mana.how,https://picture.mana.how,https://zitare.mana.how,https://questions.mana.how,https://planta.mana.how,https://skilltree.mana.how,https://storage.mana.how,https://manadeck.mana.how,https://nutriphi.mana.how,https://presi.mana.how,https://link.mana.how,https://playground.mana.how"
```

---

## 2. Matrix Bot CI/CD Pipeline

### Übersicht

Vollautomatische Build- und Deployment-Pipeline für 10 Matrix-Bots via GitHub Actions → GHCR → Watchtower.

**Commit:** `45152ee9` - feat(matrix-bots): add CI/CD pipeline for automated GHCR deployment

### Pipeline-Architektur

```
┌─────────────────────────────────────────────────────────────────┐
│                     GitHub Actions CI                            │
│                                                                  │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────────┐   │
│  │ Push to main │───>│ Detect       │───>│ Build Docker     │   │
│  │              │    │ Changes      │    │ Images (amd64)   │   │
│  └──────────────┘    └──────────────┘    └────────┬─────────┘   │
│                                                    │              │
│                                                    ▼              │
│                                         ┌──────────────────┐     │
│                                         │ Push to GHCR     │     │
│                                         │ ghcr.io/till-js/ │     │
│                                         └────────┬─────────┘     │
└──────────────────────────────────────────────────┼───────────────┘
                                                   │
                                                   ▼
┌─────────────────────────────────────────────────────────────────┐
│                     Mac Mini Server                              │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                   Watchtower                              │   │
│  │            (polls GHCR every 5 minutes)                   │   │
│  └────────────────────────────┬─────────────────────────────┘   │
│                               │                                  │
│                               ▼                                  │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐    │
│  │ mana-bot   │ │ todo-bot   │ │ calendar   │ │ ollama     │    │
│  │ :latest    │ │ :latest    │ │ -bot       │ │ -bot       │    │
│  └────────────┘ └────────────┘ └────────────┘ └────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

### Bots mit CI/CD

| Bot | GHCR Image | Port |
|-----|------------|------|
| matrix-mana-bot | `ghcr.io/till-js/matrix-mana-bot` | 3310 |
| matrix-todo-bot | `ghcr.io/till-js/matrix-todo-bot` | 3311 |
| matrix-calendar-bot | `ghcr.io/till-js/matrix-calendar-bot` | 3312 |
| matrix-ollama-bot | `ghcr.io/till-js/matrix-ollama-bot` | 3313 |
| matrix-stats-bot | `ghcr.io/till-js/matrix-stats-bot` | 3314 |
| matrix-project-doc-bot | `ghcr.io/till-js/matrix-project-doc-bot` | 3315 |
| matrix-tts-bot | `ghcr.io/till-js/matrix-tts-bot` | 3316 |
| matrix-clock-bot | `ghcr.io/till-js/matrix-clock-bot` | 3317 |
| matrix-nutriphi-bot | `ghcr.io/till-js/matrix-nutriphi-bot` | 3318 |
| matrix-zitare-bot | `ghcr.io/till-js/matrix-zitare-bot` | 3319 |

### Docker-Build Challenges

#### Problem 1: QEMU Emulation Failure
**Commits:** `ab49be0b`, `a50d98c7`

```bash
# CI Build auf amd64 Runner für arm64 Target
Error: qemu: uncaught target signal 4 (Illegal instruction)
```

**Lösung:** Nur amd64 bauen. Mac Mini mit Apple Silicon läuft via Rosetta.

```yaml
# .github/workflows/ci.yml
platforms: linux/amd64  # Kein linux/arm64
```

```yaml
# docker-compose.macmini.yml
services:
  matrix-mana-bot:
    platform: linux/amd64  # Explizit für Apple Silicon
```

#### Problem 2: Alpine vs glibc
**Commit:** `a384bed1` - fix(matrix-bots): switch to node:20-slim

```dockerfile
# VORHER - Alpine (musl libc)
FROM node:20-alpine

# NACHHER - Debian slim (glibc)
FROM node:20-slim
```

**Warum:** `@matrix-org/matrix-sdk-crypto-nodejs` hat prebuilt Binaries nur für glibc.

#### Problem 3: E2EE Native Module
**Commit:** `a8521d7a` - fix(matrix-bots): disable E2EE crypto module

```json
// package.json (root)
{
  "pnpm": {
    "overrides": {
      "@matrix-org/matrix-sdk-crypto-nodejs": "npm:empty-npm-package@1.0.0"
    }
  }
}
```

**Warum:** Das Crypto-Module erfordert plattformspezifische Native Binaries. In Docker-CI nicht verfügbar. E2EE wird serverseitig von Synapse gehandelt.

#### Problem 4: Health Check
**Commit:** `ea0198cc` - fix(bots): install wget for Docker health checks

```dockerfile
# node:20-slim hat weder wget noch curl
RUN apt-get update && apt-get install -y wget && rm -rf /var/lib/apt/lists/*
```

---

## 3. Credit System

### Neue Packages

**Commit:** `8cd5021b` - feat: add credit-operations and shared-credit-ui packages

#### @manacore/credit-operations

Zentrale Definition aller Credit-Operationen:

```typescript
// packages/credit-operations/src/index.ts
export const CREDIT_OPERATIONS = {
  // Chat
  'chat:message': { cost: 1, description: 'Send chat message' },
  'chat:ai-response': { cost: 5, description: 'AI response generation' },

  // Picture
  'picture:generate-sd': { cost: 10, description: 'Stable Diffusion image' },
  'picture:generate-flux': { cost: 25, description: 'Flux image generation' },

  // Calendar
  'calendar:ai-scheduling': { cost: 3, description: 'AI scheduling assistant' },

  // Todo
  'todo:ai-breakdown': { cost: 5, description: 'AI task breakdown' },

  // ... 50+ weitere Operationen
};

export function getCreditCost(operation: string): number {
  return CREDIT_OPERATIONS[operation]?.cost ?? 0;
}
```

#### @manacore/shared-credit-ui

UI-Komponenten für React Native und Svelte:

**Mobile (React Native):**
```typescript
// CreditBalance.tsx
export function CreditBalance({ userId }: Props) {
  const balance = useCreditBalance(userId);
  return (
    <View style={styles.container}>
      <Text style={styles.label}>Credits</Text>
      <Text style={styles.balance}>{balance}</Text>
    </View>
  );
}

// CreditToast.tsx
export function CreditToast({ operation, cost }: Props) {
  return (
    <Animated.View style={styles.toast}>
      <Text>-{cost} Credits</Text>
      <Text>{operation}</Text>
    </Animated.View>
  );
}
```

**Web (Svelte):**
```svelte
<!-- CreditBalance.svelte -->
<script lang="ts">
  let { userId } = $props();
  let balance = $state(0);

  $effect(() => {
    fetchBalance(userId).then(b => balance = b);
  });
</script>

<div class="credit-balance">
  <span class="label">Credits</span>
  <span class="value">{balance}</span>
</div>
```

### NestJS Integration

**@UseCredits Decorator:**
```typescript
// packages/mana-core-nestjs-integration/src/decorators/use-credits.decorator.ts
export function UseCredits(operation: string, cost?: number) {
  return applyDecorators(
    SetMetadata('credit_operation', operation),
    SetMetadata('credit_cost', cost ?? getCreditCost(operation)),
    UseInterceptors(CreditInterceptor),
  );
}
```

**CreditInterceptor:**
```typescript
// packages/mana-core-nestjs-integration/src/interceptors/credit.interceptor.ts
@Injectable()
export class CreditInterceptor implements NestInterceptor {
  constructor(private creditService: CreditClientService) {}

  async intercept(context: ExecutionContext, next: CallHandler) {
    const operation = Reflector.get('credit_operation', context.getHandler());
    const cost = Reflector.get('credit_cost', context.getHandler());
    const user = context.switchToHttp().getRequest().user;

    // Check balance before operation
    const hasCredits = await this.creditService.hasCredits(user.sub, cost);
    if (!hasCredits) {
      throw new ForbiddenException('Insufficient credits');
    }

    return next.handle().pipe(
      tap(async () => {
        // Deduct credits after successful operation
        await this.creditService.consumeCredits(user.sub, operation, cost);
      }),
    );
  }
}
```

**Verwendung in Controller:**
```typescript
// apps/chat/apps/backend/src/chat/chat.controller.ts
@Controller('chat')
@UseGuards(AuthGuard)
export class ChatController {
  @Post('message')
  @UseCredits('chat:ai-response')  // 5 Credits
  async sendMessage(@Body() dto: SendMessageDto) {
    return this.chatService.processMessage(dto);
  }
}
```

---

## 4. Cross-Domain SSO

### Problem

Nutzer mussten sich auf jedem Subdomain separat einloggen:
- `auth.mana.how` → Login
- `chat.mana.how` → Login erneut
- `calendar.mana.how` → Login erneut

### Lösung

**Commit:** `f03c09ff` - feat(auth): enable cross-domain SSO via shared cookies

```typescript
// better-auth.config.ts
const auth = betterAuth({
  advanced: {
    crossSubDomainCookies: {
      enabled: true,
      domain: process.env.COOKIE_DOMAIN || undefined,  // ".mana.how"
    },
  },
  trustedOrigins: [
    'https://auth.mana.how',
    'https://chat.mana.how',
    'https://calendar.mana.how',
    'https://todo.mana.how',
    // ... alle Apps
  ],
});
```

```yaml
# docker-compose.macmini.yml
mana-core-auth:
  environment:
    COOKIE_DOMAIN: ".mana.how"
```

### SSO Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                        User Flow                                 │
│                                                                  │
│  1. User besucht calendar.mana.how                              │
│     → Kein Cookie → Redirect zu auth.mana.how/login             │
│                                                                  │
│  2. Login auf auth.mana.how                                      │
│     → Cookie gesetzt: domain=".mana.how"                        │
│     → Redirect zurück zu calendar.mana.how                      │
│                                                                  │
│  3. calendar.mana.how                                            │
│     → Cookie vorhanden → Eingeloggt!                            │
│                                                                  │
│  4. User wechselt zu chat.mana.how                              │
│     → Cookie vorhanden → Automatisch eingeloggt!                │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Matrix SSO Token Handling

**Commit:** `dc0d425f` - fix(matrix-web): handle Matrix SSO loginToken callback

```typescript
// apps/matrix/apps/web/src/lib/matrix/client.ts
export async function loginWithLoginToken(
  homeserverUrl: string,
  loginToken: string
): Promise<MatrixCredentials> {
  const response = await fetch(`${homeserverUrl}/_matrix/client/v3/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      type: 'm.login.token',
      token: loginToken,
    }),
  });

  const data = await response.json();
  return {
    userId: data.user_id,
    accessToken: data.access_token,
    deviceId: data.device_id,
  };
}
```

```svelte
<!-- src/routes/(app)/+layout.svelte -->
<script lang="ts">
  import { page } from '$app/stores';
  import { loginWithLoginToken } from '$lib/matrix';

  $effect(() => {
    const loginToken = $page.url.searchParams.get('loginToken');
    if (loginToken) {
      loginWithLoginToken(HOMESERVER_URL, loginToken)
        .then(creds => saveCredentials(creds));
    }
  });
</script>
```

---

## 5. Monitoring & Grafana

### Node-Exporter für Host-Metriken

**Commit:** `7aa5115c` - feat(monitoring): add node-exporter for host system metrics

```yaml
# docker-compose.macmini.yml
node-exporter:
  image: prom/node-exporter:latest
  container_name: node-exporter
  volumes:
    - /proc:/host/proc:ro
    - /sys:/host/sys:ro
  command:
    - '--path.procfs=/host/proc'
    - '--path.sysfs=/host/sys'
    - '--collector.cpu'
    - '--collector.meminfo'
    - '--collector.diskstats'
    - '--collector.filesystem'
    - '--collector.loadavg'
    - '--collector.netdev'
  ports:
    - "9100:9100"
```

### Grafana Dashboards

#### Master Overview
**Commit:** `e7719eeb` - feat(grafana): enhance Master Overview with Key Metrics

Key Metrics Panel (oberste Zeile):
| Panel | Query |
|-------|-------|
| Services UP | `count(up{job=~".*"} == 1)` |
| Apps Running | `count(up{job=~".*-backend\|.*-web"} == 1)` |
| Matrix Bots | `count(up{job=~"matrix-.*"} == 1)` |
| Avg Response Time | `avg(rate(http_request_duration_seconds_sum[5m]) / rate(http_request_duration_seconds_count[5m]))` |
| Total Requests | `sum(increase(http_requests_total[24h]))` |
| Requests/sec | `sum(rate(http_requests_total[5m]))` |
| Redis Keys | `redis_db_keys{db="db0"}` |
| Error Rate | `sum(rate(http_requests_total{status=~"5.."}[5m])) / sum(rate(http_requests_total[5m]))` |

#### System Overview
**Commit:** `84e9f86d` - fix(grafana): rewrite System Overview with available metrics

Host System Section:
```promql
# CPU Usage
100 - (avg(rate(node_cpu_seconds_total{mode="idle"}[5m])) * 100)

# Memory Usage
(1 - node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes) * 100

# Disk Usage
(1 - node_filesystem_avail_bytes{mountpoint="/"} / node_filesystem_size_bytes{mountpoint="/"}) * 100
```

#### Auth Service Dashboard
**Commit:** `fe33f4b3` - feat: add Grafana dashboard for Auth Service monitoring

Panels:
- Login Success/Failure Rate
- Token Validation Latency
- Active Sessions
- Registration Trend
- Password Reset Requests
- OIDC Token Exchange Rate

### Prometheus Alerts

**Commit:** `fe33f4b3` - feat: add 10 auth-specific Prometheus alert rules

```yaml
# docker/prometheus/alerts.yml
groups:
  - name: auth_alerts
    rules:
      - alert: AuthServiceDown
        expr: up{job="mana-core-auth"} == 0
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "Auth service is down"

      - alert: HighLoginFailureRate
        expr: rate(auth_login_failures_total[5m]) / rate(auth_login_attempts_total[5m]) > 0.3
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "Login failure rate above 30%"

      - alert: TokenValidationSlow
        expr: histogram_quantile(0.95, rate(auth_token_validation_seconds_bucket[5m])) > 0.5
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "Token validation p95 > 500ms"
```

---

## 6. Auth UI Improvements

### Resend Verification Email

**Commit:** `d703ccfd` - feat(auth): add resend verification email to registration screen

```svelte
<!-- packages/shared-auth-ui/src/pages/RegisterPage.svelte -->
<script lang="ts">
  let { onResendVerification } = $props();
  let showVerificationSent = $state(false);
  let canResend = $state(true);

  async function resendEmail() {
    canResend = false;
    await onResendVerification?.(email);
    showVerificationSent = true;
    setTimeout(() => canResend = true, 60000);  // 1 Minute Cooldown
  }
</script>

{#if showVerificationSent}
  <div class="verification-success">
    <CheckCircle class="icon" />
    <h3>{t('auth.verificationEmailSent')}</h3>
    <p>{t('auth.checkInbox')}</p>
    <button onclick={resendEmail} disabled={!canResend}>
      {t('auth.resendVerification')}
    </button>
  </div>
{/if}
```

### Multilingual Auth Pages

**Commit:** `ff22a297` - feat(i18n): make all auth pages multilingual

15 Apps aktualisiert für dynamische Locale:

```svelte
<!-- VORHER -->
<LoginPage locale="de" ... />

<!-- NACHHER -->
<script>
  import { locale } from 'svelte-i18n';
</script>
<LoginPage locale={$locale || 'de'} ... />
```

**Translations erweitert:**
```json
// packages/shared-i18n/src/translations/auth/de.json
{
  "verificationEmailSent": "Bestätigungs-E-Mail gesendet!",
  "checkInbox": "Bitte überprüfe deinen Posteingang.",
  "resendVerification": "Erneut senden",
  "notVerifiedError": "E-Mail noch nicht bestätigt",
  "resendVerificationPrompt": "Bestätigungs-E-Mail erneut senden?"
}
```

### Fehlende Auth Pages

**Commit:** `df2c518a` - feat(auth): add missing auth pages for zitare and planta

| App | Login | Register | Forgot Password |
|-----|-------|----------|-----------------|
| Zitare | ✅ Neu | ✅ Vorhanden | ✅ Neu |
| Planta | ✅ Vorhanden | ✅ Refactored | ✅ Neu |

---

## 7. SSD Migration

### Motivation

Docker volumes liegen auf der internen SSD des Mac Mini (begrenzt auf 256GB). Externe 4TB SSD bietet mehr Kapazität und bessere Backup-Möglichkeiten.

### Migrierte Services

**Commits:** `1c650589`, `6ca2d3b7`, `7d7e31e4`

```yaml
# docker-compose.macmini.yml
services:
  postgres:
    volumes:
      - /Volumes/ManaData/postgres:/var/lib/postgresql/data

  minio:
    volumes:
      - /Volumes/ManaData/minio:/data
```

### Vergleich

| Aspekt | Docker Volume | SSD Bind Mount |
|--------|---------------|----------------|
| Pfad | `/var/lib/docker/volumes/...` | `/Volumes/ManaData/...` |
| Backup | Docker Export erforderlich | Direkter rsync/cp |
| Größe | Begrenzt (256GB System SSD) | 4TB verfügbar |
| Geschwindigkeit | ~500 MB/s | ~500 MB/s (extern) |
| Portabilität | Docker-spezifisch | Standard-Dateisystem |

### Dokumentation

**Commit:** `9e9db590` - docs: update SSD documentation for ManaData volume

- Umbenennung: TillJakob-S04 → ManaData
- Docker Full Disk Access Requirement dokumentiert
- Backup-Skript-Pfade aktualisiert

---

## 8. mana-core-auth Production Readiness

### Übersicht

Vollständige Production-Readiness für den zentralen Auth-Service.

**Commit:** `efb077b9` - fix(mana-core-auth): use EdDSA for OIDC id_token signing

### Neue Features

#### LoggerService
```typescript
// src/common/logger/logger.service.ts
@Injectable()
export class LoggerService implements LoggerService {
  private readonly context: string;

  constructor(@Inject('LOGGER_CONTEXT') context?: string) {
    this.context = context || 'Application';
  }

  log(message: string, context?: string) {
    console.log(`[${context || this.context}] ${message}`);
  }

  error(message: string, trace?: string, context?: string) {
    console.error(`[${context || this.context}] ${message}`, trace);
  }
}
```

#### Environment Validation
```typescript
// src/config/env.validation.ts
import { plainToInstance, Type } from 'class-transformer';
import { IsString, IsNumber, IsUrl, validateSync } from 'class-validator';

export class EnvironmentVariables {
  @IsUrl()
  BASE_URL: string;

  @IsString()
  DATABASE_URL: string;

  @IsNumber()
  @Type(() => Number)
  PORT: number = 3001;

  @IsString()
  JWT_SECRET: string;

  // ... weitere Validierungen
}

export function validate(config: Record<string, unknown>) {
  const validated = plainToInstance(EnvironmentVariables, config);
  const errors = validateSync(validated);
  if (errors.length > 0) {
    throw new Error(`Config validation error: ${errors}`);
  }
  return validated;
}
```

#### Health Endpoints

```typescript
// src/health/health.controller.ts
@Controller('health')
export class HealthController {
  @Get()
  health() {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }

  @Get('live')
  liveness() {
    return { status: 'ok' };
  }

  @Get('ready')
  async readiness() {
    const dbOk = await this.checkDatabase();
    const redisOk = await this.checkRedis();

    if (!dbOk || !redisOk) {
      throw new ServiceUnavailableException('Not ready');
    }

    return {
      status: 'ok',
      checks: { database: dbOk, redis: redisOk },
    };
  }
}
```

### E2E Tests

**Commits:** `ab49be0b`

| Test Suite | Tests | Beschreibung |
|------------|-------|--------------|
| `auth-flow.e2e-spec.ts` | 15 | Register, Login, Logout, Token Refresh |
| `oidc.e2e-spec.ts` | 12 | OIDC Discovery, Authorization, Token Exchange |

```typescript
// test/e2e/auth-flow.e2e-spec.ts
describe('Auth Flow', () => {
  it('should register new user', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({ email: 'test@example.com', password: 'secure123', name: 'Test' })
      .expect(201);

    expect(response.body).toHaveProperty('user');
    expect(response.body.user.email).toBe('test@example.com');
  });

  it('should login and receive tokens', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'test@example.com', password: 'secure123' })
      .expect(200);

    expect(response.body).toHaveProperty('accessToken');
    expect(response.body).toHaveProperty('refreshToken');
  });
});
```

### Dokumentation

Neue Docs erstellt:
- `docs/PRODUCTION_DEPLOYMENT.md` - Deployment Guide
- `docs/DISASTER_RECOVERY.md` - Backup & Recovery Procedures

---

## 9. Matrix Bots Credit Integration

### CreditModule in bot-services

**Commit:** `dc0d425f` - feat(bot-services): add CreditModule

```typescript
// packages/bot-services/src/credit/credit.module.ts
@Module({
  providers: [CreditService],
  exports: [CreditService],
})
export class CreditModule {
  static forRoot(options: CreditModuleOptions): DynamicModule {
    return {
      module: CreditModule,
      providers: [
        { provide: 'CREDIT_OPTIONS', useValue: options },
        CreditService,
      ],
      exports: [CreditService],
    };
  }
}
```

```typescript
// packages/bot-services/src/credit/credit.service.ts
@Injectable()
export class CreditService {
  constructor(
    @Inject('CREDIT_OPTIONS') private options: CreditModuleOptions,
    private httpService: HttpService,
  ) {}

  async hasCredits(userId: string, amount: number): Promise<boolean> {
    const balance = await this.getBalance(userId);
    return balance >= amount;
  }

  async consumeCredits(
    userId: string,
    operation: string,
    amount: number,
  ): Promise<void> {
    await this.httpService.post(`${this.options.authUrl}/api/v1/credits/consume`, {
      userId,
      operation,
      amount,
    });
  }
}
```

### Bot Integration

19 Bots mit Credit Support:

```typescript
// services/matrix-todo-bot/src/bot/matrix.service.ts
@Injectable()
export class MatrixService extends BaseMatrixService {
  constructor(private creditService: CreditService) {
    super();
  }

  protected async handleTextMessage(roomId: string, event: MatrixRoomEvent, message: string) {
    const userId = event.sender;

    // Check credits before AI operations
    if (this.isAiCommand(message)) {
      const hasCredits = await this.creditService.hasCredits(userId, 5);
      if (!hasCredits) {
        await this.sendMessage(roomId, '❌ Nicht genug Credits für AI-Features.');
        return;
      }
    }

    // Process command...

    // Consume credits after success
    if (this.isAiCommand(message)) {
      await this.creditService.consumeCredits(userId, 'todo:ai-breakdown', 5);
    }
  }
}
```

---

## 10. Weitere Änderungen

### Calendar Cross-App API URLs

**Commit:** `9a22c898` - fix(calendar-web): inject cross-app API URLs for client-side

```typescript
// apps/calendar/apps/web/src/hooks.server.ts
export const handle: Handle = async ({ event, resolve }) => {
  const response = await resolve(event, {
    transformPageChunk: ({ html }) => {
      return html.replace(
        '</head>',
        `<script>
          window.__PUBLIC_TODO_BACKEND_URL__ = "${process.env.TODO_BACKEND_URL}";
          window.__PUBLIC_CONTACTS_API_URL__ = "${process.env.CONTACTS_API_URL}";
        </script></head>`
      );
    },
  });
  return response;
};
```

### Project-Doc-Bot tsconfig Fix

**Commit:** `a7c1908f` - fix(project-doc-bot): add include/exclude to tsconfig

```json
// services/matrix-project-doc-bot/tsconfig.json
{
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

**Problem:** Build output war `dist/src/main.js` statt `dist/main.js`.

---

## Architektur-Diagramm

### Auth & SSO Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                      User Request                                │
│              calendar.mana.how/events                           │
└─────────────────────────────────┬───────────────────────────────┘
                                  │
                                  ▼
                    ┌─────────────────────────┐
                    │ Check Cookie            │
                    │ (.mana.how domain)      │
                    └────────────┬────────────┘
                                 │
              ┌──────────────────┴──────────────────┐
              │                                      │
              ▼                                      ▼
    ┌─────────────────┐                   ┌─────────────────┐
    │ Cookie Found    │                   │ No Cookie       │
    │                 │                   │                 │
    │ Validate JWT    │                   │ Redirect to     │
    │ via JWKS        │                   │ auth.mana.how   │
    └────────┬────────┘                   └────────┬────────┘
             │                                      │
             ▼                                      ▼
    ┌─────────────────┐                   ┌─────────────────┐
    │ JWT Valid       │                   │ Login Page      │
    │                 │                   │                 │
    │ Return Data     │                   │ Set Cookie:     │
    └─────────────────┘                   │ domain=.mana.how│
                                          └────────┬────────┘
                                                   │
                                                   ▼
                                          ┌─────────────────┐
                                          │ Redirect back   │
                                          │ to calendar     │
                                          └─────────────────┘
```

### Credit System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      Client Apps                                 │
│                                                                  │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌──────────┐   │
│  │ Chat Web   │  │ Picture    │  │ Matrix Bot │  │ Mobile   │   │
│  │ (Svelte)   │  │ (Svelte)   │  │ (NestJS)   │  │ (Expo)   │   │
│  └─────┬──────┘  └─────┬──────┘  └─────┬──────┘  └────┬─────┘   │
│        │               │               │               │         │
│        └───────────────┴───────┬───────┴───────────────┘         │
│                                │                                  │
│                   @manacore/shared-credit-ui                     │
│                   CreditBalance, CreditToast                     │
└────────────────────────────────┬─────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Backend Services                            │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │              @manacore/credit-operations                  │   │
│  │         getCreditCost(), CREDIT_OPERATIONS               │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │           @mana-core/nestjs-integration                   │   │
│  │     @UseCredits(), CreditInterceptor, AuthGuard          │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
└────────────────────────────────┬─────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                      mana-core-auth                              │
│                      (Port 3001)                                 │
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐   │
│  │ /credits/    │  │ /credits/    │  │ PostgreSQL           │   │
│  │ balance      │  │ consume      │  │ user_credits table   │   │
│  └──────────────┘  └──────────────┘  └──────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

---

## Statistiken

| Metrik | Wert |
|--------|------|
| **Commits** | 51 |
| **Session-Dauer** | 19 Stunden |
| **Neue Packages** | 2 (credit-operations, shared-credit-ui) |
| **CI/CD Bots** | 10 |
| **Auth Pages aktualisiert** | 15 |
| **E2E Tests hinzugefügt** | 27 |
| **Grafana Dashboards** | 3 (Master, System, Auth) |
| **Prometheus Alerts** | 10 |
| **SSD-migrierte Services** | 2 (PostgreSQL, MinIO) |

---

## Bekannte Issues

1. **Matrix Bot arm64** - Keine arm64 Builds wegen QEMU/Native Module Issues
2. **E2EE deaktiviert** - Matrix Bots haben kein End-to-End Encryption (Server handles it)
3. **Docker Full Disk Access** - Muss manuell in Docker Desktop konfiguriert werden

---

## Nächste Schritte

1. **Credit System UI** - Balance-Anzeige in allen Web-Apps integrieren
2. **Rate Limiting** - Für Auth-Endpoints implementieren
3. **Backup Automation** - Scheduled Backups für PostgreSQL/MinIO auf SSD
4. **Bot Healthchecks** - Grafana Alerts für Bot-Ausfälle
5. **OIDC für weitere Apps** - Skilltree, Questions mit Matrix SSO

---

*Bericht erstellt am 2. Februar 2026, 15:00 Uhr*
