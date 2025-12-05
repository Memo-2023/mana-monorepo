# Memory & Skills System - Implementierungsplan

## Übersicht
Ein dreistufiges Gedächtnissystem für Charaktere in Worldream, das realistische Erinnerungsmechaniken mit Story-Integration verbindet.

## 1. Datenbankschema

### 1.1 Neue Felder in `content_nodes` (JSONB content)

```sql
-- Für Charaktere wird das content JSONB erweitert:
{
  -- Existing fields...
  
  -- Memory System
  "short_term_memory": [
    {
      "id": "uuid",
      "timestamp": "2024-01-15T10:30:00Z",
      "content": "Text der Erinnerung",
      "location": "@ort_slug",
      "involved": ["@character_slug"],
      "tags": ["#emotion:surprised", "#information"],
      "importance": 3,
      "decay_at": "2024-01-18T10:30:00Z"
    }
  ],
  
  "medium_term_memory": [
    {
      "id": "uuid",
      "timestamp": "2024-01-01T00:00:00Z",
      "content": "Komprimierte Erinnerung",
      "original_details": "Längere Version...",
      "context": "Warum war das wichtig",
      "location": "@ort_slug",
      "involved": ["@character_slug"],
      "tags": ["#relationship", "#learned"],
      "importance": 6,
      "decay_at": "2024-04-01T00:00:00Z",
      "linked_memories": ["memory_id_1", "memory_id_2"]
    }
  ],
  
  "long_term_memory": [
    {
      "id": "uuid",
      "timestamp": "2020-01-01T00:00:00Z",
      "content": "Kernhafte Erinnerung",
      "emotional_weight": 9,
      "category": "trauma|triumph|relationship|skill|secret",
      "triggers": ["Feuer", "Schreie", "@specific_person"],
      "effects": "Beschreibung der Auswirkungen",
      "involved": ["@character_slug"],
      "immutable": true
    }
  ],
  
  -- Memory Metadata
  "memory_traits": {
    "memory_quality": "excellent|good|average|poor",
    "trauma_filter": true,
    "selective_memory": ["violence", "embarrassment"],
    "memory_conditions": {
      "drunk": "partial_blackout",
      "stressed": "detail_loss",
      "happy": "enhanced_positive"
    }
  },
  
  -- Skills System  
  "skills": {
    "primary": [
      {
        "name": "Schwertkampf",
        "level": 8,
        "level_text": "Meister",
        "subskills": {
          "Duellieren": "Experte",
          "Formationen": "Fortgeschritten"
        },
        "learned_from": "@waffenmeister_karl",
        "learned_at": "@königliche_akademie",
        "training_years": 10,
        "last_used": "2024-01-10",
        "conditions": {
          "injured": -2,
          "angry": +1
        }
      }
    ],
    "learning": [
      {
        "name": "Magie-Grundlagen",
        "progress": 15,
        "teacher": "@mira",
        "started": "2024-01-01",
        "blocked_by": null,
        "next_milestone": "Erste erfolgreiche Levitation"
      }
    ],
    "conditions": {
      "Nachtsicht": {
        "trigger": "darkness",
        "effect": "+2 Wahrnehmung"
      },
      "Höhenangst": {
        "trigger": "height > 10m",
        "effect": "-4 Klettern, -2 Konzentration"
      }
    }
  }
}
```

### 1.2 Neue Tabelle: `memory_events` (für Story-Integration)

```sql
CREATE TABLE memory_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  node_id UUID REFERENCES content_nodes(id) ON DELETE CASCADE,
  story_id UUID REFERENCES content_nodes(id),
  event_timestamp TIMESTAMPTZ NOT NULL,
  event_type TEXT NOT NULL, -- 'observed', 'experienced', 'told', 'dreamed'
  raw_event TEXT NOT NULL,
  processed_memory JSONB,
  memory_tier TEXT, -- 'short', 'medium', 'long'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_memory_events_node ON memory_events(node_id);
CREATE INDEX idx_memory_events_story ON memory_events(story_id);
CREATE INDEX idx_memory_events_timestamp ON memory_events(event_timestamp);
```

## 2. API Endpoints

### 2.1 Memory Management

