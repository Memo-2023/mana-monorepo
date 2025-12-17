# Shared API Client Expert - Memory

Auto-updated with learnings from code changes.

## Recent Updates
*No updates yet.*

## Known Issues
*None documented.*

## Implementation Notes
- Zero external dependencies - pure TypeScript
- Handles 204 No Content responses gracefully
- FormData uploads don't set Content-Type (browser handles boundary)
- Default API prefix is `/api` - most backends expect `/api/v1/...`
