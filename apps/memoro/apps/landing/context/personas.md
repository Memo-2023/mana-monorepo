# Personas Erstellungs-Guide

## Überblick

Personas sind detaillierte, datenbasierte Profile unserer Zielkunden. Sie helfen uns, Produkt- und Marketing-Entscheidungen aus Kundenperspektive zu treffen.

## Dateistruktur

### Speicherort
```
src/content/_personas/
├── de/                 # Deutsche Personas
│   └── [slug].mdx     # z.B. handwerksmeister-thomas.mdx
└── en/                 # Englische Personas
    └── [slug].mdx
```

### Namenskonvention
- Kleinschreibung mit Bindestrichen
- Format: `[rolle]-[vorname].mdx`
- Beispiele:
  - `handwerksmeister-thomas.mdx`
  - `startup-founder-alex.mdx`
  - `projektmanagerin-sabine.mdx`

## Persona-Struktur

### 1. Frontmatter (YAML)

Die Persona-Datei beginnt mit strukturierten Metadaten zwischen `---` Markierungen:

```yaml
---
# PFLICHTFELDER
name: "Thomas Bauer"                    # Vollständiger Name
title: "Der digitale Handwerksmeister"  # Beschreibender Titel
lang: "de"                               # Sprache (de/en)

# DEMOGRAFISCHE DATEN
demographics:
  age: 45                                # Alter oder Altersbereich (z.B. "35-45")
  gender: "male"                         # male/female/diverse/unspecified
  location: "Augsburg, Deutschland"      # Stadt, Land
  education: "Meisterbrief"              # Bildungsabschluss
  income: "75.000-95.000€/Jahr"         # Optional: Einkommensspanne
  familyStatus: "Verheiratet, 3 Kinder" # Optional: Familienstand

# BERUFLICHES PROFIL
professional:
  jobTitle: "Geschäftsführender Elektromeister"
  company: "Bauer Elektrotechnik GmbH"   # Optional: Firmenname/typ
  companySize: "12 Mitarbeiter"
  industry: "Handwerk - Elektrotechnik"
  experience: "22 Jahre"
  responsibilities:                      # Array von Hauptaufgaben
    - "Betriebsführung"
    - "Kundenakquise"
  teamSize: "11 Mitarbeiter"            # Optional

# PSYCHOGRAFISCHE MERKMALE
psychographics:
  personality:          # Persönlichkeitsmerkmale
    - "praktisch"
    - "qualitätsbewusst"
  values:              # Werte und Überzeugungen
    - "Handwerksqualität"
    - "Zuverlässigkeit"
  motivations:         # Was treibt die Person an?
    - "Betrieb modernisieren"
  frustrations:        # Pain Points
    - "Zu viel Bürokratie"
  goals:              # Persönliche/berufliche Ziele
    - "Digitalisierung vorantreiben"

# VERHALTEN
behavior:
  techSavviness: "intermediate"  # beginner/intermediate/advanced/expert
  workStyle:           # Arbeitsweise
    - "Früh auf Baustelle"
  tools:              # Genutzte Tools
    - "WhatsApp Business"
  communicationPreference:  # Kommunikationskanäle
    - "Persönlich"
    - "WhatsApp"
  buyingBehavior: "Braucht Empfehlungen"
  informationSources:  # Wo informiert sich die Person?
    - "Handwerkskammer"

# MEMORO-KONTEXT
memoroContext:
  useCase:            # Wie würde Memoro genutzt?
    - "Baustellenprotokolle"
  benefits:           # Welche Vorteile sind relevant?
    - "Rechtssicherheit"
  concerns:           # Bedenken/Hindernisse
    - "Datenschutz"
  features:           # Wichtigste Features
    - "Offline-Funktion"
  priceSensitivity: "medium"      # low/medium/high
  adoptionLikelihood: "medium"    # low/medium/high/very-high
  influencers:        # Optional: Wer beeinflusst Entscheidung?
    - "Andere Handwerker"

# USER STORY
userStory: |
  Detaillierte Erzählung eines typischen Arbeitstages...

# SZENARIEN (Optional)
scenarios:
  - title: "Baustellenbegehung"
    description: "..."
    outcome: "..."

# ZITATE (Optional)
quotes:
  - "Ich verbringe mehr Zeit mit Papierkram als auf der Baustelle"

# MARKETING
marketing:
  segment: "secondary"     # primary/secondary/tertiary
  channels:               # Marketing-Kanäle
    - "Handwerkskammer"
  messaging:              # Kernbotschaften
    - "Rechtssicherheit"
  contentPreferences:     # Content-Formate
    - "Praxisberichte"

# META-INFORMATIONEN
status: "active"          # draft/active/archived
visibility: "internal"    # internal/team/stakeholders
tags:
  - "handwerk"
  - "b2b"
relatedPersonas:         # Optional: Verwandte Personas
  - "architekt-claudia"

# ZEITSTEMPEL
createdAt: 2024-12-01T10:00:00Z
lastUpdated: 2024-12-01T10:00:00Z
validatedAt: 2024-11-28T10:00:00Z    # Optional

# VERANTWORTLICHKEITEN
owner: "Marketing Team"
contributors:            # Optional
  - "Vertrieb"
---
```

