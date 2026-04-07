# Roblox Reimagined: Der optimale Stack

## Keine Kompromisse -- das technisch beste Tool fuer jeden Job

---

## Die Leitprinzipien

1. **Browser-First** -- Zero Install ist der groesste Wettbewerbsvorteil gegenueber Roblox
2. **Self-Hosted-First** -- Volle Kontrolle, keine Vendor-Abhaengigkeit, DSGVO-konform
3. **Local-First** -- Offline-Editor, Guest Mode, Instant UI (unser bestehendes Differenzierungsmerkmal)
4. **Beste Sprache pro Domaene** -- Rust fuer Engine, Go fuer Infrastruktur, TypeScript fuer UI, Python fuer AI
5. **Maximale Sicherheit** -- WASM-Sandbox, kein User-Code ausserhalb der Sandbox

---

## Der Stack

```
╔══════════════════════════════════════════════════════════════════╗
║                        BROWSER CLIENT                            ║
║                                                                  ║
║  ┌─────────────────────────────────┐ ┌────────────────────────┐ ║
║  │     Bevy Engine (Rust → WASM)    │ │   Svelte 5 UI Layer   │ ║
║  │                                  │ │                        │ ║
║  │  wgpu → WebGPU (Rendering)       │ │  Editor (3D + Visual  │ ║
║  │  Rapier (Physik, nativ Rust)     │ │   + Code)             │ ║
║  │  bevy_ecs (State Management)     │ │  Marketplace          │ ║
║  │  Quinn → WebTransport (Netz)     │ │  Social / Chat        │ ║
║  │  Wasmtime (User-Script-Sandbox)  │ │  Profile / Avatar     │ ║
║  │                                  │ │  Monaco (Code Editor)  │ ║
║  └──────────┬───────────────────────┘ └───────────┬────────────┘ ║
║             │                                      │              ║
║  ┌──────────▼──────────────────────────────────────▼────────────┐║
║  │  Dexie.js (IndexedDB) -- Local-First Layer                    ║║
║  │  Games, Assets, Fortschritt, Avatar, Settings (alles offline) ║║
║  └───────────────────────────┬──────────────────────────────────┘║
╚══════════════════════════════╪═══════════════════════════════════╝
                               │ WebTransport (QUIC) + REST + WS
                               │
╔══════════════════════════════╪═══════════════════════════════════╗
║                    GAME SERVER TIER                               ║
║                              │                                    ║
║  ┌───────────────────────────▼──────────────────────────────┐    ║
║  │  Game Server (Rust / Bevy headless)                       │    ║
║  │                                                           │    ║
║  │  bevy_ecs ── gleicher Code wie Client                     │    ║
║  │  Rapier ──── gleiche Physik wie Client                    │    ║
║  │  Wasmtime ── User-Scripts in WASM-Sandbox                 │    ║
║  │  Quinn ───── WebTransport (QUIC, unreliable datagrams)    │    ║
║  │                                                           │    ║
║  │  Pro Instanz: 1 Prozess, 100-500 MB RAM, 1-2 CPU Cores   │    ║
║  └───────────────────────────────────────────────────────────┘    ║
║                                                                    ║
║  ┌────────────────────────────────────────────────────────────┐   ║
║  │  mana-game-orchestrator (Go)                                │   ║
║  │  - Spawnt/stoppt Rust-Game-Server als Subprozesse           │   ║
║  │  - Health Checks, Auto-Restart, Ressourcen-Limits           │   ║
║  │  - Latenz-basiertes Routing                                 │   ║
║  │  - Cloud-Burst zu Fly.io bei Spitzenlast                    │   ║
║  └────────────────────────────────────────────────────────────┘   ║
║                                                                    ║
║  ┌────────────────────────────────────────────────────────────┐   ║
║  │  mana-matchmaker (Go)                                       │   ║
║  │  - Freunde-zuerst, dann Region, dann Fuellstand             │   ║
║  │  - Redis Sorted Sets fuer Warteschlangen                    │   ║
║  │  - Latenz-Messung via QUIC Ping                             │   ║
║  └────────────────────────────────────────────────────────────┘   ║
╚══════════════════════════════════════════════════════════════════╝
                               │
╔══════════════════════════════╪═══════════════════════════════════╗
║                    PLATFORM SERVICES                              ║
║                                                                    ║
║  BESTEHEND (unveraendert oder minimal erweitert):                 ║
║  ┌──────────┐ ┌───────────┐ ┌──────────┐ ┌───────────────────┐  ║
║  │mana-auth │ │mana-credit│ │mana-sub  │ │mana-user          │  ║
║  │Hono+Bun  │ │Hono+Bun   │ │Hono+Bun  │ │Hono+Bun           │  ║
║  │Port 3001 │ │Port 3061  │ │Port 3063 │ │Port 3062          │  ║
║  └──────────┘ └───────────┘ └──────────┘ └───────────────────┘  ║
║  ┌──────────┐ ┌───────────┐ ┌──────────┐ ┌───────────────────┐  ║
║  │mana-sync │ │mana-notify│ │mana-     │ │mana-search        │  ║
║  │Go        │ │Go         │ │analytics │ │Go                 │  ║
║  │Port 3050 │ │Port 3040  │ │Hono      │ │Port 3021          │  ║
║  └──────────┘ └───────────┘ └──────────┘ └───────────────────┘  ║
║                                                                    ║
║  NEU:                                                             ║
║  ┌──────────────────┐ ┌──────────────────┐                       ║
║  │mana-asset-server │ │mana-moderation   │                       ║
║  │Go                │ │Go + Python ML    │                       ║
║  │Asset Pipeline,   │ │Text + Voice +    │                       ║
║  │CDN Origin,       │ │Content + Behavior│                       ║
║  │Auto-LOD, Hashing │ │                  │                       ║
║  └──────────────────┘ └──────────────────┘                       ║
╚══════════════════════════════════════════════════════════════════╝
                               │
╔══════════════════════════════╪═══════════════════════════════════╗
║                    AI SERVICES (bestehend)                         ║
║                                                                    ║
║  ┌──────────┐ ┌───────────┐ ┌──────────┐ ┌───────────────────┐  ║
║  │mana-llm  │ │mana-image │ │mana-stt  │ │mana-tts           │  ║
║  │Python    │ │-gen Python│ │Python    │ │Python             │  ║
║  │NPC Dialog│ │Texturen   │ │Voice Mod │ │NPC Stimme         │  ║
║  │Quest Gen │ │+ 3D (neu) │ │Voice Chat│ │                   │  ║
║  └──────────┘ └───────────┘ └──────────┘ └───────────────────┘  ║
╚══════════════════════════════════════════════════════════════════╝
                               │
╔══════════════════════════════╪═══════════════════════════════════╗
║                    DATA LAYER                                     ║
║                                                                    ║
║  ┌──────────────┐ ┌────────────┐ ┌───────────┐ ┌──────────────┐ ║
║  │ PostgreSQL 16│ │ TigerBeetle│ │ Dragonfly │ │ MinIO        │ ║
║  │              │ │            │ │ (Redis-   │ │ (S3)         │ ║
║  │ Users, Games │ │ Economy:   │ │ kompatibel│ │ 3D Assets    │ ║
║  │ Social Graph │ │ Wallets    │ │ Multi-    │ │ Texturen     │ ║
║  │ Moderation   │ │ Transfers  │ │ threaded) │ │ Audio        │ ║
║  │ Game Meta    │ │ Revenue    │ │ Sessions  │ │ WASM Scripts │ ║
║  │              │ │ Split      │ │ Presence  │ │              │ ║
║  │ BESTEHT     │ │ NEU        │ │ Matchmake │ │ BESTEHT      │ ║
║  │              │ │            │ │ Leaderb.  │ │              │ ║
║  └──────────────┘ └────────────┘ └───────────┘ └──────────────┘ ║
║                                                                    ║
║  ┌──────────────┐ ┌────────────┐ ┌────────────────────────────┐  ║
║  │ Dexie.js     │ │ Meilisearch│ │ ClickHouse               │  ║
║  │ (Client)     │ │            │ │                            │  ║
║  │ Local-First  │ │ Game-Suche │ │ Analytics, Telemetrie,    │  ║
║  │ Offline Data │ │ Asset-Suche│ │ Play-Metriken, Retention  │  ║
║  │              │ │ Creator    │ │                            │  ║
║  │ BESTEHT     │ │ NEU        │ │ NEU                        │  ║
║  └──────────────┘ └────────────┘ └────────────────────────────┘  ║
╚══════════════════════════════════════════════════════════════════╝
                               │
╔══════════════════════════════╪═══════════════════════════════════╗
║                    INFRASTRUCTURE                                 ║
║                                                                    ║
║  ┌────────────┐ ┌──────────┐ ┌────────────┐ ┌─────────────────┐ ║
║  │ Forgejo    │ │ Grafana  │ │ Victoria   │ │ GlitchTip       │ ║
║  │ Git + CI   │ │ Dashb.   │ │ Metrics    │ │ Error Track.    │ ║
║  │ BESTEHT    │ │ BESTEHT  │ │ + Loki     │ │ BESTEHT         │ ║
║  │            │ │          │ │ BESTEHT    │ │                 │ ║
║  └────────────┘ └──────────┘ └────────────┘ └─────────────────┘ ║
║                                                                    ║
║  Hosting: Mac Mini M4 (Basis) + Fly.io (Burst)                   ║
║  CDN: Cloudflare R2 (Assets) + Tunnel (Routing)                  ║
║  Domain: mana.how                                                 ║
╚══════════════════════════════════════════════════════════════════╝
```

