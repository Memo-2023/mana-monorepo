# Sync Billing Plan

## Kontext

Sync (mana-sync, Go, Port 3050) ist das Rückgrat der Multi-Device-Erfahrung. Aktuell läuft Sync für jeden authentifizierten User kostenlos und automatisch — es gibt keine Abrechnungslogik. Die drei Sync-Operationen in `@mana/credits` (`CALDAV_SYNC`, `GOOGLE_SYNC`, `CLOUD_SYNC`) sind definiert aber nirgends enforced.

Sync verursacht **laufende Server-Kosten** (PostgreSQL, Go-Server, Bandwidth). Ein per-Operation-Pricing passt nicht — stattdessen eine **monatliche Flat-Fee in Credits**.

**1 Credit = 1 Cent.**

## Modell

### Sync als monatliches Credit-Abo

| Intervall | Preis | Pro Tag |
|-----------|-------|---------|
| **Monatlich** | 30 Credits (0.30€) | ~1 Credit/Tag |
| **Quartalsweise** | 90 Credits (0.90€) | ~1 Credit/Tag |
| **Jährlich** | 360 Credits (3.60€) | ~1 Credit/Tag |

Kein Rabatt bei längeren Intervallen — der Preis ist schon sehr niedrig. Der Vorteil längerer Intervalle ist Bequemlichkeit (seltener nachdenken).

### Zwei Zustände

| Zustand | Was passiert |
|---------|-------------|
| **Local-Only** (Default) | App funktioniert vollständig in IndexedDB. Kein Push/Pull. |
| **Cloud Sync** (Aktiv) | Multi-Device-Sync, Backup, Conflict Resolution via mana-sync. |

- Neue User starten immer in **Local-Only**
- Keine Welcome Credits — Credits kommen von Käufen, Geschenken oder Gutscheinen
- CalDAV/Google Sync: eventuell später, nicht Teil dieses Plans

### Abrechnungs-Mechanik

1. User öffnet Settings → Sync → wählt Intervall (monatlich/quartalsweise/jährlich)
2. System prüft Balance >= Preis für gewähltes Intervall
3. Credits werden sofort abgebucht, `nextChargeAt` wird gesetzt
4. Am Abrechnungstag: automatische Abbuchung via Cron
5. Wenn Balance < Kosten: Sync wird **pausiert**, nicht gelöscht
   - In-App-Banner: "Sync pausiert — Credits aufladen um fortzufahren"
   - E-Mail-Notification via mana-notify
6. Lokale Daten bleiben immer erhalten. Sobald Credits da → reaktivieren → alles synct nach
7. User kann jederzeit deaktivieren → keine weitere Abbuchung, Sync stoppt sofort

## Ist-Zustand

| Komponente | Status | Datei |
|------------|--------|-------|
| Sync-Engine (Client) | Startet automatisch nach Auth, kein Enable/Disable | `apps/mana/apps/web/src/lib/data/sync.ts` |
| Sync-Server | Akzeptiert alle authentifizierten Requests | `services/mana-sync/` |
| Credit-Ops | `CALDAV_SYNC`, `GOOGLE_SYNC`, `CLOUD_SYNC` definiert, nie enforced | `packages/credits/src/operations.ts` |
| Settings UI | Kein Sync-Toggle | `routes/(app)/settings/+page.svelte` |

## Änderungen

### 1. Credit-Operationen bereinigen

**Datei**: `packages/credits/src/operations.ts`

`CALDAV_SYNC` und `GOOGLE_SYNC` entfernen (nicht Teil dieses Plans). `CLOUD_SYNC` behalten und Kosten anpassen:

```typescript
CLOUD_SYNC = 'cloud_sync'  // 30 Credits/Monat (oder 90/Quartal, 360/Jahr)
```

Metadata updaten: `description: 'Cloud-Synchronisation über alle Geräte'`

### 2. Sync-Subscriptions-Tabelle

**Neue Datei**: `services/mana-credits/src/db/schema/sync.ts`

