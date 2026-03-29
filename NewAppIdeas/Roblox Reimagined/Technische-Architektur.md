# Roblox: Technische Architektur & moderner Neuaufbau

## Wie Roblox technisch funktioniert -- und wie man es heute besser bauen wuerde

---

## Inhaltsverzeichnis

1. [Wie Roblox heute technisch funktioniert](#teil-1-wie-roblox-heute-technisch-funktioniert)
2. [Wie man es heute mit modernster Technik bauen wuerde](#teil-2-wie-man-es-heute-mit-modernster-technik-bauen-wuerde)
3. [Was neue Technik ermoeglicht, das Roblox nicht kann](#teil-3-was-neue-technik-ermoeglicht-das-roblox-nicht-kann)

---

# Teil 1: Wie Roblox heute technisch funktioniert

## 1.1 Die Game Engine

Roblox nutzt eine **komplett eigenentwickelte C++-Engine**. Kein Unity, kein Unreal -- alles in-house seit 2006, stetig weiterentwickelt.

### Rendering

- **Windows:** Direct3D (DirectX)
- **macOS/iOS:** Metal
- **Roblox Studio:** Vulkan-Support seit 2017
- Seit 2014 eigener nativer Renderer (vorher OpenGL), optimiert fuer Low-End-Hardware und Mobile
- **"Enhanced Spatial Engine":** Naechste Generation mit Real-Time Ray Tracing und KI-gesteuerter Optimierung

### Beleuchtungssystem ("Future Is Bright")

Das Lighting-System ist eines der technisch interessantesten Teilsysteme:

- **Voxel-basiertes Lighting:** Jeder Voxel misst 4 Studs, inkrementell/lazy auf der CPU aktualisiert
- **Shadow-Mapping:** EVSM (Exponential Variance Shadow Maps) fuer weiche Schatten
- **Per-Pixel-Lighting:** Fuer lokale Lichtquellen (PointLight, SpotLight, SurfaceLight)
- **Forward-Rendering Pipeline:** Deferred Shading wurde evaluiert und verworfen -- zu viele transparente Objekte auf der Plattform
- Quality Level 3 und darunter: Fallback auf voxelisierte Beleuchtung fuer Performance

### Physik-Engine

- **Aktueller Solver:** PGS (Projected Gauss-Seidel), laeuft bei **240 Hz**
- Eigene Entwicklung -- kein ODE oder Bullet
- Historisch: Spring Physics (bis Maerz 2019), ein Articulated-Physics-Versuch 2013 (zu langsam, abgebrochen)
- **Network Ownership:** Jedes unverankerte Objekt hat einen "Network Owner" (Client), der die Physik berechnet. Kann manuell gesetzt werden (`BasePart:SetNetworkOwner`). `nil` = Server-exklusiv (Anti-Cheat)

## 1.2 Luau: Die Skriptsprache

Roblox hat aus Lua 5.1 eine eigene Sprache entwickelt: **Luau** (Open Source: github.com/luau-lang/luau).

### Sprach-Features

- **Gradual Typing:** Optionales Typsystem mit automatischer Typinferenz
- **Zwei Modi:** Strict Mode (Fehler vor Runtime) und Non-Strict Mode (minimiert False Positives)
- **Type Functions:** Fortgeschrittenes Typsystem fuer komplexere Patterns
- Vollstaendig rueckwaertskompatibel mit Lua 5.1

### Performance

| Modus                | Relative Performance                   |
| -------------------- | -------------------------------------- |
| Luau Interpreter     | ~1x (Baseline)                         |
| LuaJIT (Interpreter) | ~1x (vergleichbar)                     |
| LuaJIT (JIT)         | ~1.6x schneller                        |
| Luau Native Code Gen | 1.5-2.5x schneller (seit Oktober 2023) |

- **Native Code Generation:** Kompiliert Bytecode zu Maschinencode fuer x64 und ARM64
- **Garbage Collector:** Inkrementelles Design mit PID-Controller fuer Heap-Pacing (inspiriert vom Go GC), reduziert Pausenzeiten
- **Compiler:** Multi-Pass ueber AST, Bytecode-Erzeugung, Post-Process-Optimierungen (Function Inlining, Loop Unrolling)

### Sandboxing

- VM kann selbst bei boesartigem Code nicht aus der Sandbox entkommen
- `luaL_sandbox` auf Global State + `luaL_sandboxthread` pro Script-Thread
- Globale Tabellen sind pro Script isoliert, Built-in-Libraries vor Monkey-Patching geschuetzt

## 1.3 Server-Infrastruktur

### Skalierung

Die Zahlen sind beeindruckend:

| Metrik                 | Wert        |
| ---------------------- | ----------- |
| Server total           | 135.000+    |
| Core Data Centers      | 2           |
| Edge Data Centers      | 24          |
| Container              | 170.000+    |
| Peak CCU               | 30 Mio.+    |
| Concurrent Connections | 250 Mio.+   |
| DAU                    | 111,8+ Mio. |

### Orchestrierung: HashiCorp Stack (nicht Kubernetes!)

Roblox nutzt **nicht** Kubernetes, sondern den **HashiCorp Stack**:

- **Nomad** fuer Workload-Orchestrierung (gewaehlt ueber K8s, DC/OS, Docker Swarm -- Grund: unterstuetzt Windows + Linux Container und VMs)
- **Consul** fuer Service Discovery, automatisiertes Clustering, Service Mesh
- **Vault** fuer Secrets Management
- Setup-Zeit: Funktionierender Cluster + Bare-Metal-Deployment in **4 Tagen**

### Zellulaere Architektur

- Migration aller Services in **"Cells"** (wie Brandschutztueren -- Blast Radius containen)
- Jede Cell: ~1.400 Server
- Ganze Cells koennen repariert oder komplett neu provisioniert werden
- Cloud Bursting fuer Peak-Demand wird erprobt

### Load Balancing

- **"Roblox Load Balancer" (RLB):** Basiert auf HAProxy Enterprise Docker Container
- HAProxy handhabt **2 Mio.+ RPS mit SSL/TLS** auf einer einzigen Instanz
- WAF (Web Application Firewall) mit "ultra-low latency"
- Orchestriert mit Nomad, Service Discovery via Consul Template

### Containerisierung

- Evolution: Bare Metal -> Linux-basiert -> Container
- Envoy Proxy Sidecars neben jedem Service
- eBPF-Experimente zur Beobachtung von Connection State zwischen Proxies
- Common Control Plane ueber Core und Edge Data Centers

## 1.4 Networking & Replikation

### Client-Server-Modell

- **FilteringEnabled** (seit 2014, jetzt permanent): Client-Property-Aenderungen propagieren NICHT zum Server
- Client-zu-Server-Kommunikation ausschliesslich ueber **RemoteEvents** und **RemoteFunctions**
- Server repliziert Workspace und ReplicatedStorage automatisch zu Clients

### Instance Streaming

- **StreamingEnabled:** Automatisches Streaming basierend auf Kamera-Position des Spielers
- `StreamingTargetRadius` kontrolliert Streaming-Reichweite; `MinimumRadius` als Buffer
- Mesh- und Texturdaten werden immer on-demand gestreamt, unabhaengig von StreamingEnabled
- **Mesh Streaming:** Engine-Level-System fuer dynamische Detail- und Memory-Verwaltung ueber verschiedene Geraete

## 1.5 Game Hosting (RCCService)

- **RCCService:** Server-Komponente seit 2008
- 2020 von Windows auf Ubuntu migriert, 2021 Windows komplett eingestellt
- **Max Spieler pro Server:** 200 (Standard), 700 (Beta seit Juli 2024), war vor 2019 nur 100
- **Architektur:** POPs (Points of Presence) mit Game-Servern + zentrale Data Centers fuer Services
- Bei Join: Routing zu existierendem Server oder Spawn eines neuen, wenn alle voll
- Ein **NetworkReplicator** pro verbundenem Spieler

## 1.6 Datenpersistenz

### DataStoreService (Langzeit-Daten)

- Fuer Spielfortschritt, Inventar, Einstellungen
- **Nur serverseitig** zugaenglich (Sicherheit)
- **4 MB pro Key** (frueher 256 KB), 30 Tage Versionshistorie
- Rate Limits: 25 MB Lese-Durchsatz / 4 MB Schreib-Durchsatz pro Key pro Minute
- Bekannte Zuverlaessigkeitsprobleme bei Peak-Traffic (Wochenenden, Feiertage)

### MemoryStoreService (Kurzzeit-Daten)

- Hoher Durchsatz, niedrige Latenz (Leaderboards, Matchmaking-Queues)
- Daten verfallen nach maximal 45 Tagen
- Usage-Limit skaliert mit taeglichen Concurrent Players

## 1.7 Asset Pipeline & CDN

- Assets auf **rbxcdn.com** gespeichert mit **Checksum-Hashes** (Content-Addressable, Deduplizierung)
- CDN nutzt **AWS CloudFront** mit signierten URLs und Expiry-Timestamps
- Mesh Streaming (Early Access): Dynamische Detail- und Memory-Verwaltung ueber Geraete hinweg

## 1.8 KI & Moderation

### Text-Filterung (Skalierung)

| Metrik                       | Wert           |
| ---------------------------- | -------------- |
| Chat-Nachrichten/Tag         | 6,1 Milliarden |
| Peak RPS Text-Filtering      | 750.000+       |
| BERT-Classifier Requests/Tag | 1 Milliarde+   |
| Median-Latenz                | <20ms          |
| PII-Filter Peak RPS          | 370.000        |

- **BERT-basierter Classifier** auf CPUs (nicht GPUs!) -- 30x Boost durch DistilBERT + Dynamic Shapes + Quantization
- 3.000 Inferences/sec auf Intel Xeon 36-Core vs. 500/sec auf Tesla V100 (CPU ist kosteneffizienter)
- PII-Filter: 30% weniger False Positives, 25% mehr PII erkannt

### Voice-Moderation

- Sprachsicherheits-Classifier moderiert Chat **innerhalb von 15 Sekunden** in 8 Sprachen
- ASR-Transkription optimiert fuer Gaming-Sprache, dann Classifier-Analyse

### Fortgeschrittene Systeme

- **Sentinel:** KI-System zur Erkennung von Kindesgefaehrdungsmustern (2025 open-sourced)
- **Multi-modale Echtzeit-KI-Moderation:** Analysiert Avatare, Text und Umgebungen zusammen
- 0,01% der Milliarden Interaktionen als Policy-Verstoss erkannt, fast alle entfernt vor User-Exposition
- Menschliche Moderatoren weltweit fuer Sarkasmus, kodierte Sprache, kulturellen Kontext

### Matchmaking

- Evaluiert bis zu **4 Milliarden moegliche Join-Kombinationen pro Sekunde** bei Peak

## 1.9 Roblox Studio

- Unified Interface fuer 3D-Weltenbau, Luau-Programmierung, Echtzeit-Kollaboration
- **"Team Create":** Echtzeit-Workspace-Sync, Live-Script-Editing
- Third-Party-Sync-Tools: Argon (VS Code Extension), RbxSync (MCP Integration)
- Batch Commits fuer Collaborative Editing

## 1.10 Der 73-Stunden-Ausfall (Oktober 2021)

- **Root Cause:** Consul Streaming Feature unter hoher Read/Write-Last + pathologisches BoltDB-Performance-Problem
- Ein einzelner Consul-Cluster fuer mehrere Workloads verstaerkte den Impact
- Monitoring-Systeme hingen vom selben fehlerhaften System ab -- keine Sichtbarkeit
- **Loesung:** HashiCorp + Roblox entwickelten BoltDB-Compaction-Prozess
- **Konsequenz:** Zellulaere Infrastruktur-Initiative + zusaetzliches Data Center

---

# Teil 2: Wie man es heute mit modernster Technik bauen wuerde

## 2.1 Engine: Bevy (Rust) + wgpu -> WebGPU/WASM

### Warum nicht Roblox' Ansatz kopieren?

Roblox' Custom C++-Engine ist ein 20 Jahre altes Projekt mit enormem technischen Schulden. Heute wuerde man **Rust** waehlen:

### Empfehlung: Bevy ECS + wgpu

**Bevy** (Rust-basierte ECS Game Engine, 0.15+ ab Ende 2025):

| Vorteil             | Detail                                                                          |
| ------------------- | ------------------------------------------------------------------------------- |
| **Rust-Sicherheit** | Keine Use-After-Free, keine Buffer Overflows, keine Data Races                  |
| **ECS-Architektur** | Entity Component System trennt Daten von Logik -- macht Sandboxing natuerlicher |
| **WebGPU-Output**   | Kompiliert nativ zu WASM/WebGPU via wgpu                                        |
| **Cross-Platform**  | Eine Codebase fuer Browser, Desktop, Mobile                                     |
| **Performance**     | Rust-Level Performance ohne GC-Pausen                                           |

**wgpu** ist die Rendering-Abstraktion (benutzt auch von Firefox) und unterstuetzt:

- WebGPU im Browser
- Vulkan auf Linux/Android
- Metal auf macOS/iOS
- DirectX 12 auf Windows

### Browser-Native: Der entscheidende Unterschied

Roblox erfordert einen nativen Client-Download. Mit **WebGPU + WASM** koennte eine neue Plattform **direkt im Browser laufen**:

- **WebGPU:** Shipped in Chrome 113 (2023), Firefox 141 (2025), Safari 18.2 -- ~70-75% Abdeckung
- **WASM-Performance:** Innerhalb von 10-20% nativer Performance fuer Compute-gebundene Arbeit
- **Zero-Install:** Kein Download, kein App Store -- massiv niedrigere Einstiegshuerde

### Alternativen und warum nicht

| Option                     | Bewertung                                                                                                                                        |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Godot 4**                | Maturer Editor, aber Architektur nicht fuer UGC-Sandboxing designed. WebGPU-Export experimentell. Gut fuers Prototyping, riskant fuer Produktion |
| **Custom Engine auf wgpu** | Maximale Kontrolle, maximaler Aufwand. Nur gerechtfertigt, wenn Bevy's Abstraktionen limitierend werden                                          |
| **Unity/Unreal**           | Zu schwer, zu teuer, Lizenzprobleme, nicht fuer UGC-Sandboxing gebaut                                                                            |

## 2.2 User-Scripting: WASM-Sandbox + TypeScript

### Roblox' Ansatz: Luau

Luau funktioniert hervorragend fuer seinen Zweck, ist aber eine Nischen-Sprache. Die Community nutzt bereits **roblox-ts** (TypeScript-zu-Luau-Transpiler).

### Moderner Ansatz: Duale Architektur

**Client-Side: WASM Sandbox (Wasmtime)**

- **Hardware-Level-Sandboxing:** Lineare Speicherisolation -- User-Code kann die Sandbox physisch nicht verlassen
- **Fuel-basiertes Execution Metering:** Instruktionslimits pro Frame verhindern Endlosschleifen
- **WASI Preview 2 (Component Model):** Typisierte Host-Guest-Interfaces
- User schreiben **TypeScript**, das zu WASM kompiliert wird. Kompilationslatenz: Sekunden -> "Compile and Hot-Reload"-Workflow
- **Extism** als Framework fuer WASM-Plugin-Systeme

**Server-Side: V8 Isolates (Deno/workerd)**

- Das Cloudflare-Workers-Modell: Startup in ~5ms, vertrautes JS-Oekosystem
- Fuer server-autoritative Logik, Matchmaking, Economy-Regeln
- V8 ist gross (~30 MB), hoehrer Memory-Overhead als WASM, unvorhersehbare GC-Pausen -- deshalb nur serverseitig

**Visual Scripting Layer**

- Knotenbasiert (wie Unreal Blueprints), kompiliert zu WASM
- Table Stakes fuer einen Roblox-Konkurrenten -- Kinder muessen Games ohne Code bauen koennen

### Sicherheitsmodell

```
User-Code (TypeScript)
    |
    v
WASM-Compilation
    |
    v
Wasmtime Sandbox
  - Lineare Speicherisolation
  - Fuel Metering (Instructions/Frame)
  - Capability-based API Access (deklarierte Permissions)
  - Kein Dateisystem/Netzwerk-Zugriff
```

## 2.3 Server-Infrastruktur: Von Fly.io zu Agones

### Roblox' Ansatz

- Eigene Data Centers + HashiCorp Nomad
- 135.000+ Server, zellulaere Architektur
- Funktioniert, aber enormer Ops-Aufwand

### Moderner Ansatz: Gestaffelt

**Tier 1 -- Leichtgewicht (<10 Spieler, einfache Logik):**

- **Fly.io Machines:** Spin-up in ~300ms, 30+ Regionen, Pay-per-Second
- Volle Linux-Container (Rust/Go-Server direkt)

**Tier 2 -- Medium (10-100 Spieler, Physik):**

- **Agones** auf Kubernetes (GKE/EKS)
- Google/CNCF-Standard fuer Game-Server-Orchestrierung
- Handles: Allocation, Scaling, Health, Fleet Management
- **Quilkin:** Agones-Companion-Proxy fuer UDP Load Balancing, Telemetrie, Traffic Shaping
- Spot/Preemptible Instances fuer Kosteneffizienz

**Tier 3 -- Heavy (100+ Spieler):**

- Bare Metal oder Reserved Instances
- SpatialOS-aehnliche Entity-Distribution ueber mehrere Prozesse
- Fuer Massively-Multiplayer-Experiences

**Weitere Komponenten:**

| Komponente        | Technologie                                          |
| ----------------- | ---------------------------------------------------- |
| Matchmaking       | **Open Match** (Google, Open Source) oder custom     |
| Fleet Management  | Agones GameServerAllocation + Fly.io Machines API    |
| State Persistence | Checkpoint zu Object Storage (S3/R2) alle N Sekunden |
| Global Routing    | Anycast oder Latency-based DNS                       |

### Warum nicht Cloudflare Durable Objects?

- Starke Konsistenz innerhalb eines einzelnen Objekts
- Limitiert auf ~128 MB Memory, Single-threaded JS
- **Nicht geeignet** fuer physik-intensive Game-Server

## 2.4 Networking: WebTransport (QUIC)

### Roblox' Ansatz

Custom binary protocol ueber TCP/UDP mit proprietaerem Replication-System.

### Moderner Ansatz: WebTransport

**WebTransport ueber HTTP/3 (QUIC)** ist der klare Gewinner:

| Feature                  | Vorteil                                   |
| ------------------------ | ----------------------------------------- |
| **Unreliable Datagrams** | Positionsupdates (kein Retransmit noetig) |
| **Reliable Streams**     | Chat, Inventar, Transaktionen             |
| **Multiplexed**          | Kein Head-of-Line-Blocking (TCP-Problem)  |
| **0-RTT Connection**     | Sofortige Wiederverbindung                |

- Unterstuetzt in Chrome, Edge, Firefox (seit 114), Safari 18.2
- **QUIC-Library:** Quinn (Rust) -- integriert gut mit Bevy/Rust

### State-Synchronisation

- **Server-autoritativ mit Client-Side-Prediction** (Standard)
- **Interest Management:** Spatial Hashing oder Grid-based AOI (Area of Interest) Culling
- **ECS-Component-Level-Replikation:** Transform bei 20 Hz unreliable, Health bei Aenderung reliable
- **CRDTs:** Nur fuer Collaborative/Creative Tools (Building, geteilte Inventare) -- NICHT fuer Physik/Kampf/Economy
- **Rollback Netcode:** Nur fuer kompetitive Fighting Games relevant; Standard Server-Auth + Prediction reicht

### Fallbacks

- **WebSocket:** Reliable-only, TCP, Head-of-Line-Blocking -> nur als Fallback
- **WebRTC:** Nur fuer Voice Chat (Spatial Audio), zu komplex fuer Client-Server-Game-Traffic

## 2.5 Datenbank & Economy: TigerBeetle + PostgreSQL + Dragonfly

### Roblox' Ansatz

DataStoreService (proprietaer, bekannte Zuverlaessigkeitsprobleme) + MemoryStoreService.

### Moderner Ansatz: Spezialisierte Datenbanken

**Virtuelle Economy: TigerBeetle**

- **Purpose-built fuer Financial Accounting**
- 1 Mio.+ Transfers/Sekunde auf einem einzelnen Node mit strikter Serialisierbarkeit
- **Double-Entry-Bookkeeping** ins Datenmodell eingebaut (Debit + Credit pro Transfer)
- Keine "verlorenen" Robux, keine Race Conditions, keine Negative-Balance-Exploits

**Account-Struktur:**

```
Platform Treasury ("Zentralbank")
  |
  +-- User Wallets
  |     +-- Earned Currency (durch Spielen verdient)
  |     +-- Purchased Currency (gekauft)
  |
  +-- Game Revenue Accounts (pro veroeffentlichtem Spiel)
  |
  +-- Marketplace Escrow (Treuhand fuer Handel)
  |
  +-- Creator Payout Pending (ausstehende Auszahlungen)
```

Automatischer Revenue Split: 70% Creator / 30% Plattform (konfigurierbar) -- deutlich fairer als Roblox' ~24,5%.

**User-Daten: PostgreSQL (Supabase)**

- Bewaeherter Stack, kann spaeter zu **CockroachDB** migrieren fuer Multi-Region Write Consistency
- CockroachDB: Distributed SQL, Postgres-kompatibles Wire Protocol

**Real-Time State: Dragonfly (Redis-kompatibel)**

- Multi-threaded, speicher-effizienter als Redis
- Fuer: Player Presence, Matchmaking Queues, Leaderboards, Sessions, Pub/Sub
- Alternative: **KeyDB** (Multi-threaded Redis Fork, jetzt Teil von Snap)

**Asset Storage: Cloudflare R2**

- S3-kompatibel, **null Egress-Kosten**, globale Distribution
- Content-Addressable Storage wie Roblox (Hash-basiert, Deduplizierung)

## 2.6 KI-Integration: Was heute moeglich ist

### LLM-gesteuerte NPCs

- **Kleine Modelle (1-7B Parameter):** Phi-3, Gemma 2, Llama 3.x bei 1-3B
- Inferenz: <100ms auf modernen GPUs
- **Structured Generation** (Outlines, LMFE): Beschraenkt Output auf valide Game-Actions/Schemas
- **Server-Side Batch Inference:** vLLM oder TensorRT-LLM. Ein A100 handhabt hunderte NPC-Konversationen
- **Memory:** Vector Store (Qdrant, Weaviate) pro NPC + RAG ueber Game-Lore/Regeln
- **Kosten-Realitaet:** LLM-NPCs sind teuer im Scale. Reservieren fuer Schluesselcharaktere -- Hintergrund-NPCs nutzen Behavior Trees

### KI-Asset-Generierung

| Asset-Typ              | Technologie                           | Status                                             |
| ---------------------- | ------------------------------------- | -------------------------------------------------- |
| **3D-Modelle**         | Meshy, Tripo, Rodin Gen-2             | Text/Bild -> Mesh in Sekunden, Game-ready Low-Poly |
| **Single Image -> 3D** | InstantMesh / LRM-based               | <10 Sekunden                                       |
| **Texturen**           | Stable Diffusion / FLUX               | PBR-Textur aus Text, sehr ausgereift               |
| **Animationen**        | Motion Diffusion Models (MDM, MoMask) | Text -> Animation, braucht noch Cleanup            |

**Automatische Pipeline:**

```
KI generiert Mesh -> Auto-Retopology -> Auto-UV -> Auto-LOD -> Asset Store
```

### KI-gestuetzte Spielerstellung

- **Natural Language -> Game Logic:** Claude/GPT-4-Klasse-Modelle mit gutem API-Kontext -- heute schon viable
- **LLM-Autocomplete** im Scripting-IDE
- **KI-Playtesting:** RL-Agenten erkennen automatisch Softlocks, Exploits, Balance-Probleme

### KI-Moderation

- **Multi-modale Modelle** (Vision + Text) fuer Asset-, Chat- und Game-Content-Scanning
- **Behavioral ML** fuer Griefing-, Exploit- und Botting-Erkennung
- **Echtzeit-Voice:** Whisper-Transkription -> Text-Toxicity-Classification (~1-2 Sekunden Latenz)

## 2.7 3D/Grafik-Innovationen

### Gaussian Splatting: Die Killer-UGC-Feature

- **Echtzeit-Rendering bei 60fps** auf Desktop-GPUs (2025-2026)
- **Killer-Feature fuer UGC:** Handy-Photogrammetrie-Scan -> Import als Game-Welt
- WebGPU kann via Compute Shaders rendern -- Open-Source WebGPU-Splat-Renderer existieren
- **Limitation:** View-dependent, interagiert schlecht mit traditionellem Lighting/Physik/Animation
- **Empfehlung: Hybrid Rendering** -- Mesh-basierte Charaktere + Gaussian-Splat-Umgebungen

### Neural Rendering

- **Neural Texture Compression:** Hoehere Qualitaet als BC7 bei gleicher Bitrate (shipped in NVIDIA Ada GPUs)
- **Neural LOD:** Perzeptuell bessere Mesh-Decimation. Research-to-Production-Stadium

### Nanite-aehnliche Geometry Virtualization

- Erfordert tiefes GPU-Wissen und Jahre Entwicklung -- nicht praktikabel fuer ein Startup
- **Praktische Alternative:** Aggressive LOD-Generierung + **Meshlet-basiertes Rendering** (Meshes in ~64-128 Triangle-Cluster teilen, GPU-per-Cluster-Culling)
- Machbar mit WebGPU Compute Shaders: **80% des Nutzens bei 10% des Aufwands**

### Ray Tracing auf Mobile

- Hardware-RT existiert auf Qualcomm Adreno, ARM Mali (limitiert auf Schatten/Reflektionen)
- WebGPU hat **noch keine Ray-Tracing-APIs** (Stand frueh 2026)
- Timeline: WebGPU RT experimentell in Chrome Ende 2026-2027. Praktisches Mobile-Browser-RT: 2027-2028
- **Fuer jetzt:** Screen-Space Reflections und Ambient Occlusion via WebGPU Compute

---

# Teil 3: Was neue Technik ermoeglicht, das Roblox nicht kann

## 3.1 Zero-Install Browser-Experience

Roblox erfordert einen nativen Client-Download. Mit WebGPU + WASM koennte eine neue Plattform **komplett im Browser laufen** -- kein Download, kein App Store, kein Google/Apple-Gatekeeping. Ein Link reicht.

**Impact:** Massiv niedrigere Akquisitionskosten, sofortiger Zugang, einfacheres Teilen ("Schau dir mein Spiel an" -> ein Klick).

## 3.2 Groessere Welten

- WebGPU + WASM-Streaming-World-Loading mit Interest Management -> **effektiv unbegrenzte Weltgroesse**
- Prozedurale Generierung auf GPU via WebGPU Compute Shaders
- Roblox ist auf relativ kleine Welten limitiert

## 3.3 Mehr Spieler pro Instanz

| Ansatz                                  | Spieler                    |
| --------------------------------------- | -------------------------- |
| Roblox heute                            | 200 (Standard), 700 (Beta) |
| Interest Management + ECS Replikation   | 200-500 machbar            |
| SpatialOS-aehnliche Entity-Distribution | 1.000+ (komplex)           |

## 3.4 Cross-Game-Inventare

Roblox hat nur Avatar-Items, die plattformweit funktionieren. Eine neue Plattform koennte:

- Plattform-Level Item-Archetypes definieren (Cosmetic Skin, Currency, Badge/Achievement)
- Games gewaehren diese; Games waehlen, welche Plattform-Items sie anerkennen
- TigerBeetle fuer Cross-Game-Currency; PostgreSQL-Metadaten-Registry fuer Item-Definitionen
- **Kein Blockchain noetig** -- Double-Entry-Bookkeeping mit TigerBeetle ist zuverlaessiger und schneller

## 3.5 User-generierte KI-Verhaltensweisen

Roblox-NPCs nutzen simple Skripte. Neu moeglich:

- Creator definieren NPC-Persoenlichkeit und Wissen in Natural Language
- LLM generiert dynamische Dialoge und Reaktionen
- NPCs, die sich an individuelle Spieler erinnern (Vector Store pro NPC)
- KI-gesteuerte Quests, die sich an den Spielstil anpassen

## 3.6 Voice-gesteuerte Spielerstellung

- **Whisper/Deepgram STT + LLM:** "Mach die Burg groesser und fuege einen Graben hinzu" -> modifiziert die Spielwelt in Echtzeit
- Kinder koennten Games **durch Sprechen** erstellen, nicht durch Code oder GUI
- WebRTC fuer Echtzeit-Spatial-Audio Voice Chat

## 3.7 Spatial Computing / AR

- **WebXR + WebGPU** ermoeglicht AR/VR UGC-Games im Browser (Meta Quest Browser unterstuetzt beides)
- **Handy + LiDAR Scan -> Gaussian Splats -> editierbare Game-Welten**
- Das eigene Kinderzimmer wird zum Game-Level
- Apple Vision Pro: "UGC-Spiele ueberlagert auf deinem Raum" -- kleiner Markt, Technologie bereit

## 3.8 On-Device KI

- **WebNN** (Web Neural Network API) shipped in Chrome -- ML-Modelle auf Device-GPUs/NPUs im Browser
- **ONNX Runtime Web** mit WebGPU-Backend laesst Phi-3 Mini interaktiv im Browser laufen
- Use Cases: Style Transfer, On-Device NPC Inference, Client-Side Moderation, Gesture Recognition
- **Kein Server-Roundtrip noetig** fuer bestimmte KI-Features

## 3.9 Fairere Creator-Economy

Roblox: ~24,5% fuer Entwickler. Mit moderner Infrastruktur:

- **70/30 Split** (Creator/Plattform) wird moeglich weil:
  - Browser-Distribution eliminiert App-Store-Fees (Apple 30%, Google 30%)
  - Edge Computing und WASM-Sandbox reduzieren Server-Kosten pro Instanz
  - TigerBeetle fuer die Economy ist kosteneffizienter als proprietaere Systeme
- Transparente Echtzeit-Einnahmen-Dashboards statt monatelanger DevEx-Prozesse

---

# Empfohlener Technology Stack (Zusammenfassung)

| Layer                | Technologie                          | Begruendung                               |
| -------------------- | ------------------------------------ | ----------------------------------------- |
| **Rendering**        | Bevy + wgpu -> WebGPU/WASM           | Rust-Sicherheit, ECS, Browser + Native    |
| **Client Scripting** | WASM Sandbox (TS -> WASM)            | Hardware-Level-Isolation, Fuel Metering   |
| **Server Scripting** | V8 Isolates (Deno)                   | Fast Startup, JS-Oekosystem               |
| **Game Server**      | Rust auf Fly.io -> Agones/K8s        | Start einfach, skaliere zu Orchestrierung |
| **Networking**       | WebTransport (QUIC) + WS Fallback    | Unreliable Datagrams + Reliable Streams   |
| **QUIC Library**     | Quinn (Rust)                         | Native Rust, Async                        |
| **User Data**        | PostgreSQL (Supabase) -> CockroachDB | Start bewaehrt, skaliere spaeter          |
| **Economy**          | TigerBeetle                          | Double-Entry-Bookkeeping, 1M+ TPS         |
| **Real-Time State**  | Dragonfly (Redis-kompatibel)         | Multi-threaded, speicher-effizient        |
| **Asset Storage**    | Cloudflare R2                        | Null Egress, S3-kompatibel                |
| **KI NPCs**          | Phi-3, Gemma (kleine LLMs) + vLLM    | Kosteneffizient, Structured Output        |
| **KI Assets**        | Meshy/Tripo + Custom Pipeline        | Text/Bild -> Game-ready 3D                |
| **KI Code Gen**      | Claude API im Editor                 | Natural Language -> Scripts               |
| **Voice Chat**       | WebRTC (LiveKit)                     | Spatial Audio, skalierbar                 |
| **Moderation**       | Multi-modale KI + Behavioral ML      | Trust & Safety ist existenziell           |
| **3D Scanning**      | Gaussian Splatting Import            | Handy -> Game-Welt                        |

---

# Empfohlene Build-Phasen (3-5 Jahre, 15-30 Engineers)

### Phase 1: Core Engine (6-9 Monate)

Bevy + wgpu Rendering im Browser via WASM/WebGPU. Basic Multiplayer mit WebTransport.

### Phase 2: Scripting Sandbox (3-6 Monate)

WASM TypeScript-Scripting. User erstellen einfache interaktive Experiences.

### Phase 3: Creation Tools (6-9 Monate)

In-Browser World Editor mit Visual Scripting + Code Editor + KI Code-Generierung.

### Phase 4: Economy (3-4 Monate)

TigerBeetle fuer virtuelle Waehrung. Marketplace fuer User-erstellte Assets.

### Phase 5: Social + Scale (6-9 Monate)

Matchmaking, Friends, Voice Chat, Moderation. Migration zu Agones.

### Phase 6: KI Features (6-12 Monate)

Asset-Generierungs-Pipeline, LLM-NPCs, Advanced Moderation.

### Phase 7: Advanced Graphics (laufend)

Gaussian Splatting Import, Meshlet Rendering, Spatial Computing.

---

> **Entscheidendes Insight:** "Distribution (Browser-nativ, Zero Install) und Creation Tools (einfaches Bauen von Games) sind wichtiger als Grafikqualitaet. Roblox' Grafik ist bescheiden -- sein Creation-Oekosystem hat es zu einem $40B+ Unternehmen gemacht."

---

_Recherche-Datum: 28. Maerz 2026_
