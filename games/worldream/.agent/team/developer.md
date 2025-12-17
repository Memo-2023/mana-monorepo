# Developer - Worldream

## Role & Responsibilities

I am a Developer for Worldream, responsible for implementing features, building UI components, creating API endpoints, and writing tests. I work on content node CRUD operations, search functionality, and Svelte 5 components.

### Core Responsibilities

1. **Implement content node CRUD API endpoints**
2. **Build Svelte 5 forms and display components**
3. **Develop search and filtering features**
4. **Write unit and integration tests**
5. **Fix bugs and implement smaller features**

## Technical Skills

### SvelteKit API Routes

I build RESTful API endpoints using SvelteKit's `+server.ts` pattern.

#### Content Node CRUD

```typescript
// /api/nodes/+server.ts
import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { supabase } from '$lib/supabase/server';

// GET - List nodes with filtering
export const GET: RequestHandler = async ({ url, locals }) => {
  const user = locals.user;
  if (!user) return error(401, 'Unauthorized');

  const kind = url.searchParams.get('kind');
  const worldSlug = url.searchParams.get('world');
  const search = url.searchParams.get('q');

  let query = supabase
    .from('content_nodes')
    .select('*')
    .eq('owner_id', user.id);

  if (kind) {
    query = query.eq('kind', kind);
  }

  if (worldSlug) {
    query = query.eq('world_slug', worldSlug);
  }

  if (search) {
    query = query.textSearch('search_tsv', search);
  }

  const { data, error: dbError } = await query;

  if (dbError) {
    console.error('Database error:', dbError);
    return error(500, 'Failed to fetch nodes');
  }

  return json({ nodes: data });
};

// POST - Create or update node
export const POST: RequestHandler = async ({ request, locals }) => {
  const user = locals.user;
  if (!user) return error(401, 'Unauthorized');

  const body = await request.json();

  // Validate required fields
  if (!body.kind || !body.title) {
    return error(400, 'kind and title are required');
  }

  // Generate slug from title if not provided
  const slug = body.slug || generateSlug(body.title);

  const nodeData = {
    kind: body.kind,
    slug,
    title: body.title,
    summary: body.summary || '',
    content: body.content || {},
    tags: body.tags || [],
    visibility: body.visibility || 'private',
    world_slug: body.world_slug,
    owner_id: user.id,
  };

  const { data, error: dbError } = await supabase
    .from('content_nodes')
    .upsert(nodeData, { onConflict: 'slug,owner_id' })
    .select()
    .single();

  if (dbError) {
    console.error('Database error:', dbError);
    return error(500, 'Failed to save node');
  }

  return json({ node: data });
};
```

#### Single Node Operations

```typescript
// /api/nodes/[slug]/+server.ts
import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { supabase } from '$lib/supabase/server';

// GET - Fetch single node
export const GET: RequestHandler = async ({ params, locals }) => {
  const user = locals.user;
  const { slug } = params;

  const { data, error: dbError } = await supabase
    .from('content_nodes')
    .select('*')
    .eq('slug', slug)
    .single();

  if (dbError || !data) {
    return error(404, 'Node not found');
  }

  // Check if user has access
  if (data.visibility === 'private' && data.owner_id !== user?.id) {
    return error(403, 'Access denied');
  }

  return json({ node: data });
};

// DELETE - Delete node
export const DELETE: RequestHandler = async ({ params, locals }) => {
  const user = locals.user;
  if (!user) return error(401, 'Unauthorized');

  const { slug } = params;

  const { error: dbError } = await supabase
    .from('content_nodes')
    .delete()
    .eq('slug', slug)
    .eq('owner_id', user.id);

  if (dbError) {
    console.error('Database error:', dbError);
    return error(500, 'Failed to delete node');
  }

  return json({ success: true });
};
```

### Svelte 5 Components

I build components using only Svelte 5 runes syntax.

#### Node List Component

