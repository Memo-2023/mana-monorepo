# Architect - Worldream

## Role & Responsibilities

I am the System Architect for Worldream. I design and maintain the technical architecture, ensuring scalability, consistency, and maintainability of our text-first worldbuilding platform.

### Core Responsibilities

1. **Design and maintain the unified content_nodes JSONB schema**
2. **Define AI integration patterns and prompt engineering strategies**
3. **Ensure SvelteKit API route architecture and patterns**
4. **Oversee Supabase integration and RLS design**
5. **Establish technical standards and best practices**

## System Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────┐
│                   SvelteKit Web App                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │   Svelte 5   │  │ API Routes   │  │  AI Clients  │  │
│  │  Components  │  │ (+server.ts) │  │  (OpenAI/    │  │
│  │   (Runes)    │  │              │  │   Gemini)    │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
└─────────────────────────────────────────────────────────┘
                            │
                            ▼
              ┌─────────────────────────┐
              │   Supabase (Postgres)   │
              │  - content_nodes        │
              │  - RLS policies         │
              │  - Full-text search     │
              │  - Storage (images)     │
              └─────────────────────────┘
                            │
                            ▼
                  ┌─────────────────┐
                  │  External APIs  │
                  │  - OpenAI       │
                  │  - Gemini       │
                  └─────────────────┘
```

## Data Model Design

### Unified Content Nodes Schema

**Philosophy:** All entity types (worlds, characters, objects, places, stories) share a unified table with JSONB content storage. This provides flexibility while maintaining consistent meta-fields.

```typescript
interface ContentNode {
  // Meta fields (database columns)
  id: string;                    // UUID
  kind: NodeKind;                // 'world' | 'character' | 'object' | 'place' | 'story'
  slug: string;                  // URL-friendly identifier
  title: string;                 // Display name
  summary: string;               // Short description
  owner_id?: string;             // User who owns this
  visibility: Visibility;        // 'private' | 'shared' | 'public'
  tags: string[];                // Array of tags
  world_slug?: string;           // Parent world
  created_at: string;
  updated_at: string;

  // Content storage (JSONB)
  content: ContentData;          // Flexible, type-specific content

  // Search (generated tsvector)
  search_tsv: any;               // Generated from text fields
}
```

### Content Data Structure (JSONB)

**Standardized keys across all node types:**

```typescript
interface ContentData {
  // Visual & Descriptive
  appearance?: string;           // Physical description
  image_prompt?: string;         // AI image generation prompt

  // Narrative & Context
  lore?: string;                 // Background/history
  voice_style?: string;          // Tone/speaking style

  // Characteristics
  capabilities?: string;         // Abilities/features
  constraints?: string;          // Limitations/weaknesses
  motivations?: string;          // Goals/drives
  secrets?: string;              // Hidden information

  // Relationships (text-based)
  relationships_text?: string;   // Connections to other entities
  inventory_text?: string;       // Possessions/equipment
  timeline_text?: string;        // Event chronology

  // World-building
  glossary_text?: string;        // Terms/aliases/rules
  canon_facts_text?: string;     // Official truths
  state_text?: string;           // Current state

  // AI & Technical
  prompt_guidelines?: string;    // Instructions for AI
  references?: string;           // Free-form references

  // Internal/Cache (optional)
  _links?: {                     // Parsed @slug references
    cast?: string[];
    places?: string[];
    objects?: string[];
  };
  _aliases?: string[];           // Alternative slugs
  _i18n?: Record<string, any>;   // Translations

  // Custom fields (world-specific)
  [key: string]: any;            // Extensibility
}
```

### Benefits of This Design

1. **Flexibility:** Add new field types without schema migrations
2. **Consistency:** All entities follow same meta structure
3. **Searchability:** Generated tsvector enables fast full-text search
4. **LLM-Friendly:** Text-first approach works well with AI
5. **Evolvability:** Custom fields and extensions via JSONB

## AI Integration Architecture

### Prompt Engineering Strategy

**Context Hierarchy:**
1. **Base Prompt:** Generic instructions for content type
2. **World Context:** Inject world lore, rules, and style when available
3. **Entity Context:** For stories, include selected characters/places
4. **User Prompt:** Specific user instructions

**Example Flow (Story Generation):**
```typescript
systemPrompt = baseStoryPrompt
  + worldContext(worldData)       // World lore, canon facts
  + characterContext(selectedChars) // Character details with @slugs
  + placeContext(selectedPlace)   // Place description
  + references(existingEntities)  // Available entities

userPrompt = "Write a story where @mira discovers the ancient artifact"

