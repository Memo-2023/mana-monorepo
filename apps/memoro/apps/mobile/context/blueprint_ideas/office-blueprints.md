# Blueprint-Ideen für den Büro-Kontext / Office (Final)

## Die 4 wichtigsten Blueprints - NUR mit den 8 verfügbaren System-Prompts (ohne Schlüsselpunkte)

---

## 1. Meeting-Protokoll & Follow-Up / Meeting Minutes & Follow-Up

**Kategorie**: Büro / Office  
**Farbe**: #2196F3

### Beschreibung

**Deutsch**: Erstellt strukturierte Meeting-Protokolle mit Entscheidungen, Aufgaben und Terminen. Perfekt für effiziente Nachbereitung und klare Verantwortlichkeiten.

**English**: Creates structured meeting minutes with decisions, tasks, and deadlines. Perfect for efficient follow-up and clear responsibilities.

### Verwendete Prompts (100% VERFÜGBAR)

1. **Kurzzusammenfassung** (Sort Order: 1)
   - Prompt ID: `c4009bef-4504-4af7-86f5-f896a2412a0a`
   - Memory Title: Kurzzusammenfassung / Executive Summary
   - Meeting-Ergebnisse auf einen Blick

2. **Ausführliche Zusammenfassung** (Sort Order: 2)
   - Prompt ID: `4370cb68-d676-4b93-8afd-2fb7c4ad78c4`
   - Memory Title: Ausführliche Zusammenfassung / Detailed Summary
   - Vollständiges Protokoll mit allen Diskussionspunkten

3. **Aufgaben & Termine** (Sort Order: 3)
   - Prompt ID: `7a6cac9a-5a34-4fe5-a8f6-23f8165b0e48`
   - Memory Title: Aufgaben & Termine / Tasks & Appointments
   - Action Items mit Verantwortlichen und Deadlines

4. **Offene Fragen** (Sort Order: 4)
   - Prompt ID: `c576e875-5a52-4f6a-abb7-0c62c945af78`
   - Memory Title: Offene Fragen / Open Questions
   - Themen für das nächste Meeting

---

## 2. Brainstorming & Ideenentwicklung / Brainstorming & Idea Development

**Kategorie**: Büro / Office  
**Farbe**: #2196F3

### Beschreibung

**Deutsch**: Erfasst und strukturiert kreative Sessions, Workshops und Strategieentwicklung. Dokumentiert alle Ideen und priorisiert Umsetzungsschritte.

**English**: Captures and structures creative sessions, workshops, and strategy development. Documents all ideas and prioritizes implementation steps.

### Verwendete Prompts (100% VERFÜGBAR)

1. **Kurzzusammenfassung** (Sort Order: 1)
   - Prompt ID: `c4009bef-4504-4af7-86f5-f896a2412a0a`
   - Memory Title: Kurzzusammenfassung / Executive Summary
   - Session-Ergebnis kompakt

2. **Gesammelte Ideen & Vorschläge** (Sort Order: 2)
   - Prompt ID: `8cdc89a5-2f76-4d50-a93d-0c177c3e73ab`
   - Memory Title: Ideen & Vorschläge / Ideas & Suggestions
   - Alle Konzepte nach Umsetzbarkeit sortiert

3. **Aufgaben & Termine** (Sort Order: 3)
   - Prompt ID: `7a6cac9a-5a34-4fe5-a8f6-23f8165b0e48`
   - Memory Title: Aufgaben & Termine / Tasks & Appointments
   - Nächste Schritte zur Umsetzung

4. **Blogbeitrag** (Sort Order: 4)
   - Prompt ID: `2c6a6e47-1d0c-441f-9449-b5d908bffba2`
   - Memory Title: Blogbeitrag / Blog Post
   - Für internes Wissensmanagement oder Intranet

---

## 3. Projektbesprechung & Statusupdate / Project Meeting & Status Update

**Kategorie**: Büro / Office  
**Farbe**: #2196F3

### Beschreibung

**Deutsch**: Dokumentiert Projektfortschritt, Meilensteine und Hindernisse. Ideal für Steering Committees, Sprint Reviews und Stakeholder-Updates.

**English**: Documents project progress, milestones, and obstacles. Ideal for steering committees, sprint reviews, and stakeholder updates.

### Verwendete Prompts (100% VERFÜGBAR)

1. **Kurzzusammenfassung** (Sort Order: 1)
   - Prompt ID: `c4009bef-4504-4af7-86f5-f896a2412a0a`
   - Memory Title: Kurzzusammenfassung / Executive Summary
   - Projektstatus Executive Summary

2. **Ausführliche Zusammenfassung** (Sort Order: 2)
   - Prompt ID: `4370cb68-d676-4b93-8afd-2fb7c4ad78c4`
   - Memory Title: Ausführliche Zusammenfassung / Detailed Summary
   - Detaillierter Fortschrittsbericht

3. **Aufgaben & Termine** (Sort Order: 3)
   - Prompt ID: `7a6cac9a-5a34-4fe5-a8f6-23f8165b0e48`
   - Memory Title: Aufgaben & Termine / Tasks & Appointments
   - Meilensteine und kritische Pfade

4. **Offene Fragen** (Sort Order: 4)
   - Prompt ID: `c576e875-5a52-4f6a-abb7-0c62c945af78`
   - Memory Title: Offene Fragen / Open Questions
   - Risiken und Eskalationsbedarf

---

## 4. Kommunikations-Content / Communication Content

**Kategorie**: Büro / Office  
**Farbe**: #2196F3

### Beschreibung

**Deutsch**: Verwandelt Besprechungen und Präsentationen in professionelle Kommunikationsinhalte für verschiedene Kanäle und Zielgruppen.