```sql
-- In credits schema
CREATE TABLE credits.sync_subscriptions (
  user_id         TEXT PRIMARY KEY,
  active          BOOLEAN NOT NULL DEFAULT false,
  billing_interval TEXT NOT NULL DEFAULT 'monthly',  -- 'monthly' | 'quarterly' | 'yearly'
  amount_charged  INTEGER NOT NULL,                  -- 30, 90, oder 360
  activated_at    TIMESTAMPTZ,
  next_charge_at  TIMESTAMPTZ,
  paused_at       TIMESTAMPTZ,                       -- Gesetzt wenn Balance zu niedrig
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);
```

Export in `schema/index.ts` hinzufügen.

### 3. Sync-Billing-Service

**Neue Datei**: `services/mana-credits/src/services/sync-billing.ts`

Methoden:
- `activateSync(userId, interval)` — Balance prüfen, abbuchen, Subscription anlegen
- `deactivateSync(userId)` — Subscription deaktivieren, keine Rückerstattung
- `getSyncStatus(userId)` — `{ active, interval, nextChargeAt, pausedAt }`
- `chargeRecurring()` — Cron: alle fälligen Subscriptions abrechnen, bei Insufficient-Balance pausieren
- `reactivateSync(userId)` — Nach Pause: Balance prüfen, abbuchen, reaktivieren

Alle Credit-Bewegungen über den bestehenden `CreditsService.useCredits()` — immutable Ledger bleibt konsistent.

### 4. API-Endpoints

**User-facing** (JWT auth) — neue Route-Datei `services/mana-credits/src/routes/sync.ts`:

| Method | Path | Beschreibung |
|--------|------|--------------|
| GET | `/api/v1/sync/status` | Sync-Status des Users |
| POST | `/api/v1/sync/activate` | Sync aktivieren (Body: `{ interval: 'monthly' | 'quarterly' | 'yearly' }`) |
| POST | `/api/v1/sync/deactivate` | Sync deaktivieren |
| POST | `/api/v1/sync/change-interval` | Intervall wechseln (ab nächster Abrechnung) |

**Internal** (X-Service-Key) — in bestehende `routes/internal.ts` einfügen:

| Method | Path | Beschreibung |
|--------|------|--------------|
| GET | `/api/v1/internal/sync/status/:userId` | Sync-Status für mana-sync Server-Check |
| POST | `/api/v1/internal/sync/charge-recurring` | Cron-Trigger für monatliche Abbuchung |

### 5. Cron-Job für monatliche Abbuchung

**Neue Datei**: `services/mana-credits/src/jobs/sync-charge.ts`

- Läuft täglich (via mana-events Scheduler oder eigener Bun.cron)
- Query: `WHERE active = true AND next_charge_at <= NOW()`
- Für jeden: `useCredits()` aufrufen
  - Erfolg: `next_charge_at += interval`
  - Insufficient Credits: `active = false`, `paused_at = NOW()`
  - Notification senden via mana-notify (In-App-Banner + E-Mail)

### 6. Client-seitiges Sync-Gating

**Datei**: `apps/mana/apps/web/src/lib/data/sync.ts`

`createUnifiedSync()` bekommt einen `syncEnabled`-Parameter:

```typescript
export function createUnifiedSync(serverUrl: string, getToken: () => Promise<string>, syncEnabled: boolean) {
  // Wenn !syncEnabled: startAll() wird zum No-Op, ensureAppSynced() gibt sofort zurück
}
```

**Datei**: `apps/mana/apps/web/src/routes/(app)/+layout.svelte`

Beim Auth-Ready:
1. `GET /api/v1/sync/status` aufrufen
2. Ergebnis in einen reaktiven Store (`syncStatusStore`) schreiben
3. `createUnifiedSync(..., syncStatus.active)` aufrufen
4. Wenn `syncStatus.paused`: Banner anzeigen

**Neuer Store**: `apps/mana/apps/web/src/lib/stores/sync-status.svelte.ts`

```typescript
export const syncStatus = $state({
  active: false,
  interval: 'monthly' as 'monthly' | 'quarterly' | 'yearly',
  nextChargeAt: null as string | null,
  paused: false,
});
```

