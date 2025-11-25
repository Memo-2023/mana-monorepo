# Changelog Collection - Setup Documentation

## ✅ Was wurde erstellt?

### 1. Content Collection Schema
**Datei:** `src/content/config.ts`

Neue `changelogCollection` mit folgenden Features:
- 📝 5 Release-Typen (major, minor, patch, beta, alpha)
- 📊 Strukturierte Changes (Features, Improvements, Bugfixes, Breaking Changes)
- 🎨 Kategorisierung (generation, editing, api, mobile, web, etc.)
- 🌍 Platform Support (Web, iOS, Android, API)
- 📸 Media Support (Screenshots, Videos, Cover Images)
- 🔗 Related Content (Features, Tutorials, Blog Posts)
- 📈 Release Stats (Contributors, Development Days, Total Changes)
- 🌐 Multi-Language Support (en, de, fr, it, es)
- ⚠️ Breaking Changes mit Migration Guides
- 🐛 Bug Severity Levels (critical, major, minor)

### 2. Utility Functions
**Datei:** `src/utils/changelog.ts`

Helper-Funktionen für:
- Release Filtering (Type, Platform, Year)
- Latest & Featured Releases
- Version Parsing & Comparison
- Stats & Analytics
- Date Formatting & Time Ago
- Severity & Category Display
- Grouped Views (Year/Month)

### 3. Changelog Pages

#### Index Page
**Datei:** `src/pages/changelog/index.astro`

Features:
- 📊 Stats Dashboard (Total Releases, Latest Version, Years)
- ⭐ Latest Release Highlight Box
- 🔍 Filter by Year
- 📅 Grouped by Year & Month
- 🔔 Subscribe Options (Twitter, Discord, RSS)
- 🎨 Beautiful Card Layout

#### Detail Page
**Datei:** `src/pages/changelog/[slug].astro`

Features:
- 📑 Breadcrumb Navigation
- 🏷️ Version Badge & Release Type
- 📊 Release Stats (wenn verfügbar)
- 📸 Cover Images
- ✨ Feature Cards mit Bildern/Videos
- 🔧 Improvements List
- 🐛 Bug Fixes mit Severity
- ⚠️ Breaking Changes mit Migration Guides
- 📖 Full Markdown Content
- 🔗 External Links (Blog, Announcement, Discussion)

### 4. Components

#### VersionBadge
**Datei:** `src/components/changelog/VersionBadge.astro`

- Zeigt Version mit Icon & Typ
- Farbcodierung nach Release-Typ
- Optional: Type Label
- Responsive Design

**Farb-System:**
- **Major:** 🚀 Purple (`text-purple-400`)
- **Minor:** ✨ Blue (`text-blue-400`)
- **Patch:** 🔧 Green (`text-green-400`)
- **Beta:** 🧪 Yellow (`text-yellow-400`)
- **Alpha:** ⚡ Red (`text-red-400`)

#### ChangelogEntry
**Datei:** `src/components/changelog/ChangelogEntry.astro`

- Vollständige Release-Karte
- Change-Kategorien (Features, Improvements, Bugfixes, Breaking)
- Platform Badges
- "Recent" & "Highlighted" Badges
- Collapsible Changes (zeigt top 3, Rest via "Read More")
- Severity Indicators für Bugfixes
- Time Ago & Formatted Date

### 5. Beispiel-Changelog-Einträge

#### Release 1.5.0 - Major Release
**Datei:** `src/content/changelog/en/v1-5-0.md`

- Featured: Mobile App Launch
- 5 New Features (Mobile, Editing, Batch Generation, etc.)
- 5 Improvements (Performance, Accessibility, etc.)
- 4 Bug Fixes
- Stats: 45 Changes, 8 Contributors, 60 Days
- Cover Image & Full Blog Content

#### Release 1.4.2 - Patch Release
**Datei:** `src/content/changelog/en/v1-4-2.md`

- Bug Fixes & Stability
- Critical Bug Fixes
- Performance Improvements
- Simple, focused patch release

