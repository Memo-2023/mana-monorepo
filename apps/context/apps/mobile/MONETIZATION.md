# BaseText Monetarisierungskonzept

Dieses Dokument beschreibt das Monetarisierungskonzept für die BaseText-App, basierend auf einem Credit-System für die Nutzung von KI-Funktionen.

## Credit-System

- Benutzer erhalten ein monatliches kostenloses Kontingent von Credits
- Zusätzliche Credits können durch Abonnements oder Einmalkäufe erworben werden
- Verschiedene KI-Modelle verbrauchen unterschiedliche Mengen an Creditsrmöglicht eine faire Nutzungsabrechnung basierend auf der tatsächlichen Nutzung der KI-Funktionen.

## Token-Accounting-System

### Grundkonzept

- Jeder Benutzer erhält monatlich ein festgelegtes Kontingent an kostenlosen Tokens
- Tokens werden für KI-Anfragen (Textgenerierung, Zusammenfassungen, etc.) verbraucht
- Die Token-Kosten variieren je nach verwendetem KI-Modell
- Benutzer können zusätzliche Token-Pakete kaufen, wenn ihr Kontingent aufgebraucht ist
- Die Abrechnung erfolgt über RevenueCat für In-App-Käufe

### Datenbankstruktur

#### 1. Erweiterung der `users`-Tabelle

```sql
ALTER TABLE users
ADD COLUMN token_balance BIGINT DEFAULT 1000000, -- 1 Million Credits als Startguthaben
ADD COLUMN monthly_free_tokens BIGINT DEFAULT 1000000, -- 1 Million Credits monatlich
ADD COLUMN last_token_reset TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN revenue_cat_id TEXT,
ADD COLUMN current_entitlement TEXT;
```

Diese Erweiterung fügt folgende Felder hinzu:

- `token_balance`: Aktuelles Token-Guthaben des Benutzers
- `monthly_free_tokens`: Anzahl der monatlich kostenlosen Tokens
- `last_token_reset`: Zeitpunkt des letzten Zurücksetzens der kostenlosen Tokens
- `revenue_cat_id`: ID des Benutzers im RevenueCat-System
- `current_entitlement`: Aktuelles Abonnement des Benutzers

#### 2. Neue Tabelle `token_transactions`

```sql
CREATE TABLE token_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) NOT NULL,
  amount BIGINT NOT NULL, -- Positive für Käufe, negative für Verbrauch
  transaction_type TEXT NOT NULL, -- 'purchase', 'subscription', 'usage', 'monthly_reset'
  model TEXT, -- Nur für 'usage' relevant
  prompt_tokens INTEGER, -- Nur für 'usage' relevant
  completion_tokens INTEGER, -- Nur für 'usage' relevant
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  metadata JSONB
);
```

CREATE INDEX token_transactions_user_id_idx ON token_transactions(user_id);
CREATE INDEX token_transactions_created_at_idx ON token_transactions(created_at);

Diese Tabelle speichert alle Token-Transaktionen mit folgenden Feldern:

- `user_id`: ID des Benutzers
- `amount`: Anzahl der Tokens (positiv für Käufe, negativ für Nutzung)
- `transaction_type`: Art der Transaktion (z.B. "purchase", "usage", "monthly_reset")
- `model`: Verwendetes KI-Modell (bei Nutzung)
- `prompt_tokens`: Anzahl der Input-Tokens (bei Nutzung)
- `completion_tokens`: Anzahl der Output-Tokens (bei Nutzung)
- `created_at`: Zeitpunkt der Transaktion

#### 3. Neue Tabelle `model_prices`

```sql
CREATE TABLE model_prices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  model_name TEXT UNIQUE NOT NULL,
  input_price_per_1k_tokens DECIMAL(10, 6) NOT NULL,
  output_price_per_1k_tokens DECIMAL(10, 6) NOT NULL,
  tokens_per_dollar INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Beispieleinträge
INSERT INTO model_prices (model_name, input_price_per_1k_tokens, output_price_per_1k_tokens, tokens_per_dollar)
VALUES
('gpt-4.1', 0.01, 0.03, 50000),
('gpt-3.5-turbo', 0.0015, 0.002, 300000),
('gemini-pro', 0.00125, 0.00375, 400000);
```

Diese Tabelle speichert die Preise für verschiedene KI-Modelle:

- `model_name`: Name des KI-Modells
- `input_price_per_1k_tokens`: Preis pro 1000 Input-Tokens in USD
- `output_price_per_1k_tokens`: Preis pro 1000 Output-Tokens in USD
- `tokens_per_dollar`: Anzahl der App-Tokens pro Dollar (für die Umrechnung)

#### 4. Optionale Tabelle `token_packages` (falls RevenueCat nicht verwendet wird)

```sql
CREATE TABLE token_packages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  token_amount BIGINT NOT NULL,
  price_usd DECIMAL(10, 2) NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Beispieleinträge
INSERT INTO token_packages (name, token_amount, price_usd)
VALUES
('Kleines Paket', 5000000, 5.00),
('Mittleres Paket', 10000000, 9.00),
('Großes Paket', 22000000, 18.00);
```

## Abonnements

Die folgenden monatlichen Abonnements werden angeboten:

- Mini: 5 Millionen Credits für 4,99€ pro Monat
- Plus: 10 Millionen Credits für 10,99€ pro Monat
- Pro: 22 Millionen Credits für 17,99€ pro Monat

## Einmalkäufe

Die folgenden Credit-Pakete können als Einmalkauf erworben werden:

- Small: 3 Millionen Credits für 4,99€
- Medium: 7 Millionen Credits für 9,99€
- Large: 15 Millionen Credits für 19,99€

## Implementierte Services

### 1. Token-Counting-Service

Dieser Service ist verantwortlich für:

- Berechnung der geschätzten Token-Anzahl basierend auf der Textlänge
- Berechnung der Kosten für verschiedene KI-Modelle
- Umrechnung von USD in App-Tokens

```typescript
// Hauptfunktionen:
estimateTokens(text: string): number
calculateCost(model: string, promptTokens: number, completionTokens: number): Promise<{ cost: number, appTokens: number }>
convertUSDToAppTokens(usdAmount: number, model: string): Promise<number>
```

### 2. Token-Transaction-Service

Dieser Service ist verantwortlich für:

- Protokollierung von Token-Nutzungen
- Hinzufügen von Tokens nach Käufen
- Zurücksetzen des monatlichen Token-Guthabens
- Abrufen des aktuellen Token-Guthabens
- Abrufen von Token-Nutzungsstatistiken

```typescript
// Hauptfunktionen:
logTokenUsage(userId: string, model: string, prompt: string, completion: string, documentId?: string): Promise<boolean>
addTokens(userId: string, amount: number, source: string): Promise<boolean>
resetMonthlyTokens(userId: string): Promise<boolean>
getCurrentTokenBalance(userId: string): Promise<number>
getTokenUsageStats(userId: string, timeframe: 'day' | 'week' | 'month' | 'year'): Promise<TokenUsageStats>
```

## UI-Komponenten

### 1. Token-Display-Komponente

Diese Komponente zeigt das aktuelle Token-Guthaben des Benutzers an und ermöglicht die Navigation zum Token-Management-Bildschirm.

```typescript
// Haupteigenschaften:
- Anzeige des aktuellen Token-Guthabens
- Optionaler onPress-Handler für Navigation
- Automatische Aktualisierung bei Änderungen
```

### 2. Token-Estimator-Komponente

Diese Komponente schätzt die Token-Kosten für eine KI-Anfrage basierend auf dem eingegebenen Prompt und den Kontextdokumenten.

```typescript
// Haupteigenschaften:
- Schätzung der Token-Kosten vor der Anfrage
- Anzeige der geschätzten Input-, Output- und Gesamt-Tokens
- Prüfung, ob genügend Tokens verfügbar sind
- Submit- und Cancel-Buttons für Benutzerinteraktion
```

## Integration mit dem AI-Service

Der AI-Service wurde erweitert, um:

- Token-Nutzung zu schätzen, bevor eine Anfrage gesendet wird
- Zu prüfen, ob der Benutzer genügend Tokens hat
- Token-Nutzung nach jeder Anfrage zu protokollieren
- Detaillierte Token-Nutzungsinformationen zurückzugeben

## PostHog-Integration

PostHog wird für Analysen der Token-Nutzung verwendet:

- Tracking von Token-Käufen
- Tracking von Token-Nutzung nach Modell
- Tracking von Fällen, in denen Benutzer nicht genügend Tokens haben

## Aktuelle Verbesserungen (April 2025)

