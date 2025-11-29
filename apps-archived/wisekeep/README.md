# 🎥 YouTube Transcriber System

Ein vollständiges System zur automatischen Transkription, Aufbereitung und Präsentation von YouTube-Videos mit OpenAI's Whisper, FastAPI Backend und Astro.js Frontend.

## ✨ System-Komponenten

### 🔧 Backend (Python)
- **OpenAI Whisper** - Lokale Speech-to-Text Transkription
- **FastAPI Server** - REST API für Web-Interface
- **Parallel Processing** - Bis zu 3.3x schnellere Verarbeitung
- **Playlist Management** - Automatische Batch-Verarbeitung

### 🌐 Frontend (Astro.js)
- **Public Website** - Aufbereitete Vorträge als Wisdom Library
- **Admin Panel** - Transkriptions-Management (localhost only)
- **Content Collections** - Strukturierte Inhalte mit Markdown
- **Responsive Design** - Optimiert für alle Geräte

## 🏗️ Architektur

```
YoutubeDL/
├── 🐍 Python Backend
│   ├── transcriber_v4_parallel.py  # Parallel-Verarbeitung
│   ├── api_server.py               # FastAPI REST API
│   └── playlists/                  # YouTube URL-Listen
├── 🌐 Website
│   ├── src/pages/                  # Public & Admin Pages
│   ├── src/content/talks/          # Aufbereitete Vorträge
│   └── src/components/admin/       # Admin-Komponenten
└── 📂 Output
    └── transcripts/                 # Transkribierte Texte
```

## 🛠 Installation

### Voraussetzungen

- Python 3.10+
- FFmpeg
- macOS (optimiert für Apple Silicon M1/M2)

### Setup

1. **Repository klonen:**
```bash
git clone https://github.com/yourusername/youtube-transcriber.git
cd youtube-transcriber
```

2. **Virtual Environment erstellen:**
```bash
python3 -m venv venv
source venv/bin/activate
```

3. **Dependencies installieren:**
```bash
pip install -r requirements.txt
```

## 🚀 Schnellstart

### Kompletter Workflow: Von YouTube zu Website

#### 1. Speaker Content sammeln

Erstelle eine Playlist für einen Speaker (z.B. Simon Sinek):

```bash
# playlists/people/simon-sinek.txt erstellen
# Simon Sinek Videos
# Popular talks and interviews from YouTube
# Created: 2025-09-09

# TED Talks
# How great leaders inspire action (Start with Why) - 60M+ views
https://www.youtube.com/watch?v=u4ZoJKF_VuA

# Why good leaders make you feel safe - 18M+ views
https://www.youtube.com/watch?v=lmyZMtPVodo
```

#### 2. Videos transkribieren

```bash
# Virtual Environment aktivieren
source venv/bin/activate

# Parallel-Verarbeitung starten (3-4x schneller)
python3 transcriber_v4_parallel.py --playlist playlists/people/simon-sinek.txt --model base --language en
```

#### 3. Website Content erstellen

**a) Content Schema erweitern** (wenn neue Kategorie):
```typescript
// website/src/content/config.ts
category: z.enum([
  'behavioral-economics',
  'psychology',
  'leadership', // Neue Kategorie hinzufügen
  // ...
]),
```

**b) Speaker Profil erstellen**:
```bash
# website/src/pages/speakers/simon-sinek.astro
```

**c) Talk-Seiten erstellen**:
```bash
# Für jedes erfolgreich transkribierte Video:
# website/src/content/talks/simon-sinek-[talk-slug].md
```

**d) SearchableContentList aktualisieren**:
```typescript
// website/src/components/SearchableContentList.tsx
// Neue Talks zur Inhaltsliste hinzufügen
```

#### 4. Website starten

```bash
cd website
npm run dev
```

### Einzelnes Video transkribieren

```bash
# Mit Large-Modell (beste Qualität)
python3 transcriber_v3.py process "https://www.youtube.com/watch?v=VIDEO_ID" --model large

# Mit Tiny-Modell (schneller Test)  
python3 transcriber_v3.py process "https://www.youtube.com/watch?v=VIDEO_ID" --model tiny
```

### Playlists verwalten

1. **Playlist erstellen:**
   - Erstelle eine `.txt` Datei im `playlists/` Ordner
   - Füge YouTube-URLs ein (eine pro Zeile)

