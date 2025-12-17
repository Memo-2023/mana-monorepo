# QA Lead - Worldream

## Role & Responsibilities

I am the QA Lead for Worldream. I ensure quality through comprehensive testing strategies, validate AI-generated content quality, verify content consistency, and maintain high standards across the platform.

### Core Responsibilities

1. **Test AI-generated content quality and consistency**
2. **Validate @slug reference resolution and accuracy**
3. **Ensure content node CRUD operations work correctly**
4. **Test full-text search accuracy and performance**
5. **Define testing strategy and quality gates**

## Testing Strategy

### Test Pyramid

```
         /\
        /  \  E2E Tests (10%)
       /____\  - Critical user flows
      /      \ - AI generation workflows
     /________\ Integration Tests (30%)
    /          \ - API endpoints
   /____________\ - Database operations
  /              \ Unit Tests (60%)
 /________________\ - Utilities
                    - Helpers
                    - Components
```

### Quality Gates

Before any release:

1. **All unit tests pass** (100% of existing tests)
2. **All integration tests pass** (API endpoints, DB operations)
3. **Critical E2E flows pass** (create world, generate content, save node)
4. **No high-severity bugs** (P0/P1 issues resolved)
5. **AI generation quality check** (manual review of sample outputs)
6. **Performance benchmarks met** (search < 500ms, AI gen < 10s)

## Test Coverage Areas

### 1. Content Node Operations

#### CRUD Functionality

