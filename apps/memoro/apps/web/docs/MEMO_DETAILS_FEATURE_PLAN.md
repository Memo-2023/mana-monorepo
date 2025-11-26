# Feature-Vergleich & Implementierungsplan: Memo Details Seite

**Datum:** 2025-11-12
**Autor:** Claude
**Status:** In Planung

---

## 📋 Übersicht

Dieses Dokument vergleicht die Memo Details Seite der Mobile App mit der Web App und definiert einen Implementierungsplan, um Feature-Parität zu erreichen.

---

## ✅ Bereits vorhanden in Web App

Die Web App (`MemoPanel.svelte`) bietet aktuell folgende Features:

1. **Titel & Intro** - Anzeige des Memo-Titels und Intro-Texts
2. **Timestamp** - Anzeige des Erstellungsdatums (relative Zeit)
3. **Duration** - Länge der Aufnahme
4. **Processing Status** - Status-Badge (completed, processing, failed)
5. **Tags** - Anzeige der Tags (nur visuell, nicht interaktiv)
6. **Memories** - AI-generierte Insights mit Accordion-Komponente
7. **Audio Player** - Wiedergabe der Audioaufnahme
8. **Transcript** - Volltexttranskript

---

## ❌ Fehlende Features

Die Mobile App (`apps/mobile/app/(protected)/(memo)/[id].tsx`) bietet deutlich mehr Features:

### 🎯 Phase 1: Kritische Basis-Features (Must-Have)

#### 1. Header/Metadata Erweiterungen

- ⭐ **Pin/Unpin Funktion**
  - Memo anheften für schnellen Zugriff
  - Visueller Pin-Indikator im Header
  - Persistierung in Datenbank

- 📊 **View Count**
  - Anzahl der Aufrufe des Memos
  - Automatische Inkrementierung beim Öffnen
  - Anzeige in Header-Metadaten

- 📝 **Word Count**
  - Anzahl Wörter im Transkript
  - Berechnung aus Transcript-Daten
  - Anzeige in Header-Metadaten

- 🌍 **Location**
  - Ort der Aufnahme (falls vorhanden)
  - GPS-Koordinaten oder Adresse
  - Interaktive Karten-Anzeige (optional)

- 🗣️ **Language**
  - Erkannte Sprache des Transkripts
  - Sprachcode (de, en, etc.)
  - Flag-Icon für visuelle Darstellung

- 👥 **Speaker Count**
  - Anzahl erkannter Sprecher (Diarization)
  - Nur bei aktivierter Speaker-Erkennung
  - Anzeige neben anderen Metadaten

#### 2. Tag Management

- ➕ **Tags hinzufügen**
  - Tag Selector Modal mit Suche
  - Auswahl aus vorhandenen Tags
  - Optimistische UI-Updates

- ❌ **Tags entfernen**
  - Click auf Tag zum Entfernen
  - Bestätigungsdialog (optional)
  - Real-time Sync

- 🎨 **Neue Tags erstellen**
  - Direkt aus dem Tag Selector
  - Farbauswahl für neue Tags
  - Sofortige Verwendbarkeit

#### 3. Wichtige Aktionen

- ✏️ **Edit Mode**
  - Bearbeitung von Titel, Intro, Transcript
  - Inline-Editing oder Modal
  - Save/Cancel Buttons
  - Auto-save mit Debouncing

- 🗑️ **Delete**
  - Memo löschen mit Bestätigung
  - Kaskadierendes Löschen (Memories, Photos, etc.)
  - Undo-Funktion (optional)

- 📋 **Copy Transcript**
  - Transkript in Zwischenablage kopieren
  - Toast-Benachrichtigung bei Erfolg
  - Formatierung erhalten (optional)

- 🔍 **Search**
  - Volltextsuche im Memo (Transcript + Memories)
  - Highlighting der Suchergebnisse
  - Navigation zwischen Treffern
  - Search Overlay mit Input

- 📤 **Share**
  - Share Modal mit Optionen
  - Link teilen (mit Token)
  - Export als Text/PDF
  - Native Share API (Web Share API)

---

### 🚀 Phase 2: Erweiterte Features (Should-Have)

#### 4. Memories & Analysis

- 💭 **Create Memory**
  - Neue AI-Analyse manuell erstellen
  - Blueprint-Auswahl für Analyse-Typ
  - Prompt-Eingabe für spezifische Fragen
  - Loading State während Verarbeitung

- ❓ **Ask Question**
  - Fragen zum Memo-Inhalt stellen
  - Prompt Bar am unteren Bildschirmrand
  - AI-generierte Antwort als neue Memory
  - Mana-Cost Anzeige

