# Anleitung: Neue Teammitglieder hinzufügen

Diese Anleitung erklärt Schritt für Schritt, wie neue Teammitglieder zur Memoro-Website hinzugefügt werden.

## Übersicht

Für jedes neue Teammitglied müssen folgende Dateien erstellt werden:

1. **Author-Einträge** (für Blog-Posts und Content-Erstellung)
   - Deutsche Version: `/src/content/authors/[name].md`
   - Englische Version: `/src/content/authors/[name]-en.md`

2. **Team-Einträge** (für die Team-Seite)
   - Deutsche Version: `/src/content/team/de/[name].mdx`
   - Englische Version: `/src/content/team/en/[name].mdx`

3. **Profilbild** (optional)
   - Speicherort: `/public/images/team/[name].jpg`

## Schritt-für-Schritt Anleitung

### 1. Namenskonvention festlegen

- Verwende Kleinbuchstaben und Bindestriche für Dateinamen
- Beispiel: `Victoria Brückner` → `victoria-brueckner`
- Konsistenz ist wichtig für alle Dateien!

### 2. Author-Einträge erstellen

#### Deutsche Version (`/src/content/authors/[name].md`)

```markdown
---
name: "Vollständiger Name"
displayName: "Anzeigename"
bio: "Kurze Beschreibung der Person und ihrer Rolle bei Memoro. Max. 2-3 Sätze."
role: "Offizielle Berufsbezeichnung"
avatar: "/images/team/[name].jpg"
appearance: "Detaillierte Beschreibung des Aussehens für KI-generierte Bilder. Inkludiere: Alter, Haarfarbe, Augenfarbe, typische Kleidung, Setting für Fotos."
social:
  linkedin: "linkedin-username"
  twitter: "twitter-handle"
  github: "github-username"
  email: "email@memoro.ai"
  website: "https://personal-website.com"
  medium: "@medium-handle"
expertise: ["Fachgebiet 1", "Fachgebiet 2", "Fachgebiet 3"]
topics: ["Thema 1", "Thema 2", "Thema 3"]
writingPrompt: "Detaillierte Anleitung für KI, wie diese Person schreibt. Inkludiere: Tonalität, Stil, typische Phrasen, Fachbegriffe, Persönlichkeit."
isActive: true
isFeatured: false  # true für Führungskräfte
showInDirectory: true
permissions:
  canPublish: true
  canEditOthers: false  # true für Führungskräfte
  isAdmin: false  # true für Gründer/CTO
stats:
  totalPosts: 0
  totalViews: 0
  totalLikes: 0
  joinedDate: 2024-01-01
lang: "de"
preferredLanguages: ["de", "en"]
slug: "[name]"
createdAt: 2024-01-01
lastActive: 2025-07-27
---

# Über [Name]

Ausführliche Beschreibung der Person, ihrer Rolle, Erfahrung und Beiträge bei Memoro.

## Werdegang

Details zur Karriere und wie die Person zu Memoro kam.

## Schwerpunkte bei Memoro

Was die Person bei Memoro macht und wofür sie verantwortlich ist.

## Persönliche Note

Hobbys, Interessen, Fun Facts - was die Person menschlich macht.
```

#### Englische Version (`/src/content/authors/[name]-en.md`)

- Gleiche Struktur wie die deutsche Version
- Alle Texte auf Englisch übersetzen
- `lang: "en"` setzen

### 3. Team-Einträge erstellen

#### Deutsche Version (`/src/content/team/de/[name].mdx`)

```markdown
---
title: "Vollständiger Name"
role: "Berufsbezeichnung"
description: "Kurze, prägnante Beschreibung (1-2 Sätze) für die Team-Übersicht."
image: "/images/team/[name].jpg"
social:
  linkedin: "https://linkedin.com/in/[username]"
  twitter: "https://twitter.com/[handle]"
  github: "https://github.com/[username]"
  email: "[name]@memoro.ai"
lang: "de"
category: "kernteam"  # oder "freelance", "mentoren", "unterstuetzer", "alumni"
lastUpdated: 2025-07-27
order: 10  # Reihenfolge in der Team-Liste
categoryOrder: 10  # Reihenfolge innerhalb der Kategorie
---

Einleitender Absatz über die Person und ihre Bedeutung für Memoro.

## Hauptüberschrift

Detaillierte Beschreibung der Rolle, Verantwortlichkeiten und Erfolge.

### Unterüberschriften

Weitere Details zu spezifischen Bereichen:
- Expertise
- Projekte
- Philosophie
- Arbeitsweise

## Persönliche Seite

Was macht die Person außerhalb der Arbeit? Hobbys, Interessen, etc.

## Zitat oder Vision

Ein inspirierendes Zitat oder die persönliche Vision für Memoro.
```

