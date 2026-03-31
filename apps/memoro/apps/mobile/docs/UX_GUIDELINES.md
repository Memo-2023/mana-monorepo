# UX-Richtlinien / UX Guidelines

Dieses Dokument definiert die UX-Prinzipien und Patterns der Memoro App.

## 1. Globale Navigation

### HeaderMenu (Globales Navigationsmenü)

Das HeaderMenu ist das zentrale Navigationselement der App. Es erscheint als pill-förmiger Button oben rechts im Header mit dem Label "MENU" und einem Hamburger-Icon.

**Regel: Das HeaderMenu MUSS auf JEDER Seite sichtbar sein.**

Dies umfasst:
- Hauptseiten (Home, Memos)
- Alle Unterseiten (Settings, Tags, Statistics, Blueprints, etc.)
- Detailseiten (Memo-Detail, Space-Detail)
- Erstellungs-/Bearbeitungsseiten (Create Blueprint, Prompts)

**Warum:** Das HeaderMenu dient als allgegenwärtiges, verlässliches Navigationsmittel. Nutzer sollen von jeder Stelle in der App schnell zu wichtigen Bereichen navigieren können, ohne erst zurück navigieren zu müssen.

**Technische Umsetzung:**
- Jede Seite muss in ihrer `updateConfig()` den Wert `showMenu: true` setzen
- Die `shouldShowMenu`-Logik in `Header.tsx` darf keine seitenspezifischen Ausnahmen enthalten
- Das HeaderMenu wird neben seitenspezifischen Icons (z.B. SubscriptionMenu, Edit/Delete-Buttons) angezeigt, nicht anstelle davon

**Komponenten:**
- `HeaderMenu.tsx` (`features/menus/HeaderMenu.tsx`) - Globales Menü
- `Header.tsx` (`features/menus/Header.tsx`) - Header-Komponente, rendert HeaderMenu
- `HeaderContext.tsx` (`features/menus/HeaderContext.tsx`) - Context für Header-Konfiguration

### Menü-Inhalte (HeaderMenu)

Das HeaderMenu enthält folgende Einträge (in dieser Reihenfolge):
1. Tags
2. Statistiken
3. --- (Separator)
4. Modi (Blueprints)
5. Audio hochladen
6. Audio Archiv (mit Notification Badge für nicht-hochgeladene Dateien)
7. --- (Separator)
8. Abonnement
9. Einstellungen

### Seitenspezifische Menüs

Einige Seiten haben zusätzliche, kontextbezogene Menüs:
- **Memo-Detail:** Aktions-Toolbar am unteren Bildschirmrand (Pin, Copy, Spaces, Translate, Delete)
- **Subscription:** SubscriptionMenu als zusätzliches Element neben dem HeaderMenu

Diese seitenspezifischen Menüs ersetzen NICHT das globale HeaderMenu, sondern ergänzen es.

## 2. Header-Konfiguration

Jede Seite konfiguriert ihren Header über den `useHeader()` Hook:

```typescript
const { updateConfig } = useHeader();

useFocusEffect(
  useCallback(() => {
    updateConfig({
      title: 'Seitentitel',
      showBackButton: true,    // Zurück-Button für Unterseiten
      showMenu: true,          // IMMER true setzen!
      rightIcons: [],          // Optionale seitenspezifische Icons
    });
  }, [])
);
```

**Pflichtfelder für jede Seite:**
- `title`: Seitentitel
- `showBackButton`: `true` für Unterseiten, `false` für Tabs
- `showMenu`: **Immer `true`**

## 3. Zurück-Navigation

- Unterseiten zeigen einen Zurück-Pfeil (Chevron) links im Header
- Tab-Seiten (Home, Memos) zeigen keinen Zurück-Pfeil
- Der Zurück-Button navigiert immer zur vorherigen Seite (`router.back()`)

## 4. Context Menu (Long-Press)

### Prinzip: Custom statt Native

Wir verwenden **keine nativen Context Menus** (iOS UIMenu, Android ContextMenu, ActionSheet). Stattdessen nutzen wir unser eigenes `ContextMenu`-Komponente, um eine **gleichbleibende Nutzererfahrung** auf allen Plattformen zu gewährleisten.

### Visuelles Verhalten (iOS-Style)

Beim Long-Press auf ein Element (z.B. MemoPreview-Card):
1. **Abgedunkelter Hintergrund** - Der gesamte Bildschirm wird abgedunkelt (Overlay)
2. **Hervorgehobenes Element** - Das gedrückte Element wird leicht vergrößert (scale 1.03) und mit Schatten hervorgehoben
3. **Menü-Optionen** - Erscheinen direkt unter (oder über) dem hervorgehobenen Element mit Slide-in-Animation

### Technische Umsetzung

**Komponente:** `ContextMenu.tsx` (`components/atoms/ContextMenu.tsx`)

```typescript
<ContextMenu
  items={[
    { key: 'action', title: 'Aktion', iconName: 'icon-name', onSelect: handler },
    { key: 'sep', separator: true },
    { key: 'delete', title: 'Löschen', iconName: 'trash-outline', destructive: true, onSelect: deleteHandler },
  ]}
  onPress={normalTapHandler}
  style={containerStyle}
>
  {/* Element-Inhalt */}
</ContextMenu>
```

**Props:**
- `items`: Array von `ContextMenuItem` (gleicher Typ wie `CustomMenuItem`)
- `onPress`: Normaler Tap-Handler (wird durchgereicht)
- `disabled`: Deaktiviert Context Menu (z.B. im Selection-Mode)
- `delayLongPress`: Verzögerung in ms (default: 500)

### Abgrenzung der Menü-Typen

| Typ | Komponente | Trigger | Verwendung |
|-----|-----------|---------|------------|
| **HeaderMenu** | `CustomMenu` via `HeaderMenu.tsx` | Tap auf MENU-Pill | Globale Navigation |
| **Context Menu** | `ContextMenu.tsx` | Long-Press auf Cards/Items | Kontextaktionen (Copy, Delete, Pin, ...) |
| **Dropdown Menu** | `CustomMenu.tsx` | Tap auf Icon/Button | Seitenspezifische Optionen |

### Animationen

- **Öffnen:** Overlay fade-in (200ms), Element scale-up (spring), Menü slide-in + fade (200ms)
- **Schließen:** Menü fade-out (150ms), Element scale-down (150ms), Overlay fade-out (180ms)
- Haptisches Feedback: `Medium` Impact beim Öffnen

## 5. Theme-System


- 4 Theme-Varianten: Lume (Gold), Nature (Grün), Stone (Slate), Ocean (Blau)
- Jede Variante hat einen Light- und Dark-Mode
- Alle UI-Elemente müssen theme-aware sein
- Farben werden über `useTheme()` und `tailwind.config.js` bezogen

## 6. Atomic Design

Komponenten folgen dem Atomic Design Pattern:
- **Atoms** (`components/atoms/`): Grundlegende UI-Elemente (Button, Text, Icon, Input)
- **Molecules** (`components/molecules/`): Zusammengesetzte Komponenten (MemoPreview, Toolbar)
- **Organisms** (`components/organisms/`): Komplexe Komponenten (AudioRecorder, Memory)

## 7. Feedback & Haptik

- Interaktive Elemente lösen haptisches Feedback aus (`Haptics.impactAsync`)
- Destruktive Aktionen (Löschen) erfordern eine Bestätigungsdialog
- Ladezustände werden mit Animationen/Overlays angezeigt
