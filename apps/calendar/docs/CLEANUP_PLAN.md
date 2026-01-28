# Calendar App - Cleanup Plan

Dieser Plan dokumentiert Features und Code, die überdurchschnittlich viel Komplexität erzeugen bei geringem Nutzen. Ziel ist eine schlankere, wartbarere Codebase.

## Status-Legende

- ✅ Erledigt
- 🔄 In Bearbeitung
- ⏳ Geplant
- ❌ Abgelehnt

---

## Erledigte Aufräumarbeiten

### ✅ Statistiken & Heatmap (2024-01-28)

**Commit:** `2f3473b7`

**Entfernte Dateien:**
- `src/lib/stores/statistics.svelte.ts` (270 Zeilen)
- `src/lib/stores/heatmap.svelte.ts` (190 Zeilen)
- `src/lib/components/calendar/StatsSidebarSection.svelte` (434 Zeilen)
- `src/lib/components/calendar/StatsOverlay.svelte` (257 Zeilen)

**Geänderte Dateien:**
- Heatmap-CSS aus allen View-Komponenten entfernt
- Nav-Item "Statistiken" entfernt
- Toolbar Heatmap-Toggle entfernt

**Ersparnis:** ~1.450 Zeilen

---

## Geplante Aufräumarbeiten

### Priorität 1: Quick Wins (Hoher ROI)

#### ✅ 1.1 Network View entfernen (2024-01-28)

**Commit:** `9a93ca0c`
**Ersparnis:** ~910 Zeilen

**Entfernte Dateien:**
- `src/lib/components/calendar/NetworkView.svelte` (~416 Zeilen)
- `src/lib/stores/network.svelte.ts` (~371 Zeilen)
- `src/lib/api/network.ts` (~47 Zeilen)
- `src/lib/stores/view-mode.svelte.ts` (~76 Zeilen)

**Geänderte Dateien:**
- `src/routes/(app)/+page.svelte` - Network-View Conditional entfernt
- `src/routes/(app)/+layout.svelte` - Network-Tab aus ViewSwitcher entfernt

---

#### ✅ 1.2 Session Events → Demo-Modus (2024-01-28)

**Ersparnis:** ~150 Zeilen (netto, nach Abzug der neuen Demo-Events-Datei)

**Beschreibung:**
Session-basiertes Event-Management (sessionStorage) durch statischen Demo-Modus ersetzt. Statt frustrierender UX (Events verschwinden bei Tab-Schließung) zeigt die App jetzt Beispiel-Termine, die das Feature demonstrieren.

**Entfernte Dateien:**
- `src/lib/stores/session-events.svelte.ts` (~154 Zeilen)

**Neue Dateien:**
- `src/lib/data/demo-events.ts` (~100 Zeilen) - Statische Demo-Termine

**Geänderte Dateien:**
- `src/lib/stores/events.svelte.ts` - Session-Logik durch Demo-Events ersetzt
- `src/lib/components/AuthGateModal.svelte` - Session-Anzeige entfernt
- `src/routes/(app)/+layout.svelte` - Demo-Banner statt Gast-Banner
- `src/routes/(app)/+page.svelte` - Auth-Gate bei Event-Erstellung/Bearbeitung

**Verbesserungen:**
- Nutzer sehen realistische Beispiel-Termine beim ersten Besuch
- Klick auf Event oder "Neuer Termin" öffnet Login-Dialog
- Kein Datenverlust mehr möglich (Demo-Events sind readonly)

---

#### ⏳ 1.3 Event Parser (NLP) entfernen

**Status:** Geplant
**Geschätzte Ersparnis:** ~260 Zeilen
**Komplexität:** MITTEL | **Nutzen:** NIEDRIG

**Beschreibung:**
Natural Language Parsing für Termineinträge (nur Deutsch). Regex-basiert und fehleranfällig. Die meisten Nutzer verwenden strukturierte Formulare.

**Zu entfernende Dateien:**
- `src/lib/utils/event-parser.ts` (~261 Zeilen)

**Zu ändernde Dateien:**
- `src/routes/(app)/+layout.svelte` - QuickInputBar onCreate/onParseCreate entfernen
- QuickInputBar-Integration vereinfachen (nur Suche, kein Quick-Create)

---

### Priorität 2: Mittlerer Aufwand

#### ⏳ 2.1 Swipe Navigation entfernen

**Status:** Geplant
**Geschätzte Ersparnis:** ~180 Zeilen
**Komplexität:** MITTEL | **Nutzen:** NIEDRIG

**Beschreibung:**
Trackpad-/Touch-Swipe für horizontale Kalendernavigation. Pfeiltasten und Buttons reichen völlig aus.

**Zu entfernende Dateien:**
- `src/lib/composables/useSwipeNavigation.svelte.ts` (~183 Zeilen)

**Zu ändernde Dateien:**
- `src/lib/components/calendar/ViewCarousel.svelte` - Swipe-Integration entfernen

