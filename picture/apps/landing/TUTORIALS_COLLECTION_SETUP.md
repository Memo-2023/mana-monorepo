# Tutorials Collection - Setup Documentation

## ✅ Was wurde erstellt?

### 1. Content Collection Schema
**Datei:** `src/content/config.ts`

Neue `tutorialsCollection` mit folgenden Features:
- 📚 7 Kategorien (getting-started, generation, editing, advanced, workflows, tips-tricks, api)
- 🎯 3 Schwierigkeitsgrade (beginner, intermediate, advanced)
- 📹 Video-Support (YouTube, Vimeo, etc.)
- 📝 Strukturierte Schritte mit Zeitangaben
- 💡 Tips, Common Mistakes, Troubleshooting
- 📥 Downloadable Resources (Templates, Presets, Cheatsheets)
- 🔗 Related Content (Tutorials, Features, Use Cases)
- 🌍 Multi-Language Support (en, de, fr, it, es)

### 2. Utility Functions
**Datei:** `src/utils/tutorials.ts`

Helper-Funktionen für:
- Tutorial-Filtering (nach Category, Difficulty, Language)
- Featured & Popular Tutorials
- Tutorial Stats & Analytics
- Related Tutorials Logic
- Display Names & Icons für Categories & Difficulties
- Reading Time Estimation

### 3. Tutorial Pages

#### Index Page
**Datei:** `src/pages/tutorials/index.astro`

Features:
- 🔍 Search-Funktion
- 📊 Filter nach Category & Difficulty
- ⭐ Featured Tutorials Section
- 📈 Stats (Total Tutorials, Categories, Videos)
- 🎨 Responsive Grid Layout

#### Detail Page
**Datei:** `src/pages/tutorials/[slug].astro`

Features:
- 📑 Breadcrumb Navigation
- ⏱️ Estimated Time & Meta Info
- ✅ "What you'll learn" Section
- ⚠️ Prerequisites Warning
- 🎥 Video Embed Support
- 📍 Sticky Step Indicator (interaktiv!)
- 💡 Pro Tips Section
- ⚠️ Common Mistakes Section
- 🔧 Troubleshooting Section
- 📥 Downloadable Resources
- 🔗 Related Tutorials
- 🎨 Full Markdown Support mit Custom Styling

### 4. Components

#### TutorialCard
**Datei:** `src/components/tutorials/TutorialCard.astro`

- Zeigt Tutorial-Vorschau
- Badges (Featured, Popular, Video)
- Difficulty Indicator mit Farben
- Category Display
- Meta Info (Time, Steps, Difficulty)
- Hover-Effekte

#### StepIndicator
**Datei:** `src/components/tutorials/StepIndicator.astro`

Interactive Sticky Component:
- ✅ Sticky Positionierung beim Scrollen
- 📍 Automatische Schritt-Erkennung beim Scrollen
- ✓ Markiert abgeschlossene Schritte
- 🎯 Klick auf Schritt scrollt zur Section
- 🔽 Collapsible (ein-/ausklappbar)
- ⏱️ Zeigt Dauer pro Schritt

### 5. Beispiel-Tutorials

#### Tutorial 1: Getting Started
**Datei:** `src/content/tutorials/en/getting-started-first-image.md`

- Kategorie: getting-started
- Difficulty: beginner
- 4 Steps
- ~5 Minuten
- Für absolute Anfänger

#### Tutorial 2: Advanced Prompt Engineering
**Datei:** `src/content/tutorials/en/advanced-prompt-engineering.md`

- Kategorie: advanced
- Difficulty: advanced
- 5 Steps
- ~20 Minuten
- Mit Video & Downloadable Resources
- Umfangreiche Tips & Examples

## 🎨 Design Features

### Farb-System
- **Beginner:** 🟢 Green (`text-green-400`)
- **Intermediate:** 🟡 Yellow (`text-yellow-400`)
- **Advanced:** 🔴 Red (`text-red-400`)

### Icons
- 🚀 Getting Started
- 🎨 Image Generation
- ✂️ Image Editing
- 🧪 Advanced Techniques
- 🔄 Complete Workflows
- 💡 Tips & Tricks
- 🔌 API & Integrations

