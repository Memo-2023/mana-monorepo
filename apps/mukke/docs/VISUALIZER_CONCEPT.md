# Mukke Visualizer System – Konzept

## Vision

Ein erweiterbares Visualisierungs-Framework, das:

- Viele eingebaute Visualisierungen mitbringt (Frequency Bars, Circular, Particles, Waveform, etc.)
- Nutzern ermöglicht, eigene Visualisierungen zu erstellen (Code-Editor oder KI-generiert)
- Visualisierungen als "Community Presets" teilbar macht
- Sich nahtlos in den bestehenden Player (FullPlayer, MiniPlayer, Fullscreen-Modus) integriert

---

## Architektur-Übersicht

```
┌─────────────────────────────────────────────────────────┐
│                    Player UI                             │
│   FullPlayer │ MiniPlayer │ Fullscreen Visualizer       │
└────────────────────────┬────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────┐
│              VisualizerRenderer.svelte                    │
│   Wählt den aktiven Renderer, übergibt AudioData + Config│
└────────────────────────┬────────────────────────────────┘
                         │
          ┌──────────────┼──────────────┐
          ▼              ▼              ▼
   ┌────────────┐ ┌────────────┐ ┌────────────┐
   │  Built-in  │ │  Built-in  │ │   Custom   │
   │  Renderer  │ │  Renderer  │ │  Renderer  │
   │  (Svelte)  │ │  (Svelte)  │ │ (Sandboxed)│
   └────────────┘ └────────────┘ └────────────┘
          │              │              │
          └──────────────┼──────────────┘
                         ▼
┌─────────────────────────────────────────────────────────┐
│              Audio Analyzer (Singleton)                   │
│   AnalyserNode → frequencyData, timeDomainData, volume  │
└─────────────────────────────────────────────────────────┘
```

---

## 1. Audio Data Layer

### Aktueller Stand

`src/lib/visualizer/analyzer.ts` liefert bereits:
- `getFrequencyData()` → `Uint8Array` (Frequenzbänder 0-255)
- `getFrequencyBinCount()` → Anzahl der Bins

### Erweiterung

```typescript
// src/lib/visualizer/audio-data.ts

export interface AudioData {
  /** Frequency spectrum (0-255 per bin) */
  frequency: Uint8Array;
  /** Time domain waveform (-128 to 127, centered at 128) */
  timeDomain: Uint8Array;
  /** Number of frequency bins */
  binCount: number;
  /** Current RMS volume (0-1) */
  volume: number;
  /** Current bass energy (0-1) – average of lowest 1/8 bins */
  bass: number;
  /** Current mid energy (0-1) */
  mid: number;
  /** Current high energy (0-1) */
  high: number;
  /** Beat detected this frame */
  beat: boolean;
  /** Current playback time in seconds */
  currentTime: number;
  /** Song duration in seconds */
  duration: number;
  /** Song BPM (if available) */
  bpm: number | null;
}
```

Die `AudioData`-Struktur wird einmal pro Frame berechnet und an alle aktiven Renderer weitergegeben. So müssen Visualisierungen selbst keine Audio-Analyse machen.

---

## 2. Visualizer Registry

### Discriminated Union Pattern (wie Picture App Board Items)

```typescript
// src/lib/visualizer/types.ts

export interface VisualizerMeta {
  id: string;
  name: string;
  description: string;
  author: string;
  thumbnail?: string;       // Preview-Bild oder generiert
  category: VisualizerCategory;
  tags: string[];
  version: string;
}

export type VisualizerCategory =
  | 'spectrum'     // Frequency-basiert (Bars, Circular)
  | 'waveform'     // Wellenform-basiert
  | 'particles'    // Partikel-Systeme
  | 'geometric'    // Geometrische Muster
  | 'abstract'     // Abstrakte/generative Kunst
  | 'custom';      // User-created

export interface VisualizerConfig {
  [key: string]: unknown;
}

export interface VisualizerDefinition<C extends VisualizerConfig = VisualizerConfig> {
  meta: VisualizerMeta;
  /** Default-Konfiguration */
  defaultConfig: C;
  /** JSON-Schema für die Config (für UI-Generierung) */
  configSchema: ConfigSchema;
  /** Rendering-Typ */
  type: 'builtin' | 'custom-canvas' | 'custom-shader';
}
```

### Registry Store

```typescript
// src/lib/visualizer/registry.svelte.ts

function createVisualizerRegistry() {
  let visualizers = $state<Map<string, VisualizerDefinition>>(new Map());
  let activeId = $state<string>('frequency-bars');
  let activeConfig = $state<VisualizerConfig>({});

  return {
    get all() { return [...visualizers.values()]; },
    get active() { return visualizers.get(activeId) ?? null; },
    get activeConfig() { return activeConfig; },

    register(def: VisualizerDefinition) { ... },
    unregister(id: string) { ... },
    setActive(id: string) { ... },
    updateConfig(patch: Partial<VisualizerConfig>) { ... },
    getByCategory(cat: VisualizerCategory) { ... },
  };
}
```

