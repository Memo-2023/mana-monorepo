# Picture App - Memory

Auto-updated with learnings from code changes.

## Recent Updates
*No updates yet.*

## Known Issues
- [ ] Test freemium flow with new user (verify 3 free generations)
- [ ] Test staging credit enforcement (HTTP 402 when insufficient credits)
- [ ] Test async generation webhook mode
- [ ] Test error handling for invalid Replicate models
- [ ] Write integration tests for GenerateService

## Implementation Notes
- Backend runs on port 3006
- Uses Replicate API for all AI image generation models
- Database: PostgreSQL with Drizzle ORM
- Storage: MinIO (local) / S3 (production) via `@manacore/shared-storage`
- Auth: Mana Core Auth (JWT EdDSA)
- Credit system: `@mana-core/nestjs-integration` (10 credits per generation)
- Freemium: 3 free generations per user, enforced only in staging/production
- Webhooks: HTTPS only (Replicate requirement), polling fallback for local dev
- Models seeded via backend migrations

## Key Services
- `GenerateService`: Main generation logic with credit check
- `ReplicateService`: Replicate API integration
- `StorageService`: MinIO/S3 storage operations
- `CreditClientService`: Credit system integration
- `BoardService`: Board/collection management
- `ImageService`: Image CRUD and metadata
