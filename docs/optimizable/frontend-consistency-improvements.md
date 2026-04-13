# Frontend Consistency Improvements

Tracked improvements for UI/styling consistency across the Mana unified app.

## 1. Standardize ListView Styling Approach

**Status:** Open
**Priority:** Low (no functional impact, maintenance concern)
**Effort:** Medium (13 modules to migrate)

### Problem

Module ListViews use two different styling approaches:

- **Scoped CSS + `hsl(var(--color-*))` theme tokens** — 27 modules (65%)
  - todo, notes, drink, contacts, journal, dreams, habits, firsts, calendar, chat, places, inventory, finance, news, body, calc, events, photos, automations, cycles, uload, picture, recipes
- **Tailwind utility classes** — 13 modules (35%)
  - nutriphi, plants, moodlit, cards, presi, storage, skilltree, context, guides, memoro, who, music, playground, citycorners, questions, times

### Why it matters

- Tailwind modules sometimes hardcode colors (`bg-white/5`, `text-white/80`) instead of using theme tokens, breaking theme consistency.
- `transition-all` in Tailwind classes can cause rendering bugs with CSS custom properties (recipe module had invisible text until hover — fixed by switching to specific transition properties).
- Mixed approaches make it harder to audit theme compliance and onboard new contributors.

### Recommendation

Migrate the 13 Tailwind-based ListViews to scoped CSS with `hsl(var(--color-*))` tokens, matching the majority pattern. Key rules:

1. Use `hsl(var(--color-foreground))`, `hsl(var(--color-muted))`, etc. — not hardcoded colors.
2. Use specific `transition: transform 0.15s, box-shadow 0.15s` — never `transition-all` (causes CSS variable animation bugs).
3. Keep scoped `<style>` blocks — no Tailwind utility classes in ListView templates.

### Modules to migrate

- [ ] nutriphi
- [ ] plants
- [ ] moodlit
- [ ] cards
- [ ] presi
- [ ] storage
- [ ] skilltree
- [ ] context
- [ ] guides
- [ ] memoro
- [ ] who
- [ ] music
- [ ] playground
- [ ] citycorners
- [ ] questions
- [ ] times
