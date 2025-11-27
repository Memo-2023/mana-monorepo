# Der Standard-Analyse Blueprint - Detaillierte Dokumentation

## Überblick

Der **Standard-Analyse Blueprint** ist die zentrale Analysevorlage in der Memoro App. Er wurde entwickelt, um eine ausgewogene und umfassende Analyse jedes Memos zu liefern, unabhängig vom Kontext oder Thema.

**Blueprint-ID**: `11111111-2222-3333-4444-555555555555`

## Warum Standard-Analyse?

Dieser Blueprint ist die Standardauswahl, weil er die wichtigsten Aspekte eines jeden Gesprächs oder einer Aufnahme abdeckt:

- **Verstehen**: Was wurde besprochen?
- **Merken**: Was sind die wichtigsten Punkte?
- **Handeln**: Was muss getan werden?
- **Entscheiden**: Was wurde beschlossen?
- **Klären**: Was ist noch offen?

## Die 5 Prompts im Detail

### 1. Kurzzusammenfassung (Executive Summary)

**Prompt-ID**: `c4009bef-4504-4af7-86f5-f896a2412a0a`

**Zweck**: Gibt einen schnellen Überblick über das gesamte Memo in 3-5 prägnanten Sätzen.

**Was wird extrahiert**:

- Die Hauptthemen des Gesprächs
- Die wichtigsten Schlussfolgerungen
- Die absoluten Kernbotschaften

**Beispiel-Output**:

```
"Das Meeting behandelte die Q4-Marketingstrategie mit Fokus auf digitale Kanäle.
Es wurde entschieden, das Budget um 20% zu erhöhen und zwei neue Kampagnen zu starten.
Die Hauptherausforderung liegt in der knappen Timeline bis zum Jahresende."
```

**Wann besonders wertvoll**:

- Wenn Sie schnell verstehen müssen, worum es ging
- Für die Weitergabe an Kollegen
- Als Erinnerungsstütze Wochen später

---

### 2. Schlüsselpunkte (Key Takeaways)

**Prompt-ID**: `9b411221-6f52-4534-9ea9-dd1904259e8c`

**Zweck**: Identifiziert und listet die zentralen Erkenntnisse als klare Aufzählungspunkte.

**Was wird extrahiert**:

- Die wichtigsten Informationen
- Zentrale Argumente
- Bedeutende Erkenntnisse
- Kritische Datenpunkte

**Beispiel-Output**:

```
• Umsatzsteigerung von 15% im letzten Quartal
• Kundenzufriedenheit bei 87% (Ziel: 90%)
• Neue Produktlinie wird im März gelauncht
• Personalbedarf: 3 neue Entwickler bis Februar
• Hauptrisiko: Lieferkettenprobleme in Asien
```

**Wann besonders wertvoll**:

- Für Präsentationen und Reports
- Als Diskussionsgrundlage
- Für die Nachbereitung von Meetings

---

### 3. Dynamische Aufgaben- und Maßnahmenplanung

**Prompt-ID**: `7a6cac9a-5a34-4fe5-a8f6-23f8165b0e48`

**Zweck**: Extrahiert ALLE erwähnten Aufgaben, Aktionspunkte und nächsten Schritte mit maximalen Details.

**Was wird extrahiert**:

- Konkrete Aufgaben und To-Dos
- Verantwortliche Personen (wenn genannt)
- Zeitrahmen und Deadlines (wenn erwähnt)
- Kontext und erwartete Ergebnisse
- Abhängigkeiten zwischen Aufgaben

**Beispiel-Output**:

```
1. Marktanalyse erstellen
   - Verantwortlich: Sarah
   - Deadline: 15. Februar
   - Umfang: Fokus auf DACH-Region
   - Erwartetes Ergebnis: 10-seitiger Report mit Empfehlungen

2. Budget-Proposal vorbereiten
   - Verantwortlich: noch zu klären
   - Zeitrahmen: Vor dem nächsten Board-Meeting
   - Abhängigkeit: Benötigt Input aus Marktanalyse

3. Kundeninterviews durchführen
   - Verantwortlich: Marketing-Team
   - Anzahl: Mindestens 20 Interviews
   - Timeline: Q1 2025
```

**Besonderheit**: Dieser Prompt passt sich dynamisch an - er extrahiert nur die Informationen, die tatsächlich im Transkript vorhanden sind. Keine künstliche Vervollständigung.

**Wann besonders wertvoll**:

- Projektmanagement
- Follow-up nach Meetings
- Aufgabenverteilung im Team
- Persönliche Todo-Listen

---

### 4. Getroffene Entscheidungen (Decisions Made)

**Prompt-ID**: `13abbdb0-c6ba-4852-be12-411a2925eb57`

**Zweck**: Dokumentiert alle expliziten und impliziten Entscheidungen für Verbindlichkeit und Klarheit.

**Was wird extrahiert**:

- Explizite Beschlüsse ("Wir haben entschieden...")
- Implizite Entscheidungen (aus dem Kontext erkennbar)
- Festlegungen und Commitments
- Strategische Richtungsentscheidungen

**Beispiel-Output**:

```
✓ Die Produkteinführung wird auf Q2 verschoben
✓ Das Team wird um 2 Personen erweitert
✓ Wir fokussieren uns zunächst auf den deutschen Markt
✓ Die alte Software wird bis Ende März abgeschaltet
✓ Meetings finden ab sofort wöchentlich statt
```

**Wann besonders wertvoll**:

- Für die Dokumentation
- Bei Vertragsverhandlungen
- Für die Kommunikation an Stakeholder
- Als Referenz für zukünftige Diskussionen

---

### 5. Offene Fragen (Open Questions)

**Prompt-ID**: `c576e875-5a52-4f6a-abb7-0c62c945af78`

**Zweck**: Identifiziert alle unbeantworteten Fragen und Punkte, die weiterer Klärung bedürfen.

**Was wird extrahiert**:

- Direkt gestellte, unbeantwortete Fragen
- Implizite Unsicherheiten
- Punkte, die zur Diskussion gestellt wurden
- Themen für Follow-up Gespräche

**Beispiel-Output**:

```
? Wie hoch ist das genaue Budget für Q2?
? Wer übernimmt die Projektleitung während Sarahs Urlaub?
? Sollen wir den Launch in allen Märkten gleichzeitig machen?
? Welche KPIs verwenden wir für die Erfolgsmessung?
? Brauchen wir externe Unterstützung für die Implementierung?
```

**Wann besonders wertvoll**:

- Vorbereitung von Follow-up Meetings
- Identifikation von Wissenslücken
- Risikomanagement
- Entscheidungsvorbereitung

---

## Zusammenspiel der Prompts

Die Stärke des Standard-Analyse Blueprints liegt im **synergistischen Zusammenspiel** der 5 Prompts:

```
Kurzzusammenfassung
    ↓
    Gibt den Kontext
    ↓
Schlüsselpunkte
    ↓
    Zeigt was wichtig ist
    ↓
Aufgaben
    ↓
    Definiert was zu tun ist
    ↓
Entscheidungen
    ↓
    Dokumentiert was festgelegt wurde
    ↓
Offene Fragen
    ↓
    Zeigt was noch zu klären ist
```

## Praktische Anwendungsszenarien

### Scenario 1: Wöchentliches Team-Meeting

- **Kurzzusammenfassung**: Schneller Überblick für Abwesende
- **Schlüsselpunkte**: Für das Meeting-Protokoll
- **Aufgaben**: Verteilung an Teammitglieder
- **Entscheidungen**: Für die Dokumentation
- **Offene Fragen**: Agenda für nächstes Meeting

### Scenario 2: Kundengespräch

- **Kurzzusammenfassung**: Für CRM-Eintrag
- **Schlüsselpunkte**: Kundenbedürfnisse verstehen
- **Aufgaben**: Follow-up Aktionen
- **Entscheidungen**: Vereinbarungen festhalten
- **Offene Fragen**: Für Angebotserstellung

### Scenario 3: Brainstorming-Session

- **Kurzzusammenfassung**: Für Projektdokumentation
- **Schlüsselpunkte**: Die besten Ideen
- **Aufgaben**: Nächste Schritte zur Umsetzung
- **Entscheidungen**: Welche Ideen verfolgt werden
- **Offene Fragen**: Was noch recherchiert werden muss

### Scenario 4: Persönliche Notizen

- **Kurzzusammenfassung**: Für spätere Erinnerung
- **Schlüsselpunkte**: Wichtige Gedanken
- **Aufgaben**: Persönliche To-Dos
- **Entscheidungen**: Getroffene Entschlüsse
- **Offene Fragen**: Was noch zu überlegen ist

## Tipps für optimale Ergebnisse

### Beim Sprechen beachten:

1. **Strukturiert sprechen**: Nutzen Sie Signalwörter wie "Erstens", "Zweitens", "Zusammenfassend"
2. **Explizit sein**: Sagen Sie "Wir entscheiden..." oder "Die Aufgabe ist..."
3. **Namen nennen**: Erwähnen Sie Verantwortliche bei Aufgaben
4. **Zeitangaben machen**: Nennen Sie konkrete Deadlines
5. **Fragen markieren**: "Die offene Frage ist..." oder "Zu klären wäre noch..."

### Nach der Aufnahme:

- Überprüfen Sie die generierten Memories
- Ergänzen Sie fehlende Details manuell
- Teilen Sie relevante Punkte mit Beteiligten
- Nutzen Sie offene Fragen für Follow-ups

## Technische Implementation

```javascript
// Pseudocode der Blueprint-Ausführung
async function executeStandardAnalyse(transcript) {
	const results = await Promise.all([
		executePrompt('c4009bef-...', transcript), // Kurzzusammenfassung
		executePrompt('9b411221-...', transcript), // Schlüsselpunkte
		executePrompt('7a6cac9a-...', transcript), // Aufgaben
		executePrompt('13abbdb0-...', transcript), // Entscheidungen
		executePrompt('c576e875-...', transcript), // Offene Fragen
	]);

	return createMemories(results);
}
```

## Kosten

Der Standard-Analyse Blueprint verwendet 5 Prompts, was bedeutet:

- **Mana-Kosten**: 5 Credits pro Blueprint-Anwendung
- **Verarbeitung**: Alle 5 Prompts werden parallel ausgeführt
- **Ergebnis**: 5 separate Memory-Einträge werden erstellt

## Fazit

Der Standard-Analyse Blueprint ist das Schweizer Taschenmesser der Memo-Analyse. Er bietet eine vollständige 360-Grad-Analyse jeder Aufnahme und stellt sicher, dass keine wichtigen Informationen verloren gehen. Durch die Kombination von Überblick, Details, Aktionen, Entscheidungen und offenen Punkten erhalten Sie ein vollständiges Bild Ihrer Gespräche und Gedanken.
