# Verfügbare Blueprints in der Memoro App

Stand: Januar 2025

## Was sind Blueprints?

Blueprints sind vordefinierte Analysevorlagen, die mehrere Prompts kombinieren, um eine umfassende Analyse eines Memos zu erstellen. Jeder Blueprint wendet automatisch eine sorgfältig ausgewählte Kombination von Prompts an, um spezifische Analyseziele zu erreichen.

## Verfügbare Blueprints

### 1. Standard-Analyse

- **ID**: `11111111-2222-3333-4444-555555555555`
- **Kategorie**: Keine spezifische Kategorie
- **Beschreibung**: Die Standard-Analyse für Memos. Bietet eine ausgewogene Mischung aus Zusammenfassung, wichtigen Punkten, Aufgaben und offenen Fragen.
- **Öffentlich**: Ja
- **Erstellt**: Juli 2025

#### Enthaltene Prompts:

1. **Kurzzusammenfassung** - Prägnante Übersicht in 3-5 Sätzen
2. **Schlüsselpunkte** - Wichtigste Erkenntnisse als Aufzählungspunkte
3. **Dynamische Aufgaben- und Maßnahmenplanung** - Alle Aufgaben und nächste Schritte
4. **Getroffene Entscheidungen** - Klar formulierte Beschlüsse
5. **Offene Fragen** - Unbeantwortete oder diskussionswürdige Fragen

---

### 2. Meeting-Analyse

- **ID**: `6d4ff812-2cb5-4245-a862-6515085ef308`
- **Kategorie**: **Büro** (Office) - 🏢 Farbe: #607D8B
- **Beschreibung**: Ein Blueprint zur umfassenden Analyse und Dokumentation von Besprechungen, Meetings und Diskussionen. Extrahiert wichtige Aufgaben, Entscheidungen und erstellt eine Zusammenfassung.
- **Öffentlich**: Ja
- **Erstellt**: Mai 2025

#### Enthaltene Prompts:

1. **Kurzzusammenfassung** - Executive Summary des Meetings
2. **Dynamische Aufgaben- und Maßnahmenplanung** - Alle besprochenen Aufgaben mit Details
3. **Getroffene Entscheidungen** - Dokumentation aller Beschlüsse

#### Tipps für optimale Nutzung:

- Sprechen Sie klar und strukturiert, um die Analyse zu erleichtern
- Benennen Sie wichtige Aufgaben und Entscheidungen explizit
- Fassen Sie am Ende die wichtigsten Punkte zusammen
- Geben Sie bei Aufgaben auch Verantwortlichkeiten und Zeitrahmen an

---

### 3. Feedback-Analyse

- **ID**: `3ae10e29-1a7f-4a40-8e4b-5cff1803fe1b`
- **Kategorie**: **Coaching** - 🎯 Farbe: #FF9800
- **Beschreibung**: Ein Blueprint zur strukturierten Analyse von Feedback-Gesprächen. Kategorisiert Feedback in positives Feedback, negatives Feedback, Verbesserungsvorschläge und sonstiges Feedback.
- **Öffentlich**: Ja
- **Erstellt**: Mai 2025

#### Enthaltene Prompts:

1. **Strukturierte Feedback-Analyse** - Kategorisierung in 4 Feedback-Arten
2. **Ausführliche Zusammenfassung** - Detaillierte Wiedergabe mit Kontext
3. **Sprecherbeiträge Zusammenfassung** - Analyse pro Sprecher (wenn verfügbar)

#### Besonderer Hinweis:

Schicke direktes Feedback an das Memoro Team. Was gefällt? Was stört? Was wünscht du dir? Wir freuen uns von dir zu hören.

---

### 4. Kreatives Schreiben

- **ID**: `e1ce1954-646f-4e4e-9683-43fb1cefabe7`
- **Kategorie**: **Universität** - 🎓 Farbe: #9C27B0
- **Beschreibung**: Ein Blueprint für kreatives Schreiben und literarische Übungen. Hilft bei der Entwicklung von Charakteren, Szenen und Handlungssträngen.
- **Öffentlich**: Ja
- **Erstellt**: Juni 2025

#### Tipps für kreatives Schreiben:

1. Verwende detaillierte Beschreibungen, um Szenen lebendig zu gestalten
2. Experimentiere mit verschiedenen Perspektiven und Erzählstilen
3. Achte auf den Rhythmus deiner Sprache und die Satzlänge
4. Überarbeite deinen Text mehrmals und lass ihn zwischendurch ruhen

_Hinweis: Die spezifischen Prompts für diesen Blueprint sind in der aktuellen Datenabfrage nicht enthalten._

---

## Kategorien

Die Blueprints sind in folgende Kategorien organisiert:

### Büro (Office)

- **Farbe**: #607D8B (Blaugrau)
- **Beschreibung**: Blueprints für Büroarbeit und Administration
- **Beispiel**: Meeting-Analyse

### Coaching

- **Farbe**: #FF9800 (Orange)
- **Beschreibung**: Blueprints für Coaching und Beratung
- **Beispiel**: Feedback-Analyse

### Universität (University)

- **Farbe**: #9C27B0 (Violett)
- **Beschreibung**: Blueprints für akademische Zwecke
- **Beispiel**: Kreatives Schreiben

## Technische Details

- Alle Blueprints sind mehrsprachig (Deutsch/Englisch)
- Blueprints können mehrere Prompts kombinieren
- Die Verknüpfung erfolgt über die `prompt_blueprints` Tabelle
- Jeder Blueprint kann optional Tipps (`advice`) für die optimale Nutzung enthalten
- Blueprints sind standardmäßig öffentlich verfügbar

## Verwendung

Blueprints werden in der App ausgewählt und automatisch auf neue oder bestehende Memos angewendet. Sie führen dann alle zugehörigen Prompts aus und erstellen mehrere strukturierte "Memories" basierend auf dem Transkript des Memos.