- 🔄 **Reprocess**
  - Memo mit neuen Einstellungen neu verarbeiten
  - Blueprint-Wechsel
  - Sprach-Erkennung neu durchführen
  - Recording Date Anpassung

#### 5. Speaker Features

- 🏷️ **Label Speakers**
  - Sprecher benennen (Speaker 1 → "Max Mustermann")
  - Speaker Label Modal
  - Bulk-Umbenennung
  - Persistierung in metadata.speakerLabels

- 👤 **Structured Transcript**
  - Transkript mit Sprecher-Zuordnung
  - Timeline-View mit Sprecherwechseln
  - Farbcodierung pro Sprecher
  - Utterances mit Timestamps

- ✏️ **Speaker Mapping**
  - Sprecher zusammenführen
  - Sprecher-Namen editieren
  - Sprecher-Avatar (optional)

#### 6. Multi-Language & Translation

- 🌐 **Translate**
  - Memo in andere Sprache übersetzen
  - Translation Modal mit Sprachauswahl
  - Erstellt neues Memo (übersetzt)
  - Original-Memo bleibt erhalten

- 🔄 **Replace Word**
  - Wort im Transkript global ersetzen
  - Auch in Memories anwenden
  - Replace Word Modal
  - Undo-Funktion

- 🗣️ **Multi-language Support**
  - Mehrsprachige Transkripte
  - Language Switcher
  - Mehrere Transkript-Versionen

---

### ✨ Phase 3: Premium Features (Nice-to-Have)

#### 7. Media & Attachments

- 📸 **Photo Gallery**
  - Fotos zum Memo hinzufügen
  - Grid-Layout mit Lightbox
  - Zoom und Pan
  - Photo Swipe Navigation

- ➕ **Add Photos**
  - Upload von lokalen Fotos
  - Drag & Drop Support
  - Multiple Upload
  - Progress Indicator

- 🎙️ **Add Recording**
  - Zusätzliche Aufnahme zum Memo hinzufügen
  - Append Recording Modal
  - Automatische Transkription
  - Zusammenführung mit Haupt-Memo

- 📎 **Additional Recordings**
  - Liste aller zusätzlichen Aufnahmen
  - Einzelne Player für jede Aufnahme
  - Status-Anzeige (processing, completed)
  - Kombiniertes Transkript

#### 8. Collaboration & Spaces

- 🏢 **Manage Spaces**
  - Memo zu Spaces zuordnen
  - Space Selector Modal
  - Multi-Space Zuordnung
  - Space-basierte Berechtigungen

- 🔄 **Real-time Updates**
  - Live-Updates via Supabase Realtime
  - Automatisches Reload bei Änderungen
  - Optimistische UI-Updates
  - Conflict Resolution

#### 9. Navigation & UX

- 📑 **Table of Contents**
  - Schnellnavigation zu Sektionen
  - Sticky TOC Sidebar (optional)
  - Smooth Scrolling
  - Active Section Highlighting

- ⌨️ **Keyboard Shortcuts**
  - Tastenkürzel für häufige Aktionen
  - Shortcut Cheatsheet (?)
  - Vim-Mode Support (optional)

---

## 🛠️ Implementierungsplan

### Architektur-Überlegungen

**Komponenten-Struktur:**
```
src/lib/components/memo/
├── MemoPanel.svelte (Hauptkomponente - erweitert)
├── MemoHeader.svelte (Header mit Metadaten)
├── MemoActions.svelte (Action Buttons)
├── MemoMemories.svelte (Memories Sektion)
├── MemoTranscript.svelte (Transcript mit Features)
├── MemoAudio.svelte (Audio Player)
└── modals/
    ├── TagSelectorModal.svelte
    ├── DeleteModal.svelte
    ├── ShareModal.svelte
    ├── SearchOverlay.svelte
    ├── CreateMemoryModal.svelte
    ├── PromptBar.svelte
    ├── TranslateModal.svelte
    ├── ReplaceWordModal.svelte
    ├── SpeakerLabelModal.svelte
    ├── SpaceSelectorModal.svelte
    └── ReprocessModal.svelte
```

**Services:**
```
src/lib/services/
├── memoService.ts (erweitert)
├── memoryService.ts
├── tagService.ts (erweitert)
├── translationService.ts
├── photoService.ts
└── spacesService.ts
```

---

### Schritt 1: Grundlegende Komponenten (2-3 Tage)

