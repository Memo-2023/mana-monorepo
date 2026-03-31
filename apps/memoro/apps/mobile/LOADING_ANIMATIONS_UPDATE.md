# Loading Animations Update

## ✅ Was wurde geändert

Die schwere Lottie-Animation wurde durch leichtgewichtige, native React Native Animationen ersetzt.

### Neue Animationskomponenten

Alle neuen Komponenten befinden sich in `components/molecules/`:

1. **LogoSpinnerAnimation** - Logo mit rotierendem Ring (⭐ Hauptanimation)
2. **PulsingLogoAnimation** - Pulsierendes Logo
3. **SpinnerAnimation** - Einfacher rotierender Spinner
4. **DotsAnimation** - Drei pulsierende Punkte

### Aktualisierte Dateien

#### ✏️ `components/LoadingScreen.tsx`
- **Vorher:** LottieAnimation (12KB JSON + Library)
- **Nachher:** LogoSpinnerAnimation
- **Verwendung:** App-weiter Ladebildschirm (Auth, Initial Load)

```tsx
// Neu:
import { LogoSpinnerAnimation } from './molecules/LogoSpinnerAnimation';

<LogoSpinnerAnimation size={150} />
```

#### ✏️ `components/atoms/LoadingOverlay.tsx`
- **Vorher:** ActivityIndicator
- **Nachher:** SpinnerAnimation
- **Verwendung:** Modales Loading (Translationen, Memory-Erstellung, etc.)

```tsx
// Neu:
import { SpinnerAnimation } from '../molecules/SpinnerAnimation';

<SpinnerAnimation size={spinnerSize} />
```

## 📊 Vorteile

- ✅ **Kleiner:** Kein 12KB JSON + keine externe Library mehr nötig
- ✅ **Schneller:** Native Animationen laufen auf UI Thread
- ✅ **Customizable:** Farben passen sich automatisch an Theme an
- ✅ **Minimalistischer:** Weniger ablenkend, fokussierter
- ✅ **Branded:** Nutzt MemoroLogo statt generischer Lock-Animation

## 🧪 Testen

Alle Animationen können getestet werden mit:

```tsx
import LoadingAnimationDemo from '~/components/LoadingAnimationDemo';

<LoadingAnimationDemo />
```

## 🗑️ Optional: Lottie entfernen

Falls die Lottie-Animation nirgendwo anders verwendet wird, kannst du die Dependency entfernen:

### 1. Prüfe ob Lottie noch verwendet wird:

```bash
grep -r "lottie-react-native" apps/mobile --exclude-dir=node_modules
grep -r "LottieAnimation" apps/mobile --exclude-dir=node_modules
grep -r "loading.json" apps/mobile --exclude-dir=node_modules
```

### 2. Falls nicht mehr verwendet, entfernen:

```bash
# Package entfernen
npm uninstall lottie-react-native

# Dateien löschen
rm apps/mobile/components/molecules/LottieAnimation.tsx
rm apps/mobile/assets/animations/loading.json
```

### 3. Rebuild:

```bash
npx expo prebuild --clean
```

## 🎨 Anpassungen

Alle Animationen unterstützen folgende Props:

```tsx
interface AnimationProps {
  size?: number;           // Größe der Animation
  style?: ViewStyle;       // Custom Styles
  color?: string;          // Überschreibt Theme-Farbe
}

// Beispiel:
<LogoSpinnerAnimation
  size={120}
  color="#FFD700"
  style={{ marginTop: 20 }}
/>
```

## 📝 Weitere Verwendung

Die neuen Komponenten können überall verwendet werden:

```tsx
// In Listen beim Laden
<SpinnerAnimation size={40} />

// Bei Buttons
<DotsAnimation size={30} />

// Für wichtige Prozesse
<LogoSpinnerAnimation size={100} />

// Für subtile Inline-Loading
<PulsingLogoAnimation size={24} />
```

## 🔄 Rollback (falls nötig)

Falls du zur alten Lottie-Animation zurück willst:

```tsx
// In LoadingScreen.tsx:
import { LottieAnimation } from './molecules/LottieAnimation';

<LottieAnimation
  source={require('~/assets/animations/loading.json')}
  style={{ width: 200, height: 200 }}
  autoPlay
  loop
/>
```
