# Chat Types Package Agent

## Module Information

- **Package Name:** `@chat/types`
- **Path:** `apps/chat/packages/chat-types`
- **Version:** 1.0.0
- **Type:** Shared TypeScript Type Definitions Package
- **Visibility:** Private (workspace only)

### Description

Central type definition package for the Chat application. Provides shared TypeScript interfaces and types used across all Chat apps (web, mobile, backend, landing). This ensures type safety and consistency across the entire Chat ecosystem without duplicating type definitions.

### Technology Stack

- **TypeScript:** 5.x (strict mode)
- **Build:** None (uses source TypeScript directly via workspace references)
- **Module System:** ES Modules (type: "module")

### Dependencies

None - this is a pure TypeScript definition package with no runtime dependencies.

### Consumers

- **@chat/web** - SvelteKit web application (primary consumer)
- **@chat/backend** - NestJS backend (defines own schema types, may reference these)
- **@chat/mobile** - Expo mobile app (future consumer)
- **@chat/landing** - Astro landing page (minimal/no usage)

---

## Identity

I am the **Chat Types Expert**, the authoritative source for all TypeScript type definitions used across the Chat application ecosystem.

### What I Know

- All shared interfaces for Chat domain entities (conversations, messages, models, templates, spaces, documents)
- Type contracts between frontend and backend
- API response/request type structures
- AI model configuration types
- Token usage and billing types
- Space collaboration types
- Document mode types
- Template system types

### What I Don't Handle

- Runtime validation logic (handled by Zod schemas in consuming apps)
- Database schema definitions (defined in @chat/backend using Drizzle)
- API endpoint implementations (handled by @chat/backend controllers)
- UI component types (defined in consuming apps)

---

## Expertise Areas

### 1. Core Chat Entities

**Conversations:**
- Full conversation metadata (mode, archival, pinning state)
- Support for free, guided, and template modes
- Document mode toggle
- Space association

**Messages:**
- Message structure for chat history
- Sender types (user, assistant, system)
- ChatMessage format for AI API requests

**AI Models:**
- Model configuration and parameters
- Multi-provider support (gemini, azure, openai)
- Temperature and token settings
- Active/default state management

### 2. Advanced Features

**Templates:**
- Custom chat templates with system prompts
- Initial question support
- Color coding
- Model associations
- Create/Update type helpers

**Spaces:**
- Collaborative workspace definitions
- Space membership and roles
- Invitation workflows
- Owner/admin/member/viewer hierarchy

**Documents:**
- Document versioning
- Conversation-to-document associations
- Extended types with conversation metadata

### 3. AI Integration Types

**Token Usage:**
- OpenAI/OpenRouter compatible token counting
- Prompt, completion, and total tokens

**Chat Completions:**
- Streaming and non-streaming response types
- Usage metadata inclusion

---

## Code Structure

```
apps/chat/packages/chat-types/
├── src/
│   └── index.ts          # Single source file with all type exports
├── package.json          # Minimal workspace package config
└── .agent/
    ├── agent.md          # This file
    └── memory.md         # Learning history
```

### Single File Architecture

All types are defined in `/src/index.ts` - no subdirectories. This keeps the package simple and easy to maintain since types don't have runtime logic.

---

## Key Patterns & Types Defined

### Message Types

```typescript
// For AI API requests (OpenRouter/OpenAI format)
ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

// For database storage and UI display
Message {
  id, conversationId, sender, messageText, timestamps
}
```

### Conversation Types

```typescript
Conversation {
  id, userId, modelId, templateId?, spaceId?
  conversationMode: 'free' | 'guided' | 'template'
  documentMode: boolean
  title?, isArchived, isPinned
  timestamps
}
```

### AI Model Types

```typescript
AIModel {
  id, name, description?
  provider: 'gemini' | 'azure' | 'openai'
  parameters: AIModelParameters
  isActive, isDefault
}

AIModelParameters {
  model?, temperature, maxTokens?, max_tokens?
}
```

### Template Types

```typescript
Template {
  id, userId, name, description?
  systemPrompt, initialQuestion?
  modelId?, color
  isDefault, documentMode
  timestamps
}

// Helper types
TemplateCreate = Omit<Template, 'id' | 'createdAt' | 'updatedAt'>
TemplateUpdate = Partial<Omit<Template, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>
```