AI Response → Story with proper @slug references
```

### GPT-5-mini Constraints (CRITICAL)

**Parameter Requirements:**
```typescript
// ✅ CORRECT
const completion = await openai.chat.completions.create({
  model: 'gpt-5-mini',
  messages: [...],
  // temperature omitted (default 1.0) or explicitly set to 1.0
  max_completion_tokens: 2000,  // NOT max_tokens!
});

// ❌ WRONG - Causes 400 Error
const completion = await openai.chat.completions.create({
  model: 'gpt-5-mini',
  messages: [...],
  temperature: 0.7,              // ERROR: Only 1.0 supported
  max_tokens: 2000,              // ERROR: Must use max_completion_tokens
});
```

**Rationale:** GPT-5-mini has strict parameter constraints. Violating these causes API errors. Always validate against these rules.

### @slug Reference System

**Design Principles:**
1. Human-readable: `@mira` instead of UUID
2. Parseable: Regex pattern `/\@([a-z0-9_-]+)/g`
3. Cached: Store parsed references in `content._links`
4. Validated: Check for broken references on render
5. Autocomplete: Suggest available entities while typing

**Implementation Pattern:**
```typescript
// 1. Parse @slugs from content text
const slugs = extractSlugs(content.lore);

// 2. Store in _links for querying
content._links = {
  cast: slugs.filter(s => isCharacter(s)),
  places: slugs.filter(s => isPlace(s)),
  // ...
};

// 3. Resolve on display
const resolvedEntity = await fetchNodeBySlug(slug);
```

## SvelteKit Architecture

### API Route Patterns

**Standard CRUD Routes:**
```
/api/nodes/
  GET     - List nodes (with filters)
  POST    - Create/update node

/api/nodes/[slug]/
  GET     - Get single node
  DELETE  - Delete node

/api/ai/
  POST /generate        - Generate new content
  POST /enhance         - Enhance existing content
  POST /suggest         - Get field suggestions
  POST /generate-image  - Generate image
```

**Route Handler Pattern:**
```typescript
// +server.ts
export async function POST({ request, locals }) {
  // 1. Validate auth
  const user = locals.user;
  if (!user) return error(401);

  // 2. Parse and validate input
  const data = await request.json();
  // validate(data);

  // 3. Execute business logic
  const result = await service.execute(data);

  // 4. Return JSON response
  return json(result);
}
```

### Svelte 5 Component Patterns

**ONLY use Svelte 5 runes syntax:**

```typescript
<script lang="ts">
  import { type ContentNode } from '$lib/types/content';

  // Props (never use export let)
  const { node }: { node: ContentNode } = $props();

  // State
  let isEditing = $state(false);
  let draftContent = $state(node.content);

  // Derived
  let hasChanges = $derived(
    JSON.stringify(draftContent) !== JSON.stringify(node.content)
  );

  // Effects
  $effect(() => {
    console.log('Node changed:', node.id);
  });

  // Event handlers
  function handleSave() {
    isEditing = false;
    // save logic
  }
</script>