---

## Warum genau diese Technologie pro Schicht

### Rendering: Bevy + wgpu (Rust → WASM → WebGPU)

**Warum nicht Three.js / Babylon.js:**

| Kriterium      | Three.js                         | Bevy + wgpu                           |
| -------------- | -------------------------------- | ------------------------------------- |
| Sprache        | JavaScript                       | Rust (→ WASM)                         |
| Performance    | Gut, aber JS-GC-Pausen           | Nah an nativ, kein GC                 |
| ECS            | Nicht eingebaut (muss extern)    | Kern-Architektur                      |
| Physik         | Extern (Rapier.js = WASM-Bridge) | Rapier nativ in Rust (zero overhead)  |
| Server-Sharing | Nicht moeglich (JS != Headless)  | **Gleicher Code auf Client + Server** |
| WebGPU         | Seit r163, aber JS-Overhead      | wgpu ist die Referenz-Impl von WebGPU |
| Sandboxing     | Schwierig in JS                  | WASM-Isolation nativ                  |
| Multithreading | Web Workers (umstaendlich)       | Bevy Parallel Systems (automatisch)   |

**Der Killer-Vorteil:** Mit Bevy laeuft **identischer Rust-Code** auf Client (WASM) und Server (nativ). Die Physik-Simulation ist bit-identisch. Das eliminiert eine ganze Klasse von Client-Server-Desync-Bugs, die bei separaten Client/Server-Stacks auftreten.