### 7. In-App-Banner bei pausiertem Sync

**Datei**: `apps/mana/apps/web/src/routes/(app)/+layout.svelte` (oder eigene Komponente)

Wenn `syncStatus.paused`:
```
⚠️ Cloud Sync pausiert — deine Credits reichen nicht aus.
[Credits aufladen] [Sync-Einstellungen]
```

Persistent am oberen Rand, dismissable aber kommt nach 24h wieder.

### 8. Settings UI

**Neue Sektion** in Settings oder eigene Route `routes/(app)/settings/sync/+page.svelte`:

- **Status**: Aktiv/Inaktiv/Pausiert
- **Intervall-Auswahl**: Monatlich (30 Credits) / Quartal (90) / Jahr (360)
- **Info**: Nächste Abbuchung am X, aktueller Kontostand: Y Credits
- **Aktivieren/Deaktivieren**-Button
- **Hinweis bei Deaktivierung**: "Deine Daten bleiben lokal erhalten. Du kannst jederzeit reaktivieren."

### 9. Server-seitiges Gating (mana-sync)

**Datei**: `services/mana-sync/` (Go)

Middleware auf Push/Pull-Endpoints:
- Vor jedem Request: `GET /api/v1/internal/sync/status/:userId` (cached 5 Minuten)
- Bei `active = false`: HTTP 402 `{ error: "sync_inactive", message: "Cloud Sync ist nicht aktiv" }`
- Client fängt 402 ab → setzt `syncStatus.paused = true` → zeigt Banner

### 10. E-Mail-Notification bei Pause

Über mana-notify (bestehender Service):
- Template: "Dein Cloud Sync wurde pausiert"
- Inhalt: Aktueller Kontostand, Link zu Credits kaufen, Link zu Settings
- Trigger: Wenn `chargeRecurring()` eine Subscription pausiert

## Dateien-Übersicht

| Aktion | Datei |
|--------|-------|
| **Neu** | `services/mana-credits/src/db/schema/sync.ts` |
| **Neu** | `services/mana-credits/src/services/sync-billing.ts` |
| **Neu** | `services/mana-credits/src/routes/sync.ts` |
| **Neu** | `services/mana-credits/src/jobs/sync-charge.ts` |
| **Neu** | `apps/mana/apps/web/src/lib/stores/sync-status.svelte.ts` |
| **Neu** | `apps/mana/apps/web/src/routes/(app)/settings/sync/+page.svelte` |
| **Editieren** | `packages/credits/src/operations.ts` — CALDAV/GOOGLE entfernen, CLOUD_SYNC auf 30 |
| **Editieren** | `services/mana-credits/src/db/schema/index.ts` — Sync-Schema exportieren |
| **Editieren** | `services/mana-credits/src/index.ts` — SyncBillingService + Sync-Routes registrieren |
| **Editieren** | `services/mana-credits/src/routes/internal.ts` — Sync-Status + Charge-Endpoint |
| **Editieren** | `services/mana-credits/src/lib/validation.ts` — Sync-Schemas |
| **Editieren** | `apps/mana/apps/web/src/lib/data/sync.ts` — Gating-Parameter |
| **Editieren** | `apps/mana/apps/web/src/routes/(app)/+layout.svelte` — Sync-Status laden |
| **Editieren** | `apps/mana/apps/web/src/routes/(app)/settings/+page.svelte` — Sync-Link |
| **Editieren** | `services/mana-sync/` (Go) — Middleware für 402 |

## Phasen

### Phase 1: Backend + Client-Gating
- Schema, Service, API-Endpoints in mana-credits
- Sync-Status-Store + Gating in sync.ts
- Settings UI mit Activate/Deactivate
- In-App-Banner bei Pause

### Phase 2: Server-Gating + Cron + Notifications
- mana-sync Go-Middleware (402 bei inaktivem Sync)
- Cron-Job für tägliche Abrechnung
- E-Mail-Notification via mana-notify bei Pause