### Space Types

```typescript
Space {
  id, name, description?
  ownerId, isArchived
  timestamps
}

SpaceMember {
  id, spaceId, userId
  role: 'owner' | 'admin' | 'member' | 'viewer'
  invitationStatus: 'pending' | 'accepted' | 'declined'
  invitedBy?, invitedAt, joinedAt?
  timestamps
}

// Helper types
SpaceCreate = Pick<Space, 'name' | 'description' | 'ownerId'>
SpaceUpdate = Partial<Pick<Space, 'name' | 'description' | 'isArchived'>>
```

### Document Types

```typescript
Document {
  id, conversationId, content
  version, timestamps
}

DocumentWithConversation extends Document {
  conversationTitle: string
}
```

### API Response Types

```typescript
TokenUsage {
  prompt_tokens, completion_tokens, total_tokens
}

ChatCompletionResponse {
  content: string
  usage: TokenUsage
}
```

---

## Integration Points

### Web App (@chat/web)

Primary consumer - imports types throughout:

**Stores:**
- `src/lib/stores/conversations.svelte.ts` - Uses `Conversation` type
- `src/lib/stores/templates.svelte.ts` - Uses `Template`, `TemplateCreate`, `TemplateUpdate`
- `src/lib/stores/spaces.svelte.ts` - Uses `Space`, `SpaceMember`

**Services:**
- Type all API requests/responses
- Ensure type safety in HTTP client code

**Pages:**
- Type component props and reactive state
- All protected routes use these types

### Backend (@chat/backend)

**Current Status:**
- Backend defines its own types using Drizzle schema inference
- `Model`, `NewModel` etc. from `typeof schema.$inferSelect`
- Backend types may drift from @chat/types

**Potential Integration:**
- Backend could export types that match @chat/types
- Or @chat/types could be generated from backend schemas
- Currently treated as separate concerns

### Mobile App (@chat/mobile)

**Future Consumer:**
- Will use same types as web app
- Ensures consistency across platforms
- React Native components will type props with these interfaces

---

## How to Use

### Adding This Package to a Project

```json
// In consuming package.json
{
  "dependencies": {
    "@chat/types": "workspace:*"
  }
}
```

### Importing Types

```typescript
// Import specific types
import type { Conversation, Message, AIModel } from '@chat/types';

// Import for type annotations
import type { Template, TemplateCreate } from '@chat/types';

// Use in Svelte 5 runes
let conversations = $state<Conversation[]>([]);
let selectedModel = $state<AIModel | null>(null);

// Use in React/React Native
const [template, setTemplate] = useState<Template | null>(null);

// Use in NestJS controllers
@Post()
async create(@Body() data: TemplateCreate): Promise<Template> {
  // ...
}
```

### Type Conventions

1. **Entity Types** - Full objects with all fields (e.g., `Conversation`, `Template`)
2. **Create Types** - Omit generated fields like `id`, `createdAt`, `updatedAt`
3. **Update Types** - Partial types excluding immutable fields like `id`, `userId`
4. **Extended Types** - Add related data (e.g., `DocumentWithConversation`)

### Adding New Types

When adding new entity types to the Chat application:

1. **Define in single file** - Add to `/src/index.ts`
2. **Export immediately** - Make available to all consumers
3. **Follow naming conventions:**
   - PascalCase for interfaces
   - Descriptive names (avoid abbreviations)
   - Suffix with Create/Update for helper types
4. **Document the purpose** - Add JSDoc comments for complex types
5. **Consider helpers** - Add Create/Update variants for entities with CRUD operations

### Updating Existing Types

1. **Consider breaking changes** - Adding required fields breaks consumers
2. **Prefer optional fields** - Use `field?: type` for new additions
3. **Update all consumers** - Search workspace for type usage
4. **Coordinate with backend** - Ensure schema alignment
5. **Test thoroughly** - Run type-check across workspace

---

## Best Practices

### Type Safety

- Always use `type` imports: `import type { ... }`
- Never use `any` - prefer `unknown` if truly dynamic
- Use union types for enums: `'free' | 'guided' | 'template'`
- Leverage TypeScript strict mode

### Maintainability

- Keep single file structure - don't split unnecessarily
- Group related types together
- Add comments for non-obvious constraints
- Use consistent field naming (camelCase)

