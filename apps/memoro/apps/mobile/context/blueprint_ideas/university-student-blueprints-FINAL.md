# Blueprint-Ideen für den Universitären Kontext - Studenten (FINAL)

## Die 4 wichtigsten Blueprints - NUR mit den 8 verfügbaren System-Prompts

---

## 1. Vorlesungsanalyse / Lecture Analysis
**Kategorie**: Universität  
**Farbe**: #9C27B0

### Beschreibung
**Deutsch**: Umfassende Analyse von Vorlesungen mit automatischer Erstellung von Zusammenfassungen und offenen Fragen für die Prüfungsvorbereitung.

**English**: Comprehensive analysis of lectures with automatic creation of summaries and open questions for exam preparation.

### Verwendete Prompts (100% VERFÜGBAR)
1. **Kurzzusammenfassung** (Sort Order: 1)
   - Prompt ID: `c4009bef-4504-4af7-86f5-f896a2412a0a`
   - Memory Title: Kurzzusammenfassung / Executive Summary
   - Schneller Überblick über die Vorlesung

2. **Ausführliche Zusammenfassung** (Sort Order: 2)
   - Prompt ID: `4370cb68-d676-4b93-8afd-2fb7c4ad78c4`
   - Memory Title: Ausführliche Zusammenfassung / Detailed Summary
   - Detaillierte Nachbereitung

3. **Offene Fragen** (Sort Order: 3)
   - Prompt ID: `c576e875-5a52-4f6a-abb7-0c62c945af78`
   - Memory Title: Offene Fragen / Open Questions
   - Für Sprechstunden und Verständnisfragen

4. **Beantwortete Fragen & Antworten** (Sort Order: 4)
   - Prompt ID: `47ce3340-e8c6-437c-928d-854c55589491`
   - Memory Title: Q&A / Questions & Answers
   - Perfekt für Lernkarten

---

## 2. Seminar & Gruppenarbeit / Seminar & Group Work
**Kategorie**: Universität  
**Farbe**: #9C27B0

### Beschreibung
**Deutsch**: Perfekt für Seminardiskussionen und Gruppenarbeiten - erfasst Aufgaben, Ideen und erstellt strukturierte Dokumentation.

**English**: Perfect for seminar discussions and group work - captures tasks, ideas, and creates structured documentation.

### Verwendete Prompts (100% VERFÜGBAR)
1. **Aufgaben & Termine** (Sort Order: 1)
   - Prompt ID: `7a6cac9a-5a34-4fe5-a8f6-23f8165b0e48`
   - Memory Title: Aufgaben & Termine / Tasks & Appointments
   - Mit Verantwortlichkeiten und Deadlines

2. **Gesammelte Ideen & Vorschläge** (Sort Order: 2)
   - Prompt ID: `8cdc89a5-2f76-4d50-a93d-0c177c3e73ab`
   - Memory Title: Ideen & Vorschläge / Ideas & Suggestions
   - Brainstorming und kreative Ansätze

3. **Kurzzusammenfassung** (Sort Order: 3)
   - Prompt ID: `c4009bef-4504-4af7-86f5-f896a2412a0a`
   - Memory Title: Kurzzusammenfassung / Executive Summary
   - Hauptergebnisse der Diskussion

4. **Offene Fragen** (Sort Order: 4)
   - Prompt ID: `c576e875-5a52-4f6a-abb7-0c62c945af78`
   - Memory Title: Offene Fragen / Open Questions
   - Für die nächste Sitzung

---

## 3. Prüfungsvorbereitung / Exam Preparation
**Kategorie**: Universität  
**Farbe**: #9C27B0

### Beschreibung
**Deutsch**: Speziell für die intensive Prüfungsvorbereitung - verwandelt Lernmaterial in strukturierte Lernhilfen mit Q&A und Zusammenfassungen.

**English**: Specifically for intensive exam preparation - transforms study material into structured learning aids with Q&A and summaries.

### Verwendete Prompts (100% VERFÜGBAR)
1. **Beantwortete Fragen & Antworten** (Sort Order: 1)
   - Prompt ID: `47ce3340-e8c6-437c-928d-854c55589491`
   - Memory Title: Q&A / Questions & Answers
   - Perfekt für Lernkarten und Selbsttest

2. **Kurzzusammenfassung** (Sort Order: 2)
   - Prompt ID: `c4009bef-4504-4af7-86f5-f896a2412a0a`
   - Memory Title: Kurzzusammenfassung / Executive Summary
   - Schnelle Wiederholung vor der Prüfung

3. **Ausführliche Zusammenfassung** (Sort Order: 3)
   - Prompt ID: `4370cb68-d676-4b93-8afd-2fb7c4ad78c4`
   - Memory Title: Ausführliche Zusammenfassung / Detailed Summary
   - Detailliertes Prüfungsmaterial

4. **Offene Fragen** (Sort Order: 4)
   - Prompt ID: `c576e875-5a52-4f6a-abb7-0c62c945af78`
   - Memory Title: Offene Fragen / Open Questions
   - Identifiziert Wissenslücken

---

## 4. Content-Erstellung für Studienarbeiten / Academic Content Creation
**Kategorie**: Universität  
**Farbe**: #9C27B0

### Beschreibung
**Deutsch**: Verwandelt Recherche und Diskussionen in strukturierte Inhalte für Hausarbeiten, Präsentationen und wissenschaftliche Blogs.

