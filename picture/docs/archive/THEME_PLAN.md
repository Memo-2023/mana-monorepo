# 🎨 Theme System - Implementierungsplan

## Überblick

Wir implementieren ein flexibles Theme-System mit **3 Theme-Varianten**, jeweils in **Light** und **Dark** Mode:

### Theme-Varianten

1. **Default (Indigo)** - Aktuelles Design
   - Primary: Indigo (#818cf8, #6366f1)
   - Modern, professionell

2. **Sunset (Orange/Pink)**
   - Primary: Orange → Pink Gradient
   - Warm, kreativ, künstlerisch

3. **Ocean (Teal/Cyan)**
   - Primary: Teal/Cyan (#14b8a6, #06b6d4)
   - Frisch, beruhigend, clean

### Modi
- **Dark Mode** (Standard)
- **Light Mode**

---

## 📋 Architektur

### 1. Theme Context & Store

```
contexts/
└── ThemeContext.tsx        # React Context für Theme-State
store/
└── themeStore.ts          # Zustand Store für Theme-Persistenz
```

**Features:**
- Theme-Auswahl (default/sunset/ocean)
- Mode-Auswahl (light/dark)
- System-Theme-Sync (optional)
- AsyncStorage-Persistenz
- Type-safe Theme-Objekte

---

### 2. Theme-Definitionen

```
constants/
└── themes/
    ├── index.ts           # Export aller Themes
    ├── types.ts           # TypeScript Interfaces
    ├── default.ts         # Indigo Theme (light + dark)
    ├── sunset.ts          # Sunset Theme (light + dark)
    └── ocean.ts           # Ocean Theme (light + dark)
```

**Theme-Objekt-Struktur:**

```typescript
interface Theme {
  name: 'default' | 'sunset' | 'ocean';
  mode: 'light' | 'dark';
  colors: {
    // Backgrounds
    background: string;      // Main app background
    surface: string;         // Cards, containers
    elevated: string;        // Modals, dropdowns
    overlay: string;         // Overlays, backdrops

    // Borders & Dividers
    border: string;
    divider: string;

    // Interactive Elements
    input: {
      background: string;
      border: string;
      text: string;
      placeholder: string;
    };

    // Text
    text: {
      primary: string;       // Main text
      secondary: string;     // Secondary text
      tertiary: string;      // Hints, captions
      disabled: string;      // Disabled state
      inverse: string;       // Text on colored bg
    };

    // Brand/Primary Color
    primary: {
      default: string;       // Main brand color
      hover: string;         // Hover state
      active: string;        // Active/pressed state
      light: string;         // Light variant
      dark: string;          // Dark variant
      contrast: string;      // Text on primary
    };

    // Secondary Color (für Accents)
    secondary: {
      default: string;
      light: string;
      dark: string;
      contrast: string;
    };

    // Status Colors
    success: string;
    warning: string;
    error: string;
    info: string;

    // Semantic Colors
    favorite: string;        // Heart/favorite icon
    like: string;           // Like button
    tag: string;            // Default tag color

    // Special
    skeleton: string;        // Loading skeletons
    shimmer: string;         // Shimmer effect
  };

  // Gradients (für Sunset Theme etc.)
  gradients: {
    primary: string[];       // [start, end]
    header: string[];
    card: string[];
  };

  // Shadows
  shadows: {
    sm: object;
    md: object;
    lg: object;
  };

  // Opacity values
  opacity: {
    disabled: number;
    overlay: number;
    hover: number;
  };
}
```

---

### 3. Theme-Anwendung

#### Option A: React Context (Empfohlen)
```typescript
// In jedem Component:
const { theme } = useTheme();

<View style={{ backgroundColor: theme.colors.background }}>
  <Text style={{ color: theme.colors.text.primary }}>Hello</Text>
</View>
```

#### Option B: Tailwind Dynamic Classes
```typescript
// Erweiterte Tailwind Config mit CSS Variables
<View className="bg-theme-background">
  <Text className="text-theme-primary">Hello</Text>
</View>
```

**Entscheidung:** Hybrid-Ansatz
- **Tailwind** für statische Styles
- **Theme Context** für dynamische Theme-Werte
- **CSS Variables** als Bridge

---

## 🎯 Implementierungsstrategie

### Phase 1: Foundation (1-2h)

1. **Theme Type Definitions**
   - `constants/themes/types.ts`
   - Vollständige TypeScript Interfaces

2. **Theme Definitions**
   - `constants/themes/default.ts` (light + dark)
   - `constants/themes/sunset.ts` (light + dark)
   - `constants/themes/ocean.ts` (light + dark)

3. **Theme Store**
   - `store/themeStore.ts`
   - AsyncStorage Persistenz
   - Theme/Mode-Switching Logic

4. **Theme Context**
   - `contexts/ThemeContext.tsx`
   - Hook: `useTheme()`
   - Provide Theme-Objekt

---

### Phase 2: Integration (2-3h)

5. **Root Layout Integration**
   - Theme Provider in `app/_layout.tsx`
   - StatusBar-Anpassung
   - System Theme Detection (optional)

6. **Tailwind Config Update**
   - CSS Variables für Themes
   - Dynamic color classes
   - `tailwind.config.js` erweitern

7. **Global Styles Update**
   - `global.css` mit CSS Variables
   - Theme-aware base styles

---

### Phase 3: Component Migration (3-4h)

8. **Core Components umstellen**
   - `components/Button.tsx`
   - `components/Header.tsx`
   - `components/ErrorBoundary.tsx`
   - `components/QuickGenerateBar.tsx`

9. **Screen Migration - Priorität**
   - `app/(tabs)/_layout.tsx` (Tab Bar)
   - `app/(tabs)/index.tsx` (Gallery)
   - `app/(tabs)/explore.tsx` (Explore)
   - `app/(tabs)/generate.tsx` (Generate)
   - `app/(tabs)/profile.tsx` (Profile)

10. **Kleinere Components**
    - Tags, Modals, Bottom Sheets
    - Loading States, Skeletons
    - Input Fields, Buttons

---

### Phase 4: Theme Selector UI (1-2h)

11. **Theme Picker Component**
    - `components/ThemePicker.tsx`
    - Visual Theme Preview
    - Light/Dark Toggle
    - Smooth Transitions

12. **Settings Integration**
    - In Profile Screen einbauen
    - Oder separate Settings Screen

---

### Phase 5: Polish & Testing (1-2h)

13. **Transitions & Animations**
    - Smooth Theme-Wechsel
    - Animated color transitions
    - Reanimated integration

14. **Testing**
    - Alle Screens in allen Themes
    - Light + Dark Mode
    - Edge Cases (z.B. während Image-Loading)

---

## 🎨 Theme-Farbpaletten (Vorschlag)

### Default Theme (Indigo)

#### Dark Mode
```typescript
{
  background: '#000000',      // Pure black
  surface: '#1a1a1a',
  primary: '#818cf8',         // Indigo-400
  secondary: '#a78bfa',       // Violet-400
}
```

#### Light Mode
```typescript
{
  background: '#ffffff',
  surface: '#f9fafb',         // Gray-50
  primary: '#6366f1',         // Indigo-500
  secondary: '#8b5cf6',       // Violet-500
}
```

---

### Sunset Theme (Orange/Pink)

#### Dark Mode
```typescript
{
  background: '#0a0a0a',
  surface: '#1f1410',         // Warm dark brown
  primary: '#fb923c',         // Orange-400
  secondary: '#f472b6',       // Pink-400
  gradients: {
    primary: ['#fb923c', '#f472b6'],  // Orange → Pink
  }
}
```

#### Light Mode
```typescript
{
  background: '#fff7ed',      // Orange-50
  surface: '#ffffff',
  primary: '#f97316',         // Orange-500
  secondary: '#ec4899',       // Pink-500
  gradients: {
    primary: ['#f97316', '#ec4899'],
  }
}
```

---

### Ocean Theme (Teal/Cyan)

#### Dark Mode
```typescript
{
  background: '#020617',      // Slate-950
  surface: '#0f172a',         // Slate-900
  primary: '#14b8a6',         // Teal-500
  secondary: '#06b6d4',       // Cyan-500
  gradients: {
    primary: ['#14b8a6', '#06b6d4'],  // Teal → Cyan
  }
}
```

#### Light Mode
```typescript
{
  background: '#f0fdfa',      // Teal-50
  surface: '#ffffff',
  primary: '#14b8a6',         // Teal-500
  secondary: '#0891b2',       // Cyan-600
  gradients: {
    primary: ['#14b8a6', '#0891b2'],
  }
}
```

---

## 🔧 Technische Details

### AsyncStorage Keys
```typescript
const THEME_STORAGE_KEY = '@picture_app/theme';
const MODE_STORAGE_KEY = '@picture_app/mode';
```

### Theme Store Interface
```typescript
interface ThemeStore {
  // State
  theme: 'default' | 'sunset' | 'ocean';
  mode: 'light' | 'dark';
  systemTheme: boolean;  // Follow system preference

  // Computed
  currentTheme: Theme;

  // Actions
  setTheme: (theme: ThemeVariant) => void;
  setMode: (mode: 'light' | 'dark') => void;
  toggleMode: () => void;
  setSystemTheme: (enabled: boolean) => void;

  // Persistence
  loadTheme: () => Promise<void>;
  saveTheme: () => Promise<void>;
}
```

---

### Theme Context Provider
```typescript
// app/_layout.tsx
<ThemeProvider>
  <ErrorBoundary>
    <SafeAreaProvider>
      <AuthProvider>
        <RootLayoutNav />
      </AuthProvider>
    </SafeAreaProvider>
  </ErrorBoundary>
</ThemeProvider>
```

---

### Component Usage Pattern

**Before:**
```typescript
<View className="bg-dark-bg">
  <Text className="text-gray-100">Hello</Text>
  <Pressable className="bg-indigo-600">
    <Text className="text-white">Click</Text>
  </Pressable>
</View>
```

**After:**
```typescript
const { theme } = useTheme();

<View style={{ backgroundColor: theme.colors.background }}>
  <Text style={{ color: theme.colors.text.primary }}>Hello</Text>
  <Pressable style={{ backgroundColor: theme.colors.primary.default }}>
    <Text style={{ color: theme.colors.primary.contrast }}>Click</Text>
  </Pressable>
</View>
```

**Alternative (mit helper):**
```typescript
const { theme, themed } = useTheme();

<View className={themed('bg')}>           {/* bg-theme-background */}
  <Text className={themed('text')}>       {/* text-theme-primary */}
    Hello
  </Text>
</View>
```

---

## 📱 Theme Picker UI Design

### Aufbau
```
┌─────────────────────────────────────┐
│  Theme Auswahl                      │
├─────────────────────────────────────┤
│                                     │
│  ┌────┐  ┌────┐  ┌────┐           │
│  │IND │  │SUN │  │OCE │           │
│  │IGO │  │SET │  │AN  │           │
│  └────┘  └────┘  └────┘           │
│   ✓       ○       ○                │
│                                     │
├─────────────────────────────────────┤
│  Modus                              │
│                                     │
│  ○ Hell          ● Dunkel          │
│                                     │
│  □ System-Theme folgen             │
└─────────────────────────────────────┘
```

### Features
- **Theme Cards**: Visuelle Preview mit Farben
- **Toggle**: Light/Dark Switch
- **System**: Optional System-Preference
- **Live Preview**: Änderungen sofort sichtbar
- **Smooth Transitions**: Animierte Übergänge

---

## 🎯 Migration-Checkliste

### Komponenten (296 Stellen gefunden)

#### High Priority (Core UI)
- [ ] `app/_layout.tsx` - Theme Provider
- [ ] `app/(tabs)/_layout.tsx` - Tab Bar
- [ ] `components/Header.tsx`
- [ ] `components/QuickGenerateBar.tsx`
- [ ] `components/Button.tsx`
- [ ] `components/ErrorBoundary.tsx`

#### Medium Priority (Main Screens)
- [ ] `app/(tabs)/index.tsx` - Gallery
- [ ] `app/(tabs)/explore.tsx` - Explore
- [ ] `app/(tabs)/generate.tsx` - Generate
- [ ] `app/(tabs)/profile.tsx` - Profile
- [ ] `app/image/[id].tsx` - Image Detail

#### Low Priority (Supporting)
- [ ] `components/tags/TagInput.tsx`
- [ ] `components/tags/TagDisplay.tsx`
- [ ] `components/batch/*`
- [ ] `components/remix/*`
- [ ] Auth Screens

---

## 🚀 Timeline Schätzung

| Phase | Aufgabe | Zeit |
|-------|---------|------|
| 1 | Foundation (Types, Store, Context) | 1-2h |
| 2 | Integration (Tailwind, Layout) | 2-3h |
| 3 | Component Migration | 3-4h |
| 4 | Theme Picker UI | 1-2h |
| 5 | Polish & Testing | 1-2h |
| **Total** | | **8-13h** |

---

## 💡 Best Practices

### 1. Type Safety
```typescript
// ✅ GOOD - Type-safe
const { theme } = useTheme();
<View style={{ backgroundColor: theme.colors.background }}>

// ❌ BAD - String literal
<View style={{ backgroundColor: '#000000' }}>
```

### 2. Gradients
```typescript
// Für Sunset Theme
import { LinearGradient } from 'expo-linear-gradient';

<LinearGradient
  colors={theme.gradients.primary}
  style={styles.container}
>
  {children}
</LinearGradient>
```

### 3. Transitions
```typescript
// Smooth theme change
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

<Animated.View
  entering={FadeIn}
  exiting={FadeOut}
  style={{ backgroundColor: theme.colors.background }}
>
```

### 4. System Theme
```typescript
import { useColorScheme } from 'react-native';

const systemColorScheme = useColorScheme(); // 'light' | 'dark'
if (systemThemeEnabled) {
  setMode(systemColorScheme === 'dark' ? 'dark' : 'light');
}
```

---

## 🎨 Zusätzliche Features (Optional)

### Custom Themes
- User kann eigene Farben definieren
- Color Picker Integration
- Theme-Export/Import

### Theme Presets
- Mehr Theme-Varianten (z.B. "Forest", "Lavender", "Midnight")
- Community-Themes

### Advanced
- Per-Screen Themes (z.B. Generate Screen anders als Gallery)
- Scheduled Themes (Morgens hell, abends dunkel)
- Dynamic Themes based on Image Colors

---

## 📦 Dependencies

### Bestehend
- ✅ `zustand` - State Management
- ✅ `@react-native-async-storage/async-storage` - Persistenz
- ✅ `react-native-reanimated` - Animations

### Neu (Optional)
- `expo-linear-gradient` - Für Gradient-Themes
- `react-native-mmkv` - Schnellere Alternative zu AsyncStorage

---

## ❓ Entscheidungen

### 1. Theme-Switching Strategie
**Option A: Context + CSS Variables** (Empfohlen)
- ✅ Flexibel
- ✅ Type-safe
- ✅ Funktioniert mit allen Components
- ❌ Mehr Migration-Aufwand

**Option B: Nur CSS Variables**
- ✅ Weniger Code-Änderungen
- ✅ Funktioniert mit Tailwind
- ❌ Weniger Type-Safety
- ❌ Komplexe Gradients schwierig

**Entscheidung: Option A** - Maximale Flexibilität

### 2. Gradient-Support
**Frage:** Soll Sunset Theme überall Gradients verwenden?
- **Empfehlung:** Nur an Key-Stellen (Header, Buttons, Highlights)
- Background bleibt solid für Performance

### 3. System Theme
**Frage:** Auto-Switch bei System-Theme-Änderung?
- **Empfehlung:** Optional, User-Entscheidung in Settings

---

## 🎬 Nächste Schritte

1. **Review dieses Plans** - Feedback, Änderungswünsche?
2. **Theme-Farben finalisieren** - Genaue Hex-Werte abstimmen
3. **Implementierung starten** - Phase 1 beginnen

**Bereit zum Start?** 🚀
