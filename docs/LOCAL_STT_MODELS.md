# Lokale Speech-to-Text (STT) Modelle

Dieses Dokument beschreibt alle verfügbaren Speech-to-Text Modelle, die lokal auf dem Mac Mini Server (M4, 16 GB RAM) oder anderen Geräten gehostet werden können.

## Inhaltsverzeichnis

- [Übersicht & Empfehlungen](#übersicht--empfehlungen)
- [OpenAI Whisper Familie](#openai-whisper-familie)
- [Whisper-Implementierungen](#whisper-implementierungen)
- [Mistral Voxtral](#mistral-voxtral)
- [NVIDIA NeMo Modelle](#nvidia-nemo-modelle)
- [Moonshine](#moonshine)
- [Vosk](#vosk)
- [Meta Wav2Vec2 & SeamlessM4T](#meta-wav2vec2--seamlessm4t)
- [SpeechBrain](#speechbrain)
- [Deutsche Sprachunterstützung](#deutsche-sprachunterstützung)
- [Vergleichstabellen](#vergleichstabellen)
- [Empfehlungen für Mac Mini M4](#empfehlungen-für-mac-mini-m4)

---

## Übersicht & Empfehlungen

### Quick-Start Empfehlung

| Anwendungsfall | Empfohlenes Modell | Warum |
|----------------|-------------------|-------|
| **Beste Qualität (Multilingual)** | Whisper Large V3 | Gold-Standard, 99+ Sprachen |
| **Schnell & Gut** | Whisper Large V3 Turbo | 6x schneller, ~1% weniger genau |
| **Apple Silicon optimiert** | Lightning Whisper MLX | 10x schneller als whisper.cpp |
| **Echtzeit/Streaming** | NVIDIA Parakeet TDT | Niedrigste Latenz |
| **Edge/Raspberry Pi** | Moonshine Tiny | 27M Parameter, CPU-fähig |
| **Offline (20+ Sprachen)** | Vosk | 50MB Modelle, kein Internet |
| **Translation + ASR** | SeamlessM4T v2 | 100 Sprachen, Speech-to-Speech |
| **Beste Deutsch-Qualität** | NVIDIA Canary 1B | Explizit für EU-Sprachen optimiert |
| **Lokal + Open Source** | Voxtral Mini (3B) | Apache 2.0, 8 Sprachen, kompakt |

---

## OpenAI Whisper Familie

### Überblick

| Eigenschaft | Details |
|-------------|---------|
| **Hersteller** | OpenAI |
| **Erstveröffentlichung** | September 2022 |
| **Lizenz** | MIT |
| **Sprachen** | 99+ Sprachen |
| **Architektur** | Encoder-Decoder Transformer |

### Modellvarianten

| Modell | Parameter | Größe | VRAM | Relative Geschw. | WER (LibriSpeech) |
|--------|-----------|-------|------|------------------|-------------------|
| `tiny` | 39M | 75 MB | ~1 GB | 32x | ~8% |
| `tiny.en` | 39M | 75 MB | ~1 GB | 32x | ~6% |
| `base` | 74M | 142 MB | ~1 GB | 16x | ~5.5% |
| `base.en` | 74M | 142 MB | ~1 GB | 16x | ~4.8% |
| `small` | 244M | 466 MB | ~2 GB | 6x | ~4.2% |
| `small.en` | 244M | 466 MB | ~2 GB | 6x | ~3.4% |
| `medium` | 769M | 1.5 GB | ~5 GB | 2x | ~3.5% |
| `medium.en` | 769M | 1.5 GB | ~5 GB | 2x | ~3.0% |
| `large` | 1.55B | 2.9 GB | ~10 GB | 1x | ~2.9% |
| `large-v2` | 1.55B | 2.9 GB | ~10 GB | 1x | ~2.7% |
| `large-v3` | 1.55B | 2.9 GB | ~10 GB | 1x | ~2.5% |
| `large-v3-turbo` | 809M | 1.6 GB | ~6 GB | 6x | ~2.6% |

### Whisper Large V3 (Gold-Standard)

| Eigenschaft | Details |
|-------------|---------|
| **Release** | November 2023 |
| **Parameter** | 1.55 Milliarden |
| **Encoder** | 32 Schichten |
| **Decoder** | 32 Schichten |
| **Kontext** | 30 Sekunden Audio-Chunks |
| **Sampling Rate** | 16 kHz |

**Stärken:**
- Höchste Genauigkeit bei allen Sprachen
- Robustheit gegen Hintergrundgeräusche
- Unterstützt Transkription + Übersetzung
- Timestamps auf Wort-Ebene

**Schwächen:**
- Langsam ohne GPU-Beschleunigung
- Hoher VRAM-Bedarf (~10 GB)
- Verarbeitet immer 30-Sekunden-Chunks

### Whisper Large V3 Turbo

| Eigenschaft | Details |
|-------------|---------|
| **Release** | Oktober 2024 |
| **Parameter** | 809 Millionen |
| **Encoder** | 32 Schichten |
| **Decoder** | 4 Schichten (reduziert von 32) |
| **Geschwindigkeit** | 6x schneller als Large V3 |
| **VRAM** | ~6 GB |

**Stärken:**
- Dramatisch schneller bei minimaler Qualitätseinbuße (~1-2% WER)
- Multilingual wie Large V3
- Ideal für Batch-Verarbeitung

**Schwächen:**
- Etwas schlechter bei sehr langen Audios
- Weniger stabil bei schwierigen Akzenten

---

## Whisper-Implementierungen

### Faster-Whisper (SYSTRAN)

| Eigenschaft | Details |
|-------------|---------|
| **Basis** | CTranslate2 (C++ Inferenz) |
| **Geschwindigkeit** | 4x schneller als Original Whisper |
| **VRAM** | 50% weniger durch INT8 Quantisierung |
| **GitHub** | [SYSTRAN/faster-whisper](https://github.com/SYSTRAN/faster-whisper) |

**Benchmarks (13 Min Audio, GPU):**

| Variante | Zeit | VRAM |
|----------|------|------|
| faster-whisper int8 | 52.6s | 2.95 GB |
| faster-distil-large-v3 fp16 | 26.1s | 2.41 GB |
| faster-distil-large-v3 int8 | 22.5s | 1.48 GB |
| faster-large-v3-turbo fp16 | 19.2s | 2.54 GB |
| faster-large-v3-turbo int8 | 19.6s | 1.55 GB |

**Installation:**
```bash
pip install faster-whisper
```

### Distil-Whisper (Hugging Face)

| Eigenschaft | Details |
|-------------|---------|
| **Hersteller** | Hugging Face |
| **Parameter** | 756M (distil-large-v3) |
| **Decoder** | 2 Schichten |
| **Sprachen** | Nur Englisch |
| **Geschwindigkeit** | 6x schneller als Large V3 |

**Varianten:**
- `distil-whisper/distil-large-v2` - Englisch
- `distil-whisper/distil-large-v3` - Englisch
- `distil-whisper/distil-large-v3.5` - Neueste Version, 1.5x schneller als Turbo

**Stärken:**
- Kleinster Footprint bei hoher Qualität
- Ideal für Englisch-only Anwendungen
- Knowledge Distillation von Large V3

**Schwächen:**
- Keine Multilingual-Unterstützung
- Nicht für Übersetzung geeignet

### Insanely-Fast-Whisper

| Eigenschaft | Details |
|-------------|---------|
| **Basis** | Hugging Face Transformers + Flash Attention |
| **Geschwindigkeit** | 150 Min Audio in <98 Sek (A100) |
| **GPU** | CUDA und MPS (Apple Silicon) |
| **GitHub** | [Vaibhavs10/insanely-fast-whisper](https://github.com/Vaibhavs10/insanely-fast-whisper) |

**Installation:**
```bash
pipx install insanely-fast-whisper
insanely-fast-whisper --file audio.mp3 --device-id mps
```

**Apple Silicon Hinweis:**
- MPS-Backend weniger optimiert als CUDA
- Empfohlen: `--batch-size 4` (~12 GB GPU VRAM)

### Lightning Whisper MLX (Apple Silicon)

| Eigenschaft | Details |
|-------------|---------|
| **Optimiert für** | Apple Silicon (M1/M2/M3/M4) |
| **Framework** | Apple MLX |
| **Geschwindigkeit** | 10x schneller als whisper.cpp, 4x schneller als mlx-whisper |
| **GitHub** | [mustafaaljadery/lightning-whisper-mlx](https://github.com/mustafaaljadery/lightning-whisper-mlx) |

**Unterstützte Modelle:**
- tiny, small, distil-small.en
- base, medium, distil-medium.en
- large, large-v2, distil-large-v2
- large-v3, distil-large-v3

**Installation:**
```bash
pip install lightning-whisper-mlx
```

**Nutzung:**
```python
from lightning_whisper_mlx import LightningWhisperMLX

whisper = LightningWhisperMLX(model="distil-large-v3", batch_size=12)
text = whisper.transcribe(audio_path="audio.mp3")
```

### WhisperX

| Eigenschaft | Details |
|-------------|---------|
| **Features** | Alignment (Wort-Timing) + Diarization (Sprecher-Erkennung) |
| **Basis** | Faster-Whisper + pyannote |
| **GitHub** | [m-bain/whisperX](https://github.com/m-bain/whisperX) |

**Stärken:**
- Präzise Wort-Level Timestamps
- Sprecher-Identifikation
- Ideal für Untertitel, Meeting-Transkripte

**Schwächen:**
- Langsamer (mehrere Modelle pro Audio)
- Höherer Ressourcenbedarf

---

## Mistral Voxtral

### Überblick

| Eigenschaft | Details |
|-------------|---------|
| **Hersteller** | Mistral AI |
| **Release** | Juli 2025 |
| **Lizenz** | Apache 2.0 |
| **Architektur** | Multimodale Audio-Text Transformer |
| **Sprachen** | 8 Sprachen |
| **Max. Audiodauer** | 30 Minuten pro Anfrage |
| **Kontext** | 32K Token |
| **Modellseite** | [mistral.ai/voxtral](https://mistral.ai/news/voxtral/) |

### Modellvarianten

| Modell | Parameter | Größe | VRAM | Verwendung |
|--------|-----------|-------|------|------------|
| **Voxtral Small** | 24B | ~48 GB | ~30 GB | Produktions-Server, höchste Qualität |
| **Voxtral Mini** | 3B | ~6 GB | ~4 GB | Edge-Deployment, Mac Mini geeignet |

### Voxtral Small (24B)

| Eigenschaft | Details |
|-------------|---------|
| **Basis** | Mistral Small 3.1 (Instruction-tuned) |
| **Audio-Encoder** | Multimodale Audio-Wahrnehmung |
| **Parameter** | 24 Milliarden |
| **Performance** | SOTA auf den meisten Benchmarks |

**Benchmarks vs. Konkurrenz:**

| Benchmark | Voxtral Small | Whisper Large V3 | GPT-4o Mini | Gemini 2.5 Flash |
|-----------|--------------|------------------|-------------|------------------|
| LibriSpeech | ✅ Besser | Referenz | - | - |
| CommonVoice | ✅ Besser | Referenz | ✅ Besser | ✅ Besser |
| Deutsch (CV) | ~6-8% WER | ~8-10% WER | ~7% WER | ~7% WER |
| Multilingual | ✅ | ✅ | ✅ | ✅ |

**Stärken:**
- Übertrifft Whisper Large V3 bei den meisten Tasks
- Unterstützt bis zu 30 Min Audio in einem API-Aufruf
- Transkription + Audio-zu-Text-Interaktion
- Reasoning über Audio-Inhalte möglich
- Apache 2.0 - vollständig Open Source

**Schwächen:**
- Sehr großes Modell (24B Parameter)
- Erfordert High-End Hardware für lokale Nutzung
- Noch kein Ollama-Support (Stand Jan 2026)

### Voxtral Mini (3B)

| Eigenschaft | Details |
|-------------|---------|
| **Parameter** | 3 Milliarden |
| **Zielgruppe** | Edge/On-Device Deployment |
| **VRAM** | ~4 GB |
| **Geschwindigkeit** | ~5x schneller als Voxtral Small |

**Stärken:**
- Läuft auf Consumer-Hardware (Mac Mini M4 geeignet)
- Gute Balance aus Qualität und Geschwindigkeit
- Apache 2.0 Lizenz
- Kompakt genug für lokale Installation

**Schwächen:**
- Weniger genau als Voxtral Small
- Derzeit noch keine offiziellen Benchmarks veröffentlicht

### Unterstützte Sprachen

| Sprache | Qualität | Anmerkung |
|---------|----------|-----------|
| Englisch | ⭐⭐⭐⭐⭐ | Primärsprache |
| Deutsch | ⭐⭐⭐⭐ | Sehr gut unterstützt |
| Französisch | ⭐⭐⭐⭐⭐ | Primärsprache (Mistral ist französisch) |
| Spanisch | ⭐⭐⭐⭐ | Gut unterstützt |
| Portugiesisch | ⭐⭐⭐⭐ | Gut unterstützt |
| Italienisch | ⭐⭐⭐⭐ | Gut unterstützt |
| Niederländisch | ⭐⭐⭐ | Unterstützt |
| Hindi | ⭐⭐⭐ | Unterstützt |

### Installation (wenn Ollama-Support verfügbar)

```bash
# Sobald Ollama-Support verfügbar ist (geschätzt Q1 2026):
ollama pull voxtral-mini:3b

# Alternativ über Hugging Face Transformers:
pip install transformers torch
```

### Nutzung über Mistral API

```python
from mistralai import Mistral
import base64

client = Mistral(api_key="your-api-key")

# Audio als Base64 kodieren
with open("audio.mp3", "rb") as f:
    audio_base64 = base64.b64encode(f.read()).decode()

response = client.chat.complete(
    model="voxtral-small-latest",
    messages=[{
        "role": "user",
        "content": [
            {"type": "audio_url", "audio_url": f"data:audio/mp3;base64,{audio_base64}"},
            {"type": "text", "text": "Transkribiere dieses Audio auf Deutsch."}
        ]
    }]
)
print(response.choices[0].message.content)
```

---

## NVIDIA NeMo Modelle

### NVIDIA Parakeet

| Eigenschaft | Details |
|-------------|---------|
| **Hersteller** | NVIDIA |
| **Architektur** | FastConformer Encoder + CTC/RNN-T/TDT Decoder |
| **Lizenz** | CC-BY-4.0 |
| **Trainingsdaten** | 64.000 Stunden (öffentlich + proprietär) |

**Modellvarianten:**

| Modell | Parameter | Geschwindigkeit (RTFx) | Genauigkeit |
|--------|-----------|------------------------|-------------|
| Parakeet-CTC-0.6B | 600M | ~1500 | Gut |
| Parakeet-TDT-0.6B-v3 | 600M | ~2000+ | Gut |
| Parakeet-RNNT-1.1B | 1.1B | ~800 | Sehr gut |

**Stärken:**
- Extrem schnell (6.5x schneller als andere Modelle)
- Unterstützt bis zu 24 Min Audio in einem Pass
- Automatische Spracherkennung
- Robust gegen Musik und Stille

**Hardware:**
- Bis zu 11 Stunden Audio auf A100 80GB
- Lokale Inferenz auf Consumer-GPUs möglich

### NVIDIA Canary

| Eigenschaft | Details |
|-------------|---------|
| **Architektur** | FastConformer Encoder + Transformer Decoder |
| **Parameter** | 1B (Canary-1B-v2) |
| **Sprachen** | 25 Sprachen (EU + Russisch, Ukrainisch) |
| **Tasks** | ASR + Übersetzung |
| **VRAM** | ~6 GB minimum |

**Unterstützte Sprachen:**
Bulgarisch, Kroatisch, Tschechisch, Dänisch, Niederländisch, Englisch, Estnisch, Finnisch, Französisch, Deutsch, Griechisch, Ungarisch, Italienisch, Lettisch, Litauisch, Maltesisch, Polnisch, Portugiesisch, Rumänisch, Slowakisch, Slowenisch, Spanisch, Schwedisch, Russisch, Ukrainisch

**Performance:**
- Übertrifft Whisper Large V3 auf FLEURS
- RTFx von 749 (7-10x schneller als andere Modelle)
- 20%-33% relative Verbesserung auf BABEL, MLS, CommonVoice

---

## Moonshine

| Eigenschaft | Details |
|-------------|---------|
| **Hersteller** | Useful Sensors |
| **Release** | Oktober 2024 |
| **Lizenz** | Moonshine AI Community License (kostenlos für <$1M Umsatz) |
| **Architektur** | Encoder-Decoder Transformer mit RoPE |
| **Trainingsdaten** | 200.000 Stunden Audio |
| **GitHub** | [usefulsensors/moonshine](https://github.com/usefulsensors/moonshine) |

### Modellvarianten

| Modell | Parameter | Größe | Geschwindigkeit vs Whisper |
|--------|-----------|-------|---------------------------|
| `moonshine-tiny` | 27.1M | ~190 MB | 5-10x schneller |
| `moonshine-base` | 61.5M | ~400 MB | 5x schneller |

**Vergleich mit Whisper:**

| Modell | Parameter |
|--------|-----------|
| Moonshine Tiny | 27.1M |
| Whisper tiny.en | 37.8M |
| Moonshine Base | 61.5M |
| Whisper base.en | 72.6M |

**Stärken:**
- Skaliert Verarbeitung mit Audio-Länge (keine 30-Sek-Chunks)
- Läuft auf Edge-Devices (Raspberry Pi, Smartphones)
- Kein Internet erforderlich
- Bessere Genauigkeit als vergleichbare Whisper-Modelle

**Schwächen:**
- Nur Englisch (Basismodelle)
- Kleinere Community als Whisper

**Installation:**
```bash
pip install moonshine
```

---

## Vosk

| Eigenschaft | Details |
|-------------|---------|
| **Hersteller** | Alpha Cephei |
| **Lizenz** | Apache 2.0 |
| **Sprachen** | 20+ Sprachen |
| **Modellgröße** | 50 MB (portabel) - mehrere GB (Server) |
| **GitHub** | [alphacep/vosk-api](https://github.com/alphacep/vosk-api) |

### Unterstützte Sprachen

Englisch, Indisches Englisch, Deutsch, Französisch, Spanisch, Portugiesisch, Chinesisch, Russisch, Türkisch, Vietnamesisch, Italienisch, Niederländisch, Katalanisch, Arabisch, Griechisch, Farsi, Filipino, Ukrainisch, Kasachisch, Schwedisch, Japanisch, Esperanto, Hindi, Tschechisch, Polnisch, Usbekisch, Koreanisch, Bretonisch, Gujarati, Tadschikisch, Telugu, Kirgisisch

### Modellgrößen

| Typ | Größe | Verwendung |
|-----|-------|------------|
| Tiny | ~50 MB | Mobil, Embedded |
| Small | ~200 MB | Desktop |
| Large | 1-2 GB | Server |

**Stärken:**
- Vollständig offline
- Sehr kleine Modelle verfügbar
- Echtzeit-Streaming
- Läuft auf Raspberry Pi, Android, iOS
- WebSocket/gRPC Server-Modus
- Sprecher-Identifikation
- Anpassbares Vokabular

**Schwächen:**
- Geringere Genauigkeit als Whisper
- Ältere Architektur

**Installation:**
```bash
pip install vosk
```

---

## Meta Wav2Vec2 & SeamlessM4T

### Wav2Vec2 / XLS-R

| Eigenschaft | Details |
|-------------|---------|
| **Hersteller** | Meta AI (Facebook) |
| **Architektur** | Self-supervised Pre-training |
| **Trainingsdaten** | 436.000 Stunden (XLS-R) |
| **Sprachen** | 128 Sprachen |

**Modellvarianten:**

| Modell | Parameter | Verwendung |
|--------|-----------|------------|
| wav2vec2-base | 95M | Englisch |
| wav2vec2-large | 317M | Englisch |
| XLS-R-300M | 300M | Multilingual |
| XLS-R-1B | 1B | Multilingual |
| XLS-R-2B | 2B | Multilingual |

**Stärken:**
- Exzellent für Low-Resource Sprachen
- Gute Basis für Fine-Tuning
- 20%-33% Verbesserung über Prior-SOTA

**Schwächen:**
- Muss für ASR fine-tuned werden
- Nicht out-of-the-box nutzbar

### SeamlessM4T v2

| Eigenschaft | Details |
|-------------|---------|
| **Hersteller** | Meta AI |
| **Release** | Dezember 2023 (v2) |
| **Lizenz** | CC-BY-NC-4.0 |
| **Architektur** | UnitY2 (Multimodal) |
| **Trainingsdaten** | 1M Stunden Sprache, 470K Stunden Übersetzungen |
| **GitHub** | [facebookresearch/seamless_communication](https://github.com/facebookresearch/seamless_communication) |

**Unterstützte Tasks:**

| Task | Input | Output |
|------|-------|--------|
| ASR | Sprache | Text |
| S2TT | Sprache | Text (andere Sprache) |
| S2ST | Sprache | Sprache (andere Sprache) |
| T2TT | Text | Text (andere Sprache) |
| T2ST | Text | Sprache (andere Sprache) |

**Sprachen:** ~100 Sprachen für Spracheingabe, 200+ für Text

**Stärken:**
- All-in-One Lösung für Übersetzung
- Speech-to-Speech ohne Zwischenschritt
- Erhält Prosodie und Sprechstil (SeamlessExpressive)
- 20% BLEU Verbesserung über SOTA

**Schwächen:**
- Sehr große Modelle
- Hoher Ressourcenbedarf
- Non-Commercial Lizenz

---

## SpeechBrain

| Eigenschaft | Details |
|-------------|---------|
| **Typ** | Toolkit / Framework |
| **Basis** | PyTorch |
| **Lizenz** | Apache 2.0 |
| **GitHub** | [speechbrain/speechbrain](https://github.com/speechbrain/speechbrain) |
| **Community** | 7.3K GitHub Stars, 140+ Entwickler |

### Unterstützte Tasks

- Automatic Speech Recognition (ASR)
- Speaker Recognition
- Speech Enhancement
- Speech Separation
- Language Modeling
- Text-to-Speech
- Dialogue Systems

### Vortrainierte Modelle

- 200+ Trainingsrezepte
- 100+ vortrainierte Modelle auf HuggingFace
- 40+ Datasets
- 20 Speech/Text Processing Tasks

**Unterstützte Architekturen:**
- Whisper
- Wav2Vec2 / HuBERT / WavLM
- Conformer / Branchformer / HyperConformer
- CRDNN

**Stärken:**
- All-in-One Toolkit
- Akademischer Hintergrund (30+ Universitäten)
- Einfaches Fine-Tuning
- Multi-GPU Training
- Dynamisches Batching

**Installation:**
```bash
pip install speechbrain
```

---

## Deutsche Sprachunterstützung

### Word Error Rate (WER) für Deutsch

Die Word Error Rate (WER) ist das Standard-Maß für STT-Genauigkeit. Niedrigere Werte = besser.

| Modell | Deutsch WER | Dataset | Anmerkung |
|--------|-------------|---------|-----------|
| **Whisper Large V3** | 5-8% | CommonVoice | Gold-Standard für Deutsch |
| **Whisper Large V3 Turbo** | 6-9% | CommonVoice | Minimal schlechter als V3 |
| **Voxtral Small** | ~6-8% | CommonVoice | Vergleichbar mit Whisper V3 |
| **NVIDIA Canary 1B** | 5-7% | CommonVoice | Explizit für Deutsch optimiert |
| **Whisper Medium** | 8-12% | CommonVoice | Gute Balance |
| **SeamlessM4T v2** | 7-10% | FLEURS | Gut für Übersetzung |
| **Whisper Small** | 12-18% | CommonVoice | Akzeptabel |
| **Vosk German** | 15-20% | - | Älteres Modell |
| **Whisper Base** | 20-30% | CommonVoice | Nur für Prototyping |
| **Whisper Tiny** | 35-50% | CommonVoice | Nicht empfohlen für Deutsch |

### Deutsch als "Medium-Resource" Sprache

In der ASR-Forschung wird Deutsch als **Medium-Resource Language** klassifiziert:

- **High-Resource**: Englisch, Mandarin, Spanisch
- **Medium-Resource**: Deutsch, Französisch, Italienisch, Portugiesisch
- **Low-Resource**: Kleinere Sprachen mit wenig Trainingsdaten

Das bedeutet:
- Gute Modell-Performance möglich (5-10% WER)
- Weniger Trainingsdaten als Englisch
- Akzente (Schweizerdeutsch, Österreichisch, Dialekte) reduzieren Genauigkeit

### Herausforderungen für Deutsch

| Herausforderung | Auswirkung | Empfehlung |
|-----------------|------------|------------|
| **Dialekte** | +5-15% WER | Large-Modelle verwenden |
| **Zusammengesetzte Wörter** | Segmentierungsfehler | Nachbearbeitung |
| **Umgangssprache** | +3-8% WER | Robuste Modelle (Whisper V3) |
| **Fachvokabular** | OOV-Fehler | Custom Vocabulary (Vosk) |
| **Hintergrundgeräusche** | +10-20% WER | Vorverarbeitung mit VAD |

### Modellempfehlungen für Deutsch

| Szenario | Empfohlenes Modell | WER | Begründung |
|----------|-------------------|-----|------------|
| **Höchste Qualität** | Whisper Large V3 | 5-8% | Beste Deutsch-Performance |
| **Schnell & Gut** | Whisper Large V3 Turbo | 6-9% | 6x schneller, minimal schlechter |
| **Server mit EU-Focus** | NVIDIA Canary 1B | 5-7% | Explizit für EU-Sprachen optimiert |
| **Apple Silicon** | Lightning-Whisper-MLX (Large V3) | 5-8% | Native M-Chip Optimierung |
| **Offline/Embedded** | Vosk German Large | 15-20% | Vollständig offline |
| **Übersetzung DE→EN** | SeamlessM4T v2 | 7-10% | Direkte Übersetzung |
| **Budget/Prototyp** | Whisper Medium | 8-12% | Geringerer VRAM |

### Benchmark-Quellen

Die WER-Werte stammen aus folgenden Quellen:

- **CommonVoice 15.0** (Mozilla) - Crowdsourced Deutsch-Aufnahmen
- **FLEURS** (Google) - Multilingual Benchmark
- **MLS German** (Facebook) - Multilingual LibriSpeech
- **VoxPopuli** (EU Parlament) - Reale Sprachaufnahmen

**Wichtig:** Real-World Performance ist oft 20-50% schlechter als akademische Benchmarks wegen:
- Hintergrundgeräusche
- Dialekte und Akzente
- Telefon-/Kompressionsartefakte
- Domain-spezifisches Vokabular

---

## Vergleichstabellen

### Genauigkeit vs. Geschwindigkeit

| Modell | WER (LibriSpeech) | WER (Deutsch) | Relative Geschw. | VRAM |
|--------|-------------------|---------------|------------------|------|
| Whisper Large V3 | 2.5% | 5-8% | 1x | 10 GB |
| Whisper Large V3 Turbo | 2.6% | 6-9% | 6x | 6 GB |
| **Voxtral Small (24B)** | ~2.3% | 6-8% | 2x | 30 GB |
| **Voxtral Mini (3B)** | ~3.5% | 8-12% | 8x | 4 GB |
| Distil-Large-v3.5 | 2.7% | ❌ (nur EN) | 9x | 4 GB |
| NVIDIA Canary 1B | ~2.4% | 5-7% | 7-10x | 6 GB |
| Parakeet TDT 0.6B | ~3.5% | ❌ (nur EN) | 20x+ | 4 GB |
| Moonshine Base | ~4.5% | ❌ (nur EN) | 5x | 1 GB |
| Vosk Large | ~5-6% | 15-20% | 3x | 2 GB |

### Sprachunterstützung

| Modell | Sprachen | Deutsch | Deutsch WER | Übersetzung |
|--------|----------|---------|-------------|-------------|
| Whisper Large V3 | 99+ | ✅ | 5-8% | ✅ |
| Whisper Large V3 Turbo | 99+ | ✅ | 6-9% | ✅ |
| **Voxtral Small** | 8 | ✅ | 6-8% | ❌ |
| **Voxtral Mini** | 8 | ✅ | 8-12% | ❌ |
| Canary 1B | 25 | ✅ ⭐ | 5-7% | ✅ |
| SeamlessM4T | ~100 | ✅ | 7-10% | ✅ |
| Vosk | 20+ | ✅ | 15-20% | ❌ |
| XLS-R | 128 | ✅ | 10-15%* | ❌ |
| Distil-Whisper | 1 (EN) | ❌ | - | ❌ |
| Moonshine | 1 (EN) | ❌ | - | ❌ |

*XLS-R erfordert Fine-Tuning für ASR - Werte nach Fine-Tuning auf Deutsch

### Hardware-Anforderungen

| Modell | Min. RAM | GPU empfohlen | Deutsch | Raspberry Pi |
|--------|----------|---------------|---------|--------------|
| Moonshine Tiny | 500 MB | ❌ | ❌ | ✅ |
| Vosk Small | 500 MB | ❌ | ✅ | ✅ |
| Whisper Tiny | 1 GB | Optional | ⚠️ | ⚠️ |
| Whisper Base | 1 GB | Optional | ⚠️ | ❌ |
| Whisper Small | 2 GB | Empfohlen | ✅ | ❌ |
| **Voxtral Mini (3B)** | 4 GB | Empfohlen | ✅ | ❌ |
| Whisper Medium | 5 GB | ✅ | ✅ | ❌ |
| Canary 1B | 6 GB | ✅ | ✅ ⭐ | ❌ |
| Whisper Large | 10 GB | ✅ | ✅ | ❌ |
| **Voxtral Small (24B)** | 30 GB | ✅ | ✅ | ❌ |

---

## Empfehlungen für Mac Mini M4

### Beste Optionen für 16 GB RAM

| Priorität | Modell | Framework | Deutsch | Verwendung |
|-----------|--------|-----------|---------|------------|
| 1️⃣ | Whisper Large V3 Turbo | Lightning-Whisper-MLX | ✅ 6-9% WER | Beste Qualität, schnell |
| 2️⃣ | **Voxtral Mini (3B)** | Transformers | ✅ 8-12% WER | Open Source (Apache 2.0), kompakt |
| 3️⃣ | Whisper Medium | Lightning-Whisper-MLX | ✅ 8-12% WER | Gute Balance |
| 4️⃣ | Distil-Large-v3.5 | Faster-Whisper | ❌ nur EN | Englisch-only, sehr schnell |
| 5️⃣ | Moonshine Base | Native | ❌ nur EN | Ultra-schnell, CPU-only |

### Installation auf Mac Mini

```bash
# MLX-optimierte Whisper Installation
pip install lightning-whisper-mlx

# Oder Faster-Whisper für CPU/MPS
pip install faster-whisper

# Oder Moonshine für Edge
pip install moonshine
```

### Beispiel-Integration

```python
# Lightning Whisper MLX (empfohlen für Apple Silicon)
from lightning_whisper_mlx import LightningWhisperMLX

whisper = LightningWhisperMLX(model="large-v3-turbo", batch_size=12)
result = whisper.transcribe("audio.mp3")
print(result["text"])

# Mit Faster-Whisper
from faster_whisper import WhisperModel

model = WhisperModel("large-v3-turbo", device="cpu", compute_type="int8")
segments, info = model.transcribe("audio.mp3")
for segment in segments:
    print(f"[{segment.start:.2f}s -> {segment.end:.2f}s] {segment.text}")
```

---

## Quellen und Links

### Offizielle Dokumentation

- [OpenAI Whisper](https://github.com/openai/whisper)
- [Faster-Whisper](https://github.com/SYSTRAN/faster-whisper)
- [Lightning Whisper MLX](https://github.com/mustafaaljadery/lightning-whisper-mlx)
- [Mistral Voxtral](https://mistral.ai/news/voxtral/) - Mistral AI STT Modelle
- [NVIDIA NeMo](https://docs.nvidia.com/nemo-framework/)
- [Moonshine](https://www.usefulsensors.com/moonshine)
- [Vosk](https://alphacephei.com/vosk/)
- [SpeechBrain](https://speechbrain.github.io/)
- [SeamlessM4T](https://github.com/facebookresearch/seamless_communication)

### Benchmarks & Vergleiche

- [Open ASR Leaderboard](https://huggingface.co/spaces/hf-audio/open_asr_leaderboard)
- [Northflank STT Benchmarks 2026](https://northflank.com/blog/best-open-source-speech-to-text-stt-model-in-2026-benchmarks)
- [Modal STT Comparison](https://modal.com/blog/open-source-stt)
- [Whisper Variants Comparison](https://modal.com/blog/choosing-whisper-variants)

### Hugging Face Modelle

- [openai/whisper-large-v3](https://huggingface.co/openai/whisper-large-v3)
- [openai/whisper-large-v3-turbo](https://huggingface.co/openai/whisper-large-v3-turbo)
- [distil-whisper/distil-large-v3.5](https://huggingface.co/distil-whisper/distil-large-v3.5)
- [mistralai/Voxtral-Small-Latest](https://huggingface.co/mistralai) - Mistral AI STT
- [nvidia/canary-1b-v2](https://huggingface.co/nvidia/canary-1b-v2)
- [UsefulSensors/moonshine](https://huggingface.co/UsefulSensors/moonshine)
- [facebook/seamless-m4t-v2-large](https://huggingface.co/facebook/seamless-m4t-v2-large)

---

*Zuletzt aktualisiert: 26. Januar 2026 - Erweitert um Mistral Voxtral und Deutsche Sprachunterstützung*
