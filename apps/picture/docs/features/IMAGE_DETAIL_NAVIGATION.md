# Image Detail Navigation & Gallery Sync

Dokumentation der Implementation der Bild-Detail-Ansicht mit horizontaler Swipe-Navigation und automatischer Positions-Synchronisation mit der Galerie.

## Überblick

Die Bild-Detail-Ansicht bietet eine vollständige, iOS Photos-ähnliche Erfahrung:
- Horizontales Swipen zwischen allen Bildern
- Pinch-to-Zoom Funktionalität
- Pull-to-Close (Runterswipen zum Schließen)
- Automatische Synchronisation mit der Galerie-Position
- Fullscreen-Darstellung mit versteckbaren UI-Elementen

## Hauptkomponenten

### 1. Horizontale Bild-Navigation

**Implementierung:** `app/image/[id].tsx`

Verwendet `react-native-pager-view` für natives Swipe-Verhalten:

```typescript
import PagerView from 'react-native-pager-view';

<PagerView
  ref={pagerRef}
  style={{ flex: 1, backgroundColor: '#000' }}
  initialPage={currentIndex}
  onPageSelected={onPageSelected}
>
  {allImages.map((item) => (
    <View key={item.id} style={{ flex: 1, backgroundColor: '#000' }}>
      <ZoomableImage
        item={item}
        uiVisible={uiVisible}
        setUiVisible={setUiVisible}
        onClose={() => router.back()}
      />
    </View>
  ))}
</PagerView>
```

**Warum PagerView statt FlatList?**
- Native Swipe-Performance auf iOS/Android
- Bessere Kompatibilität mit Pinch/Pan Gestures
- Keine Konflikte mit Zoom-Gesten

### 2. Zoomable Image Komponente

**Komponente:** `ZoomableImage` in `app/image/[id].tsx`

Eigene Implementierung mit `react-native-gesture-handler` und `react-native-reanimated`:

```typescript
function ZoomableImage({ item, uiVisible, setUiVisible, onClose }) {
  const scale = useSharedValue(1);
  const translateY = useSharedValue(0);
  const dismissProgress = useSharedValue(0);

  // Pinch Gesture für Zoom
  const pinchGesture = Gesture.Pinch()
    .onUpdate((event) => {
      scale.value = savedScale.value * event.scale;
    })
    .onEnd(() => {
      if (scale.value < 1) {
        scale.value = withSpring(1);
        // Reset position
      } else {
        savedScale.value = scale.value;
      }
    });

  // Vertical Pan für Pull-to-Close
  const verticalPanGesture = Gesture.Pan()
    .activeOffsetY([-10, 10])
    .failOffsetX([-10, 10])  // Wichtig: Verhindert Konflikt mit horizontalem Swipe
    .onUpdate((event) => {
      if (scale.value === 1) {
        translateY.value = event.translationY;
        dismissProgress.value = Math.min(Math.abs(event.translationY) / 200, 1);
      }
    })
    .onEnd((event) => {
      if (scale.value === 1 && Math.abs(event.translationY) > 100) {
        runOnJS(onClose)();
      } else {
        translateY.value = withSpring(0);
        dismissProgress.value = withSpring(0);
      }
    });

  // Double-Tap für schnellen Zoom
  const doubleTap = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd(() => {
      if (scale.value > 1) {
        scale.value = withSpring(1);
        // Reset
      } else {
        scale.value = withSpring(2);
        savedScale.value = 2;
      }
    });

  // Single-Tap für UI Toggle
  const singleTap = Gesture.Tap()
    .numberOfTaps(1)
    .onEnd(() => {
      runOnJS(setUiVisible)(!uiVisible);
    });

  // Kombinierte Gesten
  const composed = Gesture.Race(
    doubleTap,
    Gesture.Simultaneous(verticalPanGesture, pinchGesture, singleTap)
  );
}
```

**Wichtige Gesture-Konfiguration:**
- `activeOffsetY([-10, 10])` - Aktiviert vertikale Geste erst ab 10px
- `failOffsetX([-10, 10])` - Deaktiviert bei horizontaler Bewegung (wichtig für PagerView!)
- `Gesture.Race()` - Double-Tap hat Priorität vor Single-Tap
- `Gesture.Simultaneous()` - Mehrere Gesten gleichzeitig möglich

### 3. Pull-to-Close Effekt

**Visual Feedback während des Draggings:**

```typescript
const containerStyle = useAnimatedStyle(() => ({
  opacity: 1 - dismissProgress.value * 0.5, // Fade out bis 50%
}));

const animatedStyle = useAnimatedStyle(() => ({
  transform: [
    { translateY: translateY.value },
    { scale: scale.value },
  ],
}));
```

**Schwarzer Hintergrund:**
Alle Container haben `backgroundColor: '#000'` für konsistentes Erscheinungsbild beim Pull-to-Close.

