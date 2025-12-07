# ManaCore Referral System - Design Document

> **Status**: Finalisiert - Bereit zur Implementierung
> **Erstellt**: 2025-12-07
> **Autor**: Claude Code

---

## 1. Übersicht & Ziele

### 1.1 Was wollen wir erreichen?

Ein **app-übergreifendes Referral-System** für das ManaCore-Ökosystem, das:
- Organisches Wachstum durch User-Empfehlungen fördert
- User mit Credits bei jedem Stage-Übergang belohnt
- Transparentes Tracking aller Referral-Stages bietet
- Tier-basierte Belohnungen für Power-Referrer ermöglicht
- Cross-App-Engagement der geworbenen User trackt und belohnt
- Umfassende Fraud-Detection implementiert

### 1.2 Finale Entscheidungen

| Aspekt | Entscheidung |
|--------|--------------|
| Belohnungsart | Nur Credits, keine Geld-Auszahlung |
| Code-Generierung | Automatisch für jeden User + unbegrenzte Custom-Codes (mit Rate-Limit) |
| Code-Format | Nur Random, kurz (z.B. `X7K9P2`) |
| Code-Scope | Global einzigartig (über alle Apps) |
| Stage-Tracking | Alle Stages werden getrackt mit Bonus bei jedem Übergang |
| Retention | Wird getrackt (30 Tage aktiv) |
| E-Mail-Verifizierung | Bleibt deaktiviert |
| Tier-System | Ja, Lifetime-basiert, nicht rückwirkend |
| Referee-Bonus | Nicht tier-abhängig (alle gleich) |
| Cross-App | Codes flexibel nutzbar + Bonus für Cross-App-Nutzung |
| Fraud-Detection | Umfassend implementiert |

---

## 2. Referral-Stages & Bonus-Struktur

### 2.1 Stage-Definitionen mit Boni

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        REFERRAL LIFECYCLE                               │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  [1] REGISTERED   Account erstellt                                      │
│       │           → Referrer: 5 Credits                                 │
│       │           → Referee: +25 Bonus (zusätzlich zu 150 Signup)       │
│       ▼                                                                 │
│  [2] ACTIVATED    Erste Credit-Nutzung (in irgendeiner App)            │
│       │           → Referrer: 10 Credits (× Tier-Multiplier)           │
│       ▼                                                                 │
│  [3] QUALIFIED    Erster Credit-Kauf getätigt                          │
│       │           → Referrer: 25 Credits (× Tier-Multiplier)           │
│       ▼                                                                 │
│  [4] RETAINED     30 Tage nach Registrierung noch aktiv                │
│                   → Referrer: 15 Credits (× Tier-Multiplier)           │
│                                                                         │
│  [+] CROSS_APP    Referee nutzt weitere App (einmalig pro App)         │
│                   → Referrer: 5 Credits pro App (× Tier-Multiplier)    │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### 2.2 Bonus-Tabelle

#### Referrer-Boni (wer wirbt)

| Event | Basis-Bonus | Bronze (1x) | Silver (1.5x) | Gold (2x) | Platinum (3x) |
|-------|-------------|-------------|---------------|-----------|---------------|
| Registered | 5 | 5 | 7 | 10 | 15 |
| Activated | 10 | 10 | 15 | 20 | 30 |
| Qualified | 25 | 25 | 37 | 50 | 75 |
| Retained (30d) | 15 | 15 | 22 | 30 | 45 |
| Cross-App (pro App) | 5 | 5 | 7 | 10 | 15 |

**Max pro Referral:** 55 Basis + 13 Apps × 5 = **120 Credits** (Bronze) bis **360 Credits** (Platinum)

#### Referee-Boni (wer geworben wird)

| Event | Bonus |
|-------|-------|
| Registrierung mit Code | +25 Credits (= 175 total statt 150) |

---

## 3. Tier-System

### 3.1 Tier-Struktur (Lifetime-basiert)

| Tier | Qualifizierte Referrals | Multiplier | Badge |
|------|------------------------|------------|-------|
| Bronze | 0-4 | 1.0x | 🥉 |
| Silver | 5-14 | 1.5x | 🥈 |
| Gold | 15-29 | 2.0x | 🥇 |
| Platinum | 30+ | 3.0x | 💎 |

### 3.2 Wichtige Regeln

- **Lifetime-basiert**: Einmal erreichte Qualified-Referrals zählen für immer
- **Nicht rückwirkend**: Bestehende Referrals bekommen keinen nachträglichen Bonus
- **Nur für Referrer**: Referee-Bonus ist für alle gleich (25 Credits)
- **Berechnung**: Nur QUALIFIED Referrals zählen für Tier-Aufstieg

---

## 4. Code-System

### 4.1 Code-Typen

| Typ | Beschreibung | Format | Beispiel |
|-----|--------------|--------|----------|
| `auto` | Automatisch bei User-Erstellung | 6 Zeichen alphanumerisch | `X7K9P2` |
| `custom` | Vom User erstellt | 3-20 Zeichen, alphanumerisch + Bindestrich | `TILLCODES` |
| `campaign` | Admin-generiert | Beliebig | `LAUNCH2024` |

### 4.2 Code-Regeln

- **Global einzigartig**: Ein Code existiert nur einmal im gesamten System
- **Keine Limits**: User können unbegrenzt Custom-Codes erstellen
- **Rate-Limit**: Max 10 Code-Erstellungen pro Stunde pro User
- **Flexibel**: Jeder Code funktioniert für alle Apps (erstellt ManaCore-Account)
- **Tracking**: Ursprungs-App wird getrackt (woher kam der Link?)

