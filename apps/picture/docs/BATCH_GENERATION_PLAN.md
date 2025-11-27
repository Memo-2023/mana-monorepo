# 🚀 Batch Generation Implementation Plan

## 📋 Übersicht

Implementierung eines Batch Generation Systems, das es Nutzern ermöglicht, mehrere Bilder gleichzeitig mit verschiedenen Prompts oder Variationen zu generieren.

---

## 🎯 Ziele & Requirements

### Funktionale Anforderungen

- **Batch-Größe**: 2-10 Bilder pro Batch
- **Parallel Processing**: Bis zu 3 gleichzeitige Generierungen
- **Queue Management**: FIFO-Queue für wartende Generierungen
- **Progress Tracking**: Echtzeit-Status für jede Generierung
- **Batch Actions**: Alle speichern, alle löschen, alle taggen
- **Fehlerbehandlung**: Einzelne Fehler stoppen nicht den ganzen Batch

### Nicht-Funktionale Anforderungen

- **Performance**: Max. 100ms UI Response Time
- **Skalierbarkeit**: Support für 100+ User gleichzeitig
- **UX**: Intuitive, nicht-blockierende UI
- **Reliability**: Automatic Retry bei Timeouts

---

## 🏗️ Architektur

### 1. Datenbank-Schema (Supabase)

```sql
-- Neue Tabelle: batch_generations
CREATE TABLE batch_generations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT,
  total_count INTEGER NOT NULL,
  completed_count INTEGER DEFAULT 0,
  failed_count INTEGER DEFAULT 0,
  status TEXT CHECK (status IN ('pending', 'processing', 'completed', 'partial', 'failed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,

  -- Shared settings for the batch
  model_id TEXT,
  model_version TEXT,
  width INTEGER,
  height INTEGER,
  steps INTEGER,
  guidance_scale FLOAT,

  CONSTRAINT valid_counts CHECK (
    completed_count >= 0 AND
    failed_count >= 0 AND
    completed_count + failed_count <= total_count
  )
);

-- Erweiterte image_generations Tabelle
ALTER TABLE image_generations ADD COLUMN batch_id UUID REFERENCES batch_generations(id) ON DELETE SET NULL;
ALTER TABLE image_generations ADD COLUMN batch_index INTEGER;
ALTER TABLE image_generations ADD COLUMN retry_count INTEGER DEFAULT 0;
ALTER TABLE image_generations ADD COLUMN priority INTEGER DEFAULT 0;

-- Index für Performance
CREATE INDEX idx_batch_generations_user_status ON batch_generations(user_id, status);
CREATE INDEX idx_image_generations_batch ON image_generations(batch_id, batch_index);

-- Real-time Subscriptions View
CREATE VIEW batch_progress AS
SELECT
  bg.id,
  bg.user_id,
  bg.total_count,
  bg.completed_count,
  bg.failed_count,
  bg.status,
  COUNT(ig.id) FILTER (WHERE ig.status = 'processing') as processing_count,
  ARRAY_AGG(
    json_build_object(
      'id', ig.id,
      'index', ig.batch_index,
      'prompt', ig.prompt,
      'status', ig.status,
      'progress',
        CASE
          WHEN ig.status = 'completed' THEN 100
          WHEN ig.status = 'processing' THEN 50
          WHEN ig.status = 'failed' THEN -1
          ELSE 0
        END
    ) ORDER BY ig.batch_index
  ) as items
FROM batch_generations bg
LEFT JOIN image_generations ig ON ig.batch_id = bg.id
GROUP BY bg.id;
```

### 2. Backend Architecture

#### Edge Function: `batch-generate-images`

```typescript
// Neue Edge Function für Batch Processing
interface BatchRequest {
	prompts: Array<{
		text: string;
		negative_prompt?: string;
		seed?: number;
	}>;
	shared_settings: {
		model_id: string;
		model_version: string;
		width: number;
		height: number;
		steps: number;
		guidance_scale: number;
	};
	batch_name?: string;
}

// Workflow:
// 1. Validate batch size (max 10)
// 2. Create batch_generation record
// 3. Create image_generation records for each prompt
// 4. Queue generations with priority
// 5. Return batch_id for tracking
```

#### Queue Worker System

