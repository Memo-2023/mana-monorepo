# Phase 3: Karten-System - Detaillierter Implementierungsplan

## 🎯 Ziel von Phase 3
Ein vollständiges Karten-Management-System mit verschiedenen Kartentypen, Editor-Funktionalität und intuitive Benutzeroberfläche.

## 📋 Phase 3.1: Card Store & Datenmodell (Priorität: HOCH)

### Card Store erstellen (`store/cardStore.ts`)
```typescript
interface Card {
  id: string;
  deck_id: string;
  position: number;
  title?: string;
  content: CardContent; // JSON für verschiedene Kartentypen
  card_type: 'text' | 'flashcard' | 'quiz' | 'mixed';
  ai_model?: string;
  ai_prompt?: string;
  version: number;
  is_favorite: boolean;
  created_at: string;
  updated_at: string;
}
```

### CRUD Operationen
- [x] `fetchCards(deckId)` - Alle Karten eines Decks laden
- [x] `fetchCard(id)` - Einzelne Karte laden
- [x] `createCard(deckId, cardData)` - Neue Karte erstellen
- [x] `updateCard(id, updates)` - Karte bearbeiten
- [x] `deleteCard(id)` - Karte löschen
- [x] `reorderCards(deckId, cardIds[])` - Reihenfolge ändern
- [x] `duplicateCard(id)` - Karte duplizieren
- [x] `toggleFavorite(id)` - Favorit markieren

### Content-Strukturen für verschiedene Kartentypen
```typescript
// Text Card
interface TextContent {
  text: string;
  formatting?: FormattingOptions;
}

// Flashcard
interface FlashcardContent {
  front: string;
  back: string;
  hint?: string;
}

// Quiz Card
interface QuizContent {
  question: string;
  options: string[];
  correct_answer: number;
  explanation?: string;
}

// Mixed Card
interface MixedContent {
  blocks: ContentBlock[];
}

type ContentBlock = 
  | { type: 'text'; data: { text: string } }
  | { type: 'image'; data: { url: string; caption?: string } }
  | { type: 'quiz'; data: QuizContent }
  | { type: 'flashcard'; data: FlashcardContent };
```

## 📝 Phase 3.2: Card Create Screen (Priorität: HOCH)

### Screen: `/card/create.tsx`
- **Query Parameter**: `deckId` (aus Deck Detail View)
- **Kartentyp-Auswahl**: Radio/Segmented Control
- **Dynamischer Editor**: Je nach Kartentyp
- **Vorschau-Modus**: Live-Preview der Karte
- **Speichern & Fortfahren**: Direkt nächste Karte erstellen

### UI-Flow
1. **Kartentyp wählen** (Text, Flashcard, Quiz, Mixed)
2. **Content eingeben** (je nach Typ unterschiedliche Felder)
3. **Vorschau anzeigen** (wie Karte später aussieht)
4. **Speichern** oder **Speichern & Neue erstellen**

### Kartentyp-spezifische Eingaben

#### Text Card
- **Titel** (optional)
- **Rich Text Editor** für Hauptinhalt
- **Formatting**: Bold, Italic, Listen, Links

#### Flashcard
- **Vorderseite** (Frage/Begriff)
- **Rückseite** (Antwort/Definition)
- **Hinweis** (optional)
- **Beide Seiten**: Rich Text Support

#### Quiz Card
- **Frage**
- **2-6 Antwortoptionen** (dynamisch hinzufügbar)
- **Richtige Antwort markieren**
- **Erklärung** (optional, nach Antwort gezeigt)

#### Mixed Card (Erweitert)
- **Block-basierter Editor**
- **Drag & Drop** für Reihenfolge
- **Verschiedene Block-Typen**: Text, Bild, Quiz, Flashcard

## 🔧 Phase 3.3: Card Edit Screen (Priorität: HOCH)

### Screen: `/card/edit/[id].tsx`
- **Bestehende Daten laden** und vorausfüllen
- **Kartentyp ändern** (mit Warnung vor Datenverlust)
- **Versionierung**: Änderungen tracken
- **Autosave**: Entwürfe automatisch speichern

### Features
- **Änderungshistorie** anzeigen
- **Rückgängig/Wiederholen** Funktionalität
- **Kollaboration** (für später): Wer hat was geändert

