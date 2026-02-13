# Manacore App - Entwicklungs-Roadmap

> Erstellt am: 2024-12-05
> Status: Aktive Entwicklung

## Inhaltsverzeichnis

- [Aktueller Stand](#aktueller-stand)
- [Kritische TODOs](#kritische-todos-hohe-priorität)
- [Mittlere Priorität](#mittlere-priorität)
- [Nice-to-have](#niedrige-priorität-nice-to-have)
- [Empfohlene Reihenfolge](#empfohlene-reihenfolge)

---

## Aktueller Stand

### Vorhandene Features

| Feature        | Status | Beschreibung                                  |
| -------------- | ------ | --------------------------------------------- |
| Dashboard      | ✅     | Anpassbare Widgets, Drag & Drop               |
| Credits-System | ✅     | Übersicht, Transaktionen, Pakete, Stripe-Kauf |
| Teams          | ✅     | Team-Verwaltung                               |
| Organizations  | ✅     | Organisations-Verwaltung                      |
| Settings       | ✅     | Benutzereinstellungen                         |
| Themes         | ✅     | Theme-Auswahl                                 |
| Feedback       | ✅     | Feedback-Formular                             |
| Profil         | ✅     | Basis-Profil-Ansicht                          |
| i18n           | ✅     | 5 Sprachen (DE, EN, ES, FR, IT)               |
| Apps-Übersicht | ✅     | Alle Mana-Apps anzeigen                       |

### Dashboard-Widgets (6 Typen)

| Widget             | Status |
| ------------------ | ------ |
| Credits            | ✅     |
| Tasks Today        | ✅     |
| Calendar Events    | ✅     |
| Quick Actions      | ✅     |
| Chat Recent        | ✅     |
| Contacts Favorites | ✅     |

### API-Integrationen

| Service  | Status | Datei                          |
| -------- | ------ | ------------------------------ |
| Calendar | ✅     | `lib/api/services/calendar.ts` |
| Chat     | ✅     | `lib/api/services/chat.ts`     |
| Contacts | ✅     | `lib/api/services/contacts.ts` |
| Todo     | ✅     | `lib/api/services/todo.ts`     |
| Zitare   | ✅     | `lib/api/services/zitare.ts`   |
| Credits  | ✅     | `lib/api/credits.ts`           |

---

## Kritische TODOs (Hohe Priorität)

### 1. ✅ Stripe-Integration für Credit-Kauf (ERLEDIGT)

**Status:** Abgeschlossen am 2026-02-13

**Implementiert:**

- [x] Stripe SDK integrieren (`@stripe/mcp` v17.5.0)
- [x] `StripeService` für PaymentIntent-Erstellung
- [x] `POST /credits/purchase` Endpoint
- [x] Webhook-Handler für `payment_intent.succeeded`/`payment_intent.payment_failed`
- [x] Credit-Gutschrift nach erfolgreicher Zahlung (idempotent)
- [x] Stripe MCP Server eingerichtet (OAuth-basiert)
- [x] Test-Pakete angelegt (Starter, Basic, Pro, Ultra)

**Credit-Pakete:**

| Paket   | Credits | Preis  | Hinweis                 |
| ------- | ------- | ------ | ----------------------- |
| Starter | 100     | €1,00  | 1 Mana = 1 Cent (immer) |
| Basic   | 500     | €5,00  | Kein Mengenrabatt       |
| Pro     | 1.500   | €15,00 | Kein Mengenrabatt       |
| Ultra   | 5.000   | €50,00 | Kein Mengenrabatt       |

> **Preisregel:** 1 Mana = 1 Cent. Keine Rabatte für größere Pakete.

**Dateien:**

- `services/mana-core-auth/src/stripe/` - Stripe-Module
- `services/mana-core-auth/src/credits/credits.service.ts` - Purchase-Methoden

**Frontend (Implementiert 2026-02-13):**

- [x] Credits-Seite: Stripe Checkout Integration
- [x] Loading-States und Toast-Benachrichtigungen

**Rechnungs-PDFs:**

- [x] Stripe Invoice PDFs werden automatisch über Webhooks synchronisiert (`invoicePdfUrl`)

---

### 2. ✅ App-Config aktualisieren (ERLEDIGT)

**Status:** Bereits vollständig implementiert

**Datei:** `apps/manacore/apps/web/src/lib/config/apps.ts`

**Alle Apps konfiguriert:**

| Kategorie    | Apps                                        |
| ------------ | ------------------------------------------- |
| Core         | manacore                                    |
| AI-Powered   | chat, picture, presi, mail                  |
| Productivity | manadeck, todo, calendar, contacts, finance |
| Utility      | clock, zitare, storage, moodlit             |

Archivierte Apps (memoro, storyteller) wurden bereits entfernt.

---

### 3. ✅ Dashboard-Widgets erweitern (GRÖSSTENTEILS ERLEDIGT)

**Status:** 14 von 16 Widgets implementiert (Finance + Mail fehlen)

**Existierende Widgets (14 Typen):**

| Widget                  | App            | Status |
| ----------------------- | -------------- | ------ |
| CreditsWidget           | mana-core-auth | ✅     |
| TransactionsWidget      | mana-core-auth | ✅     |
| ReferralWidget          | mana-core-auth | ✅     |
| QuickActionsWidget      | core           | ✅     |
| TasksTodayWidget        | todo           | ✅     |
| TasksUpcomingWidget     | todo           | ✅     |
| CalendarEventsWidget    | calendar       | ✅     |
| ChatRecentWidget        | chat           | ✅     |
| ContactsFavoritesWidget | contacts       | ✅     |
| ZitareQuoteWidget       | zitare         | ✅     |
| PictureRecentWidget     | picture        | ✅     |
| ManadeckProgressWidget  | manadeck       | ✅     |
| ClockTimersWidget       | clock          | ✅     |
| StorageUsageWidget      | storage        | ✅     |

**Neue Widgets (2026-02-13):**

- [x] StorageUsageWidget - Speichernutzung und letzte Dateien

**Noch offen (Backend fehlt noch):**

- [ ] FinanceBalanceWidget (finance Backend nötig)
- [ ] MailInboxWidget (mail Backend nötig)

---

### 4. ✅ Profil-Features vervollständigen (Backend ERLEDIGT)

**Status:** Backend implementiert am 2026-02-13

**Implementierte Backend-Endpoints:**

| Endpoint                | Methode | Beschreibung                                         |
| ----------------------- | ------- | ---------------------------------------------------- |
| `/auth/profile`         | GET     | Profil-Daten abrufen                                 |
| `/auth/profile`         | POST    | Profil aktualisieren (Name, Bild)                    |
| `/auth/change-password` | POST    | Passwort ändern (mit aktuellem Passwort)             |
| `/auth/account`         | DELETE  | Konto löschen (Soft-Delete mit Passwort-Bestätigung) |

**Feature-Status:**

| Feature           | Backend | Frontend | Priorität |
| ----------------- | ------- | -------- | --------- |
| Profil bearbeiten | ✅      | ✅       | Hoch      |
| Passwort ändern   | ✅      | ✅       | Hoch      |
| Konto löschen     | ✅      | ✅       | Mittel    |
| Avatar hochladen  | ✅      | ❌       | Niedrig   |
| 2FA aktivieren    | ❌      | ❌       | Niedrig   |

**Dateien:**

- `services/mana-core-auth/src/auth/auth.controller.ts` - Endpoints
- `services/mana-core-auth/src/auth/services/better-auth.service.ts` - Service-Methoden
- `services/mana-core-auth/src/auth/dto/update-profile.dto.ts` - Profil-Update DTO
- `services/mana-core-auth/src/auth/dto/change-password.dto.ts` - Passwort-Ändern DTO
- `services/mana-core-auth/src/auth/dto/delete-account.dto.ts` - Konto-Löschen DTO

**Frontend (Implementiert 2026-02-13):**

- [x] Profil-Edit Modal erstellt (`EditProfileModal.svelte`)
- [x] Passwort-Ändern Dialog erstellt (`ChangePasswordModal.svelte`)
- [x] Konto-Löschung mit Bestätigung (`DeleteAccountModal.svelte`)

**Avatar-Upload (Implementiert 2026-02-13):**

- [x] Storage-Modul für S3/MinIO (`services/mana-core-auth/src/storage/`)
- [x] Presigned URL Endpoint: `POST /api/v1/storage/avatar/upload-url`
- [x] Direct Upload Endpoint: `POST /api/v1/storage/avatar`
- [x] `manacore-storage` Bucket konfiguriert
- [ ] Frontend-Integration (EditProfileModal) noch offen

---

## Mittlere Priorität

### 5. Benachrichtigungen/Notifications

**Beschreibung:** Zentrales Benachrichtigungssystem für alle Apps

**Use Cases:**

- Kalender-Erinnerungen (15 min vor Termin)
- Todo-Deadlines (Heute fällig)
- Credit-Warnungen (< 10 Credits)
- Neue Chat-Nachrichten
- Manadeck (Karten zum Lernen)

**Aufgaben:**

- [ ] Notification-Service erstellen
- [ ] Push-Notification Setup (Web Push API)
- [ ] Notification-Center UI
- [ ] Einstellungen pro Notification-Typ
- [ ] Backend: Notification-Queue

**Geschätzter Aufwand:** 3-5 Tage

---

### 6. ✅ Subscription/Plan-Management (Backend ERLEDIGT)

**Status:** Backend implementiert am 2026-02-13

**Implementiert:**

- [x] DB-Schema: `subscriptions.plans`, `subscriptions.subscriptions`, `subscriptions.invoices`
- [x] `SubscriptionsService` mit Checkout, Portal, Cancel, Reactivate
- [x] `SubscriptionsController` mit REST-Endpoints
- [x] Stripe Checkout Session für Subscriptions
- [x] Stripe Customer Portal Integration (Self-Service Billing)
- [x] Webhook-Handler für Subscription/Invoice Events
- [x] Pläne angelegt (Free, Pro, Enterprise)

**Subscription-Pläne:**

| Plan       | Mana/Monat | Monatlich | Jährlich | Features                                |
| ---------- | ---------- | --------- | -------- | --------------------------------------- |
| Free       | 150        | €0        | €0       | Basis-Features, Community Support       |
| Pro        | 1.500      | €9,99     | €99,90   | Alle Features, Priority Support, API    |
| Enterprise | 10.000     | €49,99    | €499,90  | SSO, Audit Logs, SLA, Dedicated Support |

**API-Endpoints:**

```
GET  /api/v1/subscriptions/plans          # Alle Pläne
GET  /api/v1/subscriptions/current        # Aktuelles Abo
POST /api/v1/subscriptions/checkout       # Stripe Checkout starten
POST /api/v1/subscriptions/portal         # Billing Portal öffnen
POST /api/v1/subscriptions/cancel         # Kündigen
POST /api/v1/subscriptions/reactivate     # Reaktivieren
GET  /api/v1/subscriptions/invoices       # Rechnungen
```

**Frontend (Implementiert 2026-02-13):**

- [x] Plan-Übersicht Seite im Frontend (`/subscription`)
- [x] Plan-Vergleichs-UI mit monatlich/jährlich Toggle
- [x] Stripe Checkout Integration für Subscriptions
- [x] Billing Portal Integration
- [x] Rechnungsübersicht
- [x] Subscription-Plans Seed-Script erstellt (`pnpm db:seed:plans`)
- [ ] Stripe Products/Prices erstellen und ENV-Variablen setzen

---

### 7. API-Keys Verwaltung

**Beschreibung:** Für Entwickler/Power-User API-Zugang ermöglichen

**Features:**

- API-Key generieren
- Key-Liste mit Berechtigungen
- Key widerrufen
- Usage-Statistiken pro Key

**Aufgaben:**

- [ ] API-Keys Seite erstellen
- [ ] Backend: Key-Generation
- [ ] Scopes/Berechtigungen definieren
- [ ] Rate-Limiting pro Key

**Geschätzter Aufwand:** 2-3 Tage

---

### 8. Onboarding-Flow

**Beschreibung:** Welcome-Wizard für neue Benutzer

**Schritte:**

1. Willkommen & Kurze Einführung
2. Profil vervollständigen (Name, Avatar)
3. Bevorzugte Apps auswählen
4. Dashboard personalisieren
5. Credits-System erklären
6. Tour durch wichtigste Features

**Aufgaben:**

- [ ] Onboarding-Wizard Komponente
- [ ] Progress-Tracking (User hat Onboarding abgeschlossen)
- [ ] Skip-Option
- [ ] Feature-Tour (Tooltip-basiert)

**Geschätzter Aufwand:** 2-3 Tage

---

## Niedrige Priorität (Nice-to-have)

### 9. Mobile App aktivieren

**Beschreibung:** Die Mobile App (`apps/mobile`) existiert, aber scheint nicht aktiv genutzt

**Status:** Expo-Projekt vorhanden, aber möglicherweise veraltet

**Aufgaben:**

- [ ] Dependencies aktualisieren
- [ ] Funktionalität mit Web-App abgleichen
- [ ] Auth-Flow testen
- [ ] App Store Submission vorbereiten

---

### 10. DSGVO-konformer Daten-Export

**Beschreibung:** Benutzer können alle ihre Daten exportieren

**Features:**

- "Meine Daten exportieren" Button
- ZIP mit allen Daten (JSON/CSV)
- Inkl. aller App-Daten
- Account-Migration zu anderer Instanz

**Aufgaben:**

- [ ] Export-Job Backend
- [ ] Download-Link per E-Mail
- [ ] Fortschrittsanzeige

---

### 11. Aktivitäts-Feed

**Beschreibung:** Übergreifende Timeline aller Aktivitäten

**Features:**

- "Was habe ich heute gemacht?"
- Filter nach App
- Zeitraum-Auswahl
- Export als Report

---

### 12. Keyboard Shortcuts

**Beschreibung:** Power-User Shortcuts

**Shortcuts:**

- `Cmd/Ctrl + K` - Quick Search/Command Palette
- `Cmd/Ctrl + 1-9` - Schnellzugriff auf Apps
- `Cmd/Ctrl + N` - Neue Aktion (kontextabhängig)

---

## Empfohlene Reihenfolge

| #   | Task                        | Aufwand  | Impact   | Abhängigkeiten |
| --- | --------------------------- | -------- | -------- | -------------- |
| 1   | App-Config aktualisieren    | 2-4h     | Hoch     | Keine          |
| 2   | Stripe-Integration          | 2-3 Tage | Kritisch | mana-core-auth |
| 3   | Dashboard-Widgets erweitern | 1-2 Tage | Hoch     | App-Config     |
| 4   | Profil-Features             | 1-2 Tage | Mittel   | Keine          |
| 5   | Notifications               | 3-5 Tage | Hoch     | Backend-Arbeit |
| 6   | Onboarding                  | 2-3 Tage | Mittel   | Keine          |
| 7   | Subscription-Management     | 2-3 Tage | Mittel   | Stripe         |
| 8   | API-Keys                    | 2-3 Tage | Niedrig  | Keine          |

---

## Quick Wins (< 1 Stunde)

Diese Tasks können schnell erledigt werden:

- [ ] Archivierte Apps aus `apps.ts` entfernen
- [ ] Deutsche Übersetzungen vervollständigen
- [ ] "Coming Soon" Badges für fehlende Features
- [ ] Loading-States verbessern
- [ ] Error-Handling mit Toast-Notifications

---

## Technische Schulden

| Issue                     | Priorität | Beschreibung                   |
| ------------------------- | --------- | ------------------------------ |
| Supabase → mana-core-auth | Hoch      | Auth-Migration abschließen     |
| Tests fehlen              | Mittel    | Unit/E2E Tests hinzufügen      |
| TypeScript strict mode    | Niedrig   | Strikte Typisierung aktivieren |
| Bundle-Size               | Niedrig   | Tree-shaking optimieren        |

---

_Zuletzt aktualisiert: 2026-02-13 (Avatar Storage Backend + Subscription Plans Seed)_
