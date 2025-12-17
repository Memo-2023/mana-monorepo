# Calendar Shared Package - Agent Memory

## Recent Changes

<!-- Track significant changes to types, utils, or constants -->

### [Date] - Change Description

**Changed:**
- List of files/types modified

**Reason:**
- Why the change was made

**Impact:**
- Which apps/packages are affected

---

## Known Issues

<!-- Document any type inconsistencies or utility limitations -->

### Issue Title

**Description:**
- What the issue is

**Affected:**
- Which types/utilities are affected

**Workaround:**
- Temporary solution if any

**Status:**
- [ ] Open
- [ ] In Progress
- [ ] Resolved

---

## Type Decisions

<!-- Document important type design decisions for future reference -->

### Decision: Date | string Union Type

**Context:**
- Backend returns ISO strings from database
- Frontend can work with Date objects
- Need compatibility across platforms

**Decision:**
- Use `Date | string` union for all timestamp fields
- Let each platform handle parsing/formatting

**Rationale:**
- Avoids forced serialization/deserialization
- More flexible for different use cases
- No runtime overhead

---

## Future Enhancements

<!-- Track planned additions or improvements -->

- [ ] Add more timezone utilities
- [ ] Enhance recurrence rule validation
- [ ] Add event conflict detection utilities
- [ ] Add duration calculation helpers
- [ ] Add business hours utilities

---

## Integration Notes

<!-- Document how consuming apps use this package -->

### Backend Usage Patterns

```typescript
// Common patterns observed in backend
```

### Frontend Usage Patterns

```typescript
// Common patterns observed in web/mobile
```

---

## Performance Considerations

<!-- Document any performance-related decisions -->

- Pure date utilities to avoid external dependencies
- Tree-shakeable exports via package.json exports field
- No runtime dependencies keeps bundle size minimal

---

## Breaking Changes Log

<!-- Track breaking changes for consumer awareness -->

### [Date] - Breaking Change Title

**What Changed:**
- Description of breaking change

**Migration Path:**
- How to update consuming code

**Affected Packages:**
- List of apps that need updates

---

## Testing Notes

<!-- Document testing approaches for this package -->

- Type-checking via `pnpm type-check` is the primary validation
- Date utilities should be tested with edge cases (leap years, DST, etc.)
- Recurrence expansion should be validated against RFC 5545 spec

---

## External Dependencies

<!-- Track any external dependencies and why they're used -->

Currently: **ZERO** runtime dependencies

This is intentional to keep the package lean and platform-agnostic.