```typescript
// GET /api/nodes/[slug]/memories
// Ruft alle Erinnerungen ab, gefiltert nach Tier
interface MemoryResponse {
  short_term: Memory[];
  medium_term: Memory[];
  long_term: Memory[];
  stats: {
    total_memories: number;
    memory_quality: string;
    oldest_memory: Date;
  };
}

// POST /api/nodes/[slug]/memories
// Fügt neue Erinnerung hinzu
interface AddMemoryRequest {
  content: string;
  tier?: 'short' | 'medium' | 'long';
  importance?: number;
  tags?: string[];
  involved?: string[]; // @slugs
  location?: string; // @slug
  emotional_weight?: number;
}

// POST /api/nodes/[slug]/memories/process
// Prozessiert Erinnerungen (Aging, Decay, Compression)
interface ProcessMemoriesRequest {
  force?: boolean;
  current_date?: string; // Für Story-Zeit
}

// PUT /api/nodes/[slug]/memories/[memoryId]
// Aktualisiert oder verschiebt Erinnerung
interface UpdateMemoryRequest {
  move_to?: 'medium' | 'long';
  content?: string;
  importance?: number;
  add_details?: string;
}

// DELETE /api/nodes/[slug]/memories/[memoryId]
// Löscht oder "vergisst" Erinnerung
interface ForgetMemoryRequest {
  reason?: 'trauma' | 'time' | 'replaced' | 'manual';
}
```

### 2.2 Skills Management

```typescript
// GET /api/nodes/[slug]/skills
interface SkillsResponse {
  primary: Skill[];
  learning: LearningSkill[];
  conditions: Condition[];
  total_skill_points?: number;
}

// POST /api/nodes/[slug]/skills
interface AddSkillRequest {
  name: string;
  level?: number;
  learned_from?: string; // @slug
  category?: 'combat' | 'social' | 'magic' | 'craft' | 'knowledge';
}

// PUT /api/nodes/[slug]/skills/[skillName]/train
interface TrainSkillRequest {
  progress?: number;
  experience_gained?: string;
  teacher?: string; // @slug
}
```

## 3. UI Components

### 3.1 Memory Display Component

```svelte
<!-- src/lib/components/CharacterMemory.svelte -->
<script lang="ts">
  import { Tabs, TabList, Tab, TabPanel } from '$lib/components/ui/tabs';
  import MemoryItem from './MemoryItem.svelte';
  import MemoryTimeline from './MemoryTimeline.svelte';
  
  export let memories: CharacterMemories;
  export let editable: boolean = false;
  
  let activeTab = 'short';
  let showTimeline = false;
</script>

<div class="memory-container">
  <Tabs>
    <TabList>
      <Tab value="short">
        Kurzzeitgedächtnis ({memories.short_term.length})
      </Tab>
      <Tab value="medium">
        Mittelzeitgedächtnis ({memories.medium_term.length})
      </Tab>
      <Tab value="long">
        Langzeitgedächtnis ({memories.long_term.length})
      </Tab>
    </TabList>
    
    <TabPanel value="short">
      <!-- Zeigt die letzten 1-3 Tage -->
      {#each memories.short_term as memory}
        <MemoryItem {memory} {editable} tier="short" />
      {/each}
    </TabPanel>
    
    <!-- etc... -->
  </Tabs>
  
  <button on:click={() => showTimeline = !showTimeline}>
    Timeline-Ansicht
  </button>
  
  {#if showTimeline}
    <MemoryTimeline {memories} />
  {/if}
</div>
```

### 3.2 Skills Display Component

```svelte
<!-- src/lib/components/CharacterSkills.svelte -->
<script lang="ts">
  import SkillTree from './SkillTree.svelte';
  import SkillProgress from './SkillProgress.svelte';
  
  export let skills: CharacterSkills;
  export let editable: boolean = false;
</script>

<div class="skills-container">
  <div class="primary-skills">
    <h3>Hauptfähigkeiten</h3>
    <SkillTree skills={skills.primary} {editable} />
  </div>
  
  <div class="learning-skills">
    <h3>In Ausbildung</h3>
    {#each skills.learning as skill}
      <SkillProgress {skill} />
    {/each}
  </div>
  
  <div class="conditions">
    <h3>Konditionen & Modifikatoren</h3>
    <!-- Conditions display -->
  </div>
</div>
```