---

## 3. Built-in Visualisierungen

### Phase 1 (implementiert)

| ID | Name | Beschreibung |
|----|------|-------------|
| `frequency-bars` | Frequency Bars | Klassische EQ-Balken, konfigurierbar (Anzahl, Farbe, Mirror) |

### Phase 2 (Editor-Verbesserungen)

| ID | Name | Beschreibung |
|----|------|-------------|
| `beat-grid` | Beat Grid | BPM-basiertes Raster über Waveform |
| `energy-heatmap` | Energy Heatmap | Waveform eingefärbt nach Lautstärke |

### Phase 3 (Premium)

| ID | Name | Beschreibung |
|----|------|-------------|
| `circular-spectrum` | Circular Spectrum | Kreisförmig, Album-Art in der Mitte, Frequenz als Strahlen |
| `particles` | Particle Flow | Partikel reagieren auf Bass/Transients |
| `waveform-3d` | 3D Waveform | Scrollende 3D-Wellenform (Terrain-Stil) |
| `blob` | Reactive Blob | Organische Form, die zum Beat atmet |
| `bars-circular` | Circular Bars | Bars im Kreis angeordnet |
| `spectrum-wave` | Spectrum Wave | Smooth-kurvige Frequenzlinie |
| `stereo-field` | Stereo Field | L/R Panorama-Visualisierung |
| `kaleidoscope` | Kaleidoscope | Symmetrische Muster aus Frequenzdaten |

---

## 4. Rendering-Ansätze

### Option A: Svelte Components (Built-ins)

Jede Built-in-Visualisierung ist eine Svelte-Komponente mit standardisiertem Interface:

```svelte
<script lang="ts">
  import type { AudioData, VisualizerConfig } from '$lib/visualizer/types';

  interface Props {
    audioData: AudioData;
    config: VisualizerConfig;
    width: number;
    height: number;
  }

  let { audioData, config, width, height }: Props = $props();

  // Rendering-Logik mit Canvas 2D, SVG, oder WebGL
</script>

<canvas bind:this={canvas} {width} {height}></canvas>
```

**Pro:** Volle Svelte-Reaktivität, Tree-Shakeable, einfach zu warten
**Contra:** Nicht dynamisch ladbar für User-Visualisierungen

### Option B: Canvas 2D Render Functions (Custom)

User-Visualisierungen als reine Render-Funktionen:

```typescript
interface CustomVisualizerFn {
  setup?: (ctx: CanvasRenderingContext2D, width: number, height: number) => void;
  render: (ctx: CanvasRenderingContext2D, data: AudioData, config: VisualizerConfig,
           width: number, height: number) => void;
  destroy?: () => void;
}
```

**Pro:** Einfach, sicher (nur Canvas-Zugriff), leicht per Code-Editor erstellbar
**Contra:** Nur 2D, kein DOM-Zugriff

### Option C: WebGL/Shader (Advanced)

GLSL Fragment Shaders für GPU-beschleunigte Visualisierungen:

```glsl
// User schreibt nur den Fragment Shader
uniform float u_time;
uniform float u_bass;
uniform float u_mid;
uniform float u_high;
uniform float u_volume;
uniform sampler2D u_frequency;  // Frequenzdaten als Textur

void main() {
  vec2 uv = gl_FragCoord.xy / u_resolution;
  // ... Shader-Code
  gl_FragColor = vec4(color, 1.0);
}
```

**Pro:** GPU-beschleunigt, visuell beeindruckend, Shadertoy-kompatibel
**Contra:** Steile Lernkurve, schwer zu debuggen

### Empfehlung: Hybrid-Ansatz

| Typ | Technologie | Verwendung |
|-----|------------|------------|
| Built-in | Svelte + Canvas 2D | Alle mitgelieferten Visualisierungen |
| Custom Canvas | Sandboxed Canvas 2D Function | User-erstellte 2D-Visualisierungen |
| Custom Shader | WebGL Fragment Shader | User-erstellte GPU-Visualisierungen |

---

## 5. Custom Visualizer System

### User-Workflow

1. **Galerie öffnen** → Alle verfügbaren Visualisierungen als Grid mit Live-Preview
2. **"Create New"** → Code-Editor öffnet sich
3. **Template wählen** → Startercode für Canvas 2D oder Shader
4. **Code schreiben** → Live-Preview neben dem Editor
5. **KI-Assistent** → "Erstelle eine Visualisierung die..." → Code wird generiert
6. **Speichern** → In der persönlichen Bibliothek
7. **Teilen** → Als Community Preset veröffentlichen (optional)

### Code-Editor Integration

