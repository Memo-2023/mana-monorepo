# Split-View Implementation Plan für iPad & Web

## Übersicht
Implementation einer Apple Notes-ähnlichen Split-View für die Memos-Seite auf iPad und größeren Bildschirmen. Links die Memo-Liste, rechts die Detail-Ansicht.

## Verfügbare Optionen

### Option 1: Responsive Container-Ansatz (Empfohlen) ✅
**Vorteile**: 
- Einfach und schnell umzusetzen
- Nutzt bestehende Komponenten wieder
- Keine Breaking Changes für mobile Ansicht

**Nachteile**: 
- Keine native Split-View Navigation
- URL bleibt auf /memos statt /memos/[id]

**Umsetzung**: 
- Conditional Rendering basierend auf `useResponsive()` Hook
- Flexbox Layout mit zwei Spalten
- Memo-Liste links (40%), Detail rechts (60%)
- State-basierte Navigation statt Router

### Option 2: Expo Router Groups mit Parallel Routes
**Vorteile**: 
- Native Router-Integration
- Deep-Linking Support
- URLs spiegeln aktuelle Ansicht wider

**Nachteile**: 
- Komplexer, mehr Refactoring nötig
- Potenzielle Breaking Changes
- Mehr Testing erforderlich

**Umsetzung**: 
- Neue Route-Gruppe `(split)` für Tablet/Desktop
- Parallel Routes für Liste und Detail
- Platform-basiertes Routing
- Conditional exports je nach Bildschirmgröße

### Option 3: Custom Navigation Container
**Vorteile**: 
- Volle Kontrolle über Navigation
- Optimale Performance
- Maximale Flexibilität

**Nachteile**: 
- Sehr aufwändig
- Eigene Navigation-Logic nötig
- Wartungsintensiv

**Umsetzung**:
- Eigener SplitViewController
- State Management für aktives Memo
- Custom Navigation Handling
- Eigene Gesture-Handler

## Implementierungsschritte (Option 1)

### 1. Responsive Layout Component erstellen
```typescript
// components/containers/SplitViewContainer.tsx
- Layout-Logik für Split-View
- Nutzt useResponsive() für Breakpoint-Detection
- Conditional Rendering je nach Bildschirmgröße
- Props: leftPanel, rightPanel, showSplit
```

### 2. Embedded MemoDetail Component
```typescript
// components/organisms/MemoDetailEmbedded.tsx
- Variante der Memo-Detail-Seite als Component
- Akzeptiert memoId als Prop
- Eigenes Loading/Error Handling
- Keine Router-Navigation
```

### 3. Memos-Seite anpassen
```typescript
// app/(protected)/(tabs)/memos.tsx
- Split-View Modus erkennen mit useResponsive()
- selectedMemoId State hinzufügen
- MemoList onMemoPress Handler anpassen
- SplitViewContainer einbinden
```

### 4. State Management
- `selectedMemoId` in memos.tsx verwalten
- Bei Klick auf Memo:
  - Mobile: router.push()
  - Tablet/Desktop: setSelectedMemoId()
- Sync mit URL optional über searchParams

### 5. Navigation anpassen
- Back-Button nur auf Mobile
- ESC-Taste zum Schließen auf Desktop
- Swipe-Gesten auf Tablet
- Keyboard-Navigation (Arrow Keys)

### 6. UI Optimierungen
- Selektion-Highlighting in Liste
- Responsive Padding/Margins
- Smooth Transitions
- Loading States
- Empty States

## Technische Details

### Breakpoints
- **Mobile**: < 768px (normale Navigation)
- **Tablet**: ≥ 768px (Split-View)
- **Desktop**: ≥ 1024px (Split-View mit mehr Platz)
- **Wide**: ≥ 1440px (optimierte Breiten)

### Layout-Verhältnisse
- **Standard**: 40% Liste / 60% Detail
- **Kompakt**: 35% Liste / 65% Detail
- **Wide**: 30% Liste / 70% Detail

### Mindestbreiten
- **Liste**: min. 320px
- **Detail**: min. 480px
- **Gesamt**: min. 800px für Split-View

### State Management
```typescript
interface SplitViewState {
  selectedMemoId: string | null;
  isDetailOpen: boolean;
  splitRatio: number;
}
```

## Implementierungs-Reihenfolge

1. **Phase 1: Grundgerüst**
   - SplitViewContainer Component
   - useResponsive Hook erweitern
   - Basic Layout Test

2. **Phase 2: Integration**
   - MemoDetailEmbedded Component
   - Memos.tsx anpassen
   - State Management

3. **Phase 3: Navigation**
   - Conditional Navigation Logic
   - Keyboard Support
   - Touch/Swipe Gesten

4. **Phase 4: Polish**
   - Animationen
   - Loading States
   - Error Boundaries
   - Performance Optimierung

## Offene Fragen

1. **URL-Sync**: Soll die URL den ausgewählten Memo widerspiegeln?
2. **Persistenz**: Soll die Auswahl beim Reload erhalten bleiben?
3. **Gesten**: Welche Touch-Gesten sollen unterstützt werden?
4. **Resize**: Soll der User die Split-Ratio anpassen können?
5. **Master-Detail**: Soll auf Tablet im Portrait-Modus ein Overlay verwendet werden?

## Performance-Überlegungen

- Lazy Loading für MemoDetail
- Virtualisierung der Memo-Liste beibehalten
- Memoization für expensive Berechnungen
- Debounced Resize-Handler
- Optimistic UI Updates

## Testing-Strategie

1. **Unit Tests**
   - SplitViewContainer Logic
   - Responsive Hook
   - State Management

2. **Integration Tests**
   - Navigation Flow
   - Data Loading
   - Error Handling

3. **E2E Tests**
   - Mobile Navigation
   - Tablet Split-View
   - Desktop Keyboard Nav

4. **Manual Testing**
   - iPad (verschiedene Modelle)
   - Web (verschiedene Browser)
   - Resize-Verhalten
   - Orientation Changes