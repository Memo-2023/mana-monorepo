# Context Intelligence: Zentrale Kontextanalyse für Mana

> Recherche-Report — Stand: April 2026

Mana sammelt über 40+ Module hinweg umfangreiche persönliche Daten: Aufgaben, Kalendereinträge, Kontakte, Journal-Einträge, Stimmungen, Fitness-Daten, Finanzen, Gewohnheiten, Sprachnotizen, Rezepte und mehr. Bisher existiert keine zentrale Stelle, die aus diesem Kontext Rückschlüsse zieht. Dieser Report analysiert bestehende Systeme, Frameworks und Architekturen, um einen gangbaren Weg dorthin aufzuzeigen.

---

## 1. Bestehende Produkte mit Cross-Domain Intelligence

### Google Gemini "Personal Intelligence"

Im Januar 2026 hat Google "Personal Intelligence" für Gemini vorgestellt — das bisher ambitionierteste Cross-App-Reasoning eines großen Anbieters. Gemini fungiert als Reasoning-Layer über Gmail, Google Photos, YouTube-Verlauf und Google Search. Die Kernstärke: Gemini kann automatisch relevanten Kontext inferieren, ohne dass der Nutzer explizit danach fragt. Beispiel: Eine Frage nach "meiner Hotelreservierung nächste Woche" zieht automatisch Bestätigungsmails, Fotos und Suchverlauf heran. Angetrieben von Gemini 3, standardmäßig deaktiviert, Daten werden nicht zum Modelltraining verwendet.

### Apple Intelligence + Private Cloud Compute

Apple setzt auf den Hybrid-Ansatz: On-Device-Modelle (auf Apple Silicon) verarbeiten den Großteil der Anfragen lokal. Nur wenn nötig, werden Anfragen an "Private Cloud Compute" weitergeleitet — dedizierte Apple-Silicon-Server, bei denen Daten kryptografisch geschützt sind, nie gespeichert werden und von unabhängigen Experten auditiert werden können. **Architektonisch besonders relevant für Mana**: Privacy durch On-Device-Processing als Default, Cloud nur als Fallback.

### Lenovo/Motorola Qira

Auf der CES 2026 vorgestellt: ein "Personal AI Super Agent", der geräteübergreifend (PC, Smartphone, Tablet, Wearable) als ambient-intelligente Schicht fungiert. Kein app-basierter Ansatz, sondern System-Level-Intelligence, die kontextbewusst und immer verfügbar ist.

### Rewind.ai / Limitless

Rewind war Pionier im Bereich "Personal Context Engine": kontinuierliche Bildschirmaufnahme und Audio, lokal komprimiert und gespeichert, durchsuchbar via LLM. Keine Feinabstimmung der Modelle — stattdessen sehr spezifischer Kontext im Prompt. Wurde von Meta akquiriert und zu Limitless umgebaut (Cloud-basiert + Wearable). Viele Nutzer sind zu Open-Source-Alternativen gewechselt.

### Notion AI / Connected Workspace

Notion AI nutzt den gesamten Workspace als Kontext (Seiten, Datenbanken, verknüpfte Tools wie Slack, Google Drive, GitHub). Seit September 2025 mit "Notion 3.0 Agents": autonome Agenten, die crossfunktional über verbundene Datenquellen hinweg arbeiten. Der Ansatz zeigt, wie ein Workspace zum impliziten Kontext-Layer wird.

### Quantified-Self-Plattformen

**Exist.io** ist das relevanteste Vorbild für Manas Ansatz: Automatische Datenintegration aus Dutzenden Quellen (Fitbit, Oura, Garmin, RescueTime, Todoist, Toggl, GitHub, Spotify, Kalender), kombiniert mit automatischer Korrelationsanalyse. Nach 3 Wochen Daten zeigt die Plattform statistische Zusammenhänge wie "An Tagen mit mehr Schritten schläfst du besser". Kosten: $6.99/Monat.

**Gyroscope** positioniert sich als "Health OS" — Daten-Dashboard aus Apple Watch, Oura, Garmin, Glukosemonitoren etc., mit KI-Coach, der tägliche/wöchentliche Reports und personalisierte Empfehlungen generiert.

