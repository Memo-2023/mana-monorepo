# Design & UX Guidelines

Richtlinien für konsistentes Design und User Experience im ManaCore Monorepo.

## Grundprinzipien

### 1. Inline vor Modal

**Bevorzuge Inline-Interaktionen** statt separater Modals, um Kontext zu bewahren und visuelle Unruhe zu vermeiden.

```
BEVORZUGT: Inline-Expansion
┌─────────────────────────────┐
│ ○ Task Title            ▼  │  ← Klick klappt auf
├─────────────────────────────┤
│ [Titel-Input]               │
│ [Beschreibung]              │
│ [Weitere Felder...]         │
│ [Abbrechen] [Speichern]     │
└─────────────────────────────┘

VERMEIDEN: Separate Modals für einfache Bearbeitungen
```

**Ausnahmen für Modals:**

- Bestätigungsdialoge (Löschen, kritische Aktionen)
- Komplexe Wizards mit mehreren Schritten
- Vollbild-Medienansichten
- Auth-Gates (Login-Aufforderung)

### 2. Mobile-First

Designs beginnen mit der mobilen Ansicht und werden für größere Screens erweitert.

```css
/* Mobile-First Breakpoints */
@media (min-width: 640px) {
	/* sm */
}
@media (min-width: 768px) {
	/* md */
}
@media (min-width: 1024px) {
	/* lg */
}
@media (min-width: 1280px) {
	/* xl */
}
```

### 3. Reduktion vor Addition

- Weniger UI-Elemente = bessere UX
- Leere Sektionen ausblenden statt "Keine Daten" anzeigen
- Progressive Disclosure: Details erst bei Bedarf zeigen

## Layout & Spacing

### Spacing-System

Verwende konsistente Abstände basierend auf 4px-Raster:

| Token     | Wert | Verwendung                        |
| --------- | ---- | --------------------------------- |
| `0.25rem` | 4px  | Minimaler Abstand (Icons, Badges) |
| `0.5rem`  | 8px  | Kompakte Elemente                 |
| `0.75rem` | 12px | Standard innerhalb Komponenten    |
| `1rem`    | 16px | Standard zwischen Elementen       |
| `1.5rem`  | 24px | Sektions-Padding                  |
| `2rem`    | 32px | Große Abstände                    |

### Container & Max-Width

```css
/* Standard Content Container */
max-width: 640px; /* Formulare, Listen */
max-width: 800px; /* Breitere Inhalte */
max-width: 1200px; /* Dashboard-Layouts */
```

### Border-Radius

| Verwendung                     | Wert                           |
| ------------------------------ | ------------------------------ |
| Kleine Elemente (Badges, Tags) | `9999px` (pill) oder `0.25rem` |
| Buttons, Inputs                | `0.5rem` - `0.75rem`           |
| Cards, Modals                  | `0.75rem` - `1.5rem`           |
| Große Container                | `1rem` - `1.5rem`              |

## Farben & Theming

### CSS Custom Properties

Alle Farben über CSS-Variablen definieren für Dark Mode Kompatibilität:

```css
/* Richtig */
color: hsl(var(--color-foreground));
background: hsl(var(--color-surface));
border-color: hsl(var(--color-border));

/* Falsch - hardcoded Farben */
color: #374151;
background: white;
```

### Semantische Farben

| Variable                   | Verwendung                     |
| -------------------------- | ------------------------------ |
| `--color-primary`          | Primäre Aktionen, Links, Fokus |
| `--color-foreground`       | Haupttext                      |
| `--color-muted-foreground` | Sekundärtext, Platzhalter      |
| `--color-surface`          | Hintergründe                   |
| `--color-border`           | Rahmen, Trennlinien            |
| `--color-destructive`      | Lösch-Aktionen, Fehler         |
| `--color-success`          | Erfolgsmeldungen               |
| `--color-warning`          | Warnungen                      |

### Dark Mode

Immer beide Modi berücksichtigen:

```css
.element {
	background: rgba(255, 255, 255, 0.85);
	border: 1px solid rgba(0, 0, 0, 0.08);
}

:global(.dark) .element {
	background: rgba(255, 255, 255, 0.12);
	border: 1px solid rgba(255, 255, 255, 0.15);
}
```