**Neue Komponenten:**
- `MemoHeader.svelte` - Erweiterte Header-Komponente mit allen Metadaten
- `MemoActions.svelte` - Action Button Bar (Edit, Delete, Share, etc.)
- `PinButton.svelte` - Pin/Unpin Toggle mit Icon
- `EditModeToolbar.svelte` - Save/Cancel Toolbar für Edit Mode

**Erweiterungen:**
- `MemoPanel.svelte` - Integration der neuen Komponenten
- `memoService.ts` - Neue Methoden: `pinMemo()`, `updateMemo()`, `deleteMemo()`

**Tasks:**
- [ ] MemoHeader mit View Count, Word Count, Location, Language, Speaker Count
- [ ] Pin/Unpin Funktionalität (UI + Backend)
- [ ] Action Bar mit Buttons (Edit, Delete, Share, Copy, Search)
- [ ] Basic Edit Mode (Titel + Intro editieren)

---

### Schritt 2: Tag Management (1-2 Tage)

**Neue Komponenten:**
- `TagSelectorModal.svelte` - Tag Auswahl Modal mit Suche
- `TagManager.svelte` - Tag CRUD Operations Component

**Erweiterungen:**
- `tagService.ts` - Neue Methoden: `addTagToMemo()`, `removeTagFromMemo()`, `createTag()`

**Tasks:**
- [ ] Tag Selector Modal (Design + Logik)
- [ ] Tags hinzufügen/entfernen Funktionalität
- [ ] Neue Tags erstellen (Inline)
- [ ] Optimistische UI-Updates
- [ ] Real-time Tag Sync

---

### Schritt 3: Aktionen & Modals (2-3 Tage)

**Neue Komponenten:**
- `DeleteModal.svelte` - Löschbestätigung mit Warning
- `ShareModal.svelte` - Share-Optionen (Link, Export, Native Share)
- `SearchOverlay.svelte` - Vollbild-Suche mit Highlighting
- `CopyButton.svelte` - Copy-to-Clipboard Button

**Tasks:**
- [ ] Delete Modal mit Bestätigung
- [ ] Share Modal (Link generieren, Export, Web Share API)
- [ ] Search Overlay (UI + Search Logik)
- [ ] Search Highlighting im Transcript
- [ ] Navigation zwischen Suchergebnissen
- [ ] Copy Transcript to Clipboard

---

### Schritt 4: Memories & Questions (2-3 Tage)

**Neue Komponenten:**
- `PromptBar.svelte` - Fragen stellen UI (Bottom Bar)
- `CreateMemoryModal.svelte` - Neue Memory erstellen
- `ReprocessModal.svelte` - Reprocess-Optionen

**Neue Services:**
- `memoryService.ts` - CRUD für Memories

**Tasks:**
- [ ] Prompt Bar UI (Input + Submit)
- [ ] Ask Question API Integration
- [ ] Create Memory Modal (Blueprint-Auswahl)
- [ ] Reprocess Modal (Optionen)
- [ ] Loading States & Mana Cost Anzeige

---

### Schritt 5: Speaker Features (2-3 Tage)

**Neue Komponenten:**
- `StructuredTranscript.svelte` - Transcript mit Speaker-Zuordnung
- `SpeakerLabel.svelte` - Einzelner Speaker mit Avatar
- `SpeakerLabelModal.svelte` - Sprecher benennen/zusammenführen

**Tasks:**
- [ ] Structured Transcript Rendering (Utterances)
- [ ] Speaker Labels anzeigen
- [ ] Speaker Label Modal (Name ändern)
- [ ] Speaker Mapping (Zusammenführen)
- [ ] Farbcodierung pro Sprecher

---

### Schritt 6: Translation & Advanced (2-3 Tage)

**Neue Komponenten:**
- `TranslateModal.svelte` - Übersetzung mit Sprachauswahl
- `ReplaceWordModal.svelte` - Wort ersetzen
- `LanguageSelector.svelte` - Sprach-Dropdown

**Neue Services:**
- `translationService.ts` - Translation API

**Tasks:**
- [ ] Translate Modal (UI + API)
- [ ] Replace Word Modal (Suchen & Ersetzen)
- [ ] Multi-language Support
- [ ] Language Switcher

---

### Schritt 7: Media & Attachments (3-4 Tage)

**Neue Komponenten:**
- `PhotoGallery.svelte` - Grid-Layout mit Lightbox
- `PhotoUpload.svelte` - Upload UI mit Drag & Drop
- `AdditionalRecordings.svelte` - Liste zusätzlicher Aufnahmen

**Neue Services:**
- `photoService.ts` - Photo Upload & Management