---

## 2. Open-Source-Frameworks und Libraries

### Memory-Layer für LLM-Agenten

**Mem0** (github.com/mem0ai/mem0): Der führende Open-Source-Memory-Layer. Drei Speichertechnologien: Vektordatenbank (semantische Suche), Graph-DB (Beziehungsmodellierung), Key-Value-Store (schneller Fakten-Abruf). 26% höhere Genauigkeit als OpenAIs Memory-System, 90% Token-Kostenersparnis. Drei Memory-Scopes: User Memory (personenübergreifend), Session Memory (Gesprächskontext), Agent Memory (Instanz-spezifisch). Genutzt von Netflix, Lemonade, Rocket Money.

**Zep / Graphiti** (github.com/getzep/graphiti): Temporaler Knowledge-Graph-Engine. Modelliert nicht nur WAS passiert ist, sondern WANN und WIE Entitäten zueinander in Beziehung stehen. Besonders relevant für zeitliche Muster-Erkennung ("Du bist produktiver nach dem Sport" braucht zeitliche Korrelation).

**Letta/MemGPT**: OS-inspiriertes Memory-Modell mit drei Ebenen: Core Memory (immer im Kontext, wie RAM), Archival Memory (Vektor-Store, explizit abfragbar), Recall Memory (durchsuchbare Gesprächshistorie). Der Agent entscheidet selbst, wann Information ein- und ausgelagert wird.

**OpenMemory** (github.com/CaviraOSS/OpenMemory): Lokaler persistenter Memory-Store für LLM-Anwendungen (Claude Desktop, GitHub Copilot, etc.).

### Knowledge Graphs

- **Graphiti** (von Zep): Real-Time Knowledge Graphs mit temporaler Provenance
- **Neo4j LLM Knowledge Graph Builder**: Unstrukturierte Daten automatisch in Knowledge Graphs umwandeln
- **WhyHow Knowledge Graph Studio**: MIT-lizenziert, modulare KG-Workflows für Agentic RAG

### Screenpipe (Open-Source Rewind-Alternative)

screenpi.pe — MIT-lizenziert, 24/7 Bildschirm- und Audio-Aufnahme, event-getrieben, lokale Whisper-Transkription, 5–10 GB/Monat Speicherbedarf, 5–10% CPU. Komplett lokal, kein Cloud-Zwang. Cross-Platform.

### Browser-lokale LLM-Inferenz

Transformers.js v4 + WebGPU ermöglicht Modelle bis ~2B Parameter bei nutzbarer Geschwindigkeit direkt im Browser. WebGPU ist 3–10x schneller als WASM. Mana nutzt dies bereits mit `@mana/local-llm` (Gemma 4 E2B) und `@mana/local-stt` (Whisper). Das ist die technische Grundlage für lokale Kontextanalyse ohne Serverkosten.

---

## 3. Akademische Konzepte und Ansätze

### User Modeling and Adaptation (UMAP)

Die zentrale ACM-Konferenz für das Feld. Aktuelle Forschung kombiniert LLM-basierte Personalisierung mit traditionellem User Modeling. Ein umfassender Survey (arxiv.org/pdf/2402.09660) beschreibt die Evolution von frühen Stereotyp-Modellen bis zu Deep-Learning-Techniken.

### Context-Aware Recommender Systems

Ein systematischer Review von 90 Studien (2014–2024) identifiziert das zentrale Problem: Es fehlt ein einheitliches Framework, WIE Kontextinformationen in Empfehlungssysteme integriert werden sollen. Neuere Ansätze nutzen Chatbot-basierte Interfaces für natürlichere Interaktion.

### Context-Aware Multi-Agent Systems

Ein Survey von 2025 beschreibt, wie Agenten Meta-Modelle mit Kontextinformationen und Beziehungen für Reasoning nutzen. Besonders relevant: Die Kombination von persönlichem Kontext mit Multi-Agenten-Architekturen.

### Quantified Self / Lifelogging

Die akademische Forschung zeigt: Self-Tracking fördert nachweislich Gesundheit und Wohlbefinden. Die gängige Analysemethode ist lineare Regression für Korrelationen zwischen Variablen. Das Feld ist seit 2007 (Wolf/Kelly bei Wired) gewachsen und wurde durch Wearables massiv demokratisiert.

