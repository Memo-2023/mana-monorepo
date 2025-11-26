# 🎯 Multi-Image Generation Plan

## 📋 Übersicht
Ermöglicht es Nutzern, mehrere Bilder mit demselben Prompt zu generieren - ideal für Variationen und das Finden des perfekten Ergebnisses.

---

## 🎨 Feature-Beschreibung

### Was es macht
- **Gleicher Prompt, mehrere Outputs**: 1-5 Bilder mit einem Klick
- **Verschiedene Seeds**: Jedes Bild bekommt einen anderen Random Seed für Variation
- **Batch-Integration**: Nutzt das existierende Batch System
- **Quick Access**: Verfügbar in Generate Page und QuickGenerateBar

### Use Cases
1. **Variations Explorer**: "Zeig mir 4 verschiedene Versionen dieses Prompts"
2. **Best Shot Finder**: "Generiere 3 Bilder und ich wähle das Beste"
3. **Time Saver**: Einmal Setup, mehrere Ergebnisse
4. **A/B Testing**: Verschiedene Interpretationen desselben Prompts

---

## 🏗️ Technische Architektur

### 1. Backend-Anpassungen

#### Option A: Erweitere bestehende Functions (EMPFOHLEN)
```typescript
// In generate-image function
interface GenerateRequest {
  prompt: string;
  count?: number; // NEU: 1-5, default 1
  // ... andere Parameter
}

// Wenn count > 1: Automatisch Batch erstellen
if (request.count > 1) {
  // Create batch with same prompt, different seeds
  const prompts = Array(request.count).fill(null).map((_, i) => ({
    text: request.prompt,
    negative_prompt: request.negative_prompt,
    seed: Math.floor(Math.random() * 1000000) + i
  }));
  
  // Call batch-generate
  return createBatch(prompts, settings);
}
```

#### Option B: Dedicated Multi-Generate Function
```typescript
// Neue Edge Function: multi-generate
// Wrapper um batch-generate mit optimiertem Flow
```

### 2. Datenbank-Anpassungen

```sql
-- Erweitere image_generations für Multi-Tracking
ALTER TABLE image_generations 
ADD COLUMN IF NOT EXISTS multi_group_id UUID,
ADD COLUMN IF NOT EXISTS multi_index INTEGER;

-- Index für grouped queries
CREATE INDEX IF NOT EXISTS idx_image_generations_multi_group 
ON image_generations(multi_group_id, multi_index);

-- View für Multi-Generation Groups
CREATE VIEW multi_generation_groups AS
SELECT 
  multi_group_id,
  prompt,
  COUNT(*) as total_count,
  COUNT(*) FILTER (WHERE status = 'completed') as completed_count,
  MIN(created_at) as created_at,
  MAX(completed_at) as completed_at,
  ARRAY_AGG(id ORDER BY multi_index) as image_ids
FROM image_generations
WHERE multi_group_id IS NOT NULL
GROUP BY multi_group_id, prompt;
```

### 3. Frontend Components

#### A. Image Count Selector Component
```typescript
// components/ImageCountSelector.tsx
interface ImageCountSelectorProps {
  value: number;
  onChange: (count: number) => void;
  max?: number;
  disabled?: boolean;
}

// Visual Design:
// [1] [2] [3] [4] [5]  <- Pills/Buttons
// oder
// [-] 3 [+]  <- Counter Style
```

#### B. Multi-Generation Progress
```typescript
// components/MultiGenerationProgress.tsx
// Zeigt Progress für alle Images in der Gruppe
// Grid-Layout mit Live-Updates
```

---

## 🎨 UI/UX Design

### 1. Generate Page Integration

```
┌─────────────────────────────────────┐
│ Neues Bild generieren               │
│                                     │
│ Prompt: [........................] │
│                                     │
│ 🎲 Anzahl Varianten                │
│ [1] [2] [3] [4] [5]                │
│ ℹ️ Erstelle mehrere Versionen       │
│                                     │
│ Model: [...]                        │
│ Size: [...]                         │
│                                     │
│ [Generate 3 Images]                 │
└─────────────────────────────────────┘
```

### 2. QuickGenerateBar Enhancement

```
┌─────────────────────────────────────┐
│ 💡 [Prompt eingeben...]              │
│                                     │
│ Varianten: [1] [2] [3] [4] [5]     │
│           oder                      │
│ Varianten: [-] 2 [+] [Generate]    │
└─────────────────────────────────────┘
```

### 3. Progress Display

```
┌─────────────────────────────────────┐
│ Generiere 4 Varianten               │
│                                     │
│ ┌────┐ ┌────┐ ┌────┐ ┌────┐       │
│ │ ✅ │ │ ⚡ │ │ ⏳ │ │ ⏳ │       │
│ └────┘ └────┘ └────┘ └────┘       │
│  1/4    2/4    3/4    4/4          │
│                                     │
│ Gesamt: ████░░░░░░ 25%             │
└─────────────────────────────────────┘
```

### 4. Results Gallery

```
┌─────────────────────────────────────┐
│ 4 Varianten generiert ✨            │
│                                     │
│ [Image][Image][Image][Image]       │
│                                     │
│ Actions:                            │
│ [Save All] [Save Selected]         │
│ [Favorite] [Generate More]         │
└─────────────────────────────────────┘
```