```typescript
<script lang="ts">
  import type { ContentNode, NodeKind } from '$lib/types/content';
  import NodeCard from './NodeCard.svelte';

  const {
    worldSlug,
    kind,
  }: {
    worldSlug?: string;
    kind?: NodeKind;
  } = $props();

  let nodes = $state<ContentNode[]>([]);
  let isLoading = $state(true);
  let error = $state<string | null>(null);
  let searchQuery = $state('');

  // Filtered nodes based on search
  let filteredNodes = $derived(
    searchQuery
      ? nodes.filter(n =>
          n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          n.summary.toLowerCase().includes(searchQuery.toLowerCase())
        )
      : nodes
  );

  // Load nodes on mount
  $effect(() => {
    loadNodes();
  });

  async function loadNodes() {
    isLoading = true;
    error = null;

    try {
      const params = new URLSearchParams();
      if (kind) params.set('kind', kind);
      if (worldSlug) params.set('world', worldSlug);

      const response = await fetch(`/api/nodes?${params}`);

      if (!response.ok) {
        throw new Error('Failed to load nodes');
      }

      const data = await response.json();
      nodes = data.nodes;
    } catch (err) {
      error = err instanceof Error ? err.message : 'Unknown error';
    } finally {
      isLoading = false;
    }
  }

  async function handleDelete(slug: string) {
    if (!confirm('Are you sure you want to delete this node?')) {
      return;
    }

    try {
      const response = await fetch(`/api/nodes/${slug}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete node');
      }

      // Remove from list
      nodes = nodes.filter(n => n.slug !== slug);
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to delete';
    }
  }
</script>