**English**: Transforms meetings and presentations into professional communication content for various channels and audiences.

### Verwendete Prompts (100% VERFÜGBAR)

1. **Kurzzusammenfassung** (Sort Order: 1)
   - Prompt ID: `c4009bef-4504-4af7-86f5-f896a2412a0a`
   - Memory Title: Kurzzusammenfassung / Executive Summary
   - Management Summary für Führungsebene

2. **Blogbeitrag** (Sort Order: 2)
   - Prompt ID: `2c6a6e47-1d0c-441f-9449-b5d908bffba2`
   - Memory Title: Blogbeitrag / Blog Post
   - Für Intranet oder Unternehmens-Blog

3. **Social Media Posts** (Sort Order: 3)
   - Prompt ID: `b2e39e0a-ec1f-4d0e-813d-f1a08493332b`
   - Memory Title: Social Media Posts
   - LinkedIn, Twitter für Corporate Communications

4. **Ausführliche Zusammenfassung** (Sort Order: 4)
   - Prompt ID: `4370cb68-d676-4b93-8afd-2fb7c4ad78c4`
   - Memory Title: Ausführliche Zusammenfassung / Detailed Summary
   - Hintergrundinformationen für Newsletter

---

## Implementierungsdetails

### JSON-Struktur für Supabase

```json
{
	"category_id": "office-category-id",
	"blueprints": [
		{
			"name": {
				"de": "Meeting-Protokoll & Follow-Up",
				"en": "Meeting Minutes & Follow-Up"
			},
			"description": {
				"de": "Strukturierte Meeting-Protokolle mit Aufgaben und Entscheidungen",
				"en": "Structured meeting minutes with tasks and decisions"
			},
			"prompts": [
				"c4009bef-4504-4af7-86f5-f896a2412a0a",
				"4370cb68-d676-4b93-8afd-2fb7c4ad78c4",
				"7a6cac9a-5a34-4fe5-a8f6-23f8165b0e48",
				"c576e875-5a52-4f6a-abb7-0c62c945af78"
			]
		},
		{
			"name": {
				"de": "Brainstorming & Ideenentwicklung",
				"en": "Brainstorming & Idea Development"
			},
			"description": {
				"de": "Erfasst kreative Sessions und priorisiert Umsetzungsschritte",
				"en": "Captures creative sessions and prioritizes implementation steps"
			},
			"prompts": [
				"c4009bef-4504-4af7-86f5-f896a2412a0a",
				"8cdc89a5-2f76-4d50-a93d-0c177c3e73ab",
				"7a6cac9a-5a34-4fe5-a8f6-23f8165b0e48",
				"2c6a6e47-1d0c-441f-9449-b5d908bffba2"
			]
		},
		{
			"name": {
				"de": "Projektbesprechung & Statusupdate",
				"en": "Project Meeting & Status Update"
			},
			"description": {
				"de": "Dokumentiert Projektfortschritt und Meilensteine",
				"en": "Documents project progress and milestones"
			},
			"prompts": [
				"c4009bef-4504-4af7-86f5-f896a2412a0a",
				"4370cb68-d676-4b93-8afd-2fb7c4ad78c4",
				"7a6cac9a-5a34-4fe5-a8f6-23f8165b0e48",
				"c576e875-5a52-4f6a-abb7-0c62c945af78"
			]
		},
		{
			"name": {
				"de": "Kommunikations-Content",
				"en": "Communication Content"
			},
			"description": {
				"de": "Professionelle Inhalte für verschiedene Kanäle",
				"en": "Professional content for various channels"
			},
			"prompts": [
				"c4009bef-4504-4af7-86f5-f896a2412a0a",
				"2c6a6e47-1d0c-441f-9449-b5d908bffba2",
				"b2e39e0a-ec1f-4d0e-813d-f1a08493332b",
				"4370cb68-d676-4b93-8afd-2fb7c4ad78c4"
			]
		}
	]
}
```

## Vorteile dieser finalen Version

### ✅ 100% Kompatibilität

- **NUR die 8 tatsächlich verfügbaren Prompts** werden verwendet (ohne Schlüsselpunkte)
- Keine Phantasie-IDs oder nicht existierende Prompts
- Sofort implementierbar ohne Backend-Änderungen

### ✅ Vollständige Abdeckung

- **Meetings**: Effiziente Protokollierung und Nachverfolgung
- **Innovation**: Strukturierte Ideenentwicklung und Workshops
- **Projektmanagement**: Lückenlose Statusdokumentation
- **Kommunikation**: Multi-Channel Content-Erstellung

### ✅ Praktischer Nutzen für Büro-Mitarbeiter

- **Zeitersparnis**: Automatische Protokollerstellung statt manueller Notizen
- **Klarheit**: Eindeutige Aufgabenverteilung und Verantwortlichkeiten
- **Transparenz**: Nachvollziehbare Entscheidungen und Projektfortschritte
- **Effizienz**: Ein Gespräch, mehrere Outputs (Protokoll, Blog, Social Media)
- **Compliance**: Revisionssichere Dokumentation wichtiger Meetings

### ✅ Büro-spezifische Anwendungsfälle

- Board-Meetings und Vorstandssitzungen
- Agile Sprint Reviews und Retrospektiven
- Kundenpräsentationen und Pitches
- Strategieworkshops und OKR-Planungen
- Team-Meetings und Jour Fixes
- Change Management Kommunikation
- Internal Communications
- Stakeholder Updates

### ✅ Einfache Implementierung

- Direkt in Supabase einfügbar
- Keine neuen Prompts nötig
- Verwendet bestehende Infrastruktur
- Mehrsprachigkeit bereits integriert (DE, EN, IT, FR, ES)
