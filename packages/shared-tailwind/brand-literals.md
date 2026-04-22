# Brand-Literal Color Register

This document lists every module that intentionally uses literal color
values (`#RRGGBB`, `rgb()`, `rgba()`, `hsl()` without `var(--color-*)`)
**instead of** theme tokens — and the reason why.

It exists because the theme-token validators (`validate-theme-utilities`,
`validate-theme-variables`) would otherwise flag these as drift. They are
not drift: the color _is the point_.

## The rule

Colors in Mana fall into three buckets:

1. **Theme tokens** (`bg-muted`, `text-foreground`, `hsl(var(--color-primary))`)
   — surfaces, text, borders. Must track the active theme variant.

2. **Semantic tokens** (`--color-success`, `--color-warning`, `--color-error`)
   — feedback states. Also theme-aware.

3. **Brand literals** (documented here) — domain-semantic colors that
   intentionally _do not_ track the theme. A period tracker's pink is
   pink in every theme.

If you're adding a literal color that isn't on this list, think: "does
the domain require this exact hue, or am I reaching for a nearby theme
token?" Default to the token. Add to this register only when the domain
genuinely demands the literal.

## Per-module inventory

### `period` — menstrual cycle tracking

| Purpose            | Colors                                     | Why literal                                                                                |
| ------------------ | ------------------------------------------ | ------------------------------------------------------------------------------------------ |
| Flow severity ramp | `#fda4af`, `#fb7185`, `#e11d48`, `#9f1239` | Spotting → light → medium → heavy. Literal red ramp is the domain.                         |
| Cycle phases       | `#e11d48`, `#f59e0b`, `#22c55e`, `#8b5cf6` | Menstruation/follicular/ovulation/luteal — standardised colours in reproductive-health UX. |
| Module accent      | `#ec4899` + `rgba(236,72,153, …)`          | Pink is the module's identity; users recognise it across contexts.                         |

Files: `lib/modules/period/types.ts`, `lib/modules/period/ListView.svelte`

### `citycorners` — city discovery

| Purpose                | Colors                            | Why literal                                                                                                                         |
| ---------------------- | --------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| Location category pins | 11 colours from `CATEGORY_COLORS` | Sight/restaurant/shop/museum/cafe/bar/park/beach/hotel/venue/viewpoint — map-convention colours that readers recognise at a glance. |

Files: `lib/modules/citycorners/types.ts`

### `who` — historical-persona guessing game

| Purpose      | Colors                                                                          | Why literal                                                  |
| ------------ | ------------------------------------------------------------------------------- | ------------------------------------------------------------ |
| Deck accents | `#a855f7` historical, `#ec4899` women, `#f59e0b` antiquity, `#0ea5e9` inventors | Per-deck identity; colour primes the player about era/theme. |

Files: `lib/modules/who/ListView.svelte`, `lib/modules/who/views/PlayView.svelte`

### `firsts` — life-experience log

| Purpose               | Colors                                                  | Why literal                                                            |
| --------------------- | ------------------------------------------------------- | ---------------------------------------------------------------------- |
| Experience categories | 11 colours (`#f97316` culinary, `#ef4444` adventure, …) | Domain-semantic tags the user picks — must look identical every visit. |

Files: `lib/modules/firsts/types.ts`

### `habits` — habit tracker

| Purpose                    | Colors                               | Why literal                                                        |
| -------------------------- | ------------------------------------ | ------------------------------------------------------------------ |
| User-pickable habit colour | 14-colour palette, full hue spectrum | User-owned choice; changing under theme would feel like data loss. |

Files: `lib/modules/habits/types.ts`

### `finance` — expense tracking

| Purpose                    | Colors                                             | Why literal                                                                   |
| -------------------------- | -------------------------------------------------- | ----------------------------------------------------------------------------- |
| Default expense categories | 8 colours (`#f97316` food, `#3b82f6` transport, …) | Category-colour conventions (health=green, travel=blue) stable across themes. |
| Custom-category palette    | 13 curated colours                                 | User-pickable palette for personal categories.                                |

Files: `lib/modules/finance/types.ts`

### `times` — time tracking

| Purpose         | Colors                               | Why literal                                                    |
| --------------- | ------------------------------------ | -------------------------------------------------------------- |
| Project colours | 16-colour palette (`PROJECT_COLORS`) | Full hue spectrum for visual distinction across many projects. |

Files: `lib/modules/times/types.ts`

### `journal` / `mood` / `dreams` — emotion logging

| Purpose                    | Colors                                              | Why literal                                                  |
| -------------------------- | --------------------------------------------------- | ------------------------------------------------------------ |
| Emotion valence            | Green (positive) → amber → red (negative) spectrums | Domain convention: emotion-colour psychology is the feature. |
| User-pickable mood colours | 16 fixed hues                                       | User-selected identity per mood.                             |

Files: `lib/modules/journal/types.ts`, `lib/modules/mood/types.ts`,
`lib/modules/dreams/types.ts`

### `recipes` — difficulty indicator

| Purpose    | Colors                                           | Why literal                                             |
| ---------- | ------------------------------------------------ | ------------------------------------------------------- |
| Difficulty | `#22c55e` easy, `#f59e0b` medium, `#ef4444` hard | Traffic-light pattern — universal, not theme-dependent. |