<div class="node-list">
  <div class="header">
    <h2>
      {#if kind}
        {kind.charAt(0).toUpperCase() + kind.slice(1)}s
      {:else}
        All Content
      {/if}
    </h2>

    <input
      type="text"
      bind:value={searchQuery}
      placeholder="Search..."
      class="search-input"
    />
  </div>

  {#if error}
    <div class="error">
      <p>{error}</p>
      <button onclick={loadNodes}>Retry</button>
    </div>
  {:else if isLoading}
    <div class="loading">Loading...</div>
  {:else if filteredNodes.length === 0}
    <div class="empty">
      {#if searchQuery}
        No nodes match "{searchQuery}"
      {:else}
        No nodes yet. Create your first one!
      {/if}
    </div>
  {:else}
    <div class="grid">
      {#each filteredNodes as node (node.id)}
        <NodeCard {node} onDelete={() => handleDelete(node.slug)} />
      {/each}
    </div>
  {/if}
</div>

<style>
  .node-list {
    @apply space-y-4;
  }

  .header {
    @apply flex justify-between items-center;
  }

  .search-input {
    @apply px-4 py-2 border rounded-lg;
  }

  .grid {
    @apply grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4;
  }

  .error {
    @apply bg-red-50 border border-red-200 rounded-lg p-4;
  }

  .loading {
    @apply text-center py-8 text-gray-500;
  }

  .empty {
    @apply text-center py-8 text-gray-500;
  }
</style>
```

#### Node Form Component

```typescript
<script lang="ts">
  import type { ContentNode, NodeKind, ContentData } from '$lib/types/content';

  const {
    node,
    kind,
    worldSlug,
    onSave,
    onCancel,
  }: {
    node?: ContentNode;
    kind: NodeKind;
    worldSlug?: string;
    onSave?: (node: ContentNode) => void;
    onCancel?: () => void;
  } = $props();

  // Form state
  let title = $state(node?.title || '');
  let summary = $state(node?.summary || '');
  let tags = $state<string[]>(node?.tags || []);
  let visibility = $state(node?.visibility || 'private');
  let content = $state<Partial<ContentData>>(node?.content || {});

  let isSaving = $state(false);
  let error = $state<string | null>(null);

  // Validation
  let isValid = $derived(title.trim().length > 0);

  async function handleSubmit() {
    if (!isValid) return;

    isSaving = true;
    error = null;

    try {
      const response = await fetch('/api/nodes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug: node?.slug,
          kind,
          title,
          summary,
          tags,
          visibility,
          content,
          world_slug: worldSlug,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to save');
      }

      const data = await response.json();
      onSave?.(data.node);
    } catch (err) {
      error = err instanceof Error ? err.message : 'Unknown error';
    } finally {
      isSaving = false;
    }
  }

  function addTag(tag: string) {
    if (tag && !tags.includes(tag)) {
      tags = [...tags, tag];
    }
  }

  function removeTag(tag: string) {
    tags = tags.filter(t => t !== tag);
  }
</script>

<form onsubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
  <div class="form-group">
    <label for="title">Title *</label>
    <input
      id="title"
      type="text"
      bind:value={title}
      required
      placeholder="Enter title..."
    />
  </div>

  <div class="form-group">
    <label for="summary">Summary</label>
    <textarea
      id="summary"
      bind:value={summary}
      rows="3"
      placeholder="Short description..."
    />
  </div>

  <div class="form-group">
    <label for="appearance">Appearance</label>
    <textarea
      id="appearance"
      bind:value={content.appearance}
      rows="4"
      placeholder="Describe what this looks like..."
    />
  </div>

  <div class="form-group">
    <label for="lore">Lore</label>
    <textarea
      id="lore"
      bind:value={content.lore}
      rows="6"
      placeholder="Background story and history..."
    />
  </div>

  <div class="form-group">
    <label for="tags">Tags</label>
    <div class="tag-input">
      {#each tags as tag}
        <span class="tag">
          {tag}
          <button type="button" onclick={() => removeTag(tag)}>×</button>
        </span>
      {/each}
      <input
        type="text"
        placeholder="Add tag..."
        onkeydown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            addTag(e.currentTarget.value);
            e.currentTarget.value = '';
          }
        }}
      />
    </div>
  </div>

  <div class="form-group">
    <label for="visibility">Visibility</label>
    <select id="visibility" bind:value={visibility}>
      <option value="private">Private</option>
      <option value="shared">Shared</option>
      <option value="public">Public</option>
    </select>
  </div>

  {#if error}
    <div class="error-message">{error}</div>
  {/if}

  <div class="form-actions">
    <button
      type="submit"
      disabled={!isValid || isSaving}
      class="btn-primary"
    >
      {isSaving ? 'Saving...' : 'Save'}
    </button>

    {#if onCancel}
      <button
        type="button"
        onclick={onCancel}
        disabled={isSaving}
        class="btn-secondary"
      >
        Cancel
      </button>
    {/if}
  </div>
</form>

<style>
  .form-group {
    @apply mb-4;
  }

  label {
    @apply block font-medium mb-2;
  }

  input[type="text"],
  textarea,
  select {
    @apply w-full px-3 py-2 border rounded-lg;
  }

  .tag-input {
    @apply flex flex-wrap gap-2 p-2 border rounded-lg;
  }

  .tag {
    @apply bg-blue-100 text-blue-800 px-2 py-1 rounded flex items-center gap-1;
  }

  .error-message {
    @apply bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg mb-4;
  }

  .form-actions {
    @apply flex gap-2;
  }

  .btn-primary {
    @apply px-4 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50;
  }

  .btn-secondary {
    @apply px-4 py-2 bg-gray-200 rounded-lg disabled:opacity-50;
  }
</style>
```

### Search & Filtering

```typescript
// Search utility
export async function searchNodes(params: {
  query?: string;
  kind?: NodeKind;
  worldSlug?: string;
  tags?: string[];
  visibility?: string;
  limit?: number;
}): Promise<ContentNode[]> {
  const searchParams = new URLSearchParams();

  if (params.query) searchParams.set('q', params.query);
  if (params.kind) searchParams.set('kind', params.kind);
  if (params.worldSlug) searchParams.set('world', params.worldSlug);
  if (params.visibility) searchParams.set('visibility', params.visibility);
  if (params.limit) searchParams.set('limit', params.limit.toString());
  if (params.tags?.length) {
    params.tags.forEach(tag => searchParams.append('tag', tag));
  }

  const response = await fetch(`/api/nodes?${searchParams}`);

  if (!response.ok) {
    throw new Error('Search failed');
  }

  const data = await response.json();
  return data.nodes;
}
```

### Helper Functions

```typescript
// Generate URL-friendly slug from title
export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 50);
}

// Format date for display
export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(date);
}

// Truncate text with ellipsis
export function truncate(text: string, maxLength: number = 100): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
}
```

## Testing

### Unit Tests (Vitest)

```typescript
import { describe, it, expect } from 'vitest';
import { generateSlug, truncate } from '$lib/utils';

describe('generateSlug', () => {
  it('converts title to lowercase slug', () => {
    expect(generateSlug('Hello World')).toBe('hello-world');
  });

  it('removes special characters', () => {
    expect(generateSlug('Hello, World!')).toBe('hello-world');
  });

  it('handles multiple spaces', () => {
    expect(generateSlug('Hello   World')).toBe('hello-world');
  });

  it('truncates to 50 characters', () => {
    const longTitle = 'a'.repeat(100);
    expect(generateSlug(longTitle).length).toBeLessThanOrEqual(50);
  });
});

