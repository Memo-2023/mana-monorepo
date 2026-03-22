# Mukke Visualizer – Alternativen & Umsetzungswege

Unabhängige Übersicht aller Optionen für ein Musik-Visualisierungs-System im Browser.

---

## Rendering-Technologien im Vergleich

### A) Canvas 2D (Vanilla)

```
Audio → AnalyserNode → getByteFrequencyData() → Canvas 2D → requestAnimationFrame
```

| | |
|---|---|
| **Bundle** | 0 KB (Browser-nativ) |
| **Performance** | Gut für <500 Elemente, CPU-gebunden |
| **Lernkurve** | Niedrig |
| **Best für** | Bars, Waveforms, einfache Geometrien |
| **Limitierung** | Kein GPU, kein 3D, kein Blur/Glow nativ |

### B) PixiJS v8 (GPU-beschleunigtes 2D)

```
Audio → AnalyserNode → PixiJS Sprites/Particles → WebGL2/WebGPU
```

| | |
|---|---|
| **Bundle** | ~100 KB (modular) |
| **Performance** | Exzellent, GPU-beschleunigt, 100k+ Partikel möglich |
| **Lernkurve** | Mittel |
| **Best für** | Partikel-Systeme, Sprite-basierte Animationen, performante 2D-Effekte |
| **Limitierung** | Kein 3D |
| **Besonderheit** | v8 hat reaktives Rendering (nur geänderte Elemente werden neu gezeichnet) |

### C) Three.js (3D WebGL)

```
Audio → AnalyserNode → FFT als Uniform/Texture → Three.js Scene → Custom Shaders
```

| | |
|---|---|
| **Bundle** | ~150 KB (tree-shakeable) |
| **Performance** | Exzellent (GPU) |
| **Lernkurve** | Hoch |
| **Best für** | 3D-Wellenformen, Mesh-Displacement, Partikel, Postprocessing |
| **Limitierung** | Overkill für einfache 2D-Visualisierungen |
| **Ökosystem** | Riesig – GSAP-Integration, Shader Park Plugin, tausende Beispiele |

### D) Raw WebGL/WebGPU + GLSL Shaders

```
Audio → AnalyserNode → FFT als Textur (512x2) → Fragment Shader
```

| | |
|---|---|
| **Bundle** | ~5 KB (glslCanvas) oder 0 KB (eigener Loader) |
| **Performance** | Maximal (rein GPU) |
| **Lernkurve** | Sehr hoch (GLSL) |
| **Best für** | Generative Kunst, Shadertoy-artige Effekte, maximale visuelle Qualität |
| **Limitierung** | GLSL-Kenntnisse nötig, schwer zu debuggen |
| **Vorteil** | Tausende Shadertoy-Presets sind direkt portierbar |

### E) Babylon.js 8.0

```
Audio → Babylon Audio Engine (built-in) → 3D Scene → GLSL/WGSL Shaders
```

| | |
|---|---|
| **Bundle** | ~300 KB+ (tree-shakeable) |
| **Performance** | Exzellent (WebGPU-Unterstützung) |
| **Lernkurve** | Hoch |
| **Best für** | Wenn Audio-Engine und 3D-Rendering aus einer Hand kommen sollen |
| **Besonderheit** | Einzige große 3D-Engine mit eingebauter Audio-Engine und Visualizer-Integration |
| **Limitierung** | Sehr groß, kleinere Community als Three.js |

### F) p5.js + p5.sound

```
Audio → p5.FFT / p5.Amplitude → p5 draw() Loop → Canvas
```

| | |
|---|---|
| **Bundle** | ~1 MB (mit p5.sound) |
| **Performance** | Mäßig (nicht für Production optimiert) |
| **Lernkurve** | Sehr niedrig (beginner-friendly) |
| **Best für** | Prototyping, User-generierte Visualisierungen, Lern-Kontext |
| **Limitierung** | Monolithisch, nicht tree-shakeable, Performance-Ceiling |
| **Vorteil** | Riesige Community, tausende Tutorials, ideal als "User-Coding-Sprache" |

---

## Fertige Visualizer-Lösungen

### audiomotion-analyzer

