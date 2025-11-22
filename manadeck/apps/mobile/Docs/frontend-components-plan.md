# Manadeck Frontend-Komponenten Plan

## Architektur-Übersicht

### Tech Stack
- **Framework**: React Native mit Expo
- **Navigation**: Expo Router (File-based routing)
- **Styling**: NativeWind (Tailwind CSS für React Native)
- **State Management**: Zustand
- **Backend**: Supabase (Auth, Database, Storage)
- **TypeScript**: Für Type Safety

## Navigation Struktur

```
app/
├── (auth)/                 # Auth Stack (Nicht eingeloggt)
│   ├── _layout.tsx         # Auth Layout
│   ├── login.tsx           # Login Screen
│   ├── register.tsx        # Registrierung
│   └── forgot-password.tsx # Passwort zurücksetzen
│
├── (tabs)/                 # Hauptnavigation (Tab Bar)
│   ├── _layout.tsx         # Tab Layout
│   ├── home.tsx           # Home/Dashboard
│   ├── decks.tsx          # Meine Decks
│   ├── explore.tsx        # Öffentliche Decks entdecken
│   ├── learn.tsx          # Aktives Lernen
│   └── profile.tsx        # Profil & Einstellungen
│
├── deck/
│   ├── [id].tsx           # Deck Detail View
│   ├── [id]/
│   │   ├── edit.tsx       # Deck bearbeiten
│   │   ├── cards.tsx      # Karten verwalten
│   │   └── study.tsx      # Lernmodus starten
│   └── create.tsx         # Neues Deck erstellen
│
├── card/
│   ├── [id].tsx           # Karte Detail View
│   ├── create.tsx         # Neue Karte erstellen
│   └── edit/[id].tsx      # Karte bearbeiten
│
├── study/
│   ├── session/[deckId].tsx  # Aktive Lernsession
│   ├── results.tsx           # Lernergebnisse
│   └── settings.tsx          # Lerneinstellungen
│
└── _layout.tsx            # Root Layout
```

## Core Komponenten

### 1. Authentifizierung

#### AuthForm
```typescript
components/auth/AuthForm.tsx
- E-Mail/Passwort Eingabe
- Social Login Buttons
- Validierung
- Loading States
```

#### AuthGuard
```typescript
components/auth/AuthGuard.tsx
- Schützt Routen
- Redirect zu Login
- Session Check
```

### 2. Layout Komponenten

#### AppHeader
```typescript
components/layout/AppHeader.tsx
- Titel
- Navigation Back Button
- Action Buttons
- Search Bar (optional)
```

#### TabBar
```typescript
components/layout/TabBar.tsx
- Custom Tab Bar
- Icons mit Badges
- Aktive Tab Animation
```

#### FloatingActionButton
```typescript
components/layout/FloatingActionButton.tsx
- Schnellzugriff (Deck/Karte erstellen)
- Animierte Menü-Expansion
```

### 3. Deck Komponenten

#### DeckCard
```typescript
components/deck/DeckCard.tsx
Props:
- deck: Deck
- onPress: () => void
- showProgress?: boolean
- isCompact?: boolean

Features:
- Cover Image
- Titel & Beschreibung
- Tags
- Karten-Anzahl
- Lernfortschritt (optional)
- Public/Private Badge
```

#### DeckGrid
```typescript
components/deck/DeckGrid.tsx
- Responsive Grid Layout
- Lazy Loading
- Pull-to-Refresh
- Empty State
```

#### DeckForm
```typescript
components/deck/DeckForm.tsx
- Titel, Beschreibung
- Cover Image Upload
- Tag-Auswahl
- Öffentlich/Privat Toggle
- Erweiterte Einstellungen
```

#### DeckFilters
```typescript
components/deck/DeckFilters.tsx
- Sortierung (Datum, Name, Fortschritt)
- Filter (Tags, Öffentlich, Favoriten)
- Suchleiste
```

### 4. Karten Komponenten

#### CardView
```typescript
components/card/CardView.tsx
Props:
- card: Card
- mode: 'view' | 'study' | 'edit'
- onFlip?: () => void
- showAnswer?: boolean

Unterstützt verschiedene Kartentypen:
- Text
- Flashcard (Vorder-/Rückseite)
- Quiz (Multiple Choice)
- Mixed (Rich Content)
```

#### CardEditor
```typescript
components/card/CardEditor.tsx
- Rich Text Editor
- Markdown Support
- Bild/Media Upload
- AI-Generierung
- Kartentyp-Auswahl
```

#### CardList
```typescript
components/card/CardList.tsx
- Sortierbare Liste
- Drag & Drop
- Batch-Aktionen
- Suche/Filter
```

#### CardSwiper
```typescript
components/card/CardSwiper.tsx
- Swipe-Gesten (Links/Rechts)
- Karten-Stack Animation
- Progress Indicator
```

### 5. Lern-Komponenten

#### StudySession
```typescript
components/study/StudySession.tsx
- Kartenansicht
- Antwort-Eingabe
- Bewertung (Einfach/Schwer)
- Timer
- Fortschrittsanzeige
```

#### ProgressTracker
```typescript
components/study/ProgressTracker.tsx
- Lernstatistiken
- Streak-Anzeige
- Charts/Graphs
- Achievements
```

#### StudyModeSelector
```typescript
components/study/StudyModeSelector.tsx
Modi:
- Durchblättern
- Quiz
- Schreiben
- Spaced Repetition
```

### 6. Profil Komponenten

#### ProfileHeader
```typescript
components/profile/ProfileHeader.tsx
- Avatar
- Username/Display Name
- Bio
- Statistiken
- Edit Button
```

