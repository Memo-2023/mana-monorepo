# Shared Tags Expert

## Module: @manacore/shared-tags
**Path:** `packages/shared-tags`
**Description:** Client library for interacting with the centralized tags system in mana-core-auth. Enables all Manacore apps (Todo, Calendar, Contacts, etc.) to create, manage, and query user tags with consistent colors and icons.
**Tech Stack:** TypeScript, Fetch API
**Key Dependencies:** None (zero dependencies)

## Identity
You are the **Shared Tags Expert**. You have deep knowledge of:
- Centralized tag management across multiple apps
- RESTful API client patterns with authentication
- Tag CRUD operations with color and icon metadata
- Date normalization from API responses
- Bulk tag resolution from junction tables
- Default tag initialization patterns

## Expertise
- Creating TagsClient instances with auth token providers
- Managing tags (create, read, update, delete)
- Resolving multiple tags by IDs for junction table data
- Creating default tags for new users
- Type-safe API responses with date normalization
- Cross-app tag consistency patterns

## Code Structure
```
packages/shared-tags/src/
├── types.ts    # Tag, CreateTagInput, UpdateTagInput, TagResponse
├── client.ts   # TagsClient class with API methods
└── index.ts    # Public exports
```

## Key Patterns

### Client Initialization
Create a client with auth token provider:
```typescript
import { createTagsClient } from '@manacore/shared-tags';

const tagsClient = createTagsClient({
  authUrl: 'http://localhost:3001', // mana-core-auth URL
  getToken: () => authService.getAppToken(), // Async or sync
});
```

### CRUD Operations
```typescript
// List all tags
const tags = await tagsClient.getAll();

// Get single tag
const tag = await tagsClient.getById('tag-id-123');

// Create tag
const newTag = await tagsClient.create({
  name: 'Work',
  color: '#3b82f6',
  icon: 'briefcase',
});

// Update tag
const updated = await tagsClient.update('tag-id-123', {
  name: 'Personal',
  color: '#10b981',
});

// Delete tag
await tagsClient.delete('tag-id-123');
```

### Bulk Tag Resolution
Useful for resolving tagIds from junction tables (e.g., `contact_tags`):
```typescript
// contact_tags table has: contact_id, tag_id
const tagIds = contactTags.map(ct => ct.tag_id);
const tags = await tagsClient.getByIds(tagIds); // Fetches all in one request
```

### Default Tags
Initialize default tags for new users:
```typescript
const defaultTags = await tagsClient.createDefaults();
// Returns tags like: Work, Personal, Important, etc.
```

## Types

### Tag
```typescript
interface Tag {
  id: string;
  userId: string;
  name: string;
  color: string;        // Hex color code
  icon?: string | null; // Icon identifier
  createdAt: Date;      // Normalized from API string
  updatedAt: Date;      // Normalized from API string
}
```

### CreateTagInput
```typescript
interface CreateTagInput {
  name: string;
  color?: string;  // Optional, API provides default
  icon?: string;
}
```

### UpdateTagInput
```typescript
interface UpdateTagInput {
  name?: string;
  color?: string;
  icon?: string;
}
```

### TagResponse
```typescript
type TagResponse = Omit<Tag, 'createdAt' | 'updatedAt'> & {
  createdAt: string;  // API returns ISO date strings
  updatedAt: string;
};
```

## API Endpoints
All endpoints are relative to `/api/v1` on mana-core-auth:

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/tags` | List all user tags |
| GET | `/tags/:id` | Get single tag |
| GET | `/tags/by-ids?ids=id1,id2` | Get multiple tags by IDs |
| POST | `/tags` | Create new tag |
| PUT | `/tags/:id` | Update tag |
| DELETE | `/tags/:id` | Delete tag |
| POST | `/tags/defaults` | Create default tags |

## Integration Points
- **Used by:** All frontend apps (Todo, Calendar, Contacts, etc.)
- **Depends on:** mana-core-auth service (tags API)
- **Works with:** Any app needing user-defined labels/categories
- **Authentication:** Requires JWT token from mana-core-auth

## Common Tasks

### Initialize in SvelteKit app
```typescript
// src/lib/tags.ts
import { createTagsClient } from '@manacore/shared-tags';
import { authService } from '$lib/auth';
import { PUBLIC_MANA_CORE_AUTH_URL } from '$env/static/public';

export const tagsClient = createTagsClient({
  authUrl: PUBLIC_MANA_CORE_AUTH_URL,
  getToken: () => authService.getAppToken(),
});
```

### Display tags in UI
```svelte
<script lang="ts">
  import { tagsClient } from '$lib/tags';

  let tags = $state<Tag[]>([]);

  $effect(() => {
    tagsClient.getAll().then(result => tags = result);
  });
</script>

{#each tags as tag}
  <span style="background-color: {tag.color}">
    {#if tag.icon}<Icon name={tag.icon} />{/if}
    {tag.name}
  </span>
{/each}
```

### Resolve tags for contacts
```typescript
// In contacts app - resolve tag names/colors from tag IDs
interface ContactTag {
  contact_id: string;
  tag_id: string;
}

async function getContactWithTags(contactId: string) {
  const contact = await getContact(contactId);
  const contactTags = await getContactTags(contactId); // Returns ContactTag[]

  const tagIds = contactTags.map(ct => ct.tag_id);
  const tags = await tagsClient.getByIds(tagIds);

  return {
    ...contact,
    tags, // Full Tag objects with names, colors, icons
  };
}
```

### Create default tags on first login
```typescript
// In app initialization
async function initializeUserData(userId: string) {
  const existingTags = await tagsClient.getAll();

  if (existingTags.length === 0) {
    await tagsClient.createDefaults();
  }
}
```

## Best Practices
1. **Initialize defaults early** - Call `createDefaults()` on first login
2. **Use bulk resolution** - Use `getByIds()` instead of multiple `getById()` calls
3. **Handle auth errors** - Token provider should refresh expired tokens
4. **Cache tags locally** - Tags change infrequently, cache in app state
5. **Consistent colors** - Use standardized color palettes for better UX
6. **Error handling** - API throws errors, wrap calls in try/catch

## Date Handling
The client automatically normalizes date strings from API responses:
- API returns: `{ createdAt: "2024-01-15T10:30:00Z" }`
- Client returns: `{ createdAt: Date object }`

## How to Use
```
"Read packages/shared-tags/.agent/ and help me with..."
```
