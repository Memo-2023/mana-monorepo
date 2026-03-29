# Implementierungsansätze für Voucher-System in uload

## Übersicht

Dieses Dokument analysiert verschiedene technische Ansätze zur Integration eines Voucher/Promo-Code-Systems in die bestehende uload-Architektur. Basierend auf der aktuellen Codebasis werden drei Hauptansätze vorgestellt: Minimal MVP, Integrierte Lösung und Enterprise-Ready System.

## Aktuelle Architektur-Analyse

### Bestehende Komponenten

**Datenbank-Struktur (PocketBase):**
- `links` Collection mit Workspace-Support
- `users` Collection mit Subscription-Status
- `clicks` Collection für Analytics
- `workspaces` Collection für Team-Features
- Bereits vorhandene Tag-System-Architektur

**Frontend-Stack:**
- SvelteKit mit Server-Side-Rendering
- Tailwind CSS für UI
- Form-Actions für Backend-Interaktionen

**Business-Logic:**
- Link-Limits basierend auf Subscription
- Workspace-basierte Link-Organisation
- Bereits implementierte Short-Code-Generierung

## Ansatz 1: Minimal MVP (1-2 Wochen)

### Konzept
Schnelle Integration durch Erweiterung der bestehenden Link-Struktur. Voucher-Codes werden als spezielle Links behandelt.

### Technische Umsetzung

**Datenbank-Erweiterung:**
```
links Collection erweitern:
- voucher_code: string (optional, unique)
- voucher_type: select ['discount', 'feature', 'trial']
- voucher_value: json (z.B. {discount: 30, currency: 'EUR'})
- voucher_valid_until: date
- voucher_max_uses: number
- voucher_current_uses: number
- is_voucher: bool (unterscheidet Voucher von normalen Links)
```

**Implementation:**
1. Neues Feld `voucher_code` in bestehender `links` Collection
2. Voucher-Validation im bestehenden Redirect-Flow (`[...slug]/+page.server.ts`)
3. Einfaches Admin-Interface in `/my/vouchers`

**Vorteile:**
- Minimale Änderungen an bestehender Architektur
- Nutzt vorhandene Link-Analytics
- Schnelle Time-to-Market
- Keine neuen Dependencies

**Nachteile:**
- Vermischung von Links und Vouchers
- Limitierte Voucher-Features
- Schwierig zu skalieren

**Aufwand:**
- Backend: 3-4 Tage
- Frontend: 2-3 Tage
- Testing: 1-2 Tage

## Ansatz 2: Dedizierte Voucher-Collections (2-3 Wochen)

### Konzept
Saubere Trennung durch eigene Datenstrukturen für Vouchers, aber Integration in bestehende Flows.

### Technische Umsetzung

**Neue Collections:**
```
vouchers:
- id: string
- code: string (unique, indexed)
- creator_id: relation -> users
- workspace_id: relation -> workspaces
- type: select ['percentage', 'fixed', 'feature', 'trial']
- value: json
- conditions: json (min_amount, eligible_plans, etc.)
- valid_from: date
- valid_until: date
- max_redemptions: number
- max_redemptions_per_user: number
- metadata: json

voucher_redemptions:
- id: string
- voucher_id: relation -> vouchers
- user_id: relation -> users (optional für anonyme)
- session_id: string
- redeemed_at: datetime
- applied_value: json
- referrer_url: string
- ip_hash: string
- user_agent: string
```

**API-Struktur:**
```
/api/voucher/validate - POST - Prüft Voucher
/api/voucher/redeem - POST - Löst Voucher ein
/api/voucher/stats - GET - Analytics für Creator
```

**Frontend-Routes:**
```
/voucher/[code] - Landing Page mit Voucher
/my/vouchers - Voucher-Management
/my/vouchers/create - Neuer Voucher
/my/vouchers/[id]/analytics - Voucher-Analytics
```

**Integration Points:**
1. Download-Page zeigt Voucher-Code prominent
2. Session-Storage für Voucher-Persistenz
3. Webhook für App-Integration

**Vorteile:**
- Saubere Architektur
- Flexibel erweiterbar
- Unabhängige Voucher-Features
- Bessere Performance durch Separation

**Nachteile:**
- Mehr Entwicklungsaufwand
- Neue Collections zu verwalten
- Komplexere Deployment

**Aufwand:**
- Backend: 5-7 Tage
- Frontend: 4-5 Tage
- Testing: 2-3 Tage
- Integration: 2 Tage

## Ansatz 3: Enterprise-Ready Affiliate System (4-6 Wochen)

### Konzept
Vollständiges Affiliate-Management-System mit Vouchers als Kernkomponente.

### Technische Umsetzung