## 4. Memory Processing Logic

### 4.1 Automatische Verarbeitung

```typescript
// src/lib/services/memoryService.ts

export class MemoryService {
  // Wird täglich oder bei Story-Events aufgerufen
  async processMemories(characterSlug: string, currentDate: Date) {
    const character = await getCharacter(characterSlug);
    
    // 1. Age short-term memories
    const agedShortTerm = character.short_term_memory
      .filter(m => daysSince(m.timestamp, currentDate) > 3);
    
    // 2. Compress and move to medium-term
    for (const memory of agedShortTerm) {
      if (memory.importance >= 3) {
        const compressed = this.compressMemory(memory);
        character.medium_term_memory.push(compressed);
      }
      // Remove from short-term
      character.short_term_memory = character.short_term_memory
        .filter(m => m.id !== memory.id);
    }
    
    // 3. Process medium-term memories
    const agedMediumTerm = character.medium_term_memory
      .filter(m => monthsSince(m.timestamp, currentDate) > 3);
    
    // 4. Promote important memories to long-term
    for (const memory of agedMediumTerm) {
      if (memory.importance >= 7 || memory.tags.includes('#trauma')) {
        const permanent = this.createPermanentMemory(memory);
        character.long_term_memory.push(permanent);
      }
      // Remove from medium-term
      character.medium_term_memory = character.medium_term_memory
        .filter(m => m.id !== memory.id);
    }
    
    // 5. Apply memory traits (forgetting, distortion)
    this.applyMemoryTraits(character);
    
    return character;
  }
  
  compressMemory(memory: ShortTermMemory): MediumTermMemory {
    // Komprimierungslogik
    return {
      ...memory,
      content: this.summarize(memory.content),
      original_details: memory.content,
      context: this.extractContext(memory),
      decay_at: addMonths(memory.timestamp, 3)
    };
  }
  
  createPermanentMemory(memory: MediumTermMemory): LongTermMemory {
    return {
      id: generateId(),
      timestamp: memory.timestamp,
      content: this.extractCore(memory),
      emotional_weight: this.calculateEmotionalWeight(memory),
      category: this.categorizeMemory(memory),
      triggers: this.extractTriggers(memory),
      effects: this.determineEffects(memory),
      involved: memory.involved,
      immutable: true
    };
  }
}
```

### 4.2 Story-Integration

```typescript
// src/lib/services/storyMemoryIntegration.ts

export class StoryMemoryIntegration {
  async processStoryEvent(
    storySlug: string, 
    eventText: string,
    involvedCharacters: string[]
  ) {
    // Parse event for memory-worthy content
    const memories = this.extractMemories(eventText);
    
    for (const characterSlug of involvedCharacters) {
      const character = await getCharacter(characterSlug);
      
      for (const memory of memories) {
        // Check if character would remember this
        if (this.wouldRemember(character, memory)) {
          // Add to appropriate tier based on importance
          const tier = this.determineMemoryTier(memory);
          await this.addMemoryToCharacter(character, memory, tier);
        }
      }
    }
  }
  
  extractMemories(text: string): ExtractedMemory[] {
    // Use AI to extract memory-worthy events
    const prompt = `
      Extrahiere erinnerungswürdige Ereignisse aus diesem Text.
      Kategorisiere nach Wichtigkeit (1-10).
      Identifiziere emotionale Gewichtung.
      Erkenne beteiligte Charaktere (@mentions).
    `;
    
    return aiExtract(text, prompt);
  }
}
```

## 5. AI Integration

### 5.1 Memory-Aware Generation

```typescript
// src/lib/ai/memoryAwareGeneration.ts

export async function generateWithMemory(
  character: ContentNode,
  prompt: string,
  context: GenerationContext
) {
  // Sammle relevante Erinnerungen
  const relevantMemories = await findRelevantMemories(
    character,
    context.currentSituation,
    context.involvedCharacters
  );
  
  const memoryContext = `
    === GEDÄCHTNIS DES CHARAKTERS ===
    
    Aktuelle Erinnerungen (letzte Tage):
    ${formatShortTermMemories(character.short_term_memory)}
    
    Relevante vergangene Erfahrungen:
    ${formatRelevantMemories(relevantMemories)}
    
    Prägende Erlebnisse:
    ${formatCoreMemories(character.long_term_memory)}
    
    Vergessene/Verzerrte Details:
    ${formatForgottenAspects(character.memory_traits)}
  `;
  
  return generateText(prompt, memoryContext);
}
```