### 4.3 Code-Generierung

```typescript
// Auto-Code Format: 6 alphanumerische Zeichen (ohne verwechselbare: 0/O, 1/I/L)
const CHARSET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

function generateCode(): string {
  return Array.from({ length: 6 }, () =>
    CHARSET[Math.floor(Math.random() * CHARSET.length)]
  ).join('');
}
// Beispiele: X7K9P2, ABCD34, MNPQ78
```

---

## 5. Cross-App-Tracking

### 5.1 Konzept

Wenn ein geworbener User eine neue App zum ersten Mal nutzt, erhält der Referrer einen Bonus:

```
User "Till" wirbt "Max" über Chat
├── Max registriert sich → Till: +5 Credits
├── Max nutzt Chat (Activation) → Till: +10 Credits
├── Max kauft Credits → Till: +25 Credits
├── Max nutzt Picture (neu!) → Till: +5 Credits (Cross-App)
├── Max nutzt Calendar (neu!) → Till: +5 Credits (Cross-App)
└── 30 Tage später → Till: +15 Credits (Retention)

Total für Till: 65 Credits (Bronze) bis 195 Credits (Platinum)
```

### 5.2 App-Liste für Cross-App-Tracking

```typescript
const TRACKABLE_APPS = [
  'chat',      // ManaChat
  'picture',   // ManaPicture
  'presi',     // Presi
  'mail',      // ManaMail
  'manadeck',  // ManaDeck
  'todo',      // ManaTodo
  'calendar',  // ManaCalendar
  'contacts',  // ManaContacts
  'finance',   // ManaFinance
  'clock',     // ManaClock
  'zitare',    // Zitare
  'storage',   // ManaStorage
  'moodlit',   // Moodlit
];
// 13 Apps = max 65 Cross-App Credits (Bronze) bis 195 (Platinum)
```

---

## 6. Fraud-Detection System

### 6.1 Übersicht

```
┌─────────────────────────────────────────────────────────────────────────┐
│                      FRAUD DETECTION LAYERS                             │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  Layer 1: Prevention (vor Registrierung)                               │
│  ├── Rate-Limiting auf Code-Validierung                                │
│  ├── Self-Referral-Block                                               │
│  └── Captcha bei verdächtigen Patterns                                 │
│                                                                         │
│  Layer 2: Detection (bei Registrierung)                                │
│  ├── IP-Fingerprinting                                                 │
│  ├── Device-Fingerprinting                                             │
│  ├── Email-Domain-Analyse                                              │
│  └── Timing-Analyse                                                    │
│                                                                         │
│  Layer 3: Verification (nach Registrierung)                            │
│  ├── Minimum-Zeit bis Qualification (24h)                              │
│  ├── Behavior-Analyse                                                  │
│  └── Cross-Reference mit bekannten Fraud-Patterns                      │
│                                                                         │
│  Layer 4: Enforcement (bei Verdacht)                                   │
│  ├── Auto-Hold für Bonus-Auszahlung                                    │
│  ├── Manual Review Queue                                               │
│  └── Account-Suspension bei Bestätigung                                │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### 6.2 Fraud-Signale & Scoring

| Signal | Punkte | Beschreibung |
|--------|--------|--------------|
| Same IP | +30 | Gleiche IP wie Referrer |
| Same Device | +50 | Gleicher Device-Fingerprint |
| Disposable Email | +20 | Wegwerf-Email-Domain |
| Similar Email | +25 | Email ähnlich wie Referrer (z.B. till1@, till2@) |
| Rapid Registration | +15 | Registrierung < 5 Min nach Code-Abruf |
| Bulk Registrations | +40 | 5+ Registrierungen vom gleichen Referrer in 1h |
| VPN/Proxy | +20 | Bekannte VPN/Proxy-IP |
| New Account Referrer | +15 | Referrer-Account < 7 Tage alt |
| Instant Qualification | +35 | Kauf < 1h nach Registrierung |
| Minimal Activity | +25 | Keine echte App-Nutzung vor Kauf |

**Fraud-Score Thresholds:**
- 0-29: ✅ Low Risk → Automatische Bonus-Auszahlung
- 30-59: ⚠️ Medium Risk → Verzögerte Auszahlung (48h Hold)
- 60-89: 🚨 High Risk → Auto-Hold + Manual Review
- 90+: 🛑 Critical → Bonus blockiert + Account-Flag

### 6.3 Rate-Limits

| Aktion | Limit | Zeitraum |
|--------|-------|----------|
| Code-Validierung | 20 | pro Minute pro IP |
| Code-Erstellung | 10 | pro Stunde pro User |
| Registrierungen pro Code | 50 | pro Tag |
| Registrierungen pro Referrer | 20 | pro Tag |
| Bonus-Claims | 100 | pro Tag pro Referrer |

### 6.4 Timing-Regeln

| Regel | Wert | Beschreibung |
|-------|------|--------------|
| Min. Zeit bis Activation | 5 Min | Nach Registrierung |
| Min. Zeit bis Qualification | 24h | Nach Registrierung |
| Retention-Check | 30 Tage | Nach Registrierung |
| Fraud-Review-Window | 7 Tage | Nach Qualification |

### 6.5 Auto-Hold System

```typescript
interface BonusHold {
  id: string;
  referralId: string;
  userId: string;           // Wer bekommt den Bonus
  amount: number;
  reason: 'fraud_score' | 'rate_limit' | 'manual_flag';
  fraudScore: number;
  fraudSignals: string[];   // ['same_ip', 'rapid_registration']
  status: 'held' | 'released' | 'rejected';
  holdUntil: Date;          // Auto-Release nach X Tagen wenn ok
  reviewedBy?: string;      // Admin-ID
  reviewedAt?: Date;
  createdAt: Date;
}
```

### 6.6 Device & IP Fingerprinting

```typescript
interface FraudFingerprint {
  id: string;