| | |
|---|---|
| **Was** | Plug-and-Play Spektrum-Analyzer |
| **Bundle** | Klein, 0 Dependencies |
| **Features** | Log/Linear/Bark/Mel-Skalen, LED-Bars, Radial, Mirror, A/B/C/D-Weighting |
| **Lizenz** | AGPL v3+ (Copyleft – problematisch für SaaS!) |
| **Bewertung** | Bestes Aufwand/Ergebnis-Verhältnis für Spektrum-Analysen, aber Lizenz beachten |

### Butterchurn (Milkdrop WebGL Port)

| | |
|---|---|
| **Was** | Winamp/Milkdrop-Visualizer im Browser |
| **Bundle** | Mittel + Preset-Bibliothek |
| **Features** | Tausende Community-Presets, mathematische Preset-Sprache → GLSL-Compilation |
| **Lizenz** | MIT |
| **Bewertung** | Sofort beeindruckende Visuals, riesige Preset-Library, aber eigene DSL statt JS/GLSL |

### wavesurfer.js (bereits in Mukke)

| | |
|---|---|
| **Was** | Waveform-Player mit Plugins |
| **Relevante Plugins** | Spectrogram, Regions (schon genutzt) |
| **Bewertung** | Gut für Editor-Kontext, nicht für Fullscreen-Visualisierungen geeignet |

---

## User-Generated Visualizer: Plattform-Ansätze

### Weg 1: Code-Editor (JS/Canvas)

User schreibt eine `render(ctx, audioData)` Funktion.

```
┌──────────────────┐    ┌───────────────┐
│  Code Editor     │ →  │  Sandboxed    │ → Canvas Output
│  (CodeMirror 6)  │    │  Execution    │
└──────────────────┘    └───────────────┘
```

| Pro | Contra |
|-----|--------|
| Volle Kontrolle | Programmierkenntnisse nötig |
| KI kann Code generieren | Sicherheits-Sandboxing nötig |
| Bekanntes Paradigma (Shadertoy, Processing) | |

**Sandboxing-Optionen:**

| Methode | Sicherheit | Performance | Empfehlung |
|---------|-----------|-------------|------------|
| `new Function()` + Proxy-Scope | Schwach | Beste | Nur für eigenen Code / vertrauenswürdige Nutzer |
| **Sandboxed iframe** (`allow-scripts`, kein `allow-same-origin`) | **Stark** | Gut | **Best Practice für User-Code** |
| Web Worker + OffscreenCanvas | Mittel | Gut | Gute Alternative wenn kein DOM nötig |
| iframe + Worker (doppelt) | Sehr stark | Gut | Maximum Security |
| SES/Compartments (TC39 Proposal) | Stark | Gut | Zukunftssicher, aber noch Stage 1 |

### Weg 2: Shader-Editor (GLSL)

User schreibt einen Fragment Shader. Audio-Daten kommen als Uniforms/Textur.

```glsl
uniform float u_bass, u_mid, u_high, u_volume;
uniform sampler2D u_fft;  // 512x2 Textur (Row 0: FFT, Row 1: Waveform)
uniform float u_time;
uniform vec2 u_resolution;

void main() {
    vec2 uv = gl_FragCoord.xy / u_resolution;
    float freq = texture2D(u_fft, vec2(uv.x, 0.0)).r;
    // ... Shader-Logik
}
```

| Pro | Contra |
|-----|--------|
| GPU-nativ, maximale Performance | GLSL-Kenntnisse nötig |
| Shadertoy-Presets direkt portierbar | Schwerer zu debuggen |
| Shader-Code ist von Natur aus sandboxed (GPU) | Nur Pixel-Output, kein DOM |
| Tausende Beispiele online | |

### Weg 3: Node-basierter Visual Editor (wie cables.gl)

Visuelle Programmierung durch Verbinden von Nodes.

```
[FFT Input] → [Split Bands] → [Scale] → [Circle Generator] → [Color Map] → [Output]
                                   ↑
                            [Beat Detector]
```

| Pro | Contra |
|-----|--------|
| Keine Programmierkenntnisse nötig | Hoher Implementierungsaufwand |
| Visuell verständlich | Performance-Overhead durch Graph-Traversal |
| Composable, wiederverwendbar | Komplexe UI zu bauen |
| cables.gl ist MIT-lizenziert und einbettbar | |