### Responsive Design
- Mobile-First Approach
- Grid Layout (1 col → 2 cols → 3 cols)
- Touch-Friendly Filters
- Smooth Animations

## 🚀 Wie verwenden?

### 1. Neues Tutorial erstellen

```bash
# Erstelle neue Datei in:
apps/landing/src/content/tutorials/en/my-new-tutorial.md
```

### 2. Frontmatter Template

```yaml
---
title: "Dein Tutorial Titel"
description: "Kurze SEO-Beschreibung"
slug: "dein-tutorial-slug"
icon: "🎨"
coverImage: "/images/tutorials/cover.jpg"
category: "getting-started"
difficulty: "beginner"
featured: true
popular: false
language: "en"
steps:
  - title: "Erster Schritt"
    duration: "2 minutes"
  - title: "Zweiter Schritt"
    duration: "3 minutes"
estimatedTime: "10 minutes"
whatYouWillLearn:
  - "Du lernst..."
  - "Du verstehst..."
examplePrompts:
  - "Ein Beispiel Prompt"
tips:
  - "Pro Tip 1"
  - "Pro Tip 2"
publishDate: 2025-01-15T00:00:00.000Z
lastUpdated: 2025-01-15T00:00:00.000Z
---

## Step 1: Erster Schritt

Content hier...

## Step 2: Zweiter Schritt

Content hier...
```

### 3. Tutorial mit Video

```yaml
videoUrl: "https://youtube.com/watch?v=xxx"
videoDuration: "15:30"
hasVideo: true
```

### 4. Downloadable Resources

```yaml
downloadableResources:
  - title: "Cheat Sheet"
    url: "/downloads/cheat-sheet.pdf"
    type: "cheatsheet"
  - title: "Example Template"
    url: "/downloads/template.psd"
    type: "template"
```

## 📱 Routes

- **Index:** `/tutorials`
- **Detail:** `/tutorials/[slug]`
- **Filtered:** `/tutorials?category=getting-started&difficulty=beginner`

## 🔗 Integration

Die Tutorials Collection ist vollständig integriert mit:
- ✅ Features Collection (via `relatedFeatures`)
- ✅ Use Cases Collection (via `relatedUseCases`)
- ✅ Blog Collection (kann Cross-Links erstellen)

## 🎯 SEO Features

- Structured Data Ready
- Meta Descriptions
- Keywords Array
- Target Audience Definition
- Breadcrumbs
- Last Updated Date
- Estimated Reading/Completion Time

## 🌍 Multi-Language Support

Aktuell unterstützt:
- 🇬🇧 English (en)
- 🇩🇪 German (de)
- 🇫🇷 French (fr)
- 🇮🇹 Italian (it)
- 🇪🇸 Spanish (es)

Neue Sprache hinzufügen:
```bash
mkdir src/content/tutorials/de
# Tutorial-Datei erstellen mit language: "de"
```

## 📊 Analytics Ideas

Die Collection unterstützt folgende Tracking-Optionen:
- Tutorial Views
- Step Completion Rate
- Download Conversions
- Video Watch Time
- Related Content Clicks

## 🚧 Nächste Schritte

1. **Mehr Tutorials erstellen**
   - Intermediate Level Tutorials
   - API-Spezifische Tutorials
   - Video-Tutorials einbinden

2. **Navigation erweitern**
   - Tutorial-Link im Header/Footer
   - Related Tutorials in anderen Collections

3. **Features hinzufügen**
   - Progress Tracking (LocalStorage)
   - Bookmark-Funktion
   - Print-Friendly Styles
   - Code Syntax Highlighting

4. **SEO optimieren**
   - Structured Data (JSON-LD)
   - OpenGraph Tags
   - Tutorial Sitemap

## 🎉 Fertig!

Die Tutorials Collection ist vollständig funktionsfähig und kann sofort verwendet werden. Die Struktur ist skalierbar und kann einfach erweitert werden.

Happy Teaching! 📚✨
