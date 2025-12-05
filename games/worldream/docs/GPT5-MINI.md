# GPT-5-mini Dokumentation

## Übersicht

GPT-5-mini ist eines der drei GPT-5 Modelle von OpenAI (neben GPT-5 und GPT-5-nano). Es bietet einen optimalen Kompromiss zwischen Leistung und Kosten.

## Verfügbarkeit

- **API**: Verfügbar über OpenAI API
- **Rollout**: Verfügbar für alle API-Nutzer
- **Azure**: Verfügbar ohne Registrierung (im Gegensatz zu GPT-5 standard)

## Modell-Spezifikationen

### Preise

- **Input**: $0.25 pro 1M Tokens
- **Output**: $2.00 pro 1M Tokens
- (Zum Vergleich: GPT-5 standard kostet $1.25/$10, GPT-5-nano kostet $0.05/$0.40)

### Knowledge Cutoff

- **GPT-5-mini**: Mai 30, 2024
- **GPT-5 standard**: September 30, 2024

### Unterstützte Features

- ✅ Chat Completions API
- ✅ Response Format (JSON mode)
- ✅ Streaming
- ✅ Custom Tools
- ✅ `reasoning_effort` Parameter
- ✅ `verbosity` Parameter
- ✅ Vision Capabilities (Bildanalyse)

## ⚠️ WICHTIGE EINSCHRÄNKUNGEN

### Temperature

- **NUR temperature: 1.0 wird unterstützt!**
- Andere Werte (0.7, 0.8, etc.) führen zu einem 400 Error
- Der Parameter kann weggelassen werden (1.0 ist default)

### Token Limits

- Verwendet `max_completion_tokens` NICHT `max_tokens`
- `max_tokens` führt zu einem 400 Error

## Verwendung in Worldream

### Standard-Generierung

```typescript
const completion = await openai.chat.completions.create({
	model: 'gpt-5-mini',
	messages: [
		{ role: 'system', content: systemPrompt },
		{ role: 'user', content: userPrompt }
	],
	// temperature: 1 ist default - KEINE anderen Werte möglich!
	response_format: { type: 'json_object' },
	max_completion_tokens: 1000 // NICHT max_tokens!
});
```

### Mit Streaming

```typescript
const stream = await openai.chat.completions.create({
  model: 'gpt-5-mini',
  messages: [...],
  stream: true,
  max_completion_tokens: 1000  // WICHTIG: max_completion_tokens statt max_tokens!
})

for await (const chunk of stream) {
  const content = chunk.choices[0]?.delta?.content || ''
  // Process chunk
}
```

## Optimierungen für Worldream

### 1. Zweistufige Generierung für Welten

- **Stufe 1**: Basis-Info (title, summary, appearance, lore)
- **Stufe 2**: Details (glossary, timeline, canon facts)
- Reduziert die Wartezeit erheblich

### 2. Temperature

- **NUR 1.0**: Einziger unterstützter Wert für GPT-5-mini
- Keine Anpassung möglich - immer maximale Kreativität
- Parameter kann weggelassen werden

### 3. Max Completion Tokens Limits

- **Parameter**: `max_completion_tokens` (NICHT `max_tokens`!)
- **Basis-Generierung**: 1000 tokens
- **Detail-Generierung**: 800 tokens
- Verhindert zu lange Wartezeiten

### 4. Streaming für bessere UX

- Nutzer sieht sofort Fortschritt
- Besseres Feedback während Generierung
- Strukturiertes Text-Format statt JSON für Streaming

## Best Practices

1. **API-Parameter korrekt setzen**
   - Temperature weglassen (default 1.0)
   - `max_completion_tokens` statt `max_tokens`
   - Keine unsupported Parameter verwenden

2. **Kurze, präzise System-Prompts**
   - Weniger ist mehr
   - Klare Struktur vorgeben

3. **Strukturierte Ausgabe**
   - JSON für finale Daten
   - Strukturierter Text für Streaming

4. **Kontext-Management**
   - Nur relevante Informationen übergeben
   - Welt-Kontext bei Bedarf einbeziehen

5. **Error Handling**
   - Fallback bei Parse-Fehlern
   - Retry-Logic bei API-Fehlern
   - 400 Errors bei falschen Parametern abfangen

## Vergleich zu anderen Modellen

| Feature         | GPT-5-nano     | GPT-5-mini       | GPT-5            |
| --------------- | -------------- | ---------------- | ---------------- |
| Preis Input     | $0.05/1M       | $0.25/1M         | $1.25/1M         |
| Preis Output    | $0.40/1M       | $2.00/1M         | $10.00/1M        |
| Geschwindigkeit | ⚡⚡⚡         | ⚡⚡             | ⚡               |
| Qualität        | ⭐⭐           | ⭐⭐⭐           | ⭐⭐⭐⭐         |
| Empfohlen für   | Einfache Tasks | Standard Content | Premium Features |

## Worldream Empfehlung

GPT-5-mini ist optimal für Worldream:

- Gute Balance zwischen Kosten und Qualität
- Schnell genug für interaktive Nutzung
- Ausreichend kreativ für Worldbuilding
- Unterstützt alle benötigten Features
