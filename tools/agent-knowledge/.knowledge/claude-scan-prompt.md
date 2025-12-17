# Agent Knowledge System - Project Analysis Request

## Your Task

Analyze this codebase and help set up the Agent Knowledge System with appropriate agents for each module/package.

## What to Analyze

1. **Project Structure**: Scan the directory structure to understand the monorepo layout
2. **Package Types**: Identify apps, packages, services, libraries, and their purposes
3. **Dependencies**: Look at package.json files to understand relationships
4. **Tech Stack**: Identify frameworks (NestJS, SvelteKit, Expo, Astro, etc.)
5. **Shared Code**: Find shared packages that are used across multiple apps

## Analysis Steps

### Step 1: Discover Structure

Run these commands to understand the project:

```bash
# List top-level directories
ls -la

# Find all package.json files
find . -name "package.json" -not -path "*/node_modules/*" | head -50

# Find common config files to identify tech stack
find . -name "nest-cli.json" -o -name "svelte.config.js" -o -name "app.json" -o -name "astro.config.mjs" 2>/dev/null | head -20
```

### Step 2: Identify High-Value Modules

Look for modules that would benefit most from dedicated agents:

- **Auth modules** - Critical, used everywhere
- **Core/shared packages** - Foundation code
- **API clients** - Integration points
- **UI components** - Design system
- **Database packages** - Data layer

### Step 3: Recommend Agent Setup

For each important module, suggest:

1. Whether it needs a **single agent** or a **team**
2. What **watch patterns** should track changes to this module
3. What **related modules** the agent should also know about

## Output Format

Please provide your analysis in this format:

### Project Overview

- Type: [monorepo/single-app/etc]
- Primary tech stack: [list technologies]
- Total packages/apps: [count]

### Recommended Agents

#### High Priority (Create First)

| Path                 | Agent Type   | Reason                             |
| -------------------- | ------------ | ---------------------------------- |
| packages/shared-auth | Single Agent | Auth is critical, used by all apps |
| ...                  | ...          | ...                                |

#### Medium Priority

| Path | Agent Type | Reason |
| ---- | ---------- | ------ |
| ...  | ...        | ...    |

### Recommended Teams

For complex apps that need full team coverage:
| Path | Template | Reason |
|------|----------|--------|
| apps/main-app | standard | Complex app with many features |
| ... | ... | ... |

### Watch Pattern Suggestions

```yaml
# Example for auth module
packages/shared-auth:
  watches:
    - packages/shared-auth/**
    - packages/shared-auth-*/** # Related auth packages
    - apps/*/src/**/auth/** # Auth code in apps
    - services/auth-service/** # Auth service
```

## After Analysis

Once you provide the analysis, I can run these commands to set up the agents:

```bash
# Initialize the system (if not done)
npx agent-knowledge init

# Add recommended agents
npx agent-knowledge add-agent <path>

# Add teams to complex apps
npx agent-knowledge team <path> --template <template>
```

---

**Please start by exploring the project structure and providing your analysis.**