```
┌─────────────────────────────────────────────────────┐
│  ┌─────────────────────┐  ┌──────────────────────┐  │
│  │                     │  │                      │  │
│  │    Code Editor      │  │   Live Preview       │  │
│  │    (Monaco/CM6)     │  │   (Canvas)           │  │
│  │                     │  │                      │  │
│  │                     │  │                      │  │
│  └─────────────────────┘  └──────────────────────┘  │
│  ┌──────────────────────────────────────────────────┐│
│  │  Config Panel: [barCount: 32] [color: #ff0]     ││
│  └──────────────────────────────────────────────────┘│
│  [💾 Save] [▶ Test with Audio] [🤖 Ask AI] [📤 Share]│
└─────────────────────────────────────────────────────┘
```

### Sandboxing (Sicherheit)

Custom Code läuft **nicht** direkt im Hauptthread:

```
Option 1: new Function() mit Whitelist
  - Kein Zugriff auf window, document, fetch, etc.
  - Nur ctx (Canvas), data (AudioData), config erreichbar
  - Einfach, performant, leichte Einschränkungen

Option 2: Web Worker + OffscreenCanvas
  - Code läuft in isoliertem Worker
  - Rendert auf OffscreenCanvas, wird in Hauptthread übertragen
  - Sicherer, aber komplexer und nicht alle Browser unterstützen OffscreenCanvas

Option 3: iframe Sandbox
  - Maximale Isolation
  - Overhead durch postMessage-Kommunikation
  - Overkill für Canvas-Rendering
```

**Empfehlung:** Option 1 (`new Function()`) für Canvas 2D, direkte WebGL-Ausführung für Shaders (Shader-Code ist von Natur aus sandboxed auf der GPU).

### Datenbank-Schema

```typescript
// Erweiterung der DB (Backend)
visualizers: {
  id: uuid,
  userId: uuid,
  meta: jsonb,        // VisualizerMeta
  config: jsonb,      // Default VisualizerConfig
  configSchema: jsonb, // JSON Schema für Config-UI
  code: text,         // Render-Function oder Shader-Code
  type: enum('canvas-2d', 'shader'),
  isPublic: boolean,
  likes: integer,
  createdAt: timestamp,
  updatedAt: timestamp,
}
```

---

## 6. Visualizer Galerie UI

```
┌─────────────────────────────────────────────────────────┐
│  🎵 Visualisierungen                    [+ Create New]  │
│                                                         │
│  [All] [Spectrum] [Waveform] [Particles] [Community]   │
│                                                         │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐             │
│  │ ▓▓▓▓▓▓▓▓ │  │  ◉ ))) ) │  │ ·  · · · │             │
│  │ ▓▓▓▓▓▓▓▓ │  │ ◉ )))) ) │  │· · ·  ·  │             │
│  │ Freq Bars │  │ Circular │  │ Particles │             │
│  │ ★ Built-in│  │ ★ Built-in│  │ ★ Built-in│            │
│  └──────────┘  └──────────┘  └──────────┘             │
│                                                         │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐             │
│  │ ~~~~~~~~ │  │ ╱╲╱╲╱╲╱╲ │  │ ▒▒▒▒▒▒▒▒ │             │
│  │ ~~~~~~~~ │  │ ╱╲╱╲╱╲╱╲ │  │ ▒▒▒▒▒▒▒▒ │             │
│  │ Waveform │  │ Kaleido  │  │ My Custom │             │
│  │ ★ Built-in│  │ ★ Built-in│  │ 👤 You   │            │
│  └──────────┘  └──────────┘  └──────────┘             │
└─────────────────────────────────────────────────────────┘
```

### Config Panel (pro Visualisierung)

Jede Visualisierung definiert ein `configSchema`, aus dem automatisch UI generiert wird:

```typescript
const configSchema: ConfigSchema = {
  barCount: { type: 'range', min: 8, max: 128, step: 1, label: 'Bar Count' },
  color: { type: 'color', label: 'Color' },
  mirror: { type: 'toggle', label: 'Mirror' },
  sensitivity: { type: 'range', min: 0, max: 2, step: 0.1, label: 'Sensitivity' },
  colorMode: { type: 'select', options: ['gradient', 'solid', 'rainbow'], label: 'Color Mode' },
};
```

---

## 7. KI-Integration

### Prompt-basierte Erstellung

User beschreibt die gewünschte Visualisierung in natürlicher Sprache:

> "Erstelle einen Visualizer der wie Nordlichter aussieht.
> Die Farben sollen zwischen Grün und Lila wechseln, basierend auf den Bässen."

→ KI generiert Canvas 2D oder Shader Code
→ Live-Preview zeigt das Ergebnis sofort
→ User kann iterieren ("mach die Bewegung schneller", "füge Sterne hinzu")

### System Prompt für KI

