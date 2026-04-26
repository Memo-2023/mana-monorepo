# LLM-Fallback via Model-Aliases — Plan

_Drafted 2026-04-26. **Status: SHIPPED** (M1–M5 alle gemerged am 2026-04-26)._
Auslöser: Schreiben-Modul-Generation-Ausfall (GPU-Server offline → 75 s Hang → mana-llm 500). Lösung: in einem Tag in fünf Schritten gebaut + getestet (115 Tests grün).

| M | Commit | Geliefert |
|---|---|---|
| M1 | `dff8629e1` | `AliasRegistry` + `aliases.yaml` SSOT, 32 Tests |
| M2 | `59557e62d` | `ProviderHealthCache` + `HealthProbe`, 32 Tests |
| M3 | `3046da3b1` | `_execute_with_fallback`, Streaming pre-first-byte, 22 Tests, alle Legacy-Fallback-Pfade purged |
| M4 | `8a49e3ffd` | `X-Mana-LLM-Resolved`-Header, 3 Prometheus-Metriken, `/v1/aliases` + `/v1/health` Endpoints, SIGHUP-Reload, 16 Tests |
| M5 | `fea3adf5f` | 14 Consumer-Sites migriert, SSOT in `@mana/shared-ai`, `validate-llm-strings.mjs` Drift-Gate über 2538 Files |

**Status der "Open Questions" am Ende:** alle drei dokumentiert geblieben (kein Showstopper für Phase 1):
- 429-Rate-Limit kürzeres Backoff: aktuell wie ConnectError behandelt; Refinement bei Bedarf.
- Alias-Versionierung: nicht nötig solange Reload atomar bleibt.
- mana-credits Modell→Preis-Tabelle: bei nächster Credits-Code-Änderung prüfen.

Macht die LLM-Pipeline resilient gegen Provider-Ausfälle (heute: GPU-Server `mana-gpu` offline, Ollama unerreichbar; morgen: Groq-API-Limit, Anthropic-Outage, …). Statt jedem Consumer eine Retry-Logik mit konkreten Modell-Strings beizubringen, gibt mana-llm zukünftig **Model-Aliases** aus, die Health-Cache-bewusst auf eine Provider-Chain auflösen. Consumer-Code kennt nur noch `mana/long-form`, nicht mehr `ollama/gemma3:12b`.

**Hintergrund:**
- [`services/mana-llm/CLAUDE.md`](../../services/mana-llm/CLAUDE.md) — heutige Provider-Routing-Architektur (Ollama / OpenRouter / Groq / Together / Google), OpenAI-kompatible API
- Konkreter Bug: `services/mana-llm` Logs vom 17:48 → `Chat completion failed on ollama: Server disconnected without sending a response.` nach 75 s, ausgelöst durch toten GPU-Server. Generation-Endpoint in `apps/api/src/modules/writing/routes.ts` hat 500 zurückgegeben.
- Verwandt: [`docs/plans/agent-loop-improvements-m1.md`](./agent-loop-improvements-m1.md) (mana-ai consumiert mana-llm intensiv und ist heute genauso fragil)

## Ziel in einem Satz

Ein Consumer schickt einen semantischen Alias (`"model": "mana/long-form"`); mana-llm löst auf eine Provider-Chain auf, überspringt unhealthy Provider auf Basis eines kontinuierlichen Health-Cache, ruft den ersten verfügbaren auf, und liefert die Antwort plus einen `X-Mana-LLM-Resolved`-Header mit dem tatsächlich genutzten Modell.

## Nicht-Ziele

- **Latenz-/Kosten-optimierte Provider-Auswahl.** Kein "wenn Groq billiger ist, nimm Groq". Erstes _healthy_ Glied der Chain gewinnt — Reihenfolge ist die Strategie, nichts anderes. Die Chain definiert auch die Präferenz.
- **Per-User-Routing.** User A kriegt nicht ein anderes Modell als User B. Alias → Chain ist global. Per-User-Auswahl gehört in die Frontend-Layer (z.B. ein expliziter Modell-Picker im Schreiben-Modul), nicht ins Routing.
- **Mid-Stream-Fallback.** Wenn ein SSE-Stream nach dem ersten Byte abbricht, schlagen wir hart fehl. Provider-Wechsel mitten im Stream + Output-Verschmelzung wäre eine Quelle subtiler Korruption (zwei Modelle, zwei Tonarten, zwei Halluzinationen). Pre-First-Byte-Fallback ist sauber, mid-stream nicht.
- **A/B-Testing zwischen Modellen.** Außerhalb des Scopes. Falls später gewünscht, eigener Mechanismus mit Cohort-Stickiness.
- **Verbundene Quotas / Token-Budgets.** Alias-Layer kennt keine User-Tier-/Credits-Logik — das passiert weiter in den Consumern (Credits-Service-Calls in `mana-credits`).
- **Caller-spezifische Overrides** ("Schreiben-Modul will heute mal `groq/llama-3.3-70b` direkt"). Direkter Modell-String bleibt im Request akzeptiert (Backwards-Compat _innerhalb_ mana-llm-API), aber kein Code im Repo benutzt das mehr — `grep -r "ollama/" apps services packages` findet nach der Migration nur noch `services/mana-llm/aliases.yaml`.

