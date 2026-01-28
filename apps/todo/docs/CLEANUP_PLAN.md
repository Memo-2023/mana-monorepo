# Todo App - Cleanup Plan

Dieser Plan dokumentiert Features und Code, die überdurchschnittlich viel Komplexität erzeugen bei geringem Nutzen. Ziel ist eine schlankere, wartbarere Codebase.

## Status-Legende

- ✅ Erledigt
- 🔄 In Bearbeitung
- ⏳ Geplant
- ❌ Abgelehnt

---

## Geplante Aufräumarbeiten

### Priorität 1: Quick Wins (Hoher ROI)

#### ✅ 1.1 Statistiken & Heatmap entfernen

**Status:** Erledigt
**Geschätzte Ersparnis:** ~1.900 Zeilen
**Komplexität:** HOCH | **Nutzen:** NIEDRIG

**Beschreibung:**
Umfangreiches Analytics-System mit Activity Heatmap, Weekly Trend Chart, Priority Donut, Project Progress, Weekly Velocity. Die meisten Nutzer verwenden diese Features nicht.

**Zu entfernende Dateien:**
- `src/lib/stores/statistics.svelte.ts` (~361 Zeilen)
- `src/lib/components/statistics/ActivityHeatmap.svelte`
- `src/lib/components/statistics/WeeklyTrendChart.svelte`
- `src/lib/components/statistics/PriorityDonutChart.svelte`
- `src/lib/components/statistics/ProjectProgressBars.svelte`
- `src/lib/components/statistics/StatsOverview.svelte`
- `src/routes/(app)/statistics/+page.svelte`

**Zu ändernde Dateien:**
- `src/routes/(app)/+layout.svelte` - Nav-Item entfernen

---

#### ✅ 1.2 Network View entfernen

**Status:** Erledigt
**Geschätzte Ersparnis:** ~800 Zeilen
**Komplexität:** HOCH | **Nutzen:** NIEDRIG

**Beschreibung:**
D3.js Force-Directed Graph zur Visualisierung von Task-Beziehungen. Komplex (Force Simulation, Node Dragging, Filtering) aber wenig genutzt.

**Zu entfernende Dateien:**
- `src/lib/stores/network.svelte.ts` (~370 Zeilen)
- `src/lib/api/network.ts` (~50 Zeilen)
- `src/routes/(app)/network/+page.svelte`

**Zu ändernde Dateien:**
- `src/routes/(app)/+layout.svelte` - Nav-Item entfernen

---

#### ✅ 1.3 Session Tasks → Demo-Modus

**Status:** Erledigt
**Geschätzte Ersparnis:** ~100 Zeilen (netto)
**Komplexität:** MITTEL | **Nutzen:** HOCH (bessere UX)

**Beschreibung:**
Wie bei der Calendar-App: Session-basiertes Task-Management durch statischen Demo-Modus ersetzen. Statt frustrierender UX (Tasks verschwinden bei Tab-Schließung) zeigt die App Beispiel-Tasks.

**Zu entfernende Dateien:**
- `src/lib/stores/session-tasks.svelte.ts` (~190 Zeilen)

**Neue Dateien:**
- `src/lib/data/demo-tasks.ts` (~100 Zeilen)

**Zu ändernde Dateien:**
- `src/lib/stores/tasks.svelte.ts` - Session-Logik durch Demo-Tasks ersetzen
- `src/routes/(app)/+layout.svelte` - Demo-Banner, Auth-Gate
- `src/routes/(app)/+page.svelte` - Auth-Gate bei Task-Erstellung

---

### Priorität 2: Mittlerer Aufwand

#### ⏳ 2.1 Contacts Integration entfernen

**Status:** Geplant
**Geschätzte Ersparnis:** ~200 Zeilen
**Komplexität:** MITTEL | **Nutzen:** NIEDRIG

**Beschreibung:**
Cross-App Integration mit Contacts-App. Geringe Nutzung wenn Contacts-App nicht adoptiert.

**Zu entfernende Dateien:**
- `src/lib/stores/contacts.svelte.ts` (~175 Zeilen)

---

## Zusammenfassung

| Phase | Features | LOC Ersparnis | Status |
|-------|----------|---------------|--------|
| ✅ Prio 1.1 | Statistiken/Heatmap | ~1.900 | Erledigt |
| ✅ Prio 1.2 | Network View | ~800 | Erledigt |
| ✅ Prio 1.3 | Sessions → Demo | ~100 | Erledigt |
| 🟡 Prio 2 | Contacts Integration | ~200 | Geplant |
| **Gesamt** | | **~3.000** | |

**Ziel:** ~25% Code-Reduktion bei gleichem/besserem Nutzererlebnis

---

## Changelog

| Datum | Aktion | Commit |
|-------|--------|--------|
| 2026-01-28 | Statistiken, Network View, Session Tasks entfernt; Demo-Modus implementiert | 99fdf1d1 |
