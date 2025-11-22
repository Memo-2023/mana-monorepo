# Skeleton Loader - Komplette Übersicht

## ✅ Verfügbare Page Skeletons

### 1. **DashboardSkeleton** ✅ Integriert
- **Datei**: `pages/DashboardSkeleton.svelte`
- **Verwendet in**: `/dashboard/+page.svelte`
- **Struktur**: Zwei-Spalten Layout mit Memo-Liste und Detail-View
- **Props**:
  - `memoCount?: number` (Default: 8)
  - `leftColumnWidth?: number` (Default: 400)

**Features**:
- Memo-Liste mit Titel, Transcript-Vorschau, Footer
- Recording Button Platzhalter (kreisrund)
- Opacity Staggering für visuelle Tiefe

---

### 2. **TagsPageSkeleton** ✅ Integriert
- **Datei**: `pages/TagsPageSkeleton.svelte`
- **Verwendet in**: `/tags/+page.svelte`
- **Struktur**: Header + Grid von Tag-Karten
- **Props**:
  - `tagCount?: number` (Default: 12)

**Features**:
- Tag-Karten mit Farb-Dot, Name, Description
- Usage Count & Action Buttons
- Responsive Grid (1/2/3 Spalten)

---

### 3. **BlueprintsPageSkeleton** ✅ Integriert
- **Datei**: `pages/BlueprintsPageSkeleton.svelte`
- **Verwendet in**: `/blueprints/+page.svelte`
- **Struktur**: Filter Pills + Blueprint Cards Grid
- **Props**:
  - `blueprintCount?: number` (Default: 9)
  - `showFilters?: boolean` (Default: true)

**Features**:
- Category Filter Pills (horizontal scroll)
- Blueprint Cards mit Category Badge, Title, Description
- Prompts Count Indikator
- Responsive Grid

---

### 4. **StatisticsPageSkeleton** ✅ Integriert
- **Datei**: `pages/StatisticsPageSkeleton.svelte`
- **Verwendet in**: `/statistics/+page.svelte`
- **Struktur**: Quick Stats Cards + Large Analysis Cards
- **Props**:
  - `showCards?: boolean` (Default: true)

**Features**:
- 4 Quick Stats Cards (horizontal scroll)
- Overview, Productivity, Insights, Engagement Cards
- Chart Platzhalter (Balken, Kreise)
- Responsive Grid

---

### 5. **SettingsPageSkeleton** ✅ Erstellt (Optional)
- **Datei**: `pages/SettingsPageSkeleton.svelte`
- **Verwendet in**: _Optional - Settings lädt synchron_
- **Struktur**: User Info + Theme + Toggles + Sections
- **Props**:
  - `showAllSections?: boolean` (Default: true)

**Features**:
- User Info Card mit Avatar
- Theme Mode Buttons (3er Grid)
- Theme Variant Buttons (4er Grid)
- Settings Toggles
- Support Section
- App Info
- Danger Zone

**Hinweis**: Settings lädt keine async Daten, daher ist der Skeleton optional und für zukünftige Verwendung verfügbar.

---

### 6. **SubscriptionPageSkeleton** ✅ Erstellt (Optional)
- **Datei**: `pages/SubscriptionPageSkeleton.svelte`
- **Verwendet in**: _Optional - Daten aus JSON_
- **Struktur**: Usage + Cost + Subscriptions + Packages
- **Props**:
  - `showUsageSection?: boolean` (Default: true)
  - `subscriptionCount?: number` (Default: 4)
  - `packageCount?: number` (Default: 3)

**Features**:
- Usage Card mit Progress Bars
- Cost Card mit Cost Items
- Billing Toggle
- Subscription Cards Grid (mit Features Liste)
- Package Cards Grid

**Hinweis**: Aktuell werden Daten aus statischen JSON Files geladen. Der Skeleton ist für zukünftige API-Integration vorbereitet.

---

### 7. **SpacesPageSkeleton** ✅ Erstellt (Optional)
- **Datei**: `pages/SpacesPageSkeleton.svelte`
- **Verwendet in**: _Optional - "Coming Soon" Page_
- **Struktur**: Header + Spaces Grid
- **Props**:
  - `spaceCount?: number` (Default: 6)
  - `showCreateButton?: boolean` (Default: true)

**Features**:
- Space Cards mit Icon, Name, Description
- Members & Stats Indikatoren
- Action Buttons
- Responsive Grid

