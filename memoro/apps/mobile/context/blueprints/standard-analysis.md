# Standard-Analyse Blueprint

## Übersicht
- **ID**: `11111111-2222-3333-4444-555555555555`
- **Name (DE)**: Standard-Analyse
- **Name (EN)**: Standard Analysis
- **Kategorie**: Keine (Allgemein)

## Beschreibung
**Deutsch**: Die Standard-Analyse für Memos. Bietet eine ausgewogene Mischung aus Zusammenfassung, wichtigen Punkten, Aufgaben und offenen Fragen.

**English**: The standard analysis for memos. Offers a balanced mix of summary, key points, tasks, and open questions.

## Prompts

### 1. Kurzzusammenfassung / Executive Summary
**Sort Order**: 1  
**Memory Title**: 
- DE: Kurzzusammenfassung
- EN: Executive Summary

**Prompt Text**:
- **DE**: Erstelle eine prägnante Kurzzusammenfassung (ca. 3-5 Sätze) der Hauptthemen und wichtigsten Schlussfolgerungen des folgenden Transkripts. Was sind die absoluten Kernbotschaften? Basiere deine Antwort auf dem folgenden Transkript: [Transkript hier einfügen]
- **EN**: Create a concise executive summary (approx. 3-5 sentences) of the main topics and most important conclusions from the following transcript. What are the absolute key messages? Base your answer on the following transcript: [Insert transcript here]

**Beschreibung**:
- **DE**: Erstellt eine knappe Übersicht der wichtigsten Inhalte und Kernaussagen des Gesprächs oder Vortrags. Ideal für einen schnellen Überblick.
- **EN**: Creates a brief overview of the most important content and key statements of the conversation or presentation. Ideal for a quick overview.

### 2. Aufgaben / Tasks
**Sort Order**: 2  
**Memory Title**: 
- DE: Aufgaben
- EN: Tasks

**Prompt Text**:
- **DE**: Bitte lies das folgende Transkript durch und extrahiere alle im Gespräch erwähnten Aufgaben, Aktionspunkte und nächsten Schritte. Erfasse für jeden dieser Punkte auch Details wie Kontext, erwartete Ergebnisse, verantwortliche Person und Zeitrahmen, falls vorhanden. Hier das Transkript:
- **EN**: Please read through the following transcript and extract all tasks, action items, and next steps mentioned in the conversation. For each of these points, also capture details such as context, expected results, responsible person, and timeframe, if available. Here is the transcript:

**Beschreibung**:
- **DE**: Extrahiert alle im Gespräch erwähnten Aufgaben, Aktionspunkte und nächsten Schritte. Erfasst je nach Informationslage im Transkript auch Details wie Kontext, erwartete Ergebnisse, zugewiesene Verantwortlichkeiten und Zeitrahmen. Passt den Detailgrad der Ausgabe dynamisch an die im Transkript verfügbaren Informationen an.
- **EN**: Extracts all tasks, action points and next steps mentioned in the conversation. Depending on the information available in the transcript, also captures details such as context, expected results, assigned responsibilities and timeframes. Dynamically adapts the level of detail of the output to the information available in the transcript.

### 3. Ausführliche Zusammenfassung / Detailed Summary
**Sort Order**: 3  
**Memory Title**: 
- DE: Ausführliche Zusammenfassung
- EN: Detailed Summary

**Prompt Text**:
- **DE**: Erstelle eine ausführliche Zusammenfassung des folgenden Transkripts. Gehe dabei auf die Hauptthemen, die wichtigsten diskutierten Punkte, vorgebrachten Argumente und relevante Beispiele ein. Die Zusammenfassung sollte umfassend, aber immer noch kürzer als das Originaltranskript sein. Basiere deine Antwort auf dem folgenden Transkript: [Transkript hier einfügen]
- **EN**: Create a detailed summary of the following transcript. Address the main topics, the most important points discussed, arguments presented, and relevant examples. The summary should be comprehensive but still shorter than the original transcript. Base your answer on the following transcript: [Insert transcript here]

**Beschreibung**:
- **DE**: Gibt eine detailliertere Wiedergabe der Inhalte, inklusive wichtiger Argumente, Beispiele und Kontextinformationen. Geeignet für ein tiefergehendes Verständnis ohne das gesamte Transkript lesen zu müssen.
- **EN**: Provides a more detailed reproduction of the content, including important arguments, examples and contextual information. Suitable for a deeper understanding without having to read the entire transcript.

## Tipps & Ratschläge
*Hinweis: Für diesen Blueprint sind keine spezifischen Tipps hinterlegt.*

## Metadaten
- **Unterstützte Sprachen**: de, en