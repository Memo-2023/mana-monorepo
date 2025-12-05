# Flux Bildgenerierung über Replicate

## Überblick

Worldream nutzt **Flux Schnell** von Black Forest Labs über die Replicate API für schnelle, hochwertige Bildgenerierung. Flux ist eines der modernsten Open-Source Bildgenerierungsmodelle und bietet exzellente Qualität bei sehr schnellen Generierungszeiten.

## Modelle

### Flux Schnell (Primär)

- **Geschwindigkeit**: 1-2 Sekunden
- **Qualität**: Sehr gut für schnelle Iterationen
- **Model ID**: `black-forest-labs/flux-schnell`
- **Optimal für**: Schnelle Prototypen und Ideenfindung

### Flux Dev (Fallback)

- **Geschwindigkeit**: 5-10 Sekunden
- **Qualität**: Höher als Schnell
- **Model ID**: `black-forest-labs/flux-dev`
- **Optimal für**: Finale Bilder mit mehr Details

### Flux Pro (Optional)

- **Geschwindigkeit**: 10-15 Sekunden
- **Qualität**: Höchste Qualität
- **Model ID**: `black-forest-labs/flux-pro`
- **Optimal für**: Produktionsreife Bilder

## Features

### Unterstützte Stile

- **Realistic**: Fotorealistische Darstellung
- **Fantasy**: Magische und fantastische Kunstwerke
- **Anime**: Anime/Manga-Stil
- **Concept Art**: Professionelle Konzeptkunst
- **Illustration**: Künstlerische Illustrationen

### Bildformate

- **1:1** - Quadratisch (Standard)
- **16:9** - Breitbild
- **9:16** - Hochformat
- **21:9** - Ultrawide
- **3:2, 2:3** - Fotografie-Formate
- **4:5, 5:4** - Social Media
- **3:4, 4:3** - Klassische Formate

## Technische Details

### API-Integration

```javascript
const output = await replicate.run('black-forest-labs/flux-schnell', {
	input: {
		prompt: 'Your detailed prompt here',
		num_outputs: 1,
		aspect_ratio: '1:1',
		output_format: 'webp',
		output_quality: 80
	}
});
```

### Kosten

- **Flux Schnell**: ~$0.003 pro Bild
- **Flux Dev**: ~$0.01 pro Bild
- **Flux Pro**: ~$0.05 pro Bild

## Prompt-Optimierungen

Flux reagiert besonders gut auf:

- Detaillierte Beschreibungen
- Stilangaben (z.B. "artstation quality", "8k resolution")
- Kompositionshinweise (z.B. "centered", "rule of thirds")
- Beleuchtungsangaben (z.B. "golden hour", "studio lighting")
- Qualitätsmarker (z.B. "masterpiece", "best quality")

## Workflow in Worldream

1. User erstellt Content (Character, Place, etc.)
2. Wählt Stil aus (Fantasy, Realistic, etc.)
3. Flux Schnell generiert Bild in 1-2 Sekunden
4. Bild wird in Supabase Storage gespeichert
5. Bei Fehler: Automatischer Fallback auf Flux Dev

## Umgebungsvariablen

```env
# Replicate API Token
REPLICATE_API_TOKEN=r8_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

Den API Token erhältst du unter: https://replicate.com/account/api-tokens

## Vorteile gegenüber anderen Modellen

### Vorteile von Flux Schnell

- ✅ Sehr günstig (~$0.003 pro Bild)
- ✅ Extrem schnell (1-2s)
- ✅ Open Source
- ✅ Exzellente Prompt-Befolgung
- ✅ Flexible Seitenverhältnisse

### vs. Midjourney

- ✅ API-Zugriff
- ✅ Schneller
- ✅ Günstiger
- ✅ Keine Discord-Abhängigkeit
- ❌ Weniger künstlerisch

### vs. Stable Diffusion

- ✅ Bessere Qualität out-of-the-box
- ✅ Einfachere Prompts
- ✅ Schneller
- ✅ Kein eigener Server nötig

## Dateien

- `/src/lib/ai/replicate-flux.ts` - Hauptmodul für Flux-Integration
- `/src/routes/api/ai/generate-image/+server.ts` - API-Endpunkt
- `/src/lib/components/AiImageGenerator.svelte` - Frontend-Komponente

## Weitere Ressourcen

- [Replicate Flux Dokumentation](https://replicate.com/black-forest-labs/flux-schnell)
- [Black Forest Labs](https://blackforestlabs.ai/)
- [Flux auf GitHub](https://github.com/black-forest-labs/flux)
