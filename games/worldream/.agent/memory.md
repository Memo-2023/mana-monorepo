# Worldream Team Memory

This file stores important context, decisions, and shared knowledge for the Worldream agent team.

## Project Context

**Worldream** is a text-first worldbuilding platform that enables creative writers to build and manage fictional worlds through:
- Unified content nodes (worlds, characters, objects, places, stories)
- @slug references for human-readable entity linking
- AI-assisted content generation with GPT-5-mini and Gemini
- JSONB-based flexible content storage in Supabase PostgreSQL

**Current Status:** Active development
**Tech Stack:** SvelteKit, Svelte 5 (runes only), Supabase, Tailwind CSS v4
**Package Manager:** pnpm with workspace optimization

## Recent Decisions

### Architectural Decisions

**Decision:** Use unified `content_nodes` table with JSONB content storage
**Date:** Project inception
**Rationale:** Flexibility to add fields without schema migrations, consistency across entity types, LLM-friendly text-first approach
**Impact:** All entity types (world, character, object, place, story) share same meta structure
**Trade-offs:** No foreign key constraints (mitigated by @slug parsing and _links cache)

**Decision:** Svelte 5 runes syntax exclusively (no legacy Svelte)
**Date:** Project start
**Rationale:** Better performance, clearer reactivity model, future-proof, better TypeScript integration
**Impact:** All components use `$state()`, `$derived()`, `$effect()`, `$props()`
**Enforcement:** Code reviews reject legacy `$:` syntax and `export let`

**Decision:** @slug reference system instead of UUIDs for cross-references
**Date:** Core design phase
**Rationale:** Human-readable, AI can generate naturally, easy to type, no UUID lookups
**Impact:** References like `@mira` or `@neo_station` in story text
**Trade-offs:** Slug changes require migration (mitigated by _aliases field)

### AI Integration Decisions

**Decision:** Use GPT-5-mini for text generation
**Date:** AI integration phase
**Rationale:** Good balance of quality and cost, supports JSON mode and streaming
**Critical Constraint:** ONLY `temperature: 1.0` supported, MUST use `max_completion_tokens` not `max_tokens`
**Impact:** All AI generation code must follow these parameter constraints
**Documentation:** See `/docs/GPT5-MINI.md` and `CLAUDE.md`

**Decision:** Inject world context into all AI generations (except new worlds)
**Date:** Context-aware generation implementation
**Rationale:** Ensures consistency with established world lore and rules
**Impact:** System prompts include world appearance, lore, canon facts, glossary
**Quality Improvement:** Users report higher satisfaction with context-aware generations

**Decision:** Post-process AI story output to fix REF_X placeholders
**Date:** Story generation debugging
**Rationale:** AI sometimes uses placeholder references instead of actual @slugs
**Impact:** Backend replaces REF_0, REF_1, etc. with proper @slug references
**Fallback:** Comprehensive logging to debug when AI doesn't follow instructions

## Known Issues & Limitations

### Current Bugs

**Issue:** AI sometimes generates REF_X instead of @slugs in stories
**Severity:** P2 (Medium)
**Workaround:** Post-processing fixes most cases
**Root Cause:** AI prompt not always followed precisely
**Status:** Mitigated with improved prompts and post-processing
**Owner:** Senior Developer

**Issue:** Broken @slug references not visually indicated in editor
**Severity:** P3 (Low)
**Impact:** Users don't know when referencing non-existent entities
**Planned Fix:** Add real-time validation and red underline for broken refs
**Owner:** Developer

### Technical Limitations

**Limitation:** GPT-5-mini parameter constraints
**Impact:** Cannot adjust temperature or use `max_tokens` parameter
**Workaround:** Omit temperature (defaults to 1.0), use `max_completion_tokens`
**Documentation:** Well-documented in code comments and CLAUDE.md
**Risk:** Team members unfamiliar with this can cause 400 errors

**Limitation:** No referential integrity for @slug references
**Impact:** Deleting a character doesn't update stories that mention it
**Mitigation:** Parse and cache references in `_links`, consider `_aliases` for renames
**Future:** May add orphan detection and warning system

**Limitation:** Full-text search only in English
**Impact:** Non-English content may not search optimally
**Current State:** PostgreSQL tsvector configured for 'english'
**Future:** Consider multi-language support or language detection

## Best Practices

### Code Patterns

**Pattern:** Svelte 5 Component with Props, State, and Derived
```typescript
<script lang="ts">
  const { initialValue }: { initialValue: number } = $props();

  let count = $state(initialValue);
  let doubled = $derived(count * 2);

  $effect(() => {
    console.log('Count changed:', count);
  });
</script>
```

**Pattern:** API Route with Validation and RLS
```typescript
export const POST: RequestHandler = async ({ request, locals }) => {
  if (!locals.user) return error(401, 'Unauthorized');

  const body = await request.json();
  if (!body.kind || !body.title) {
    return error(400, 'Missing required fields');
  }

  const sanitized = {
    ...body,
    owner_id: locals.user.id,
  };

  const { data, error: dbError } = await locals.supabase
    .from('content_nodes')
    .insert(sanitized)
    .select()
    .single();

  if (dbError) return error(500, 'Failed to create');

  return json({ node: data });
};
```

**Pattern:** AI Generation with GPT-5-mini
```typescript
const completion = await openai.chat.completions.create({
  model: 'gpt-5-mini',
  messages: [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt },
  ],
  // temperature omitted (defaults to 1.0)
  response_format: { type: 'json_object' },
  max_completion_tokens: 5000, // NOT max_tokens!
});
```

### Testing Standards

**Unit Tests:** 60% of test pyramid
- Pure functions, utilities, helpers
- Fast, isolated, deterministic
- Mock external dependencies

