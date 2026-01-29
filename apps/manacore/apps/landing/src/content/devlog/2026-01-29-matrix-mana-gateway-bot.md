---
title: 'Matrix Mana Gateway Bot: Unified Bot Architecture'
description: 'Einführung des matrix-mana-bot als zentraler Gateway mit Shared Business Logic Package für alle Matrix Bots'
date: 2026-01-29
author: 'Till Schneider'
category: 'architecture'
tags:
  [
    'matrix',
    'bot',
    'gateway',
    'architecture',
    'nestjs',
    'monorepo',
    'shared-packages',
  ]
featured: true
commits: 3
readTime: 8
---

Einführung einer neuen Bot-Architektur mit dem **Matrix Mana Gateway Bot** - ein zentraler Bot, der alle Features vereint, während die Einzelbots weiterhin verfügbar bleiben.

---

## Das Problem

Bisher hatten wir **8 separate Matrix Bots**, jeder für eine spezifische Funktion:

- matrix-ollama-bot (AI Chat)
- matrix-todo-bot (Aufgaben)
- matrix-calendar-bot (Termine)
- matrix-clock-bot (Timer/Alarme)
- matrix-nutriphi-bot (Ernährung)
- matrix-zitare-bot (Zitate)
- matrix-stats-bot (Analytics)
- matrix-project-doc-bot (Dokumentation)

**Nachteile:**
- User müssen 8 verschiedene Bots einladen
- Kein Cross-Feature-Support ("Erstelle Todo aus Kalender-Event")
- Code-Duplikation zwischen Bots
- 8 Matrix-Verbindungen zu Synapse
- Hoher Ressourcenverbrauch

---

## Die Lösung: Hybrid-Architektur

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           User Wahl                                      │
├──────────────────────────────┬──────────────────────────────────────────┤
│                              │                                           │
│    @mana:mana.how            │          @todo:mana.how                  │
│    (Gateway - alles)         │          (Nur Todos)                     │
│           │                  │                │                          │
│           ▼                  │                ▼                          │
│  ┌─────────────────┐         │       ┌─────────────────┐                │
│  │ matrix-mana-bot │         │       │ matrix-todo-bot │                │
│  └────────┬────────┘         │       └────────┬────────┘                │
│           │                  │                │                          │
│           └──────────────────┴────────────────┘                          │
│                              │                                           │
│                              ▼                                           │
│               ┌──────────────────────────────┐                          │
│               │   @manacore/bot-services     │                          │
│               │   (Shared Business Logic)    │                          │
│               └──────────────────────────────┘                          │
└─────────────────────────────────────────────────────────────────────────┘
```

**User können wählen:**
- **@mana** für alle Features in einem Bot
- **@todo/@calendar/etc.** für dedizierte Nutzung

---

## Neues Package: @manacore/bot-services

Ein **Shared Package** mit transport-agnostischer Business Logic:

```
packages/bot-services/
├── src/
│   ├── todo/
│   │   ├── todo.service.ts      # CRUD, Parsing, Stats
│   │   ├── todo.module.ts       # NestJS Module
│   │   └── types.ts
│   ├── calendar/
│   │   ├── calendar.service.ts
│   │   └── ...
│   ├── ai/
│   │   ├── ai.service.ts        # Ollama Integration
│   │   └── ...
│   ├── clock/
│   │   ├── clock.service.ts     # Timer, Alarm, WorldClock
│   │   └── ...
│   └── shared/
│       ├── storage.ts           # File/Memory Provider
│       └── utils.ts
```

**Vorteile:**
- Kein Matrix-Code in Services
- Testbar ohne Matrix
- Wiederverwendbar in Gateway und Einzelbots
- Pluggable Storage (File, Memory, Database)

### Beispiel: TodoService

```typescript
import { Injectable } from '@nestjs/common';

@Injectable()
export class TodoService {
  // Pure business logic - kein Matrix!

  async createTask(userId: string, input: CreateTaskInput): Promise<Task> {
    const parsed = this.parseTaskInput(input.text);
    return this.storage.create({ userId, ...parsed });
  }

