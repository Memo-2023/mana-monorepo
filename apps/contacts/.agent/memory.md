# Contacts App - Memory

Auto-updated with learnings from code changes.

## Recent Updates
*No updates yet.*

## Known Issues
*None documented.*

## Implementation Notes
- Backend runs on port 3015
- Web frontend runs on port 5184
- Database: PostgreSQL with Drizzle ORM
- Auth: Mana Core Auth (JWT EdDSA)
- Storage: MinIO (S3-compatible) for contact photos at localhost:9000
- OAuth: Google Contacts API integration for import/sync
- Database seeding available via `pnpm --filter @contacts/backend db:seed`

## Key Features
- Full contact CRUD with rich profiles
- Google Contacts OAuth integration
- vCard and CSV import/export
- Tags, notes, and activity logging
- Photo storage via MinIO/S3
- Duplicate detection and merging
- Network visualization of contact relationships
- Team/organization sharing capabilities
- Search, filter, favorites, and archive

## Data Model
- Contacts belong to users with optional organization/team association
- Many-to-many relationship between contacts and tags
- One-to-many for notes and activities
- Connected accounts table for OAuth tokens (encrypted)
- Visibility and sharing controlled via `visibility` field and `shared_with` JSONB array
