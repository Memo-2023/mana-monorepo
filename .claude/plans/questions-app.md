# ManaCore Questions App - Design Document

> **Status**: Entwurf - Zur Überprüfung
> **Erstellt**: 2025-01-28
> **Autor**: Claude Code

---

## 1. Übersicht & Ziele

### 1.1 Was ist die Questions App?

Eine intelligente Fragen-Management-App, die Nutzern hilft:
- **Offene Fragen sammeln** - Gedanken, Ideen und Wissenslücken festhalten
- **KI-gestützte Recherche** - Automatische Recherche zu den Fragen durchführen
- **Wissen organisieren** - Antworten, Quellen und Erkenntnisse strukturiert speichern
- **Lernfortschritt tracken** - Verstehen, welche Fragen beantwortet wurden

### 1.2 Use Cases

| Use Case | Beschreibung |
|----------|--------------|
| **Lern-Begleiter** | Student notiert Fragen während der Vorlesung, App recherchiert später |
| **Recherche-Tool** | Journalist sammelt Fragen zu einem Thema für Deep-Dive |
| **Wissens-Management** | Professional trackt offene Fragen und deren Beantwortung |
| **Curiosity Journal** | Privatperson sammelt alltägliche "Ich frage mich..."-Momente |

### 1.3 Kernfeatures

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        QUESTIONS APP FEATURES                           │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  [1] FRAGEN-MANAGEMENT                                                  │
│      ├── Schnelles Erfassen von Fragen                                  │
│      ├── Kategorisierung & Tagging                                      │
│      ├── Priorisierung (dringend, wichtig, irgendwann)                 │
│      └── Status-Tracking (offen, in Recherche, beantwortet)            │
│                                                                         │
│  [2] KI-RECHERCHE                                                       │
│      ├── Automatische Web-Recherche                                     │
│      ├── Zusammenfassung von Quellen                                    │
│      ├── Quellenangaben & Zitate                                        │
│      └── Follow-up Fragen generieren                                    │
│                                                                         │
│  [3] WISSENS-ORGANISATION                                               │
│      ├── Antworten strukturiert speichern                               │
│      ├── Quellen verwalten & kategorisieren                             │
│      ├── Notizen & eigene Erkenntnisse hinzufügen                      │
│      └── Export als Markdown/PDF                                        │
│                                                                         │
│  [4] KOLLABORATION                                                      │
│      ├── Fragen-Sammlungen teilen                                       │
│      ├── Team-Recherche                                                 │
│      └── Diskussionen zu Fragen                                         │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### 1.4 Abgrenzung zu anderen Apps

| App | Fokus | Unterschied zu Questions |
|-----|-------|-------------------------|
| **Chat** | Konversation mit AI | Questions: Strukturierte Fragen-DB statt Chatverläufe |
| **Todo** | Aufgaben | Questions: Wissenslücken, nicht Todos |
| **Zitare** | Zitate sammeln | Questions: Aktive Recherche, nicht passive Sammlung |

---

## 2. Architektur

### 2.1 Projekt-Struktur

```
apps/questions/
├── apps/
│   ├── backend/          # NestJS API (Port 3010)
│   │   ├── src/
│   │   │   ├── question/     # Fragen CRUD
│   │   │   ├── research/     # KI-Recherche
│   │   │   ├── source/       # Quellen-Management
│   │   │   ├── collection/   # Fragen-Sammlungen
│   │   │   ├── answer/       # Antworten & Notizen
│   │   │   ├── db/           # Drizzle Schema & Migrations
│   │   │   └── health/       # Health-Checks
│   │   └── drizzle/
│   ├── mobile/           # Expo React Native App
│   │   └── app/
│   │       ├── (tabs)/       # Tab-Navigation
│   │       ├── question/     # Frage-Detail
│   │       └── research/     # Recherche-Ansicht
│   ├── web/              # SvelteKit Web App
│   │   └── src/
│   │       ├── routes/
│   │       │   ├── (app)/    # Authenticated Routes
│   │       │   └── (auth)/   # Login/Register
│   │       ├── lib/
│   │       │   ├── components/
│   │       │   └── stores/
│   │       └── app.css
│   └── landing/          # Astro Landing Page
├── packages/
│   └── shared/           # Shared Types & Utils
└── package.json
```

### 2.2 Technologie-Stack

| Layer | Technologie | Details |
|-------|-------------|---------|
| **Backend** | NestJS 10 | REST API, Drizzle ORM, PostgreSQL |
| **Web** | SvelteKit 2 + Svelte 5 | Runes Mode, Tailwind CSS |
| **Mobile** | Expo SDK 54, React Native | NativeWind, Expo Router |
| **Landing** | Astro 5 | Static Site, Tailwind CSS |
| **Auth** | Mana Core Auth | JWT (EdDSA), Port 3001 |
| **AI** | Ollama + OpenRouter | Dual-Provider (wie Chat) |
| **Search** | Web Search API | Externe Such-API für Recherche |

### 2.3 System-Architektur

```
┌─────────────┐     ┌─────────────┐     ┌────────────────┐
│   Client    │────>│  Questions  │────>│ mana-core-auth │
│ (Web/Mobile)│     │   Backend   │     │  (port 3001)   │
└─────────────┘     │ (port 3010) │     └────────────────┘
                    └──────┬──────┘
                           │
            ┌──────────────┼──────────────┐
            ▼              ▼              ▼
     ┌──────────┐   ┌──────────┐   ┌──────────┐
     │ Ollama   │   │OpenRouter│   │ Web      │
     │ (local)  │   │ (cloud)  │   │ Search   │
     └──────────┘   └──────────┘   └──────────┘
```