---

## 📝 Implementierungsschritte

### Phase 1: Backend (1 Tag)
- [ ] Erweitere generate-image function um `count` parameter
- [ ] Update batch-generate für optimierten Multi-Flow
- [ ] Datenbank-Migration für multi_group tracking
- [ ] Rate Limit Anpassung für Multi-Generation

### Phase 2: UI Components (1 Tag)
- [ ] ImageCountSelector Component
- [ ] Integration in Generate Page
- [ ] Integration in QuickGenerateBar
- [ ] Multi-Generation Progress Component

### Phase 3: Flow Integration (1 Tag)
- [ ] Hook: useMultiGeneration
- [ ] Store updates für Multi-Tracking
- [ ] Results Gallery für Multi-Groups
- [ ] Error Handling für partial failures

### Phase 4: Polish (0.5 Tag)
- [ ] Loading States
- [ ] Success Animations
- [ ] Mobile Optimization
- [ ] Testing & Bug Fixes

---

## 🔧 Implementation Details

### 1. Generate Page Changes
```typescript
// app/(tabs)/generate.tsx
const [imageCount, setImageCount] = useState(1);

const handleGenerate = async () => {
  if (imageCount > 1) {
    // Use batch generation
    const prompts = Array(imageCount).fill(null).map(() => ({
      text: prompt,
      negative_prompt: negativePrompt,
      // Random seeds for variation
      seed: Math.floor(Math.random() * 1000000)
    }));
    
    await createBatch(prompts, settings);
  } else {
    // Single generation as before
    await generateImage(...);
  }
};
```

### 2. QuickGenerateBar Changes
```typescript
// components/QuickGenerateBar.tsx
const [quickCount, setQuickCount] = useState(1);

// Add counter UI
<View className="flex-row items-center">
  <Text>Varianten:</Text>
  <Pressable onPress={() => setQuickCount(Math.max(1, quickCount - 1))}>
    <Ionicons name="remove-circle" />
  </Pressable>
  <Text>{quickCount}</Text>
  <Pressable onPress={() => setQuickCount(Math.min(5, quickCount + 1))}>
    <Ionicons name="add-circle" />
  </Pressable>
</View>
```

### 3. Store Updates
```typescript
// store/multiGenerationStore.ts
interface MultiGenerationStore {
  activeGroups: Map<string, MultiGroup>;
  
  createMultiGeneration: (
    prompt: string, 
    count: number,
    settings: Settings
  ) => Promise<string>;
  
  trackMultiProgress: (groupId: string) => void;
}
```

---

## 🎯 Konfiguration & Limits

### Default Settings
```typescript
const MULTI_GENERATION_CONFIG = {
  MIN_COUNT: 1,
  MAX_COUNT: 5,
  DEFAULT_COUNT: 1,
  
  // UI Settings
  SHOW_IN_QUICK_BAR: true,
  SHOW_IN_GENERATE: true,
  
  // Behavior
  AUTO_GROUP_RESULTS: true,
  PARALLEL_PROCESSING: true,
  
  // Limits (zusätzlich zu Rate Limits)
  MAX_MULTI_PER_HOUR: 10, // Max 10 Multi-Generations pro Stunde
};
```

### Rate Limit Considerations
- Multi-Generation zählt als N einzelne Generierungen
- Spezielle Limits für Multi-Generation möglich
- Boost für Premium Users

---

## 📊 Success Metrics

### KPIs
- **Adoption Rate**: % User die Multi-Gen nutzen
- **Average Count**: Durchschnittliche Anzahl pro Multi-Gen
- **Selection Rate**: Wie viele der generierten Bilder werden gespeichert
- **Time Savings**: Zeit gespart vs. einzelne Generierungen

### User Feedback Points
- Ist die UI intuitiv?
- Ist die maximale Anzahl (5) ausreichend?
- Soll es Presets geben (z.B. "Quick 3")?

---

## 🚀 Future Enhancements

### V2 Features
1. **Smart Variations**: Leichte Prompt-Variationen automatisch
2. **Comparison View**: Side-by-side Vergleich
3. **Auto-Select Best**: AI wählt das "beste" Bild
4. **Variation Templates**: Vordefinierte Variation-Sets
5. **Progressive Generation**: Erst 2, dann basierend auf Favorit weitere

### V3 Ideas
- **Variation Tree**: Branching von Favoriten
- **Style Matrix**: Grid mit Style x Subject Variationen
- **Batch Templates**: Gespeicherte Multi-Gen Setups

---

## ⚠️ Edge Cases & Considerations

### Error Handling
- Was wenn 3 von 5 fehlschlagen?
- Partial Success UI
- Retry nur für failed

### Performance
- Max 5 parallel to avoid overload
- Staggered starts (1s delay)
- Progress Updates batched

### UX Considerations
- Clear cost indication (5 images = 5 credits)
- Warning bei high count + large size
- Option to cancel remaining

---

## 📅 Timeline

**Tag 1**: Backend implementation
**Tag 2**: Frontend components  
**Tag 3**: Integration & Testing
**Tag 4**: Polish & Release

**Total: 3.5 Tage**

---

*Erstellt: Januar 2025*