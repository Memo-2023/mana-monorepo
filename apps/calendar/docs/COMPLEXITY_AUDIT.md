# Calendar Web App — Complexity Audit

**Datum:** 2026-03-20

## Zusammenfassung

Analyse der Calendar Web App hinsichtlich unnötiger Komplexität und unterentwickelter Bereiche.
Gesamtumfang: ~12.800 LOC, 17 Stores, 50+ Komponenten, 10 API-Module, 8 Composables.

---

## Teil 1: Unnötige Komplexität

### 1. Tag-Gruppen-Hierarchie ✅ Entfernt

**Problem:** Zwei separate Stores (`event-tags` + `event-tag-groups`), eigene API, eigene Route (`/tags/groups`), und ein 1.452-Zeilen-Modal (`TagStripModal.svelte`) mit Drag-Drop-Sortierung für Gruppen — für ein Feature, das kaum genutzt wird.

**Betroffene Dateien:**
- `stores/event-tag-groups.svelte.ts` (151 LOC)
- `api/event-tag-groups.ts` (84 LOC)
- `routes/(app)/tags/groups/+page.svelte` (375 LOC)
- `components/tags/TagGroupEditModal.svelte` (123 LOC)
- `components/tags/GroupedTagList.svelte` (245 LOC)
- `components/calendar/TagStripModal.svelte` — Gruppen-Logik (Drag-Drop, CRUD, Forms)
- `components/calendar/TagStrip.svelte` — Gruppen-basierte Sortierung

**Lösung:** Tag-Gruppen-System komplett entfernt. Tags werden alphabetisch sortiert als flache Liste angezeigt. Die `groupId`-Referenz auf Tags bleibt im API/Shared-Typ erhalten (Backend-Kompatibilität), wird aber im Frontend ignoriert.

**Einsparung:** ~600+ LOC entfernt, 2 Stores → 1 Store, 1 Route weniger

---

### 2. Drag-Drop Legacy-Composables ✅ Entfernt

**Problem:** Vier separate Composables für ähnliche Funktionalität:
- `useDragDrop.svelte.ts` (238 LOC) — Event-Drag, Subset von useEventDragDrop
- `useResize.svelte.ts` (236 LOC) — Event-Resize, Subset von useEventDragDrop
- `useEventDragDrop.svelte.ts` (427 LOC) — Konsolidierte Version (Drag + Resize)
- `useTaskDragDrop.svelte.ts` (321 LOC) — Task-spezifisch

Die Legacy-Composables (`useDragDrop`, `useResize`) sind von keiner Komponente importiert — reiner Dead Code.

**Lösung:** Legacy-Composables `useDragDrop` und `useResize` gelöscht. Re-Exports aus `index.ts` entfernt. `useEventDragDrop` und `useTaskDragDrop` bleiben als die konsolidierten Versionen.

**Einsparung:** ~474 LOC Dead Code entfernt

---

### 3. WeekView-Monolith (1.600 LOC) — Offen

**Problem:** Vereint 12 State-Variablen für Drag, Resize, Create, Task-Drag, Sichtbarkeitsfilter in einer Komponente.

**Empfehlung:** Aufteilen in `WeekGrid`, `WeekAllDayRow`, `WeekTimeIndicator`, `WeekDragOverlay`.

---

### 4. DateStrip Overengineering (649 LOC) — Offen

**Problem:** Mondphasen, Event-Indikatoren, Kompakt/Expanded-Modi, Infinite-Scroll mit 60-Tage-Buffer, 15+ Settings.

**Empfehlung:** Mondphasen und Indikatoren als optionale Sub-Komponenten extrahieren.

---

### 5. UnifiedBar Komplexität (633 LOC) — Offen

**Problem:** 3 Modi mit Layer-System, duplizierte Renderings von DateStrip/TagStrip, eigener Store mit Cloud-Sync für lokalen UI-State.

**Empfehlung:** Vereinfachen, Duplikate entfernen, Cloud-Sync für UI-State überdenken.

---

### 6. ViewCarousel Gesture-Handling (~400 LOC) — Offen

**Problem:** Touch + Wheel + Keyboard + Button-Navigation mit Velocity-Berechnung und RAF-Animation, eng gekoppelt.

**Empfehlung:** Gesture-Handling als wiederverwendbares Composable extrahieren.

---

## Teil 2: Unterentwickelte Bereiche

### 1. Keine Kalender-Synchronisation (CalDAV/iCal) — Priorität: Hoch

Backend hat `external_calendars`-Tabelle und Sync-Endpunkte. Frontend hat null UI dafür.
Für eine Kalender-App ist das das größte fehlende Feature.

### 2. Keine wiederkehrenden Termine (Recurring Events) — Priorität: Hoch

Backend-Schema unterstützt RFC 5545 RRULE. Kein UI oder Store-Logik dafür.
Essentiell für eine nutzbare Kalender-App.

### 3. Erinnerungen / Notifications nur rudimentär — Priorität: Mittel

API-Client `reminders.ts` existiert, aber nur Basic CRUD. Keine Push-Notifications, keine E-Mail-Erinnerungen, kein UI zur Konfiguration pro Event.

### 4. Kalender-Sharing kaum implementiert — Priorität: Mittel

`shares.ts` API-Client existiert als Stub. Kein UI zum Teilen oder für Berechtigungsverwaltung.

### 5. Fehlertoleranz bei Cross-App-Integration — Priorität: Mittel

Calendar hängt von Contacts (Birthdays), Todo, und STT ab. Kein Error Boundary oder Offline-Fallback.

### 6. Suche sehr basic — Priorität: Niedrig

Nur Query + Event-ID-Matching für Highlighting. Keine Volltextsuche, keine Filter.

### 7. Mobile Experience — Priorität: Niedrig

Web-App ist responsive, aber nicht touch-optimiert. Keine dedizierte Mobile-App (Expo leer).