### 2. Content-Bereich (Markdown)

Nach dem Frontmatter folgt der narrative Teil in Markdown:

```markdown
## Detaillierte Persona-Beschreibung

[Einführender Absatz über die Persona und ihre Bedeutung]

### Kernherausforderungen

1. **Challenge 1**: Beschreibung
2. **Challenge 2**: Beschreibung

### Memoro Value Proposition

[Wie löst Memoro die Probleme dieser Persona?]

### Kommunikationsansatz

[Wie sollten wir diese Persona ansprechen?]
```

## Schritt-für-Schritt Anleitung

### 1. Research & Datensammlung

Bevor du eine Persona erstellst:
- Analysiere vorhandene Kundendaten
- Führe Interviews mit echten Kunden
- Sammle Feedback von Vertrieb und Support
- Recherchiere Branchentrends

### 2. Datei erstellen

```bash
# Neue Persona-Datei anlegen
touch src/content/_personas/de/[rolle]-[name].mdx
```

### 3. Frontmatter ausfüllen

Kopiere die Struktur von einer bestehenden Persona und passe an:
- Alle Pflichtfelder müssen ausgefüllt sein
- Nutze realistische, spezifische Details
- Vermeide Stereotypen

### 4. User Story schreiben

Die User Story sollte:
- Einen typischen Tag/Situation beschreiben
- Konkrete Pain Points zeigen
- Emotional nachvollziehbar sein
- 3-5 Absätze lang sein

### 5. Content-Bereich verfassen

Ergänze:
- Zusammenfassung der Persona
- 3-5 Kernherausforderungen
- Memoro's Value Proposition
- Kommunikationsempfehlungen

### 6. Review & Validierung

- [ ] Lasse die Persona vom Team reviewen
- [ ] Validiere mit echten Kundendaten
- [ ] Aktualisiere `validatedAt` Datum
- [ ] Setze Status auf `active`

## Best Practices

### DO's ✅

- **Spezifisch sein**: "45 Jahre, Elektromeister" statt "mittleres Alter, Handwerker"
- **Echte Zitate verwenden**: Aus Kundeninterviews
- **Pain Points priorisieren**: Die wichtigsten zuerst
- **Konsistent bleiben**: Persona-Details sollten zusammenpassen
- **Regelmäßig aktualisieren**: Quartalsweise Review

### DON'Ts ❌

- **Keine Fantasie-Personas**: Basiere auf echten Daten
- **Keine Stereotypen**: Vermeide Klischees
- **Nicht zu vage**: "mag Technologie" → "nutzt WhatsApp Business täglich"
- **Nicht zu viele**: 3-5 Kern-Personas reichen meist
- **Nicht statisch**: Personas entwickeln sich weiter

## Persona-Typen für Memoro

### Primäre Zielgruppe
- Projektmanager:innen
- Team-Leads
- Consultants
- Sales Manager

### Sekundäre Zielgruppe
- Startup-Gründer:innen
- Handwerker:innen
- Coaches & Trainer
- Freelancer

### Tertiäre Zielgruppe
- HR-Manager:innen
- Forscher:innen
- Journalist:innen
- Anwält:innen

## Verwendung der Personas

### Im Produkt
- Feature-Priorisierung
- UX-Entscheidungen
- Onboarding-Flows

### Im Marketing
- Content-Strategie
- Kampagnen-Planung
- Messaging & Positioning

### Im Vertrieb
- Pitch-Anpassung
- Objection Handling
- Use-Case-Demos

## Wartung & Pflege

### Monatlich
- Neue Insights aus Kundengesprächen einarbeiten

### Quartalsweise
- Vollständiger Review aller aktiven Personas
- Validierung mit aktuellen Kundendaten
- Archivierung veralteter Personas

### Jährlich
- Strategische Überprüfung der Persona-Landschaft
- Neue Personas bei Markterweiterung

## Tools & Ressourcen

### Templates
- Basis-Template: `src/content/_personas/template.mdx.example`
- Interview-Leitfaden: `docs/persona-interview-guide.md`

### Analyse-Tools
- Customer Analytics Dashboard
- Support-Ticket-Analyse
- Sales-Call-Recordings

### Validierung
- A/B-Tests mit Persona-basiertem Content
- Conversion-Tracking nach Persona-Segment
- Regelmäßige Customer Surveys

## Kontakt & Support

**Fragen zu Personas?**
- Marketing Team: marketing@memoro.ai
- Product Team: product@memoro.ai

**Neue Persona vorschlagen?**
- Erstelle ein Issue im Repository
- Oder kontaktiere direkt das Marketing Team

---

*Letzte Aktualisierung: Dezember 2024*