# Skeleton Loader System

Konsistente, wiederverwendbare Skeleton Loader für bessere Loading States in der Memoro Web App.

## 📁 Struktur

```
skeletons/
├── utils/                      # Basis-Komponenten
│   ├── SkeletonBox.svelte     # Animierte Box mit Shimmer-Effekt
│   └── SkeletonText.svelte    # Text-Linien für verschiedene Größen
├── pages/                      # Full-Page Skeletons
│   ├── DashboardSkeleton.svelte
│   ├── TagsPageSkeleton.svelte
│   ├── BlueprintsPageSkeleton.svelte
│   └── StatisticsPageSkeleton.svelte
└── index.ts                    # Zentrale Exports
```

## 🎨 Design Principles

### 1. **Struktur-Treue**
Skeleton Loader spiegeln exakt das finale Layout wider:
- Gleiche Padding/Margins
- Gleiche Höhen/Breiten
- Gleiche Border Radius

### 2. **Konsistente Animation**
- **Shimmer Effect**: 1.5s ease-in-out infinite
- **Opacity Staggering**: Elemente werden nach unten hin transparenter
```svelte
style="opacity: {Math.max(0.4, 1 - i * 0.08)};"
```

### 3. **Theme-Aware**
Automatische Anpassung an Light/Dark Mode über CSS Variables:
```css
:root {
  --skeleton-base: #e5e7eb;
  --skeleton-highlight: #f3f4f6;
}

.dark {
  --skeleton-base: #2a2a2a;
  --skeleton-highlight: #3a3a3a;
}
```

## 🚀 Verwendung

### Page-Level Skeleton

```svelte
<script>
  import { DashboardSkeleton } from '$lib/components/skeletons';

  let loading = $state(true);
</script>

{#if loading}
  <DashboardSkeleton />
{:else}
  <!-- Your content -->
{/if}
```

### Custom Skeleton mit SkeletonBox

```svelte
<script>
  import { SkeletonBox } from '$lib/components/skeletons';
</script>

<div class="my-component">
  <SkeletonBox width="200px" height="24px" borderRadius="8px" />
  <SkeletonBox width="100%" height="16px" className="mt-2" />
</div>
```

### SkeletonText für mehrere Zeilen

```svelte
<script>
  import { SkeletonText } from '$lib/components/skeletons';
</script>

<!-- 3 Text-Zeilen mit verschiedenen Breiten -->
<SkeletonText
  lines={3}
  width={['100%', '90%', '70%']}
  variant="body"
/>
```

## 🎯 Verfügbare Komponenten

### SkeletonBox Props

| Prop | Type | Default | Beschreibung |
|------|------|---------|--------------|
| `width` | string | `'100%'` | Breite der Box |
| `height` | string | `'20px'` | Höhe der Box |
| `borderRadius` | string | `'4px'` | Abrundung |
| `className` | string | `''` | Zusätzliche CSS-Klassen |

### SkeletonText Props

| Prop | Type | Default | Beschreibung |
|------|------|---------|--------------|
| `lines` | number | `2` | Anzahl der Zeilen |
| `width` | string[] | `['100%', '80%']` | Breiten pro Zeile |
| `variant` | 'body' \| 'heading' \| 'caption' | `'body'` | Text-Größe |
| `className` | string | `''` | Zusätzliche CSS-Klassen |

### Page Skeletons Props

#### DashboardSkeleton
```typescript
{
  memoCount?: number;        // Default: 8
  leftColumnWidth?: number;  // Default: 400
}
```

#### TagsPageSkeleton
```typescript
{
  tagCount?: number;  // Default: 12
}
```

#### BlueprintsPageSkeleton
```typescript
{
  blueprintCount?: number;  // Default: 9
  showFilters?: boolean;    // Default: true
}
```

#### StatisticsPageSkeleton
```typescript
{
  showCards?: boolean;  // Default: true
}
```

#### SettingsPageSkeleton
```typescript
{
  showAllSections?: boolean;  // Default: true
}
```

#### SubscriptionPageSkeleton
```typescript
{
  showUsageSection?: boolean;   // Default: true
  subscriptionCount?: number;   // Default: 4
  packageCount?: number;        // Default: 3
}
```

#### SpacesPageSkeleton
```typescript
{
  spaceCount?: number;          // Default: 6
  showCreateButton?: boolean;   // Default: true
}
```

#### UploadPageSkeleton
```typescript
{
  showOptionsForm?: boolean;  // Default: true
}
```

## 🎨 Anpassung an eigene Themes

Füge in deiner `app.css` oder Theme-Datei hinzu:

```css
/* Custom Theme Colors */
:root[data-theme="custom"] {
  --skeleton-base: #your-base-color;
  --skeleton-highlight: #your-highlight-color;
}

.dark[data-theme="custom"] {
  --skeleton-base: #your-dark-base;
  --skeleton-highlight: #your-dark-highlight;
}
```

## ✨ Best Practices

### 1. Smooth Transitions
```svelte
<div class="fade-in">
  {#if !loading}
    <!-- Content -->
  {/if}
</div>

<style>
  .fade-in {
    animation: fadeIn 0.3s ease-in;
  }

  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
</style>
```

### 2. Accessibility
```svelte
<div role="status" aria-label="Loading content">
  <SkeletonBox />
</div>
```

### 3. Realistische Platzhalter
- Verwende ähnliche Dimensionen wie dein echter Content
- Nutze Opacity Staggering für Listen
- Zeige wichtige UI-Elemente (Header, Navigation) auch im Skeleton

## 📚 Weitere Ressourcen

- [Skeleton Screens Best Practices](https://www.nngroup.com/articles/skeleton-screens/)
- [Svelte 5 Runes Documentation](https://svelte.dev/docs/svelte/what-are-runes)

## 🐛 Troubleshooting

**Problem**: Skeleton wird nicht angezeigt
- ✅ Import korrekt? `import { DashboardSkeleton } from '$lib/components/skeletons';`
- ✅ CSS Variables definiert in app.css?

**Problem**: Animation ruckelt
- ✅ `useNativeDriver` nicht verfügbar in Web (nur React Native)
- ✅ CSS Animation sollte smooth laufen

**Problem**: Theme-Farben passen nicht
- ✅ CSS Variables in `:root` und `.dark` definiert?
- ✅ Theme-Selector korrekt im HTML?

---

**Version**: 1.0.0
**Erstellt**: 2025
**Maintainer**: Memoro Team
