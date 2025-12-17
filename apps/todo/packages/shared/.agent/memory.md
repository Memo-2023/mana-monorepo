# Todo Shared Expert - Memory

Auto-updated with learnings from code changes.

## Recent Updates
*No updates yet.*

## Known Issues
*None documented.*

## Implementation Notes
- User IDs stored as TEXT (not UUID) to match Mana Core Auth format
- Task dates support both Date objects and ISO 8601 strings for flexibility
- Recurrence rules follow RFC 5545 RRULE format
- German localized labels in task constants (Später, Normal, Wichtig, Dringend)
- Story points use Fibonacci sequence [1, 2, 3, 5, 8, 13, 21]
- Contact integration via `@manacore/shared-types` ContactReference type