### Weg 4: Deklaratives DSL (wie Hydra)

Ketten-Syntax, inspiriert von Modular-Synthese:

```javascript
osc(10, 0.1, () => bass * 2)
  .color(1.0, 0.3, () => mid)
  .rotate(() => time * 0.1)
  .modulate(noise(3), () => high * 0.5)
  .out()
```

| Pro | Contra |
|-----|--------|
| Extrem kompakt, ausdrucksstark | Eigene DSL = eigenes Ökosystem |
| Live-Coding geeignet | Weniger flexibel als freier Code |
| Audio-reaktiv by Design | Lernkurve für DSL-Syntax |
| Hydra ist Open Source (MIT) | |

### Weg 5: Prompt-basiert (KI-generiert)

User beschreibt in Sprache, KI generiert den Code.

```
User: "Nordlichter die auf den Bass reagieren, grün-lila Farbverlauf"
  → KI generiert Canvas 2D oder GLSL Code
  → Live Preview
  → User iteriert per Prompt
```

| Pro | Contra |
|-----|--------|
| Keine Programmierkenntnisse nötig | KI-Output muss validiert werden |
| Niedrigste Einstiegshürde | Weniger Kontrolle |
| Kombinierbar mit jedem Code-Ansatz | LLM-Kosten / Latenz |
| mana-llm Service existiert bereits | |

---

## Audio-Analyse: Alternativen zum AnalyserNode

### Meyda (Feature Extraction)

| | |
|---|---|
| **Bundle** | ~20 KB |
| **Features** | RMS, Spectral Centroid, Rolloff, Flatness, MFCC, Chroma, Loudness, ZCR |
| **Vorteil** | Musikalisch sinnvollere Features als rohe FFT-Daten |
| **Anwendung** | Beat-Detection aus RMS-Peaks, Genre-Erkennung, Stimmungsanalyse |
| **Integration** | `Meyda.createMeydaAnalyzer({ source, featureExtractors: ['rms', 'spectralCentroid'] })` |

### essentia.js (WASM Music Information Retrieval)

| | |
|---|---|
| **Bundle** | 800 KB – 2 MB (WASM) |
| **Features** | BPM, Beat-Tracking, Key Detection, Chord Recognition, Melody Extraction, Pitch |
| **Vorteil** | Akademisch fundiert, vollständige MIR-Toolbox |
| **Limitierung** | Groß, API noch nicht stabil |

### AudioWorklet (Custom DSP)

| | |
|---|---|
| **Bundle** | 0 KB (Browser-nativ) |
| **Features** | Sample-genaue Analyse auf dem Audio-Thread |
| **Vorteil** | Niedrigste Latenz, volle Kontrolle |
| **Limitierung** | Muss in separater Worklet-Datei leben, FFT selbst implementieren |

### Empfehlung nach Anwendungsfall

| Bedarf | Lösung |
|--------|--------|
| Frequency Bars / Waveform | `AnalyserNode` (reicht völlig) |
| Beat-Erkennung (einfach) | `AnalyserNode` + RMS-Peak-Detection |
| Beat-Erkennung (präzise) | **Meyda** (spectral flux + onset detection) |
| BPM / Key / Chord | **essentia.js** (wenn Größe akzeptabel) |
| Echtzeit-Feature-Extraction | **Meyda** |
| Sample-genaues Processing | **AudioWorklet** |

---

## Performance-Strategien

### requestAnimationFrame (Standard)

```typescript
function loop() {
  analyser.getByteFrequencyData(dataArray);  // Reuse array!
  drawVisualization(dataArray);
  requestAnimationFrame(loop);
}
```

- Synced mit Display-Refresh (60/120 Hz)
- Reicht für 95% der Fälle

### OffscreenCanvas + Worker (Heavy Rendering)

```typescript
// Main Thread
const offscreen = canvas.transferControlToOffscreen();
worker.postMessage({ canvas: offscreen, audioData }, [offscreen]);

// Worker
self.onmessage = ({ data }) => {
  const ctx = data.canvas.getContext('2d');
  // Render here – doesn't block main thread
};
```

- ~4x weniger Main-Thread-Blockade
- Browser-Support: alle modernen Browser
- Lohnt sich erst bei >10ms Renderzeit pro Frame

