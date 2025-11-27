# Manadeck - Nächste Implementierungsschritte

## 🎯 Aktueller Status

✅ **Phase 1 abgeschlossen:**

- Authentifizierung funktioniert (Login, Register, Logout)
- Basis UI-Komponenten erstellt
- Navigation mit Tab Bar implementiert
- Deck Store vorbereitet
- Profil-Erstellung bei Registrierung automatisiert

## 📋 Phase 2: Deck Management (Priorität: HOCH)

### 2.1 Deck Liste mit echten Daten

- [ ] Decks aus Datenbank in "Meine Decks" Tab anzeigen
- [ ] Deck-Karten mit tatsächlichen Daten
- [ ] Filter für Favoriten funktionsfähig machen
- [ ] Pull-to-Refresh implementieren
- [ ] Empty State nur wenn wirklich keine Decks vorhanden

### 2.2 Deck Detail View

- [ ] `/deck/[id].tsx` Screen erstellen
- [ ] Deck Informationen anzeigen (Titel, Beschreibung, Tags)
- [ ] Karten-Liste des Decks anzeigen
- [ ] Actions: Bearbeiten, Löschen, Favorit toggle
- [ ] Header mit Cover Image oder Gradient

### 2.3 Deck Bearbeitung

- [ ] `/deck/[id]/edit.tsx` Screen
- [ ] Deck-Informationen updaten
- [ ] Cover Image Upload (Supabase Storage)
- [ ] Tags Management
- [ ] Öffentlich/Privat Toggle

### 2.4 Deck Sharing & Discovery

- [ ] Öffentliche Decks in Explore Tab anzeigen
- [ ] Suche nach öffentlichen Decks
- [ ] Deck kopieren/forken Funktionalität
- [ ] Deck Statistiken (Views, Kopien)

## 📝 Phase 3: Karten-System (Priorität: HOCH)

### 3.1 Card CRUD Operationen

- [ ] Card Store erstellen (`cardStore.ts`)
- [ ] Karten zu Deck hinzufügen
- [ ] Karten bearbeiten/löschen
- [ ] Karten-Positionen speichern

### 3.2 Card Editor

- [ ] `/card/create.tsx` mit Deck-Kontext
- [ ] `/card/edit/[id].tsx` für Bearbeitung
- [ ] Rich Text Editor für Karten-Content
- [ ] Kartentyp-Auswahl:
  - **Text**: Einfache Textkarte
  - **Flashcard**: Vorder-/Rückseite
  - **Quiz**: Multiple Choice
  - **Mixed**: Kombiniert verschiedene Elemente

### 3.3 Card Management UI

- [ ] Karten-Liste in Deck Detail View
- [ ] Sortierung per Drag & Drop
- [ ] Bulk-Aktionen (Mehrere löschen/verschieben)
- [ ] Karten-Vorschau Modal
- [ ] Favoriten markieren

### 3.4 AI Integration (Optional)

- [ ] AI-Generierung für Karten
- [ ] Prompt-Templates für verschiedene Lernthemen
- [ ] Batch-Generierung mehrerer Karten

## 🎓 Phase 4: Lern-Features (Priorität: MITTEL)

### 4.1 Study Session

- [ ] `/study/session/[deckId].tsx` implementieren
- [ ] Karten-Navigation (Vor/Zurück)
- [ ] Flip-Animation für Flashcards
- [ ] Quiz-Antwort Validierung
- [ ] Session-Timer

### 4.2 Lernmodi

- [ ] **Browse Mode**: Einfaches Durchblättern
- [ ] **Practice Mode**: Mit Selbstbewertung
- [ ] **Quiz Mode**: Mit Punktzahl
- [ ] **Spaced Repetition**: Algorithmus implementieren

### 4.3 Fortschritts-Tracking

- [ ] Study Store für Lernfortschritt
- [ ] Karten als "gelernt" markieren
- [ ] Schwierigkeitsgrad pro Karte
- [ ] Wiederholungsintervalle berechnen
- [ ] Statistiken speichern (richtig/falsch)