### 4. Gallery Position Sync

**Problem:** Wenn du in der Detail-Ansicht von Bild 1 zu Bild 5 swipest und dann schließt, landest du wieder bei Bild 1 in der Galerie.

**Lösung:** Zustand Store für geteilten State zwischen Detail- und Galerie-Ansicht.

#### ViewStore erweitern

**Datei:** `store/viewStore.ts`

```typescript
type ViewStore = {
  galleryViewMode: ViewMode;
  exploreViewMode: ViewMode;
  lastViewedImageId: string | null;  // NEU
  setGalleryViewMode: (mode: ViewMode) => void;
  setExploreViewMode: (mode: ViewMode) => void;
  setLastViewedImageId: (id: string | null) => void;  // NEU
};

export const useViewStore = create<ViewStore>()(
  persist(
    (set) => ({
      galleryViewMode: 'grid3',
      exploreViewMode: 'grid3',
      lastViewedImageId: null,  // NEU

      setGalleryViewMode: (mode) => set({ galleryViewMode: mode }),
      setExploreViewMode: (mode) => set({ exploreViewMode: mode }),
      setLastViewedImageId: (id) => set({ lastViewedImageId: id }),  // NEU
    }),
    {
      name: 'view-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
```

#### Detail-Ansicht: Position speichern

**Datei:** `app/image/[id].tsx`

```typescript
const { setLastViewedImageId } = useViewStore();

// Update current image details when index changes
useEffect(() => {
  if (allImages.length > 0 && allImages[currentIndex]) {
    const currentImage = allImages[currentIndex];
    setImage(currentImage);
    // ... andere Updates

    // Save last viewed image ID to store
    setLastViewedImageId(currentImage.id);
  }
}, [currentIndex, allImages]);
```

Jedes Mal wenn der User zu einem anderen Bild swipet, wird die ID im Store gespeichert.

#### Galerie-Ansicht: Zur Position scrollen

**Datei:** `app/(tabs)/index/index.tsx`

```typescript
import { useFocusEffect } from 'expo-router';

const { lastViewedImageId, setLastViewedImageId } = useViewStore();
const flatListRef = useRef<FlatList>(null);

// Scroll to last viewed image when screen comes into focus
useFocusEffect(
  useCallback(() => {
    if (lastViewedImageId && filteredImages.length > 0) {
      const index = filteredImages.findIndex(img => img.id === lastViewedImageId);
      if (index !== -1 && flatListRef.current) {
        setTimeout(() => {
          try {
            flatListRef.current?.scrollToIndex({
              index,
              animated: false,  // Kein Scrollen, sofort erscheinen
              viewPosition: 0.5, // Item zentrieren
            });
          } catch (error) {
            console.log('ScrollToIndex failed');
          }
        }, 100);

        // Clear after scrolling
        setTimeout(() => {
          setLastViewedImageId(null);
        }, 600);
      }
    }
  }, [lastViewedImageId, filteredImages])
);
```

**FlatList mit Fallback Handler:**

```typescript
<FlatList
  ref={flatListRef}
  data={filteredImages}
  onScrollToIndexFailed={(info) => {
    // Fallback wenn Item noch nicht gerendert ist
    const wait = new Promise(resolve => setTimeout(resolve, 500));
    wait.then(() => {
      flatListRef.current?.scrollToIndex({
        index: info.index,
        animated: false
      });
    });
  }}
  // ... andere Props
/>
```

**Wichtige Details:**
- `useFocusEffect` wird aufgerufen wenn Screen in den Fokus kommt
- `animated: false` verhindert sichtbares Scrollen
- 100ms Delay gibt FlatList Zeit zum Rendern
- `onScrollToIndexFailed` als Fallback wenn Item noch nicht geladen
- ID wird nach 600ms gelöscht, damit nicht beim nächsten Öffnen wieder dorthin gescrollt wird

## Navigation-Buttons

**Top Bar Buttons für manuelle Navigation:**

```typescript
{/* Previous Button */}
<Pressable
  onPress={() => {
    if (currentIndex > 0) {
      pagerRef.current?.setPage(currentIndex - 1);
    }
  }}
  disabled={currentIndex === 0}
  style={{
    opacity: currentIndex === 0 ? 0.3 : 1,
  }}
>
  <Ionicons name="chevron-back" size={24} color="#fff" />
</Pressable>

{/* Next Button */}
<Pressable
  onPress={() => {
    if (currentIndex < allImages.length - 1) {
      pagerRef.current?.setPage(currentIndex + 1);
    }
  }}
  disabled={currentIndex === allImages.length - 1}
  style={{
    opacity: currentIndex === allImages.length - 1 ? 0.3 : 1,
  }}
>
  <Ionicons name="chevron-forward" size={24} color="#fff" />
</Pressable>
```

