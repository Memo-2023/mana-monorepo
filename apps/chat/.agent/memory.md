# Chat App - Memory

Auto-updated with learnings from code changes.

## Recent Updates
*No updates yet.*

## Known Issues
*None documented.*

## Implementation Notes
- Backend runs on port 3002
- Uses OpenRouter for all AI models (single API key)
- Database: PostgreSQL with Drizzle ORM
- Auth: Mana Core Auth (JWT EdDSA)
- Models seeded via `pnpm --filter @chat/backend db:seed`