```typescript
// Background worker (kann als Cron Job oder separate Edge Function laufen)
interface QueueWorker {
	// Polls für neue Jobs alle 5 Sekunden
	pollInterval: 5000;

	// Max parallel Generierungen pro User
	maxParallelPerUser: 3;

	// Global max parallel
	maxParallelGlobal: 20;

	// Retry Logic
	maxRetries: 3;
	retryDelay: [5000, 10000, 30000]; // Exponential backoff
}
```

### 3. Frontend Architecture

#### Neue Komponenten

```typescript
// components/batch/BatchGenerationModal.tsx
interface BatchGenerationModalProps {
	isOpen: boolean;
	onClose: () => void;
	onSubmit: (batch: BatchRequest) => void;
}

// components/batch/BatchPromptInput.tsx
interface BatchPromptInputProps {
	prompts: PromptItem[];
	onChange: (prompts: PromptItem[]) => void;
	maxPrompts: number;
}

// components/batch/BatchProgressTracker.tsx
interface BatchProgressTrackerProps {
	batchId: string;
	onComplete?: () => void;
	onItemClick?: (itemId: string) => void;
}

// components/batch/BatchResultsGrid.tsx
interface BatchResultsGridProps {
	batchId: string;
	results: BatchResult[];
	onSaveAll: () => void;
	onDeleteAll: () => void;
}
```

#### Neuer Store: `batchStore.ts`

```typescript
interface BatchStore {
	// State
	activeBatches: Map<string, BatchGeneration>;
	currentBatch: BatchGeneration | null;

	// Actions
	createBatch: (request: BatchRequest) => Promise<string>;
	subscribeToBatch: (batchId: string) => void;
	unsubscribeFromBatch: (batchId: string) => void;

	// Batch Actions
	saveAllImages: (batchId: string) => Promise<void>;
	deleteAllImages: (batchId: string) => Promise<void>;
	retryFailed: (batchId: string) => Promise<void>;

	// UI State
	isBatchModalOpen: boolean;
	openBatchModal: () => void;
	closeBatchModal: () => void;
}
```

---

## 🎨 UI/UX Design

### User Flow

1. **Initiierung**
   - Button "Batch Generation" in Generate Screen
   - Öffnet Modal/Neue Seite

2. **Prompt-Eingabe**

   ```
   ┌─────────────────────────────────────┐
   │ Batch Generation (3/10)             │
   │                                     │
   │ Shared Settings:                   │
   │ Model: [Flux Schnell ▼]           │
   │ Size: [1:1 ▼]                     │
   │                                     │
   │ Prompts:                           │
   │ 1. [A cyberpunk city at night    ] │
   │ 2. [Abstract colorful painting   ] │
   │ 3. [Portrait of a robot         ] │
   │ + Add Prompt                       │
   │                                     │
   │ □ Variations Mode (same prompt)    │
   │   Seeds: [Random] [+Add Seed]      │
   │                                     │
   │ [Cancel]        [Generate Batch]   │
   └─────────────────────────────────────┘
   ```

3. **Progress Tracking**

   ```
   ┌─────────────────────────────────────┐
   │ Generating Batch "My Batch"         │
   │                                     │
   │ Overall: ████░░░░░░ 40% (2/5)      │
   │                                     │
   │ 1. ✅ Cyberpunk city               │
   │ 2. ✅ Abstract painting            │
   │ 3. ⚡ Robot portrait (50%)         │
   │ 4. ⏳ Waiting...                   │
   │ 5. ⏳ Waiting...                   │
   │                                     │
   │ [Run in Background] [View Results] │
   └─────────────────────────────────────┘
   ```

4. **Results View**
   ```
   ┌─────────────────────────────────────┐
   │ Batch Results (5/5 completed)       │
   │                                     │
   │ [Grid of generated images]         │
   │                                     │
   │ Actions:                           │
   │ [Save All] [Tag All] [Delete All]  │
   │ [Generate Similar] [Export Batch]  │
   └─────────────────────────────────────┘
   ```

### Mobile Responsiveness

- Swipeable prompt cards auf Mobile
- Bottom Sheet für Batch Modal
- Compact Progress View als Notification Bar

---

## 📝 Implementierungsschritte

### Phase 1: Backend Foundation (3 Tage)

- [ ] Datenbank-Schema erstellen und migrieren
- [ ] Batch Edge Function implementieren
- [ ] Queue Worker Logik entwickeln
- [ ] Error Handling & Retry Logic