**Integration Tests:** 30% of test pyramid
- API endpoints with real database
- Database operations
- Authentication flows

**E2E Tests:** 10% of test pyramid
- Critical user workflows only
- Create world → generate character → write story
- Expensive, run on CI and pre-release

## Common Workflows

### Adding a New Content Type

1. **Architect:** Define JSONB content structure and fields
2. **Senior Dev:** Create AI generation prompt template
3. **Developer:** Implement CRUD API routes
4. **Developer:** Build Svelte 5 form and display components
5. **Security:** Ensure RLS policies apply to new type
6. **QA:** Validate CRUD operations and AI generation quality
7. **Product Owner:** Review UX and acceptance criteria

### Implementing AI Feature

1. **Product Owner:** Define user story and success criteria
2. **Architect:** Design prompt engineering approach
3. **Senior Dev:** Implement with proper error handling
4. **Security:** Validate API endpoint protection and rate limiting
5. **QA:** Test generation quality and edge cases
6. **Developer:** Build UI for feature

### Handling Bug Reports

1. **QA Lead:** Triage and assign severity (P0-P3)
2. **Developer:** Reproduce issue and write failing test
3. **Developer/Senior Dev:** Fix bug and verify test passes
4. **QA Lead:** Verify fix in test environment
5. **Product Owner:** Approve for release

## Team Communication Patterns

### When to Consult Architect
- Changing database schema or data model
- Adding new AI integration or model
- Performance issues requiring architectural changes
- Designing new major features

### When to Consult Senior Developer
- Complex Svelte 5 reactivity patterns
- AI prompt engineering challenges
- Advanced TypeScript type issues
- Code review for critical features

### When to Consult Security Engineer
- New API endpoints (rate limiting, validation)
- Changes to RLS policies
- User data handling
- External API integrations

### When to Consult QA Lead
- Defining acceptance criteria
- Test strategy for new features
- Quality issues or regression
- Performance benchmarking

### When to Consult Product Owner
- Feature prioritization
- UX questions or user feedback
- Scope clarification
- Release planning

## Technical Debt

**Item:** Improve @slug autocomplete performance
**Impact:** Slow with large numbers of entities (> 1000)
**Proposed Fix:** Debounce search, limit results, cache suggestions
**Priority:** Medium
**Owner:** Developer

**Item:** Add content version history
**Impact:** Users can't rollback changes or see edit history
**Proposed Fix:** Implement `node_revisions` table (planned in architecture)
**Priority:** Low
**Owner:** Architect + Developer

**Item:** Better error messages for AI generation failures
**Impact:** Users don't understand why generation failed
**Proposed Fix:** Parse OpenAI error responses, provide actionable messages
**Priority:** Medium
**Owner:** Senior Developer

## Performance Benchmarks

**Current Metrics (as of last test):**
- Node list query: ~150ms (target: < 200ms) ✅
- Single node fetch: ~80ms (target: < 100ms) ✅
- Full-text search: ~300ms (target: < 500ms) ✅
- AI text generation: ~6s average (target: < 10s) ✅
- AI image generation: ~25s average (target: < 30s) ✅

**Monitoring:**
- Set up performance logging in production
- Alert on queries > 1s
- Track AI generation success/failure rates

## Security Notes

**RLS Policies:** All content access controlled via Supabase RLS
**API Protection:** Rate limiting on AI endpoints (10 req/min per user)
**Input Sanitization:** All user inputs sanitized before storage
**Secrets Management:** AI API keys in environment variables only

**Recent Security Reviews:**
- 2024-12: Initial RLS policy implementation ✅
- 2024-12: API endpoint validation audit ✅

**Upcoming:**
- Penetration testing for public release
- Security headers (CSP, HSTS)
- Audit logging for sensitive operations

## Release Notes Template

```markdown
## Version X.Y.Z - YYYY-MM-DD

### New Features
- [Feature name]: Brief description

### Improvements
- [Area]: What was improved

### Bug Fixes
- Fixed [issue] where [problem]

### Technical
- Updated dependencies
- Performance improvements
```

## Useful Resources

- **Project Docs:** `/games/worldream/docs/`
- **CLAUDE.md:** `/games/worldream/CLAUDE.md`
- **GPT-5-mini Constraints:** `/games/worldream/docs/GPT5-MINI.md`
- **Type Definitions:** `/games/worldream/packages/worldream-types/`
- **API Routes:** `/games/worldream/apps/web/src/routes/api/`

## Team Notes

### For New Team Members

1. Read `/games/worldream/CLAUDE.md` for technical overview
2. Understand GPT-5-mini parameter constraints (critical!)
3. Practice Svelte 5 runes syntax (no legacy Svelte)
4. Review @slug reference system and parsing logic
5. Set up local Supabase and test RLS policies

### Quick Wins for Contributors

- Improve error messages in AI generation
- Add more AI prompt templates
- Enhance @slug autocomplete UX
- Write additional tests for edge cases
- Improve mobile responsiveness

### Recurring Discussions

**"Should we support custom fields per world?"**
- Status: Planned, architecture supports it via JSONB
- Needs: UI for defining field schemas, validation logic
- Priority: Medium

**"How to handle @slug renames?"**
- Current: Use `_aliases` field to track old slugs
- Future: Migration tool to update references in content
- Workaround: Manually update or create new with correct slug

**"Multi-language support?"**
- Current: English-only (AI prompts in German, but content is flexible)
- Future: i18n for UI, multi-language tsvector for search
- Challenge: AI generation in multiple languages

---

**Last Updated:** 2024-12-16
**Update Frequency:** After major decisions, features, or discoveries
**Maintained By:** All team roles contribute
