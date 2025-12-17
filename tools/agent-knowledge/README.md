# Agent Knowledge System

AI agents that live in your codebase and automatically learn from your code changes. Perfect for monorepos where you want specialized agents for each module that stay up-to-date with the code.

## Features

- **Co-located Agents** - Agents live in `.agent/` folders alongside the code they know
- **Auto-updating Knowledge** - Git hooks track changes, nightly jobs update agent memory
- **Multi-provider Support** - Works with OpenRouter (many models) or Anthropic directly
- **Claude Code Integration** - Agents work seamlessly with Claude Code
- **Monorepo Ready** - Perfect for large codebases with multiple packages/modules

## Quick Start

```bash
# Initialize in your project
npx agent-knowledge init

# Add an agent to a module
npx agent-knowledge add-agent packages/shared-auth

# Check status
npx agent-knowledge status

# Manually update agent knowledge
npx agent-knowledge update
```

## How It Works

```
┌─────────────────────────────────────────────────────────────┐
│                     Your Monorepo                           │
│                                                             │
│  packages/shared-auth/                                      │
│  ├── src/                                                   │
│  ├── .agent/           ◄── Agent lives with the code       │
│  │   ├── agent.md          Persona & instructions          │
│  │   ├── memory.md         Auto-updated knowledge          │
│  │   └── architecture.md   Manual architecture docs        │
│  └── package.json                                           │
│                                                             │
│  .knowledge/           ◄── System configuration            │
│  ├── config.yaml           Provider settings               │
│  ├── agent-registry.yaml   Tracks all agents               │
│  ├── changes.jsonl         Pending changes log             │
│  └── .env                  API keys (gitignored)           │
│                                                             │
└─────────────────────────────────────────────────────────────┘

         │ Git Commit                    │ Nightly Cron
         ▼                               ▼
┌─────────────────┐           ┌─────────────────────┐
│ Track changes   │           │ LLM summarizes      │
│ in changes.jsonl│           │ updates memory.md   │
└─────────────────┘           └─────────────────────┘
```

## Installation

### Global Install (optional)

```bash
npm install -g agent-knowledge
```

### Per-project (recommended)

Just use `npx`:

```bash
npx agent-knowledge init
```

## Commands

### `scan`

Auto-discover your project structure and suggest agents.

```bash
npx agent-knowledge scan

# Options
--depth <n>    # Max directory depth (default: 4)
--all          # Show all modules (not just top 5 per type)
--json         # Output as JSON for scripting
--dry-run      # Preview without creating
```

**Example output for ManaCore-like monorepo:**
```
📁 Discovered Structure:

  📦 package (42)
    ⭐ packages/shared-auth
    ⭐ packages/shared-api-client
    ○ packages/shared-ui
    ...

  📱 app (20)
    ○ apps/nutriphi
    ○ apps/manacore
    ...

  ⚙️ service (1)
    ⭐ services/mana-core-auth

🎯 Recommended Agents (high priority):
  packages/shared-auth
    Type: package | Reason: Contains "auth"
```

### `team`

Add a full development team to a project.

```bash
# List available team templates
npx agent-knowledge team --list

# Add standard team (6 agents)
npx agent-knowledge team apps/nutriphi

# Add startup team (3 agents) - lean
npx agent-knowledge team packages/shared-auth --template startup

# Add enterprise team (10 agents) - full coverage
npx agent-knowledge team apps/manacore --template enterprise

# Preview what would be created
npx agent-knowledge team apps/myapp --dry-run
```

**Team Templates:**

| Template | Agents | Roles |
|----------|--------|-------|
| `startup` | 3 | Tech Lead, Developer, QA |
| `standard` | 6 | Product Owner, Architect, Senior Dev, Dev, Security, QA Lead |
| `enterprise` | 10 | + Scrum Master, DevOps, Frontend/Backend Specialists, Tech Writer |

### `init`

Initialize the agent knowledge system in your project.

```bash
npx agent-knowledge init

# Options
--provider <provider>  # LLM provider: openrouter (default) | anthropic
--model <model>        # Default model for updates
--no-hooks             # Skip git hooks installation
```

### `add-agent <path>`

Add an agent to a module/package.

```bash
npx agent-knowledge add-agent packages/shared-auth
npx agent-knowledge add-agent backends/api-gateway

# Options
--name <name>           # Custom agent name
--watches <patterns>    # Additional watch patterns
```

### `update`

Update agent knowledge from pending changes.

```bash
npx agent-knowledge update

# Options
--agent <path>    # Update specific agent only
--model <model>   # Override model for this run
--dry-run         # Preview without making changes
```

### `status`

Show system status and all registered agents.

```bash
npx agent-knowledge status
```

### `setup-hooks`

Install or reinstall git hooks.

```bash
npx agent-knowledge setup-hooks
--force    # Overwrite existing hooks
```

## Configuration

### LLM Providers

The system supports two providers:

**OpenRouter (recommended)** - Access to many models through one API:

```yaml
# .knowledge/config.yaml
provider: openrouter
model: google/gemini-flash-1.5  # Cheapest option
```

**Anthropic** - Direct Claude API:

```yaml
provider: anthropic
model: claude-sonnet-4-20250514
```

### Available Models (OpenRouter)

| Model | Cost | Speed | Quality | Best For |
|-------|------|-------|---------|----------|
| `google/gemini-flash-1.5` | $0.075/1M | Fast | Good | Daily batch jobs |
| `deepseek/deepseek-chat` | $0.14/1M | Fast | Good | Budget option |
| `anthropic/claude-3-haiku` | $0.25/1M | Fast | Good | Reliable default |
| `anthropic/claude-sonnet-4-20250514` | $3/1M | Medium | Excellent | Important updates |

### Environment Variables

Set in `.knowledge/.env` (gitignored) or as environment variables:

```bash
# OpenRouter
OPENROUTER_API_KEY=sk-or-v1-xxxxx
LLM_PROVIDER=openrouter
OPENROUTER_MODEL=google/gemini-flash-1.5

# Anthropic (alternative)
ANTHROPIC_API_KEY=sk-ant-xxxxx
LLM_PROVIDER=anthropic
ANTHROPIC_MODEL=claude-sonnet-4-20250514
```

## Automated Updates

### Cron Job (local)

```bash
# Add to crontab: crontab -e
# Run at 3 AM every night
0 3 * * * cd /path/to/project && npx agent-knowledge update >> .knowledge/cron.log 2>&1
```

### GitHub Actions

```yaml
# .github/workflows/update-agent-knowledge.yml
name: Update Agent Knowledge

on:
  schedule:
    - cron: '0 3 * * *'  # 3 AM UTC daily
  workflow_dispatch:      # Manual trigger

jobs:
  update:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Update agent knowledge
        run: npx agent-knowledge update
        env:
          OPENROUTER_API_KEY: ${{ secrets.OPENROUTER_API_KEY }}

      - uses: stefanzweifel/git-auto-commit-action@v5
        with:
          commit_message: "🤖 Update agent knowledge"
          file_pattern: "**/.agent/memory.md .knowledge/archive/*"
```

## Using with Claude Code

Once set up, use agents naturally with Claude Code:

```
# When working on auth module
> Read packages/shared-auth/.agent/ and help me implement refresh tokens

# Claude will:
# 1. Read agent.md (persona, principles)
# 2. Read memory.md (recent changes, context)
# 3. Read architecture.md (structure)
# 4. Help with full context of the module
```

### CLAUDE.md Integration

The init command automatically adds agent system documentation to your `CLAUDE.md`:

```markdown
## Agent Knowledge System

When working on a specific module, check for `.agent/agent.md` in that directory.
If found, read all files in `.agent/` to load domain knowledge and adopt that
agent's persona and expertise.
```

## Agent File Structure

Each `.agent/` folder contains:

```
.agent/
├── agent.md          # Persona, role, expertise, principles
├── memory.md         # Auto-updated from code changes
├── architecture.md   # Manual architecture documentation
└── [custom].md       # Any additional context files
```

### agent.md (example)

```markdown
# Auth Module Expert

## Identity
You are the **Auth Module Expert** for this codebase. Deep knowledge of
authentication flows, OAuth, JWT handling, and session management.

## Expertise
- OAuth 2.0 / OIDC flows
- JWT token handling
- Session management
- Security best practices

## Principles
1. Security first - always consider attack vectors
2. Maintain backwards compatibility
3. All changes must have tests
```

### memory.md (auto-updated)

```markdown
# Auth Module Expert - Memory

## 2024-12-16

### Token Refresh Improvements
- Implemented silent refresh with retry logic
- Added 30-second buffer before expiry
- New pattern: use `tokenManager.scheduleRefresh()`

## 2024-12-14

### Bug Fix: Race Condition
- Fixed concurrent refresh calls issue
- Added mutex lock in session manager
```

## Watch Patterns

Agents watch for changes using glob patterns:

```yaml
# .knowledge/agent-registry.yaml
agents:
  - path: packages/shared-auth
    agent_dir: packages/shared-auth/.agent
    name: Auth Expert
    watches:
      - packages/shared-auth/**           # All files in module
      - packages/core-utils/src/auth/**   # Related code elsewhere
      - apps/*/middleware/auth.*          # Auth middleware in apps
```

## Troubleshooting

### Changes not being tracked

1. Check git hook is installed:
   ```bash
   cat .git/hooks/post-commit | grep "Agent Knowledge"
   ```

2. Reinstall hooks:
   ```bash
   npx agent-knowledge setup-hooks --force
   ```

### API errors during update

1. Check API key is set:
   ```bash
   cat .knowledge/.env
   ```

2. Test with different model:
   ```bash
   npx agent-knowledge update --model anthropic/claude-3-haiku
   ```

### Agent not receiving changes

Check watch patterns in registry:
```bash
npx agent-knowledge status
```

## License

MIT