Files: `lib/modules/recipes/types.ts`

### `notes` — highlight colour palette

| Purpose        | Colors                           | Why literal                     |
| -------------- | -------------------------------- | ------------------------------- |
| Note highlight | 10-colour curated palette + null | User-pickable; stable per note. |

Files: `lib/modules/notes/types.ts`

### `drink` — beverage categories

| Purpose            | Colors                                                            | Why literal                                            |
| ------------------ | ----------------------------------------------------------------- | ------------------------------------------------------ |
| Drink-type palette | 13 colours (`#92400e` coffee, `#881337` wine, `#3b82f6` water, …) | Semantic mapping to beverage (brown coffee, red wine). |

Files: `lib/modules/drink/types.ts`

### `sleep` — quality ratings

| Purpose             | Colors                            | Why literal                      |
| ------------------- | --------------------------------- | -------------------------------- |
| Module accent       | `#6366f1` indigo                  | Module identity.                 |
| Sleep-quality scale | `#22c55e` / `#f59e0b` / `#ef4444` | Traffic-light quality indicator. |

Files: `lib/modules/sleep/ListView.svelte`, `lib/modules/sleep/components/*.svelte`

### `spiral` / `quotes` — spiral canvas visualisation

| Purpose               | Colors                            | Why literal                                                |
| --------------------- | --------------------------------- | ---------------------------------------------------------- |
| Canvas background     | `#1a1a1a` (near-black)            | Canvas needs a fixed contrast surface regardless of theme. |
| Golden accent lines   | `#fbbf24`                         | Intentional warm-gold against dark canvas.                 |
| Violet overlay + glow | `#8b5cf6`, `rgba(99,102,241,0.1)` | Module identity: indigo → violet ramp.                     |

Files: `lib/modules/spiral/ListView.svelte`,
`lib/modules/spiral/components/SpiralCanvas.svelte`,
`lib/modules/quotes/components/SpiralCanvas.svelte`

### `photos` — photo viewer

| Purpose                      | Colors                                                          | Why literal                                                                                |
| ---------------------------- | --------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| Near-black backdrop gradient | `rgba(0,0,0,0.8) → transparent`                                 | Photo viewers always use black backdrop — theme variants would leak colour onto the photo. |
| Upload status overlays       | `rgba(0,0,0,0.4)`, `rgba(34,197,94,0.5)`, `rgba(239,68,68,0.5)` | State feedback against arbitrary image content.                                            |

Files: `lib/modules/photos/ListView.svelte`,
`lib/modules/photos/components/albums/AlbumCard.svelte`

### `moodlit` — ambient mood gradients

| Purpose                      | Colors                            | Why literal                                                                                                                                                |
| ---------------------------- | --------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| User-authored gradient stops | Arbitrary user-picked hex         | The whole module's value is rendering the user's colours verbatim.                                                                                         |
| White-alpha overlays         | `bg-white/20`, `text-white`, etc. | UI chrome sits on a vivid gradient background — only white reads. Validator exempts `MoodFullscreen.svelte`, `MoodCard.svelte`, `CreateMoodDialog.svelte`. |

Files: `lib/modules/moodlit/components/mood/*.svelte`

### `calc` — retro calculator skins

| Skin        | Colors                                     | Why literal                                           |
| ----------- | ------------------------------------------ | ----------------------------------------------------- |
| TI-84 Plus  | `#2a4a3a`, `#aaffaa`, `#88cc88`, `#3366aa` | 1990s TI LCD green — the authenticity is the feature. |
| HP-35       | `#ff3333`, `#ff2200`, `#c63030`            | 1971 HP LED red display.                              |
| Casio fx-82 | `#b8c8a0`, `#3a4a2a`, `#1a2a0a`            | 1980s Casio LCD beige-green.                          |

Files: `lib/modules/calc/components/{TI84Skin,HP35Skin,CasioSkin}.svelte`

### `presi` — rehearsal blocks

| Purpose                     | Colors         | Why literal                                                |
| --------------------------- | -------------- | ---------------------------------------------------------- |
| Rehearsal time-block accent | `#84cc16` lime | Distinguishes practice sessions from real calendar events. |

Files: `lib/modules/presi/stores/decks.svelte.ts`

### `--color-branch-*` — skilltree accents (actually theme-aware)

`skilltree` uses per-branch accent colours defined as _theme-agnostic CSS
variables_ (`--color-branch-intellect`, `--color-branch-body`, …) in
`themes.css`. These are declared once at `:root` and intentionally do not
have dark/variant overrides — they look identical regardless of theme.
Consumers must still wrap with `hsl(var(--color-branch-X))`.

The parity validator exempts them via the `THEME_AGNOSTIC` allowlist.

## Summary

- **16 modules** hold brand-literal colours.
- **~70 unique hex values** across them.
- The two validators (`validate-theme-utilities`, `validate-theme-variables`)
  already ignore these files / these patterns where necessary. If a new
  literal trips the validator, either:
  1. Add it to this register and (if it's a white-alpha overlay case)
     to `BRAND_OVERLAY_FILES` in `validate-theme-utilities.mjs`, or
  2. Migrate the literal to a theme token — usually the right answer.