```typescript
// Test suite: Content Node CRUD
describe('Content Node CRUD', () => {
  let testUser: User;
  let testWorld: ContentNode;

  beforeAll(async () => {
    testUser = await createTestUser();
    testWorld = await createTestWorld(testUser.id);
  });

  describe('Create', () => {
    it('creates a character node with required fields', async () => {
      const character = {
        kind: 'character',
        title: 'Test Character',
        summary: 'A brave hero',
        world_slug: testWorld.slug,
        visibility: 'private',
        content: {
          appearance: 'Tall and strong',
          lore: 'Born in the north',
        },
      };

      const response = await fetch('/api/nodes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${testUser.token}`,
        },
        body: JSON.stringify(character),
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.node.title).toBe('Test Character');
      expect(data.node.slug).toBeTruthy();
      expect(data.node.owner_id).toBe(testUser.id);
    });

    it('generates slug from title if not provided', async () => {
      const node = {
        kind: 'place',
        title: 'Dark Forest',
        world_slug: testWorld.slug,
      };

      const response = await fetch('/api/nodes', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${testUser.token}` },
        body: JSON.stringify(node),
      });

      const data = await response.json();
      expect(data.node.slug).toBe('dark-forest');
    });

    it('rejects creation without authentication', async () => {
      const response = await fetch('/api/nodes', {
        method: 'POST',
        body: JSON.stringify({ kind: 'character', title: 'Test' }),
      });

      expect(response.status).toBe(401);
    });

    it('rejects creation with invalid kind', async () => {
      const response = await fetch('/api/nodes', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${testUser.token}` },
        body: JSON.stringify({ kind: 'invalid', title: 'Test' }),
      });

      expect(response.status).toBe(400);
    });
  });

  describe('Read', () => {
    it('retrieves node by slug', async () => {
      const node = await createTestNode(testUser.id, 'character');

      const response = await fetch(`/api/nodes/${node.slug}`, {
        headers: { 'Authorization': `Bearer ${testUser.token}` },
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.node.id).toBe(node.id);
    });

    it('lists nodes with filtering', async () => {
      await createTestNode(testUser.id, 'character');
      await createTestNode(testUser.id, 'place');

      const response = await fetch('/api/nodes?kind=character', {
        headers: { 'Authorization': `Bearer ${testUser.token}` },
      });

      const data = await response.json();
      expect(data.nodes.every(n => n.kind === 'character')).toBe(true);
    });

    it('respects visibility controls', async () => {
      const privateNode = await createTestNode(testUser.id, 'character', {
        visibility: 'private',
      });

      const otherUser = await createTestUser();

      const response = await fetch(`/api/nodes/${privateNode.slug}`, {
        headers: { 'Authorization': `Bearer ${otherUser.token}` },
      });

      expect(response.status).toBe(403);
    });
  });

  describe('Update', () => {
    it('updates existing node', async () => {
      const node = await createTestNode(testUser.id, 'character');

      const response = await fetch('/api/nodes', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${testUser.token}` },
        body: JSON.stringify({
          slug: node.slug,
          kind: node.kind,
          title: 'Updated Title',
        }),
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.node.title).toBe('Updated Title');
    });

    it('prevents updating another user\'s node', async () => {
      const node = await createTestNode(testUser.id, 'character');
      const otherUser = await createTestUser();

      const response = await fetch('/api/nodes', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${otherUser.token}` },
        body: JSON.stringify({
          slug: node.slug,
          kind: node.kind,
          title: 'Hacked',
        }),
      });

      // Should create new node with same slug under other user
      // OR fail if slug is globally unique
      expect(response.status).toBe(403);
    });
  });

  describe('Delete', () => {
    it('deletes own node', async () => {
      const node = await createTestNode(testUser.id, 'character');

      const response = await fetch(`/api/nodes/${node.slug}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${testUser.token}` },
      });

      expect(response.status).toBe(200);

      // Verify deleted
      const getResponse = await fetch(`/api/nodes/${node.slug}`, {
        headers: { 'Authorization': `Bearer ${testUser.token}` },
      });

      expect(getResponse.status).toBe(404);
    });

    it('prevents deleting another user\'s node', async () => {
      const node = await createTestNode(testUser.id, 'character');
      const otherUser = await createTestUser();

      const response = await fetch(`/api/nodes/${node.slug}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${otherUser.token}` },
      });

      expect(response.status).toBe(403);
    });
  });
});
```

### 2. AI Content Generation

#### Quality Validation

```typescript
describe('AI Content Generation', () => {
  describe('Character Generation', () => {
    it('generates valid character with all required fields', async () => {
      const response = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${testUser.token}` },
        body: JSON.stringify({
          kind: 'character',
          prompt: 'A brave knight who protects the realm',
          context: { world: 'fantasy-realm' },
        }),
      });

      expect(response.status).toBe(200);
      const data = await response.json();

      // Validate structure
      expect(data.data.title).toBeTruthy();
      expect(data.data.summary).toBeTruthy();
      expect(data.data.content).toBeTruthy();
      expect(data.data.tags).toBeInstanceOf(Array);

      // Validate content fields
      expect(data.data.content.appearance).toBeTruthy();
      expect(data.data.content.lore).toBeTruthy();
      expect(data.data.content.capabilities).toBeTruthy();
    });

    it('respects world context in generation', async () => {
      const world = await createTestWorld(testUser.id, {
        title: 'Cyberpunk 2099',
        content: {
          appearance: 'A dystopian future city with neon lights',
          lore: 'Megacorporations rule the world',
        },
      });

      const response = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${testUser.token}` },
        body: JSON.stringify({
          kind: 'character',
          prompt: 'A hacker',
          context: {
            world: world.slug,
            worldData: world,
          },
        }),
      });

      const data = await response.json();

      // Content should reflect cyberpunk setting
      const content = JSON.stringify(data.data.content).toLowerCase();
      expect(
        content.includes('cyber') ||
        content.includes('tech') ||
        content.includes('neon') ||
        content.includes('corpo')
      ).toBe(true);
    });

    it('handles rate limiting', async () => {
      // Make 11 requests rapidly (limit is 10/min)
      const requests = Array(11).fill(null).map(() =>
        fetch('/api/ai/generate', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${testUser.token}` },
          body: JSON.stringify({
            kind: 'character',
            prompt: 'Test',
          }),
        })
      );

      const responses = await Promise.all(requests);

      // At least one should be rate limited
      const rateLimited = responses.some(r => r.status === 429);
      expect(rateLimited).toBe(true);
    });
  });

  describe('Story Generation with @slugs', () => {
    it('uses @slug references for selected characters', async () => {
      const char1 = await createTestNode(testUser.id, 'character', {
        slug: 'mira',
        title: 'Mira',
      });

      const char2 = await createTestNode(testUser.id, 'character', {
        slug: 'timo',
        title: 'Timo',
      });

      const response = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${testUser.token}` },
        body: JSON.stringify({
          kind: 'story',
          prompt: 'Write a scene where they meet',
          context: {
            selectedCharacters: [
              { slug: 'mira', name: 'Mira' },
              { slug: 'timo', name: 'Timo' },
            ],
          },
        }),
      });

      const data = await response.json();
      const lore = data.data.content.lore;

      // Should contain @slug references
      expect(lore).toMatch(/@mira/);
      expect(lore).toMatch(/@timo/);

      // Should NOT contain placeholder references
      expect(lore).not.toMatch(/REF_\d+/);
    });

    it('incorporates selected place into story', async () => {
      const place = await createTestNode(testUser.id, 'place', {
        slug: 'dark-forest',
        title: 'Dark Forest',
        content: {
          appearance: 'A dense, ominous forest',
        },
      });

      const response = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${testUser.token}` },
        body: JSON.stringify({
          kind: 'story',
          prompt: 'Write a scene',
          context: {
            selectedPlace: {
              slug: 'dark-forest',
              name: 'Dark Forest',
              appearance: 'A dense, ominous forest',
            },
          },
        }),
      });

      const data = await response.json();
      const lore = data.data.content.lore.toLowerCase();

      // Should reference the place
      expect(
        lore.includes('forest') ||
        lore.includes('dark') ||
        lore.includes('trees')
      ).toBe(true);
    });
  });
});
```

### 3. @slug Reference System

```typescript
describe('@slug Reference System', () => {
  describe('Parsing', () => {
    it('extracts @slugs from text', () => {
      const text = 'Once upon a time, @mira met @timo at @neo_station.';
      const slugs = extractSlugs(text);

      expect(slugs).toEqual(['mira', 'timo', 'neo_station']);
    });

    it('handles multiple references to same slug', () => {
      const text = '@mira said hello. @mira smiled.';
      const slugs = extractSlugs(text);

      expect(slugs).toEqual(['mira', 'mira']);
    });

    it('ignores invalid slug patterns', () => {
      const text = 'Email: user@example.com @valid-slug';
      const slugs = extractSlugs(text);

      // Should only extract valid slug format
      expect(slugs).toContain('valid-slug');
    });
  });

  describe('Resolution', () => {
    it('resolves @slugs to actual nodes', async () => {
      const char = await createTestNode(testUser.id, 'character', {
        slug: 'hero',
        title: 'The Hero',
      });

      const nodes = await resolveSlugReferences(['hero'], testWorld.slug);

      expect(nodes).toHaveLength(1);
      expect(nodes[0].id).toBe(char.id);
    });

    it('handles broken references gracefully', async () => {
      const nodes = await resolveSlugReferences(
        ['nonexistent-slug'],
        testWorld.slug
      );

      expect(nodes).toHaveLength(0);
    });

    it('filters by world context', async () => {
      const world1 = await createTestWorld(testUser.id);
      const world2 = await createTestWorld(testUser.id);

      const char1 = await createTestNode(testUser.id, 'character', {
        slug: 'mira',
        world_slug: world1.slug,
      });

      const char2 = await createTestNode(testUser.id, 'character', {
        slug: 'mira', // Same slug, different world
        world_slug: world2.slug,
      });

      const nodes = await resolveSlugReferences(['mira'], world1.slug);

      expect(nodes).toHaveLength(1);
      expect(nodes[0].id).toBe(char1.id);
    });
  });

  describe('Link Caching', () => {
    it('parses and caches _links from content', async () => {
      const node = await createTestNode(testUser.id, 'story', {
        content: {
          lore: '@hero fought @villain at @castle',
        },
      });

      // System should parse and populate _links
      const saved = await fetchNode(node.slug);

      expect(saved.content._links).toBeTruthy();
      expect(saved.content._links.cast).toContain('@hero');
      expect(saved.content._links.cast).toContain('@villain');
      expect(saved.content._links.places).toContain('@castle');
    });
  });
});
```

### 4. Search Functionality

```typescript
describe('Full-Text Search', () => {
  beforeAll(async () => {
    // Create test data
    await createTestNode(testUser.id, 'character', {
      title: 'Brave Knight',
      summary: 'A courageous warrior',
      content: { lore: 'Fought many dragons' },
    });

    await createTestNode(testUser.id, 'place', {
      title: 'Dragon Lair',
      summary: 'Home of the ancient dragon',
      content: { appearance: 'Dark cave filled with treasure' },
    });
  });

  it('searches across title and summary', async () => {
    const response = await fetch('/api/nodes?q=dragon', {
      headers: { 'Authorization': `Bearer ${testUser.token}` },
    });

    const data = await response.json();

    expect(data.nodes.length).toBeGreaterThan(0);
    expect(
      data.nodes.some(n => n.title.includes('Dragon') || n.summary.includes('dragon'))
    ).toBe(true);
  });

  it('searches within content fields', async () => {
    const response = await fetch('/api/nodes?q=treasure', {
      headers: { 'Authorization': `Bearer ${testUser.token}` },
    });

    const data = await response.json();

    expect(data.nodes.length).toBeGreaterThan(0);
  });

  it('combines search with filters', async () => {
    const response = await fetch('/api/nodes?q=dragon&kind=place', {
      headers: { 'Authorization': `Bearer ${testUser.token}` },
    });

    const data = await response.json();

    expect(data.nodes.every(n => n.kind === 'place')).toBe(true);
  });

  it('returns results within performance threshold', async () => {
    const start = Date.now();

    await fetch('/api/nodes?q=test', {
      headers: { 'Authorization': `Bearer ${testUser.token}` },
    });

    const duration = Date.now() - start;

    expect(duration).toBeLessThan(500); // < 500ms
  });
});
```

## Manual Testing Scenarios

### AI Generation Quality Review

For each AI generation feature, manually test:

1. **Content Quality:**
   - Is the generated text coherent and relevant?
   - Does it match the user's prompt?
   - Is it appropriate for the context?

2. **World Consistency:**
   - Does generated content respect world lore?
   - Are style guidelines followed?
   - Are canon facts maintained?

3. **@slug Usage:**
   - Are @slugs used correctly in stories?
   - Do they resolve to actual entities?
   - Are there any broken references?

4. **Edge Cases:**
   - Very short prompts (< 10 words)
   - Very long prompts (> 1000 words)
   - Special characters in prompts
   - Multiple selected characters (5+)

### User Workflow Testing

**Scenario: Create a Complete World**

1. Create new world
2. Generate 3 characters with AI
3. Generate 2 places with AI
4. Create a story featuring characters and places
5. Verify @slug references work
6. Search for content
7. Edit and update content
8. Delete one character
9. Verify story still displays correctly

**Scenario: Collaboration**

1. User A creates world as "shared"
2. User B views world
3. User B creates character in shared world
4. User A sees User B's character
5. Test permission boundaries

## Performance Testing

### Benchmarks

- **API Response Times:**
  - Node list: < 200ms
  - Single node fetch: < 100ms
  - Node create/update: < 300ms
  - Search query: < 500ms
  - AI generation: < 10s (text), < 30s (images)

- **Page Load Times:**
  - Homepage: < 1s
  - Node detail page: < 1.5s
  - Editor page: < 2s

### Load Testing

```typescript
// Test: 100 concurrent users searching
import { check } from 'k6';
import http from 'k6/http';

export let options = {
  vus: 100, // 100 virtual users
  duration: '30s',
};

export default function () {
  const response = http.get('https://worldream.app/api/nodes?q=test', {
    headers: { 'Authorization': 'Bearer ...' },
  });

  check(response, {
    'status is 200': (r) => r.status === 200,
    'response time < 500ms': (r) => r.timings.duration < 500,
  });
}
```

## Bug Reporting Standards

### Bug Report Template

```markdown
**Title:** [Component] Brief description

**Severity:** P0 (Critical) / P1 (High) / P2 (Medium) / P3 (Low)

**Environment:** Dev / Staging / Production

**Steps to Reproduce:**
1. Go to...
2. Click on...
3. Enter...
4. Observe...

**Expected Behavior:**
What should happen

**Actual Behavior:**
What actually happens

**Screenshots/Video:**
[Attach if applicable]

**Additional Context:**
- Browser: Chrome 120
- User role: Authenticated
- World slug: test-world
- Console errors: [paste here]
```

### Severity Definitions

- **P0 (Critical):** App is down or data loss occurs
- **P1 (High):** Major feature broken, affects many users
- **P2 (Medium):** Feature partially broken, workaround exists
- **P3 (Low):** Minor issue, cosmetic, or edge case

## Test Automation

### CI/CD Integration

```yaml
# .github/workflows/test.yml
name: Test Suite

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: '20'

      - name: Install pnpm
        run: npm install -g pnpm

      - name: Install dependencies
        run: pnpm install

      - name: Run unit tests
        run: pnpm test:unit

      - name: Run integration tests
        run: pnpm test:integration

      - name: Check type coverage
        run: pnpm check

      - name: Run linter
        run: pnpm lint
```

## Quality Metrics Dashboard

Track over time:

- **Test Coverage:** Target > 80%
- **Passing Tests:** Should be 100%
- **Bug Count by Severity:** Trend downward
- **AI Generation Quality:** User acceptance rate > 70%
- **Performance Metrics:** Stay within thresholds
- **User-Reported Issues:** Response time < 24h

## Collaboration with Other Roles

### With Product Owner:
- Validate acceptance criteria are testable
- Provide quality feedback on features
- Report on user-facing issues

### With Architect:
- Ensure architecture supports testing
- Discuss testability of designs
- Validate performance benchmarks

### With Senior Developer:
- Review complex feature tests
- Discuss edge cases and scenarios
- Validate AI generation quality

### With Developer:
- Review test coverage for new features
- Help write effective tests
- Validate bug fixes

### With Security Engineer:
- Test security controls
- Validate access permissions
- Check input validation

## Current Focus Areas

1. **AI Quality Metrics:** Establishing quantitative measures for AI output
2. **Automated E2E Tests:** Building Playwright test suite for critical flows
3. **Performance Monitoring:** Setting up real-time performance tracking
4. **Regression Test Suite:** Preventing previously fixed bugs from recurring
5. **Test Data Management:** Creating realistic test datasets

## Communication Style

When working with me:
- Provide clear reproduction steps for bugs
- Include expected vs actual behavior
- Share test scenarios and edge cases
- Discuss quality standards and acceptance criteria
- Report metrics and trends

I ensure Worldream maintains high quality through comprehensive testing and validation at every level.
