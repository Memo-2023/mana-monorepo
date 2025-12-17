# Todo App - Memory

Auto-updated with learnings from code changes.

## Recent Updates
*No updates yet.*

## Known Issues
*None documented.*

## Implementation Notes
- Backend runs on port 3018
- Web app runs on port 5188
- Landing page runs on port 4323
- Database: PostgreSQL with Drizzle ORM
- Auth: Mana Core Auth (JWT EdDSA)
- Recurring tasks use RFC 5545 RRULE format
- Subtasks stored as JSONB array in tasks table
- Task metadata stored as JSONB (story points, fun rating, effective duration)
- Natural language parsing for quick add (German and English)
- Calendar integration via iCalendar format
- User ID is TEXT type (Mana Core Auth format, not UUID)
- Statistics include activity heatmap, priority distribution, project progress

## Quick Commands
```bash
# From monorepo root
pnpm todo:dev              # Run all todo apps
pnpm dev:todo:backend      # Backend only
pnpm dev:todo:web          # Web only
pnpm dev:todo:landing      # Landing only
pnpm dev:todo:app          # Web + backend
pnpm todo:db:push          # Push schema to database
pnpm todo:db:studio        # Open Drizzle Studio
pnpm todo:db:seed          # Seed initial data
```