## Animationen & Transitions

### Standard-Timings

| Typ                       | Dauer           | Easing        |
| ------------------------- | --------------- | ------------- |
| Micro-Interaktionen       | `150ms`         | `ease`        |
| UI-Feedback               | `200ms`         | `ease-out`    |
| Layout-Änderungen         | `200ms - 300ms` | `ease-out`    |
| Aufmerksamkeits-Animation | `2s - 3s`       | `ease-in-out` |

### Transition-Beispiele

```css
/* Hover-Effekte */
transition: all 0.15s ease;

/* Expand/Collapse */
transition: all 0.2s ease-out;

/* Subtile Aufmerksamkeit (z.B. Float-Animation) */
animation: float 3s ease-in-out infinite;

@keyframes float {
	0%,
	100% {
		transform: translateY(0);
	}
	50% {
		transform: translateY(-8px);
	}
}
```

### Wann animieren

**Ja:**

- Zustandsänderungen (expand, collapse, toggle)
- Feedback bei Aktionen (Checkbox, Button-Press)
- Aufmerksamkeit lenken (leere Zustände)
- Smooth Scrolling

**Nein:**

- Initiales Laden von Inhalten
- Jeder einzelne Listen-Eintrag
- Performance-kritische Bereiche
- Wenn `prefers-reduced-motion` aktiv

```css
@media (prefers-reduced-motion: reduce) {
	* {
		animation-duration: 0.01ms !important;
		transition-duration: 0.01ms !important;
	}
}
```

## Komponenten-Patterns

### Buttons

```
Hierarchie:
1. Primary   → Hauptaktion (1x pro Ansicht)
2. Secondary → Alternative Aktionen
3. Ghost     → Tertiäre Aktionen, Links
4. Danger    → Destruktive Aktionen
```

```css
/* Primary */
background: hsl(var(--color-primary));
color: hsl(var(--color-primary-foreground));

/* Secondary */
background: rgba(0, 0, 0, 0.05);
color: hsl(var(--color-foreground));

/* Danger */
background: rgba(239, 68, 68, 0.1);
color: #ef4444;
```

### Inputs & Forms

- Labels immer über dem Input
- Placeholder für Hinweise, nicht als Label-Ersatz
- Fokus-Ring mit Primary-Farbe
- Fehler-States mit rotem Border + Fehlermeldung

```css
.input:focus {
	outline: none;
	border-color: hsl(var(--color-primary));
	box-shadow: 0 0 0 2px hsl(var(--color-primary) / 0.1);
}
```

### Cards & Listen-Elemente

Glassmorphism-Stil für erhöhte Elemente:

```css
.card {
	background: rgba(255, 255, 255, 0.85);
	backdrop-filter: blur(12px);
	-webkit-backdrop-filter: blur(12px);
	border: 1px solid rgba(0, 0, 0, 0.08);
	box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
	border-radius: 0.75rem;
}
```

### Empty States

Leere Zustände sollten:

1. Visuell ansprechend sein (Icon, Illustration)
2. Erklären was hier normalerweise ist
3. Eine klare Handlungsaufforderung bieten

```
┌─────────────────────────────┐
│                             │
│      [Animiertes Icon]      │
│                             │
│   Motivierender Titel       │
│   Kurze Beschreibung        │
│                             │
│   [Primäre Aktion]          │
│                             │
└─────────────────────────────┘
```

### Loading States

- Skeleton-Loader für bekannte Layouts
- Spinner für unbekannte Ladezeiten
- Inline-Spinner in Buttons während Aktionen

```svelte
{#if isLoading}
	<TaskListSkeleton sections={3} tasksPerSection={3} />
{:else}
	<TaskList {tasks} />
{/if}
```

## Feedback & Kommunikation

### Erfolgsmeldungen

- Subtil, nicht störend
- Automatisch ausblenden nach 3-5 Sekunden
- Toast-Benachrichtigungen für asynchrone Aktionen

### Fehlermeldungen

- Inline bei Formularen (direkt beim Feld)
- Toast/Banner für globale Fehler
- Klare Sprache: Was ist passiert + Was kann man tun