```
Du bist ein Musik-Visualisierungs-Experte. Generiere eine render()-Funktion:

function render(ctx, data, config, width, height) {
  // ctx: CanvasRenderingContext2D
  // data: { frequency, timeDomain, volume, bass, mid, high, beat, currentTime, bpm }
  // config: User-konfigurierbare Werte
  // width, height: Canvas-Dimensionen
}

Regeln:
- Lösche den Canvas mit ctx.clearRect(0, 0, width, height)
- Nutze data.frequency (Uint8Array, 0-255) für Spektrumdaten
- data.bass/mid/high sind normalisiert (0-1)
- data.beat ist true wenn ein Beat erkannt wurde
- Halte den Code performant (60fps)
- Gib auch ein configSchema-Objekt zurück
```

### Integration über mana-llm Service

```
User Input → mana-llm → Code generiert → Sandbox → Live Preview
```

Nutzt den bestehenden `services/mana-llm` als LLM-Abstraktionsschicht.

---

## 8. Fullscreen Visualizer Mode

Neuer Fullscreen-Modus für immersive Erfahrung:

- Visualisierung füllt den gesamten Bildschirm
- Minimale Transport-Controls (transparent overlay, auto-hide)
- Song-Info eingeblendet bei Track-Wechsel (fade in/out)
- Keyboard-Shortcuts (Space = Play/Pause, Esc = Exit, N = Next Viz)
- Screensaver-Modus: Wechselt automatisch zwischen Visualisierungen

---

## 9. Datei-Struktur (geplant)

```
src/lib/visualizer/
├── analyzer.ts                    # Audio Analyzer (existiert)
├── audio-data.ts                  # AudioData Interface + Berechnung
├── types.ts                       # Alle Type-Definitionen
├── registry.svelte.ts             # Visualizer Registry Store
├── sandbox.ts                     # Custom Code Sandboxing
├── FrequencyBars.svelte           # Built-in (existiert)
├── renderers/
│   ├── CircularSpectrum.svelte    # Kreisförmiges Spektrum
│   ├── ParticleFlow.svelte        # Partikel-System
│   ├── Waveform3D.svelte          # 3D Waveform
│   ├── ReactiveBlob.svelte        # Organische Form
│   ├── CircularBars.svelte        # Bars im Kreis
│   ├── SpectrumWave.svelte        # Glatte Frequenzkurve
│   ├── StereoField.svelte         # Stereo-Analyse
│   └── Kaleidoscope.svelte        # Kaleidoskop-Muster
├── components/
│   ├── VisualizerRenderer.svelte  # Router: wählt aktiven Renderer
│   ├── VisualizerGallery.svelte   # Galerie-Ansicht
│   ├── VisualizerConfig.svelte    # Auto-generiertes Config-Panel
│   ├── VisualizerEditor.svelte    # Code-Editor für Custom Viz
│   ├── VisualizerPreview.svelte   # Live-Preview Canvas
│   └── FullscreenVisualizer.svelte# Fullscreen-Modus
└── templates/
    ├── canvas-2d-starter.ts       # Template für Canvas 2D
    └── shader-starter.glsl        # Template für GLSL Shader
```

---

## 10. Implementierungs-Reihenfolge

| Phase | Was | Aufwand |
|-------|-----|---------|
| **1** ✅ | Frequency Bars + Analyzer (done) | — |
| **2** | AudioData erweitern (bass/mid/high/beat), Registry Store, VisualizerRenderer | S |
| **3** | 3-4 weitere Built-in Renderer (Circular, Particles, Blob, Wave) | M |
| **4** | Galerie UI + Config Panel + Fullscreen Mode | M |
| **5** | Custom Visualizer: Sandbox + Code-Editor + Templates | L |
| **6** | KI-Integration (mana-llm) für Code-Generierung | M |
| **7** | Community: Teilen, Likes, öffentliche Galerie | L |
| **8** | Backend: visualizers-Tabelle, CRUD API, User-Presets | M |

---

## 11. Technologie-Entscheidungen

| Bereich | Entscheidung | Begründung |
|---------|-------------|------------|
| Built-in Rendering | Canvas 2D | Performant, einfach, kein Dep overhead |
| GPU-Effekte | Raw WebGL (kein Three.js) | Vermeidet ~150kb Dependency für Shader-only |
| Code Editor | CodeMirror 6 | Leichtgewichtig, Svelte-freundlich, besser als Monaco für embedded |
| Sandboxing | `new Function()` mit Whitelist | Guter Kompromiss aus Sicherheit und Performance |
| State | Svelte 5 Runes Store | Konsistent mit Rest der App |
| Persistenz | JSONB in PostgreSQL | Flexibel, keine Migrationen bei Config-Änderungen |
| KI | mana-llm Service | Bereits vorhanden, LLM-agnostisch |