#### Release 1.4.0 - Minor Release
**Datei:** `src/content/changelog/en/v1-4-0.md`

- FLUX Pro Model Launch
- API v1 Release
- New Features & Improvements
- Blog Post Link

## 🎯 Features im Detail

### Release Types

```typescript
type ReleaseType = 'major' | 'minor' | 'patch' | 'beta' | 'alpha';
```

- **Major:** Breaking changes, große neue Features
- **Minor:** Neue Features ohne Breaking Changes
- **Patch:** Bugfixes, kleine Verbesserungen
- **Beta/Alpha:** Pre-Release Versionen

### Change Categories

**Features:**
- title, description, category, image, videoUrl, link

**Improvements:**
- title, description, category

**Bugfixes:**
- title, description, severity (critical/major/minor)

**Breaking Changes:**
- title, description, migration (guide)

### Platform Support

```typescript
platforms: ['web', 'mobile-ios', 'mobile-android', 'api', 'all']
```

Zeigt an, welche Plattformen von diesem Release betroffen sind.

### Stats (Optional)

```typescript
stats: {
  totalChanges: 45,
  contributors: 8,
  daysInDevelopment: 60
}
```

Perfekt für Major Releases, um Transparenz zu zeigen.

## 🚀 Wie verwenden?

### 1. Neuen Changelog-Eintrag erstellen

```bash
# Erstelle neue Datei in:
apps/landing/src/content/changelog/en/v1-6-0.md
```

### 2. Frontmatter Template

```yaml
---
version: "1.6.0"
title: "Video Generation & Real-Time Collaboration"
slug: "v1-6-0-video-generation"
releaseDate: 2025-02-01T00:00:00.000Z
type: "minor"
featured: true
highlighted: false
draft: false
summary: "Create AI-generated videos and collaborate in real-time with your team."
coverImage: "/images/changelog/v1-6-0-cover.jpg"
changes:
  features:
    - title: "🎥 AI Video Generation"
      description: "Generate short videos from text prompts..."
      category: "generation"
      image: "/images/changelog/video-gen.jpg"
      videoUrl: "https://youtube.com/watch?v=example"
    - title: "👥 Real-Time Collaboration"
      description: "Work together on images..."
      category: "organization"
  improvements:
    - title: "Faster gallery loading"
      description: "50% faster..."
      category: "performance"
  bugfixes:
    - title: "Fixed export issue"
      description: "..."
      severity: "major"
  breaking: []
platforms:
  - "web"
  - "mobile-ios"
  - "mobile-android"
relatedFeatures:
  - "video-generation"
relatedTutorials:
  - "getting-started-video"
blogPost: "/blog/v1-6-0-announcement"
announcementUrl: "https://twitter.com/picture/status/xxx"
stats:
  totalChanges: 32
  contributors: 6
  daysInDevelopment: 45
seoKeywords:
  - "AI video generation"
  - "picture video"
gitTag: "v1.6.0"
previousVersion: "1.5.0"
language: "en"
---

## Full Release Notes Content

Markdown content here...

## Video Generation

Detailed explanation...

## What's Next

Roadmap...
```

### 3. Breaking Changes

```yaml
breaking:
  - title: "API v2 Changes"
    description: "The old API endpoint /v1/generate is deprecated."
    migration: "Update your API calls to use /v2/generate. See migration guide at docs.picture.com/migration"
```

### 4. Severity Levels

```yaml
bugfixes:
  - title: "Fixed critical crash"
    description: "..."
    severity: "critical"  # Rot
  - title: "Fixed minor UI glitch"
    description: "..."
    severity: "minor"     # Gelb
```

### 5. Media einbinden

```yaml
features:
  - title: "New Feature"
    description: "..."
    image: "/images/changelog/feature.jpg"      # Screenshot
    videoUrl: "https://youtube.com/watch?v=xxx" # Demo Video
    link: "/features/new-feature"               # Learn More Link
```

## 📱 Routes