---

## 3. Datenbank-Schema

### 3.1 Core Tables

```sql
-- ============================================
-- QUESTIONS SCHEMA
-- ============================================

-- Fragen (Haupttabelle)
CREATE TABLE questions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         TEXT NOT NULL,                    -- Mana Core Auth User ID
    collection_id   UUID REFERENCES collections(id) ON DELETE SET NULL,

    -- Inhalt
    title           TEXT NOT NULL,                    -- Kurze Frage
    description     TEXT,                             -- Ausführliche Beschreibung/Kontext

    -- Status & Priorisierung
    status          TEXT NOT NULL DEFAULT 'open',     -- 'open', 'researching', 'answered', 'archived'
    priority        TEXT DEFAULT 'normal',            -- 'low', 'normal', 'high', 'urgent'

    -- Kategorisierung
    tags            TEXT[] DEFAULT '{}',              -- User-definierte Tags
    category        TEXT,                             -- Optionale Kategorie

    -- Research Config
    research_depth  TEXT DEFAULT 'quick',             -- 'quick', 'standard', 'deep'
    auto_research   BOOLEAN DEFAULT false,            -- Auto-Recherche aktiviert

    -- Timestamps
    created_at      TIMESTAMPTZ DEFAULT now(),
    updated_at      TIMESTAMPTZ DEFAULT now(),
    answered_at     TIMESTAMPTZ,                      -- Wann als beantwortet markiert

    -- Soft Delete
    is_archived     BOOLEAN DEFAULT false,
    archived_at     TIMESTAMPTZ
);

CREATE INDEX questions_user_idx ON questions(user_id);
CREATE INDEX questions_status_idx ON questions(user_id, status);
CREATE INDEX questions_collection_idx ON questions(collection_id);
CREATE INDEX questions_tags_idx ON questions USING GIN(tags);

-- Fragen-Sammlungen
CREATE TABLE collections (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         TEXT NOT NULL,

    name            TEXT NOT NULL,
    description     TEXT,
    color           TEXT DEFAULT '#6366f1',           -- Indigo als Default
    icon            TEXT DEFAULT 'folder',

    -- Sharing
    is_shared       BOOLEAN DEFAULT false,
    share_token     TEXT UNIQUE,                      -- Für öffentliche Links

    created_at      TIMESTAMPTZ DEFAULT now(),
    updated_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX collections_user_idx ON collections(user_id);

-- KI-Recherche-Ergebnisse
CREATE TABLE research_results (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question_id     UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,

    -- Recherche-Metadaten
    model_id        TEXT NOT NULL,                    -- Verwendetes AI-Modell
    provider        TEXT NOT NULL,                    -- 'ollama' oder 'openrouter'
    research_depth  TEXT NOT NULL,                    -- 'quick', 'standard', 'deep'

    -- Ergebnis
    summary         TEXT NOT NULL,                    -- KI-generierte Zusammenfassung
    key_points      JSONB DEFAULT '[]',               -- Wichtige Erkenntnisse als Array
    follow_up_questions TEXT[] DEFAULT '{}',          -- Vorgeschlagene Folgefragen

    -- Token-Tracking (wie bei Chat)
    prompt_tokens   INTEGER,
    completion_tokens INTEGER,
    estimated_cost  DECIMAL(10, 6),

    -- Timestamps
    created_at      TIMESTAMPTZ DEFAULT now(),
    duration_ms     INTEGER                           -- Dauer der Recherche
);

CREATE INDEX research_results_question_idx ON research_results(question_id);

-- Quellen (von Recherche gefunden)
CREATE TABLE sources (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    research_id     UUID NOT NULL REFERENCES research_results(id) ON DELETE CASCADE,
    question_id     UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,

    -- Quelle
    url             TEXT,
    title           TEXT NOT NULL,
    source_type     TEXT DEFAULT 'web',               -- 'web', 'book', 'paper', 'video', 'manual'

    -- Inhalt
    excerpt         TEXT,                             -- Relevanter Ausschnitt
    summary         TEXT,                             -- KI-Zusammenfassung

    -- Bewertung
    relevance_score REAL,                             -- 0.0 - 1.0
    user_rating     INTEGER,                          -- 1-5 Sterne (optional)

    -- Metadaten
    author          TEXT,
    published_at    DATE,
    accessed_at     TIMESTAMPTZ DEFAULT now(),

    created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX sources_research_idx ON sources(research_id);
CREATE INDEX sources_question_idx ON sources(question_id);

-- Antworten & Notizen (User-generiert)
CREATE TABLE answers (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question_id     UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    user_id         TEXT NOT NULL,

    -- Inhalt
    content         TEXT NOT NULL,                    -- Markdown-formatierte Antwort
    answer_type     TEXT DEFAULT 'note',              -- 'note', 'answer', 'insight'

    -- Optional: Basiert auf Recherche
    research_id     UUID REFERENCES research_results(id),
    source_ids      UUID[] DEFAULT '{}',              -- Referenzierte Quellen

    created_at      TIMESTAMPTZ DEFAULT now(),
    updated_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX answers_question_idx ON answers(question_id);
CREATE INDEX answers_user_idx ON answers(user_id);

-- Frage-Verlauf (Änderungen tracken)
CREATE TABLE question_history (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question_id     UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,

    field_changed   TEXT NOT NULL,                    -- 'status', 'title', 'description', etc.
    old_value       TEXT,
    new_value       TEXT,
    changed_by      TEXT NOT NULL,                    -- User ID

    created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX question_history_question_idx ON question_history(question_id);
```