**Tasks:**
- [ ] Photo Gallery Component (Grid + Lightbox)
- [ ] Photo Upload (Drag & Drop)
- [ ] Multiple Photos unterstützen
- [ ] Additional Recordings anzeigen
- [ ] Add Recording Funktionalität

---

### Schritt 8: Spaces & Real-time (2-3 Tage)

**Neue Komponenten:**
- `SpaceSelectorModal.svelte` - Space Auswahl
- `SpaceManager.svelte` - Space Zuordnung

**Neue Services:**
- `spacesService.ts` - Space Management

**Tasks:**
- [ ] Space Selector Modal
- [ ] Memo zu Spaces zuordnen
- [ ] Supabase Realtime Subscriptions
- [ ] Optimistische Updates
- [ ] Conflict Resolution

---

### Schritt 9: Navigation & Polish (1-2 Tage)

**Neue Komponenten:**
- `TableOfContents.svelte` - TOC für Memo-Sektionen
- `KeyboardShortcuts.svelte` - Shortcut Cheatsheet

**Tasks:**
- [ ] Table of Contents (Sticky Sidebar)
- [ ] Smooth Scrolling zu Sektionen
- [ ] Keyboard Shortcuts implementieren
- [ ] Animations & Transitions
- [ ] Loading States verbessern
- [ ] Error Handling & Toasts

---

## 📊 Zeitaufwand & Priorisierung

### Gesamtaufwand

| Phase | Beschreibung | Dauer | Priorität |
|-------|-------------|-------|-----------|
| **Phase 1** | Basis-Features (Header, Tags, Actions) | 7-10 Tage | Must-Have |
| **Phase 2** | Erweiterte Features (Memories, Speakers, Translation) | 6-9 Tage | Should-Have |
| **Phase 3** | Premium Features (Media, Spaces, Navigation) | 6-9 Tage | Nice-to-Have |
| **Gesamt** | Vollständige Feature-Parität | **19-28 Tage** | - |

### Empfohlene Priorisierung

**Woche 1-2: Phase 1 (Must-Have)**
- Grundlegende Funktionen, die für tägliche Nutzung essentiell sind
- Pin/Unpin, Edit, Delete, Tag Management, Share, Search

**Woche 3-4: Phase 2 (Should-Have)**
- Erweiterte AI-Features und Advanced Editing
- Memories, Questions, Speakers, Translation

**Woche 5-6: Phase 3 (Nice-to-Have)**
- Premium Features für Power-User
- Photos, Spaces, Advanced Navigation

---

## 🎯 Nächste Schritte

1. **Review & Approval** - Team-Review dieses Plans
2. **Design** - UI/UX Mockups für neue Komponenten
3. **Sprint Planning** - Aufgaben in Sprints aufteilen
4. **Implementation** - Schrittweise Umsetzung nach Plan
5. **Testing** - Feature-Tests während Entwicklung
6. **Deployment** - Rollout in Staging → Production

---

## 📝 Notizen & Überlegungen

### Mobile vs. Web Unterschiede

- **Prompt Bar:** In Mobile App am unteren Bildschirmrand, könnte in Web auch als Modal funktionieren
- **Bottom Bar:** Mobile App nutzt Bottom Bar für Actions, Web könnte Toolbar oder Context Menu nutzen
- **Table of Contents:** In Mobile als Modal/Overlay, in Web als Sidebar möglich
- **Edit Mode:** Mobile nutzt Inline-Editing, Web könnte Modal bevorzugen (UX-Decision)

### Performance-Überlegungen

- **Real-time Updates:** Nur subscriben wenn Tab aktiv
- **Photo Gallery:** Lazy Loading und Thumbnails
- **Search:** Debouncing und Index-basierte Suche
- **Speaker Transcript:** Virtualisierung bei sehr langen Transkripten

### Accessibility

- **Keyboard Navigation:** Alle Modals und Actions per Keyboard erreichbar
- **Screen Reader:** ARIA Labels für alle interaktiven Elemente
- **Color Contrast:** WCAG AA Standard einhalten
- **Focus Management:** Logical Tab Order

---

## 🔗 Referenzen

- **Mobile App Code:** `apps/mobile/app/(protected)/(memo)/[id].tsx`
- **Web App Code:** `apps/web/src/lib/components/MemoPanel.svelte`
- **Design System:** Siehe `apps/web/src/lib/styles/` (Tailwind Config)
- **API Docs:** Siehe `CLAUDE.md` für Backend-Schema

---

**Version:** 1.0
**Letzte Aktualisierung:** 2025-11-12
**Status:** ✅ Genehmigt / 🔄 In Review / ❌ Abgelehnt