```
bevy_game_logic.rs
       │
       ├──→ cargo build --target wasm32-unknown-unknown  → Browser (WASM)
       │
       └──→ cargo build --release                        → Server (nativ, 10x schneller)
```

### Physik: Rapier (Rust, nativ in Bevy)

- Rapier ist in Rust geschrieben und integriert nativ mit Bevy (`bevy_rapier3d`)
- **Deterministisch** -- gleiche Inputs erzeugen gleiche Outputs auf Client und Server
- 2D + 3D in einer Library
- Kein WASM-Bridge-Overhead (im Gegensatz zu Rapier.js, das ueber die JS-WASM-Grenze kommuniziert)
- Aktiv entwickelt von Dimforge (das gleiche Team hinter der Rust-Numerics-Szene)

### Scripting: WASM via Wasmtime (User-Code-Sandbox)

**Warum TypeScript → WASM statt Lua:**

| Kriterium           | Lua/Luau (wie Roblox)                     | TypeScript → WASM                 |
| ------------------- | ----------------------------------------- | --------------------------------- |
| Sprach-Popularitaet | Nische                                    | #4 weltweit                       |
| Entwickler-Pool     | Klein                                     | Riesig                            |
| Tooling             | Custom IDE                                | VS Code, jede IDE                 |
| Performance         | Interpreter (~10-20x langsamer als nativ) | WASM (~1.2x langsamer als nativ)  |
| Type Safety         | Optional (Luau)                           | Stark (TypeScript)                |
| Sandbox-Sicherheit  | Software-basiert (VM-Escapes moeglich)    | Hardware-Level (Linear Memory)    |
| Ecosystem           | Roblox-spezifisch                         | npm, jede JS-Library (compiliert) |

**Der Workflow:**

```
Creator schreibt TypeScript
       │
       ▼
AssemblyScript Compiler (oder Javy fuer volles TS)
       │
       ▼
WASM Binary (.wasm)
       │
       ├──→ Browser: Native WASM-Engine (V8/SpiderMonkey)
       │
       └──→ Server: Wasmtime (Rust) mit:
                - Fuel Metering (max Instructions/Tick)
                - Memory Limit (z.B. 64 MB pro Script)
                - Capability-based API (deklarierte Permissions)
                - Kein Filesystem, kein Network, kein OS-Zugriff
```

**Wasmtime** (nicht wazero) weil:

- JIT-Compilation → 3-5x schneller als wazero (Interpreter)
- Cranelift Compiler Backend (schnelle Compilation + guter Code)
- WASI Component Model Support (typisierte Interfaces)
- Fuel Metering eingebaut
- Von der Bytecode Alliance (Mozilla, Fastly, Intel) maintained

