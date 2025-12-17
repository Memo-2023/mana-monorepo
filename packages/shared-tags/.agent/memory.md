# Shared Tags Expert - Memory

Auto-updated with learnings from code changes.

## Recent Updates
*No updates yet.*

## Known Issues
*None documented.*

## Implementation Notes
- Zero external dependencies - pure TypeScript with Fetch API
- Handles 204 No Content responses (e.g., after DELETE)
- Date normalization happens in private `normalizeTag()` method
- Trailing slashes are removed from authUrl in constructor
- Error messages are extracted from API response JSON when available
- `getById()` returns null on error (doesn't throw) for graceful degradation
- `getByIds()` accepts empty array and returns empty array (no API call)