### 3.2 Drizzle Schema (TypeScript)

```typescript
// db/schema/questions.schema.ts
import { pgTable, uuid, text, boolean, timestamp, real, integer, jsonb } from 'drizzle-orm/pg-core';

export const questions = pgTable('questions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id').notNull(),
  collectionId: uuid('collection_id').references(() => collections.id, { onDelete: 'set null' }),

  title: text('title').notNull(),
  description: text('description'),

  status: text('status').notNull().default('open'),
  priority: text('priority').default('normal'),

  tags: text('tags').array().default([]),
  category: text('category'),

  researchDepth: text('research_depth').default('quick'),
  autoResearch: boolean('auto_research').default(false),

  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  answeredAt: timestamp('answered_at', { withTimezone: true }),

  isArchived: boolean('is_archived').default(false),
  archivedAt: timestamp('archived_at', { withTimezone: true }),
});

export const collections = pgTable('collections', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id').notNull(),

  name: text('name').notNull(),
  description: text('description'),
  color: text('color').default('#6366f1'),
  icon: text('icon').default('folder'),

  isShared: boolean('is_shared').default(false),
  shareToken: text('share_token').unique(),

  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

export const researchResults = pgTable('research_results', {
  id: uuid('id').primaryKey().defaultRandom(),
  questionId: uuid('question_id').notNull().references(() => questions.id, { onDelete: 'cascade' }),

  modelId: text('model_id').notNull(),
  provider: text('provider').notNull(),
  researchDepth: text('research_depth').notNull(),

  summary: text('summary').notNull(),
  keyPoints: jsonb('key_points').default([]),
  followUpQuestions: text('follow_up_questions').array().default([]),

  promptTokens: integer('prompt_tokens'),
  completionTokens: integer('completion_tokens'),
  estimatedCost: real('estimated_cost'),

  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  durationMs: integer('duration_ms'),
});

export const sources = pgTable('sources', {
  id: uuid('id').primaryKey().defaultRandom(),
  researchId: uuid('research_id').notNull().references(() => researchResults.id, { onDelete: 'cascade' }),
  questionId: uuid('question_id').notNull().references(() => questions.id, { onDelete: 'cascade' }),

  url: text('url'),
  title: text('title').notNull(),
  sourceType: text('source_type').default('web'),

  excerpt: text('excerpt'),
  summary: text('summary'),

  relevanceScore: real('relevance_score'),
  userRating: integer('user_rating'),

  author: text('author'),
  publishedAt: timestamp('published_at'),
  accessedAt: timestamp('accessed_at', { withTimezone: true }).defaultNow(),

  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

export const answers = pgTable('answers', {
  id: uuid('id').primaryKey().defaultRandom(),
  questionId: uuid('question_id').notNull().references(() => questions.id, { onDelete: 'cascade' }),
  userId: text('user_id').notNull(),

  content: text('content').notNull(),
  answerType: text('answer_type').default('note'),

  researchId: uuid('research_id').references(() => researchResults.id),
  sourceIds: uuid('source_ids').array().default([]),

  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});
```

---

## 4. API-Endpoints

### 4.1 Questions Controller

```typescript
// ============================================
// QUESTIONS ENDPOINTS
// ============================================

// Liste aller Fragen
GET /api/v1/questions
Query: ?status=open&priority=high&collection_id=xxx&tags=tag1,tag2&search=text&limit=20&offset=0
Response: {
  questions: Question[],
  pagination: { total, limit, offset }
}

// Einzelne Frage mit Details
GET /api/v1/questions/:id
Response: {
  question: Question,
  researchResults: ResearchResult[],
  sources: Source[],
  answers: Answer[]
}

// Frage erstellen
POST /api/v1/questions
Body: {
  title: string,                    // Required
  description?: string,
  collectionId?: string,
  tags?: string[],
  category?: string,
  priority?: 'low' | 'normal' | 'high' | 'urgent',
  researchDepth?: 'quick' | 'standard' | 'deep',
  autoResearch?: boolean            // Direkt Recherche starten
}
Response: { question: Question }

// Frage aktualisieren
PATCH /api/v1/questions/:id
Body: {
  title?: string,
  description?: string,
  status?: 'open' | 'researching' | 'answered' | 'archived',
  priority?: string,
  tags?: string[],
  category?: string,
  collectionId?: string | null
}
Response: { question: Question }

// Frage archivieren
PATCH /api/v1/questions/:id/archive
Response: { question: Question }

// Frage wiederherstellen
PATCH /api/v1/questions/:id/unarchive
Response: { question: Question }

// Frage als beantwortet markieren
PATCH /api/v1/questions/:id/mark-answered
Response: { question: Question }

// Frage löschen
DELETE /api/v1/questions/:id
Response: { success: true }

// Bulk-Operationen
POST /api/v1/questions/bulk
Body: {
  action: 'archive' | 'delete' | 'move' | 'tag',
  questionIds: string[],
  data?: { collectionId?: string, tags?: string[] }
}
Response: { affected: number }
```

### 4.2 Research Controller