### Networking: Quinn (Rust QUIC) → WebTransport

**Warum WebTransport statt WebSocket:**

```
WebSocket (TCP):
  Client → Server: Position Update (10 Bytes)
  [Wenn Paket 47 verloren geht, blockieren Pakete 48-100 bis Retransmit]
  → Head-of-Line Blocking → Lag-Spikes

WebTransport (QUIC):
  Client → Server: Position Update (Unreliable Datagram, 10 Bytes)
  [Paket 47 verloren? Egal, Paket 48-100 kommen sofort durch]
  → Kein Blocking → Fluessig

  PLUS: Reliable Streams fuer Chat, Inventar, Economy (parallel, unabhaengig)
```

Quinn ist die Rust-QUIC-Library und integriert direkt mit dem Rust-Server.

### Orchestrierung: Go

Go ist hier perfekt -- es geht nicht um Game-Ticks bei 60Hz, sondern um:

- Prozesse spawnen und ueberwachen
- Health Checks (HTTP)
- Latenz messen
- Load Balancing
- Fly.io API aufrufen fuer Cloud-Burst
- Redis-Queries fuer Matchmaking

Das ist exakt was unsere Go-Services (mana-sync, mana-notify, mana-gateway) bereits machen.

### Economy: TigerBeetle

**Warum nicht einfach PostgreSQL:**

| Kriterium         | PostgreSQL                         | TigerBeetle                       |
| ----------------- | ---------------------------------- | --------------------------------- |
| Transfers/Sekunde | ~10.000 (SERIALIZABLE)             | 1.000.000+                        |
| Double-Entry      | Manuell implementieren             | Eingebaut                         |
| Konsistenz        | SERIALIZABLE moeglich aber langsam | Strikte Serialisierbarkeit, immer |
| Race Conditions   | Moeglich bei falscher Isolation    | Unmoeglich (by Design)            |
| Negative Balances | Manuell pruefen                    | Unmoeglich (by Design)            |
| Audit Trail       | Manuell                            | Jeder Transfer ist immutable      |

Fuer eine Plattform mit virtueller Waehrung, In-Game-Purchases, Creator-Revenue-Splits und Marketplace-Trades ist TigerBeetle nicht Overkill -- es ist die richtige Abstraktionsebene.

**Account-Hierarchie:**

```
Platform Treasury
├── User:alice
│   ├── Wallet:purchased    (Mana gekauft)
│   └── Wallet:earned       (Mana verdient)
├── User:bob
│   ├── Wallet:purchased
│   └── Wallet:earned
├── Game:bobs-adventure
│   └── Revenue             (Einnahmen aus dem Game)
├── Marketplace:escrow       (Treuhand fuer Trades)
└── CreatorPayout:pending    (Auszahlungs-Queue)

Transaktion: Alice kauft Item in Bobs Game fuer 100 Mana
  Debit:  alice/wallet:purchased   -100
  Credit: bobs-adventure/revenue   +70    (70% Creator)
  Credit: platform/treasury        +30    (30% Plattform)

  → Automatisch, atomar, unmoeglich falsch zu buchen
```

### Suche: Meilisearch

- Instant Search (<50ms) mit Typo-Toleranz
- Faceted Search (nach Genre, Rating, Spielerzahl filtern)
- Self-hostable, Rust-basiert, ~50 MB RAM
- REST API, trivial zu integrieren
- Ersetzt keine Datenbank -- indiziert Games, Assets, Creators fuer Discovery

### Analytics: ClickHouse

- Spaltenorientiert -- perfekt fuer "wie oft wurde Game X in den letzten 7 Tagen gespielt?"
- Milliarden Events, Echtzeit-Aggregation
- Self-hostable, ~200 MB RAM fuer kleine Instanzen
- Materialized Views fuer Dashboards (Retention, DAU, Revenue pro Game)

### Cache: Dragonfly statt Redis

- Drop-in Redis-Ersatz (gleiches Protokoll)
- **Multi-threaded** (Redis ist single-threaded)
- 2-5x speichereffizienter
- Hoehere Throughput bei gleicher Hardware
- Self-hostable, ein Binary

---

## Sprach-Verteilung