#### Englische Version (`/src/content/team/en/[name].mdx`)

- Gleiche Struktur wie die deutsche Version
- Alle Texte auf Englisch übersetzen
- `lang: "en"` setzen

### 4. Profilbild hinzufügen

- Format: JPG, mindestens 800x800px
- Dateiname: `[name].jpg` (gleiche Namenskonvention)
- Speicherort: `/public/images/team/`
- Für KI-Mitarbeiter: Suffix `-ai` verwenden (z.B. `melissa-schreiber-ai.jpg`)

### 5. Image Prompt für KI-generierte Bilder

Falls kein echtes Foto vorhanden ist, verwende diesen Prompt-Stil:

```
Portrait photo of [appearance description], 
[pose/activity], 
[setting/background], 
[lighting]
```

Beispiel:
```
Portrait photo of a professional woman in her early 30s with shoulder-length 
dark blonde hair in a loose bun, warm brown eyes showing intelligence and 
empathy, confident friendly smile, wearing elegant business-casual attire 
in muted colors with a colorful scarf, standing in a modern bright office 
with whiteboards and sticky notes in the background, natural window lighting
```

## Wichtige Felder im Detail

### `role` (Berufsbezeichnung)
- Verwende offizielle Titel
- Beispiele: "CEO", "Head of Product", "Senior Software Engineer"

### `category` (Team-Kategorie)
- `kernteam`: Vollzeit-Mitarbeiter
- `freelance`: Freiberufliche Mitarbeiter
- `mentoren`: Mentoren und Berater
- `unterstuetzer`: Unterstützer und Investoren
- `alumni`: Ehemalige Mitarbeiter

### `expertise` (Fachgebiete)
- 5-8 Begriffe, die die Kernkompetenzen beschreiben
- Mischung aus technischen und soft skills

### `writingPrompt` (Schreibstil für KI)
Wichtig für konsistente Content-Erstellung:
- Beschreibe Tonalität (formell/informell)
- Typische Phrasen oder Ausdrücke
- Fachbegriffe die verwendet werden
- Persönlichkeitsmerkmale im Schreibstil

### `permissions` (Berechtigungen)
- `canPublish`: Kann Blog-Posts veröffentlichen
- `canEditOthers`: Kann Inhalte anderer bearbeiten
- `isAdmin`: Hat Admin-Rechte

## Checkliste

- [ ] Namenskonvention festgelegt
- [ ] Author-Eintrag (DE) erstellt
- [ ] Author-Eintrag (EN) erstellt
- [ ] Team-Eintrag (DE) erstellt
- [ ] Team-Eintrag (EN) erstellt
- [ ] Profilbild hinzugefügt oder Image Prompt erstellt
- [ ] Alle Links (Social Media) überprüft
- [ ] `order` und `categoryOrder` angepasst
- [ ] Build lokal getestet (`npm run build`)

## Häufige Fehler vermeiden

1. **Inkonsistente Namenskonvention**: Alle Dateien müssen den gleichen Namen verwenden
2. **Fehlende Übersetzungen**: Beide Sprachen müssen vollständig sein
3. **Falsche Bildpfade**: Immer mit `/images/team/` beginnen
4. **Ungültige Social Media Links**: Vollständige URLs verwenden
5. **Fehlende required fields**: Alle Pflichtfelder ausfüllen

## Beispiele

Siehe existierende Teammitglieder als Referenz:
- Till Schneider (CEO)
- Nils Weiser (CTO)
- Victoria Brückner (Head of Product)
- Oliver Wolkenstein (Senior Software Engineer)
- Emma Lichtblick (Head of Customer Success)
- Melissa Schreiber (Marketing AI)

## Support

Bei Fragen oder Problemen:
1. Überprüfe die Astro-Dokumentation für Content Collections
2. Schaue dir existierende Team-Einträge als Beispiele an
3. Führe `npm run astro check` aus, um TypeScript-Fehler zu finden