**Erweiterte Datenstruktur:**
```
affiliates:
- id: string
- user_id: relation -> users
- tier: select ['bronze', 'silver', 'gold', 'platinum']
- commission_rate: number
- lifetime_earnings: number
- current_balance: number
- payout_threshold: number
- payment_details: json (encrypted)
- approved_at: datetime
- suspended_at: datetime

campaigns:
- id: string
- name: string
- affiliate_id: relation -> affiliates
- start_date: datetime
- end_date: datetime
- budget: number
- spent: number
- target_conversions: number
- actual_conversions: number

voucher_templates:
- id: string
- name: string
- code_pattern: string (z.B. "AFFILIATE-{RANDOM}")
- default_value: json
- auto_generate: bool
- requires_approval: bool

conversions:
- id: string
- voucher_redemption_id: relation
- user_id: relation -> users
- event_type: select ['signup', 'purchase', 'subscription']
- event_value: number
- commission_amount: number
- commission_paid: bool
- attributed_to: relation -> affiliates
```

**Advanced Features:**

**Multi-Touch Attribution:**
```typescript
// Tracking mehrerer Touchpoints
interface AttributionChain {
  touchpoints: [{
    voucher_code: string,
    timestamp: Date,
    weight: number // Anteil an Conversion
  }],
  model: 'first_touch' | 'last_touch' | 'linear' | 'time_decay'
}
```

**Fraud Detection:**
```typescript
interface FraudSignals {
  velocity_score: number, // Zu viele Redemptions zu schnell
  ip_diversity: number, // Verschiedene IPs
  device_fingerprint_matches: number,
  behavioral_anomalies: string[]
}
```

**Real-Time Dashboard:**
- WebSocket-Updates für Live-Metriken
- Heatmaps für geografische Verteilung
- Conversion-Funnel-Visualization
- A/B-Test-Results

**API-Ecosystem:**
```
/api/v1/affiliates - CRUD für Affiliates
/api/v1/campaigns - Campaign Management
/api/v1/vouchers - Voucher Operations
/api/v1/analytics - Comprehensive Analytics
/api/v1/webhooks - Event Notifications
/api/v1/payouts - Commission Management
```

**Integration-Features:**
- Stripe Connect für automatische Auszahlungen
- Slack/Discord-Notifications
- Zapier-Integration
- CSV-Export für Buchhaltung
- API-SDK für Partner

**Vorteile:**
- Komplett-Lösung für Affiliate-Marketing
- Skaliert auf Enterprise-Level
- Maximale Flexibilität
- Competitive Advantage

**Nachteile:**
- Hoher initialer Aufwand
- Komplexität in Wartung
- Overhead für kleine Teams
- Längere Time-to-Market

**Aufwand:**
- Backend: 15-20 Tage
- Frontend: 10-15 Tage
- Testing: 5-7 Tage
- Documentation: 2-3 Tage
- Integration: 3-5 Tage

## Empfohlene Strategie: Progressiver Ansatz

### Phase 1: Start mit Ansatz 2 (Dedizierte Collections)

**Warum:**
- Balance zwischen Schnelligkeit und Sauberkeit
- Solide Grundlage für Erweiterungen
- Ermöglicht frühe Validierung

**Initiale Features:**
- Basic Voucher CRUD
- Simple Redemption-Flow
- Basis-Analytics
- Manual Affiliate-Onboarding

### Phase 2: Schrittweise Erweiterung

**Nach 1-2 Monaten:**
- Automated Code-Generation
- Tiered Affiliate-System
- Enhanced Analytics
- Email-Integration

**Nach 3-4 Monaten:**
- Commission-Tracking
- Fraud-Detection
- API für Partner
- Advanced Dashboard

### Phase 3: Enterprise Features

**Nach 6+ Monaten:**
- Multi-Touch Attribution
- Automated Payouts
- White-Label Options
- ML-based Optimization

## Technische Requirements

### Backend-Anforderungen

**Neue API-Endpoints:**
```typescript
// Voucher-Validation
POST /api/voucher/validate
Body: { code: string, context?: any }
Response: { valid: boolean, discount?: number, message?: string }

// Voucher-Redemption
POST /api/voucher/redeem
Body: { code: string, session_id: string, user_id?: string }
Response: { success: boolean, applied_value: any }

// Affiliate-Dashboard
GET /api/affiliate/stats
Response: { redemptions: number, earnings: number, ... }
```

**PocketBase-Rules:**
```javascript
// Vouchers Collection Rules
listRule: "@request.auth.id = creator_id || is_public = true"
viewRule: "@request.auth.id = creator_id || code = @request.data.code"
createRule: "@request.auth.id != ''"
updateRule: "@request.auth.id = creator_id"
deleteRule: "@request.auth.id = creator_id"
```