```
┌─────────────────────────────────────────────────────┐
│                                                     │
│  Rust (30%)                                         │
│  ├── Game Engine (Bevy + wgpu + Rapier)             │
│  ├── Game Server (Bevy headless)                    │
│  ├── WASM Runtime (Wasmtime)                        │
│  └── Networking (Quinn/QUIC)                        │
│                                                     │
│  Go (25%)                                           │
│  ├── Game Orchestrator (NEU)                        │
│  ├── Matchmaker (NEU)                               │
│  ├── Asset Server (NEU)                             │
│  ├── mana-sync (BESTEHT)                            │
│  ├── mana-notify (BESTEHT)                          │
│  ├── mana-search (BESTEHT)                          │
│  ├── mana-crawler (BESTEHT)                         │
│  ├── mana-api-gateway (BESTEHT)                     │
│  └── mana-matrix-bot (BESTEHT)                      │
│                                                     │
│  TypeScript (30%)                                   │
│  ├── Svelte 5 UI (Editor, Marketplace, Social)      │
│  ├── Hono Services (auth, credits, user, subs)      │
│  ├── Shared Packages (@mana/*)                  │
│  ├── User Game Scripts (→ WASM kompiliert)           │
│  └── Local-First Layer (Dexie.js)                   │
│                                                     │
│  Python (15%)                                       │
│  ├── mana-llm (NPC-Dialoge, Quest-Generierung)      │
│  ├── mana-image-gen (Texturen, Assets)              │
│  ├── mana-stt (Voice Chat Transkription)            │
│  ├── mana-tts (NPC-Sprachausgabe)                   │
│  └── ML-Moderation (Content + Behavior)             │
│                                                     │
└─────────────────────────────────────────────────────┘
```

**Jede Sprache in ihrer Staerke:**

| Sprache        | Domaene                                | Warum genau diese                                                                 |
| -------------- | -------------------------------------- | --------------------------------------------------------------------------------- |
| **Rust**       | Alles mit Echtzeit-Anforderung (60Hz+) | Zero-Cost Abstractions, kein GC, WASM-Output, gleicher Code Client+Server         |
| **Go**         | Alles mit I/O + Orchestrierung         | Goroutines fuer tausende Connections, schnelle Binaries, unser bestehendes Wissen |
| **TypeScript** | Alles was User sehen/schreiben         | Svelte-Frontend, Creator-Scripting, groesstes Oekosystem                          |
| **Python**     | Alles mit ML/AI                        | PyTorch/MLX, FastAPI, unser bestehender AI-Stack                                  |

---

## Self-Hosting: Komplett-Uebersicht

### Hardware-Plan

**Phase 1 (jetzt): Mac Mini M4 16 GB**

- Alles laeuft hier: Backend, 10-50 Game-Instanzen, AI-Services
- ~200-500 gleichzeitige Spieler
- Kosten: Bereits vorhanden

**Phase 2 (bei Traktion): Mac Mini M4 Pro 48 GB (zusaetzlich)**

- Dediziert fuer Game-Server
- 50-200 Instanzen
- ~$1.200 einmalig

**Phase 3 (Wachstum): Mac Studio M4 Ultra 192 GB**

- Game-Server + AI auf einem Geraet
- 200-500 Instanzen + LLM-Inference
- ~$4.000 einmalig

**Phase X (Skalierung): Hybrid**

- Apple Silicon lokal fuer Basis-Last
- Fly.io/Hetzner fuer Burst (Go-Orchestrator steuert automatisch)

### Jede Komponente: Self-Hosted-Status

| Komponente              | Self-Hosted | Binary/Docker  | RAM              | Anmerkung               |
| ----------------------- | ----------- | -------------- | ---------------- | ----------------------- |
| PostgreSQL 16           | BESTEHT     | Docker         | 512 MB           | Backbone                |
| Redis/Dragonfly         | UPGRADE     | Single Binary  | 100 MB           | Dragonfly ersetzt Redis |
| MinIO                   | BESTEHT     | Docker         | 256 MB           | Asset Storage           |
| TigerBeetle             | NEU         | Single Binary  | 100 MB           | Economy                 |
| Meilisearch             | NEU         | Single Binary  | 50 MB            | Game/Asset-Suche        |
| ClickHouse              | NEU         | Docker         | 200 MB           | Analytics               |
| Forgejo                 | BESTEHT     | Docker         | 200 MB           | Git + CI                |
| Grafana Stack           | BESTEHT     | Docker         | 300 MB           | Monitoring              |
| GlitchTip               | BESTEHT     | Docker         | 200 MB           | Error Tracking          |
| SearXNG                 | BESTEHT     | Docker         | 100 MB           | Meta-Suche              |
| Matrix Synapse          | BESTEHT     | Docker         | 300 MB           | Chat                    |
| Ollama                  | BESTEHT     | Binary         | 4-8 GB           | LLM (bei Bedarf)        |
| Bevy Game Server        | NEU         | Native Binary  | 100-200 MB/Inst. | Game-Instanzen          |
| Wasmtime                | NEU         | In Game Server | (enthalten)      | Script-Sandbox          |
| mana-\* Services        | BESTEHT     | Docker         | je 30-100 MB     | ~12 Services            |
| **Gesamt Basis**        |             |                | **~8-10 GB**     | Ohne Game-Instanzen     |
| **+ 50 Game-Instanzen** |             |                | **+5-10 GB**     |                         |

