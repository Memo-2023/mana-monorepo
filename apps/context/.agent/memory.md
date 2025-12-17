# Memory - Context App

This file tracks important decisions, ongoing work, known issues, and context that should persist across agent sessions.

## Current State

### App Status
- **Stage**: Mobile MVP
- **Platform**: Expo 52 + React Native 0.76
- **Database**: Supabase (PostgreSQL with RLS)
- **AI Providers**: Azure OpenAI (GPT-4.1), Google Gemini (Pro, Flash)
- **Monetization**: RevenueCat (subscriptions + token economy)

### Active Work
- Currently in project-agents branch
- Creating agent team documentation

### Known Issues

1. **API Keys in Mobile App** (Critical)
   - Keys are extractable from decompiled app
   - Mitigation: Rate limiting, usage alerts, key rotation
   - Fix: Migrate to backend API (planned)

2. **No Rate Limiting**
   - Users can spam AI requests
   - Fix: Backend API with Redis-backed rate limiting (planned)

3. **Limited Error Handling**
   - Some error paths not handled gracefully
   - Fix: Add retry logic and offline support

4. **No Automated Tests**
   - Only manual testing currently
   - Fix: Add Jest unit tests, Detox E2E tests (planned)

## Architecture Decisions

### Use Supabase Instead of Custom Backend
**Decision**: Use Supabase for MVP, migrate to NestJS backend later

**Rationale**:
- Faster MVP development
- Built-in auth, RLS, realtime
- Easy migration path

**Consequences**:
- ✅ Rapid development
- ❌ API keys exposed in mobile app

**Status**: Active - Will migrate to NestJS backend in Phase 2

### Token-Based Economy
**Decision**: Implement token-based economy (1000 tokens = $0.001 USD)

**Rationale**:
- Transparent costs for users
- Encourages responsible AI usage
- Fair for both light and heavy users

**Status**: Active - Working well

### Multi-Provider AI
**Decision**: Support Azure OpenAI and Google Gemini

**Rationale**:
- Avoid vendor lock-in
- Different models for different use cases
- Fallback if one provider has outage

**Status**: Active - Will add more providers in future

### Short IDs for Documents
**Decision**: Auto-generate IDs like "MD1", "MC2" instead of UUIDs

**Rationale**:
- Human-friendly references
- Easy to mention in content (@MD1)
- Memorable for users

**Status**: Active - Working well

### Auto-Save with Debounce
**Decision**: Auto-save 3 seconds after user stops typing

**Rationale**:
- Modern UX standard
- No friction - users never lose work

**Status**: Active - Will improve error handling

## Migration Path

### Phase 1: Mobile MVP (Current)
- ✅ Expo mobile app
- ✅ Supabase for database + auth
- ✅ Direct AI API calls from mobile
- ✅ RevenueCat for monetization

### Phase 2: Backend API (Planned)
- [ ] NestJS backend with Drizzle ORM
- [ ] AI calls proxied through backend
- [ ] Migrate auth to mana-core-auth
- [ ] Hide API keys server-side

### Phase 3: Web App (Planned)
- [ ] SvelteKit web app
- [ ] Shares backend API with mobile
- [ ] Real-time collaboration features

### Phase 4: Landing Page (Planned)
- [ ] Astro static site
- [ ] Marketing content, pricing, docs

## Common Patterns

### JSONB Metadata for Extensibility
- Always merge metadata, never replace
- Used in documents and token transactions

### Service Layer Abstraction
- Each service has one responsibility
- Enables testing and reusability

### Debounced Operations
- Auto-save, token counting, search
- Clean up on unmount

## Team Notes

### For Product Owner
- Users love token transparency
- Feature request: Export as PDF/Markdown (high priority)

### For Architect
- Supabase RLS working well
- Consider Redis caching for token balances

### For Senior Developer
- Token estimation accuracy is ±10%
- Metadata merge pattern is critical

### For Developer
- Always merge metadata with existing
- Use estimateTokens() from tokenCountingService
- Test on both iOS and Android

### For Security Engineer
- API key exposure is #1 priority
- RLS policies are solid
- Add rate limiting even in MVP

### For QA Lead
- Test token estimation for every AI model
- Auto-save edge cases need regression tests
- Performance benchmarks: Document load <500ms

## Lessons Learned

1. **Token Estimation is Hard**: Improved to ±10% accuracy, will use tiktoken in backend
2. **Metadata Updates Need Merging**: Always merge, never replace
3. **Auto-Save UX is Critical**: Better error messages needed
4. **Short IDs are Loved**: Small UX details make big impact

## Future Considerations

### Potential Features
- Collaborative editing with real-time sync
- Knowledge graph visualization
- Voice input for mobile
- Offline mode with local storage
- Browser extension for web clipping

### Technical Improvements
- Streaming AI responses
- Better token counting (tiktoken)
- Redis caching
- Monitoring and analytics
- Automated tests