## Entscheidungen (gesetzt)

| Frage | Entscheidung | Warum |
|---|---|---|
| Wo lebt die Logik | **In `mana-llm`** | Heute schon der Provider-Router; alle Consumer (mana-api, mana-ai, web direkt) profitieren ohne Code-Änderung der Caller-Library. Eine Implementierung, ein Health-Cache, ein Konfig-Punkt. |
| Schnittstelle zum Consumer | **Alias als Modell-String** (`"model": "mana/long-form"`) | Behält die OpenAI-kompatible Request-Form. Caller braucht keine neuen Felder, kein neues Schema. Migration = String-Replace. |
| Konfigurations-Format | **YAML neben `config.py`**, hot-reload via SIGHUP | Lesbar, diff-bar, ohne Code-Deploy änderbar. Python-stdlib `yaml`-Parser reicht. |
| Health-Probe-Interval | 30 s, 3 s Timeout pro Probe | Schneller als die typische 75 s-Failure-Latenz, langsam genug um keinen Provider zu DDoSen. |
| Circuit-Breaker | 2 Fehlschläge → 60 s unhealthy → Re-Probe | Standard-Tuning. Verhindert Death-Spiral bei flappy Provider. |
| Fehlerklassen, die Fallback auslösen | `httpx.ConnectError`, `httpx.ReadTimeout`, `httpx.RemoteProtocolError`, HTTP 5xx, "Server disconnected" | Genau die Klassen, die heute den Bug erzeugen. **HTTP 4xx wird propagiert** — das ist Caller-Fehler, nicht Provider-Ausfall. |
| Streaming | Pre-First-Byte-Fallback, Mid-Stream hart fehlschlagen | Saubere Semantik, keine "halben" Outputs. |
| Mana-Aliases als reservierter Namespace | `mana/<class>`, alles andere durchreichen wie heute | Klare Grenze. `ollama/...` / `groq/...` bleiben legaler Direct-Call (für Tests, Debugging) — aber kein Produktcode benutzt es mehr. |
| Beobachtbarkeit | Prometheus + Response-Header | Header zeigt _diesem_ Caller welches Modell antwortete (für Token-Cost-Buchhaltung); Prometheus für Aggregat-Sicht. |
| Migrations-Strategie | **Big-Bang**, ein PR — kein Legacy | User-Vorgabe ("nicht live, unendliche Ressourcen, sauberste Lösung ohne Legacy"). Alle bestehenden `WRITING_MODEL` / `COMIC_STORYBOARD_MODEL` / `MANA_LLM_DEFAULT_MODEL` etc. Env-Vars entfallen ersatzlos. |

## Architektur

```
                ┌──────────────────────────────────────────┐
Consumer        │  POST /v1/chat/completions               │
("mana/long-    │  { "model": "mana/long-form", ... }      │
  form")        └────────────────────┬─────────────────────┘
                                     │
                ┌────────────────────▼─────────────────────┐
                │         AliasRegistry.resolve()          │
                │  mana/long-form → [                      │
                │    "ollama/gemma3:12b",                  │
                │    "groq/llama-3.3-70b-versatile",       │
                │    "openrouter/anthropic/claude-3-haiku" │
                │  ]                                       │
                └────────────────────┬─────────────────────┘
                                     │
                ┌────────────────────▼─────────────────────┐
                │      Router.execute_with_fallback()      │
                │  for model in chain:                     │
                │    if not health.is_healthy(provider):   │
                │      continue                            │
                │    try: return provider.complete(...)    │
                │    except ConnectError/5xx:              │
                │      health.mark_unhealthy(provider)     │
                │      continue                            │
                │  raise NoHealthyProviderError            │
                └────────────────────┬─────────────────────┘
                                     │
                                     ▼
                Response + Header `X-Mana-LLM-Resolved: groq/llama-3.3-70b`


Hintergrund-Loop (alle 30 s):
                ┌─────────────────────────────────────────┐
                │  HealthProbe.tick()                     │
                │    for provider in [ollama, groq, ...]: │
                │      probe(provider, timeout=3s)        │
                │      update health_cache                │
                └─────────────────────────────────────────┘
```