**Passt auf den Mac Mini M4 mit 16 GB.** Eng, aber machbar fuer Alpha/Beta.

---

## Datenfluss: Eine komplette User-Journey

### Creator baut ein Game

```
1. Creator oeffnet Browser → mana.how/create
   └─ SvelteKit laedt, Bevy Engine (WASM) initialisiert

2. Offline-faehiger 3D-Editor startet
   └─ Dexie.js hat vorherige Session → sofortiges Laden

3. Creator platziert Objekte, schreibt TypeScript-Script
   ┌─ 3D: Bevy Renderer (wgpu → WebGPU)
   ├─ Code: Monaco Editor mit AI-Autocomplete (Claude API)
   └─ Visual: Node-Editor → kompiliert zu WASM

4. "Test" Button → lokaler Game-Loop startet
   ├─ Bevy + Rapier laufen komplett im Browser
   ├─ WASM-Script wird in Wasmtime-Sandbox ausgefuehrt
   └─ Kein Server noetig fuer Singleplayer-Test!

5. "Publish" Button
   ├─ Game-Daten: Dexie.js → mana-sync → PostgreSQL
   ├─ Assets: Upload → mana-asset-server → MinIO (+ CDN)
   ├─ WASM-Script: Validiert + gespeichert
   └─ Meilisearch: Game wird indizierbar
```

### Spieler spielt ein Game

```
1. Spieler klickt Link → mana.how/play/bobs-adventure
   └─ SvelteKit laedt, Bevy Engine (WASM) initialisiert

2. Matchmaker findet/erstellt Server-Instanz
   ├─ mana-matchmaker (Go): Prueft existierende Instanzen
   ├─ Keine frei? → mana-game-orchestrator spawnt Bevy-Server
   └─ Spieler erhaelt Server-Adresse

3. WebTransport-Verbindung zum Game Server
   ├─ Unreliable Datagrams: Position, Rotation (20Hz)
   ├─ Reliable Stream 1: Chat
   ├─ Reliable Stream 2: Inventar, Economy
   └─ Reliable Stream 3: Game Events

4. Game laeuft
   ├─ Server: Bevy headless + Rapier + Wasmtime (autoritativ)
   ├─ Client: Bevy WASM + Rapier (Prediction) + Rendering
   ├─ Physik: Identisch auf Client + Server (Rust → Rust)
   └─ Scripts: Identischer WASM-Code auf Client + Server

5. In-Game-Kauf: 50 Mana fuer Schwert
   ├─ Client → Server: "Kaufe Item X" (Reliable Stream)
   ├─ Server → mana-credits: Validierung
   ├─ Server → TigerBeetle: Atomarer Transfer
   │   Debit:  spieler/wallet    -50
   │   Credit: game/revenue      +35 (70%)
   │   Credit: platform/treasury +15 (30%)
   └─ Server → Client: "Kauf bestaetigt" + Item im Inventar

6. Spieler geht offline
   ├─ Spielfortschritt: In Dexie.js gespeichert
   ├─ Naechster Login: Sync via mana-sync
   └─ Game-Instanz: Wird nach Timeout vom Orchestrator gestoppt
```

### AI-Interaktion mit NPC

```
1. Spieler spricht NPC an (Text oder Voice)
   ├─ Text: Direkt an Server
   └─ Voice: mana-stt (Whisper) → Text

2. Server → mana-llm (Ollama, Gemma 3 4B)
   ├─ System Prompt: NPC-Persoenlichkeit + Game-Lore
   ├─ Context: Bisherige Konversation (Redis)
   └─ Structured Output: {dialog, emotion, action}

3. Response
   ├─ Dialog-Text → Client UI
   ├─ Emotion → Avatar-Animation (Bevy)
   ├─ Action → ECS-Command (z.B. Item geben, Quest starten)
   └─ Optional: mana-tts → Sprachausgabe
```

---

## Creator-Economy: Fairer als Roblox

### Revenue Split