### 1. Token-Zählung in Dokumenten-Metadaten

Um die Genauigkeit der Token-Schätzung zu verbessern und die Leistung zu optimieren, wurden folgende Änderungen implementiert:

- Die `Document`-Typ-Definition wurde erweitert, um ein `token_count`-Feld in den `metadata`-JSONB-Daten zu speichern.
- Bei der Erstellung und Aktualisierung von Dokumenten wird die Token-Anzahl automatisch berechnet und in den Metadaten gespeichert.
- Die `updateDocumentTokenCount`-Funktion wurde implementiert, um die Token-Anzahl für bestehende Dokumente zu berechnen und zu aktualisieren.

### 2. Präzisere Token-Kostenberechnung (23.04.2025)

Um eine genauere Abrechnung der Token-Kosten zu gewährleisten und Benutzern nur die tatsächlich verbrauchten Tokens in Rechnung zu stellen, wurden folgende Verbesserungen implementiert:

- Die Kostenberechnung wurde aktualisiert, um die tatsächliche Anzahl der generierten Output-Tokens zu verwenden, anstatt sich auf Schätzungen zu verlassen.
- Die Standard-Schätzung für Output-Tokens wurde von 4000 auf 2000 Tokens reduziert, um realistischere Vorab-Schätzungen zu erhalten.
- Der Prozess wurde in zwei Phasen aufgeteilt:
  1. **Vor der Generierung**: Eine Schätzung der Kosten basierend auf den Input-Tokens und einer konservativen Schätzung der Output-Tokens (2000)
  2. **Nach der Generierung**: Eine präzise Berechnung der tatsächlichen Kosten basierend auf den Input-Tokens und der tatsächlichen Anzahl der generierten Output-Tokens
- Verbesserte Protokollierung, die den Unterschied zwischen geschätzten und tatsächlichen Kosten anzeigt, um die Genauigkeit der Schätzungen zu überwachen.

Diese Änderungen stellen sicher, dass Benutzer nur für die tatsächlich generierten Tokens bezahlen, was zu erheblichen Einsparungen führen kann, insbesondere bei kürzeren Antworten als erwartet.

### 3. Erweiterte Token-Anzeige in allen Toolbars (23.04.2025)

Die Token-Anzeige wurde in allen Bereichen der App implementiert, um eine konsistente Benutzererfahrung zu gewährleisten:

#### Integration in die BottomLLMToolbar

Die Token-Anzeige wurde in die BottomLLMToolbar auf der Dokumentenseite integriert, mit folgenden Funktionen:

- Kompakte Anzeige des aktuellen Token-Guthabens direkt im Prompt-Eingabefeld
- Rechtstündige Darstellung mit einem Pfeil (→), der zum geschätzten verbleibenden Guthaben nach der Generierung führt
- Klickbare Anzeige, die den detaillierten TokenEstimator öffnet
- Automatische Aktualisierung der Schätzung bei Änderungen des Prompts oder Dokumentinhalts
- Berücksichtigung des vollständigen Dokumentinhalts bei der Token-Schätzung

#### Verbesserungen in der SpacesLLMToolbar

- Konsistente Darstellung der Token-Anzeige in der SpacesLLMToolbar
- Separate Token-Schätzungen für "Generieren" (mit ausgewählten Dokumenten) und "Aus Space generieren" (mit allen Dokumenten)

#### Zentrale Verwaltung des Token-Guthabens

- Event-basiertes System zur Aktualisierung aller Token-Anzeigen bei Änderungen des Guthabens
- Automatische Aktualisierung des Token-Guthabens nach erfolgreichen Generierungen
- Verbesserte Fehlerbehandlung bei der Aktualisierung des Token-Guthabens

Diese Erweiterungen verbessern die Transparenz der Token-Nutzung in der gesamten App und ermöglichen es Benutzern, informierte Entscheidungen über ihre Token-Ausgaben zu treffen, unabhängig davon, wo sie die KI-Funktionen verwenden.

```typescript
// Beispiel für die Berechnung und Speicherung der Token-Anzahl
export const updateDocumentTokenCount = ({ content, metadata = {} }) => {
	const tokenCount = estimateTokens(content || '');
	return {
		metadata: {
			...metadata,
			token_count: tokenCount,
		},
	};
};
```

### 2. Verbesserte Token-Schätzung für referenzierte Dokumente