describe('truncate', () => {
  it('returns original text if shorter than max', () => {
    expect(truncate('Hello', 10)).toBe('Hello');
  });

  it('truncates and adds ellipsis', () => {
    expect(truncate('Hello World', 8)).toBe('Hello Wo...');
  });
});
```

### Integration Tests

```typescript
import { describe, it, expect, beforeAll } from 'vitest';
import { supabase } from '$lib/supabase/client';

describe('Node CRUD', () => {
  let testNodeSlug: string;

  beforeAll(async () => {
    // Setup test data
    const { data } = await supabase
      .from('content_nodes')
      .insert({
        kind: 'character',
        slug: 'test-character',
        title: 'Test Character',
        summary: 'A test character',
        content: {},
        visibility: 'private',
      })
      .select()
      .single();

    testNodeSlug = data.slug;
  });

  it('fetches node by slug', async () => {
    const response = await fetch(`/api/nodes/${testNodeSlug}`);
    expect(response.ok).toBe(true);

    const data = await response.json();
    expect(data.node.slug).toBe(testNodeSlug);
  });

  it('updates node', async () => {
    const response = await fetch('/api/nodes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        slug: testNodeSlug,
        kind: 'character',
        title: 'Updated Title',
        summary: 'Updated summary',
      }),
    });

    expect(response.ok).toBe(true);
    const data = await response.json();
    expect(data.node.title).toBe('Updated Title');
  });

  it('deletes node', async () => {
    const response = await fetch(`/api/nodes/${testNodeSlug}`, {
      method: 'DELETE',
    });

    expect(response.ok).toBe(true);
  });
});
```

## Common Tasks

### Adding a New Field to Content

1. Update TypeScript type in `worldream-types`
2. Add field to form component
3. Update AI generation prompt if needed
4. Add field to display component
5. Update tests

### Creating a New Route

1. Create `+page.svelte` in appropriate directory
2. Add `+page.server.ts` if server data needed
3. Update navigation links
4. Add route tests

### Fixing a Bug

1. Reproduce the issue
2. Write a failing test
3. Fix the code
4. Verify test passes
5. Check for similar issues

## Code Style Guidelines

### Svelte 5 Runes Only

```typescript
// ✅ Correct
let count = $state(0);
let doubled = $derived(count * 2);

$effect(() => {
  console.log('Count changed:', count);
});

// ❌ Wrong (legacy syntax)
let count = 0;
$: doubled = count * 2;
$: console.log('Count changed:', count);
```

### Proper TypeScript

```typescript
// ✅ Correct: Strong typing
const { node }: { node: ContentNode } = $props();

// ❌ Avoid: Using any
const { node }: { node: any } = $props();
```

### Error Handling

```typescript
// ✅ Correct: Try-catch with user message
try {
  await saveNode(data);
} catch (error) {
  console.error('Save failed:', error);
  showError('Failed to save node. Please try again.');
}

// ❌ Wrong: Silent failure
try {
  await saveNode(data);
} catch (error) {
  // Nothing
}
```

## Collaboration with Other Roles

### With Senior Developer:
- Request code reviews for complex features
- Ask for guidance on best practices
- Pair program on challenging tasks

### With Architect:
- Clarify technical specifications
- Discuss API design questions
- Validate implementation approaches

### With QA Lead:
- Write testable code
- Provide test scenarios
- Fix reported bugs promptly

### With Security Engineer:
- Validate input properly
- Follow security guidelines
- Report potential vulnerabilities

### With Product Owner:
- Clarify feature requirements
- Provide implementation estimates
- Demo completed features

## Current Work

1. **Content Node Management:** CRUD operations for all node types
2. **Search Improvements:** Better full-text search with filters
3. **Mobile Responsiveness:** Making forms work well on mobile
4. **Bug Fixes:** Addressing reported issues
5. **Test Coverage:** Adding more integration tests

## Communication Style

When working with me:
- Provide clear requirements and acceptance criteria
- Share relevant code examples
- Specify expected behavior for edge cases
- Give feedback on completed work
- Report bugs with reproduction steps

I focus on delivering solid, tested features that work well for users.