  // IP-Daten
  ipAddress: string;
  ipHash: string;           // Für Datenschutz
  ipType: 'residential' | 'datacenter' | 'vpn' | 'proxy' | 'tor';
  ipCountry: string;
  ipCity?: string;

  // Device-Daten
  deviceFingerprint: string;
  userAgent: string;
  screenResolution?: string;
  timezone?: string;
  language?: string;

  // Tracking
  firstSeenAt: Date;
  lastSeenAt: Date;
  registrationCount: number;
  flaggedCount: number;
}
```

---

## 7. Datenbank-Schema

### 7.1 Neue Tabellen

```sql
-- Schema erstellen
CREATE SCHEMA IF NOT EXISTS referrals;

-- ============================================
-- CORE TABLES
-- ============================================

-- Referral-Codes (global einzigartig)
CREATE TABLE referrals.codes (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         TEXT NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    code            TEXT NOT NULL UNIQUE,             -- Global einzigartig
    type            TEXT NOT NULL DEFAULT 'auto',     -- 'auto', 'custom', 'campaign'
    source_app_id   TEXT,                             -- App wo Code erstellt wurde
    is_active       BOOLEAN DEFAULT true,
    uses_count      INTEGER DEFAULT 0,
    max_uses        INTEGER,                          -- NULL = unbegrenzt
    expires_at      TIMESTAMPTZ,                      -- NULL = nie
    metadata        JSONB DEFAULT '{}',
    created_at      TIMESTAMPTZ DEFAULT now(),

    CONSTRAINT code_format CHECK (code ~ '^[A-Z0-9-]{3,20}$')
);

CREATE INDEX codes_lookup_idx ON referrals.codes(code) WHERE is_active = true;
CREATE INDEX codes_user_idx ON referrals.codes(user_id);

-- Referral-Beziehungen
CREATE TABLE referrals.relationships (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    referrer_id         TEXT NOT NULL REFERENCES auth.users(id),
    referee_id          TEXT NOT NULL REFERENCES auth.users(id) UNIQUE,
    code_id             UUID NOT NULL REFERENCES referrals.codes(id),
    source_app_id       TEXT,                         -- App über die geworben wurde

    -- Stage Tracking
    status              TEXT NOT NULL DEFAULT 'registered',
    registered_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    activated_at        TIMESTAMPTZ,
    qualified_at        TIMESTAMPTZ,
    retained_at         TIMESTAMPTZ,

    -- Fraud
    fraud_score         INTEGER DEFAULT 0,
    fraud_signals       TEXT[] DEFAULT '{}',
    is_flagged          BOOLEAN DEFAULT false,

    created_at          TIMESTAMPTZ DEFAULT now(),
    updated_at          TIMESTAMPTZ DEFAULT now(),

    CONSTRAINT no_self_referral CHECK (referrer_id != referee_id)
);

CREATE INDEX relationships_referrer_idx ON referrals.relationships(referrer_id);
CREATE INDEX relationships_referee_idx ON referrals.relationships(referee_id);
CREATE INDEX relationships_status_idx ON referrals.relationships(status);
CREATE INDEX relationships_flagged_idx ON referrals.relationships(is_flagged) WHERE is_flagged = true;

-- Cross-App-Tracking
CREATE TABLE referrals.cross_app_activations (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    relationship_id     UUID NOT NULL REFERENCES referrals.relationships(id),
    app_id              TEXT NOT NULL,
    activated_at        TIMESTAMPTZ DEFAULT now(),
    bonus_paid          BOOLEAN DEFAULT false,

    UNIQUE(relationship_id, app_id)
);

CREATE INDEX cross_app_relationship_idx ON referrals.cross_app_activations(relationship_id);