## Aliases (initialer Stand)

`services/mana-llm/aliases.yaml`:

```yaml
# Alle aktiv genutzten Klassen. Reihenfolge im chain[] = Präferenz.
# Erstes healthy Glied gewinnt.
aliases:
  mana/fast-text:
    description: "Kurze Antworten, Klassifikation, Single-shot Q&A"
    chain:
      - ollama/qwen2.5:7b
      - groq/llama-3.1-8b-instant
      - openrouter/anthropic/claude-3-haiku

  mana/long-form:
    description: "Schreiben, Essays, Stories, längere Prosa"
    chain:
      - ollama/gemma3:12b
      - groq/llama-3.3-70b-versatile
      - openrouter/anthropic/claude-3.5-haiku

  mana/structured:
    description: "JSON-Output (Comic-Storyboard, Research-Subqueries, Tag-Vorschläge)"
    chain:
      - ollama/qwen2.5:7b
      - groq/llama-3.1-8b-instant
      # OpenRouter unterstützt strict JSON-Schema bei den meisten Modellen
      - openrouter/openai/gpt-4o-mini

  mana/reasoning:
    description: "Agent-Missions, Tool-Calls, Mehrstufige Plans"
    chain:
      # Bewusst Cloud zuerst — lokale 4B-Modelle reichen nicht für Tool-Calls
      - openrouter/anthropic/claude-3.5-sonnet
      - groq/llama-3.3-70b-versatile

  mana/vision:
    description: "Multimodal (Bild + Text)"
    chain:
      - ollama/llava:7b
      - google/gemini-2.0-flash-exp
      - openrouter/openai/gpt-4o
```

5 Aliases sind genug für den heutigen Stand. Neue kommen dazu wenn ein Use-Case sie braucht — kein "wir bauen schon mal `mana/translation` weil's sein könnte".

**Default-Alias bei undefiniertem `model`-Feld:** `mana/fast-text`. Bisheriger `OLLAMA_DEFAULT_MODEL`-Env entfällt (= "kein Caller darf vergessen, ein Modell zu schicken; wenn er's tut, kriegt er den günstigsten").

## Komponenten in mana-llm

| File | Zweck |
|---|---|
| `services/mana-llm/src/aliases.py` (neu) | `AliasRegistry`-Klasse, lädt + reloaded `aliases.yaml`. Methoden: `resolve(name) -> list[str]`, `is_alias(name) -> bool`, `reload()`. |
| `services/mana-llm/src/health.py` (neu) | `ProviderHealthCache` mit per-Provider-State `{healthy, last_check, consecutive_failures, unhealthy_until}`. Methoden: `is_healthy(provider_id)`, `mark_unhealthy(provider_id, reason)`, `mark_healthy(provider_id)`. |
| `services/mana-llm/src/health_probe.py` (neu) | Hintergrund-`asyncio.Task`. Probe-Strategie pro Provider-Typ: `GET /api/tags` (Ollama) bzw. `GET /v1/models` (OpenAI-compat). Startet bei `app.on_startup`. |
| `services/mana-llm/src/providers/router.py` (umbau) | `chat_completion()` und `chat_completion_stream()` werden zu Wrappern um eine neue `_execute_with_fallback(model_or_alias, request)`-Methode. Heutige Logik (Provider-Picking via "/" splitten) wandert nach innen. |
| `services/mana-llm/src/main.py` (klein erweitert) | Response-Header setzen (`X-Mana-LLM-Resolved`). SIGHUP-Handler für Alias-Reload. Neue Endpunkte `GET /v1/aliases`, `GET /v1/health`. |
| `services/mana-llm/src/utils/metrics.py` (klein erweitert) | Neue Counter `mana_llm_fallback_total{from_model, to_model, reason}`, `mana_llm_alias_resolved_total{alias, target}`, Gauge `mana_llm_provider_healthy{provider}`. |
| `services/mana-llm/aliases.yaml` (neu) | Konfigurations-Datei, im Repo eingecheckt. |
| `services/mana-llm/CLAUDE.md` (update) | Neue Sektion "Aliases & Fallback". Tabelle aller 5 Aliases. Beispiel-Calls aktualisiert. |
| `services/mana-llm/tests/test_aliases.py` (neu) | YAML-Parsing, Reload, unbekannte Alias → Fehler. |
| `services/mana-llm/tests/test_fallback.py` (neu) | Mock-Provider mit injizierbaren Failures, Sequenz-Tests: erstes healthy → erstes nimmt. Erstes unhealthy → zweites. Alle unhealthy → 503. |

