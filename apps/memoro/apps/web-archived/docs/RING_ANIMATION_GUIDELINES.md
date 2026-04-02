# Ring Animation Guidelines

## Übersicht

Die konzentrischen Ringe sind ein zentrales visuelles Element der Memoro Web-App und erscheinen auf den öffentlichen Seiten (Login, Registrierung). Sie erzeugen eine beruhigende, meditative Atmosphäre durch eine Atem-Animation.

## Design-Prinzipien

### 1. Konsistenz zwischen Seiten
- Die Ringe sollten auf allen öffentlichen Seiten identisch aussehen und sich identisch verhalten
- Farbe: Gold (#f8d62b) mit subtilen Variationen während der Animation
- 8 konzentrische Ringe von außen nach innen

### 2. Keine abrupten Übergänge
- **Wichtig:** Wenn Ringe bereits sichtbar sind, dürfen sie NICHT verschwinden und wieder erscheinen
- Dies wirkt hektisch und zerstört die meditative Atmosphäre
- Übergänge zwischen Seiten sollten nahtlos sein

## Animations-Typen

### Intro-Animation (Droplet)
**Verwendung:** NUR beim initialen Laden der App (Login-Seite)

```css
@keyframes droplet-intro {
  0% { opacity: 0; transform: scale(0.98); }
  70% { opacity: calc(var(--base-opacity) * 1.1); transform: scale(1.003); }
  100% { opacity: var(--base-opacity); transform: scale(1); }
}
```

**Eigenschaften:**
- Ringe erscheinen von der Mitte nach außen
- Subtile Scale-Animation (0.98 → 1.003 → 1)
- Dauer: 1s pro Ring, gestaffelt mit 0.08s Verzögerung
- Easing: `ease-out`

**Wann verwenden:**
- Login-Seite (erster Kontaktpunkt)
- Nach komplettem Seiten-Reload

**Wann NICHT verwenden:**
- Bei Navigation von einer Seite mit bereits sichtbaren Ringen
- Bei SPA-Navigation innerhalb der App

### Atem-Animation (Combo)
**Verwendung:** Kontinuierlich auf allen Seiten mit Ringen

```css
@keyframes combo {
  0% { /* Ausatmen beendet */ }
  20% { /* Einatmen Mitte */ }
  40% { /* Einatmen abgeschlossen */ }
  60% { /* Ausatmen langsam */ }
  80% { /* Ausatmen Mitte */ }
  100% { /* Ausatmen beendet */ }
}
```

**Eigenschaften:**
- Basiert auf 4-6 Atmung (4s ein, 6s aus)
- Gesamtzyklus: 10 Sekunden
- Subtile Änderungen in:
  - Opazität (0.7 → 1.2 der Basis)
  - Scale (0.998 → 1.004)
  - Stroke-Width (0.9 → 1.15 der Basis)
  - Farbe (#e6b800 → #f8d62b)
  - Helligkeit (0.95 → 1.08)

### Reaktions-Animation (React-Pulse)
**Verwendung:** Beim Klicken auf Navigations-Buttons (Registrieren, Anmelden)

```css
@keyframes react-pulse {
  0% { opacity: var(--base-opacity); transform: scale(1); }
  50% { opacity: calc(var(--base-opacity) * 1.3); transform: scale(1.008); }
  100% { opacity: var(--base-opacity); transform: scale(1); }
}
```

**Eigenschaften:**
- Dauer: 0.4s pro Ring, gestaffelt mit 0.03s Verzögerung
- Kurzer heller Puls als visuelles Feedback
- Easing: `ease-out`
- Navigation erfolgt nach 0.3s (während der Animation)

**Wann verwenden:**
- Bei Klick auf "Registrieren" oder "Anmelden" Buttons
- Als visuelles Feedback vor der Navigation

**Implementation:**
```typescript
function triggerRingReaction(callback: () => void) {
  ringReaction = 'pulse';
  setTimeout(() => {
    callback();
    setTimeout(() => {
      ringReaction = 'none';
    }, 100);
  }, 300);
}
```

## Seiten-spezifische Regeln

### Login-Seite (`/login`)
- **Intro-Animation:** JA, aber NUR beim ersten Laden (via `ringsInitialized` Store)
- **Atem-Animation:** JA (startet nach Intro bzw. sofort wenn bereits initialisiert)
- Begründung: Erster Kontaktpunkt, Ringe "entstehen" - aber nur einmal pro Session

### Registrierungs-Seite (`/register`)
- **Intro-Animation:** NEIN
- **Atem-Animation:** JA (sofort sichtbar)
- Setzt `ringsInitialized` auf `true` beim Mount
- Begründung: User kommt typischerweise von Login, Ringe existieren bereits

### Weitere öffentliche Seiten
- Gleiche Regel wie Registrierung
- Ringe sofort sichtbar mit Atem-Animation
- Müssen `ringsInitialized.set(true)` beim Mount aufrufen

## State Management

### `ringsInitialized` Store
Speicherort: `$lib/stores/ringsInitialized.ts`

```typescript
import { writable } from 'svelte/store';
export const ringsInitialized = writable(false);
```

**Verwendung:**
- Login-Seite prüft den Store und zeigt Intro nur wenn `false`
- Alle Seiten mit Ringen setzen den Store auf `true` beim Mount
- Store wird bei Seiten-Reload zurückgesetzt (gewünschtes Verhalten)

## CSS-Variablen

```css
--delay: {(7 - i) * 0.15}s;       /* Atem-Animation Verzögerung */
--intro-delay: {(7 - i) * 0.08}s; /* Intro-Animation Verzögerung (nur Login) */
--react-delay: {(7 - i) * 0.03}s; /* Reaktions-Animation Verzögerung */
--base-opacity: {0.1 + i * 0.1};  /* Basis-Opazität (innen heller) */
--base-stroke: {1 + i * 0.5};     /* Basis-Strichstärke (innen dicker) */
```

Wobei `i` der Index des Rings ist (0 = außen, 7 = innen).

## Performance-Hinweise

- `will-change: opacity, transform, stroke-width, stroke, filter;` für GPU-Beschleunigung
- Animations-Easing: `cubic-bezier(0.45, 0, 0.55, 1)` für sanfte Übergänge
- SVG mit `preserveAspectRatio="xMidYMid slice"` für korrekte Skalierung

## Zukünftige Erweiterungen

Bei Bedarf können zusätzliche Animations-Varianten hinzugefügt werden:
- **Erfolg:** Kurzer heller Puls nach erfolgreicher Aktion
- **Fehler:** Subtiles Rot-Aufleuchten
- **Fokus:** Leichte Intensivierung beim Interagieren mit Formularen

Diese sollten immer als Overlay zur bestehenden Atem-Animation funktionieren, nicht als Ersatz.