```
Spieler kauft 100 Mana fuer €1,00

Roblox:       Creator erhaelt ~€0,25 (24.5%)
Wir (Self-H): Creator erhaelt ~€0,70 (70%)

Warum 70% moeglich ist:
├─ Kein App Store Fee (Browser → 0% statt 30%)
├─ Self-Hosted (Server-Kosten: ~€0,001 pro Spielstunde)
├─ TigerBeetle (keine Payment-Processing-Overhead)
└─ Stripe-Fee: ~2.9% (direkt, kein Zwischenhändler)

Tatsaechliche Kosten pro €1,00 Kauf:
├─ Stripe:     €0,03 (2.9%)
├─ Server:     €0,01 (geschaetzt)
├─ CDN/Infra:  €0,01 (geschaetzt)
├─ Moderation: €0,01 (geschaetzt)
├─ Platform:   €0,24 (Marge)
└─ Creator:    €0,70
    Summe:     €1,00
```

### Auszahlungs-Modell

| Tier        | Voraussetzung         | Auszahlung                                         |
| ----------- | --------------------- | -------------------------------------------------- |
| **Starter** | 0 Mana verdient       | Mana nur in-platform nutzbar                       |
| **Creator** | 1.000 Mana verdient   | Monatliche Auszahlung via Stripe                   |
| **Pro**     | 10.000 Mana verdient  | Woechentliche Auszahlung, Analytics-Dashboard      |
| **Studio**  | 100.000 Mana verdient | Taegliche Auszahlung, Priority Support, API-Zugang |

---

## Sicherheitsarchitektur

### Defense in Depth

```
Layer 1: WASM Sandbox
├─ Linear Memory Isolation (Hardware-Level)
├─ Fuel Metering (max. Instructions/Tick)
├─ Memory Limit (64 MB pro Script)
├─ Capability-based API (deklarierte Permissions)
└─ Kein FS/Network/OS-Zugang

Layer 2: Server-Autoritaet
├─ Alle Economy-Operationen nur serverseitig
├─ Physik-Validierung auf dem Server
├─ Input-Validation (Rate Limits, Bounds Checks)
└─ Client-State wird nie vertraut

Layer 3: Network Security
├─ WebTransport (TLS 1.3 mandatory)
├─ EdDSA JWT (bestehendes Auth-System)
├─ Per-Connection Rate Limiting
└─ DDoS: Cloudflare Tunnel (besteht)

Layer 4: Content Moderation
├─ Text: BERT-Classifier (wie Roblox, aber kleiner)
├─ Voice: Whisper → Text-Classifier
├─ 3D Content: Render-to-Image → Vision Model
├─ Behavior: Pattern Detection (ML)
└─ Human Review Queue fuer Grenzfaelle

Layer 5: Economy
├─ TigerBeetle: Double-Entry, keine Race Conditions
├─ Negative Balances physisch unmoeglich
├─ Velocity Checks (>N Transaktionen/Minute → Flag)
└─ Fraud Detection Pipeline
```

---

## Vergleich: Unser optimaler Stack vs. Roblox

| Dimension      | Roblox (2025)                 | Unser Stack                         |
| -------------- | ----------------------------- | ----------------------------------- |
| Engine         | Custom C++ (20 Jahre alt)     | Bevy/Rust (modern, ECS-native)      |
| Rendering      | D3D11/Metal/Vulkan (nativ)    | wgpu → WebGPU (Browser + nativ)     |
| Client         | Nativer Download erforderlich | **Zero Install (Browser)**          |
| Scripting      | Luau (Lua-Fork, Nische)       | TypeScript → WASM (Mainstream)      |
| Sandbox        | Software-VM (Escape-Risiko)   | WASM Linear Memory (Hardware-Level) |
| Physik         | Custom PGS 240Hz              | Rapier (Rust, deterministisch)      |
| Networking     | Custom UDP                    | WebTransport (QUIC, Standard)       |
| Server         | Custom C++ headless           | Bevy headless (**gleicher Code**)   |
| Orchestrierung | Nomad (135.000 Server)        | Go + Fly.io (Self-Hosted + Burst)   |
| Economy        | Proprietaer (24.5% Creator)   | TigerBeetle (**70% Creator**)       |
| Moderation     | Massive AI + Humans           | Kleiner Scale, Self-Hosted ML       |
| Offline        | Nicht moeglich                | **Local-First (Dexie.js)**          |
| Editor Offline | Nicht moeglich                | **Komplett offline-faehig**         |
| Guest Mode     | Nicht moeglich                | **Ja (bestehendes Pattern)**        |
| Self-Hosted    | Unmoeglich                    | **Komplett auf Mac Mini**           |
| Open Source    | Nein (nur Luau)               | Moeglich (Rust + Go + TS)           |
| AI NPCs        | Experimentell                 | **Bestehende Pipeline**             |
| Voice Chat     | Proprietaer                   | **Self-Hosted (Whisper + Kokoro)**  |
| DSGVO          | Fragwuerdig                   | **100% Self-Hosted-konform**        |