---

## 4. Architektur-Patterns für Mana

### Event Sourcing als Fundament

Event Sourcing ist das natürliche Pattern für Cross-Module-Intelligence: Jede Nutzeraktion wird als immutables Event gespeichert. Materialized Views aggregieren diese Events zu abfragbaren Projektionen.

**Für Mana konkret**: Die bestehende `_pendingChanges`-Tabelle mit `appId`-Tagging ist bereits ein Proto-Event-Stream. Erweiterung zu einem vollständigen Activity Stream wäre der nächste Schritt.

### W3C Activity Streams 2.0

JSON-LD-basierter Standard für die Beschreibung von Aktivitäten. Definiert Vocabulary (Actor, Object, Activity Types) und Serialisierung. Ideal als Schema für einen modulübergreifenden Activity Feed.

### Lose Kopplung durch Domain Events

Das Bounded-Context-Pattern aus DDD: Module emittieren Domain Events (z.B. `TaskCompleted`, `JournalEntryCreated`, `WorkoutLogged`), die von einem zentralen Context-Engine konsumiert werden. Keine direkte Abhängigkeit zwischen Modulen.

### Privacy-Preserving Analytics

Da bei Mana alle Daten in IndexedDB liegen und AES-GCM-256-verschlüsselt sind, ist das Modell bereits stärker als Federated Learning. Die Analyse läuft komplett lokal — das ist der stärkste Privacy-Ansatz überhaupt. Apples Hybrid-Modell (On-Device default, Cloud nur für komplexe Aufgaben) ist die passende Referenzarchitektur: lokale Modelle (Gemma via `@mana/local-llm`) für tägliche Korrelationsanalyse, Server-LLMs (via `mana-llm`) nur für komplexe Synthese-Aufgaben.

---

## 5. Konkrete Feature-Ideen für Mana

### Tier 1: Statistische Korrelationen (Exist.io-Ansatz)

Cross-Modul-Korrelationen berechnen:

- "An Tagen mit abgeschlossenen Tasks (Todo) hast du bessere Stimmung (Journal)"
- "Du trainierst regelmäßiger (Body), wenn du den Abend vorher früh ins Bett gehst"
- "Deine Produktivität (Tasks pro Tag) sinkt nach 3+ Meetings (Calendar)"

**Implementierung**: Lineare Regression über Zeitreihen aus verschiedenen Modulen. Dexie-Abfragen über Tabellen hinweg, Aggregation per Tag. Berechnung lokal, kein Server nötig.

### Tier 2: Proaktive Erinnerungen und Nudges

- "Du hast Anna seit 3 Monaten nicht kontaktiert" (Contacts + Activity)
- "Basierend auf deinen Ausgaben überschreitest du dein Budget bis Monatsende um ~120€" (Finance + Calendar)
- "Du hast morgen 3 Meetings — vielleicht heute Abend die Präsentation vorbereiten?" (Calendar + Tasks)
- "Du hast dein Wasser-Ziel diese Woche erst 2x erreicht" (Drink + Habits)

**Implementierung**: Regelbasiert + einfache Heuristiken. Cron-ähnliche lokale Checks auf IndexedDB-Daten.

### Tier 3: Wochen-/Monatsberichte

Automatisch generierte Zusammenfassung: Produktivitätsmuster, Stimmungsverlauf, Finanzen, Kontakte, Gewohnheiten. Vergleich mit Vorwoche/Vormonat.

**Implementierung**: Lokale Datenaggregation + LLM-Prompt mit strukturierten Daten. Lokales Modell für Basisversion, Server-LLM für ausführlichere Berichte.

### Tier 4: LLM-basierte persönliche Insights

Natürlichsprachliche Fragen: "Was war mein produktivster Tag letzte Woche und warum?" Pattern-Erkennung: "Deine Kreativität (Notizen-Länge, neue Projekte) korreliert mit Tagen, an denen du morgens spazieren gehst."

**Implementierung**: Mem0-ähnlicher Memory-Layer, der Fakten und Präferenzen aus allen Modulen extrahiert. Graphiti-ähnlicher temporaler Graph für Beziehungen. Context Window wird mit aggregierten Daten gefüllt, LLM synthetisiert.