- **Index:** `/changelog`
- **Detail:** `/changelog/[slug]` (z.B. `/changelog/v1-5-0-mobile-app-launch`)
- **Filtered:** Filter by Year via Buttons

## 🔗 Integration

Die Changelog Collection integriert sich mit:
- ✅ Features Collection (via `relatedFeatures`)
- ✅ Tutorials Collection (via `relatedTutorials`)
- ✅ Blog Collection (via `blogPost` Link)

## 🎯 Best Practices

### Release-Titel
- ✅ "Mobile App Launch & Advanced Editing"
- ✅ "FLUX Pro & API v1 Launch"
- ❌ "Version 1.5.0" (zu generisch)

### Summary
- 1-2 Sätze
- Highlighte die wichtigsten Features
- Klar und prägnant

### Features beschreiben
- **Title:** Kurz und knackig (max. 60 Zeichen)
- **Description:** Was ist neu? Warum ist es nützlich?
- **Image/Video:** Zeige, don't tell!

### Breaking Changes
- Immer Migration Guide angeben
- Klar kommunizieren, was sich ändert
- Timeline für Deprecation

## 📊 Analytics Ideas

Die Collection unterstützt folgendes Tracking:
- Changelog Views
- Most Popular Releases
- Click-Through zu Features
- Download Rate nach Release
- Social Shares

## 🌐 Multi-Language

Aktuell unterstützt:
- 🇬🇧 English (en)
- 🇩🇪 German (de)
- 🇫🇷 French (fr)
- 🇮🇹 Italian (it)
- 🇪🇸 Spanish (es)

Neue Sprache hinzufügen:
```bash
mkdir src/content/changelog/de
# Kopiere EN-Einträge und übersetze
```

## 🎨 Design Features

### Version Badges
- Icon + Version Number + Optional Label
- Farbcodiert nach Release-Typ
- Responsive & Accessible

### Change Sections
- Separate Sections für Features, Improvements, Bugfixes, Breaking
- Collapsible in Index View (Top 3, dann "Read More")
- Full View in Detail Page

### Timeline View
- Gruppiert nach Jahr & Monat
- Sticky Year Headers
- Clean, scannable Layout

## 🔔 Engagement Features

### Subscribe Options
- Twitter Follow
- Discord Join
- RSS Feed

### Social Sharing
- Announcement URLs (Twitter, etc.)
- Discussion URLs (Discord, GitHub)
- Blog Post Links

## 🚧 Nächste Schritte

1. **RSS Feed generieren**
   - Automatischer Feed für Changelog
   - `/changelog/rss.xml`

2. **Email Notifications**
   - Newsletter Integration
   - Automatic Changelog Emails

3. **GitHub Integration**
   - Auto-generate from GitHub Releases
   - Link to GitHub Issues/PRs

4. **Version Comparison**
   - Compare two versions
   - See what changed between releases

5. **Search Funktion**
   - Search through changelog
   - Filter by change type

## 📖 Beispiel-Workflow

```bash
# 1. Neues Release vorbereiten
cd apps/landing/src/content/changelog/en

# 2. Datei erstellen
touch v1-6-0.md

# 3. Frontmatter ausfüllen (siehe Template oben)

# 4. Content schreiben

# 5. Draft Mode testen
# draft: true in frontmatter

# 6. Review & Publish
# draft: false setzen

# 7. Announcement posten
# Twitter, Discord, etc.

# 8. Blog Post verlinken
# blogPost: "/blog/v1-6-0" in frontmatter
```

## 🎉 Fertig!

Die Changelog Collection ist vollständig funktionsfähig und ready for production! 🚀

**Key Features:**
- ✅ Strukturierte Release Notes
- ✅ Beautiful Design
- ✅ SEO-optimiert
- ✅ Multi-Language
- ✅ Related Content
- ✅ Stats & Analytics Ready
- ✅ Breaking Changes Support
- ✅ Media Support (Images, Videos)

Happy Releasing! 📝✨