```typescript
// ============================================
// RESEARCH ENDPOINTS
// ============================================

// Recherche starten
POST /api/v1/research
Body: {
  questionId: string,
  depth?: 'quick' | 'standard' | 'deep',  // Default: question.researchDepth
  modelId?: string,                        // Optional: Override default model
  additionalContext?: string               // Extra Kontext für bessere Ergebnisse
}
Response: {
  research: ResearchResult,
  sources: Source[],
  creditsUsed: number
}

// Recherche-Status prüfen (für Polling bei async)
GET /api/v1/research/:id/status
Response: {
  status: 'pending' | 'processing' | 'completed' | 'failed',
  progress?: number,                       // 0-100
  research?: ResearchResult                // Wenn completed
}

// Recherche-Ergebnisse abrufen
GET /api/v1/research/question/:questionId
Response: {
  results: ResearchResult[],
  sources: Source[]
}

// Folgefrage aus Recherche erstellen
POST /api/v1/research/:id/follow-up
Body: {
  questionText: string                     // Vorgeschlagene oder neue Folgefrage
}
Response: { question: Question }

// Verfügbare Modelle für Recherche
GET /api/v1/research/models
Response: {
  models: Array<{
    id: string,
    name: string,
    provider: 'ollama' | 'openrouter',
    description: string,
    costPerToken?: number,
    recommended: boolean
  }>
}
```

### 4.3 Sources Controller

```typescript
// ============================================
// SOURCES ENDPOINTS
// ============================================

// Quellen einer Frage
GET /api/v1/sources/question/:questionId
Query: ?type=web&sort=relevance
Response: { sources: Source[] }

// Manuelle Quelle hinzufügen
POST /api/v1/sources
Body: {
  questionId: string,
  url?: string,
  title: string,
  sourceType: 'web' | 'book' | 'paper' | 'video' | 'manual',
  excerpt?: string,
  author?: string,
  publishedAt?: string
}
Response: { source: Source }

// Quelle bewerten
PATCH /api/v1/sources/:id/rate
Body: { rating: 1 | 2 | 3 | 4 | 5 }
Response: { source: Source }

// Quelle entfernen
DELETE /api/v1/sources/:id
Response: { success: true }
```

### 4.4 Answers Controller

```typescript
// ============================================
// ANSWERS ENDPOINTS
// ============================================

// Antworten einer Frage
GET /api/v1/answers/question/:questionId
Response: { answers: Answer[] }

// Antwort/Notiz erstellen
POST /api/v1/answers
Body: {
  questionId: string,
  content: string,                         // Markdown
  answerType: 'note' | 'answer' | 'insight',
  researchId?: string,                     // Basiert auf Recherche
  sourceIds?: string[]                     // Referenzierte Quellen
}
Response: { answer: Answer }

// Antwort aktualisieren
PATCH /api/v1/answers/:id
Body: {
  content?: string,
  sourceIds?: string[]
}
Response: { answer: Answer }

// Antwort löschen
DELETE /api/v1/answers/:id
Response: { success: true }
```

### 4.5 Collections Controller

```typescript
// ============================================
// COLLECTIONS ENDPOINTS
// ============================================

// Alle Sammlungen
GET /api/v1/collections
Response: {
  collections: Array<Collection & { questionCount: number }>
}

// Sammlung mit Fragen
GET /api/v1/collections/:id
Query: ?includeQuestions=true
Response: {
  collection: Collection,
  questions?: Question[]
}

// Sammlung erstellen
POST /api/v1/collections
Body: {
  name: string,
  description?: string,
  color?: string,
  icon?: string
}
Response: { collection: Collection }

// Sammlung aktualisieren
PATCH /api/v1/collections/:id
Body: {
  name?: string,
  description?: string,
  color?: string,
  icon?: string
}
Response: { collection: Collection }

// Sammlung teilen
POST /api/v1/collections/:id/share
Response: {
  collection: Collection,
  shareUrl: string
}

// Teilen beenden
DELETE /api/v1/collections/:id/share
Response: { collection: Collection }

// Öffentliche Sammlung abrufen
GET /api/v1/collections/shared/:token
Response: {
  collection: Collection,
  questions: Question[]
}

// Sammlung löschen
DELETE /api/v1/collections/:id
Response: { success: true }
```

### 4.6 Export Controller

```typescript
// ============================================
// EXPORT ENDPOINTS
// ============================================

// Frage als Markdown exportieren
GET /api/v1/export/question/:id/markdown
Response: text/markdown

// Frage als PDF exportieren
GET /api/v1/export/question/:id/pdf
Response: application/pdf

// Sammlung exportieren
GET /api/v1/export/collection/:id
Query: ?format=markdown|pdf|json
Response: Entsprechendes Format

// Bibliography exportieren (alle Quellen einer Frage)
GET /api/v1/export/question/:id/bibliography
Query: ?style=apa|mla|chicago|bibtex
Response: text/plain
```

---

## 5. KI-Recherche-System

### 5.1 Recherche-Tiefen

| Depth | Beschreibung | Dauer | Credits | Use Case |
|-------|--------------|-------|---------|----------|
| **quick** | Schnelle Antwort, 1-2 Quellen | ~10s | 5 | Faktenfragen, Quick Check |
| **standard** | Ausführlich, 3-5 Quellen | ~30s | 15 | Normale Recherche |
| **deep** | Umfassend, 5-10 Quellen | ~60s | 30 | Tiefgehende Analyse |

### 5.2 Recherche-Ablauf

