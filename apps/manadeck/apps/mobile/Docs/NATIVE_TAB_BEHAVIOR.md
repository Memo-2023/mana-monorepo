# Native Tab Behavior - Manadeck App

## Übersicht

Die Manadeck-App nutzt die **Native Tabs** von Expo Router (SDK 54+), um eine native iOS/Android Tab-Navigation zu implementieren. Diese Dokumentation beschreibt die Konfiguration und das Verhalten der Tabs in unserer App.

## Aktuelle Implementierung

### Standort
`app/(tabs)/_layout.tsx`

### Konfiguration

```tsx
import { NativeTabs, Icon, Label } from 'expo-router/unstable-native-tabs';

export default function TabLayout() {
  return (
    <NativeTabs minimizeBehavior="automatic">
      <NativeTabs.Trigger name="decks">
        <Label>Decks</Label>
        <Icon
          sf={{ default: 'square.stack.3d.up', selected: 'square.stack.3d.up.fill' }}
          drawable="ic_albums"
        />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="explore">
        <Label>Entdecken</Label>
        <Icon sf={{ default: 'safari', selected: 'safari.fill' }} drawable="ic_explore" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="progress">
        <Label>Fortschritt</Label>
        <Icon
          sf={{ default: 'chart.line.uptrend.xyaxis', selected: 'chart.line.uptrend.xyaxis' }}
          drawable="ic_trending_up"
        />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="profile">
        <Label>Profil</Label>
        <Icon sf={{ default: 'person', selected: 'person.fill' }} drawable="ic_person" />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
```

## Minimize Behavior

### Was ist `minimizeBehavior`?

Die `minimizeBehavior` Property steuert, wie sich die Tab-Leiste beim Scrollen verhält. Diese Funktion ist ab iOS 26 verfügbar und erfordert Xcode 26 oder höher zum Kompilieren.

### Verfügbare Optionen

| Option | Beschreibung |
|--------|--------------|
| `'automatic'` | **[AKTUELL IN APP]** iOS entscheidet automatisch, wann die Tab-Leiste minimiert wird. Dies passt sich dem nativen iOS-Kontext an. |
| `'never'` | Tab-Leiste bleibt immer sichtbar und wird nie minimiert. |
| `'onScrollDown'` | Tab-Leiste wird beim Runterscrollen minimiert und beim Hochscrollen wieder angezeigt. |
| `'onScrollUp'` | Tab-Leiste wird beim Hochscrollen minimiert (seltener verwendet). |

### Unsere Wahl: `automatic`

Wir verwenden `minimizeBehavior="automatic"`, weil:
- iOS das Verhalten optimal an den Kontext anpasst
- Es sich nativ anfühlt und konsistent mit anderen iOS-Apps ist
- Keine manuelle Konfiguration für verschiedene Scroll-Szenarien nötig ist

## Systemanforderungen

### iOS
- **Minimum:** iOS 26 (für `minimizeBehavior`)
- **Xcode:** Version 26 oder höher
- **Expo SDK:** 54 oder höher
- **Status:** ✅ Produktionsreif (experimentelle API)

### Android
- **Status:** 🚧 In Entwicklung
- Native Tab Minimize Behavior ist noch nicht verfügbar
- Geplante Unterstützung in zukünftigen Expo-Versionen

## Bekannte Einschränkungen

### FlatList-Integration

⚠️ **Wichtig:** FlatList-Komponenten haben Limitierungen mit Native Tabs:

- `scroll-to-top` funktioniert möglicherweise nicht wie erwartet
- `minimize-on-scroll` kann bei FlatList fehlschlagen
- Edge-Detection kann fehlschlagen (Tab-Leiste wird transparent)

**Lösung:** Wenn Probleme auftreten, verwende den `disableTransparentOnScrollEdge` Prop:

```tsx
<NativeTabs minimizeBehavior="automatic" disableTransparentOnScrollEdge>
  {/* Tabs */}
</NativeTabs>
```

### Weitere Limitierungen

1. **Maximum 5 Tabs auf Android** - Material Design Komponenten-Beschränkung
2. **Tab-Leisten-Höhe nicht messbar** - Position variiert je nach Gerät (iPad, Vision Pro, etc.)
3. **Keine verschachtelten Native Tabs** - JavaScript Tabs können aber innerhalb von Native Tabs verschachtelt werden

## Best Practices für Manadeck

### Icons
- **iOS:** SF Symbols verwenden (höhere Qualität, native Optik)
- **Android:** Drawables verwenden
- Immer `default` und `selected` States definieren für besseres UX

### Scroll-Verhalten
- Verwende ScrollView oder ähnliche Komponenten in Tab-Screens
- Bei FlatList-Problemen: `disableTransparentOnScrollEdge` aktivieren
- Teste das Verhalten auf echten Geräten (Simulator kann abweichen)

### Entwicklung
```bash
# Development Server starten
npm start

# iOS Simulator (erfordert Xcode 26+)
npm run ios

# Android Emulator
npm run android
```

## Weiterführende Ressourcen

- **Vollständige Expo Docs:** `docs/EXPO_NATIVE_TABS.md`
- **Expo Router Native Tabs:** https://docs.expo.dev/router/advanced/native-tabs/
- **API Referenz:** https://docs.expo.dev/versions/latest/sdk/router-native-tabs/

## Änderungshistorie

| Datum | Änderung | Version |
|-------|----------|---------|
| 2025-10-20 | `minimizeBehavior="automatic"` hinzugefügt | SDK 54 |
| 2025-09 | Initiale Native Tabs Implementierung | SDK 54 |

---

**Status:** ✅ Experimentell (API kann sich ändern)
**Plattform:** iOS (primär), Android (geplant)
**Maintainer:** Manadeck Team
