# Lokale LLM-Modelle für Mana

Dieses Dokument beschreibt alle verfügbaren lokalen KI-Modelle für den Mac Mini Server (M4, 16 GB RAM) und deren Einsatzmöglichkeiten.

## Aktuell Installierte Modelle

| Modell | Größe | Vision | Stärke | Status |
|--------|-------|--------|--------|--------|
| `gemma3:4b` | 3.1 GB | ✅ | Allgemein, Multilingual (140+ Sprachen) | ✅ Installiert |
| `ministral-3:3b` | 2.75 GB | ✅ | 256K Kontext, Function Calling | ✅ Installiert |
| `qwen3-vl:4b` | 3.06 GB | ✅ | GUI-Automatisierung, Visual Coding | ✅ Installiert |
| `phi3.5:latest` | 2.02 GB | ✅ | Charts & Diagramme, 128K Kontext | ✅ Installiert |
| `deepseek-ocr:latest` | 6.22 GB | ✅ | OCR-Spezialist, 200K Seiten/Tag | ✅ Installiert |

**Gesamtgröße:** ~17.15 GB
**Freier Speicher:** ~128 GB verbleibend

---

## Modell-Übersicht nach Hersteller

### Google - Gemma 3

| Eigenschaft | Details |
|-------------|---------|
| **Hersteller** | Google DeepMind |
| **Release** | 12. März 2025 |
| **Lizenz** | Gemma License (kommerziell nutzbar) |
| **Basis** | Gemini 2.0 Technologie |
| **Downloads** | 30.7M (Ollama) |

#### Verfügbare Größen

| Variante | Parameter | Download | RAM-Bedarf | Kontext |
|----------|-----------|----------|------------|---------|
| `gemma3:1b` | 1B | ~0.8 GB | ~2 GB | 32K |
| `gemma3:4b` ✅ | 4B | 3.1 GB | ~5 GB | 128K |
| `gemma3:12b` | 12B | ~8 GB | ~12 GB | 128K |
| `gemma3:27b` | 27B | ~17 GB | ~22 GB | 128K |

#### Stärken
- **Multimodal**: Verarbeitet Bilder (896×896) für VQA, OCR, Dokumentenanalyse
- **Multilingual**: 140+ Sprachen, übertrifft Llama 3 in mehrsprachigen Benchmarks
- **Effizienz**: Läuft auf einzelner GPU/TPU, optimiert für Laptops und Smartphones
- **Großer Kontext**: 128K Token Kontextfenster

#### Ideale Anwendungsfälle
- Allgemeine Bildanalyse und Beschreibung
- Mehrsprachige Konversation
- Dokumentenverständnis
- On-Device Deployment

#### Benchmarks
- Chatbot Arena Elo: 1338 (27B)
- Übertrifft vergleichbare Modelle bei 75% weniger VRAM durch Quantisierung