## 📱 Phase 3.4: Card Liste in Deck Detail View (Priorität: HOCH)

### Integration in `/deck/[id].tsx`
```typescript
// Ersetze "Karten-Anzeige kommt in Phase 3" mit:
<CardList 
  deckId={currentDeck.id}
  isCompact={true}
  showActions={false}
  limit={5}
/>
<TouchableOpacity onPress={() => router.push(`/deck/${id}/cards`)}>
  <Text>Alle {currentDeck.card_count} Karten anzeigen</Text>
</TouchableOpacity>
```

### CardList Komponente (`components/card/CardList.tsx`)
- **Virtualisierte Liste** für Performance
- **Kompakte Ansicht** vs **Detailansicht**
- **Sortierung**: Position, Erstellung, Alphabet, Typ
- **Filter**: Nach Kartentyp, Favoriten, Lernstatus
- **Swipe-Aktionen**: Bearbeiten, Löschen, Favorit

### Card Item Komponente
```typescript
<CardItem 
  card={card}
  isCompact={true}
  onPress={() => router.push(`/card/${card.id}`)}
  onEdit={() => router.push(`/card/edit/${card.id}`)}
  onDelete={() => handleDelete(card.id)}
  onToggleFavorite={() => toggleFavorite(card.id)}
/>
```

## 🎨 Phase 3.5: Card View Komponente (Priorität: MITTEL)

### Komponente: `components/card/CardView.tsx`
- **Multi-Mode Support**: 
  - `view`: Nur anzeigen
  - `study`: Für Lernsessions
  - `edit`: Inline-Bearbeitung
  - `preview`: Während Erstellung

### Kartentyp-spezifische Renderer
```typescript
const CardRenderer = ({ card, mode }) => {
  switch(card.card_type) {
    case 'text':
      return <TextCardView content={card.content} mode={mode} />;
    case 'flashcard':
      return <FlashcardView content={card.content} mode={mode} />;
    case 'quiz':
      return <QuizCardView content={card.content} mode={mode} />;
    case 'mixed':
      return <MixedCardView content={card.content} mode={mode} />;
  }
};
```

### Interaktivität
- **Flashcard**: Flip-Animation
- **Quiz**: Antworten auswählen + Feedback
- **Text**: Scrolling für lange Inhalte
- **Mixed**: Verschiedene Interaktionen je Block

## 🛠 Phase 3.6: Card Management Screen (Priorität: NIEDRIG)

### Screen: `/deck/[id]/cards.tsx`
- **Vollständige Kartenliste** des Decks
- **Bulk-Aktionen**: Mehrere Karten auswählen
- **Drag & Drop Sortierung**
- **Export/Import** Funktionen
- **Erweiterte Filter** und Suche

### Bulk-Aktionen
- **Mehrfach-Auswahl**: Checkboxes
- **Löschen**: Mehrere Karten auf einmal
- **Verschieben**: In anderes Deck
- **Duplizieren**: Kopien erstellen
- **Favoriten**: Mehrere markieren
- **Export**: Als CSV/JSON

### Sortierung & Filter
- **Drag & Drop**: Position manuell ändern
- **Auto-Sort**: Nach Alphabet, Datum, Typ
- **Filter**: 
  - Kartentyp (Text, Flashcard, Quiz, Mixed)
  - Status (Favoriten, Kürzlich bearbeitet)
  - Lernfortschritt (Gelernt, Schwierig, Neu)

## 🎨 UI/UX Komponenten-Plan

### 1. Rich Text Editor (`components/ui/RichTextEditor.tsx`)
```typescript
<RichTextEditor
  value={content}
  onChange={setContent}
  toolbar={['bold', 'italic', 'list', 'link']}
  placeholder="Gib deinen Text ein..."
  maxLength={1000}
/>
```

### 2. Card Type Selector (`components/card/CardTypeSelector.tsx`)
```typescript
<CardTypeSelector
  selectedType={cardType}
  onTypeChange={setCardType}
  showDescriptions={true}
/>
```

### 3. Quiz Option Builder (`components/card/QuizOptionBuilder.tsx`)
```typescript
<QuizOptionBuilder
  options={options}
  correctAnswer={correctAnswer}
  onOptionsChange={setOptions}
  onCorrectAnswerChange={setCorrectAnswer}
  minOptions={2}
  maxOptions={6}
/>
```

