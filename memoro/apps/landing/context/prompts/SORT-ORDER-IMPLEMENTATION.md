# Sort Order Implementation für Blueprint Prompts

## Übersicht
Diese Dokumentation beschreibt die Implementierung der `sort_order` Funktionalität für die Reihenfolge von Memories, die durch Blueprints generiert werden.

## Problem
Die Memories wurden in zufälliger oder unerwünschter Reihenfolge angezeigt. Die Kurzzusammenfassung erschien als letztes, obwohl sie als Übersicht an erster Stelle stehen sollte.

## Lösung
Hinzufügen einer `sort_order` Spalte zur `prompt_blueprints` Tabelle, die explizit die Anzeigereihenfolge der generierten Memories steuert.

## Technische Details

### Neue Spalte
```sql
ALTER TABLE prompt_blueprints 
ADD COLUMN sort_order INTEGER DEFAULT 999;
```

- **Typ**: INTEGER
- **Default**: 999 (für nicht explizit sortierte Einträge)
- **Logik**: Niedrigere Zahlen werden zuerst angezeigt

### Standard Blueprint Sortierung

| Position | Memory Typ | sort_order | Begründung |
|----------|------------|------------|------------|
| 1 | Kurzzusammenfassung | 1 | Schneller Überblick für den Nutzer |
| 2 | Aufgaben | 2 | Konkrete Action Items |
| 3 | Ausführliche Zusammenfassung | 3 | Detaillierte Informationen bei Bedarf |

## Backend Implementierung

### Query für Memory-Generierung
```sql
SELECT pb.prompt_id, p.prompt_text, p.memory_title
FROM prompt_blueprints pb
JOIN prompts p ON pb.prompt_id = p.id
WHERE pb.blueprint_id = $1
ORDER BY pb.sort_order ASC;
```

### Edge Function Anpassung
Die Edge Functions müssen die Memories in der durch `sort_order` definierten Reihenfolge zurückgeben:

```javascript
// In der blueprint Edge Function
const promptsQuery = await supabaseClient
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
  .eq('blueprint_id', blueprintId)
  .order('sort_order', { ascending: true });
```

## Frontend Implementierung

### Memory Display Component
```typescript
// Die Memories sollten bereits in der richtigen Reihenfolge vom Backend kommen
// Falls nicht, kann im Frontend nachsortiert werden:

const sortedMemories = memories.sort((a, b) => {
  // Nutze sort_order falls vorhanden
  if (a.sort_order && b.sort_order) {
    return a.sort_order - b.sort_order;
  }
  // Fallback auf created_at
  return new Date(a.created_at) - new Date(b.created_at);
});
```

## Migration für bestehende Daten

Alle bestehenden Blueprint-Prompt Verknüpfungen erhalten automatisch `sort_order = 999`. Die wichtigsten Blueprints wurden explizit gesetzt:

- **Standard-Analyse**: Sortierung 1-2-3
- **Meeting-Analyse**: Sortierung 1-2-3
- **Feedback**: Sortierung 1-2-3

## Vorteile dieser Lösung

1. **Explizite Kontrolle**: Vollständige Kontrolle über die Anzeigereihenfolge
2. **Flexibilität**: Jeder Blueprint kann seine eigene Sortierung haben
3. **Erweiterbarkeit**: Neue Prompts können einfach eingeordnet werden
4. **Performance**: Index auf (blueprint_id, sort_order) für schnelle Queries
5. **Rückwärtskompatibilität**: Default-Wert 999 für nicht explizit sortierte Einträge

## Testing

Nach der Migration sollte getestet werden:

1. ✅ Neue Memo-Aufnahme mit Standard Blueprint erstellen
2. ✅ Überprüfen ob Kurzzusammenfassung oben erscheint
3. ✅ Überprüfen ob Reihenfolge konsistent bleibt
4. ✅ Andere Blueprints testen (Meeting, Feedback)

## Zukünftige Erweiterungen

- UI für Blueprint-Editor könnte Drag & Drop für Sortierung bieten
- Nutzer-spezifische Sortierung pro Blueprint möglich
- Conditional Sorting basierend auf Memo-Typ oder -Länge