# Token-Erfassung und Kostenabrechnung

Dieses Dokument beschreibt das System zur Erfassung und Abrechnung von Token-Nutzung in der Chat-Anwendung.

## Übersicht

Die Anwendung verfolgt die Nutzung von LLM-Tokens (Large Language Models) und berechnet daraus die entstehenden Kosten. Dies ermöglicht:

- Transparenz über die Ressourcennutzung
- Kostenerfassung pro Benutzer, Konversation und Modell
- Analysen zur Optimierung der Anwendung
- Grundlage für nutzungsbasierte Abrechnungsmodelle

## Datenbank-Schema

### Die `usage_logs` Tabelle

Speichert Informationen über jeden LLM-API-Aufruf:

```sql
CREATE TABLE public.usage_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  message_id UUID REFERENCES messages(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  model_id UUID REFERENCES models(id),
  prompt_tokens INTEGER NOT NULL,
  completion_tokens INTEGER NOT NULL,
  total_tokens INTEGER NOT NULL,
  estimated_cost DECIMAL(10, 6) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Modell-Kosteninformationen

Die `models`-Tabelle wurde um ein `cost_settings`-Feld erweitert, das die Kosten pro Token für jedes Modell enthält:

```sql
ALTER TABLE public.models ADD COLUMN cost_settings JSONB DEFAULT '{"prompt_per_1k_tokens": 0.0001, "completion_per_1k_tokens": 0.0002}'::jsonb;
```

Beispiel für `cost_settings`:

```json
{
	"prompt_per_1k_tokens": 0.003, // Kosten pro 1000 Prompt-Tokens in Dollar
	"completion_per_1k_tokens": 0.006 // Kosten pro 1000 Completion-Tokens in Dollar
}
```

## Implementierung

### Erfassung der Token-Nutzung

1. **API-Aufruf**:
   - Jeder Aufruf eines LLM-Modells über `services/openai.ts` gibt Token-Nutzungsinformationen zurück
   - Diese werden aus der API-Antwort in `utils/api.ts` extrahiert

2. **Speicherung**:
   - Die Funktion `logTokenUsage` in `services/openai.ts` speichert die Token-Nutzung in der Datenbank
   - Sie berechnet auch die geschätzten Kosten basierend auf den Modellpreisen

```typescript
export async function logTokenUsage(
	usage: TokenUsage,
	conversationId: string,
	messageId: string,
	userId: string,
	modelId: string
): Promise<void>;
```

3. **Kostenberechnung**:
   - Die Funktion `calculateTokenCost` in `services/openai.ts` berechnet die Kosten pro Anfrage
   - Sie berücksichtigt unterschiedliche Preise für Prompt- und Completion-Tokens

```typescript
export async function calculateTokenCost(
	promptTokens: number,
	completionTokens: number,
	modelId: string
): Promise<number>;
```

### Abfrage und Analyse

Die folgenden SQL-Funktionen sind für die Abfrage der Token-Nutzung verfügbar:

1. **Nutzung nach Modell**:

   ```sql
   SELECT * FROM get_user_model_usage(user_id);
   ```

   - Gibt die Summe der Token und Kosten pro Modell für einen Benutzer zurück

2. **Nutzung nach Zeitraum**:

   ```sql
   SELECT * FROM get_user_usage_by_period(user_id, 'day');
   ```

   - Akzeptiert 'day', 'month' oder 'year' als Zeitraum
   - Gibt die Summe der Token und Kosten pro Zeiteinheit zurück

3. **Nutzung pro Konversation**:

   ```sql
   SELECT * FROM get_conversation_usage(conversation_id);
   ```

   - Gibt die Token-Nutzung für jede Nachricht in einer Konversation zurück

## API-Endpunkte

Die API-Endpunkte für den Zugriff auf die Token-Nutzungsdaten sind:

1. **GET /api/usage**
   - Parameter: `userId` (erforderlich), `period` (optional, Standard: 'month')
   - Gibt die Token-Nutzung eines Benutzers zurück (nach Modell und Zeitraum)

2. **GET /api/usage/conversation**
   - Parameter: `conversationId` (erforderlich)
   - Gibt die Token-Nutzung für eine bestimmte Konversation zurück

## Modellpreise (Standardwerte)

Die Standardpreise für verschiedene Modelle sind:

| Modell      | Prompt-Tokens (pro 1K) | Completion-Tokens (pro 1K) |
| ----------- | ---------------------- | -------------------------- |
| GPT-O3-Mini | $0.0001                | $0.0002                    |
| GPT-4o-mini | $0.0001                | $0.0002                    |
| GPT-4o      | $0.003                 | $0.006                     |
| GPT-4       | $0.003                 | $0.006                     |
| GPT-3.5     | $0.0001                | $0.0002                    |
| Claude      | $0.0008                | $0.0024                    |

## Verwendungsbeispiele

### Token-Nutzung im Code

```typescript
// Beispiel: Abfrage der Token-Nutzung eines Benutzers
const { data } = await supabase.rpc('get_user_model_usage', { user_id: userId });
console.log('Token-Nutzung nach Modell:', data);

// Beispiel: Abfrage der Token-Nutzung nach Monat
const { data } = await supabase.rpc('get_user_usage_by_period', {
	user_id: userId,
	period: 'month',
});
console.log('Monatliche Token-Nutzung:', data);
```

### Anzeige in der Benutzeroberfläche

Die Token-Nutzungsdaten können in der Benutzeroberfläche auf verschiedene Weise angezeigt werden:

1. **Nutzungsübersicht auf der Profilseite**:
   - Gesamtkosten und Token-Nutzung
   - Aufschlüsselung nach Modellen

2. **Detaillierte Nutzungsstatistiken**:
   - Diagramme zur Visualisierung der Nutzung über die Zeit
   - Vergleich der Nutzung verschiedener Modelle

3. **Konversationsdetails**:
   - Anzeige der Token-Nutzung pro Konversation
   - Kosten einzelner Nachrichten

## Hinweise zur Erweiterung

### Limits und Warnungen

Das System kann um folgende Funktionen erweitert werden:

- Nutzungslimits pro Benutzer oder Organisation
- Warnungen, wenn bestimmte Kostenschwellen überschritten werden
- Automatische Deaktivierung teurer Modelle bei Erreichen bestimmter Limits

### Export und Berichte

Die Token-Nutzungsdaten können für Berichte exportiert werden:

- Monatliche Kostenabrechnungen pro Benutzer
- Exportformate: CSV, PDF, JSON
- Automatisierte Berichterstellung

### Integration mit Abrechnungssystemen

Die Token-Nutzungsdaten können in Abrechnungssysteme integriert werden:

- Berechnung von Kosten für verschiedene Benutzer oder Teams
- Integration mit Stripe oder anderen Zahlungsabwicklern
- Implementierung von unterschiedlichen Preismodellen (Flatrate, Pay-per-Use, etc.)
