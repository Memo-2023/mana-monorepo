# Edge Functions Update für sort_order

## Betroffene Edge Functions:

Die folgenden Edge Functions müssen angepasst werden, um die `sort_order` aus der `prompt_blueprints` Tabelle an die neu erstellten Memories zu übergeben:

### 1. `/supabase/functions/blueprint/index.ts`

**Aktuelle Implementation (ca. Zeile 410):**
```typescript
const { data: newMemory, error: newMemoryError } = await memoro_sb.from('memories').insert({
  memo_id: memo_id,
  title: memoryTitle || 'Blueprint-Antwort',
  content: answer,
  metadata: { ... }
}).select().single();
```

**Neue Implementation:**
```typescript
// Zuerst die sort_order aus prompt_blueprints holen
const { data: promptBlueprint } = await memoro_sb
  .from('prompt_blueprints')
  .select('sort_order')
  .eq('blueprint_id', blueprint_id)
  .eq('prompt_id', prompt.id)
  .single();

const { data: newMemory, error: newMemoryError } = await memoro_sb.from('memories').insert({
  memo_id: memo_id,
  title: memoryTitle || 'Blueprint-Antwort',
  content: answer,
  sort_order: promptBlueprint?.sort_order || 999, // Neue Zeile!
  metadata: { ... }
}).select().single();
```

### 2. `/supabase/functions/auto-blueprint/index.ts`

**Ähnliche Anpassung bei Zeile 479:**
```typescript
const { data: newMemory, error: newMemoryError } = await memoro_sb.from('memories').insert({
  memo_id: memo_id,
  title: memoryTitle || 'Auto-Blueprint-Antwort',
  content: answer,
  sort_order: promptBlueprint?.sort_order || 999, // Neue Zeile!
  metadata: { ... }
}).select().single();
```

### 3. Andere Edge Functions (ohne Blueprint)

Für Edge Functions die Memories ohne Blueprint erstellen, sollte ein sinnvoller Default-Wert gesetzt werden:

#### `/supabase/functions/create-memory/index.ts`
```typescript
const { data: newMemory, error: newMemoryError } = await memoro_sb.from('memories').insert({
  memo_id: memo_id,
  title: memoryTitle || 'Memory',
  content: answer,
  sort_order: 100, // Default für manuelle Memories
  metadata: { ... }
}).select().single();
```

#### `/supabase/functions/question-memo/index.ts`
```typescript
const { data: newMemory, error: newMemoryError } = await memoro_sb.from('memories').insert({
  memo_id: memo_id,
  title: `Frage: ${question.substring(0, 50)}...`,
  content: answer,
  sort_order: 200, // Fragen erscheinen nach Blueprint-Memories
  metadata: { ... }
}).select().single();
```

#### `/supabase/functions/combine-memos/index.ts`
```typescript
const { error: memoryError } = await memoro_sb
  .from('memories')
  .insert({
    ...memoryData,
    sort_order: 300 // Kombinierte Memos erscheinen am Ende
  });
```

#### `/supabase/functions/translate/index.ts`
```typescript
const { error: memoryCreateError } = await memoro_sb.from('memories').insert({
  memo_id: newMemoId,
  title: translatedTitle,
  content: translatedContent,
  sort_order: memory.sort_order || 999, // Behalte sort_order vom Original
  metadata: { ... }
});
```

## Optimierte Blueprint Function Implementation

Für bessere Performance sollten die Prompts mit ihrer sort_order gleich am Anfang geladen werden:

```typescript
// In blueprint/index.ts und auto-blueprint/index.ts

// Lade alle Prompts mit sort_order für diesen Blueprint
const { data: blueprintPrompts, error: blueprintPromptsError } = await memoro_sb
  .from('prompt_blueprints')
  .select(`
    prompt_id,
    sort_order,
    prompts!inner(
      id,
      prompt_text,
      memory_title
    )
  `)
  .eq('blueprint_id', blueprint_id)
  .order('sort_order', { ascending: true });

// Dann beim Erstellen der Memories:
for (const blueprintPrompt of blueprintPrompts) {
  // ... AI Processing ...
  
  const { data: newMemory, error: newMemoryError } = await memoro_sb.from('memories').insert({
    memo_id: memo_id,
    title: memoryTitle,
    content: answer,
    sort_order: blueprintPrompt.sort_order,
    metadata: { ... }
  }).select().single();
}
```

## Sort Order Konvention:

| Bereich | sort_order | Verwendung |
|---------|------------|------------|
| 1-99 | Blueprint Memories | Hauptanalysen (Zusammenfassung, Aufgaben, etc.) |
| 100-199 | Manuelle Memories | Vom Nutzer erstellte Memories |
| 200-299 | Frage-Antwort | Memories aus Fragen an Memos |
| 300-399 | Kombinierte Memos | Aus mehreren Memos generiert |
| 999 | Default | Fallback für nicht kategorisierte Memories |

## Testing nach Implementation:

1. Neue Aufnahme mit Standard Blueprint erstellen
2. Prüfen ob Memories in richtiger Reihenfolge erscheinen
3. Manuelle Memory hinzufügen - sollte nach Blueprint-Memories erscheinen
4. Frage an Memo stellen - sollte nach manuellen Memories erscheinen