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

| Feature        | Status | Beschreibung                                   |
| -------------- | ------ | ---------------------------------------------- |
| Dashboard      | ✅     | Anpassbare Widgets, Drag & Drop                |
| Credits-System | ✅     | Übersicht, Transaktionen, Pakete (ohne Stripe) |
| Teams          | ✅     | Team-Verwaltung                                |
| Organizations  | ✅     | Organisations-Verwaltung                       |
| Settings       | ✅     | Benutzereinstellungen                          |
| Themes         | ✅     | Theme-Auswahl                                  |
| Feedback       | ✅     | Feedback-Formular                              |
| Profil         | ✅     | Basis-Profil-Ansicht                           |
| i18n           | ✅     | 5 Sprachen (DE, EN, ES, FR, IT)                |
| Apps-Übersicht | ✅     | Alle Mana-Apps anzeigen                        |

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

### 1. Stripe-Integration für Credit-Kauf

**Problem:** Credit-Kauf zeigt nur Alert statt echtem Checkout

**Betroffene Datei:** `apps/manacore/apps/web/src/routes/(app)/credits/+page.svelte`

```typescript
// Zeile 93-98: TODO im Code
function handleBuyPackage(pkg: CreditPackage) {
	// TODO: Integrate with Stripe
	alert(`...Stripe-Integration kommt bald!`);
}
```

**Aufgaben:**

- [ ] Stripe SDK integrieren
- [ ] Checkout Session erstellen (Backend)
- [ ] Webhook für erfolgreiche Zahlungen
- [ ] Credit-Gutschrift nach Zahlung
- [ ] Rechnungs-PDF generieren

**Geschätzter Aufwand:** 2-3 Tage

---

### 2. App-Config aktualisieren

**Problem:** `apps.ts` enthält veraltete Apps und fehlt neue

**Betroffene Datei:** `apps/manacore/apps/web/src/lib/config/apps.ts`

**Aktuell konfiguriert:**

- memoro (archiviert!)
- manadeck ✅
- storyteller (archiviert!)
- manacore ✅

**Fehlende Apps:**
| App | Typ | Priorität |
|-----|-----|-----------|
| chat | AI-Chat | Hoch |
| picture | AI-Bilder | Hoch |
| zitare | Zitate | Hoch |
| calendar | Kalender | Hoch |
| todo | Aufgaben | Hoch |
| contacts | Kontakte | Mittel |
| clock | Uhren | Mittel |
| presi | Präsentationen | Mittel |
| finance | Finanzen | Mittel |
| mail | E-Mail | Niedrig |
| storage | Cloud-Speicher | Niedrig |
| moodlit | Ambient Lighting | Niedrig |

**Aufgaben:**

- [ ] Archivierte Apps entfernen (memoro, storyteller)
- [ ] Alle aktiven Apps hinzufügen
- [ ] Features pro App definieren
- [ ] Icons/Emojis festlegen
- [ ] Farben pro App definieren

**Geschätzter Aufwand:** 2-4 Stunden

---

### 3. Dashboard-Widgets erweitern

**Problem:** Nur 6 Widget-Typen, neue Apps fehlen

**Betroffene Dateien:**

- `lib/components/dashboard/widgets/`
- `lib/types/dashboard.ts`
- `lib/config/default-dashboard.ts`

**Neue Widgets erstellen:**

| Widget                 | App      | Beschreibung                    |
| ---------------------- | -------- | ------------------------------- |
| PictureRecentWidget    | picture  | Letzte AI-Generierungen         |
| ManadeckProgressWidget | manadeck | Lernfortschritt, fällige Karten |
| FinanceBalanceWidget   | finance  | Kontostand, Budget-Status       |
| ZitareQuoteWidget      | zitare   | Tägliches Zitat                 |
| ClockAlarmsWidget      | clock    | Nächste Wecker/Timer            |
| MailInboxWidget        | mail     | Ungelesene E-Mails              |
| StorageUsageWidget     | storage  | Speicherplatz-Übersicht         |

**Aufgaben:**

- [ ] Widget-Komponenten erstellen
- [ ] API-Services erweitern
- [ ] Widget-Registry aktualisieren
- [ ] Default-Dashboard anpassen

**Geschätzter Aufwand:** 1-2 Tage

---

### 4. Profil-Features vervollständigen

**Problem:** Mehrere Profil-Aktionen sind nicht implementiert

**Betroffene Datei:** `apps/manacore/apps/web/src/routes/(app)/profile/+page.svelte`

```typescript
// Zeile 20-22: Nur Alert
onDeleteAccount: () => {
  alert('Konto löschen ist noch nicht implementiert.');
},
```

**Fehlende Features:**

| Feature           | Status | Priorität |
| ----------------- | ------ | --------- |
| Profil bearbeiten | ❌     | Hoch      |
| Passwort ändern   | ❌     | Hoch      |
| Konto löschen     | ❌     | Mittel    |
| Avatar hochladen  | ❌     | Niedrig   |
| 2FA aktivieren    | ❌     | Niedrig   |

**Aufgaben:**

- [ ] Profil-Edit Modal/Seite erstellen
- [ ] Passwort-Ändern Dialog
- [ ] Konto-Löschung mit Bestätigung
- [ ] Backend-Endpoints prüfen/erstellen

**Geschätzter Aufwand:** 1-2 Tage

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

### 6. Subscription/Plan-Management

**Beschreibung:** Verwaltung von Abonnements und Plänen

**Features:**

- Aktuelle Plan-Übersicht (Free, Pro, Enterprise)
- Upgrade/Downgrade Workflow
- Rechnungshistorie
- Zahlungsmethoden verwalten
- Kündigung

**Aufgaben:**

- [ ] Plan-Übersicht Seite
- [ ] Stripe Customer Portal Integration
- [ ] Rechnungs-Download
- [ ] Plan-Vergleichs-UI

**Geschätzter Aufwand:** 2-3 Tage

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

_Zuletzt aktualisiert: 2024-12-05_
