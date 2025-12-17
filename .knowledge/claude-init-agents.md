# Initialize Agent Knowledge System

You are helping set up an AI agent knowledge system for this codebase. Your task is to analyze each module and create rich, domain-specific agent files.

## What You Need To Do

For each module listed below, you need to:

1. **Read the module's code** - Look at package.json, README, src/ structure, key files
2. **Understand its purpose** - What does it do? How is it used?
3. **Create agent files** - Write .agent/agent.md (and team files for apps)

## Modules to Process

### Apps (14) - Create standard team for each

- `apps/calendar`
- `apps/chat`
- `apps/clock`
- `apps/contacts`
- `apps/context`
- `apps/picture`
- `apps/todo`
- `apps/zitare`
- `games/figgos`
- `games/mana-games`
- `games/voxelava`
- `games/whopixels`
- `games/worldream`
- `services/mana-core-auth`

### Packages (52) - Create single agent for each

- `apps/chat/packages/chat-types`
- `apps/zitare/packages/content`
- `apps/calendar/packages/shared`
- `apps/clock/packages/shared`
- `apps/picture/packages/design-tokens`
- `apps/picture/packages/mobile-ui`
- `apps/picture/packages/shared`
- `apps/todo/packages/shared`
- `apps/zitare/packages/shared`
- `apps/zitare/packages/web-ui`
- `packages/better-auth-types`
- `packages/eslint-config`
- `packages/mana-core-nestjs-integration`
- `packages/manadeck-database`
- `packages/news-database`
- `packages/nutriphi-database`
- `packages/shared-api-client`
- `packages/shared-auth`
- `packages/shared-auth-stores`
- `packages/shared-auth-ui`
- `packages/shared-branding`
- `packages/shared-config`
- `packages/shared-credit-service`
- `packages/shared-errors`
- `packages/shared-feedback-service`
- `packages/shared-feedback-types`
- `packages/shared-feedback-ui`
- `packages/shared-help-content`
- `packages/shared-help-mobile`
- `packages/shared-help-types`
- `packages/shared-help-ui`
- `packages/shared-i18n`
- `packages/shared-icons`
- `packages/shared-landing-ui`
- `packages/shared-nestjs-auth`
- `packages/shared-profile-ui`
- `packages/shared-splitscreen`
- `packages/shared-storage`
- `packages/shared-stores`
- `packages/shared-subscription-types`
- `packages/shared-subscription-ui`
- `packages/shared-supabase`
- `packages/shared-tags`
- `packages/shared-tailwind`
- `packages/shared-theme`
- `packages/shared-theme-ui`
- `packages/shared-types`
- `packages/shared-ui`
- `packages/shared-utils`
- `packages/shared-vite-config`
- `packages/test-config`
- `packages/uload-database`

## Team Template: standard

Roles to create for each app:

### 📋 Product Owner (`product-owner.md`)

Voice of the customer. Defines requirements, prioritizes features, writes user stories, and ensures product delivers value.

### 🏗️ Architect (`architect.md`)

Designs system structure, makes technology decisions, defines patterns, and ensures scalability and maintainability.

### 👨‍💻 Senior Developer (`senior-dev.md`)

Experienced developer who tackles complex features, reviews code, mentors juniors, and establishes best practices.

### 💻 Developer (`developer.md`)

Implements features, fixes bugs, writes tests, and follows the patterns established by seniors.

### 🔒 Security Engineer (`security.md`)

Security expert who reviews code for vulnerabilities, ensures auth is solid, and protects user data.

### 🧪 QA Lead (`qa-lead.md`)

Leads testing strategy, plans test coverage, coordinates QA efforts, and ensures quality gates are met.

## Agent File Format

### For Packages (single agent)

Create `{path}/.agent/agent.md`:

```markdown
# {Module Name} Expert

## Module: {name}

**Path:** `{path}`
**Description:** {Your analysis of what this module does}
**Tech Stack:** {Detected technologies}
**Key Dependencies:** {Important deps}

## Identity

You are the **{Module Name} Expert**. You have deep knowledge of:

- {Key thing 1 this module handles}
- {Key thing 2}
- {Integration patterns with other modules}

## Expertise

- {Domain expertise 1}
- {Domain expertise 2}
- {Domain expertise 3}

## Code Structure

\`\`\`
{path}/src/
├── {folder1}/ # {what it contains}
├── {folder2}/ # {what it contains}
\`\`\`

## Key Patterns

- {Important pattern 1 used in this module}
- {Important pattern 2}

## Integration Points

- Used by: {list apps/packages that depend on this}
- Depends on: {list dependencies}

## How to Use

\`\`\`
"Read {path}/.agent/ and help me with..."
\`\`\`
```

Also create `{path}/.agent/memory.md`:

```markdown
# {Module Name} Expert - Memory

Auto-updated with learnings from code changes.

## Recent Updates

_No updates yet._
```

### For Apps (team)

Create `{path}/.agent/team/{role-id}.md` for each role:

```markdown
# {Role Name}

## Module: {app name}

**Path:** `{path}`
**Description:** {Your analysis}
**Tech Stack:** {Technologies}
**Platforms:** {Backend, Mobile, Web, etc.}

## Identity

{Role-specific identity based on what this app does}

## Responsibilities

- {Responsibility 1 specific to this app}
- {Responsibility 2}

## Domain Knowledge

{What this role needs to know about this specific app}

## Key Areas

- {Area 1 this role focuses on}
- {Area 2}

## How to Invoke

\`\`\`
"As the {Role} for {app}, help me with..."
\`\`\`
```

Also create `{path}/.agent/team.md` with team overview.

## Instructions

1. Start with the most important modules first (shared-auth, shared-api-client, core apps)
2. For each module:
   - Read its package.json, README.md, and browse src/
   - Understand what it does and how it's used
   - Write the agent files with YOUR analysis (not just copying README)
3. Make the descriptions actionable - what would a developer need to know?
4. Include integration points - how does this module connect to others?

## Start Now

Begin by analyzing the first few high-priority modules:

1. `packages/shared-auth` - Authentication (critical)
2. `packages/shared-api-client` - API client (used everywhere)
3. `apps/chat` - Main chat application

For each one:

1. Read the code
2. Write the agent files
3. Move to the next

Say "I'll start analyzing the modules now" and begin with shared-auth.