#### ProfileStats
```typescript
components/profile/ProfileStats.tsx
- Anzahl Decks
- Gelernte Karten
- Lernstreak
- Achievements
```

#### SettingsMenu
```typescript
components/profile/SettingsMenu.tsx
- Account-Einstellungen
- Benachrichtigungen
- Datenschutz
- App-Präferenzen
- Logout
```

### 7. Gemeinsame UI Komponenten

#### Button
```typescript
components/ui/Button.tsx
Varianten:
- primary, secondary, outline, ghost
- Größen: sm, md, lg
- Loading State
- Icons
```

#### Card
```typescript
components/ui/Card.tsx
- Container mit Shadow
- Padding Varianten
- Press Animation
```

#### Input
```typescript
components/ui/Input.tsx
- Text, Email, Password
- Label & Error
- Icons
- Clear Button
```

#### Modal
```typescript
components/ui/Modal.tsx
- Fullscreen oder Bottom Sheet
- Backdrop
- Swipe to Dismiss
```

#### Toast
```typescript
components/ui/Toast.tsx
- Success, Error, Info, Warning
- Auto-Dismiss
- Actions
```

#### EmptyState
```typescript
components/ui/EmptyState.tsx
- Illustration
- Titel & Beschreibung
- Action Button
```

#### LoadingSpinner
```typescript
components/ui/LoadingSpinner.tsx
- Verschiedene Größen
- Mit/ohne Text
- Overlay Option
```

#### SearchBar
```typescript
components/ui/SearchBar.tsx
- Debounced Input
- Clear Button
- Voice Input (optional)
```

## State Management (Zustand Stores)

### authStore
```typescript
store/authStore.ts
- user: User | null
- session: Session | null
- isLoading: boolean
- login(), logout(), register()
- updateProfile()
```

### deckStore
```typescript
store/deckStore.ts
- decks: Deck[]
- currentDeck: Deck | null
- isLoading: boolean
- fetchDecks(), createDeck(), updateDeck()
- deleteDeck(), toggleFavorite()
```

### cardStore
```typescript
store/cardStore.ts
- cards: Card[]
- currentCard: Card | null
- fetchCards(), createCard(), updateCard()
- deleteCard(), reorderCards()
```

### studyStore
```typescript
store/studyStore.ts
- activeSession: StudySession | null
- progress: Progress
- startSession(), endSession()
- submitAnswer(), nextCard()
- updateStatistics()
```

### uiStore
```typescript
store/uiStore.ts
- theme: 'light' | 'dark' | 'system'
- language: string
- notifications: boolean
- setTheme(), setLanguage()
```

## Utility Hooks

### useSupabase
```typescript
hooks/useSupabase.ts
- Wrapped Supabase Client
- Auto-Refresh Token
- Error Handling
```

### useAuth
```typescript
hooks/useAuth.ts
- Auth State
- Login/Logout Methods
- Session Management
```

### useOffline
```typescript
hooks/useOffline.ts
- Offline Detection
- Queue Actions
- Sync when Online
```

### useDebounce
```typescript
hooks/useDebounce.ts
- Debounced Values
- Für Suche/Filter
```

### useInfiniteScroll
```typescript
hooks/useInfiniteScroll.ts
- Pagination
- Load More
- Refresh
```

## Styling System

### Theme Configuration
```typescript
theme/
├── colors.ts      # Farbpalette
├── spacing.ts     # Spacing Scale
├── typography.ts  # Font Sizes & Weights
└── shadows.ts     # Shadow Presets
```

### NativeWind Classes
```css
/* Basis-Komponenten nutzen */
- Container: "flex-1 bg-white dark:bg-gray-900"
- Card: "bg-white dark:bg-gray-800 rounded-xl shadow-md p-4"
- Button: "bg-blue-500 px-4 py-2 rounded-lg"
- Text: "text-gray-900 dark:text-gray-100"
```

## Performance Optimierungen

1. **Lazy Loading**
   - React.lazy() für Screens
   - Virtualisierte Listen (FlashList)
   - Image Lazy Loading

2. **Caching**
   - React Query für API Calls
   - AsyncStorage für Offline-Daten
   - Image Cache

3. **Optimierte Renders**
   - React.memo für schwere Komponenten
   - useMemo/useCallback
   - Zustand Selectors

4. **Bundle Size**
   - Code Splitting
   - Tree Shaking
   - Asset Optimization

## Accessibility

- **Screen Reader Support**
- **Keyboard Navigation** (Web)
- **Touch Target Sizes** (min. 44x44)
- **Color Contrast** (WCAG AA)
- **Focus Indicators**
- **Semantic Labels**

## Testing Strategie

1. **Unit Tests**: Jest + React Testing Library
2. **Integration Tests**: Detox
3. **E2E Tests**: Maestro
4. **Visual Regression**: Percy

## Nächste Schritte

1. **Phase 1: Core Setup**
   - Auth Flow implementieren
   - Navigation Setup
   - Basis UI Komponenten

2. **Phase 2: Deck Management**
   - Deck CRUD Operationen
   - Deck Liste & Detail Views
   - Deck Sharing

3. **Phase 3: Karten System**
   - Karten Editor
   - Verschiedene Kartentypen
   - Drag & Drop Sortierung

4. **Phase 4: Lern-Features**
   - Study Session
   - Fortschritts-Tracking
   - Spaced Repetition

5. **Phase 5: Social Features**
   - Öffentliche Decks
   - Bewertungen
   - Kommentare

6. **Phase 6: Premium Features**
   - AI-Generierung
   - Erweiterte Statistiken
   - Offline Sync