```bash
# playlists/tech/python_tutorials.txt
https://www.youtube.com/watch?v=VIDEO_ID1
https://www.youtube.com/watch?v=VIDEO_ID2
```

2. **Alle Playlists scannen:**
```bash
python3 transcriber_v3.py scan --model large
```

3. **Spezifische Playlist verarbeiten:**
```bash
python3 transcriber_v3.py scan --playlist tech/python_tutorials
```

### Quick-Script verwenden

```bash
./quick_transcribe.sh
```

Bietet ein interaktives Menü zur Modell-Auswahl.

## 📂 Projektstruktur

```
YoutubeDL/
├── playlists/              # YouTube URL-Listen nach Themen
│   ├── tech/
│   │   └── python_tutorials.txt
│   ├── people/
│   │   └── rory-sutherland.txt
│   └── musik/
│       └── klassik.txt
├── transcripts/            # Transkribierte Texte (automatisch organisiert)
│   ├── tech_python_tutorials/
│   │   └── [Kanal]/
│   │       └── [Video]_[Timestamp].txt
│   └── people_rory-sutherland/
│       └── TED/
├── .cache/                 # Cache für bereits verarbeitete Videos
├── temp_audio/             # Temporäre Audio-Dateien
├── venv/                   # Python Virtual Environment
├── transcriber.py          # v1: Basis-Funktionalität
├── transcriber_v2.py       # v2: Mit Rich UI
├── transcriber_v3.py       # v3: Mit Playlist-Management
└── quick_transcribe.sh     # Schnellzugriff-Script
```

## 🎯 Whisper-Modelle

| Modell | Größe | Geschwindigkeit | Genauigkeit | Verwendung |
|--------|-------|-----------------|-------------|------------|
| **tiny** | 39 MB | ~10x Echtzeit | 75% | Schnelle Tests |
| **base** | 74 MB | ~7x Echtzeit | 85% | Guter Kompromiss |
| **small** | 244 MB | ~4x Echtzeit | 91% | Solide Qualität |
| **medium** | 769 MB | ~2x Echtzeit | 94% | Hohe Qualität |
| **large** | 1.5 GB | ~1x Echtzeit | 96-98% | Beste Qualität |

## 📋 Befehle

### Hauptbefehle

```bash
# Zeige alle Playlists
python3 transcriber_v3.py list

# Verarbeite alle neuen Videos in allen Playlists
python3 transcriber_v3.py scan

# Verarbeite einzelnes Video
python3 transcriber_v3.py process "URL"

# Mit spezifischem Modell
python3 transcriber_v3.py scan --model large

# Andere Sprache
python3 transcriber_v3.py scan --language en
```

### Optionen

- `--model {tiny,base,small,medium,large}` - Whisper-Modell auswählen
- `--language LANG` - Sprache setzen (default: de)
- `--playlist NAME` - Spezifische Playlist verarbeiten
- `--output DIR` - Ausgabe-Verzeichnis (default: transcripts)
- `--force` - Cache ignorieren und neu transkribieren

## 🔄 Automatisierung

### Cron-Job einrichten

Für tägliche automatische Verarbeitung:

```bash
# Crontab öffnen
crontab -e

# Täglich um 3 Uhr nachts alle Playlists scannen
0 3 * * * cd /path/to/YoutubeDL && source venv/bin/activate && python3 transcriber_v3.py scan --model large
```

## 💡 Tipps

1. **Organisiere nach Themen**: Erstelle Unterordner in `playlists/` für verschiedene Themen
2. **Cache nutzen**: Das System merkt sich bereits transkribierte Videos automatisch
3. **Modell-Auswahl**: 
   - Nutze `tiny` für schnelle Tests
   - Nutze `large` für wichtige Transkriptionen
4. **Batch-Verarbeitung**: Füge alle URLs zur Playlist hinzu und lasse über Nacht laufen

## 🎨 Features im Detail

### Rich Terminal UI (v2+)
- Farbige Ausgabe mit Emojis
- Progress Bars für Download und Transkription
- Zeitschätzungen basierend auf Video-Länge
- Video-Metadaten vor Download

### Playlist-Management (v3)
- Automatisches Scannen von URL-Listen
- Themen-basierte Organisation
- Nur neue Videos werden verarbeitet
- Batch-Verarbeitung mehrerer Playlists