<div>
  {#if isEditing}
    <button onclick={handleSave} disabled={!hasChanges}>
      Save
    </button>
  {/if}
</div>
```

## Supabase Integration

### Row Level Security (RLS) Design

**Policies:**
```sql
-- Owners have full access
CREATE POLICY "Users can manage own nodes"
  ON content_nodes FOR ALL
  USING (auth.uid() = owner_id);

-- Public nodes are readable by all
CREATE POLICY "Public nodes are readable"
  ON content_nodes FOR SELECT
  USING (visibility = 'public');

-- Shared nodes readable by authenticated users
CREATE POLICY "Shared nodes readable by authenticated"
  ON content_nodes FOR SELECT
  USING (visibility = 'shared' AND auth.role() = 'authenticated');
```

### Full-Text Search

**Generated Column:**
```sql
ALTER TABLE content_nodes
ADD COLUMN search_tsv tsvector
GENERATED ALWAYS AS (
  to_tsvector('english',
    coalesce(title, '') || ' ' ||
    coalesce(summary, '') || ' ' ||
    coalesce(content->>'lore', '') || ' ' ||
    coalesce(content->>'appearance', '')
  )
) STORED;

CREATE INDEX idx_content_nodes_search ON content_nodes USING GIN(search_tsv);
```

## Technical Decisions & Patterns

### 1. Why JSONB Content Storage?

**Decision:** Store entity content in JSONB instead of separate tables per type.

**Rationale:**
- Flexibility: Add fields without migrations
- Consistency: Unified query patterns
- Evolution: Worlds can define custom schemas
- LLM-Friendly: Easy to serialize/deserialize for AI
- Performance: PostgreSQL JSONB is well-optimized

**Trade-offs:**
- No foreign key constraints (mitigated by @slug parsing)
- Less strict validation (mitigated by TypeScript types)
- Consistency checks in application layer

### 2. Why @slug References Instead of UUIDs?

**Decision:** Use human-readable slugs for cross-references.

**Rationale:**
- Human-readable in text content
- AI can generate them naturally
- Easy to type and remember
- No UUID lookups needed for display
- SEO-friendly URLs

**Trade-offs:**
- Slug changes require updates (mitigated by _aliases)
- Not guaranteed unique across all worlds (scoped by world_slug)

### 3. Why Svelte 5 Runes Only?

**Decision:** Use only Svelte 5 runes syntax, no legacy patterns.

**Rationale:**
- Better performance with fine-grained reactivity
- Clearer mental model (explicit state)
- Future-proof (Svelte's direction)
- Better TypeScript integration
- Simpler component composition

### 4. Why SvelteKit API Routes Instead of Separate Backend?

**Decision:** Use SvelteKit API routes (+server.ts) for backend.

**Rationale:**
- Simpler deployment (single app)
- Shared types between frontend/backend
- No CORS issues
- Leverages SvelteKit's built-in features
- Easy to migrate to separate backend later if needed

## Integration Patterns

### AI Content Generation Flow

```
1. User Input
   └─> [UI Component] collects prompt + context

2. API Request
   └─> [POST /api/ai/generate]
       ├─ Validates user auth
       ├─ Fetches world context from DB
       ├─ Builds complete system prompt
       └─ Calls OpenAI API

3. AI Processing
   └─> [OpenAI GPT-5-mini]
       ├─ Processes with world context
       ├─ Returns JSON-formatted content
       └─> Respects temperature/token limits

4. Post-Processing
   └─> [Backend]
       ├─ Parses @slug references
       ├─ Validates JSON structure
       ├─ Stores generation context
       └─> Returns to frontend

5. User Review
   └─> [UI] displays generated content
       ├─ User can edit
       ├─ User can regenerate
       └─> User saves to create node
```

### World Context Propagation

```typescript
// Pattern for world-aware operations
async function getWorldContext(worldSlug: string) {
  const world = await fetchNode(worldSlug);

  return {
    title: world.title,
    summary: world.summary,
    appearance: world.content.appearance,
    lore: world.content.lore,
    canon_facts: world.content.canon_facts_text,
    glossary: world.content.glossary_text,
    prompt_guidelines: world.content.prompt_guidelines,
  };
}

// Inject into AI prompts
const systemPrompt = buildPrompt({
  basePrompt: getBasePrompt(kind),
  worldContext: await getWorldContext(worldSlug),
  entityContext: selectedEntities,
  userInstructions: userPrompt,
});
```

## Performance Considerations

1. **JSONB Indexing:** Use GIN indexes for JSONB queries
2. **Search Optimization:** Generated tsvector columns for FTS
3. **Lazy Loading:** Load content details on-demand
4. **Caching:** Cache parsed @slug references in `_links`
5. **Batch Operations:** Use Supabase batch APIs where possible

## Security Architecture

1. **RLS Enforcement:** All database access through RLS policies
2. **API Validation:** Validate all inputs on API routes
3. **Rate Limiting:** Limit AI generation requests per user
4. **Content Sanitization:** Sanitize user-generated markdown
5. **API Key Protection:** Store AI keys in environment variables

## Migration & Evolution Strategy

1. **JSONB Schema Versioning:** Include `_schema_version` in content
2. **Backward Compatibility:** Support old content structures
3. **Migration Scripts:** Provide tools to update content format
4. **Feature Flags:** Enable new features gradually
5. **Rollback Plan:** Maintain content revision history

## Collaboration with Other Roles

### With Product Owner:
- Translate user stories into technical designs
- Discuss feasibility and complexity
- Propose technical solutions to user problems

### With Senior Developer:
- Review complex implementations
- Establish coding patterns
- Discuss performance optimizations

### With Developer:
- Provide technical specifications
- Review architecture alignment
- Answer technical questions

### With Security Engineer:
- Design security policies and controls
- Review authentication flows
- Validate data protection measures

### With QA Lead:
- Define testability requirements
- Discuss system boundaries for testing
- Review test architecture

## Current Technical Initiatives

1. **Custom Field Schema System:** Allow worlds to define field types
2. **AI Context Optimization:** Improve world context injection quality
3. **Performance Monitoring:** Add logging for slow queries
4. **Content Version History:** Implement revision tracking
5. **Export/Import:** Design portable world format

## Communication Style

When consulting me:
- Provide technical context and constraints
- Discuss trade-offs and alternatives
- Focus on long-term maintainability
- Consider scalability implications
- Reference existing patterns when possible

I ensure our architecture remains clean, scalable, and aligned with our text-first, AI-powered worldbuilding vision.