**Quellen:** [Google Blog](https://blog.google/technology/developers/gemma-3/), [DeepMind](https://deepmind.google/models/gemma/gemma-3/)

---

### Mistral AI - Ministral 3

| Eigenschaft | Details |
|-------------|---------|
| **Hersteller** | Mistral AI (Frankreich) |
| **Release** | 2. Dezember 2025 |
| **Lizenz** | Apache 2.0 |
| **Basis** | Mistral 3 Familie |
| **Downloads** | 314K (Ollama) |

#### Verfügbare Größen

| Variante | Parameter | Download | RAM-Bedarf | Kontext |
|----------|-----------|----------|------------|---------|
| `ministral-3:3b` ✅ | 3B | 2.75 GB | ~5 GB | 256K |
| `ministral-3:8b` | 8B | 6.0 GB | ~9 GB | 256K |
| `ministral-3:14b` | 14B | 9.1 GB | ~13 GB | 256K |

#### Stärken
- **Vision**: Bildanalyse und visuelle Inhaltsverarbeitung
- **Multilingual**: 140+ Sprachen inkl. Deutsch, Chinesisch, Arabisch
- **Agentic Functions**: Native Function Calling und JSON-Output
- **Reasoning**: Spezielle Reasoning-Varianten verfügbar (85% auf AIME '25 mit 14B)
- **Riesiger Kontext**: 256K Token (doppelt so viel wie Gemma)

#### Ideale Anwendungsfälle
- Mehrsprachige Anwendungen
- Agent-basierte Systeme mit Tool-Nutzung
- Komplexe Reasoning-Aufgaben
- Edge-Deployment auf Laptops/Robotern

#### Performance
- RTX 5090: ~385 tokens/sec (3B Instruct)
- Bestes Kosten-Leistungs-Verhältnis unter Open-Source-Modellen

**Quellen:** [Mistral AI](https://mistral.ai/news/mistral-3), [Mistral Docs](https://docs.mistral.ai/models/ministral-3-3b-25-12)

---

### Alibaba - Qwen 2.5 VL

| Eigenschaft | Details |
|-------------|---------|
| **Hersteller** | Alibaba Cloud / Qwen Team |
| **Release** | Januar 2025 |
| **Lizenz** | Apache 2.0 |
| **Downloads** | 1.2M (Ollama) |

#### Verfügbare Größen

| Variante | Parameter | Download | RAM-Bedarf | Kontext |
|----------|-----------|----------|------------|---------|
| `qwen2.5vl:3b` | 3B | ~2.5 GB | ~4 GB | 128K |
| `qwen2.5vl:7b` | 7B | ~5 GB | ~8 GB | 128K |
| `qwen2.5vl:72b` | 72B | ~45 GB | ~60 GB | 128K |

#### Stärken
- **OCR-Champion**: 96.4% auf DocVQA (besser als GPT-4o)
- **Dokumentenanalyse**: Tabellen, Charts, Diagramme, Formulare
- **Video-Verständnis**: Analysiert Videos >1 Stunde mit sekundengenauen Segmenten
- **Visual Agent**: Computer- und Smartphone-Steuerung
- **Strukturierte Ausgabe**: JSON für Rechnungen, Formulare, Tabellen

#### Ideale Anwendungsfälle
- Dokumenten-OCR und Datenextraktion
- Finanz- und Commerce-Anwendungen
- Video-Analyse und Q&A
- Automatisierte Formularverarbeitung

#### Benchmarks
- DocVQA: 96.4% (Bestwert)
- OCRBenchV2 EN: 63.7% (>20 Punkte über GPT-4o)
- MMMU: 70.2% (gleichauf mit Claude 3.5 Sonnet)

**Quellen:** [Qwen Blog](https://qwenlm.github.io/blog/qwen2.5-vl/), [Alibaba Cloud](https://www.alibabacloud.com/blog/unlocking-the-future-of-ai-with-qwen-2-5-vl-where-vision-meets-language_602123)

---

### Alibaba - Qwen 3 VL

| Eigenschaft | Details |
|-------------|---------|
| **Hersteller** | Alibaba Cloud / Qwen Team |
| **Release** | September-Oktober 2025 |
| **Lizenz** | Apache 2.0 |
| **Downloads** | 1.2M (Ollama) |

#### Verfügbare Größen

| Variante | Parameter | Download | RAM-Bedarf | Kontext |
|----------|-----------|----------|------------|---------|
| `qwen3-vl:2b` | 2B | ~1.5 GB | ~3 GB | 256K |
| `qwen3-vl:4b` | 4B | ~3 GB | ~5 GB | 256K |
| `qwen3-vl:8b` | 8B | ~6 GB | ~9 GB | 256K |
| `qwen3-vl:32b` | 32B | ~20 GB | ~26 GB | 256K |

#### Stärken
- **Visual Agent**: PC/Mobile GUI-Steuerung, Tool-Nutzung
- **Visual Coding**: Generiert Draw.io/HTML/CSS/JS aus Bildern/Videos
- **3D Spatial Perception**: Objektpositionen, Blickwinkel, Verdeckungen
- **OCR**: 32 Sprachen (vs. 19 bei Vorgänger), robust bei schlechtem Licht
- **Multimodal Reasoning**: Exzellent in STEM/Mathematik

#### Ideale Anwendungsfälle
- GUI-Automatisierung und RPA
- Code-Generierung aus Mockups
- 3D-Szenenverständnis für Robotik
- Wissenschaftliche Dokumentenanalyse

**Quellen:** [GitHub Qwen3-VL](https://github.com/QwenLM/Qwen3-VL), [Ollama](https://ollama.com/library/qwen3-vl)

---

### Moondream

| Eigenschaft | Details |
|-------------|---------|
| **Hersteller** | Moondream (Open Source) |
| **Release** | Kontinuierliche Updates seit 2024 |
| **Lizenz** | Apache 2.0 |
| **Downloads** | 571K (Ollama) |

#### Verfügbare Größen

| Variante | Parameter | Download | RAM-Bedarf | Kontext |
|----------|-----------|----------|------------|---------|
| `moondream` | 1.86B | ~1.5 GB | ~3 GB | 8K |
| `moondream:0.5b` | 0.5B | ~0.5 GB | ~1 GB | 8K |

#### Stärken
- **Ultrakompakt**: Läuft auf CPU und Raspberry Pi
- **Spezialisierte Skills**: Object Detection, Pointing, Counting, OCR
- **Strukturierte Ausgabe**: JSON, XML, Markdown, CSV
- **Grounded Reasoning**: Räumliches Denken über Bildpositionen
- **Gaze Detection**: Blickrichtungserkennung

#### Ideale Anwendungsfälle
- Edge-Devices und IoT
- Robotik und Embedded Systems
- Echtzeit-Objekterkennung
- Ressourcenbeschränkte Umgebungen

#### Benchmarks (2025-04-14 Release)
- ScreenSpot UI: F1@0.5 von 60.3 auf 80.4
- CountBenchQA: 80 auf 86.4
- OCRBench: 58.3 auf 61.2
- Inferenz: 123.4 tok/s auf RTX 3090 (mit compile())

**Quellen:** [Moondream](https://moondream.ai/), [Hugging Face](https://huggingface.co/vikhyatk/moondream2)

---

### DeepSeek - OCR

| Eigenschaft | Details |
|-------------|---------|
| **Hersteller** | DeepSeek AI (China) |
| **Release** | 20. Oktober 2025 |
| **Lizenz** | MIT |
| **Downloads** | 124K (Ollama) |

#### Verfügbare Größen

| Variante | Parameter | Download | RAM-Bedarf | Kontext |
|----------|-----------|----------|------------|---------|
| `deepseek-ocr:3b` | 3B | ~2 GB | ~4 GB | 16K |

#### Stärken
- **Extreme Kompression**: Speichert Text als Bilder, spart 90%+ Tokens
- **OCR-Präzision**: 97% bei <10x Kompression, 60% bei 20x
- **Durchsatz**: 200K+ Seiten/Tag auf einzelner GPU
- **Innovative Architektur**: DeepEncoder + DeepSeek3B-MoE

#### Ideale Anwendungsfälle
- Massenhafte Dokumentendigitalisierung
- Archiv-Scanning
- PDF-zu-Text Konvertierung
- Langzeit-Dokumentenspeicherung

#### Performance-Modi
- Tiny: 64 Tokens @ 512×512
- Small: 100 Tokens @ 640×640
- Base: 256 Tokens @ 1024×1024
- Large: 400 Tokens @ 1280×1280

**Quellen:** [GitHub DeepSeek-OCR](https://github.com/deepseek-ai/DeepSeek-OCR), [MIT Technology Review](https://www.technologyreview.com/2025/10/29/1126932/deepseek-ocr-visual-compression/)

---

### IBM - Granite 3.2 Vision

| Eigenschaft | Details |
|-------------|---------|
| **Hersteller** | IBM |
| **Release** | 26. Februar 2025 |
| **Lizenz** | Apache 2.0 |
| **Downloads** | 684K (Ollama) |

#### Verfügbare Größen

| Variante | Parameter | Download | RAM-Bedarf | Kontext |
|----------|-----------|----------|------------|---------|
| `granite3.2-vision:2b` | 2B | ~1.5 GB | ~3 GB | 128K |

#### Stärken
- **Enterprise-fokussiert**: Speziell für Geschäftsdokumente trainiert
- **Dokumentenverständnis**: Tabellen, Charts, Flowcharts, Diagramme
- **OCR-Champion**: Platz 2 auf OCRBench Leaderboard
- **Synthetische Daten**: 85M PDFs, 26M synthetische QA-Paare

#### Ideale Anwendungsfälle
- Enterprise-Dokumentenverarbeitung
- Business Intelligence aus Dokumenten
- Automatisierte Berichtsanalyse
- Compliance-Dokumentenprüfung

#### Benchmarks
- Vergleichbar mit Llama 3.2 11B und Pixtral 12B bei 1/5 der Größe
- DocVQA, ChartQA, AI2D, OCRBench: Top-Performance

**Quellen:** [IBM Newsroom](https://newsroom.ibm.com/2025-02-26-ibm-expands-granite-model-family-with-new-multi-modal-and-reasoning-ai-built-for-the-enterprise), [Hugging Face](https://huggingface.co/ibm-granite/granite-vision-3.2-2b)

---

### OpenBMB - MiniCPM-V

| Eigenschaft | Details |
|-------------|---------|
| **Hersteller** | OpenBMB / Tsinghua University |
| **Release** | Kontinuierlich seit Februar 2024 |
| **Lizenz** | Apache 2.0 |
| **Downloads** | 4.5M (Ollama) |

#### Verfügbare Größen

| Variante | Parameter | Download | RAM-Bedarf | Kontext |
|----------|-----------|----------|------------|---------|
| `minicpm-v` | 8B | ~5 GB | ~8 GB | 32K |

#### Stärken
- **GPT-4o Level**: Übertrifft GPT-4o-latest und Gemini-2.0 Pro
- **Video-Verständnis**: Bis zu 96x Kompression für Video-Tokens
- **Hybrid Thinking**: Umschaltbar zwischen schnellem und tiefem Denken
- **Handschrift-OCR**: Exzellent bei handgeschriebenen Texten
- **Mobile-optimiert**: 17 tok/s auf iPhone 16 Pro Max

#### Ideale Anwendungsfälle
- Mobile KI-Anwendungen
- Video-Analyse und Zusammenfassung
- Handschrift-Digitalisierung
- Real-time Multimodal-Streaming

#### Versionshistorie
- **Feb 2024**: MiniCPM-V 1.0
- **Mai 2024**: MiniCPM-Llama3-V 2.5 (GPT-4V Level, 30+ Sprachen)
- **Aug 2024**: MiniCPM-V 2.6 (Echtzeit-Video auf iPad)
- **Jan 2025**: MiniCPM-o 2.6 (Sprache + Vision)
- **2025**: MiniCPM-V 4.5 (aktuell)

**Quellen:** [GitHub MiniCPM-V](https://github.com/openbmb/minicpm-v)

---

### Meta - Llama 3.2 Vision

| Eigenschaft | Details |
|-------------|---------|
| **Hersteller** | Meta AI |
| **Release** | 25. September 2024 |
| **Lizenz** | Llama 3.2 Community License |
| **Downloads** | Millionen (verschiedene Plattformen) |

#### Verfügbare Größen

| Variante | Parameter | Download | RAM-Bedarf | Kontext |
|----------|-----------|----------|------------|---------|
| `llama3.2-vision:11b` | 11B | ~7 GB | ~12 GB | 128K |
| `llama3.2-vision:90b` | 90B | ~55 GB | ~70 GB | 128K |

#### Stärken
- **High-Resolution**: Bis zu 1120×1120 Pixel
- **Dokumente**: Charts, Graphen, Handschrift-OCR
- **Visual Grounding**: Objektlokalisierung per natürlicher Sprache
- **Multilingual**: DE, FR, IT, PT, HI, ES, TH offiziell unterstützt

#### Ideale Anwendungsfälle
- Dokumenten-Verständnis und Extraktion
- Bildunterschriften-Generierung
- Visuelle Assistenz
- Datenextraktion aus Bildern

#### Training
- 6B Bild-Text-Paare
- 2.02M GPU-Stunden auf H100-80GB

**Quellen:** [Meta AI Blog](https://ai.meta.com/blog/llama-3-2-connect-2024-vision-edge-mobile-devices/), [Hugging Face](https://huggingface.co/meta-llama/Llama-3.2-11B-Vision)

---

### Microsoft - Phi-3 Vision

| Eigenschaft | Details |
|-------------|---------|
| **Hersteller** | Microsoft Research |
| **Release** | 21. Mai 2024 (Phi-3), August 2024 (Phi-3.5) |
| **Lizenz** | MIT |
| **Downloads** | 183K (llava-phi3 auf Ollama) |

#### Verfügbare Größen

| Variante | Parameter | Download | RAM-Bedarf | Kontext |
|----------|-----------|----------|------------|---------|
| `llava-phi3` | 3.8B | ~2.5 GB | ~5 GB | 4K |
| `phi3.5-vision` | 4.2B | ~2.8 GB | ~5 GB | 128K |

#### Stärken
- **Kompakt & Leistungsstark**: Übertrifft Claude-3 Haiku und Gemini 1.0 Pro V
- **Charts & Diagramme**: Besonders stark bei nicht-natürlichen Bildern
- **Multi-Frame**: Bildvergleich, Zusammenfassung, Video-Analyse
- **Synthetische Daten**: Hochwertige, reasoning-dichte Trainingsdaten

#### Ideale Anwendungsfälle
- Chart- und Diagramm-Analyse
- Technische Dokumentation
- Business-Präsentationen
- Edge-Deployment

#### Benchmarks (Phi-3.5)
- MMMU: 40.2 → 43.0
- MMBench: 80.5 → 81.9
- TextVQA: 70.9 → 72.0

**Quellen:** [Microsoft Azure Blog](https://azure.microsoft.com/en-us/blog/new-models-added-to-the-phi-3-family-available-on-microsoft-azure/), [Hugging Face](https://huggingface.co/microsoft/Phi-3.5-vision-instruct)

---

### LLaVA (Large Language and Vision Assistant)

| Eigenschaft | Details |
|-------------|---------|
| **Hersteller** | University of Wisconsin-Madison / Microsoft |
| **Release** | April 2023 (Original), kontinuierliche Updates |
| **Lizenz** | Apache 2.0 |
| **Downloads** | Millionen (Pionier-Modell) |

#### Verfügbare Varianten

| Variante | Release | Basis | Besonderheit |
|----------|---------|-------|--------------|
| LLaVA 1.0 | Apr 2023 | Vicuna 7B | Original |
| LLaVA 1.5 | Okt 2023 | Vicuna 13B | Verbesserte Performance |
| LLaVA-NeXT | Jan 2024 | Verschiedene | 4x mehr Pixel, 3 Aspect Ratios |
| LLaVA-OneVision | Aug 2024 | 0.5B/7B/72B | SOTA auf 47 Benchmarks |
| LLaVA-Mini | 2025 | Effizient | 1 Token pro Bild, 77% weniger FLOPs |

#### Stärken
- **Pionier**: Erstes weit verbreitetes Vision-Language-Modell
- **Vielseitig**: VQA, Captioning, kreative Textgenerierung
- **Gut dokumentiert**: Umfangreiche Forschung und Community
- **Viele Varianten**: Für jeden Anwendungsfall optimiert

#### Ideale Anwendungsfälle
- Akademische Forschung
- Prototyping von Vision-Anwendungen
- Benchmark-Vergleiche
- Finetuning für spezifische Domains

**Quellen:** [LLaVA Website](https://llava-vl.github.io/), [GitHub](https://github.com/haotian-liu/LLaVA)

---

## Empfehlungen nach Anwendungsfall

### Für Mac Mini M4 (16 GB RAM)

| Anwendungsfall | Empfohlenes Modell | Alternativ |
|----------------|-------------------|------------|
| **Allgemeine Bildanalyse** | `gemma3:4b` ✅ | `ministral-3:3b` |
| **OCR / Dokumenten-Scan** | `qwen2.5vl:3b` | `deepseek-ocr:3b` |
| **Mehrsprachig** | `ministral-3:3b` ✅ | `gemma3:4b` |
| **Ultrakompakt / Edge** | `moondream` | `gemma3:1b` |
| **Enterprise-Dokumente** | `granite3.2-vision:2b` | `qwen2.5vl:3b` |
| **Video-Analyse** | `minicpm-v` | `qwen3-vl:4b` |
| **GUI-Automatisierung** | `qwen3-vl:4b` | `ministral-3:8b` |
| **Reasoning** | `ministral-3:8b` | `qwen3-vl:8b` |

### Performance-Vergleich (geschätzt auf M4)

| Modell | Tokens/Sek | First Token | RAM |
|--------|------------|-------------|-----|
| `moondream` | ~80-100 | <1s | ~3 GB |
| `gemma3:4b` | ~50-60 | ~1s | ~5 GB |
| `ministral-3:3b` | ~50-60 | ~1s | ~5 GB |
| `qwen2.5vl:3b` | ~45-55 | ~1s | ~4 GB |
| `minicpm-v` | ~30-40 | ~2s | ~8 GB |

---

## Installationsbefehle

```bash
# Aktuell installiert
ollama pull gemma3:4b
ollama pull ministral-3:3b

# Empfohlene Erweiterungen
ollama pull qwen2.5vl:3b      # OCR-Champion
ollama pull moondream          # Ultrakompakt
ollama pull granite3.2-vision:2b  # Enterprise

# Optional (mehr RAM benötigt)
ollama pull ministral-3:8b    # Besseres Reasoning
ollama pull minicpm-v         # Video-Analyse
ollama pull qwen3-vl:4b       # GUI-Automatisierung
```

---

## Quellen und Weiterführende Links

### Offizielle Dokumentation
- [Ollama Model Library](https://ollama.com/library)
- [Ollama Vision Models](https://ollama.com/search?c=vision)

### Hersteller-Seiten
- [Google Gemma](https://ai.google.dev/gemma)
- [Mistral AI](https://mistral.ai/)
- [Qwen (Alibaba)](https://qwenlm.github.io/)
- [Moondream](https://moondream.ai/)
- [DeepSeek](https://www.deepseek.com/)
- [IBM Granite](https://www.ibm.com/granite)
- [Meta Llama](https://www.llama.com/)
- [Microsoft Phi](https://azure.microsoft.com/en-us/products/phi)
- [LLaVA](https://llava-vl.github.io/)

### Benchmarks und Vergleiche
- [Open VLM Leaderboard](https://huggingface.co/spaces/opencompass/open_vlm_leaderboard)
- [OCRBench Leaderboard](https://github.com/Yuliang-Liu/MultimodalOCR)
- [MMMU Benchmark](https://mmmu-benchmark.github.io/)

---

*Zuletzt aktualisiert: 26. Januar 2026*