**English**: Transforms research and discussions into structured content for term papers, presentations, and academic blogs.

### Verwendete Prompts (100% VERFÜGBAR)
1. **Ausführliche Zusammenfassung** (Sort Order: 1)
   - Prompt ID: `4370cb68-d676-4b93-8afd-2fb7c4ad78c4`
   - Memory Title: Ausführliche Zusammenfassung / Detailed Summary
   - Basis für Literaturarbeit

2. **Blogbeitrag** (Sort Order: 2)
   - Prompt ID: `2c6a6e47-1d0c-441f-9449-b5d908bffba2`
   - Memory Title: Blogbeitrag / Blog Post
   - Für wissenschaftliche Blogs oder Artikel

3. **Social Media Posts** (Sort Order: 3)
   - Prompt ID: `b2e39e0a-ec1f-4d0e-813d-f1a08493332b`
   - Memory Title: Social Media Posts
   - Für akademisches Networking (LinkedIn)

4. **Gesammelte Ideen & Vorschläge** (Sort Order: 4)
   - Prompt ID: `8cdc89a5-2f76-4d50-a93d-0c177c3e73ab`
   - Memory Title: Ideen & Vorschläge / Ideas & Suggestions
   - Kreative Ansätze für Arbeiten

---

## Implementierungsdetails

### JSON-Struktur für Supabase
```json
{
  "category_id": "b26c7a49-187d-4429-9dc6-ba55de512a8d",
  "blueprints": [
    {
      "name": {
        "de": "Vorlesungsanalyse",
        "en": "Lecture Analysis"
      },
      "description": {
        "de": "Umfassende Analyse von Vorlesungen mit Zusammenfassungen und Q&A",
        "en": "Comprehensive lecture analysis with summaries and Q&A"
      },
      "prompts": [
        "c4009bef-4504-4af7-86f5-f896a2412a0a",
        "4370cb68-d676-4b93-8afd-2fb7c4ad78c4",
        "c576e875-5a52-4f6a-abb7-0c62c945af78",
        "47ce3340-e8c6-437c-928d-854c55589491"
      ]
    },
    {
      "name": {
        "de": "Seminar & Gruppenarbeit",
        "en": "Seminar & Group Work"
      },
      "description": {
        "de": "Erfasst Aufgaben, Ideen und Diskussionsergebnisse",
        "en": "Captures tasks, ideas, and discussion results"
      },
      "prompts": [
        "7a6cac9a-5a34-4fe5-a8f6-23f8165b0e48",
        "8cdc89a5-2f76-4d50-a93d-0c177c3e73ab",
        "c4009bef-4504-4af7-86f5-f896a2412a0a",
        "c576e875-5a52-4f6a-abb7-0c62c945af78"
      ]
    },
    {
      "name": {
        "de": "Prüfungsvorbereitung",
        "en": "Exam Preparation"
      },
      "description": {
        "de": "Strukturierte Lernhilfen mit Q&A und Zusammenfassungen",
        "en": "Structured learning aids with Q&A and summaries"
      },
      "prompts": [
        "47ce3340-e8c6-437c-928d-854c55589491",
        "c4009bef-4504-4af7-86f5-f896a2412a0a",
        "4370cb68-d676-4b93-8afd-2fb7c4ad78c4",
        "c576e875-5a52-4f6a-abb7-0c62c945af78"
      ]
    },
    {
      "name": {
        "de": "Content-Erstellung für Studienarbeiten",
        "en": "Academic Content Creation"
      },
      "description": {
        "de": "Strukturierte Inhalte für Hausarbeiten und Präsentationen",
        "en": "Structured content for term papers and presentations"
      },
      "prompts": [
        "4370cb68-d676-4b93-8afd-2fb7c4ad78c4",
        "2c6a6e47-1d0c-441f-9449-b5d908bffba2",
        "b2e39e0a-ec1f-4d0e-813d-f1a08493332b",
        "8cdc89a5-2f76-4d50-a93d-0c177c3e73ab"
      ]
    }
  ]
}
```

## Vorteile dieser finalen Version

### ✅ 100% Kompatibilität
- **NUR die 8 tatsächlich verfügbaren Prompts** werden verwendet
- Keine nicht existierenden Prompts (wie "Schlüsselpunkte")
- Sofort implementierbar ohne Backend-Änderungen

### ✅ Vollständige Abdeckung
- **Vorlesungen**: Nachbereitung und Verständnis
- **Gruppenarbeit**: Organisation und Ideensammlung  
- **Prüfungen**: Strukturierte Vorbereitung
- **Wissenschaftliches Schreiben**: Content-Erstellung

### ✅ Praktischer Nutzen
- Jeder Blueprint löst ein reales studentisches Problem
- Sinnvolle Kombination der verfügbaren Prompts
- Mehrsprachigkeit bereits integriert (DE, EN, IT, FR, ES)

### ✅ Einfache Implementierung
- Direkt in Supabase einfügbar
- Keine neuen Prompts nötig
- Verwendet bestehende Infrastruktur

## Wichtiger Hinweis
Der Prompt "Schlüsselpunkte" (ID: 9b411221-6f52-4534-9ea9-dd1904259e8c) existiert NICHT in der Datenbank und wurde in dieser finalen Version komplett entfernt.