## Consumer-Migration

Eigene zentrale Konstanten-Datei statt verstreutem `process.env.WRITING_MODEL || 'ollama/...'`:

`apps/api/src/lib/llm-aliases.ts` (neu):

```ts
/**
 * Mana LLM model aliases — single source of truth for which class of model
 * each backend feature uses. Resolved server-side by mana-llm; consumers
 * never see the underlying provider/model unless they explicitly need to
 * (rare — mainly for token-cost accounting via the X-Mana-LLM-Resolved
 * response header).
 */
export const MANA_LLM = {
	FAST_TEXT: 'mana/fast-text',
	LONG_FORM: 'mana/long-form',
	STRUCTURED: 'mana/structured',
	REASONING: 'mana/reasoning',
	VISION: 'mana/vision',
} as const;
```

Ersetzt:
- `apps/api/src/modules/writing/routes.ts:22` — `DEFAULT_MODEL = process.env.WRITING_MODEL || 'ollama/gemma3:4b'` → `MANA_LLM.LONG_FORM`. `WRITING_MODEL`-Env weg.
- `apps/api/src/modules/comic/routes.ts:32` — `STORYBOARD_MODEL = process.env.COMIC_STORYBOARD_MODEL || 'ollama/gemma3:4b'` → `MANA_LLM.STRUCTURED`. Env weg.
- `apps/api/src/modules/context/routes.ts:14` — `DEFAULT_SUMMARY_MODEL = process.env.MANA_LLM_DEFAULT_MODEL || 'gemma3:4b'` → `MANA_LLM.FAST_TEXT`. Env weg.
- `apps/api/src/modules/research/orchestrator.ts:233` — Modell-Strings im `llmJson()`-Call → `MANA_LLM.STRUCTURED`.
- `services/mana-ai/src/planner/*` — sämtliche Modell-Strings → `mana/reasoning` über äquivalente shared Konstante in `services/mana-ai/src/llm-aliases.ts`.
- Web-App: kein direkter Aufruf von mana-llm aus dem Browser heute (geht alles über mana-api), daher hier nichts zu tun.

`grep -r "ollama/\|groq/\|openrouter/\|together/\|google/" apps services packages` muss nach der Migration leer sein, mit Ausnahme von:
- `services/mana-llm/aliases.yaml` (das ist die SSOT)
- `services/mana-llm/tests/` (Test-Fixtures)
- `services/mana-llm/CLAUDE.md` (Beispiele)

Wir validieren das mit einem neuen `validate-llm-strings.mjs` in `scripts/`, eingebunden in `validate:all`.

## Test-Plan

**Unit (Python, mana-llm):**
- `test_aliases.py` — YAML-Parsing-Edge-Cases (leerer Chain, unbekannter Provider in Chain, doppelter Alias, Reload nach Datei-Edit).
- `test_fallback.py` mit Mock-Providern:
  - Single-Glied-Chain, Provider OK → 1 Call, Erfolg, Response-Header gesetzt.
  - 3-Glied-Chain, erstes unhealthy laut Cache → 0 Calls auf erstes, 1 Call auf zweites.
  - 3-Glied-Chain, erstes wirft `ConnectError` → markiert unhealthy, ruft zweites, Erfolg.
  - 3-Glied-Chain, alle unhealthy → 503 mit `NoHealthyProviderError`.
  - 4xx Fehler vom ersten Provider → KEIN Fallback, propagiert.
  - Streaming: erste Bytes flowen → Verbindung bricht → harter Fehler, kein Wechsel.
- `test_health_probe.py` — Probe-Loop markiert unhealthy nach 2 Fehlschlägen, healthy nach 1 Erfolg, respektiert 60s Backoff.

**Integration (Python, mana-llm):**
- Live-Smoke-Test gegen lokales Ollama (in CI nicht aktiv, lokal mit `pytest -m integration`).

**Validation Script (Node, repo-weit):**
- `scripts/validate-llm-strings.mjs` — failed wenn Code in `apps/`/`services/` (außer mana-llm selbst) hardcoded Provider-Strings (`ollama/X`, `groq/X`, etc.) enthält. In `validate:all` einbinden.

**Manual Smoke (vor Merge):**
- GPU-Server hochfahren, generation in /writing macht: `X-Mana-LLM-Resolved: ollama/gemma3:12b`.
- GPU-Server runterfahren, generation macht: `X-Mana-LLM-Resolved: groq/llama-3.3-70b-versatile` in <1s.
- Groq-Key entfernen, generation macht: `X-Mana-LLM-Resolved: openrouter/...`.
- Alle Keys raus, generation macht: 503 mit `NoHealthyProviderError`.

