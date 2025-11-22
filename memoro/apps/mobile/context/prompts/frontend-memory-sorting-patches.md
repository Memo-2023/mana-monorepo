# Frontend Patches für Memory Sorting

## Dateien die angepasst werden müssen:

### 1. `/features/memos/hooks/useMemoState.ts`

**Aktuelle Zeile 281:**
```typescript
.order('created_at', { ascending: false })
```

**Ändern zu:**
```typescript
.order('sort_order', { ascending: true })
.order('created_at', { ascending: false })
```

### 2. `/features/memos/hooks/useOptimizedMemoData.ts`

**Aktuelle Zeile 95:**
```typescript
.order('created_at', { ascending: false })
```

**Ändern zu:**
```typescript
.order('sort_order', { ascending: true })
.order('created_at', { ascending: false })
```

### 3. `/app/(protected)/(memo)/actions/memoActions.ts`

**Aktuelle Zeile 468:**
```typescript
.eq('memo_id', memoId)
.order('created_at', { ascending: false });
```

**Ändern zu:**
```typescript
.eq('memo_id', memoId)
.order('sort_order', { ascending: true })
.order('created_at', { ascending: false });
```

### 4. `/app/(protected)/memories.tsx`

**Aktuelle Zeile 157:**
```typescript
.order('created_at', { ascending: false });
```

**Ändern zu:**
```typescript
.order('sort_order', { ascending: true })
.order('created_at', { ascending: false });
```

### 5. `/app/(protected)/(tabs)/index.tsx`

**Aktuelle Zeile 999:**
```typescript
.eq('memo_id', memo.id)
.order('created_at', { ascending: false });
```

**Ändern zu:**
```typescript
.eq('memo_id', memo.id)
.order('sort_order', { ascending: true })
.order('created_at', { ascending: false });
```

### 6. `/app/(protected)/(tabs)/memos.tsx`

**Aktuelle Zeile 603:**
```typescript
.eq('memo_id', memo.id)
.order('created_at', { ascending: false });
```

**Ändern zu:**
```typescript
.eq('memo_id', memo.id)
.order('sort_order', { ascending: true })
.order('created_at', { ascending: false });
```

### 7. `/components/molecules/MemoList.tsx`

**Aktuelle Zeile 550:**
```typescript
.eq('memo_id', memo.id)
.order('created_at', { ascending: false });
```

**Ändern zu:**
```typescript
.eq('memo_id', memo.id)
.order('sort_order', { ascending: true })
.order('created_at', { ascending: false });
```

### 8. `/components/molecules/MemoPreview.tsx`

**Aktuelle Zeile 306:**
```typescript
.eq('memo_id', memo.id)
.order('created_at', { ascending: false });
```

**Ändern zu:**
```typescript
.eq('memo_id', memo.id)
.order('sort_order', { ascending: true })
.order('created_at', { ascending: false });
```

## Erklärung der Änderung:

Die doppelte Sortierung funktioniert so:
1. **Primär nach `sort_order` (aufsteigend)**: Memories mit niedrigerer sort_order erscheinen zuerst
2. **Sekundär nach `created_at` (absteigend)**: Falls mehrere Memories die gleiche sort_order haben (z.B. 999 für alte/manuelle Memories), werden sie nach Erstellungsdatum sortiert

## Testing:

Nach den Änderungen sollte getestet werden:
1. ✅ Neue Memo-Aufnahme mit Standard Blueprint
2. ✅ Überprüfen ob Reihenfolge stimmt:
   - Kurzzusammenfassung (sort_order: 1) - OBEN
   - Aufgaben (sort_order: 2) - MITTE
   - Ausführliche Zusammenfassung (sort_order: 3) - UNTEN
3. ✅ Alte Memories ohne sort_order sollten weiterhin funktionieren