### Tier 5: Ambient Intelligence

- Kontextabhängige UI-Anpassung: Morgens Tagesplan + Wetter, abends Reflexion + Journal-Prompt
- Smart Defaults: Neue Task-Erstellung schlägt Projekt basierend auf aktueller Kalender-Aktivität vor
- Rezeptvorschläge basierend auf Kühlschrankinhalt (Recipes) + Ernährungszielen (Body) + Budget (Finance)

---

## 6. Empfohlene Architektur für Mana

```
Module (Todo, Journal, Body, Finance, Period, Habits, ...)
    │
    │ Domain Events (TaskCompleted, MoodLogged, WorkoutDone, ...)
    ▼
Activity Stream (IndexedDB-Tabelle, W3C Activity Streams 2.0 Schema)
    │
    ├──→ Correlation Engine (lokal, statistisch)
    │       → Wöchentliche Korrelationsberechnung über Zeitreihen
    │       → "Tage mit Sport → bessere Stimmung" (lineare Regression)
    │
    ├──→ Rule Engine (lokal, deterministisch)
    │       → Proaktive Erinnerungen, Budget-Warnungen, Kontakt-Nudges
    │       → Konfigurierbar pro Nutzer
    │
    ├──→ LLM Context Builder (lokal via Gemma ODER Server via mana-llm)
    │       → Persönliche Insights, Wochen-/Monatsberichte
    │       → Aggregierte Daten als Prompt-Context, nicht Rohdaten
    │
    └──→ Memory Layer (Mem0-inspiriert, lokal in IndexedDB)
            → Extrahierte Fakten: "Nutzer trainiert Mo/Mi/Fr"
            → Präferenzen: "Bevorzugt Morgen-Tasks"
            → Muster: "Produktivität sinkt nach Meeting-lastigen Tagen"
```

### Warum diese Architektur zu Mana passt

1. **Der Activity Stream ist die einzige neue Tabelle** — Module emittieren Events, kennen aber den Context Engine nicht. Lose Kopplung über das bestehende `_pendingChanges`-Pattern.

2. **Alles läuft lokal** — Korrelationen, Regeln und der Memory-Layer arbeiten direkt auf IndexedDB. Der LLM Context Builder nutzt `@mana/local-llm` (Gemma) für Basisanalysen. Nur komplexe Berichte gehen an den Server.

3. **Privacy by Architecture** — Keine Daten verlassen das Gerät für die Basisanalyse. Das ist stärker als jeder Federated-Learning-Ansatz und passt perfekt zum Zero-Knowledge-Versprechen.

4. **Inkrementell umsetzbar** — Tier 1 (Korrelationen) und Tier 2 (Regeln) brauchen kein LLM und sind mit reiner Statistik + Heuristiken in wenigen Wochen umsetzbar. Tier 3–5 bauen darauf auf.

---

## 7. Nächste Schritte

1. **Activity Stream Schema definieren** — W3C Activity Streams 2.0 als Basis, angepasst an Manas Module. Neue Dexie-Tabelle `_activityStream`.

2. **Events aus 3–5 Kernmodulen emittieren** — Todo, Calendar, Journal, Body, Finance als Pilotmodule. Minimales Event: `{ type, actorId, objectType, objectId, appId, timestamp, summary }`.

3. **Correlation Engine MVP** — Tägliche Aggregation (Tasks erledigt, Stimmung, Training ja/nein, Ausgaben). Pearson-Korrelation zwischen Paaren. Ergebnisse als einfache Cards auf dem Dashboard.

4. **Rule Engine MVP** — 5–10 hartcodierte Regeln (Kontakt-Reminder, Budget-Warnung, Gewohnheits-Streak). Prüfung 1x täglich via Background-Job.

5. **LLM-Integration evaluieren** — Testen, ob Gemma 4 E2B (via `@mana/local-llm`) ausreicht, um aus aggregierten Tagesdaten einen sinnvollen Wochenbericht zu generieren. Wenn ja: komplett lokal. Wenn nicht: Fallback auf `mana-llm` Server.