```
┌─────────────────────────────────────────────────────────────────────────┐
│                      RESEARCH PIPELINE                                   │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  [1] QUERY EXPANSION                                                    │
│      │  Frage → KI optimiert Suchbegriffe                              │
│      │  "Was ist Quantum Computing?" →                                  │
│      │  ["quantum computing basics", "qubits explanation",              │
│      │   "quantum vs classical computing"]                              │
│      ▼                                                                  │
│  [2] WEB SEARCH                                                         │
│      │  Suchbegriffe → Web Search API                                   │
│      │  → URLs + Snippets zurück                                        │
│      ▼                                                                  │
│  [3] CONTENT EXTRACTION                                                 │
│      │  URLs → Fetch & Parse HTML                                       │
│      │  → Clean Text extraktion                                         │
│      ▼                                                                  │
│  [4] RELEVANCE SCORING                                                  │
│      │  KI bewertet Relevanz jeder Quelle                              │
│      │  → Top N Quellen auswählen                                       │
│      ▼                                                                  │
│  [5] SYNTHESIS                                                          │
│      │  KI fasst alle Quellen zusammen                                  │
│      │  → Strukturierte Antwort mit:                                    │
│      │     - Summary (Hauptantwort)                                     │
│      │     - Key Points (Bullet Points)                                 │
│      │     - Follow-up Questions                                        │
│      ▼                                                                  │
│  [6] CITATION GENERATION                                                │
│      │  Quellen → Formatierte Zitate                                    │
│      │  → Zuordnung zu Aussagen                                         │
│      ▼                                                                  │
│  [RESULT]                                                               │
│      ResearchResult + Sources                                           │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### 5.3 System-Prompts

```typescript
// Query Expansion Prompt
const QUERY_EXPANSION_PROMPT = `
Du bist ein Such-Experte. Gegeben ist eine Frage, generiere 3-5 optimierte Suchbegriffe.

Frage: {question}
Kontext: {description}

Generiere Suchbegriffe die:
- Die Kernfrage abdecken
- Verschiedene Aspekte beleuchten
- Für Web-Suche optimiert sind

Ausgabe als JSON-Array: ["term1", "term2", ...]
`;

// Synthesis Prompt
const SYNTHESIS_PROMPT = `
Du bist ein Recherche-Assistent. Analysiere die folgenden Quellen und beantworte die Frage.

Frage: {question}
Kontext: {description}

Quellen:
{sources}

Erstelle eine strukturierte Antwort mit:
1. **Summary**: Hauptantwort in 2-3 Absätzen
2. **Key Points**: 3-5 wichtige Erkenntnisse als Bullet Points
3. **Follow-up Questions**: 2-3 weiterführende Fragen

Zitiere Quellen mit [1], [2], etc.
Ausgabe als JSON.
`;
```

### 5.4 Web Search Integration

```typescript
// Research Service
@Injectable()
export class ResearchService {
  constructor(
    private readonly searchService: WebSearchService,
    private readonly aiService: AiCompletionService,
    private readonly contentExtractor: ContentExtractorService,
  ) {}

  async research(questionId: string, depth: ResearchDepth): Promise<ResearchResult> {
    const question = await this.getQuestion(questionId);

    // 1. Query Expansion
    const searchQueries = await this.aiService.expandQuery(question);

    // 2. Web Search
    const searchResults = await Promise.all(
      searchQueries.map(q => this.searchService.search(q, { limit: this.getLimit(depth) }))
    );

    // 3. Content Extraction
    const contents = await Promise.all(
      searchResults.flat().map(r => this.contentExtractor.extract(r.url))
    );

    // 4. Relevance Scoring
    const scoredSources = await this.aiService.scoreRelevance(question, contents);
    const topSources = scoredSources.slice(0, this.getSourceLimit(depth));

    // 5. Synthesis
    const synthesis = await this.aiService.synthesize(question, topSources);

    // 6. Save Results
    return this.saveResults(questionId, synthesis, topSources);
  }

  private getLimit(depth: ResearchDepth): number {
    return { quick: 3, standard: 6, deep: 10 }[depth];
  }

  private getSourceLimit(depth: ResearchDepth): number {
    return { quick: 2, standard: 5, deep: 8 }[depth];
  }
}
```

---

## 6. Web App (SvelteKit)

### 6.1 Routen-Struktur

```
src/routes/
├── (auth)/
│   ├── login/+page.svelte
│   └── register/+page.svelte
├── (app)/
│   ├── +layout.svelte              # App Shell mit Sidebar
│   ├── +page.svelte                # Dashboard / Alle Fragen
│   ├── questions/
│   │   ├── +page.svelte            # Fragen-Liste
│   │   ├── [id]/
│   │   │   ├── +page.svelte        # Frage-Detail
│   │   │   └── +page.server.ts     # SSR Data Loading
│   │   └── new/+page.svelte        # Neue Frage
│   ├── collections/
│   │   ├── +page.svelte            # Sammlungen-Liste
│   │   └── [id]/+page.svelte       # Sammlung-Detail
│   ├── research/
│   │   └── [id]/+page.svelte       # Recherche-Ergebnis-Ansicht
│   └── settings/+page.svelte       # Einstellungen
└── health/+server.ts               # Health Endpoint
```

### 6.2 Komponenten-Übersicht

```
src/lib/components/
├── questions/
│   ├── QuestionCard.svelte         # Frage in Liste
│   ├── QuestionForm.svelte         # Erstellen/Bearbeiten
│   ├── QuestionDetail.svelte       # Vollständige Ansicht
│   ├── QuestionFilters.svelte      # Filter & Suche
│   └── QuestionStatus.svelte       # Status-Badge
├── research/
│   ├── ResearchPanel.svelte        # Recherche-Ergebnisse
│   ├── ResearchProgress.svelte     # Fortschritts-Anzeige
│   ├── SourceCard.svelte           # Einzelne Quelle
│   └── SourceList.svelte           # Quellen-Liste
├── answers/
│   ├── AnswerEditor.svelte         # Markdown-Editor
│   ├── AnswerCard.svelte           # Antwort-Anzeige
│   └── AnswerList.svelte           # Antworten-Liste
├── collections/
│   ├── CollectionCard.svelte       # Sammlung in Liste
│   ├── CollectionForm.svelte       # Erstellen/Bearbeiten
│   └── CollectionPicker.svelte     # Auswahl-Dropdown
├── common/
│   ├── TagInput.svelte             # Tag-Eingabe
│   ├── PriorityBadge.svelte        # Prioritäts-Anzeige
│   ├── EmptyState.svelte           # Leerer Zustand
│   └── ConfirmDialog.svelte        # Bestätigungs-Dialog
└── layout/
    ├── Sidebar.svelte              # Navigation
    ├── Header.svelte               # Top-Bar
    └── QuickCapture.svelte         # Schnell-Eingabe (global)
