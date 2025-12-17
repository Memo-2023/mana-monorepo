# Zitare App - Memory

Auto-updated with learnings from code changes.

## Recent Updates
*No updates yet.*

## Known Issues
*None documented.*

## Implementation Notes
- Backend runs on port 3007
- Uses hybrid content delivery: static quotes + backend API for user data
- Database: PostgreSQL with Drizzle ORM
- Auth: Mana Core Auth (JWT EdDSA)
- Content packages: `@zitare/shared`, `@zitare/content`, `@zitare/web-ui`
- Offline-first: All quotes work without backend connection
- Multi-lingual: German (de) and English (en) content
