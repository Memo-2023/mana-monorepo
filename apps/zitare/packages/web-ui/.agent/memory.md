# Memory: @zitare/web-ui

## Recent Changes

<!-- Track significant changes, refactorings, and decisions -->

### [Date] - Change Description
**What Changed:**
-

**Why:**
-

**Impact:**
-

**Migration Notes:**
-

---

## Known Issues

<!-- Document bugs, limitations, and technical debt -->

### Issue: [Title]
**Description:**
-

**Workaround:**
-

**Resolution Plan:**
-

---

## Component Status

<!-- Track component maturity and usage -->

### Production Ready
- ContentCard
- PageHeader
- SearchBox
- CategoryFilters
- ToastContainer

### Beta / Testing
-

### Deprecated
-

### Planned
-

---

## Svelte 5 Migration Notes

<!-- Track migration from old Svelte to Svelte 5 runes -->

### Components Using Runes
- All components should use Svelte 5 runes mode exclusively

### Legacy Syntax Found
- [ ] None (all components use runes)

### Migration Checklist
- [x] Use $props() instead of export let
- [x] Use $state() instead of reactive let
- [x] Use $derived() instead of $: reactive declarations
- [x] Use $effect() instead of $: reactive statements

---

## Active Patterns

<!-- Track established patterns and their usage -->

### Pattern: Generic Content Component
**Location:** ContentCard.svelte, BrowsePage.svelte
**Usage:** Use TypeScript generics with ContentItem constraint
**Example:**
```svelte
<script lang="ts" generics="T extends ContentItem">
  import type { ContentItem } from '@zitare/shared';
  interface Props {
    content: T;
  }
  let { content }: Props = $props();
</script>
```

### Pattern: Persisted Store
**Location:** stores/theme.ts, stores/sidebar.ts
**Usage:** Wrap writable with localStorage persistence
**Notes:** Always guard with `browser` check for SSR safety

---

## Decision Log

<!-- Record architectural and design decisions -->

### Decision: [Title]
**Date:**
-

**Context:**
-

**Decision:**
-

**Consequences:**
-

**Alternatives Considered:**
-

---

## Performance Notes

<!-- Track performance considerations and optimizations -->

### Optimization: [Title]
**Area:**
-

**Measurement:**
-

**Result:**
-

---

## Component Usage Statistics

<!-- Track which components are most/least used -->

### Most Used Components
- ContentCard
- AppSidebar
- BrowsePage

### Least Used Components
-

### Candidates for Removal
-

---

## Styling Patterns

<!-- Track common styling approaches -->

### Gradient System
**Location:** ContentCard.svelte
**Categories:**
- life: #667eea → #764ba2
- wisdom: #f093fb → #f5576c
- success: #4facfe → #00f2fe
- motivation: #43e97b → #38f9d7
- love: #fa709a → #fee140
- happiness: #30cfd0 → #330867
- philosophy: #a8edea → #fed6e3
- courage: #ff9a56 → #ff6a88
- creativity: #ffecd2 → #fcb69f
- peace: #a1c4fd → #c2e9fb
- knowledge: #ffecd2 → #fcb69f

### Theme Colors
**Light Mode:**
-

**Dark Mode:**
-

---

## Integration Issues

<!-- Track problems with dependent packages -->

### Integration: @zitare/web
**Issue:**
-

**Status:**
-

**Notes:**
-

### Integration: @zitare/shared
**Issue:**
-

**Status:**
-

**Notes:**
-

---

## TODO & Future Work

<!-- Track planned improvements and features -->

- [ ] Add Storybook for component documentation
- [ ] Add Vitest component tests
- [ ] Extract more reusable patterns
- [ ] Build design system documentation
- [ ] Create component playground
- [ ] Add accessibility testing
- [ ] Document all component props and events
- [ ] Add JSDoc comments to all exports

---

## Accessibility Notes

<!-- Track accessibility improvements and issues -->

### ARIA Attributes
-

### Keyboard Navigation
-

### Screen Reader Support
-

### Color Contrast
-

---

## Browser Compatibility

<!-- Track browser-specific issues -->

### Tested Browsers
- Chrome/Edge (Chromium)
- Firefox
- Safari
- Mobile Safari
- Chrome Mobile

### Known Issues
-

---

## SSR Considerations

<!-- Track server-side rendering issues -->

### Browser API Guards
All stores properly guard localStorage with `browser` check
Components using `$app/environment` for SSR detection

### Hydration Issues
-

---

## Store API Documentation

<!-- Quick reference for store APIs -->

### theme
```typescript
theme.subscribe((value: Theme) => {})
theme.toggle()
theme.init()
```

### isSidebarCollapsed
```typescript
isSidebarCollapsed.subscribe((value: boolean) => {})
isSidebarCollapsed.toggle()
isSidebarCollapsed.set(value: boolean)
```

### toast
```typescript
toast.show(message: string, type: ToastType, duration?: number)
toast.success(message: string)
toast.error(message: string)
toast.info(message: string)
toast.warning(message: string)
```

---

## Dependencies Watch

<!-- Track upstream changes that may affect this package -->

### Svelte Version
**Current:** ^5.0.0 (peer dependency)
**Notes:**
- Using runes mode exclusively
- Monitor Svelte 5 API changes

### @zitare/shared
**Current:** workspace:*
**Notes:**
- Watch for type definition changes
- Monitor utility function updates

### Tailwind CSS
**Current:** (configured by consuming apps)
**Notes:**
- Ensure class compatibility
- Monitor breaking changes

---

## Testing Coverage

<!-- Track test coverage and gaps -->

### Current Coverage
- No automated tests yet

### Coverage Gaps
- Component unit tests
- Store logic tests
- Integration tests
- Accessibility tests

### Test Scenarios Needed
- [ ] ContentCard rendering variations
- [ ] Theme store persistence
- [ ] Toast notification queue
- [ ] Search and filter functionality
- [ ] Event emission
- [ ] SSR rendering

---

## Documentation Needs

<!-- Track documentation gaps -->

- [ ] Component API reference for all components
- [ ] Usage examples for each component
- [ ] Store API documentation
- [ ] Styling guide
- [ ] Theme customization guide
- [ ] Accessibility guidelines
- [ ] Performance best practices

---

## Questions & Clarifications Needed

<!-- Track open questions about implementation -->

- How should components handle loading states?
- Should we add animation/transition utilities?
- What's the strategy for mobile responsiveness?
- Should we extract the gradient system to a separate utility?

---

## Notes

*This memory file should be updated regularly as the package evolves. Each agent interaction should review and update relevant sections.*

### Component Naming Conventions
- Page components: `[Feature]Page.svelte` (e.g., BrowsePage, FavoritesPage)
- Utility components: `[Purpose][Type].svelte` (e.g., ContentCard, SearchBox)
- Layout components: `[Area]Sidebar.svelte` or `[Layout].svelte`

### File Organization
- Components: Flat structure in `src/components/`
- Stores: One file per store in `src/stores/`
- Styles: Minimal, most styling via Tailwind
- No subdirectories unless package grows significantly

### Export Strategy
- Main exports: Common components and stores from `index.ts`
- Subpath exports: Allow direct imports for tree-shaking
- ErrorBoundary and ToastContainer: Available but not in main exports