### 4.4 Statistiken & Visualisierung

- [ ] Lernstatistik Dashboard
- [ ] Streak-Counter
- [ ] Fortschritts-Charts
- [ ] Zeitstatistiken
- [ ] Achievements/Badges

## 🔧 Phase 5: Optimierungen (Priorität: NIEDRIG)

### 5.1 Performance

- [ ] Lazy Loading für große Deck-Listen
- [ ] Image Optimization & Caching
- [ ] Offline-Support mit AsyncStorage
- [ ] Optimistische Updates

### 5.2 UX Verbesserungen

- [ ] Swipe-Gesten für Karten
- [ ] Haptic Feedback
- [ ] Sound-Effekte (optional)
- [ ] Dark Mode Support
- [ ] Animations & Transitions

### 5.3 Social Features

- [ ] Benutzerprofile erweitern
- [ ] Deck-Bewertungen
- [ ] Kommentare zu öffentlichen Decks
- [ ] Follower-System
- [ ] Deck-Empfehlungen

## 🚀 Phase 6: Premium Features (Zukunft)

### 6.1 Erweiterte AI Features

- [ ] GPT-4 Integration für bessere Karten
- [ ] Automatische Zusammenfassungen
- [ ] Lernpfad-Generierung
- [ ] Personalisierte Empfehlungen

### 6.2 Kollaboration

- [ ] Gemeinsame Decks
- [ ] Real-time Bearbeitung
- [ ] Gruppen-Lernsessions
- [ ] Lehrer-Schüler Modus

### 6.3 Export & Integration

- [ ] Anki Export/Import
- [ ] PDF Export
- [ ] CSV Import für Bulk-Karten
- [ ] API für Drittanbieter

## 🛠 Technische Schulden

### Refactoring Needs

- [ ] Error Boundaries hinzufügen
- [ ] Loading States vereinheitlichen
- [ ] Form Validation Library (react-hook-form)
- [ ] Tests schreiben (Jest + React Testing Library)

### Infrastructure

- [ ] CI/CD Pipeline setup
- [ ] Error Tracking (Sentry)
- [ ] Analytics Integration
- [ ] Performance Monitoring

## 📊 Priorisierung

### Sofort (Diese Woche)

1. Deck Liste mit echten Daten
2. Deck Detail View
3. Basis Card CRUD

### Kurzfristig (2-3 Wochen)

1. Card Editor mit allen Typen
2. Basis Study Mode
3. Einfaches Fortschritts-Tracking

### Mittelfristig (1-2 Monate)

1. Spaced Repetition
2. Statistiken Dashboard
3. Öffentliche Decks & Suche

### Langfristig (3+ Monate)

1. AI Features
2. Social Features
3. Premium Funktionen

## 🎯 MVP Definition

**Minimum Viable Product beinhaltet:**

- ✅ User Auth (FERTIG)
- ⏳ Deck CRUD (IN ARBEIT)
- ⏳ Card CRUD
- ⏳ Basis Study Mode
- ⏳ Einfacher Fortschritt

**Nice-to-have für MVP:**

- Öffentliche Decks
- Basis-Statistiken
- Dark Mode

## 📝 Nächste konkrete Schritte

1. **Deck Liste verbessern** (`app/(tabs)/decks.tsx`)
   - useEffect mit fetchDecks() beim Mount
   - Echte Deck-Daten anzeigen
   - Loading & Error States

2. **Deck Detail Screen** (`app/deck/[id].tsx`)
   - Route Parameter handling
   - Deck Daten laden
   - Card Liste anzeigen

3. **Card Store** (`store/cardStore.ts`)
   - CRUD Operationen
   - Sortierung
   - Relationship zu Decks

4. **Card Components** (`components/card/`)
   - CardEditor
   - CardView
   - CardList

5. **Study Mode Basis** (`app/study/session/[deckId].tsx`)
   - Karten durchblättern
   - Flip Animation
   - Progress tracking
