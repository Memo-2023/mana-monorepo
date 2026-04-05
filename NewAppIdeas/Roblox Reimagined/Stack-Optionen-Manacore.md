# Roblox Reimagined: Stack-Optionen fuer Manacore

## Welche Technologien koennten wir nutzen -- und was haben wir bereits?

---

## Inhaltsverzeichnis

1. [Was wir bereits haben](#1-was-wir-bereits-haben)
2. [Drei moegliche Stacks](#2-drei-moegliche-stacks)
3. [Warum nicht Go?](#3-warum-nicht-go)
4. [Self-Hosting & Local-First](#4-self-hosting--local-first)
5. [Konkrete Architektur-Empfehlung](#5-konkrete-architektur-empfehlung)
6. [Was wir wiederverwenden koennen](#6-was-wir-wiederverwenden-koennen)
7. [Build-Phasen](#7-build-phasen)

---

## 1. Was wir bereits haben

### Unser aktueller Tech-Stack (Zusammenfassung)

Wir betreiben bereits ein komplexes, polyglot, selbst-gehostetes Oekosystem:

| Schicht                | Technologie                              | Services                                           |
| ---------------------- | ---------------------------------------- | -------------------------------------------------- |
| **Sprachen**           | Go, TypeScript (Bun), Python, Svelte     | ~25 Services                                       |
| **Go Services (6)**    | Go 1.23-1.25, pgx, goroutines            | sync, search, crawler, gateway, notify, matrix-bot |
| **Hono Services (5)**  | Hono 4.7 + Bun, Drizzle ORM              | auth, credits, user, subscriptions, analytics      |
| **Python AI (5+)**     | FastAPI, MLX, Whisper, FLUX              | llm, image-gen, stt, tts, voice-bot                |
| **Frontend (19 Apps)** | SvelteKit 2 + Svelte 5 + Tailwind 4      | Todo, Chat, Calendar, Photos, etc.                 |
| **Mobile**             | Expo 55 + React Native 0.83 + NativeWind | Mana, Traces                                   |
| **Local-First**        | Dexie.js + mana-sync (Go WebSocket)      | 19 Apps migriert                                   |
| **Datenbank**          | PostgreSQL 16                            | Alle Services                                      |
| **Cache**              | Redis 7                                  | Rate Limiting, Sessions                            |
| **Object Storage**     | MinIO                                    | S3-kompatibel, selbst-gehostet                     |
| **Git/CI**             | Forgejo 11 + Runner                      | Selbst-gehostet                                    |
| **Monitoring**         | Grafana + VictoriaMetrics + Loki         | Metriken, Logs, Alerts                             |
| **Error Tracking**     | GlitchTip                                | Selbst-gehostet (Sentry-Alternative)               |
| **Chat/Komm.**         | Matrix Synapse + Element                 | Selbst-gehostet                                    |
| **Auth**               | Better Auth + EdDSA JWT + JWKS           | Zentral via mana-auth                              |
| **Payments**           | Stripe                                   | Credits + Subscriptions                            |
| **Hosting**            | Mac Mini M4 + Docker + Cloudflare Tunnel | mana.how                                           |
| **Suche**              | SearXNG + mana-search (Go)               | Meta-Search                                        |
| **LLM**                | Ollama + OpenRouter + Groq               | Lokal + Cloud                                      |

### Kern-Staerken, die wir mitbringen

1. **Local-First-Architektur ist gebaut und bewiesen** -- Dexie.js + mana-sync mit Field-Level LWW, 19 Apps migriert
2. **Go-Expertise fuer High-Performance-Services** -- 6 produktive Go-Services
3. **Self-Hosting-Infrastruktur existiert** -- Forgejo, MinIO, Matrix, Monitoring, alles auf Mac Mini
4. **SvelteKit-Frontend-System ist ausgereift** -- 19 Web-Apps, geteilte Packages, PWA-Support
5. **Auth-System ist zentral und robust** -- Better Auth + EdDSA + JWKS + SSO
6. **Credit-/Abo-System existiert** -- Stripe-Integration, Gilden, Gift Codes
7. **AI-Pipeline existiert** -- LLM, Image Gen, STT, TTS, alles lokal auf Apple Silicon

---

## 2. Drei moegliche Stacks

### Option A: "Pragmatisch" -- SvelteKit + Canvas/WebGL + Go Backend

**Philosophie:** Maximale Wiederverwendung, minimaler Neuaufbau. Kein eigener Game-Engine -- stattdessen 2D/2.5D-Experiences im Browser mit Canvas/WebGL.

```
┌─────────────────────────────────────────────┐
│  Browser (SvelteKit + PWA)                   │
│  ┌─────────────┐  ┌──────────────────────┐  │
│  │ Game Canvas  │  │ SvelteKit UI/Editor  │  │
│  │ PixiJS/Three │  │ (bekannter Stack)    │  │
│  └──────┬──────┘  └──────────┬───────────┘  │
│         │ WebSocket           │ REST/WS      │
└─────────┼─────────────────────┼──────────────┘
          │                     │
┌─────────▼─────────────────────▼──────────────┐
│  mana-game-server (Go)                        │
│  - Goroutine pro Game-Instanz                 │
│  - Lua-Sandbox (GopherLua oder Luau)          │
│  - Physik: Box2D (2D) oder Rapier (WASM)      │
│  - State → PostgreSQL + Redis                 │
└───────────────────────────────────────────────┘
```

| Komponente     | Technologie                                | Begruendung                                |
| -------------- | ------------------------------------------ | ------------------------------------------ |
| Frontend       | SvelteKit + PixiJS (2D) oder Three.js (3D) | Bestehender Stack, PWA, SSR                |
| Game Rendering | PixiJS (2D) oder Three.js/WebGPU           | Browser-nativ, kein Download               |
| Game Server    | Go + goroutines                            | Haben wir, performant, 1 goroutine/Instanz |
| User Scripting | GopherLua (Lua in Go)                      | Einfach, sandboxed, Roblox-aehnlich        |
| Physik         | Box2D (2D) oder Rapier via WASM            | Bewaehrt                                   |
| Daten          | PostgreSQL + Redis + Dexie.js              | Bestehend                                  |
| Assets         | MinIO                                      | Bestehend, S3-kompatibel                   |
| Auth           | mana-auth                                  | Bestehend                                  |
| Economy        | mana-credits + Stripe                      | Bestehend                                  |
| Sync           | mana-sync (angepasst)                      | Bestehend                                  |

**Vorteile:**

- 70-80% des Stacks existiert bereits
- Team kennt alle Technologien
- Schnellster Time-to-Prototype (~3-6 Monate)
- Self-Hosted von Tag 1

**Nachteile:**

- 2D/2.5D limitiert die Vision (kein "echtes" 3D-Roblox)
- GopherLua ist langsamer als native Luau
- Skalierung auf tausende gleichzeitige Instanzen braucht Arbeit
- Kein nativer Mobile-Client (nur PWA)

**Geeignet fuer:** Ein "2D Roblox" -- eher wie ein Scratch/Roblox-Hybrid fuer kreative Browser-Experiences. Denke an Habbo Hotel trifft Roblox.

---

### Option B: "Ambitioniert" -- Go Game Server + WebGPU Frontend + WASM Scripting

**Philosophie:** Volle 3D-Plattform, aber Go als Backend-Kern statt Rust. Browser-first via WebGPU.

```
┌──────────────────────────────────────────────┐
│  Browser (WebGPU + WASM)                      │
│  ┌─────────────────┐  ┌───────────────────┐  │
│  │ 3D Engine (WASM) │  │ Editor UI         │  │
│  │ Three.js/Babylon │  │ (Svelte)          │  │
│  │ oder Custom      │  │                   │  │
│  └───────┬─────────┘  └────────┬──────────┘  │
│          │ WebTransport         │ REST        │
└──────────┼──────────────────────┼─────────────┘
           │                      │
┌──────────▼──────────────────────▼─────────────┐
│  mana-game-server (Go)                         │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐       │
│  │ Instanz A│ │ Instanz B│ │ Instanz C│       │
│  │ WASM VM  │ │ WASM VM  │ │ WASM VM  │       │
│  │(wazero)  │ │(wazero)  │ │(wazero)  │       │
│  └──────────┘ └──────────┘ └──────────┘       │
│  Rapier Physik (WASM) │ ECS State Mgmt        │
│  PostgreSQL + Redis + mana-sync               │
└───────────────────────────────────────────────┘
```

| Komponente     | Technologie                                  | Begruendung                                    |
| -------------- | -------------------------------------------- | ---------------------------------------------- |
| 3D-Rendering   | Three.js + WebGPU Renderer ODER Babylon.js 7 | Reif, WebGPU-faehig, grosse Community          |
| Editor UI      | SvelteKit (eingebettet)                      | Bestehende Expertise                           |
| Game Server    | Go + wazero (WASM Runtime)                   | Go-Expertise, wazero ist reine Go-WASM-Runtime |
| User Scripting | TypeScript -> WASM (via AssemblyScript)      | Moderner als Lua, in wazero sandboxed          |
| Physik         | Rapier (via WASM in wazero)                  | Deterministisch, Rust-basiert, WASM-fertig     |
| Networking     | WebTransport (Go: quic-go)                   | QUIC-basiert, unreliable datagrams             |
| Daten          | PostgreSQL + Redis + Dexie.js                | Bestehend                                      |
| Assets         | MinIO + CDN-Layer                            | Bestehend                                      |
| Auth           | mana-auth                                    | Bestehend                                      |
| Economy        | mana-credits (erweitert)                     | Bestehend, mit Double-Entry-Erweiterung        |
| AI NPCs        | mana-llm (Ollama)                            | Bestehend                                      |
| AI Assets      | mana-image-gen (FLUX) + 3D-Pipeline          | Bestehend + Erweiterung                        |
| Moderation     | Custom ML + bestehende Filter                | Neu + bestehende Infra                         |

**Schluessel-Technologie: wazero**

[wazero](https://wazero.io) ist eine **reine Go-WASM-Runtime** (null CGo-Abhaengigkeiten):

- Fuehrt WASM-Module in Go-Prozessen aus
- Sandboxed: User-Code kann nicht aus dem WASM-Memory ausbrechen
- Fuel Metering moeglich (Instruction Limits)
- Laeuft ueberall wo Go laeuft -- inklusive Mac Mini M4
- ~50-70% der Performance von Wasmtime (Rust), aber deutlich besser als Lua-Interpreter

**Vorteile:**

- Go-Kern -- Team kennt die Sprache, keine neue Sprache lernen
- WASM-Scripting ist zukunftssicher und sicherer als Lua
- WebGPU/Three.js fuer 3D im Browser
- 50-60% bestehende Infrastruktur wiederverwendbar
- Self-Hosted moeglich
- quic-go existiert als reife Go-QUIC-Library

**Nachteile:**

- Three.js/Babylon.js sind keine "echten" Game Engines -- Physik, Networking, ECS muss custom gebaut werden
- wazero ist langsamer als Wasmtime (kein JIT, nur Interpreter + AOT)
- Go's GC kann bei Game-Server-Tick-Rates (60Hz) stoeren
- Team braucht 3D-/Game-Development-Expertise
- 12-18 Monate bis spielbarer Prototyp

**Geeignet fuer:** Eine ernsthafte 3D-UGC-Plattform mit Browser-First-Ansatz, die auf bestehendem Go-Wissen aufbaut.

---

### Option C: "State of the Art" -- Rust Engine + Go Services + Svelte Editor

**Philosophie:** Bestes Tool fuer jeden Job. Rust fuer Engine/Performance-kritisches, Go fuer Backend-Services, Svelte fuer UI. Maximale technische Qualitaet.

```
┌───────────────────────────────────────────────┐
│  Browser                                       │
│  ┌──────────────────┐  ┌───────────────────┐  │
│  │ Bevy Engine (WASM)│  │ Svelte Editor UI  │  │
│  │ wgpu → WebGPU     │  │ (bekannter Stack) │  │
│  │ Rapier Physik      │  │                   │  │
│  │ WASM User Scripts  │  │                   │  │
│  └────────┬─────────┘  └───────┬───────────┘  │
│           │ WebTransport        │ REST         │
└───────────┼─────────────────────┼──────────────┘
            │                     │
┌───────────▼─────────────────────▼──────────────┐
│  Game Server (Rust/Bevy headless)               │
│  - ECS mit Bevy                                 │
│  - WASM Sandbox (Wasmtime)                      │
│  - Rapier Physik                                │
│  - WebTransport via Quinn                       │
│  - Orchestriert von Go-Service                  │
└──────────────────┬─────────────────────────────┘
                   │
┌──────────────────▼─────────────────────────────┐
│  Backend (Go -- bestehender Stack)              │
│  - mana-auth (Hono/Bun)                        │
│  - mana-credits (Hono/Bun)                     │
│  - mana-game-orchestrator (Go, NEU)             │
│  - mana-sync (Go)                              │
│  - mana-matchmaker (Go, NEU)                   │
│  - PostgreSQL + Redis + MinIO                   │
└────────────────────────────────────────────────┘
```

| Komponente       | Technologie                               | Begruendung                        |
| ---------------- | ----------------------------------------- | ---------------------------------- |
| Game Engine      | Bevy (Rust) + wgpu                        | ECS, WebGPU-nativ, WASM-Output     |
| Client Rendering | wgpu → WebGPU                             | Hardware-nah, Cross-Platform       |
| Editor UI        | Svelte 5 (eingebettet via Web Components) | Bestehende Expertise               |
| Game Server      | Bevy headless (Rust)                      | Gleicher Engine-Code wie Client    |
| User Scripting   | WASM (Wasmtime) + TypeScript              | Maximum Security + Performance     |
| Physik           | Rapier (Rust, nativ)                      | Deterministisch, schnell           |
| Networking       | Quinn (Rust QUIC)                         | WebTransport, unreliable datagrams |
| Orchestrierung   | Go Service (mana-game-orchestrator)       | Go-Expertise fuer Infrastruktur    |
| Matchmaking      | Go Service (mana-matchmaker)              | Go-Expertise                       |
| Backend APIs     | Go + Hono (bestehend)                     | Bestehend                          |
| Economy          | TigerBeetle + mana-credits                | Double-Entry, 1M+ TPS              |
| Daten            | PostgreSQL + Redis + Dexie.js             | Bestehend                          |
| Assets           | MinIO + Cloudflare R2                     | Self-Hosted + CDN                  |
| AI               | Bestehende Python-Services                | LLM, Image Gen, STT, TTS           |

**Vorteile:**

- Technisch ueberlegener Stack (Rust-Performance, ECS, native WASM)
- Gleicher Engine-Code auf Client und Server (Bevy)
- Maximum Security durch WASM + Rust
- Langfristig die beste Architektur
- Go fuer Infrastruktur/Orchestrierung (Staerke)
- Bestehende Backend-Services wiederverwendbar

**Nachteile:**

- **Rust muss gelernt werden** -- signifikante Lernkurve (6-12 Monate)
- Bevy ist pre-1.0, API-Churn moeglich
- Laengster Time-to-Prototype (18-24 Monate)
- Zwei Systemsprachen (Rust + Go) erhoehen Komplexitaet
- Weniger Self-Hosting-freundlich (Rust-Compilation braucht mehr Build-Infra)

**Geeignet fuer:** Den langfristigen Bau einer technisch erstklassigen UGC-Plattform, wenn das Team bereit ist, in Rust zu investieren.

---

### Vergleich der drei Optionen

| Kriterium                   | A: Pragmatisch     | B: Ambitioniert        | C: State of Art             |
| --------------------------- | ------------------ | ---------------------- | --------------------------- |
| **Time-to-Prototype**       | 3-6 Monate         | 12-18 Monate           | 18-24 Monate                |
| **Wiederverwendung**        | 70-80%             | 50-60%                 | 40-50%                      |
| **Neue Sprachen**           | Keine              | Keine (+ WASM-Tooling) | Rust                        |
| **3D-Faehigkeit**           | 2D/2.5D            | Volles 3D              | Volles 3D (beste Qualitaet) |
| **Performance**             | Gut                | Sehr gut               | Exzellent                   |
| **Self-Hosting**            | Trivial            | Machbar                | Aufwaendiger                |
| **Skalierung**              | Hunderte Instanzen | Tausende Instanzen     | Zehntausende Instanzen      |
| **Team-Fit**                | Perfekt            | Gut (neues 3D-Wissen)  | Herausfordernd (Rust)       |
| **Max Spieler/Instanz**     | ~20-50             | ~100-200               | ~200-500                    |
| **Langfristiges Potenzial** | Begrenzt           | Hoch                   | Sehr hoch                   |
| **Scripting**               | Lua (GopherLua)    | WASM (wazero)          | WASM (Wasmtime)             |
| **Risiko**                  | Niedrig            | Mittel                 | Hoch                        |

---

## 3. Warum nicht Go?

Go ist eine exzellente Sprache -- wir nutzen sie bereits fuer 6 Produktionsservices. Aber fuer einen **Game Engine** hat Go spezifische Limitierungen:

### Go's Staerken (warum wir es bereits nutzen)

- **Goroutines:** Perfekt fuer I/O-bound Services (WebSocket-Handling, API-Gateway, Crawler)
- **Einfache Deployment:** Einzelnes Binary, Cross-Compilation
- **Schnelle Kompilierung:** Sekunden statt Minuten
- **Gute Standard-Library:** HTTP, JSON, Crypto, Testing
- **Garbage Collector:** Fuer API-Services kein Problem (Pausen <1ms seit Go 1.19)

### Go's Schwaechen fuer Game Engines

**1. Garbage Collector bei 60Hz Game Loop**

Ein Game-Server-Tick laeuft idealerweise alle 16.6ms (60Hz). Go's GC ist exzellent fuer API-Services, aber fuer Game Loops:

- GC-Pausen sind zwar kurz (<1ms), aber nicht deterministisch
- Bei 240Hz-Physik wie Roblox (4.16ms pro Tick) wird jede Pause spuerbar
- Object Pooling und Arena Allocation helfen, kaempfen aber gegen Go's Speichermodell

**2. Kein SIMD / Low-Level-Kontrolle**

- Go abstrahiert Hardware-Details bewusst weg
- Physik-Engines brauchen SIMD (Single Instruction Multiple Data) fuer Matrix/Vektor-Operationen
- In Go gibt es kein `unsafe` SIMD -- man muss auf CGo oder Assembly zurueckgreifen
- Rust/C++ haben nativen SIMD-Support

**3. CGo-Overhead**

Wenn wir Performance-kritische Libraries einbinden (Physik, Rendering):

- CGo-Aufrufe kosten ~100-200ns pro Call (vs. ~1ns fuer native Funktionsaufrufe)
- Bei tausenden Physics-Calls pro Frame summiert sich das
- wazero umgeht CGo, ist aber langsamer als native WASM-Runtimes (Wasmtime)

**4. Kein WebGPU/WASM-Output**

- Go kompiliert nicht zu WebAssembly mit WebGPU-Zugang (TinyGo kann WASM, aber ohne GPU)
- Ein Browser-Client muesste in einer anderen Sprache geschrieben werden
- Es gibt keine Go-Game-Engines fuer den Browser

### Wo Go trotzdem glaenzt

Go ist perfekt fuer alles **ausser dem Game-Engine-Kern**:

| Go verwenden fuer          | Nicht Go verwenden fuer         |
| -------------------------- | ------------------------------- |
| Game-Server-Orchestrierung | Game-Engine-Rendering           |
| Matchmaking-Service        | Physik-Simulation (bei >60Hz)   |
| API-Gateway                | WASM-Scripting-Runtime (Client) |
| Asset-Pipeline/CDN         | Client-Side Game Code           |
| Moderation-Service         | ECS-Tick-Loop                   |
| Economy-Backend            |                                 |
| WebSocket-Relay/Proxy      |                                 |
| Monitoring/Metriken        |                                 |

### Empfehlung

**Go als Backend-Infrastruktur, nicht als Game-Engine.** Das ist genau wie bei Option B: Go orchestriert die Game-Server, managed Matchmaking, Assets, Economy -- aber der Game-Loop selbst laeuft in einer optimierteren Runtime (WASM/Rust).

---

## 4. Self-Hosting & Local-First

### Was wir bereits selbst hosten

Unser Selbst-Hosting-Stack ist beeindruckend umfangreich:

| Dienst                 | Technologie                      | Ersetzt                 |
| ---------------------- | -------------------------------- | ----------------------- |
| **Git & CI/CD**        | Forgejo 11 + Runner              | GitHub + GitHub Actions |
| **Object Storage**     | MinIO                            | AWS S3                  |
| **Chat/Kommunikation** | Matrix Synapse + Element         | Slack/Discord           |
| **Monitoring**         | Grafana + VictoriaMetrics + Loki | Datadog                 |
| **Error Tracking**     | GlitchTip                        | Sentry                  |
| **Metriken**           | Prometheus + Pushgateway         | CloudWatch              |
| **Alerts**             | AlertManager + VMALert           | PagerDuty               |
| **Meta-Suche**         | SearXNG                          | Google API              |
| **LLM**                | Ollama (lokal)                   | OpenAI API              |
| **Image Gen**          | FLUX auf Apple Silicon           | DALL-E/Midjourney       |
| **STT**                | Whisper MLX (lokal)              | Cloud STT               |
| **TTS**                | Kokoro + Piper (lokal)           | Cloud TTS               |
| **Datenbank**          | PostgreSQL 16                    | Supabase/RDS            |
| **Cache**              | Redis 7                          | ElastiCache             |
| **Alle 25+ Services**  | Docker auf Mac Mini              | Diverse Cloud-Services  |

### Was fuer "Roblox Reimagined" zusaetzlich self-hosted werden muesste

#### Game-Server-Hosting

**Challenge:** Roblox betreibt 135.000 Server. Wir haben einen Mac Mini.

**Realistischer Self-Hosting-Ansatz:**

```
Mac Mini M4 (16 GB) -- Phase 1
├── 10-50 gleichzeitige Game-Instanzen (je ~100-200 MB)
├── Go-Orchestrator spawnt/killt Instanzen
├── ~200-500 gleichzeitige Spieler
└── Reicht fuer Alpha/Beta mit Community

Mac Mini M4 Pro (48 GB) -- Phase 2
├── 50-200 gleichzeitige Game-Instanzen
├── ~1.000-2.000 gleichzeitige Spieler
└── Reicht fuer fruehe Produktion

Mac Mini Cluster (3x M4 Pro) -- Phase 3
├── 200-600 gleichzeitige Game-Instanzen
├── ~3.000-5.000 gleichzeitige Spieler
└── Serious Self-Hosting
```

**Kostenschaetzung (Cloud-Vergleich):**

| Ansatz                          | Kosten/Monat                 | Kapazitaet        |
| ------------------------------- | ---------------------------- | ----------------- |
| Mac Mini M4 (bereits vorhanden) | ~$10 Strom                   | 50 Instanzen      |
| 3x Mac Mini M4 Pro              | ~$30 Strom + $3.600 einmalig | 600 Instanzen     |
| AWS/Fly.io (vergleichbar)       | ~$500-2.000/Monat            | 200-600 Instanzen |

Self-Hosting spart massiv -- aber skaliert nicht unbegrenzt. **Hybrid-Modell** empfohlen: Mac Mini fuer Basis-Last, Cloud-Burst fuer Peaks.

#### Asset-CDN

MinIO ist perfekt fuer Storage, aber nicht fuer globale Auslieferung.

**Loesung:**

- MinIO als Origin
- Cloudflare R2 als CDN-Mirror (zero egress, kostenlos bis 10 GB/Monat)
- Oder: Caddy/Nginx Reverse Proxy mit aggressivem Caching

#### TigerBeetle (Economy)

TigerBeetle ist self-hostable -- ein einzelnes Binary:

- Laeuft auf Linux/macOS
- ~100 MB RAM fuer Millionen Accounts
- Replication ueber VSR (Viewstamped Replication) fuer Hochverfuegbarkeit
- Koennte direkt auf dem Mac Mini laufen

### Local-First fuer Game-Experiences?

Unsere Local-First-Architektur (Dexie.js + mana-sync) koennte **angepasst** werden:

#### Was Local-First im Game-Kontext bedeutet

```
Spieler im Browser
├── Dexie.js (IndexedDB)
│   ├── Eigene erstellte Games (Offline-Editor!)
│   ├── Avatar/Inventar/Einstellungen
│   ├── Spielfortschritt (je Game)
│   └── Asset-Cache (Meshes, Texturen)
│
├── Bei Online-Verbindung:
│   ├── Sync eigener Games → mana-sync → PostgreSQL
│   ├── Sync Spielfortschritt
│   ├── Live-Multiplayer → Game-Server
│   └── Asset-Streaming ← MinIO/CDN
│
└── Bei Offline:
    ├── Eigene Games editieren (vollstaendig!)
    ├── Singleplayer spielen (lokal)
    ├── Inventar/Avatar aendern
    └── Beim naechsten Online: Sync
```

#### Konkrete Anwendungsfaelle

**1. Offline Game-Editor (starker Differentiator!)**

- Creator baut Game offline im Browser (Dexie.js speichert alles lokal)
- Bei Verbindung: Sync via mana-sync zum Server
- Andere sehen das Game sobald synchronisiert
- **Unser bestehender Local-First-Stack macht das moeglich!**

**2. Offline Singleplayer**

- Game-Logik laeuft als WASM im Browser
- Keine Server-Verbindung noetig fuer Singleplayer
- Spielfortschritt in Dexie.js, sync spaeter

**3. Guest Mode (bereits implementiert!)**

- Gast spielt ohne Account → alles in IndexedDB
- Erstellt Account → IndexedDB-Daten werden synchronisiert
- Exakt unser bestehendes Pattern

**4. Asset-Caching**

- 3D-Modelle und Texturen in IndexedDB zwischenspeichern
- Beim zweiten Besuch: sofortiges Laden aus Cache
- Roblox macht das mit ihrem nativen Client -- wir koennten es im Browser

### Self-Hosted Stack fuer "Roblox Reimagined"

| Dienst             | Technologie                | Self-Hosted? | Fallback      |
| ------------------ | -------------------------- | ------------ | ------------- |
| Game Server        | Go/Rust auf Mac Mini       | Ja           | Fly.io Burst  |
| Game Orchestrator  | Go (custom)                | Ja           | -             |
| Matchmaking        | Go (custom)                | Ja           | -             |
| Auth               | mana-auth (besteht)        | Ja           | -             |
| Economy            | TigerBeetle + mana-credits | Ja           | -             |
| User Data          | PostgreSQL (besteht)       | Ja           | -             |
| Cache              | Redis (besteht)            | Ja           | -             |
| Asset Storage      | MinIO (besteht)            | Ja           | Cloudflare R2 |
| Asset CDN          | Caddy + Cache              | Ja           | Cloudflare    |
| Local-First Sync   | mana-sync (besteht)        | Ja           | -             |
| LLM (NPCs)         | Ollama (besteht)           | Ja           | OpenRouter    |
| Image Gen (Assets) | FLUX (besteht)             | Ja           | -             |
| STT (Voice Chat)   | Whisper (besteht)          | Ja           | -             |
| TTS (NPCs)         | Kokoro/Piper (besteht)     | Ja           | -             |
| Monitoring         | Grafana Stack (besteht)    | Ja           | -             |
| Error Tracking     | GlitchTip (besteht)        | Ja           | -             |
| Git/CI             | Forgejo (besteht)          | Ja           | -             |
| Moderation         | Custom ML-Pipeline         | Ja           | Cloud API     |

**Ergebnis: Ja, fast alles ist self-hostable.** Der einzige Punkt, der Cloud brauchen koennte, ist CDN fuer globale Asset-Auslieferung (Cloudflare R2 ist aber fast kostenlos) und Cloud-Burst fuer Spitzen-Last.

---

## 5. Konkrete Architektur-Empfehlung

### Empfehlung: Option B mit Local-First-Erweiterungen

Option B ("Ambitioniert") ist der beste Kompromiss:

- **Go als Kern** (kein Rust lernen)
- **3D-faehig** (Three.js/Babylon.js + WebGPU)
- **WASM-Scripting** (via wazero, zukunftssicher)
- **Local-First** (bestehender Stack, Offline-Editor)
- **Self-Hosted** (alles auf Mac Mini moeglich)
- **12-18 Monate** bis Prototyp (realistisch)

### Detaillierte Architektur

```
┌─────────────────────────────────────────────────────────────┐
│  BROWSER (Zero Install, PWA)                                 │
│                                                              │
│  ┌───────────────────┐  ┌─────────────────────────────────┐ │
│  │ 3D Rendering       │  │ UI Layer (Svelte 5)             │ │
│  │ Three.js + WebGPU  │  │ ┌─────────┐ ┌──────────────┐  │ │
│  │ Rapier.js (Physik)  │  │ │ Editor  │ │ Social/Chat  │  │ │
│  │ ECS (bitECS)        │  │ │ Visual  │ │ Marketplace  │  │ │
│  │                     │  │ │ Script  │ │ Profile      │  │ │
│  └────────┬────────────┘  │ │ Code    │ │ Settings     │  │ │
│           │                │ └─────────┘ └──────────────┘  │ │
│  ┌────────▼────────────┐  └─────────────────┬─────────────┘ │
│  │ WASM Sandbox         │                    │               │
│  │ (User Game Scripts)  │                    │               │
│  └────────┬────────────┘                    │               │
│           │                                  │               │
│  ┌────────▼──────────────────────────────────▼─────────────┐│
│  │ Dexie.js (IndexedDB)                                     ││
│  │ - Eigene Games (Offline-Editor!)                         ││
│  │ - Avatar, Inventar, Einstellungen                        ││
│  │ - Spielfortschritt                                       ││
│  │ - Asset-Cache (Meshes, Texturen)                         ││
│  └─────────────────────────┬───────────────────────────────┘│
│                             │ WebTransport + REST + WS       │
└─────────────────────────────┼────────────────────────────────┘
                              │
┌─────────────────────────────▼────────────────────────────────┐
│  GAME SERVER LAYER (Go)                                       │
│                                                               │
│  ┌───────────────────────────────────────────────────────┐   │
│  │ mana-game-orchestrator (Go, NEU)                       │   │
│  │ - Spawnt/killt Game-Instanzen als Subprozesse          │   │
│  │ - Health Monitoring + Auto-Restart                     │   │
│  │ - Ressourcen-Limits (Memory, CPU)                      │   │
│  │ - WebTransport Proxy (quic-go)                         │   │
│  └──────────┬────────────────────────────────────────────┘   │
│             │                                                 │
│  ┌──────────▼──────┐ ┌──────────────┐ ┌──────────────┐      │
│  │ Game Instance A  │ │ Instance B   │ │ Instance C   │      │
│  │ ┌──────────────┐│ │              │ │              │      │
│  │ │ wazero WASM  ││ │  (gleiche    │ │  (gleiche    │      │
│  │ │ - User Script││ │   Struktur)  │ │   Struktur)  │      │
│  │ │ - Physik     ││ │              │ │              │      │
│  │ │ - ECS State  ││ │              │ │              │      │
│  │ └──────────────┘│ │              │ │              │      │
│  │ Go Host:         │ │              │ │              │      │
│  │ - Networking     │ │              │ │              │      │
│  │ - Persistence    │ │              │ │              │      │
│  │ - Auth Check     │ │              │ │              │      │
│  └──────────────────┘ └──────────────┘ └──────────────┘      │
└──────────────────────────────┬────────────────────────────────┘
                               │
┌──────────────────────────────▼────────────────────────────────┐
│  BACKEND SERVICES (bestehend + erweitert)                      │
│                                                                │
│  ┌────────────┐ ┌──────────┐ ┌────────────┐ ┌──────────────┐ │
│  │ mana-auth  │ │ mana-    │ │ mana-sync  │ │ mana-        │ │
│  │ (Hono)     │ │ credits  │ │ (Go)       │ │ matchmaker   │ │
│  │ BESTEHT    │ │ (Hono)   │ │ BESTEHT    │ │ (Go, NEU)    │ │
│  │            │ │ BESTEHT  │ │ + erweitert│ │              │ │
│  └────────────┘ └──────────┘ └────────────┘ └──────────────┘ │
│                                                                │
│  ┌────────────┐ ┌──────────┐ ┌────────────┐ ┌──────────────┐ │
│  │ mana-user  │ │ mana-sub │ │ mana-      │ │ mana-notify  │ │
│  │ (Hono)     │ │ (Hono)   │ │ analytics  │ │ (Go)         │ │
│  │ BESTEHT    │ │ BESTEHT  │ │ (Hono)     │ │ BESTEHT      │ │
│  │            │ │          │ │ BESTEHT    │ │              │ │
│  └────────────┘ └──────────┘ └────────────┘ └──────────────┘ │
└──────────────────────────────┬────────────────────────────────┘
                               │
┌──────────────────────────────▼────────────────────────────────┐
│  AI SERVICES (bestehend)                                       │
│                                                                │
│  ┌────────────┐ ┌──────────┐ ┌────────────┐ ┌──────────────┐ │
│  │ mana-llm   │ │ mana-    │ │ mana-stt   │ │ mana-tts     │ │
│  │ (Python)   │ │ image-gen│ │ (Python)   │ │ (Python)     │ │
│  │ NPC-Dialog │ │ (Python) │ │ Voice Chat │ │ NPC-Sprache  │ │
│  │ + Quests   │ │ Texturen │ │ + Moderat. │ │              │ │
│  │ BESTEHT    │ │ BESTEHT  │ │ BESTEHT    │ │ BESTEHT      │ │
│  └────────────┘ └──────────┘ └────────────┘ └──────────────┘ │
└──────────────────────────────┬────────────────────────────────┘
                               │
┌──────────────────────────────▼────────────────────────────────┐
│  DATA LAYER (bestehend)                                        │
│                                                                │
│  ┌────────────┐ ┌──────────┐ ┌────────────┐ ┌──────────────┐ │
│  │ PostgreSQL │ │ Redis    │ │ MinIO      │ │ TigerBeetle  │ │
│  │ 16         │ │ 7        │ │ (S3)       │ │ (NEU)        │ │
│  │ BESTEHT    │ │ BESTEHT  │ │ BESTEHT    │ │ Economy      │ │
│  └────────────┘ └──────────┘ └────────────┘ └──────────────┘ │
└───────────────────────────────────────────────────────────────┘
```

### Schluessel-Bibliotheken (Client)

| Bibliothek                       | Zweck                   | Warum                                                            |
| -------------------------------- | ----------------------- | ---------------------------------------------------------------- |
| **Three.js** (+ WebGPU Renderer) | 3D-Rendering            | 1.3M woechtl. npm Downloads, WebGPU seit r163, riesige Community |
| **Rapier.js**                    | Client-Side Physik      | Rust -> WASM, deterministisch, 2D + 3D                           |
| **bitECS**                       | Entity Component System | Winzig (2 KB), extrem schnell, TypeScript                        |
| **Dexie.js**                     | Local-First Storage     | Besteht, bewiesen, 19 Apps                                       |
| **Svelte 5**                     | UI/Editor               | Besteht, bewiesen, runes                                         |

### Schluessel-Bibliotheken (Server)

| Bibliothek                                     | Zweck                          | Warum                      |
| ---------------------------------------------- | ------------------------------ | -------------------------- |
| **wazero**                                     | WASM-Sandbox fuer User-Scripts | Reine Go, kein CGo, sicher |
| **quic-go**                                    | WebTransport                   | Reife Go-QUIC-Library      |
| **pgx**                                        | PostgreSQL                     | Besteht, performant        |
| **go-redis**                                   | Redis                          | Besteht                    |
| **gorilla/websocket** oder **coder/websocket** | WebSocket (Fallback)           | Besteht in mana-sync       |

---

## 6. Was wir wiederverwenden koennen

### Direkt wiederverwendbar (kein Umbau)

| Komponente         | Dienst                       | Aufwand                                        |
| ------------------ | ---------------------------- | ---------------------------------------------- |
| Authentifizierung  | mana-auth                    | 0 -- funktioniert                              |
| Credits/Economy    | mana-credits                 | Minimal -- Erweiterung fuer Game-Transaktionen |
| Subscriptions      | mana-subscriptions           | 0 -- Premium-Abo fuer Creators                 |
| User-Profil        | mana-user                    | Minimal -- Avatar-Daten hinzufuegen            |
| Benachrichtigungen | mana-notify                  | 0 -- Push/Email/Matrix                         |
| Monitoring         | Grafana/VictoriaMetrics/Loki | 0 -- neue Dashboards                           |
| Error Tracking     | GlitchTip                    | 0 -- SDK einbinden                             |
| Object Storage     | MinIO                        | 0 -- neuer Bucket fuer Game-Assets             |
| Git/CI             | Forgejo                      | 0 -- Repo + Pipelines                          |
| Suche              | mana-search                  | Minimal -- Game-Suche als Endpoint             |
| LLM                | mana-llm                     | Minimal -- NPC-Dialog-Endpoint                 |
| Image Gen          | mana-image-gen               | Anpassung -- Textur-Generierung                |
| STT                | mana-stt                     | 0 -- Voice-Chat-Transkription                  |
| TTS                | mana-tts                     | 0 -- NPC-Sprachausgabe                         |

### Anpassbar (moderater Umbau)

| Komponente       | Basis                       | Aenderung                                   |
| ---------------- | --------------------------- | ------------------------------------------- |
| Local-First Sync | mana-sync                   | Game-World-Sync + Asset-Sync hinzufuegen    |
| Local Store      | @manacore/local-store       | Game-Collections (worlds, assets, progress) |
| Shared Auth      | @manacore/shared-auth       | Unveraendert, in neuer App nutzen           |
| Shared UI        | @manacore/shared-ui         | Editor-Komponenten ergaenzen                |
| API Client       | @manacore/shared-api-client | Game-Server-Endpoints hinzufuegen           |
| PWA              | @manacore/shared-pwa        | Offline-Game-Support                        |
| i18n             | @manacore/shared-i18n       | Game-spezifische Strings                    |
| Analytics        | mana-analytics              | Game-Metriken (Plays, Retention)            |

### Neu zu bauen

| Komponente                  | Technologie                   | Aufwand              |
| --------------------------- | ----------------------------- | -------------------- |
| **Game Engine (Client)**    | Three.js + Rapier.js + bitECS | Gross (Kern-Aufwand) |
| **Game Server**             | Go + wazero + quic-go         | Gross                |
| **Game Orchestrator**       | Go                            | Mittel               |
| **Matchmaker**              | Go                            | Mittel               |
| **Visual Script Editor**    | Svelte + Custom               | Gross                |
| **Code Script Editor**      | Monaco + Custom               | Mittel               |
| **3D World Editor**         | Three.js + Svelte             | Gross                |
| **Asset Pipeline**          | Go + WASM                     | Mittel               |
| **Moderation ML**           | Python + Custom               | Mittel               |
| **TigerBeetle Integration** | Go/Hono                       | Klein                |

---

## 7. Build-Phasen

### Phase 0: Proof of Concept (1-2 Monate)

**Ziel:** Validieren, dass der Stack funktioniert.

- [ ] Three.js + WebGPU Renderer im Browser: Eine 3D-Szene mit Physik (Rapier.js)
- [ ] bitECS: Entities spawnen, bewegen, synchronisieren
- [ ] Go Server mit quic-go: WebTransport-Verbindung zum Browser
- [ ] wazero: Ein einfaches User-Script (TypeScript -> WASM) ausfuehren, das Entities steuert
- [ ] Dexie.js: Szene lokal speichern und offline laden

**Ergebnis:** Ein Browser-Fenster mit 3D-Wuerfel, der sich per WASM-Script bewegt, mit Go-Server-Sync.

### Phase 1: Minimal Spielbare Plattform (3-6 Monate)

- [ ] Einfacher 3D-Editor (Objekte platzieren, Eigenschaften setzen)
- [ ] Visual Scripting (Knotenbasiert, kompiliert zu WASM)
- [ ] Multiplayer: 2-10 Spieler in einer Instanz
- [ ] mana-auth Integration (Login/Register)
- [ ] Game-Veroeffentlichung (speichern → anderen zugaenglich)
- [ ] Game-Entdeckung (Liste aller Games, Suche)
- [ ] Offline-Editor via Dexie.js

### Phase 2: Creator Economy (2-3 Monate)

- [ ] TigerBeetle Integration fuer virtuelle Waehrung
- [ ] In-Game-Purchases (Game Pass, Items)
- [ ] Creator-Auszahlungen via mana-credits + Stripe
- [ ] Asset Marketplace (3D-Modelle, Texturen, Scripts)
- [ ] Avatar-System mit kaufbaren Items

### Phase 3: Social & Scale (3-4 Monate)

- [ ] Freundeslisten, Party-System
- [ ] Voice Chat (mana-stt + WebRTC)
- [ ] Chat (bestehend, angepasst)
- [ ] Game-Orchestrator mit Auto-Scaling
- [ ] Matchmaking
- [ ] Moderation (Text + Voice + Content)

### Phase 4: AI & Advanced (laufend)

- [ ] LLM-NPCs (mana-llm)
- [ ] AI-Textur-Generierung (mana-image-gen angepasst)
- [ ] AI-Code-Assist im Editor (Claude API)
- [ ] 3D-Modell-Generierung (Meshy/Tripo API oder self-hosted)
- [ ] Voice-gesteuerte Spielerstellung

### Phase 5: Polish & Growth (laufend)

- [ ] Mobile PWA-Optimierung
- [ ] Advanced Rendering (Schatten, Reflektionen, Partikel)
- [ ] Performance-Optimierung (LOD, Streaming, Culling)
- [ ] Community-Features (Gruppen, Events, Wettbewerbe)
- [ ] Landing Page + Marketing

---

## Zusammenfassung

**Wir haben einen einzigartigen Vorteil:** Die meisten Teams, die eine UGC-Plattform bauen wollen, starten bei null. Wir haben bereits:

- 19 lokale-first-faehige Web-Apps in Produktion
- 6 Go-High-Performance-Services
- Ein funktionierendes Auth/Credit/Abo-System
- Eine vollstaendige AI-Pipeline (LLM, Image, STT, TTS)
- Komplette Self-Hosting-Infrastruktur
- SvelteKit-Frontend-Expertise ueber 19 Apps

**Empfehlung: Option B** -- Go Game Server + Three.js/WebGPU + WASM (wazero) + bestehende Infrastruktur. Browser-first, Local-First, Self-Hosted. Kein Rust lernen, kein Cloud-Vendor-Lock-in, maximale Wiederverwendung.

**Der Kern-Neuaufbau** (Game Engine + Server + Editor) ist der grosse Brocken. Aber alles drumherum -- Auth, Economy, AI, Storage, Monitoring, Deployment -- ist **bereits gebaut**.

---

_Erstellt: 28. Maerz 2026_