### Bestätigungsdialoge

Nur für:

- Unwiderrufliche Aktionen (Löschen)
- Aktionen mit weitreichenden Konsequenzen
- Wenn Datenverlust möglich ist

```
Titel: "Aufgabe löschen?"
Text:  "Diese Aufgabe wird unwiderruflich gelöscht."
       [Abbrechen] [Löschen]
```

## Accessibility (a11y)

### Mindestanforderungen

1. **Tastatur-Navigation**: Alle interaktiven Elemente erreichbar
2. **Fokus-Indikatoren**: Sichtbarer Fokus-Ring
3. **Kontrast**: Mindestens 4.5:1 für Text
4. **Screen Reader**: Semantisches HTML, ARIA-Labels

### ARIA-Patterns

```svelte
<!-- Dialog -->
<div role="dialog" aria-modal="true" aria-labelledby="dialog-title">
	<h2 id="dialog-title">Titel</h2>
</div>

<!-- Button mit Icon -->
<button aria-label="Bearbeiten">
	<EditIcon />
</button>

<!-- Expandable -->
<button aria-expanded={isExpanded}> Details </button>
```

### Keyboard Shortcuts

| Aktion              | Shortcut            |
| ------------------- | ------------------- |
| Speichern           | `Cmd/Ctrl + Enter`  |
| Abbrechen/Schließen | `Escape`            |
| Navigation          | `Tab` / `Shift+Tab` |

### Listen-Navigation mit Tastatur

In Listen (Tasks, Kontakte, Favoriten etc.) soll der Nutzer sich nahtlos per Tastatur bewegen können, ohne dass Fokus auf nicht-editierbare Elemente (Checkboxes, Drag-Handles) springt.

**Prinzip: Zirkuläre Navigation zwischen Input und Liste**

```
InputBar → ArrowUp/Tab → Erster Listeneintrag
                ↕ ArrowUp/Down/Tab/Shift+Tab
Letzter Eintrag → ArrowDown/Tab → InputBar
```

**Implementierung mit `contenteditable`:**

```svelte
<!-- Immer editierbar, kein Mode-Switch -->
<span
	contenteditable="true"
	role="textbox"
	spellcheck="true"
	onkeydown={handleKeydown}
	onblur={handleBlur}
>
	{item.title}
</span>
```

**Keydown-Handler für Listen-Navigation:**

```typescript
function handleKeydown(e: KeyboardEvent) {
	if (e.key === 'Enter') {
		e.preventDefault();
		currentRef?.blur(); // Speichert via onblur
	} else if (e.key === 'Escape') {
		currentRef.textContent = originalValue; // Verwerfen
		currentRef?.blur();
	} else if (e.key === 'Tab' || e.key === 'ArrowDown' || e.key === 'ArrowUp') {
		const direction = e.key === 'ArrowUp' || (e.key === 'Tab' && e.shiftKey) ? -1 : 1;
		e.preventDefault();
		// Alle editierbaren Elemente auf der Seite sammeln
		const allEditable = Array.from(
			document.querySelectorAll<HTMLElement>('.item-title[contenteditable]')
		);
		const currentIndex = allEditable.indexOf(currentRef!);
		const next = allEditable[currentIndex + direction];
		currentRef?.blur();
		if (next) {
			next.focus();
		} else {
			// Am Rand der Liste: Fokus zur InputBar
			document.querySelector<HTMLInputElement>('.quick-input-bar input')?.focus();
		}
	}
}
```

**Von der InputBar in die Liste (Page-Level Handler):**

```svelte
<svelte:window onkeydown={(e) => {
  const target = e.target as HTMLElement;
  if (target.closest('.quick-input-bar') && (e.key === 'ArrowUp' || e.key === 'Tab')) {
    const first = document.querySelector<HTMLElement>('.item-title[contenteditable]');
    if (first) {
      e.preventDefault();
      first.focus();
    }
  }
}} />
```

**Regeln:**