**Page Indicator:**

```typescript
{allImages.length > 1 && (
  <View style={{
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  }}>
    <Text variant="bodySmall" style={{ color: '#fff' }}>
      {currentIndex + 1} / {allImages.length}
    </Text>
  </View>
)}
```

## Technische Herausforderungen & Lösungen

### 1. Gesture-Konflikte

**Problem:** Horizontal Swipe (PagerView) vs. Vertical Pan (Pull-to-Close) vs. Pinch (Zoom)

**Lösung:**
- `failOffsetX` verhindert vertikales Pan bei horizontalem Swipe
- `activeOffsetY` aktiviert Pull-to-Close erst ab 10px vertikaler Bewegung
- `Gesture.Race` für Tap-Prioritäten
- `Gesture.Simultaneous` für gleichzeitige Pinch + Tap

### 2. FlatList Grid-Layout Scrolling

**Problem:** `initialScrollIndex` und `getItemLayout` funktionieren nicht zuverlässig mit `numColumns`.

**Lösung:**
- `useFocusEffect` statt `initialScrollIndex`
- `animated: false` für sofortiges Erscheinen
- `onScrollToIndexFailed` als Fallback
- Delay für FlatList Rendering-Zeit

### 3. Schwarzer Hintergrund beim Pull-to-Close

**Problem:** Weißer Hintergrund erscheint beim Runterswipen.

**Lösung:**
```typescript
<GestureHandlerRootView style={{ flex: 1, backgroundColor: '#000' }}>
  <PagerView style={{ flex: 1, backgroundColor: '#000' }}>
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      <Animated.View style={{ backgroundColor: '#000' }}>
        {/* Image */}
      </Animated.View>
    </View>
  </PagerView>
</GestureHandlerRootView>
```

Alle Container-Ebenen müssen explizit `backgroundColor: '#000'` haben.

## Performance-Optimierungen

### 1. Lazy Loading in PagerView

PagerView rendert nur die aktuelle Page + 1-2 benachbarte Pages:

```typescript
// Automatisch durch PagerView optimiert
// windowSize wird intern gemanagt
```

### 2. Image Prefetching

Bereits implementiert in der Galerie (siehe `IMAGE_PERFORMANCE_OPTIMIZATION.md`):
- Thumbnails werden vorgeladen
- Progressive Loading mit BlurHash

### 3. Memo für Render-Optimierung

```typescript
const renderImageItem = ({ item }: { item: ImageDetails }) => (
  <ZoomableImage
    item={item}
    uiVisible={uiVisible}
    setUiVisible={setUiVisible}
    onClose={() => router.back()}
  />
);
```

Jede Page wird nur neu gerendert wenn `item` sich ändert.

## Benutzer-Flow

1. **Galerie öffnen** → Bilder in Grid-Ansicht
2. **Bild antippen** → Detail-Ansicht öffnet bei diesem Bild
3. **Horizontal swipen** → Zwischen allen Bildern navigieren
4. **Pinch** → Zoomen
5. **Double-Tap** → 2x Zoom Toggle
6. **Single-Tap** → UI ein/ausblenden
7. **Runterswipen** → Detail-Ansicht schließen
8. **Galerie erscheint** → Direkt an der Position des zuletzt angesehenen Bildes

## Abhängigkeiten

```json
{
  "react-native-pager-view": "6.9.1",
  "react-native-gesture-handler": "~2.28.0",
  "react-native-reanimated": "~4.1.1",
  "zustand": "^4.5.1",
  "@react-native-async-storage/async-storage": "2.2.0"
}
```

## Best Practices

1. **Immer `backgroundColor: '#000'`** auf allen Container-Ebenen für Fullscreen-Ansichten
2. **`animated: false`** bei `scrollToIndex` für sofortiges Erscheinen
3. **`failOffsetX/Y`** für Gesture-Konflikt-Vermeidung
4. **`useFocusEffect`** statt `useEffect` für Screen-Focus-Logik
5. **`onScrollToIndexFailed`** immer implementieren bei dynamischen Listen
6. **Zustand Store** für Screen-übergreifenden State
7. **100-300ms Delays** für FlatList/PagerView Rendering

## Zukünftige Verbesserungen

- [ ] Swipe-Velocity für schnelleres Blättern
- [ ] Shared Element Transition beim Öffnen/Schließen
- [ ] Video-Support mit gleicher Navigation
- [ ] Batch-Aktionen für mehrere Bilder
- [ ] Zoom-Level persistieren pro Bild

## Verwandte Dokumentation

- [IMAGE_PERFORMANCE_OPTIMIZATION.md](./IMAGE_PERFORMANCE_OPTIMIZATION.md) - Bild-Optimierungen
- [CLAUDE.md](../../CLAUDE.md) - Projekt-Übersicht