---

#### ⏳ 2.2 Context Menus entfernen

**Status:** Geplant
**Geschätzte Ersparnis:** ~400 Zeilen
**Komplexität:** MITTEL | **Nutzen:** NIEDRIG

**Beschreibung:**
4+ verschiedene Context-Menus mit duplizierten Aktionen. Mobile unterstützt keine Context-Menus. Aktionen besser in sichtbare Buttons verschieben.

**Zu entfernende Dateien:**
- `src/lib/components/event/EventContextMenu.svelte`
- `src/lib/components/calendar/CalendarHeaderContextMenu.svelte`
- `src/lib/components/calendar/DateStripContextMenu.svelte`
- `src/lib/components/calendar/ViewModePillContextMenu.svelte`
- `src/lib/stores/eventContextMenu.svelte.ts`

---

#### ⏳ 2.3 Settings vereinfachen

**Status:** Geplant
**Geschätzte Ersparnis:** ~200 Zeilen
**Komplexität:** MITTEL | **Nutzen:** NIEDRIG

**Beschreibung:**
Aktuell ~42 Einstellungen - die meisten Nutzer verwenden Defaults. Reduzieren auf ~8 Kern-Einstellungen.

**Zu entfernende Settings:**
- Mondphasen-Anzeige
- DateStrip-Varianten (compact, eventIndicators, etc.)
- Header-Format-Optionen
- Zeitfilter-Optionen

---

### Priorität 3: Größere Refactorings

#### ⏳ 3.1 Calendar Views reduzieren (7 → 3)

**Status:** Geplant
**Geschätzte Ersparnis:** ~1.500 Zeilen
**Komplexität:** HOCH | **Nutzen:** HOCH (Vereinfachung)

**Beschreibung:**
7 verschiedene View-Typen sind zu viel. Die meisten Nutzer brauchen nur Week, Month, Agenda.

**Behalten:**
- `WeekView.svelte` (Standard)
- `MonthView.svelte`
- `AgendaView.svelte`

**Entfernen:**
- `YearView.svelte` (~420 Zeilen)
- `DayView.svelte` (~1.104 Zeilen) - Week-View für einzelne Tage nutzen
- `MultiDayView.svelte` (~1.594 Zeilen) - Week-View mit variablem dayCount

---

#### ⏳ 3.2 Tag-System vereinfachen

**Status:** Geplant
**Geschätzte Ersparnis:** ~1.600 Zeilen
**Komplexität:** HOCH | **Nutzen:** MITTEL

**Beschreibung:**
Tag-Gruppen-Hierarchie entfernen → nur flache Tags. Drag-Drop-Sortierung entfernen → alphabetisch sortieren.

**Zu vereinfachende Dateien:**
- `src/lib/components/calendar/TagStripModal.svelte` (1.463 Zeilen → ~300 Zeilen)
- `src/lib/stores/event-tag-groups.svelte.ts` (entfernen)
- `src/lib/stores/event-tags.svelte.ts` (vereinfachen)

---

#### ⏳ 3.3 Birthday-Integration vereinfachen

**Status:** Geplant
**Geschätzte Ersparnis:** ~350 Zeilen
**Komplexität:** MITTEL | **Nutzen:** MITTEL-NIEDRIG

**Beschreibung:**
Cross-App API-Integration für Geburtstage. Ersetzbar durch manuelles Eintragen oder einfachen Import.

**Zu entfernende/vereinfachende Dateien:**
- `src/lib/stores/birthdays.svelte.ts` (~220 Zeilen)
- `src/lib/api/birthdays.ts` (~101 Zeilen)
- `src/lib/components/birthday/BirthdayPopover.svelte`

---

## Zusammenfassung

| Phase | Features | LOC Ersparnis | Status |
|-------|----------|---------------|--------|
| ✅ Done | Statistiken/Heatmap | ~1.450 | Erledigt |
| ✅ Done | Network View | ~910 | Erledigt |
| ✅ Done | Session Events → Demo | ~150 | Erledigt |
| 🟢 Prio 1 | Parser | ~260 | Geplant |
| 🟡 Prio 2 | Swipe, Context, Settings | ~780 | Geplant |
| 🔴 Prio 3 | Views, Tags, Birthdays | ~3.450 | Geplant |
| **Gesamt** | | **~7.000** | |

**Ziel:** ~30% Code-Reduktion bei gleichem/besserem Nutzererlebnis

**Bisherige Ersparnis:** ~2.510 LOC (Statistiken + Network + Sessions)

---

## Changelog

| Datum | Aktion | Commit |
|-------|--------|--------|
| 2024-01-28 | Session Events → Demo-Modus | pending |
| 2024-01-28 | Network View entfernt | `9a93ca0c` |
| 2024-01-28 | Statistiken & Heatmap entfernt | `2f3473b7` |