### Frontend-Komponenten

**Neue Komponenten benötigt:**
```
VoucherInput.svelte - Code-Eingabe mit Validation
VoucherBadge.svelte - Visuelle Code-Darstellung
VoucherStats.svelte - Analytics-Dashboard
VoucherCreator.svelte - Code-Generator
AffiliateOnboarding.svelte - Partner-Registration
CommissionOverview.svelte - Earnings-Dashboard
```

### Infrastructure

**Caching-Strategy:**
```typescript
// Redis/In-Memory Cache für häufige Voucher
const voucherCache = new Map<string, VoucherData>();
const CACHE_TTL = 300; // 5 Minuten

// Cache-Warming für populäre Codes
async function warmCache() {
  const popularVouchers = await getPopularVouchers();
  popularVouchers.forEach(v => voucherCache.set(v.code, v));
}
```

**Rate-Limiting:**
```typescript
// Verhindere Voucher-Brute-Force
const rateLimiter = {
  maxAttempts: 10,
  windowMs: 60000, // 1 Minute
  blockDurationMs: 600000 // 10 Minuten
};
```

## Migration von bestehenden Daten

Falls bereits Referral-Links existieren:

```typescript
// Migration Script
async function migrateReferralLinks() {
  const referralLinks = await pb.collection('links')
    .getFullList({ filter: 'is_referral = true' });
  
  for (const link of referralLinks) {
    await pb.collection('vouchers').create({
      code: link.short_code.toUpperCase(),
      creator_id: link.user_id,
      type: 'percentage',
      value: { discount: 20 },
      // ... mapping
    });
  }
}
```

## Testing-Strategie

### Unit-Tests
```typescript
// Voucher-Validation Tests
describe('VoucherValidation', () => {
  test('validates expired vouchers', () => {});
  test('checks redemption limits', () => {});
  test('applies conditions correctly', () => {});
});
```

### Integration-Tests
```typescript
// End-to-End Redemption Flow
describe('VoucherRedemption', () => {
  test('complete redemption journey', async () => {
    // 1. Create voucher
    // 2. Validate voucher
    // 3. Redeem voucher
    // 4. Check analytics
  });
});
```

### Load-Testing
```bash
# K6 Script für Voucher-Endpoints
k6 run --vus 100 --duration 30s voucher-load-test.js
```

## Sicherheitsüberlegungen

### Voucher-Code-Generation
```typescript
// Sichere Code-Generation
function generateSecureCode(prefix: string): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const random = crypto.getRandomValues(new Uint8Array(8));
  let code = prefix;
  for (const byte of random) {
    code += chars[byte % chars.length];
  }
  return code;
}
```

### SQL-Injection-Prevention
```typescript
// Immer Parameterized Queries
const voucher = await pb.collection('vouchers')
  .getFirstListItem(`code = {:code}`, { code: userInput });
// Niemals: `code = "${userInput}"`
```

### Rate-Limiting und Fraud-Detection
```typescript
// Fraud-Signale
const fraudIndicators = {
  tooManyRedemptions: redemptions > 10 && timeWindow < 3600,
  suspiciousPattern: hasSimilarTimestamps(redemptions),
  knownAbuser: blacklist.includes(ipHash)
};
```

## Monitoring und Analytics

### Key Metrics
```typescript
interface VoucherMetrics {
  // Performance
  redemptionRate: number, // Redemptions / Impressions
  conversionValue: number, // Revenue from Voucher Users
  
  // Quality
  fraudRate: number, // Fraudulent / Total Redemptions
  abuseRate: number, // Multi-Use Attempts / Total
  
  // Business
  customerAcquisitionCost: number,
  lifetimeValue: number,
  returnOnInvestment: number
}
```

### Logging
```typescript
// Strukturiertes Logging
logger.info('voucher_redeemed', {
  code: voucher.code,
  user_id: user?.id,
  session_id: session.id,
  value: voucher.value,
  timestamp: new Date().toISOString()
});
```

## Zusammenfassung

Für uload empfiehlt sich der **progressive Ansatz mit Start bei Ansatz 2** (Dedizierte Collections):

**Sofort umsetzbar (Woche 1-2):**
- Basis Voucher-System
- Simple Redemption
- Creator-Dashboard

**Kurzfristig erweiterbar (Monat 1-2):**
- Affiliate-Tiers
- Advanced Analytics
- Fraud-Detection

**Langfristig skalierbar (Monat 3+):**
- Full Attribution
- Automated Payouts
- Enterprise Features

Dieser Ansatz bietet die beste Balance zwischen schneller Markteinführung und langfristiger Skalierbarkeit, während er perfekt zur bestehenden uload-Architektur passt.