### 4. Card Preview (`components/card/CardPreview.tsx`)
```typescript
<CardPreview
  card={previewCard}
  mode="preview"
  showFlipButton={cardType === 'flashcard'}
/>
```

## 📊 Datenbank-Optimierungen

### Indizes für Performance
```sql
-- Index für schnelle Deck-Card Abfragen
CREATE INDEX cards_deck_id_position_idx ON cards(deck_id, position);

-- Index für Kartentyp-Filter
CREATE INDEX cards_deck_type_idx ON cards(deck_id, card_type);

-- Index für Favoriten
CREATE INDEX cards_favorite_idx ON cards(deck_id) WHERE is_favorite = true;
```

### Trigger für Auto-Position
```sql
-- Automatische Position-Zuweisung bei INSERT
CREATE OR REPLACE FUNCTION set_card_position()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.position IS NULL THEN
    NEW.position := COALESCE(
      (SELECT MAX(position) + 1 FROM cards WHERE deck_id = NEW.deck_id),
      1
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_card_position_trigger
  BEFORE INSERT ON cards
  FOR EACH ROW
  EXECUTE FUNCTION set_card_position();
```

## 🧪 Testing-Strategie

### Unit Tests
- [ ] Card Store CRUD Operationen
- [ ] Card Content Validierung
- [ ] Kartentyp-spezifische Renderer

### Integration Tests
- [ ] Card Create Flow (alle Typen)
- [ ] Card Edit Flow
- [ ] Bulk-Aktionen
- [ ] Sortierung & Filter

### E2E Tests
- [ ] Vollständiger Card-Lifecycle
- [ ] Deck → Card → Study Flow
- [ ] Performance mit vielen Karten

## ⚡ Performance-Überlegungen

### Optimierungen
1. **Virtualized Lists**: Für große Kartenmengen
2. **Lazy Loading**: Karten-Content nur bei Bedarf
3. **Image Optimization**: Automatische Komprimierung
4. **Debounced Search**: Verzögerte Suche bei Eingabe
5. **Caching**: Häufig genutzte Karten im Memory

### Bundle Size
- **Code Splitting**: Rich Text Editor nur bei Bedarf laden
- **Tree Shaking**: Ungenutzte Kartentyp-Komponenten entfernen

## 🚀 Nächste konkrete Schritte

### Sofort starten (Diese Woche)
1. **Card Store** erstellen (`store/cardStore.ts`)
2. **Basic Card Create Screen** (`/card/create.tsx`)
3. **Einfache Card View** für Text-Karten
4. **Card Liste** in Deck Detail einbauen

### Kurzfristig (1-2 Wochen)
1. **Flashcard Support** hinzufügen
2. **Quiz Card** implementieren
3. **Card Edit Screen** erstellen
4. **Basis Card Management**

### Mittelfristig (2-3 Wochen)
1. **Rich Text Editor** integrieren
2. **Mixed Cards** (Block-Editor)
3. **Drag & Drop Sortierung**
4. **Bulk-Aktionen**

## 💡 Nice-to-Have Features (Zukunft)

### AI Integration
- **Auto-Generierung**: Flashcards aus Text
- **Quiz-Generierung**: Fragen automatisch erstellen
- **Content-Verbesserung**: Grammatik & Stil-Tipps

### Kollaboration
- **Gemeinsame Bearbeitung**: Real-time Editing
- **Kommentare**: An Karten anhängen
- **Änderungshistorie**: Wer hat was geändert

### Import/Export
- **Anki Import**: .apkg Dateien
- **CSV Import**: Bulk-Import von Spreadsheets
- **Markdown Export**: Für Dokumentation
- **PDF Export**: Zum Ausdrucken

## 🎯 Erfolgskriterien für Phase 3

✅ **MVP erreicht wenn:**
- Alle 4 Kartentypen erstell- und bearbeitbar
- Karten in Deck Detail View sichtbar
- Basis-Sortierung funktioniert
- Performance mit 100+ Karten

🎖 **Excellent erreicht wenn:**
- Rich Text Editor funktioniert
- Drag & Drop Sortierung
- Bulk-Aktionen verfügbar
- Responsive Design perfekt

---

**Empfehlung**: Starten wir mit Phase 3.1 (Card Store) und 3.2 (Card Create) parallel, da diese die Grundlage für alles andere bilden!