**Hinweis**: Spaces Page zeigt aktuell nur "Coming Soon". Der Skeleton ist für zukünftige Feature-Implementierung bereit.

---

### 8. **UploadPageSkeleton** ✅ Integriert
- **Datei**: `pages/UploadPageSkeleton.svelte`
- **Verwendet in**: `/upload/+page.svelte`
- **Struktur**: File Upload Card + Options Form
- **Props**:
  - `showOptionsForm?: boolean` (Default: true)

**Features**:
- File Upload Card mit Drag & Drop Area
- Options Form (Title, Blueprint, Date/Time, Languages, Diarization)
- Upload Buttons (Cancel, Upload & Verarbeiten)
- Einheitliche Breite für alle Container (max-w-4xl)
- Kompakte Darstellung ohne Scrollen
- Datum und Uhrzeit standardmäßig auf aktuelle Zeit gesetzt

**Hinweis**: Wird angezeigt während Blueprints vom Server geladen werden. Nur File Upload, keine Recording-Funktionalität.

---

## 🛠️ Utility Komponenten

### SkeletonBox
```svelte
<SkeletonBox
  width="200px"
  height="24px"
  borderRadius="8px"
  className="mb-2"
/>
```

**Verwendung**: Einzelne animierte Platzhalter-Boxen

### SkeletonText
```svelte
<SkeletonText
  lines={3}
  width={['100%', '90%', '70%']}
  variant="body"
/>
```

**Verwendung**: Mehrere Text-Linien mit verschiedenen Breiten

---

## 📊 Integrationsstatus

| Page | Skeleton | Status | Loading State |
|------|----------|--------|---------------|
| Dashboard | ✅ | Integriert | Async (Memos/Tags laden) |
| Tags | ✅ | Integriert | Async (Tags laden) |
| Blueprints | ✅ | Integriert | Async (Blueprints laden) |
| Statistics | ✅ | Integriert | Async (Stats berechnen) |
| Upload | ✅ | Integriert | Async (Blueprints/Spaces laden) |
| Settings | ✅ | Verfügbar | Synchron (kein Loading) |
| Subscription | ✅ | Verfügbar | Synchron (JSON Files) |
| Spaces | ✅ | Verfügbar | "Coming Soon" Page |

---

## 🎨 Design Patterns

### Opacity Staggering
```svelte
{#each items as item, i}
  <div style="opacity: {Math.max(0.4, 1 - i * 0.08)};">
    <!-- Skeleton -->
  </div>
{/each}
```

**Effekt**: Items werden nach unten hin transparenter (40% min)

### Shimmer Animation
- **Dauer**: 1.5s
- **Easing**: ease-in-out
- **Loop**: infinite
- **Farben**: CSS Variables `--skeleton-base` & `--skeleton-highlight`

### Responsive Grids
```svelte
grid-cols-1 md:grid-cols-2 lg:grid-cols-3
```

**Breakpoints**:
- Mobile: 1 Spalte
- Tablet (md): 2 Spalten
- Desktop (lg): 3 Spalten

---

## 🚀 Zukünftige Erweiterungen

### Potenzielle neue Skeletons:
- **MemoDetailSkeleton**: Für einzelne Memo-Ansicht
- **SearchResultsSkeleton**: Für Such-Ergebnisse
- **NotificationsSkeleton**: Für Benachrichtigungs-Liste
- **ProfileSkeleton**: Für User-Profile Ansicht

### Verbesserungen:
- **Staggered Delays**: Zeitversetztes Erscheinen von Elementen
- **Shimmer Direction**: Verschiedene Richtungen (top-to-bottom, diagonal)
- **Color Variations**: Theme-spezifische Skeleton Farben

---

## 📝 Verwendungs-Checkliste

Wenn du einen neuen Skeleton erstellst:

1. ✅ Erstelle Datei in `pages/` oder passender Kategorie
2. ✅ Nutze `SkeletonBox` für konsistente Animation
3. ✅ Implementiere Opacity Staggering für Listen
4. ✅ Matche exakte Struktur der finalen Komponente
5. ✅ Füge Props für Flexibilität hinzu
6. ✅ Exportiere in `index.ts`
7. ✅ Dokumentiere in README.md
8. ✅ Teste in Light & Dark Mode
9. ✅ Teste Responsive Verhalten
10. ✅ Integriere in Seite (falls applicable)

---

**Letzte Aktualisierung**: 2025
**Version**: 1.1.0
**Autor**: Memoro Team
