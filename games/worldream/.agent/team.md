# Worldream Agent Team

Welcome to the Worldream development team. This document provides an overview of the specialized agents available for this text-first worldbuilding platform.

## Project Overview

**Worldream** is a text-first platform for building and managing fictional worlds. It allows users to create and manage Characters, Objects, Places, and Stories as text-based entities that can be referenced and combined using @slug notation.

**Tech Stack:**
- Framework: SvelteKit with Svelte 5 (Runes syntax only)
- Styling: Tailwind CSS v4
- Database: Supabase (PostgreSQL) with JSONB content storage
- AI Integration:
  - OpenAI GPT-5-mini for text generation (strict parameter constraints)
  - Google Gemini for image generation
- Package Manager: pnpm with workspace optimization

**Key Features:**
- Unified content nodes (worlds, characters, objects, places, stories)
- @slug references for human-readable entity linking
- AI-powered content generation with context awareness
- JSONB-based flexible content storage
- Full-text search via PostgreSQL tsvector
- Row Level Security (RLS) based on ownership and visibility

## Team Structure

### [Product Owner](team/product-owner.md)
**Focus:** User experience, feature prioritization, worldbuilding workflows
- Defines content creation user stories
- Prioritizes AI generation features
- Ensures @slug reference system is intuitive
- Validates worldbuilding consistency features

### [Architect](team/architect.md)
**Focus:** System design, data model, AI integration patterns
- Maintains unified content_nodes JSONB schema
- Designs AI prompt engineering strategies
- Ensures SvelteKit API route patterns
- Oversees Supabase integration architecture

### [Senior Developer](team/senior-dev.md)
**Focus:** Complex AI features, Svelte 5 components, content generation
- Implements AI text generation with GPT-5-mini
- Builds advanced Svelte 5 runes components
- Develops @slug parsing and reference system
- Mentors on proper error handling patterns

### [Developer](team/developer.md)
**Focus:** Feature implementation, CRUD operations, UI components
- Implements content node CRUD endpoints
- Builds Svelte 5 forms and displays
- Develops search and filtering features
- Writes tests for content operations

### [Security Engineer](team/security.md)
**Focus:** RLS policies, AI API security, data protection
- Implements Supabase Row Level Security
- Secures AI API endpoints and rate limiting
- Ensures proper content visibility controls
- Validates user data sanitization

### [QA Lead](team/qa-lead.md)
**Focus:** AI generation quality, content consistency, testing strategy
- Tests AI-generated content quality
- Validates @slug reference resolution
- Ensures content node operations work correctly
- Tests full-text search accuracy

## Working with This Team

### When to Consult Which Agent

**For feature requests or UX questions:**
→ Start with [Product Owner](team/product-owner.md)

**For architectural decisions or data model changes:**
→ Consult [Architect](team/architect.md)

**For complex AI generation or advanced Svelte 5 patterns:**
→ Reach out to [Senior Developer](team/senior-dev.md)

**For implementing CRUD features or building components:**
→ Work with [Developer](team/developer.md)

**For security, RLS, or API protection:**
→ Engage [Security Engineer](team/security.md)

**For testing, quality assurance, or validation:**
→ Contact [QA Lead](team/qa-lead.md)

### Communication Protocols

1. **Cross-functional collaboration:** All agents have access to shared memory in `memory.md`
2. **Decision logging:** Important architectural decisions are documented in memory
3. **Code patterns:** Follow Svelte 5 runes syntax exclusively (no legacy Svelte)
4. **AI integration:** Always respect GPT-5-mini parameter constraints (temperature=1.0, max_completion_tokens)

## Project-Specific Guidelines

### Critical Constraints

1. **Svelte 5 Runes Only:**
   - Use `$state()`, `$derived()`, `$effect()`, `$props()`
   - Never use legacy `$:` reactive statements

2. **GPT-5-mini API Restrictions:**
   - Only `temperature: 1.0` supported (or omit parameter)
   - Must use `max_completion_tokens` NOT `max_tokens`
   - Other values cause 400 errors

3. **Content Node Schema:**
   - All entities stored in unified `content_nodes` table
   - Content stored as JSONB for flexibility
   - Meta fields: id, kind, slug, title, summary, visibility, tags
   - Standardized content keys across all node types

4. **@slug References:**
   - Human-readable linking format (e.g., `@mira`, `@neo_station`)
   - Parsed and stored in `_links` for querying
   - Used throughout story content and relationships

### Common Workflows

**Creating New Content Types:**
1. Architect defines JSONB content structure
2. Senior Dev implements AI generation prompts
3. Developer builds CRUD API routes
4. Developer creates Svelte 5 form components
5. Security ensures RLS policies apply
6. QA validates generation quality

**Adding AI Features:**
1. Product Owner defines user story
2. Architect reviews prompt engineering approach
3. Senior Dev implements with proper error handling
4. Security validates API endpoint protection
5. QA tests generation quality and consistency

**Building UI Components:**
1. Developer implements using Svelte 5 runes
2. Senior Dev reviews for proper reactivity patterns
3. QA tests component functionality
4. Product Owner validates UX

## Quick Reference

- **Main App:** `/games/worldream/apps/web/`
- **Types Package:** `/games/worldream/packages/worldream-types/`
- **AI Integration:** `/games/worldream/apps/web/src/lib/ai/`
- **API Routes:** `/games/worldream/apps/web/src/routes/api/`
- **Components:** `/games/worldream/apps/web/src/lib/components/`
- **Documentation:** `/games/worldream/docs/`

For detailed technical guidelines, see `/games/worldream/CLAUDE.md`