### Performance

- Types are compile-time only - no runtime cost
- No bundling needed - direct .ts imports work
- Workspace references enable fast builds

### Documentation

- Complex types need JSDoc comments
- Explain business logic, not syntax
- Document field constraints and relationships

---

## Common Patterns

### Optional vs Required Fields

```typescript
// Required fields have no ?
interface Space {
  id: string;           // Always present
  name: string;         // Always present
  description?: string; // Optional
}
```

### Timestamp Fields

```typescript
// Standard timestamp pattern
interface Entity {
  createdAt: string;    // ISO 8601 string from backend
  updatedAt: string;    // ISO 8601 string from backend
}
```

### Helper Type Generation

```typescript
// Omit generated/immutable fields for creates
type TemplateCreate = Omit<Template, 'id' | 'createdAt' | 'updatedAt'>;

// Partial + Omit for updates
type TemplateUpdate = Partial<Omit<Template, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>;

// Pick specific fields
type SpaceCreate = Pick<Space, 'name' | 'description' | 'ownerId'>;
```

### Extending Types

```typescript
// Extend with additional fields
interface DocumentWithConversation extends Document {
  conversationTitle: string;
}
```

---

## Migration Guide

### From Backend Schema Types to Shared Types

If backend currently uses Drizzle-inferred types:

```typescript
// Before (backend only)
import { Model } from '../db/schema/models.schema';

// After (shared)
import type { AIModel } from '@chat/types';
```

### Handling Discrepancies

Backend schema types vs @chat/types differences:

1. **Field naming** - Backend uses snake_case DB columns, types use camelCase
2. **Optional fields** - Backend may mark more fields as optional (nullable)
3. **Extra fields** - Backend may include audit fields not needed in frontend
4. **Type transformations** - Convert Date objects to string timestamps

---

## Troubleshooting

### Type Errors in Consumers

**Problem:** "Type 'X' is not assignable to type 'Y'"

**Solution:**
- Check if backend response matches expected type
- Verify field names match (camelCase vs snake_case)
- Ensure all required fields are provided
- Check for missing optional field handling

### Import Errors

**Problem:** "Cannot find module '@chat/types'"

**Solution:**
- Run `pnpm install` to update workspace links
- Verify `@chat/types` is in package.json dependencies
- Check TypeScript paths are configured for workspace packages
- Restart TypeScript server in IDE

### Breaking Changes

**Problem:** Adding required field breaks all consumers

**Solution:**
- Make new fields optional with `?`
- Deprecate in phases (optional → required → remove old)
- Coordinate updates across all consuming apps
- Consider versioning for major changes

---

## Future Enhancements

### Potential Additions

1. **Validation Integration**
   - Generate Zod schemas from types
   - Runtime type checking helpers
   - API contract validation

2. **Type Generators**
   - Auto-generate from backend Drizzle schemas
   - Ensure backend/frontend type alignment
   - Reduce manual synchronization

3. **Shared Enums**
   - Extract magic strings to const enums
   - Provider types, role types, status types
   - Better autocomplete and type safety

4. **API Types**
   - Request/response wrappers
   - Error response types
   - Pagination types

5. **Extended Types**
   - More joined/enriched entity types
   - UI-specific type extensions
   - Analytics and reporting types

---

## Related Documentation

- **Chat Project:** [apps/chat/CLAUDE.md](/Users/wuesteon/dev/mana_universe/add-agents/apps/chat/CLAUDE.md)
- **Chat Web:** [apps/chat/apps/web/.agent/agent.md](/Users/wuesteon/dev/mana_universe/add-agents/apps/chat/apps/web/.agent/agent.md)
- **Chat Backend:** [apps/chat/apps/backend/.agent/agent.md](/Users/wuesteon/dev/mana_universe/add-agents/apps/chat/apps/backend/.agent/agent.md)
- **Root Guidelines:** [.claude/GUIDELINES.md](/Users/wuesteon/dev/mana_universe/add-agents/.claude/GUIDELINES.md)
- **TypeScript Style:** [.claude/guidelines/code-style.md](/Users/wuesteon/dev/mana_universe/add-agents/.claude/guidelines/code-style.md)

---

**Package Signature:** @chat/types - Shared Type Definitions for Chat Ecosystem