## 6. Migration Strategy

### Phase 1: Basis-Implementation (Woche 1-2)
1. Datenbankschema erweitern
2. Basic API endpoints
3. Einfache UI-Komponenten
4. Manuelle Memory-Eingabe

### Phase 2: Automation (Woche 3-4)
1. Memory Processing Service
2. Story-Integration
3. Automatische Extraktion
4. Memory Decay System

### Phase 3: AI-Integration (Woche 5-6)
1. Memory-aware Generation
2. Intelligente Memory-Extraktion
3. Emotionale Gewichtung
4. Memory-basierte Reaktionen

### Phase 4: Advanced Features (Woche 7-8)
1. Memory Visualization (Timeline)
2. Memory Conflicts Resolution
3. Skill-Memory Verknüpfung
4. Memory-basierte Quests

## 7. Testing Strategy

### Unit Tests
```typescript
describe('MemoryService', () => {
  test('should age short-term memories after 3 days', () => {
    // Test implementation
  });
  
  test('should compress memories when moving to medium-term', () => {
    // Test implementation
  });
  
  test('should preserve emotional memories in long-term', () => {
    // Test implementation
  });
});
```

### Integration Tests
- Story Event → Memory Creation
- Memory Aging → Tier Transitions
- Memory Traits → Forgetting/Distortion

### User Acceptance Tests
- Kann ein Nutzer Memories manuell hinzufügen?
- Werden Memories korrekt in Stories referenziert?
- Funktioniert die Timeline-Visualisierung?

## 8. Performance Considerations

### Indexing
```sql
-- Indexes für schnelle Memory-Abfragen
CREATE INDEX idx_memory_importance ON content_nodes 
  USING GIN ((content->'short_term_memory'));
  
CREATE INDEX idx_memory_timeline ON content_nodes 
  USING BTREE ((content->'short_term_memory'->0->>'timestamp'));
```

### Caching
- Cache processed memories für 1 Stunde
- Cache memory statistics
- Lazy-load detailed memories

### Limits
- Max 50 short-term memories
- Max 100 medium-term memories  
- Max 200 long-term memories
- Automatische Archivierung älterer Memories

## 9. UI/UX Mockups

### Memory Tab in Character View
```
[Aktuelle Situation] [Erinnerungen] [Fähigkeiten] [Beziehungen]
                          ↑
┌─────────────────────────────────────────────┐
│ 📅 Kurzzeit | 📚 Mittelzeit | 💎 Langzeit   │
├─────────────────────────────────────────────┤
│ Vor 2 Stunden                               │
│ 🗣️ @erik: "Der Baron plant etwas"          │
│ 📍 @taverne 👥 @erik                        │
│ [Wichtig: ⭐⭐⭐] [→ Mittelzeit] [🗑️]       │
│─────────────────────────────────────────────│
│ Gestern                                      │
│ ⚔️ Training mit neuer Schwert-Technik      │
│ 📍 @übungsplatz 👤 Solo                     │
│ [Wichtig: ⭐⭐] [→ Vergessen in 2 Tagen]    │
└─────────────────────────────────────────────┘

[+ Neue Erinnerung] [⚙️ Memories verarbeiten]
```

## 10. Beispiel-Workflows

### Workflow 1: Story erzeugt Memory
1. User schreibt Story-Eintrag
2. System extrahiert Memory-Events
3. Betroffene Charaktere erhalten Memories
4. Memories werden nach Wichtigkeit einsortiert

### Workflow 2: Memory beeinflusst Generation
1. User promptet Charakter-Reaktion
2. System lädt relevante Memories
3. AI generiert unter Berücksichtigung der Memories
4. Output referenziert spezifische Erinnerungen

### Workflow 3: Memory Aging
1. Täglicher Cron-Job / Story-Zeitsprung
2. System prozessiert alle Character-Memories
3. Kurzzeit → Mittelzeit → Langzeit
4. Unwichtiges wird vergessen
5. Notification an User bei wichtigen Übergängen