## Milestones

| M | Inhalt | Aufwand-Schätzung |
|---|---|---|
| **M1** | `aliases.yaml` + `AliasRegistry` + Unit-Tests. Resolution funktioniert, aber kein Health-Cache, keine Fallback-Loop — nur Alias-→-erstes-Glied-Aufruf. | 0.5 d |
| **M2** | `ProviderHealthCache` + Hintergrund-Probe-Loop + Unit-Tests. Cache wird befüllt; Router fragt noch nicht ab. | 0.5 d |
| **M3** | `Router.execute_with_fallback()` integriert Cache und Chain-Loop. Streaming-Pre-First-Byte-Logik. Unit-Tests (Mock-Provider). | 1 d |
| **M4** | Response-Header, Prometheus-Metrics, `GET /v1/aliases` + `GET /v1/health` Debug-Endpoints, SIGHUP-Reload, `services/mana-llm/CLAUDE.md` Update. | 0.5 d |
| **M5** | Consumer-Migration: 4 Files in `apps/api/src/modules/*/routes.ts` + mana-ai planner. Env-Vars aus `.env.development` raus. `validate-llm-strings.mjs` + `validate:all`-Hookup. Manual smoke. | 0.5 d |

**Gesamt:** ~3 Entwicklertage. Linear (M1 vor M2 vor M3 …), kein parallelisierbarer Pfad.

## Alternativen, die ich verworfen habe

- **Per-Request Fallback-Chain im Body** (Caller schickt `models: ["...", "..."]`) — verlagert die Modellauswahl-Logik zurück in jeden Consumer; jeder Caller müsste die aktuelle Provider-Landschaft kennen; kein Health-Cache → jeder Request zahlt 75 s Timeout am toten Provider selbst. Schmutzig und langsam.
- **Fallback in `apps/api/src/lib/llm.ts`** — würde nur mana-api-Caller schützen. mana-ai (Background-Mission-Runner) hat seinen eigenen LLM-Client und bleibt fragil. Zwei Implementierungen, zwei Bug-Quellen, doppelte Health-Caches.
- **LiteLLM/OpenRouter-as-a-service** als Sidecar statt mana-llm-Erweiterung — mehr Komponenten, weniger Kontrolle, Vendor-Lock-in für eine Funktion die in ~300 Zeilen Python lebt. Nicht Mana-style.
- **Cloud-first, Ollama als optionaler Cache** — eine separate strategische Entscheidung (Privacy / Kosten / Offline-Modus). Gehört nicht in eine Resilience-Story; kann später diskutiert werden.
- **In-Process-Retry ohne Health-Probe** (Caller versucht erst Ollama, bei Fehler einmal Cloud) — jeder Request zahlt einmal die volle Failure-Latenz beim ersten Treffer auf den toten Provider. UX-killer (15 User × 75 s Hang).
- **Dynamische Latency-/Kosten-Optimierung** (mana-llm wählt schnellsten/billigsten Provider) — Premature Optimization. Erst messen, dann optimieren. Statische Reihenfolge in der Chain ist transparent und debugbar.
- **Per-User-Routing** (User-Tier entscheidet Modell) — gehört in den Tier-/Credits-Layer, nicht ins LLM-Routing. Soll auf mana-credits-Ebene bleiben.

## Open Questions

- **Probe-Strategie für `groq` / `openrouter`:** `GET /v1/models` reicht zum Health-Check, frisst aber bei jedem Tick einen Free-Tier-Quota-Punkt. Bei Groq aktuell 30 RPM unkritisch (= 2 RPM Probe-Last); bei kostenpflichtigen Tiers später erwägen, nur on-demand zu prüfen.
- **Wie reagieren wir auf 429 (Rate-Limit)?** Vorschlag: temporär als unhealthy markieren mit kurzem Backoff (15 s, nicht 60 s), aber separat von Connection-Errors zählen — flappy-throttling soll die Zwei-Strikes-Regel nicht triggern. Im M3 nachdenken.
- **Alias-Versionierung:** Wenn wir `mana/long-form` morgen umstellen (gemma3 → gemma4), bleibt der Name. Wollen wir je versionierte Aliases (`mana/long-form-v2`)? Heute: nein, Reload ist atomar. Falls A/B-Testing nötig wird, dann.
- **Caller-side Model-Awareness für Token-Pricing:** Der Resolved-Header sagt _welches_ Modell antwortete; mana-credits muss daraus den Preis ableiten. Heißt: mana-credits braucht eine Modell-→-Preis-Tabelle. Existiert die schon? Prüfen vor M5.