- `contenteditable` statt Input-Toggle: Cursor landet direkt an Klick-Position
- Kein visueller Unterschied zwischen Lese- und Edit-Modus (kein Border, kein Hintergrund)
- Speichern via `blur`-Event (Auto-Save), nicht via explizitem Save-Button
- ArrowDown/Up navigiert vertikal, Tab/Shift+Tab ebenfalls (gleiche Richtung)
- Am Listenende/-anfang springt Fokus zurück zur InputBar (zirkulär)
- Hover-Effekte auf Listeneinträgen vermeiden (ruhige UI)

### Inline-Editing mit contenteditable

**Bevorzuge `contenteditable` statt Input-Toggle** für Texte, die direkt in der Ansicht editiert werden.

| Aspekt               | Input-Toggle                   | contenteditable              |
| -------------------- | ------------------------------ | ---------------------------- |
| Klicks zum Editieren | 2 (aktivieren + positionieren) | 1 (Cursor an Klick-Position) |
| DOM-Wechsel          | `<span>` ↔ `<input>`          | Keiner                       |
| Mehrzeilig           | Braucht `<textarea>`           | Nativ                        |
| Styling              | Muss Input an Span anpassen    | Gleich                       |

**Wann Input statt contenteditable:**

- Formular-Felder mit Validierung (Datum, Zahl, E-Mail)
- Wenn `type="date"`, `type="number"` etc. benötigt wird
- In Expanded-Forms/Modals (nicht inline)

### Debug-Borders (Entwickler-Tool)

`Ctrl+Shift+D` aktiviert farbkodierte Outlines für alle UI-Elemente. Nutzt `outline` statt `border` um Layout nicht zu beeinflussen. State wird in localStorage persistiert.

```css
.debug-mode * {
	outline: 1px solid rgba(255, 0, 0, 0.3) !important;
}
.debug-mode div {
	outline-color: rgba(255, 0, 0, 0.4) !important;
}
.debug-mode section {
	outline-color: rgba(0, 100, 255, 0.5) !important;
}
.debug-mode nav {
	outline-color: rgba(0, 180, 0, 0.5) !important;
}
.debug-mode button {
	outline-color: rgba(255, 220, 0, 0.6) !important;
}
.debug-mode input,
.debug-mode textarea {
	outline-color: rgba(139, 92, 246, 0.6) !important;
}
```

Aktuell in Todo implementiert, geplant als `@manacore/shared-debug` Package.

## Z-Index-Hierarchie

Konsistente Schichtung für Overlays:

| Element          | Z-Index      |
| ---------------- | ------------ |
| Normale Inhalte  | `auto` / `0` |
| Sticky Headers   | `10`         |
| Dropdowns        | `50`         |
| Fixed Navigation | `90-100`     |
| Modals/Dialoge   | `9995`       |
| Toasts           | `9999`       |

**Wichtig:** Keine `z-index: 0` auf Containern setzen - das erstellt einen neuen Stacking Context und "trapped" Kind-Elemente.

## Typografie

### Font-Sizes

```css
text-xs:   0.75rem   /* 12px - Labels, Badges */
text-sm:   0.875rem  /* 14px - Sekundärtext */
text-base: 1rem      /* 16px - Standardtext */
text-lg:   1.125rem  /* 18px - Subtitles */
text-xl:   1.25rem   /* 20px - Titles */
text-2xl:  1.5rem    /* 24px - Page Headers */
```

### Font-Weights

```css
font-normal:   400  /* Body Text */
font-medium:   500  /* UI-Elemente, Buttons */
font-semibold: 600  /* Überschriften, Labels */
font-bold:     700  /* Wichtige Titel */
```

## Checkliste für neue Features

- [ ] Mobile-First implementiert?
- [ ] Dark Mode getestet?
- [ ] Inline-Interaktion statt Modal möglich?
- [ ] Loading/Error/Empty States vorhanden?
- [ ] Tastatur-Navigation funktioniert?
- [ ] Listen: Arrow/Tab-Navigation zwischen Einträgen?
- [ ] Listen: Zirkuläre Navigation zu InputBar?
- [ ] Inline-Editing: contenteditable statt Input-Toggle?
- [ ] Keine Hover-Effekte auf Listeneinträgen?
- [ ] Animations sparsam und sinnvoll?
- [ ] CSS-Variablen statt hardcoded Farben?
- [ ] Konsistente Spacing-Werte?