---

## Risiken und Mitigationen

| Risiko                          | Impact    | Mitigation                                                                                 |
| ------------------------------- | --------- | ------------------------------------------------------------------------------------------ |
| Rust-Lernkurve                  | Hoch      | 3 Monate dediziertes Lernen, dann Pair Programming. Bevy hat exzellente Docs und Community |
| Bevy pre-1.0 API-Churn          | Mittel    | Auf stable Features fokussieren, Engine-Abstraktionsschicht bauen                          |
| WebGPU nicht auf allen Browsern | Mittel    | WebGL2-Fallback via wgpu (automatisch). Safari 18.2+ hat WebGPU                            |
| Performance auf Low-End Mobile  | Hoch      | Quality Tiers wie Roblox. LOD, Culling, Resolution Scaling. PWA statt App                  |
| Moderation bei Scale            | Sehr hoch | Von Anfang an ML-Pipeline bauen. Content Rating. Creator-Verantwortung                     |
| Mac Mini reicht nicht           | Mittel    | Fly.io Cloud-Burst ist ein Go-Funktionsaufruf entfernt                                     |
| Kein Team                       | Kritisch  | Solo: Phase 0-1 machbar. Ab Phase 2 braucht es mindestens 2-3 Leute                        |

---

## Timeline (realistisch, 1 Person)

| Phase                         | Dauer         | Ergebnis                                                           |
| ----------------------------- | ------------- | ------------------------------------------------------------------ |
| **Rust lernen**               | 2-3 Monate    | Ownership, Lifetimes, Bevy-Basics sicher                           |
| **Phase 0: Proof of Concept** | 2-3 Monate    | Bevy-Szene im Browser, WASM-Script bewegt Objekt, Go-Server sync't |
| **Phase 1: Editor Alpha**     | 4-6 Monate    | 3D-Editor, Visual Scripting, Singleplayer, Offline-faehig          |
| **Phase 2: Multiplayer**      | 3-4 Monate    | WebTransport, 2-20 Spieler, Server-Autoritative Physik             |
| **Phase 3: Platform**         | 3-4 Monate    | Auth, Economy (TigerBeetle), Marketplace, Game Discovery           |
| **Phase 4: Social + AI**      | 3-4 Monate    | Friends, Voice Chat, LLM-NPCs, Moderation                          |
| **Phase 5: Polish**           | Laufend       | Performance, Mobile, Scale, Community                              |
| **Gesamt bis spielbar**       | ~18-24 Monate |                                                                    |

---

## Zusammenfassung: Eine Seite

**Engine:** Bevy (Rust) + wgpu → WebGPU im Browser, nativ auf Server. Gleicher Code beidseitig.

**Scripting:** TypeScript → WASM. Wasmtime-Sandbox mit Fuel Metering. Sicherer als Roblox (Hardware-Level Isolation statt Software-VM).

**Networking:** WebTransport (QUIC) via Quinn. Unreliable Datagrams fuer Positionen, Reliable Streams fuer Economy/Chat.

**Backend:** Go fuer Orchestrierung, Matchmaking, bestehende Services. Hono/Bun fuer Auth, Credits, User.

**AI:** Bestehende Python-Services (LLM, Image Gen, STT, TTS). NPCs sprechen, Texturen werden generiert, Voice wird moderiert.

**Economy:** TigerBeetle. Double-Entry-Bookkeeping. 70% Creator Revenue Share (vs. Roblox 24.5%).

**Daten:** PostgreSQL + TigerBeetle + Dragonfly + MinIO + Dexie.js. Alles self-hosted.

**Local-First:** Offline-Editor, Guest Mode, Asset-Caching, Spielfortschritt -- alles in IndexedDB, sync bei Verbindung.

**Self-Hosted:** Komplett auf Mac Mini. Cloudflare R2 nur fuer CDN. Fly.io nur fuer Peak-Burst.

**Differenzierung gegenueber Roblox:**

1. Zero Install (Browser)
2. 70% Creator Revenue (statt 24.5%)
3. TypeScript statt Lua (100x groesserer Entwickler-Pool)
4. Offline-faehig (Editor + Singleplayer)
5. Self-Hosted / DSGVO-konform
6. AI-native (NPCs, Asset-Generierung, Voice)
7. Open-Source-moeglich

---

_Erstellt: 28. Maerz 2026_
