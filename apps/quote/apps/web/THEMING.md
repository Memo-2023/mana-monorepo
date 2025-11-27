# 🎨 Theming System - Web App

## Übersicht

Die Quotes Web App verwendet ein zentrales Theming-System basierend auf **CSS Custom Properties** (CSS-Variablen) und **Tailwind CSS**. Dies ermöglicht:

✅ Konsistente Farben und Abstände in der gesamten App
✅ Dark Mode Support
✅ Einfache Wartbarkeit
✅ Tailwind Utility Classes + Custom CSS

---

## 📁 Struktur

```
apps/web/
├── src/
│   ├── app.css                      # Globale Styles & Theme-Variablen
│   ├── lib/stores/theme.ts          # Theme Store (Svelte Store)
│   └── routes/
│       ├── +layout.svelte           # Theme Import & Initialisierung
│       └── settings/+page.svelte    # Theme Toggle UI
├── tailwind.config.ts               # Tailwind Konfiguration mit Theme-Farben
```

---

## 🎨 CSS Variablen

Alle Theme-Variablen sind in `src/app.css` definiert:

### Farben

```css
/* Light Mode */
--color-primary: 102 126 234;        /* #667eea - Haupt-Lila */
--color-primary-dark: 118 75 162;    /* #764ba2 - Dunkleres Lila */
--color-background: 255 255 255;     /* Hintergrund */
--color-surface: 245 245 245;        /* Karten-Hintergrund */
--color-text-primary: 51 51 51;      /* Haupttext */
--color-text-secondary: 102 102 102; /* Sekundärtext */
--color-border: 224 224 224;         /* Rahmen */

/* Dark Mode */
[data-theme="dark"] {
  --color-background: 17 24 39;      /* Dunkler Hintergrund */
  --color-surface: 31 41 55;         /* Dunkle Karten */
  --color-text-primary: 243 244 246; /* Heller Text */
  ...
}
```

**Wichtig:** Die Farben sind im RGB-Format ohne `rgb()`, damit sie mit Tailwind's Opacity-Syntax funktionieren:

```css
/* ✅ Richtig */
background: rgb(var(--color-primary) / 0.5); /* 50% Opacity */

/* ❌ Falsch */
background: var(--color-primary);
```

### Spacing

```css
--spacing-xs: 0.25rem;  /* 4px */
--spacing-sm: 0.5rem;   /* 8px */
--spacing-md: 1rem;     /* 16px */
--spacing-lg: 1.5rem;   /* 24px */
--spacing-xl: 2rem;     /* 32px */
--spacing-2xl: 3rem;    /* 48px */
```

### Border Radius

```css
--radius-sm: 0.25rem;
--radius-md: 0.5rem;
--radius-lg: 0.75rem;
--radius-xl: 1rem;
--radius-full: 9999px;
```

### Shadows

```css
--shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
--shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
--shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
--shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
```

### Transitions

```css
--transition-fast: 150ms ease;
--transition-base: 200ms ease;
--transition-slow: 300ms ease;
```

---

## 🛠️ Verwendung

### Option 1: CSS Variablen (empfohlen für Custom CSS)

```css
.my-component {
  background: rgb(var(--color-surface));
  color: rgb(var(--color-text-primary));
  padding: var(--spacing-lg);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-md);
}
```

### Option 2: Tailwind Classes

```svelte
<div class="bg-surface text-text-primary p-lg rounded-md shadow-md">
  Content
</div>
```

### Option 3: Vordefinierte Utility Classes

```svelte
<button class="btn btn-primary">
  Click me
</button>

<div class="card">
  Card content
</div>

<input class="input" type="text" />
```

---

## 🌙 Dark Mode

### Theme Store verwenden

```svelte
<script lang="ts">
  import { theme } from '$lib/stores/theme';
  import { onMount } from 'svelte';

  onMount(() => {
    theme.init(); // Theme aus localStorage laden
  });

  function toggleTheme() {
    theme.toggle(); // Light ↔ Dark
  }
</script>

<button on:click={toggleTheme}>
  {$theme === 'light' ? '🌙' : '☀️'}
</button>
```

### Theme Store API

```typescript
// Zustand abrufen
$theme // 'light' | 'dark'

// Theme setzen
theme.set('dark')

// Theme umschalten
theme.toggle()

// Theme initialisieren (aus localStorage)
theme.init()
```

---

## 📝 Beispiele

### Beispiel 1: Neue Komponente mit Theme-Variablen

```svelte
<div class="quote-card">
  <p>Ein inspirierendes Zitat...</p>
</div>

<style>
  .quote-card {
    background: rgb(var(--color-surface-elevated));
    border: 1px solid rgb(var(--color-border));
    border-radius: var(--radius-lg);
    padding: var(--spacing-lg);
    box-shadow: var(--shadow-md);
    transition: transform var(--transition-base);
  }

  .quote-card:hover {
    transform: translateY(-2px);
    box-shadow: var(--shadow-lg);
  }
</style>
```

### Beispiel 2: Gradient mit Primary Colors

```css
.hero {
  background: linear-gradient(
    135deg,
    rgb(var(--color-primary)) 0%,
    rgb(var(--color-primary-dark)) 100%
  );
}
```

### Beispiel 3: Responsive mit Tailwind

```svelte
<div class="bg-background text-text-primary p-md md:p-xl rounded-lg">
  Responsive Content
</div>
```

---

## 🎯 Best Practices

1. **Immer Theme-Variablen verwenden** statt hardcoded Werte wie `#667eea`
2. **Konsistente Spacing-Werte** nutzen (`var(--spacing-md)` statt `1rem`)
3. **Dark Mode testen** - jede neue Komponente sollte in beiden Modi funktionieren
4. **RGB-Format beachten** - Farben müssen im Format `rgb(var(--color-name))` verwendet werden
5. **Transitions hinzufügen** für bessere UX (`transition: all var(--transition-base)`)

---

## 🔄 Migration bestehender Komponenten

### Vorher (❌)

```css
.component {
  background: #f5f5f5;
  color: #333;
  padding: 1rem;
  border-radius: 0.5rem;
  border: 1px solid #e0e0e0;
}
```

### Nachher (✅)

```css
.component {
  background: rgb(var(--color-surface));
  color: rgb(var(--color-text-primary));
  padding: var(--spacing-md);
  border-radius: var(--radius-md);
  border: 1px solid rgb(var(--color-border));
}
```

---

## 🚀 Weitere Schritte

- [ ] Alle Seiten auf das neue Theme-System migrieren
- [ ] Mehr vordefinierte Komponenten-Klassen hinzufügen
- [ ] Theme-Varianten hinzufügen (z.B. verschiedene Farbschemata)
- [ ] Animation-Utilities erweitern

---

## 📚 Ressourcen

- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [CSS Custom Properties (MDN)](https://developer.mozilla.org/en-US/docs/Web/CSS/--*)
- [Svelte Stores](https://svelte.dev/docs/svelte-store)