### Phase 2: Core Frontend (3 Tage)

- [ ] BatchStore mit Zustand implementieren
- [ ] Batch Generation Modal UI
- [ ] Prompt Input Komponenten
- [ ] Real-time Subscriptions Setup

### Phase 3: Progress & Results (2 Tage)

- [ ] Progress Tracker Komponente
- [ ] Real-time Updates via Supabase
- [ ] Results Grid mit Actions
- [ ] Batch Management (Save/Delete All)

### Phase 4: Polish & Edge Cases (2 Tage)

- [ ] Error States & Recovery
- [ ] Loading States & Skeletons
- [ ] Mobile Optimierung
- [ ] Performance Testing
- [ ] Documentation

---

## 🔧 Technische Details

### Parallel Processing Logic

```typescript
// Pseudo-Code für Queue Worker
async function processQueue() {
	// Get active generations per user
	const activeByUser = await getActiveGenerationsGroupedByUser();

	// Find users with capacity
	const usersWithCapacity = activeByUser.filter((u) => u.activeCount < MAX_PARALLEL_PER_USER);

	// Get next pending generations
	const pending = await getNextPendingGenerations({
		limit: MAX_PARALLEL_GLOBAL - currentActiveTotal,
		excludeUsers: usersAtCapacity,
	});

	// Start generations
	for (const gen of pending) {
		startGeneration(gen);
	}
}
```

### Real-time Updates

```typescript
// Frontend Subscription
useEffect(() => {
	const subscription = supabase
		.channel(`batch_${batchId}`)
		.on(
			'postgres_changes',
			{
				event: 'UPDATE',
				schema: 'public',
				table: 'image_generations',
				filter: `batch_id=eq.${batchId}`,
			},
			(payload) => {
				updateBatchProgress(payload.new);
			}
		)
		.subscribe();

	return () => subscription.unsubscribe();
}, [batchId]);
```

### Error Recovery

```typescript
// Automatic Retry mit Exponential Backoff
async function retryGeneration(genId: string, attempt: number) {
	const delays = [5000, 15000, 30000];
	const delay = delays[Math.min(attempt, delays.length - 1)];

	await wait(delay);

	try {
		await generateImage(genId);
	} catch (error) {
		if (attempt < MAX_RETRIES - 1) {
			await retryGeneration(genId, attempt + 1);
		} else {
			await markAsFailed(genId, error);
		}
	}
}
```

---

## 📊 Success Metrics

### Performance KPIs

- **Queue Processing Time**: < 10s für Start der ersten Generierung
- **Parallel Efficiency**: 80%+ GPU Utilization
- **Error Rate**: < 5% Failed Generations
- **User Wait Time**: < 2min für 5-Bilder Batch

### User Experience KPIs

- **Adoption Rate**: 30% der aktiven User nutzen Batch
- **Completion Rate**: 90% der gestarteten Batches werden komplett
- **Satisfaction**: 4.5+ Stars für Feature

---

## 🚨 Risiken & Mitigationen

### Risiko 1: API Rate Limits

**Mitigation**:

- Intelligentes Queue Management
- User-basierte Rate Limits
- Fallback auf sequentielle Verarbeitung

### Risiko 2: Kosten-Explosion

**Mitigation**:

- Credits-System parallel implementieren
- Batch-Limits pro User/Tag
- Cost Alerts & Monitoring

### Risiko 3: UI Complexity

**Mitigation**:

- Progressive Disclosure (Simple/Advanced Mode)
- Gute Defaults
- In-App Tutorial

---

## 🎯 MVP Scope (für erste Version)

### Included ✅

- Basis Batch Generation (bis 5 Bilder)
- Einfache Progress Anzeige
- Save All / Delete All Actions
- Desktop & Mobile UI

### Excluded ❌ (für später)

- Variations Mode
- Custom Seeds pro Prompt
- Batch Templates
- Export als ZIP
- Batch Scheduling

---

## 📅 Timeline

**Woche 1**:

- Mo-Mi: Backend Implementation
- Do-Fr: Core Frontend

**Woche 2**:

- Mo-Di: Progress & Results UI
- Mi-Do: Testing & Bug Fixes
- Fr: Documentation & Release

**Total: 10 Arbeitstage**

---

_Erstellt: Januar 2025_