```

### 6.3 Haupt-Ansichten

#### Dashboard (Fragen-Liste)

```svelte
<!-- src/routes/(app)/+page.svelte -->
<script lang="ts">
  import { questionsStore } from '$lib/stores/questions.svelte';
  import QuestionCard from '$lib/components/questions/QuestionCard.svelte';
  import QuestionFilters from '$lib/components/questions/QuestionFilters.svelte';
  import QuickCapture from '$lib/components/layout/QuickCapture.svelte';
  import EmptyState from '$lib/components/common/EmptyState.svelte';

  let filters = $state({
    status: 'open',
    priority: null,
    collectionId: null,
    search: '',
    tags: []
  });

  let questions = $derived(
    questionsStore.filtered(filters)
  );
</script>

<div class="flex flex-col h-full">
  <!-- Quick Capture -->
  <QuickCapture />

  <!-- Filters -->
  <QuestionFilters bind:filters />

  <!-- Questions List -->
  <div class="flex-1 overflow-y-auto p-4">
    {#if questions.length === 0}
      <EmptyState
        icon="help-circle"
        title="Keine Fragen gefunden"
        description="Stelle deine erste Frage oder passe die Filter an"
        action={{ label: 'Neue Frage', href: '/questions/new' }}
      />
    {:else}
      <div class="space-y-3">
        {#each questions as question (question.id)}
          <QuestionCard {question} />
        {/each}
      </div>
    {/if}
  </div>
</div>
```

#### Frage-Detail

```svelte
<!-- src/routes/(app)/questions/[id]/+page.svelte -->
<script lang="ts">
  import { page } from '$app/stores';
  import ResearchPanel from '$lib/components/research/ResearchPanel.svelte';
  import AnswerList from '$lib/components/answers/AnswerList.svelte';
  import SourceList from '$lib/components/research/SourceList.svelte';
  import { questionsApi } from '$lib/api/questions';
  import { researchApi } from '$lib/api/research';

  let { data } = $props();
  let question = $state(data.question);
  let researchResults = $state(data.researchResults);
  let sources = $state(data.sources);
  let answers = $state(data.answers);

  let activeTab = $state<'research' | 'answers' | 'sources'>('research');
  let isResearching = $state(false);

  async function startResearch(depth: 'quick' | 'standard' | 'deep') {
    isResearching = true;
    try {
      const result = await researchApi.start({
        questionId: question.id,
        depth
      });
      researchResults = [result.research, ...researchResults];
      sources = [...result.sources, ...sources];
      question.status = 'researching';
    } finally {
      isResearching = false;
    }
  }

  async function markAnswered() {
    question = await questionsApi.markAnswered(question.id);
  }
</script>

<div class="max-w-4xl mx-auto p-6">
  <!-- Header -->
  <div class="mb-6">
    <div class="flex items-start justify-between">
      <div>
        <h1 class="text-2xl font-bold">{question.title}</h1>
        <div class="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
          <QuestionStatus status={question.status} />
          <PriorityBadge priority={question.priority} />
          {#each question.tags as tag}
            <span class="bg-muted px-2 py-0.5 rounded">{tag}</span>
          {/each}
        </div>
      </div>

      <div class="flex items-center gap-2">
        {#if question.status !== 'answered'}
          <DropdownMenu>
            <Button variant="default" disabled={isResearching}>
              {#if isResearching}
                <Spinner class="mr-2" size="sm" />
                Recherchiere...
              {:else}
                Recherche starten
              {/if}
            </Button>
            <DropdownContent>
              <DropdownItem onclick={() => startResearch('quick')}>
                Quick (~10s, 5 Credits)
              </DropdownItem>
              <DropdownItem onclick={() => startResearch('standard')}>
                Standard (~30s, 15 Credits)
              </DropdownItem>
              <DropdownItem onclick={() => startResearch('deep')}>
                Deep (~60s, 30 Credits)
              </DropdownItem>
            </DropdownContent>
          </DropdownMenu>

          <Button variant="outline" onclick={markAnswered}>
            Als beantwortet markieren
          </Button>
        {/if}
      </div>
    </div>

    {#if question.description}
      <p class="mt-4 text-muted-foreground">{question.description}</p>
    {/if}
  </div>

  <!-- Tabs -->
  <Tabs bind:value={activeTab}>
    <TabsList>
      <TabsTrigger value="research">
        Recherche ({researchResults.length})
      </TabsTrigger>
      <TabsTrigger value="answers">
        Antworten ({answers.length})
      </TabsTrigger>
      <TabsTrigger value="sources">
        Quellen ({sources.length})
      </TabsTrigger>
    </TabsList>

    <TabsContent value="research">
      <ResearchPanel
        results={researchResults}
        onFollowUp={(text) => createFollowUp(text)}
      />
    </TabsContent>

    <TabsContent value="answers">
      <AnswerList
        {answers}
        questionId={question.id}
        availableSources={sources}
      />
    </TabsContent>

    <TabsContent value="sources">
      <SourceList {sources} />
    </TabsContent>
  </Tabs>
</div>
```

### 6.4 Stores (Svelte 5 Runes)

```typescript
// src/lib/stores/questions.svelte.ts
import { questionsApi } from '$lib/api/questions';

interface QuestionsState {
  questions: Question[];
  loading: boolean;
  error: string | null;
}

function createQuestionsStore() {
  let state = $state<QuestionsState>({
    questions: [],
    loading: false,
    error: null
  });

  return {
    get questions() { return state.questions; },
    get loading() { return state.loading; },
    get error() { return state.error; },

    // Filtered questions
    filtered(filters: QuestionFilters) {
      return state.questions.filter(q => {
        if (filters.status && q.status !== filters.status) return false;
        if (filters.priority && q.priority !== filters.priority) return false;
        if (filters.collectionId && q.collectionId !== filters.collectionId) return false;
        if (filters.search && !q.title.toLowerCase().includes(filters.search.toLowerCase())) return false;
        if (filters.tags.length && !filters.tags.some(t => q.tags.includes(t))) return false;
        return true;
      });
    },

    // Load questions
    async load() {
      state.loading = true;
      state.error = null;
      try {
        const result = await questionsApi.getAll();
        state.questions = result.questions;
      } catch (e) {
        state.error = e.message;
      } finally {
        state.loading = false;
      }
    },

    // Create question
    async create(data: CreateQuestionDto) {
      const { question } = await questionsApi.create(data);
      state.questions = [question, ...state.questions];
      return question;
    },

    // Update question
    async update(id: string, data: UpdateQuestionDto) {
      const { question } = await questionsApi.update(id, data);
      state.questions = state.questions.map(q =>
        q.id === id ? question : q
      );
      return question;
    },

    // Delete question
    async delete(id: string) {
      await questionsApi.delete(id);
      state.questions = state.questions.filter(q => q.id !== id);
    }
  };
}

export const questionsStore = createQuestionsStore();
```

---

## 7. Mobile App (Expo)

### 7.1 Screen-Struktur

```
app/
├── (tabs)/
│   ├── _layout.tsx               # Tab Navigator
│   ├── index.tsx                 # Fragen-Liste (Home)
│   ├── collections.tsx           # Sammlungen
│   └── settings.tsx              # Einstellungen
├── question/
│   ├── [id].tsx                  # Frage-Detail
│   └── new.tsx                   # Neue Frage
├── research/
│   └── [id].tsx                  # Recherche-Ergebnis
└── _layout.tsx                   # Root Layout
```

### 7.2 Haupt-Screens

```tsx
// app/(tabs)/index.tsx
import { View, FlatList, RefreshControl } from 'react-native';
import { useQuestions } from '@/hooks/useQuestions';
import { QuestionCard } from '@/components/QuestionCard';
import { QuickCaptureInput } from '@/components/QuickCaptureInput';
import { FilterBar } from '@/components/FilterBar';

export default function QuestionsScreen() {
  const { questions, loading, refetch, createQuestion } = useQuestions();
  const [filters, setFilters] = useState({ status: 'open' });

  const filteredQuestions = useMemo(() =>
    questions.filter(q => !filters.status || q.status === filters.status),
    [questions, filters]
  );

  return (
    <View className="flex-1 bg-background">
      <QuickCaptureInput
        onSubmit={(title) => createQuestion({ title })}
        placeholder="Neue Frage eingeben..."
      />

      <FilterBar
        filters={filters}
        onChange={setFilters}
      />

      <FlatList
        data={filteredQuestions}
        renderItem={({ item }) => (
          <QuestionCard
            question={item}
            onPress={() => router.push(`/question/${item.id}`)}
          />
        )}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={refetch} />
        }
        contentContainerClassName="p-4 gap-3"
      />
    </View>
  );
}
```

### 7.3 Quick Capture Widget

```tsx
// components/QuickCaptureInput.tsx
import { View, TextInput, Pressable } from 'react-native';
import { Send, Sparkles } from 'lucide-react-native';
import { useState } from 'react';

interface Props {
  onSubmit: (title: string, options?: { autoResearch?: boolean }) => void;
  placeholder?: string;
}

export function QuickCaptureInput({ onSubmit, placeholder }: Props) {
  const [text, setText] = useState('');
  const [autoResearch, setAutoResearch] = useState(false);

  const handleSubmit = () => {
    if (!text.trim()) return;
    onSubmit(text.trim(), { autoResearch });
    setText('');
  };

  return (
    <View className="flex-row items-center p-4 bg-card border-b border-border">
      <TextInput
        className="flex-1 bg-muted rounded-lg px-4 py-3 text-foreground"
        placeholder={placeholder}
        placeholderTextColor="#888"
        value={text}
        onChangeText={setText}
        onSubmitEditing={handleSubmit}
        returnKeyType="send"
      />

      <Pressable
        className={`ml-2 p-3 rounded-lg ${autoResearch ? 'bg-primary' : 'bg-muted'}`}
        onPress={() => setAutoResearch(!autoResearch)}
      >
        <Sparkles size={20} color={autoResearch ? '#fff' : '#888'} />
      </Pressable>

      <Pressable
        className="ml-2 p-3 bg-primary rounded-lg"
        onPress={handleSubmit}
        disabled={!text.trim()}
      >
        <Send size={20} color="#fff" />
      </Pressable>
    </View>
  );
}
```

---

## 8. Implementierungs-Roadmap

### Phase 1: Foundation (1-2 Wochen)

```
[ ] Projekt-Struktur erstellen
    [ ] apps/questions/apps/backend (NestJS)
    [ ] apps/questions/apps/web (SvelteKit)
    [ ] apps/questions/apps/mobile (Expo)
    [ ] apps/questions/packages/shared

[ ] Datenbank-Schema
    [ ] Drizzle Schema definieren
    [ ] Migrations erstellen
    [ ] Seed-Daten vorbereiten

[ ] Backend: Core CRUD
    [ ] QuestionModule (CRUD)
    [ ] CollectionModule (CRUD)
    [ ] HealthModule
    [ ] Auth-Integration (@manacore/shared-nestjs-auth)

[ ] Web: Basis-UI
    [ ] Layout mit Sidebar
    [ ] Fragen-Liste
    [ ] Frage erstellen/bearbeiten
    [ ] Auth-Flow
```

### Phase 2: Research Engine (1-2 Wochen)

```
[ ] Backend: Research-System
    [ ] ResearchModule
    [ ] WebSearchService (externe API-Integration)
    [ ] ContentExtractorService
    [ ] AiCompletionService (Ollama + OpenRouter)
    [ ] SourceModule

[ ] Research-Pipeline
    [ ] Query Expansion
    [ ] Web Search
    [ ] Content Extraction
    [ ] Relevance Scoring
    [ ] Synthesis
    [ ] Citation Generation

[ ] Web: Research-UI
    [ ] Research starten (Button + Depth-Auswahl)
    [ ] Progress-Anzeige
    [ ] Ergebnis-Darstellung
    [ ] Quellen-Liste
```

### Phase 3: Answers & Notes (1 Woche)

```
[ ] Backend: Answers
    [ ] AnswerModule (CRUD)
    [ ] Markdown-Verarbeitung

[ ] Web: Answer-UI
    [ ] Markdown-Editor
    [ ] Antwort-Liste
    [ ] Quellen-Referenzierung
```

### Phase 4: Mobile App (1-2 Wochen)

```
[ ] Expo Setup
    [ ] Navigation
    [ ] Auth-Integration
    [ ] API-Client

[ ] Screens
    [ ] Fragen-Liste
    [ ] Quick Capture
    [ ] Frage-Detail
    [ ] Research-Anzeige
    [ ] Sammlungen
```

### Phase 5: Advanced Features (1 Woche)

```
[ ] Export
    [ ] Markdown-Export
    [ ] PDF-Export
    [ ] Bibliography-Export

[ ] Sharing
    [ ] Öffentliche Sammlungen
    [ ] Share-Links

[ ] Bulk-Operationen
    [ ] Multi-Select
    [ ] Bulk-Archive
    [ ] Bulk-Move
```

### Phase 6: Polish & Launch (1 Woche)

```
[ ] Landing Page (Astro)
[ ] Performance-Optimierung
[ ] Error-Handling
[ ] Loading-States
[ ] Dokumentation
[ ] Deploy-Konfiguration
```

---

## 9. Technische Entscheidungen

### 9.1 Web Search API

**Optionen:**

| Service | Preis | Qualität | Integration |
|---------|-------|----------|-------------|
| **SearXNG (self-hosted)** | Kostenlos | Gut | Docker-Container |
| **Brave Search API** | $5/1000 queries | Sehr gut | REST API |
| **Google Custom Search** | $5/1000 queries | Excellent | REST API |
| **Tavily AI** | $5/1000 queries | Gut für AI | REST API |

**Empfehlung:** SearXNG für Development, Brave/Tavily für Production

### 9.2 Content Extraction

```typescript
// Verwendung von @extractus/article-extractor
import { extract } from '@extractus/article-extractor';

async function extractContent(url: string) {
  const article = await extract(url);
  return {
    title: article?.title,
    content: article?.content,
    author: article?.author,
    published: article?.published
  };
}
```

### 9.3 Credit-Verbrauch

| Aktion | Credits |
|--------|---------|
| Quick Research | 5 |
| Standard Research | 15 |
| Deep Research | 30 |
| Manual Source Add | 0 |
| Export | 0 |

---

## 10. Offene Fragen

1. **Web Search API**: Welchen Dienst verwenden? SearXNG vs. Brave vs. Tavily?
2. **Offline-Support**: Sollen Fragen offline erfasst werden können?
3. **Collaboration**: Sollen Teams gemeinsam an Fragen arbeiten können?
4. **Voice Input**: Soll Spracheingabe (STT) integriert werden?
5. **Auto-Research Schedule**: Sollen Fragen automatisch recherchiert werden (z.B. täglich)?

---

## 11. Metriken & KPIs

| Metrik | Ziel | Tracking |
|--------|------|----------|
| Fragen pro User/Woche | 10+ | Weekly |
| Recherchen pro Frage | 1.5 | Weekly |
| Antwort-Rate | 50% | Weekly |
| Research Satisfaction (Rating) | 4.0/5.0 | Per Research |
| Time to Answer | < 1 Woche | Weekly |

---

*Dokument-Status: Entwurf - Zur Überprüfung*