### Cache-System
- Verhindert doppelte Verarbeitung
- Speichert Metadaten zu transkribierten Videos
- `.cache/transcribed_videos.json` enthält Historie

## 🐛 Troubleshooting

**FFmpeg nicht gefunden:**
```bash
# macOS
brew install ffmpeg
```

**Whisper-Modell lädt sehr lange:**
- Beim ersten Mal wird das Modell heruntergeladen
- Large: ~1.5GB, kann 10-30 Minuten dauern

**"Video bereits transkribiert":**
- Nutze `--force` Flag zum Überschreiben
- Oder lösche `.cache/` Ordner für kompletten Reset

## 📈 Performance (Apple Silicon M1)

- **Tiny**: ~10x Echtzeit (6 Min Video → 36 Sek)
- **Base**: ~7x Echtzeit (6 Min Video → 50 Sek)
- **Small**: ~4x Echtzeit (6 Min Video → 1.5 Min)
- **Large**: ~1x Echtzeit (6 Min Video → 6 Min)

## 🔒 Datenschutz

- Alle Verarbeitung erfolgt **lokal** auf deinem Computer
- Keine Daten werden an externe Server gesendet
- Whisper läuft komplett offline

## 📝 Lizenz

MIT License - Siehe LICENSE Datei

## 🙏 Credits

- **OpenAI Whisper** - Speech-to-Text Engine
- **yt-dlp** - YouTube Download Tool
- **Rich** - Terminal UI Library
- **FFmpeg** - Audio/Video Verarbeitung

## 🌐 Website Integration

Das System generiert nicht nur Transkripte, sondern auch eine vollständige Website mit den aufbereiteten Inhalten.

### Website-Features

- **📚 Content Collections**: Strukturierte Talk-Seiten mit Markdown
- **🔍 Suchfunktion**: Volltextsuche über alle Talks
- **👤 Speaker Profile**: Übersichtsseiten für jeden Speaker
- **🏷️ Tag-System**: Kategorisierung nach Themen
- **📱 Responsive**: Optimiert für alle Geräte
- **🎨 Theming**: Verschiedene Farbschemata

### Content-Struktur

```
website/src/
├── content/
│   ├── config.ts              # Content Schema
│   └── talks/                 # Aufbereitete Talk-Seiten
│       ├── simon-sinek-why-good-leaders-make-you-feel-safe.md
│       ├── simon-sinek-millennials-in-the-workplace.md
│       └── simon-sinek-love-your-work.md
├── pages/
│   ├── speakers/
│   │   ├── index.astro        # Speaker-Übersicht
│   │   └── simon-sinek.astro  # Speaker-Profile
│   └── talks/
│       └── [slug].astro       # Dynamische Talk-Seiten
└── components/
    ├── SearchableContentList.tsx  # Hauptsuche
    ├── ContentCard.tsx            # Talk-Vorschau
    └── speakers/
        ├── SpeakerHero.astro      # Speaker-Header
        ├── TalkGrid.astro         # Talk-Grid
        └── QuoteCollection.astro  # Zitate-Sammlung
```

### Website entwickeln

```bash
# Website Dependencies installieren
cd website
npm install

# Entwicklungsserver starten
npm run dev

# Website bauen für Produktion
npm run build
```

### Content-Erstellung Workflow

1. **Transkription**: Videos mit Python-Backend transkribieren
2. **Content-Aufbereitung**: Markdown-Dateien mit Metadaten erstellen
3. **Speaker-Profile**: Übersichtsseiten für neue Speaker
4. **Integration**: Neue Inhalte in Suchfunktion einbinden
5. **Deployment**: Website bauen und deployen

## 🚧 Roadmap

- [x] **Parallel Processing** - 3-4x schnellere Transkription
- [x] **Website Integration** - Vollständige Content-Website
- [x] **Speaker Profiles** - Detaillierte Speaker-Übersichten
- [x] **Content Collections** - Strukturierte Talk-Aufbereitung
- [ ] **Admin Interface** - Web-UI für Transkriptions-Management
- [ ] **Speaker Diarization** - Wer spricht wann
- [ ] **Automatische Zusammenfassungen** - LLM-basierte Summaries
- [ ] **Export Formate** - SRT, VTT, JSON Export
- [ ] **YouTube Playlist Auto-Import** - Direkte Playlist-Integration

---

**Entwickelt mit ❤️ für automatische Transkription**