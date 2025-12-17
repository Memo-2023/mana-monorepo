# Shared Supabase Expert - Memory

Auto-updated with learnings from code changes.

## Recent Updates
*No updates yet.*

## Known Issues
*None documented.*

## Implementation Notes
- Admin client throws error if serviceRoleKey is missing (fail-fast design)
- Session persistence enabled by default for user clients
- Error normalization preserves all Supabase error metadata (code, details, hint)
- Depends on @manacore/shared-types for SupabaseConfig interface
