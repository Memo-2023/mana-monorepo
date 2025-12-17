# Figgos Game - Memory

Auto-updated with learnings from code changes.

## Recent Updates
*No updates yet.*

## Known Issues
- OpenAI image URLs are temporary (expire after ~1 hour) - need migration to S3/MinIO storage
- No image moderation before storage
- No generation queue or rate limiting implemented yet
- Mobile app currently using Supabase auth (needs migration to Mana Core Auth)

## Implementation Notes
- Backend runs on port 3012
- Uses OpenAI API: GPT-4o-mini for character generation, DALL-E 3 for images
- Database: PostgreSQL with Drizzle ORM
- Auth: Mana Core Auth (JWT EdDSA) - in progress for mobile
- Figure generation is 2-step: GPT-4 creates character info, DALL-E creates image
- Character info stored as JSONB in database
- Rarities: common, rare, epic, legendary (user-specified or algorithm)
- Likes system with denormalized count on figures table
- Public/private visibility control per figure

## Current State
- Backend API: Implemented and functional
- Web App: Partially implemented (SvelteKit + Svelte 5)
- Mobile App: Active development (Expo SDK 52, React Native 0.76)
- Shared Types Package: Planned but not yet created

## Technical Debt
1. Migrate image storage from OpenAI temporary URLs to S3/MinIO
2. Implement content moderation before image storage
3. Add generation rate limiting and queue system
4. Create @figgos/shared package for cross-platform types
5. Complete Mana Core Auth migration for mobile app
6. Add analytics tracking for generation metrics
