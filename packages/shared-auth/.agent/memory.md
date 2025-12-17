# Shared Auth Expert - Memory

Auto-updated with learnings from code changes.

## Recent Updates
*No updates yet.*

## Known Issues
*None documented.*

## Implementation Notes
- EdDSA JWT tokens used (not RSA)
- Mana Core Auth uses `accessToken` field (not `token`)
- Default storage keys: `@auth/appToken`, `@auth/refreshToken`, `@auth/userEmail`
- Refresh cooldown: 5000ms, Max refresh attempts: 3
