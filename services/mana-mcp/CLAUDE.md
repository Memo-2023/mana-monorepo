# mana-mcp

MCP (Model Context Protocol) gateway for Mana. External agents — Claude Desktop, Claude Code, the persona-runner — connect here to drive Mana modules over a single, JWT-authed protocol.

**Plan:** [`docs/plans/mana-mcp-and-personas.md`](../../docs/plans/mana-mcp-and-personas.md)

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Runtime** | Bun |
| **Framework** | Hono |
| **Transport** | MCP Streamable HTTP (`@modelcontextprotocol/sdk`) |
| **Auth** | JWT verify via JWKS from mana-auth (no service-key path) |
| **Tools** | `@mana/tool-registry` (shared SSOT — also consumed by mana-ai) |

## Port: 3069

## Quick Start

```bash
# Requires: mana-auth (3001) and mana-sync (3050) running
pnpm --filter @mana/mcp-service dev
```

Health check: `curl localhost:3069/health`

## Architecture

```
External Agent (Claude Desktop, persona-runner, …)
         │
         │  POST /mcp                Authorization: Bearer <jwt>
         │  GET  /mcp                X-Mana-Space: <spaceId>
         │  DELETE /mcp              Mcp-Session-Id: <session>
         ▼
   ┌─────────────────────────────────┐
   │  src/index.ts (Hono :3069)      │
   │  ├── CORS                       │
   │  ├── /health, /metrics          │
   │  └── /mcp                       │
   │       │                         │
   │       ▼ authenticateRequest     │
   │       │  src/auth.ts            │
   │       │   (verify JWT via JWKS, │
   │       │    pull X-Mana-Space)   │
   │       ▼                         │
   │       handleMcpRequest          │
   │       src/transport.ts          │
   │       (per-user MCP session,    │
   │        scoped, no cross-user)   │
   │       │                         │
   │       ▼ createMcpServerForUser  │
   │       src/mcp-adapter.ts        │
   │       (registry → MCP tools)    │
   └────────────────┬────────────────┘
                    │
                    ▼
       @mana/tool-registry handlers
                    │
        ┌───────────┼────────────┐
        ▼           ▼            ▼
   mana-sync     mana-auth    (other services
   (push/pull)   (org list)    via tool handlers)
```

## Auth model

Every MCP request must carry:

| Header | Required | Purpose |
|---|---|---|
| `Authorization: Bearer <jwt>` | yes | EdDSA JWT issued by mana-auth, verified via JWKS |
| `X-Mana-Space: <spaceId>` | yes | Active Space — every tool write lands here |
| `Mcp-Session-Id: <id>` | after init | Session tracking; absent on first `POST /mcp` |

**No service-key path.** Personas, the persona-runner, and any future agent client all hold real user JWTs. There is no admin bypass — admin-scoped tools (`scope: 'admin'`) are silently filtered out before being registered with the MCP server.

**Per-user session isolation.** A session is created against a specific user. If a request later arrives with a session ID that belongs to a different user, the gateway returns 403. This is defense-in-depth against session-id collisions or a leaked session header.

## Adding a tool

Tools are defined in `packages/mana-tool-registry/src/modules/<module>.ts`, **never** in this service. Steps:

1. Open the relevant module file (or create a new one).
2. Define the `ToolSpec`: name (`module.verb`), zod input/output schemas, `scope`, `policyHint`, handler.
3. Add it to the module's `register<Module>Tools()` function.
4. If new module: extend `ModuleId` in `packages/mana-tool-registry/src/types.ts` and call the new register function from `modules/index.ts`.

The MCP server picks up the tool on next restart — no service code change needed.

**Policy gating reminder:** `scope: 'admin'` tools never reach MCP clients. `policyHint: 'destructive'` tools are exposed but should be rare; prefer `policyHint: 'write'` with a soft-delete semantic.

## Local smoke test (M1 exit gate)

Manual end-to-end check that proves: external client → MCP → mana-sync → Postgres.

```bash
# 1. Start the stack
pnpm docker:up                    # Postgres, Redis, MinIO
pnpm dev:auth                     # mana-auth on 3001
pnpm dev:sync                     # mana-sync on 3050
pnpm --filter @mana/mcp-service dev   # mana-mcp on 3069

# 2. Get a dev-user JWT
pnpm setup:dev-user                # creates dev@mana.test
# Then login to get a JWT — easiest path is via the web app dev-tools
# panel, or use a curl against /api/v1/auth/sign-in/email.

# 3. Fetch the user's active Space ID
curl -H "Authorization: Bearer $JWT" \
  http://localhost:3001/api/auth/organization/list

# 4. Configure Claude Code (.mcp.json in repo root or ~/.claude.json)
{
  "mcpServers": {
    "mana": {
      "type": "http",
      "url": "http://localhost:3069/mcp",
      "headers": {
        "Authorization": "Bearer <JWT>",
        "X-Mana-Space": "<SPACE_ID>"
      }
    }
  }
}

# 5. In Claude Code, ask: "List my mana habits, then create one called 'Spazieren'"
#    Verify a row appears in mana_sync.sync_changes for table='habits'.
```

## Environment Variables

```env
PORT=3069
MANA_AUTH_URL=http://localhost:3001
MANA_SYNC_URL=http://localhost:3050
JWT_AUDIENCE=mana
CORS_ORIGINS=http://localhost:5173
```

No provider keys, no DB connection — this service is stateless and forwards everything through tool handlers to other services.

## Why a separate service (not folded into apps/api)

`apps/api/src/mcp/server.ts` already exists and exposes `AI_TOOL_CATALOG` over MCP. Per the plan (M4), that file and `AI_TOOL_CATALOG` get deleted once the new `@mana/tool-registry` covers all 67+ tools currently in `mana-ai`. Until then this service is the new path; the old endpoint stays for compatibility but is not extended.

Keeping mana-mcp standalone lets it be deployed independently, scaled separately (sessions are stateful in memory), and reasoned about as the single agent-facing entrypoint.