-- User Tier Status
CREATE TABLE referrals.user_tiers (
    user_id             TEXT PRIMARY KEY REFERENCES auth.users(id),
    tier                TEXT NOT NULL DEFAULT 'bronze',
    qualified_count     INTEGER DEFAULT 0,
    total_earned        INTEGER DEFAULT 0,            -- Lifetime Credits durch Referrals
    created_at          TIMESTAMPTZ DEFAULT now(),
    updated_at          TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- BONUS & TRANSACTION TABLES
-- ============================================

-- Bonus-Events (Audit-Trail)
CREATE TABLE referrals.bonus_events (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    relationship_id     UUID NOT NULL REFERENCES referrals.relationships(id),
    user_id             TEXT NOT NULL REFERENCES auth.users(id),
    event_type          TEXT NOT NULL,                -- 'registered', 'activated', 'qualified', 'retained', 'cross_app'
    app_id              TEXT,                         -- Für cross_app events
    credits_base        INTEGER NOT NULL,             -- Basis-Credits
    tier_multiplier     REAL NOT NULL DEFAULT 1.0,
    credits_final       INTEGER NOT NULL,             -- Nach Multiplier
    tier_at_time        TEXT NOT NULL,
    transaction_id      UUID,                         -- Referenz zu credits.transactions

    -- Hold-Status
    status              TEXT DEFAULT 'pending',       -- 'pending', 'paid', 'held', 'rejected'
    hold_reason         TEXT,
    hold_until          TIMESTAMPTZ,
    released_at         TIMESTAMPTZ,

    created_at          TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX bonus_events_relationship_idx ON referrals.bonus_events(relationship_id);
CREATE INDEX bonus_events_user_idx ON referrals.bonus_events(user_id);
CREATE INDEX bonus_events_status_idx ON referrals.bonus_events(status);

-- ============================================
-- FRAUD DETECTION TABLES
-- ============================================

-- IP/Device Fingerprints
CREATE TABLE referrals.fingerprints (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- IP
    ip_hash             TEXT NOT NULL,                -- SHA256 der IP
    ip_type             TEXT DEFAULT 'unknown',       -- 'residential', 'datacenter', 'vpn', 'proxy', 'tor'
    ip_country          TEXT,
    ip_asn              TEXT,

    -- Device
    device_hash         TEXT,                         -- Fingerprint-Hash
    user_agent_hash     TEXT,

    -- Stats
    first_seen_at       TIMESTAMPTZ DEFAULT now(),
    last_seen_at        TIMESTAMPTZ DEFAULT now(),
    registration_count  INTEGER DEFAULT 0,
    flagged_count       INTEGER DEFAULT 0,

    UNIQUE(ip_hash, device_hash)
);

CREATE INDEX fingerprints_ip_idx ON referrals.fingerprints(ip_hash);
CREATE INDEX fingerprints_device_idx ON referrals.fingerprints(device_hash);

-- Fingerprint zu User Mapping
CREATE TABLE referrals.user_fingerprints (
    user_id             TEXT NOT NULL REFERENCES auth.users(id),
    fingerprint_id      UUID NOT NULL REFERENCES referrals.fingerprints(id),
    seen_at             TIMESTAMPTZ DEFAULT now(),
    context             TEXT,                         -- 'registration', 'login', 'code_validation'

    PRIMARY KEY (user_id, fingerprint_id)
);

-- Fraud-Flags (für Muster-Erkennung)
CREATE TABLE referrals.fraud_patterns (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pattern_type        TEXT NOT NULL,                -- 'email_domain', 'ip_range', 'device_pattern'
    pattern_value       TEXT NOT NULL,
    severity            TEXT DEFAULT 'medium',        -- 'low', 'medium', 'high', 'critical'
    score_impact        INTEGER NOT NULL,
    description         TEXT,
    is_active           BOOLEAN DEFAULT true,
    created_by          TEXT,
    created_at          TIMESTAMPTZ DEFAULT now()
);

-- Rate-Limit Tracking
CREATE TABLE referrals.rate_limits (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    identifier          TEXT NOT NULL,                -- IP, User-ID, oder Code
    identifier_type     TEXT NOT NULL,                -- 'ip', 'user', 'code'
    action              TEXT NOT NULL,                -- 'code_validation', 'code_creation', 'registration'
    count               INTEGER DEFAULT 1,
    window_start        TIMESTAMPTZ DEFAULT now(),
    window_end          TIMESTAMPTZ NOT NULL,

    UNIQUE(identifier, identifier_type, action, window_start)
);

CREATE INDEX rate_limits_lookup_idx ON referrals.rate_limits(identifier, identifier_type, action, window_end);

-- Admin Review Queue
CREATE TABLE referrals.review_queue (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    relationship_id     UUID NOT NULL REFERENCES referrals.relationships(id),
    fraud_score         INTEGER NOT NULL,
    fraud_signals       TEXT[] NOT NULL,
    priority            TEXT DEFAULT 'medium',        -- 'low', 'medium', 'high', 'critical'
    status              TEXT DEFAULT 'pending',       -- 'pending', 'approved', 'rejected', 'escalated'
    assigned_to         TEXT,
    notes               TEXT,
    reviewed_at         TIMESTAMPTZ,
    created_at          TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX review_queue_status_idx ON referrals.review_queue(status, priority);

-- ============================================
-- ANALYTICS TABLES
-- ============================================

-- Tägliche Statistiken (für Dashboard)
CREATE TABLE referrals.daily_stats (
    date                DATE NOT NULL,
    app_id              TEXT,                         -- NULL = global

    registrations       INTEGER DEFAULT 0,
    activations         INTEGER DEFAULT 0,
    qualifications      INTEGER DEFAULT 0,
    retentions          INTEGER DEFAULT 0,

    credits_paid        INTEGER DEFAULT 0,
    credits_held        INTEGER DEFAULT 0,

    fraud_blocked       INTEGER DEFAULT 0,

    PRIMARY KEY (date, COALESCE(app_id, 'global'))
);

-- ============================================
-- VIEWS
-- ============================================

-- Referrer-Stats View
CREATE VIEW referrals.referrer_stats AS
SELECT
    r.referrer_id,
    ut.tier,
    ut.qualified_count,
    ut.total_earned,
    COUNT(*) FILTER (WHERE r.status = 'registered') as registered_count,
    COUNT(*) FILTER (WHERE r.activated_at IS NOT NULL) as activated_count,
    COUNT(*) FILTER (WHERE r.qualified_at IS NOT NULL) as qualified_count_current,
    COUNT(*) FILTER (WHERE r.retained_at IS NOT NULL) as retained_count,
    COUNT(*) FILTER (WHERE r.is_flagged) as flagged_count
FROM referrals.relationships r
LEFT JOIN referrals.user_tiers ut ON r.referrer_id = ut.user_id
GROUP BY r.referrer_id, ut.tier, ut.qualified_count, ut.total_earned;
```

### 7.2 Erweiterung bestehender Tabellen

```sql
-- Transaction-Type erweitern (falls noch nicht vorhanden)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum
        WHERE enumlabel = 'referral'
        AND enumtypid = 'credits.transaction_type'::regtype
    ) THEN
        ALTER TYPE credits.transaction_type ADD VALUE 'referral';
    END IF;
END
$$;

-- Referral-Referenz in Transactions
ALTER TABLE credits.transactions
    ADD COLUMN IF NOT EXISTS referral_bonus_event_id UUID
    REFERENCES referrals.bonus_events(id);
```

---

## 8. API-Endpoints

### 8.1 Code-Management

```typescript
// ============================================
// PUBLIC ENDPOINTS
// ============================================

// Code validieren (für Registrierungs-Form)
GET /api/referrals/validate/:code
Response: {
  valid: boolean,
  referrerName?: string,      // "Till S." (anonymisiert)
  bonusCredits: number,       // 25
  error?: string              // 'invalid' | 'expired' | 'max_uses'
}

// ============================================
// AUTHENTICATED ENDPOINTS
// ============================================

// Eigene Codes abrufen
GET /api/referrals/codes
Response: {
  codes: Array<{
    id: string,
    code: string,
    type: 'auto' | 'custom' | 'campaign',
    isActive: boolean,
    usesCount: number,
    createdAt: string
  }>,
  autoCode: string            // Primärer Auto-Code
}

// Neuen Custom-Code erstellen
POST /api/referrals/codes
Body: { code: string }        // 3-20 Zeichen
Response: {
  code: { id, code, ... },
  error?: string              // 'taken' | 'invalid_format' | 'rate_limited'
}

// Code deaktivieren
DELETE /api/referrals/codes/:id
Response: { success: boolean }

// ============================================
// STATS ENDPOINTS
// ============================================

// Meine Referral-Stats
GET /api/referrals/stats
Response: {
  tier: {
    current: 'silver',
    multiplier: 1.5,
    qualifiedCount: 8,
    nextTier: 'gold',
    nextTierAt: 15,
    progress: 0.53             // 8/15
  },
  totals: {
    registered: 23,
    activated: 18,
    qualified: 8,
    retained: 5,
    creditsEarned: 450,
    creditsPending: 35         // In Hold
  },
  byApp: {
    chat: { registered: 12, activated: 10, qualified: 4, credits: 200 },
    picture: { registered: 11, activated: 8, qualified: 4, credits: 250 }
  },
  recentActivity: [
    { type: 'qualified', refereeName: 'Max M.', credits: 25, at: '...' },
    { type: 'cross_app', refereeName: 'Anna K.', app: 'picture', credits: 5, at: '...' }
  ]
}

// Meine geworbenen User
GET /api/referrals/referred-users
Query: ?status=all|registered|activated|qualified|retained&limit=20&offset=0
Response: {
  users: Array<{
    id: string,
    name: string,              // Anonymisiert: "Max M."
    status: string,
    registeredAt: string,
    activatedAt?: string,
    qualifiedAt?: string,
    retainedAt?: string,
    appsUsed: string[],        // ['chat', 'picture']
    creditsEarned: number,
    isFlagged: boolean
  }>,
  pagination: { total, limit, offset }
}

// ============================================
// INTERNAL ENDPOINTS (Service-to-Service)
// ============================================

// Referral bei Registrierung anwenden
POST /api/internal/referrals/apply
Headers: { 'X-Service-Key': '...' }
Body: {
  refereeId: string,
  code: string,
  sourceAppId: string,
  ipAddress: string,
  deviceFingerprint?: string,
  userAgent: string
}
Response: {
  success: boolean,
  referralId?: string,
  bonusAwarded?: number,
  fraudScore?: number,
  error?: string
}

// Stage-Update (von anderen Services)
POST /api/internal/referrals/stage-update
Headers: { 'X-Service-Key': '...' }
Body: {
  userId: string,
  stage: 'activated' | 'qualified',
  appId: string,
  metadata?: object
}
Response: { success: boolean, bonusPaid?: number }

// Cross-App-Aktivierung
POST /api/internal/referrals/cross-app
Headers: { 'X-Service-Key': '...' }
Body: {
  userId: string,
  appId: string
}
Response: { success: boolean, bonusPaid?: number, isNewApp: boolean }
```

### 8.2 Admin-Endpoints

```typescript
// ============================================
// ADMIN ENDPOINTS
// ============================================

// Campaign-Code erstellen
POST /api/admin/referrals/campaign-codes
Body: {
  code: string,
  maxUses?: number,
  expiresAt?: string,
  metadata?: { campaign: string, source: string }
}

// Review-Queue abrufen
GET /api/admin/referrals/review-queue
Query: ?status=pending&priority=high&limit=50
Response: {
  items: Array<{
    id: string,
    relationship: { referrerId, refereeId, ... },
    fraudScore: number,
    fraudSignals: string[],
    priority: string,
    bonusAmount: number,
    createdAt: string
  }>
}

// Review abschließen
POST /api/admin/referrals/review/:id
Body: {
  action: 'approve' | 'reject',
  notes?: string
}

// Fraud-Pattern hinzufügen
POST /api/admin/referrals/fraud-patterns
Body: {
  patternType: 'email_domain' | 'ip_range' | 'device_pattern',
  patternValue: string,
  severity: 'low' | 'medium' | 'high' | 'critical',
  scoreImpact: number,
  description?: string
}

// Dashboard-Stats
GET /api/admin/referrals/dashboard
Query: ?period=7d|30d|90d
Response: {
  overview: {
    totalReferrals: number,
    conversionRate: number,     // registered → qualified
    creditsPaid: number,
    creditsHeld: number,
    fraudBlocked: number
  },
  byDay: Array<{ date, registrations, qualifications, credits }>,
  topReferrers: Array<{ userId, name, qualified, credits }>,
  fraudStats: {
    blockedToday: number,
    pendingReview: number,
    commonSignals: Array<{ signal, count }>
  }
}
```

---

## 9. Service-Architektur

### 9.1 Neue Module in mana-core-auth

```
services/mana-core-auth/src/
├── referrals/
│   ├── referrals.module.ts
│   ├── referrals.controller.ts
│   ├── services/
│   │   ├── referral-code.service.ts      # Code-Generierung & Verwaltung
│   │   ├── referral-tracking.service.ts  # Stage-Tracking & Bonus
│   │   ├── referral-tier.service.ts      # Tier-Berechnung
│   │   ├── referral-stats.service.ts     # Statistiken
│   │   └── referral-cross-app.service.ts # Cross-App-Tracking
│   ├── fraud/
│   │   ├── fraud-detection.service.ts    # Fraud-Scoring
│   │   ├── fingerprint.service.ts        # IP/Device Fingerprinting
│   │   ├── rate-limit.service.ts         # Rate-Limiting
│   │   └── fraud-patterns.service.ts     # Pattern-Matching
│   ├── dto/
│   │   ├── create-code.dto.ts
│   │   ├── apply-referral.dto.ts
│   │   ├── stage-update.dto.ts
│   │   └── ...
│   └── entities/
│       └── ... (Drizzle schemas)
```

### 9.2 Integration Points

```typescript
// 1. Bei User-Registrierung (better-auth.service.ts)
async registerB2C(dto: RegisterB2CDto) {
  const user = await this.createUser(dto);
  await this.creditsService.initializeBalance(user.id);

  // NEU: Auto-Code erstellen
  await this.referralCodeService.createAutoCode(user.id);

  // NEU: Referral anwenden wenn Code übergeben
  if (dto.referralCode) {
    await this.referralTrackingService.applyReferral({
      refereeId: user.id,
      code: dto.referralCode,
      sourceAppId: dto.appId,
      fingerprint: dto.fingerprint
    });
  }

  return { user, token };
}

// 2. Bei Credit-Nutzung (credits.service.ts)
async useCredits(userId: string, dto: UseCreditsDto) {
  const result = await this.deductCredits(userId, dto);

  // NEU: Cross-App-Tracking
  await this.referralCrossAppService.trackAppUsage(userId, dto.appId);

  // NEU: Activation-Check (erste Nutzung überhaupt)
  await this.referralTrackingService.checkActivation(userId);

  return result;
}

// 3. Bei Credit-Kauf (nach Stripe-Webhook)
async completePurchase(userId: string, purchaseId: string) {
  await this.creditBalance(userId, amount);

  // NEU: Qualification-Check (erster Kauf)
  await this.referralTrackingService.checkQualification(userId);
}

// 4. Cron-Job für Retention (täglich)
@Cron('0 0 * * *')
async checkRetention() {
  await this.referralTrackingService.processRetentionBatch();
}
```

---

## 10. UI-Komponenten

### 10.1 Registrierungs-Seite (erweitert)

**Datei:** `apps/manacore/apps/web/src/routes/(auth)/register/+page.svelte`

```svelte
<script lang="ts">
  let referralCode = $state('');
  let referralValidation = $state<{
    valid: boolean;
    referrerName?: string;
    bonusCredits?: number;
  } | null>(null);
  let validating = $state(false);

  // URL-Parameter auslesen
  onMount(() => {
    const urlCode = $page.url.searchParams.get('ref');
    if (urlCode) {
      referralCode = urlCode;
      validateCode();
    }
  });

  async function validateCode() {
    if (!referralCode || referralCode.length < 3) {
      referralValidation = null;
      return;
    }

    validating = true;
    const result = await api.referrals.validate(referralCode);
    referralValidation = result;
    validating = false;
  }
</script>

<!-- Im Formular -->
<div class="space-y-2">
  <Label for="referralCode">Einladungscode (optional)</Label>
  <div class="relative">
    <Input
      id="referralCode"
      bind:value={referralCode}
      onblur={validateCode}
      placeholder="z.B. X7K9P2"
      class={referralValidation?.valid ? 'border-green-500' : ''}
    />
    {#if validating}
      <Spinner class="absolute right-3 top-3" size="sm" />
    {:else if referralValidation?.valid}
      <CheckIcon class="absolute right-3 top-3 text-green-500" />
    {/if}
  </div>

  {#if referralValidation?.valid}
    <p class="text-sm text-green-600">
      Eingeladen von {referralValidation.referrerName} -
      Du erhältst {referralValidation.bonusCredits} Bonus-Credits!
    </p>
  {:else if referralValidation && !referralValidation.valid}
    <p class="text-sm text-red-600">
      Ungültiger Code
    </p>
  {/if}
</div>

<!-- Submit-Info -->
<p class="text-sm text-muted-foreground text-center">
  {#if referralValidation?.valid}
    {150 + referralValidation.bonusCredits} Credits zum Start
  {:else}
    150 Credits zum Start
  {/if}
</p>
```

### 10.2 Dashboard Referral-Widget

**Datei:** `apps/manacore/apps/web/src/lib/components/referrals/ReferralWidget.svelte`

```svelte
<script lang="ts">
  import { Copy, Share2, QrCode, Users, TrendingUp } from 'lucide-svelte';

  interface Props {
    stats: ReferralStats;
  }

  let { stats }: Props = $props();

  const tierColors = {
    bronze: 'text-amber-600',
    silver: 'text-slate-400',
    gold: 'text-yellow-500',
    platinum: 'text-cyan-400'
  };

  const tierEmoji = {
    bronze: '🥉',
    silver: '🥈',
    gold: '🥇',
    platinum: '💎'
  };

  function copyCode() {
    navigator.clipboard.writeText(stats.autoCode);
    toast.success('Code kopiert!');
  }

  function shareLink() {
    const url = `https://manacore.app/r/${stats.autoCode}`;
    if (navigator.share) {
      navigator.share({ title: 'ManaCore einladen', url });
    } else {
      navigator.clipboard.writeText(url);
      toast.success('Link kopiert!');
    }
  }
</script>

<Card class="p-6">
  <div class="flex items-center justify-between mb-4">
    <h3 class="text-lg font-semibold flex items-center gap-2">
      <Users class="h-5 w-5" />
      Freunde einladen
    </h3>
    <Badge class={tierColors[stats.tier.current]}>
      {tierEmoji[stats.tier.current]} {stats.tier.current}
    </Badge>
  </div>

  <!-- Code Box -->
  <div class="bg-muted rounded-lg p-4 mb-4">
    <p class="text-sm text-muted-foreground mb-1">Dein Code:</p>
    <div class="flex items-center gap-2">
      <code class="text-2xl font-mono font-bold tracking-wider">
        {stats.autoCode}
      </code>
      <Button variant="ghost" size="icon" onclick={copyCode}>
        <Copy class="h-4 w-4" />
      </Button>
    </div>
  </div>

  <!-- Share Buttons -->
  <div class="flex gap-2 mb-6">
    <Button variant="outline" size="sm" onclick={shareLink}>
      <Share2 class="h-4 w-4 mr-2" />
      Teilen
    </Button>
    <Button variant="outline" size="sm" onclick={() => showQrModal = true}>
      <QrCode class="h-4 w-4 mr-2" />
      QR-Code
    </Button>
  </div>

  <!-- Stats Grid -->
  <div class="grid grid-cols-4 gap-4 mb-4">
    <div class="text-center">
      <p class="text-2xl font-bold">{stats.totals.registered}</p>
      <p class="text-xs text-muted-foreground">Registriert</p>
    </div>
    <div class="text-center">
      <p class="text-2xl font-bold">{stats.totals.activated}</p>
      <p class="text-xs text-muted-foreground">Aktiviert</p>
    </div>
    <div class="text-center">
      <p class="text-2xl font-bold">{stats.totals.qualified}</p>
      <p class="text-xs text-muted-foreground">Qualifiziert</p>
    </div>
    <div class="text-center">
      <p class="text-2xl font-bold text-green-600">{stats.totals.creditsEarned}</p>
      <p class="text-xs text-muted-foreground">Credits</p>
    </div>
  </div>

  <!-- Tier Progress -->
  {#if stats.tier.nextTier}
    <div class="space-y-2">
      <div class="flex justify-between text-sm">
        <span>Fortschritt zu {stats.tier.nextTier}</span>
        <span>{stats.tier.qualifiedCount}/{stats.tier.nextTierAt}</span>
      </div>
      <Progress value={stats.tier.progress * 100} />
      <p class="text-xs text-muted-foreground">
        Bei {stats.tier.nextTier}: {stats.tier.multiplier * 1.5}x Bonus
      </p>
    </div>
  {:else}
    <p class="text-sm text-center text-muted-foreground">
      💎 Maximales Tier erreicht! (3x Bonus)
    </p>
  {/if}

  <!-- Link to full page -->
  <Button variant="link" class="w-full mt-4" href="/referrals">
    Alle Referrals anzeigen →
  </Button>
</Card>
```

### 10.3 Referral-Detail-Seite

**Datei:** `apps/manacore/apps/web/src/routes/(app)/referrals/+page.svelte`

Enthält:
- Vollständige Tier-Anzeige mit Progress
- Code-Management (Custom-Codes erstellen/löschen)
- Liste aller geworbenen User mit Filter
- Cross-App-Anzeige pro User
- Activity-Feed

---

## 11. Implementierungs-Roadmap

### Phase 1: Foundation (1-2 Wochen)

```
[ ] Datenbank-Schema erstellen & migrieren
[ ] Basis-Services implementieren:
    [ ] ReferralCodeService (CRUD für Codes)
    [ ] ReferralTrackingService (Beziehungen & Stages)
    [ ] ReferralTierService (Tier-Berechnung)
[ ] API-Endpoints:
    [ ] GET /api/referrals/validate/:code
    [ ] GET /api/referrals/codes
    [ ] POST /api/referrals/codes
    [ ] DELETE /api/referrals/codes/:id
[ ] Integration in Registrierung:
    [ ] Auto-Code bei User-Erstellung
    [ ] Referral bei Registrierung anwenden
    [ ] Referee-Bonus (25 Credits)
```

### Phase 2: Tracking & Bonuses (1 Woche)

```
[ ] Stage-Tracking implementieren:
    [ ] Activation-Detection (erste Credit-Nutzung)
    [ ] Qualification-Detection (erster Kauf)
    [ ] Retention-Cron (30-Tage-Check)
[ ] Bonus-System:
    [ ] Bonus-Event erstellen
    [ ] Credit-Transaction mit Referenz
    [ ] Tier-Multiplier anwenden
[ ] API-Endpoints:
    [ ] GET /api/referrals/stats
    [ ] GET /api/referrals/referred-users
```

### Phase 3: Fraud Detection (1-2 Wochen)

```
[ ] Fingerprinting:
    [ ] IP-Hashing & Kategorisierung
    [ ] Device-Fingerprint-Erfassung
    [ ] VPN/Proxy-Detection (externe API)
[ ] Fraud-Scoring:
    [ ] Signal-Erfassung
    [ ] Score-Berechnung
    [ ] Threshold-basierte Actions
[ ] Hold-System:
    [ ] Auto-Hold bei High-Score
    [ ] Review-Queue
    [ ] Release/Reject-Logic
[ ] Rate-Limiting:
    [ ] Redis-basiertes Rate-Limiting
    [ ] Per-IP, Per-User, Per-Code Limits
```

### Phase 4: Cross-App (3-4 Tage)

```
[ ] Cross-App-Tracking:
    [ ] App-Nutzung bei Credit-Usage tracken
    [ ] Einmalig-pro-App-Logik
    [ ] Bonus-Auszahlung
[ ] Integration in alle Apps:
    [ ] Credit-Service Hook
    [ ] Event-Emission
```

### Phase 5: UI (1 Woche)

```
[ ] Registrierung erweitern:
    [ ] Referral-Code-Input
    [ ] URL-Parameter Support (?ref=CODE)
    [ ] Validierungs-Feedback
[ ] Dashboard-Widget:
    [ ] Code-Anzeige & Copy
    [ ] Stats-Übersicht
    [ ] Tier-Progress
[ ] Referral-Seite:
    [ ] Vollständige Stats
    [ ] Code-Management
    [ ] User-Liste mit Filter
    [ ] Activity-Feed
[ ] Share-Features:
    [ ] Social-Share-Buttons
    [ ] QR-Code-Generator
    [ ] OG-Tags für Share-Links
```

### Phase 6: Admin & Analytics (3-4 Tage)

```
[ ] Admin-Dashboard:
    [ ] Overview-Stats
    [ ] Top-Referrer
    [ ] Fraud-Stats
[ ] Review-Queue-UI:
    [ ] Liste mit Filtering
    [ ] Approve/Reject-Actions
    [ ] Notes
[ ] Campaign-Management:
    [ ] Campaign-Code erstellen
    [ ] Tracking
```

---

## 12. Technische Notizen

### 12.1 Externe Abhängigkeiten

| Service | Zweck | Kosten |
|---------|-------|--------|
| IPinfo / IPdata | IP-Kategorisierung (VPN/Proxy) | ~$50/mo |
| FingerprintJS | Device-Fingerprinting | Free tier available |
| Redis | Rate-Limiting & Caching | Bereits vorhanden? |

### 12.2 Performance-Überlegungen

- **Fraud-Score-Berechnung**: Async, nicht blockierend
- **Stats-Aggregation**: Materialized Views oder Caching
- **Rate-Limit-Checks**: Redis mit TTL
- **Daily-Stats**: Cron-Job für Aggregation

### 12.3 Datenschutz

- IPs werden gehasht gespeichert (SHA256)
- Referee-Namen werden anonymisiert ("Max M.")
- Fingerprints werden nach 90 Tagen gelöscht
- GDPR-Konformität: Referral-Daten können auf Anfrage gelöscht werden

---

## 13. Risiken & Mitigationen

| Risiko | Wahrscheinlichkeit | Impact | Mitigation |
|--------|-------------------|--------|------------|
| Fraud-Ring | Mittel | Hoch | Multi-Layer Detection + Review |
| Bot-Registrierungen | Hoch | Mittel | Rate-Limiting + Captcha |
| Credit-Inflation | Niedrig | Hoch | Monatliche Limits + Monitoring |
| Performance-Issues | Niedrig | Mittel | Caching + Async Processing |
| False Positives | Mittel | Mittel | Review-Queue + Appeal-Prozess |

---

## 14. Metriken & KPIs

| Metrik | Ziel | Tracking |
|--------|------|----------|
| Referral-Rate | 10% der Registrierungen | Daily |
| Conversion (Reg → Qualified) | 30% | Weekly |
| Fraud-Rate | < 5% | Daily |
| False-Positive-Rate | < 1% | Weekly |
| Avg. Credits pro Referrer | 100/Monat | Monthly |
| Top-Tier-Anteil | 5% Gold/Platinum | Monthly |

---

*Dokument finalisiert - Bereit zur Implementierung*