### Canvas-Layering

```html
<canvas id="static-bg" />     <!-- Hintergrund, selten aktualisiert -->
<canvas id="visualization" />  <!-- Hauptvisualisierung, 60fps -->
<canvas id="ui-overlay" />     <!-- UI-Elemente, nur bei Interaktion -->
```

- Vermeidet Neuzeichnen von statischen Elementen
- Besonders effektiv für Canvas 2D

### WebGL: FFT als Textur

```typescript
// Einmal pro Frame: FFT-Daten als 512x1 Textur hochladen
gl.texImage2D(gl.TEXTURE_2D, 0, gl.LUMINANCE, 512, 1, 0,
              gl.LUMINANCE, gl.UNSIGNED_BYTE, fftData);
// GPU macht den Rest im Shader
```

- Gesamte Visualisierung auf GPU
- Ideal für Shadertoy-artige Effekte

---

## Gegenüberstellung: 5 Architektur-Strategien

### Strategie 1: "Keep it Simple" – Canvas 2D Only

```
AnalyserNode → Canvas 2D → Built-in Visualizers (Svelte Components)
```

- 0 Dependencies
- 5-8 handgeschriebene Visualisierungen
- Keine User-Erweiterbarkeit
- **Aufwand: S** | **Visueller Impact: Mittel**

### Strategie 2: "Butterchurn Integration"

```
AnalyserNode → Butterchurn (WebGL) → 1000+ Milkdrop-Presets
```

- 1 Dependency (MIT)
- Sofort beeindruckend mit tausenden Presets
- Eigene Presets möglich (aber eigene DSL)
- **Aufwand: S** | **Visueller Impact: Sehr hoch**

### Strategie 3: "PixiJS Powerhouse" – GPU 2D + Partikel

```
AnalyserNode → PixiJS v8 → GPU-beschleunigte 2D + Custom Shaders
```

- 1 Dependency (~100 KB)
- Partikel-Systeme, Shader-Effekte, Sprites
- Gute Balance aus Aufwand und Ergebnis
- **Aufwand: M** | **Visueller Impact: Hoch**

### Strategie 4: "Creator Platform" – Code-Editor + Sandboxing

```
AnalyserNode → Sandboxed iframe → User Code (Canvas/GLSL) + KI-Generierung
```

- CodeMirror 6 + iframe Sandbox
- User erstellen und teilen Visualisierungen
- KI-Assistent generiert Code
- Built-in Library als Startpunkt
- **Aufwand: L** | **Visueller Impact: Unbegrenzt**

### Strategie 5: "Hybrid Maximum" – Best of All

```
Built-ins (Canvas 2D) + Butterchurn (Milkdrop) + Custom (Sandboxed iframe + GLSL)
```

- Sofortige Vielfalt durch Butterchurn-Presets
- Eigene handgemachte Visualisierungen für Marken-Identität
- User-Erweiterbarkeit für Power-User
- **Aufwand: L-XL** | **Visueller Impact: Maximal**

---

## Empfehlung: Entscheidungsmatrix

| Kriterium | Canvas 2D | Butterchurn | PixiJS | Creator Platform | Hybrid |
|-----------|:---------:|:-----------:|:------:|:----------------:|:------:|
| Time-to-Value | ★★★ | ★★★ | ★★ | ★ | ★★ |
| Visuelle Qualität | ★★ | ★★★ | ★★★ | ★★★ | ★★★ |
| Erweiterbarkeit | ★ | ★★ | ★★ | ★★★ | ★★★ |
| Bundle Size | ★★★ | ★★ | ★★ | ★★ | ★ |
| Wartbarkeit | ★★★ | ★★ | ★★ | ★ | ★ |
| Unique Selling Point | ★ | ★★ | ★★ | ★★★ | ★★★ |

**Quick Win:** Butterchurn einbinden → sofort 1000+ Presets, MIT-Lizenz, wenig Aufwand.

**Langfristig differenzierend:** Creator Platform mit KI → kein anderer Music Player bietet das.

**Pragmatischer Mittelweg:** Canvas 2D Built-ins + Butterchurn als "Classic Mode" + optionaler Shader-Editor für Power-User.