Die Token-Schätzung wurde verbessert, um referenzierte Dokumente korrekt zu berücksichtigen:

- Die `checkTokenBalance`-Funktion wurde überarbeitet, um die Token-Anzahl für den Basis-Prompt und die referenzierten Dokumente getrennt zu berechnen.
- Die Berechnung der Gesamtzahl der Input-Tokens berücksichtigt jetzt korrekt alle referenzierten Dokumente.
- Ein Formatierungs-Overhead für die Dokumente wird in die Berechnung einbezogen (ca. 10 Tokens pro Dokument plus 20 Tokens für die Formatierung).

```typescript
// Berechnung der Token-Anzahl für referenzierte Dokumente
let documentTokens = 0;
if (referencedDocuments && referencedDocuments.length > 0) {
	// Formatierungs-Overhead für die Dokumente
	const formattingOverhead = 20 + referencedDocuments.length * 10;
	documentTokens += formattingOverhead;

	referencedDocuments.forEach((doc) => {
		// Berechne die Token-Anzahl für dieses Dokument
		documentTokens += estimateTokens(doc.content || '');
	});
}
```

### 3. Verbesserte Anzeige in der TokenEstimator-Komponente

Die TokenEstimator-Komponente wurde aktualisiert, um eine detailliertere Aufschlüsselung der Token-Kosten anzuzeigen:

- Anzeige der Gesamtzahl der Input-Tokens
- Separate Anzeige der Token-Anzahl für den Basis-Prompt
- Separate Anzeige der Token-Anzahl für referenzierte Dokumente mit Angabe der Anzahl der Dokumente

```typescript
// Beispiel für die Anzeige der Token-Aufschlüsselung
<Text style={textStyle}>
  <Text style={highlightTextStyle}>Input:</Text> {estimate.inputTokens.toLocaleString()} Tokens
</Text>
{estimate.basePromptTokens !== undefined && (
  <Text style={textStyle}>
    <Text style={highlightTextStyle}>Basis-Prompt:</Text> {estimate.basePromptTokens.toLocaleString()} Tokens
  </Text>
)}
{estimate.documentTokens !== undefined && estimate.documentTokens > 0 && (
  <Text style={textStyle}>
    <Text style={highlightTextStyle}>Referenzierte Dokumente:</Text> {estimate.documentTokens.toLocaleString()} Tokens
    {referencedDocCount > 0 && ` (${referencedDocCount} Dokumente)`}
  </Text>
)}
```

### 4. Optimierte Architektur für die Token-Berechnung

Die Architektur für die Token-Berechnung wurde optimiert, um Doppelberechnungen zu vermeiden:

- Die TokenEstimator-Komponente verwendet jetzt die übergebene Schätzung direkt, anstatt eine eigene Berechnung durchzuführen.
- Die Schätzung wird einmalig in der SpacesLLMToolbar-Komponente berechnet und dann an die TokenEstimator-Komponente übergeben.
- Dies verhindert Inkonsistenzen zwischen der angezeigten Schätzung und der tatsächlichen Token-Nutzung.

## Nächste Schritte

1. **Vervollständigung der UI-Integration**
   - Integration des Token-Displays in die Hauptnavigation
   - Implementierung eines Token-Kaufbildschirms
   - Anzeige von Token-Nutzungsstatistiken

2. **RevenueCat-Integration**
   - Einrichtung von In-App-Käufen für Token-Pakete
   - Synchronisierung von Käufen mit der Datenbank
   - Implementierung von Wiederherstellungsmechanismen

3. **Weitere Optimierungen der Token-Zählung**
   - Batch-Aktualisierung der Token-Anzahl für bestehende Dokumente
   - Caching von Token-Schätzungen für häufig verwendete Prompts
   - Feinabstimmung der Token-Schätzung für verschiedene Modelle

4. **Testen des gesamten Systems**
   - Überprüfung der Token-Berechnungsgenauigkeit
   - Testen der Benutzerflüsse für Token-Käufe
   - Sicherstellen, dass das monatliche Reset korrekt funktioniert

5. **Monitoring und Optimierung**
   - Einrichtung von Alarmen für ungewöhnliche Token-Nutzung
   - Optimierung der Token-Preise basierend auf tatsächlichen Kosten
   - Anpassung der kostenlosen Token-Menge basierend auf Nutzungsdaten
