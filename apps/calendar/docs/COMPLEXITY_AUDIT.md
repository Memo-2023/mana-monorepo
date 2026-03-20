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

### 5. UnifiedBar Komplexität — ✅ Vereinfacht (633→559 LOC)

- 3 duplizierte DateStrip-Blöcke entfernt (4→1)
- 1 duplizierten TagStrip-Block entfernt (2→1)
- Deprecated Svelte 4 createEventDispatcher entfernt
- Ungenutzte Komponenten-Imports entfernt

---

### 6. ViewCarousel Gesture-Handling — ✅ Extrahiert (402→162 LOC)

- Gesamte Gesture-Logik (Touch, Wheel, Velocity, Snap, Animation, Chain-Navigation)
  in `useSwipeNavigation` Composable extrahiert (260 LOC)
- ViewCarousel enthält nur noch Layout und View-Rendering

---

## Teil 2: Unterentwickelte Bereiche

### 1. Keine Kalender-Synchronisation (CalDAV/iCal) — ✅ Implementiert

- API-Client (`lib/api/sync.ts`) für alle Sync-Endpunkte
- External Calendars Store mit connect/disconnect/sync
- Settings-Seite `/settings/sync` mit Provider-Auswahl, CalDAV-Discovery, Sync-Status
- Sidebar zeigt externe Kalender mit Sichtbarkeits-Toggle

### 2. Keine wiederkehrenden Termine (Recurring Events) — ✅ Implementiert

- RecurrenceSelector-Komponente mit Presets + benutzerdefinierter Konfiguration
- Im EventForm integriert, sendet `recurrenceRule` + `recurrenceEndDate`
- Events Store expandiert RRULE zu Einzelterminen per `generateOccurrences()`
- RecurrenceEditDialog für "Diesen/Alle/Zukünftige" beim Löschen
- In EventDetailModal und QuickEventOverlay integriert

### 3. Erinnerungen / Notifications — ✅ Implementiert

- ReminderSelector-Komponente mit Draft-Modus (neue Events) und Saved-Modus (bestehende Events)
- In EventForm integriert: Standard-Erinnerung aus Settings, Push/Email-Toggles
- In EventDetailModal integriert: Erinnerungen anzeigen/hinzufügen/löschen
- Preset-Auswahl (Zum Zeitpunkt, 5-30 Min., 1-2 Std., 1-2 Tage, 1 Woche)
- Status-Anzeige (Ausstehend/Gesendet/Fehlgeschlagen)
- Backend war bereits vollständig (Cron, Expo Push, Brevo Email)

### 4. Kalender-Sharing — ✅ Implementiert

- Shares Store mit vollem Lifecycle (Teilen, Annehmen/Ablehnen, Entfernen, Berechtigungen)
- /settings/sharing Seite mit Einladungen, geteilten Kalendern, Pro-Kalender-Freigabeverwaltung
- Fehlende API-Methoden (getInvitations, getSharedWithMe) ergänzt

### 5. Fehlertoleranz bei Cross-App-Integration — ✅ Implementiert

- ServiceStatusBanner-Komponente für graceful degradation
- In Hauptseite integriert für Todo- und Birthday-Services
- Warnung bei nicht erreichbarem Service mit Retry-Button
- Nutzt bestehende serviceAvailable-Flags der Stores

### 6. Suche sehr basic — Priorität: Niedrig

Nur Query + Event-ID-Matching für Highlighting. Keine Volltextsuche, keine Filter.

### 7. Mobile Experience — Priorität: Niedrig

Web-App ist responsive, aber nicht touch-optimiert. Keine dedizierte Mobile-App (Expo leer).