  parseTaskInput(text: string): ParsedTask {
    // "Einkaufen !p1 @morgen #haushalt"
    // → { title: "Einkaufen", priority: 1, dueDate: "...", project: "haushalt" }
  }
}
```

---

## Gateway Bot: matrix-mana-bot

Der neue **Unified Gateway** kombiniert alle Features:

```
services/matrix-mana-bot/
├── src/
│   ├── bot/
│   │   ├── matrix.service.ts        # Matrix-Verbindung
│   │   └── command-router.service.ts # Routing
│   ├── handlers/
│   │   ├── ai.handler.ts            # !model, !all, chat
│   │   ├── todo.handler.ts          # !todo, !list, !done
│   │   ├── calendar.handler.ts      # !cal, !event
│   │   ├── clock.handler.ts         # !timer, !alarm
│   │   └── help.handler.ts
│   └── orchestration/
│       └── orchestration.service.ts # Cross-Feature AI
```

### Features

| Kategorie | Commands |
|-----------|----------|
| **AI Chat** | Einfach tippen, `!model`, `!models`, `!all` |
| **Todos** | `!todo`, `!list`, `!today`, `!done`, `!delete` |
| **Kalender** | `!cal`, `!week`, `!event` |
| **Timer** | `!timer`, `!alarm`, `!time`, `!timers` |
| **Smart** | `!summary`, `!ai-todo` |

### Cross-Feature Orchestration

Der große Vorteil des Gateways - Features die mehrere Services kombinieren:

```typescript
// !summary - AI-generierte Tages-Zusammenfassung
async dailySummary(ctx: CommandContext): Promise<string> {
  const [todoStats, todayTodos, todayEvents] = await Promise.all([
    this.todoService.getStats(ctx.userId),
    this.todoService.getTodayTasks(ctx.userId),
    this.calendarService.getTodayEvents(ctx.userId),
  ]);

  const prompt = `Erstelle eine motivierende Tages-Zusammenfassung:
    Todos: ${todoStats.pending} offen, ${todoStats.completed} erledigt
    Termine: ${todayEvents.map(e => e.title).join(', ')}`;

  return this.aiService.chat(ctx.userId, prompt);
}

// !ai-todo - AI extrahiert Todos aus Text
async aiToTodos(ctx: CommandContext, text: string): Promise<string> {
  const extracted = await this.aiService.extract(text);
  for (const todo of extracted) {
    await this.todoService.createTask(ctx.userId, todo);
  }
  return `✅ ${extracted.length} Todos erstellt`;
}
```

---

## Setup & Deployment

### Bot registrieren

```bash
./scripts/mac-mini/setup-mana-bot.sh
```

### Docker Compose

```yaml
matrix-mana-bot:
  image: matrix-mana-bot:latest
  environment:
    MATRIX_HOMESERVER_URL: http://synapse:8008
    MATRIX_ACCESS_TOKEN: ${MATRIX_MANA_BOT_TOKEN}
    OLLAMA_URL: http://host.docker.internal:11434
    CLOCK_API_URL: http://matrix-clock-bot:3318/api/v1
  volumes:
    - matrix_mana_bot_data:/app/data
  ports:
    - "3310:3310"
```

### Development

```bash
pnpm dev:matrix:mana      # Gateway starten
pnpm dev:matrix:todo      # Todo-Bot starten
pnpm build:matrix:all     # Alle Bots bauen
```

---

## Architektur-Entscheidungen

### Warum Hybrid statt nur Gateway?

| Aspekt | Nur Gateway | Nur Einzelbots | Hybrid ✓ |
|--------|-------------|----------------|----------|
| User Experience | ⭐⭐⭐ Einfach | ⭐ Komplex | ⭐⭐⭐ Flexibel |
| Cross-Features | ✅ Ja | ❌ Nein | ✅ Ja |
| Fehler-Isolation | ❌ | ✅ | ✅ |
| Power-User | ❌ | ✅ | ✅ |
| Ressourcen | ⭐⭐⭐ | ⭐ | ⭐⭐ |

### Warum Shared Package?

- **Kein Code-Duplikation** - Services einmal geschrieben
- **Testbarkeit** - Services ohne Matrix testbar
- **Flexibilität** - Neue Clients (CLI, Web) nutzen gleiche Logic
- **Konsistenz** - Gleiche Daten in Gateway und Einzelbots

---

## Nächste Schritte

1. **Bestehende Bots refactoren** um `@manacore/bot-services` zu nutzen
2. **Weitere Services implementieren** (Nutrition, Quotes, Stats, Docs)
3. **E2EE Support** für verschlüsselte Räume
4. **Reactions** für Feedback (`✅` = verstanden)

---

## Zusammenfassung

Mit dem **matrix-mana-bot** haben wir jetzt:

- ✅ Einen zentralen Bot für alle Features
- ✅ Shared Business Logic Package
- ✅ Cross-Feature AI-Orchestration
- ✅ Weiterhin Einzelbots für Power-User
- ✅ DSGVO-konform (Self-Hosted)
- ✅ Natürliche Sprache + Commands
