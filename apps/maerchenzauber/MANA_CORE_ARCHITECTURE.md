# Mana Core Architecture in Storyteller

This document explains the architecture and data flow of the Mana Core integration in the Storyteller project.

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Frontend Layer                          │
│                    (React Native + Expo)                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │ Auth Service │  │ API Client   │  │Token Manager │         │
│  │              │  │              │  │              │         │
│  │ • Sign In    │  │ • fetchWith  │  │ • getValid   │         │
│  │ • Sign Up    │  │   Auth()     │  │   Token()    │         │
│  │ • Sign Out   │  │ • Auto       │  │ • refresh    │         │
│  │ • Device     │  │   Refresh    │  │   Token()    │         │
│  │   Info       │  │ • Error      │  │ • Token      │         │
│  │              │  │   Handling   │  │   Storage    │         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
│         │                  │                  │                │
└─────────┼──────────────────┼──────────────────┼────────────────┘
          │                  │                  │
          │  HTTP/HTTPS      │  Bearer Token    │  Refresh
          │  Requests        │  in Headers      │  Flow
          ▼                  ▼                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                         Backend Layer                           │
│                    (NestJS + TypeScript)                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │            Mana Core NestJS Integration                   │ │
│  ├───────────────────────────────────────────────────────────┤ │
│  │                                                           │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐   │ │
│  │  │ AuthGuard    │  │@CurrentUser()│  │ Credit       │   │ │
│  │  │              │  │              │  │ Client       │   │ │
│  │  │ • Validate   │  │ • Extract    │  │ Service      │   │ │
│  │  │   JWT        │  │   User ID    │  │              │   │ │
│  │  │ • Check      │  │ • Extract    │  │ • validate   │   │ │
│  │  │   Expiry     │  │   Email      │  │   Credits()  │   │ │
│  │  │ • Inject     │  │ • Extract    │  │ • consume    │   │ │
│  │  │   User       │  │   Role       │  │   Credits()  │   │ │
│  │  │              │  │              │  │ • get        │   │ │
│  │  │              │  │              │  │   Balance()  │   │ │
│  │  └──────────────┘  └──────────────┘  └──────────────┘   │ │
│  │                                                           │ │
│  └───────────────────────────────────────────────────────────┘ │
│                           │                                     │
│  ┌────────────────────────┼──────────────────────────────────┐ │
│  │   Application Controllers & Services                      │ │
│  ├────────────────────────┼──────────────────────────────────┤ │
│  │                        │                                  │ │
│  │  CharacterController   │   StoryController                │ │
│  │  • generateCharacter   │   • createStory                  │ │
│  │  • getCharacters       │   • getStories                   │ │
│  │  • updateCharacter     │   • updateStory                  │ │
│  │  • deleteCharacter     │   • deleteStory                  │ │
│  │                        │                                  │ │
│  │  SettingsController    │   CreatorsController             │ │
│  │  • getUserSettings     │   • getCreators                  │ │
│  │  • updateSettings      │   • getLanguages                 │ │
│  │                        │                                  │ │
│  └──────────────────────────────────────────────────────────┘ │
│                           │                                     │
└───────────────────────────┼─────────────────────────────────────┘
                            │
                            │  API Requests
                            │  (Auth Validation,
                            │   Credit Operations)
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Mana Core Service                          │
│                 (Authentication & Credits)                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────────────┐  ┌──────────────────────┐           │
│  │ Authentication       │  │ Credit Management    │           │
│  │                      │  │                      │           │
│  │ • User Management    │  │ • Balance Tracking   │           │
│  │ • Token Generation   │  │ • Transaction Log    │           │
│  │ • Token Validation   │  │ • Operation Types    │           │
│  │ • Token Refresh      │  │ • App-Level Track    │           │
│  │ • Device Management  │  │ • Space Credits      │           │
│  │ • OAuth Providers    │  │ • Billing History    │           │
│  │                      │  │                      │           │
│  └──────────────────────┘  └──────────────────────┘           │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Authentication Flow

### Sign-In Flow

```
┌────────┐                    ┌────────┐                    ┌────────┐
│ Mobile │                    │Backend │                    │  Mana  │
│  App   │                    │ (Nest) │                    │  Core  │
└───┬────┘                    └───┬────┘                    └───┬────┘
    │                             │                             │
    │ 1. Sign In Request          │                             │
    │ POST /auth/signin           │                             │
    │ { email, password,          │                             │
    │   deviceInfo }              │                             │
    ├────────────────────────────►│                             │
    │                             │                             │
    │                             │ 2. Forward to Mana          │
    │                             │ POST /auth/signin           │
    │                             ├────────────────────────────►│
    │                             │                             │
    │                             │                             │ 3. Validate
    │                             │                             │    Credentials
    │                             │                             │
    │                             │ 4. Return Tokens            │
    │                             │ { appToken, refreshToken,   │
    │                             │   user, device }            │
    │                             │◄────────────────────────────┤
    │                             │                             │
    │ 5. Return to Client         │                             │
    │ { appToken, refreshToken }  │                             │
    │◄────────────────────────────┤                             │
    │                             │                             │
    │ 6. Store Tokens             │                             │
    │    in SecureStorage         │                             │
    │                             │                             │
```

### Token Refresh Flow

```
┌────────┐                    ┌────────┐                    ┌────────┐
│ Mobile │                    │Backend │                    │  Mana  │
│  App   │                    │ (Nest) │                    │  Core  │
└───┬────┘                    └───┬────┘                    └───┬────┘
    │                             │                             │
    │ 1. API Request              │                             │
    │    with Expired Token       │                             │
    ├────────────────────────────►│                             │
    │                             │                             │
    │                             │ 2. Validate Token           │
    │                             │    (Expired!)               │
    │                             │                             │
    │ 3. 401 Unauthorized         │                             │
    │◄────────────────────────────┤                             │
    │                             │                             │
    │ 4. Token Refresh Request    │                             │
    │ POST /auth/refresh          │                             │
    │ { refreshToken, deviceInfo }│                             │
    ├────────────────────────────►│                             │
    │                             │                             │
    │                             │ 5. Forward to Mana          │
    │                             ├────────────────────────────►│
    │                             │                             │
    │                             │                             │ 6. Validate
    │                             │                             │    Refresh
    │                             │                             │    Token
    │                             │                             │
    │                             │ 7. New Tokens               │
    │                             │◄────────────────────────────┤
    │                             │                             │
    │ 8. Return New Tokens        │                             │
    │◄────────────────────────────┤                             │
    │                             │                             │
    │ 9. Store New Tokens         │                             │
    │                             │                             │
    │ 10. Retry Original Request  │                             │
    │     with New Token          │                             │
    ├────────────────────────────►│                             │
    │                             │                             │
    │ 11. Success Response        │                             │
    │◄────────────────────────────┤                             │
```

---

## Protected Route Flow

### With AuthGuard

```
┌────────┐                    ┌────────┐                    ┌────────┐
│ Mobile │                    │Backend │                    │  Mana  │
│  App   │                    │ (Nest) │                    │  Core  │
└───┬────┘                    └───┬────┘                    └───┬────┘
    │                             │                             │
    │ 1. GET /character           │                             │
    │    Authorization: Bearer    │                             │
    │    eyJhbGc...               │                             │
    ├────────────────────────────►│                             │
    │                             │                             │
    │                             │ 2. AuthGuard                │
    │                             │    intercepts               │
    │                             │                             │
    │                             │ 3. Validate Token           │
    │                             ├────────────────────────────►│
    │                             │                             │
    │                             │ 4. Token Valid              │
    │                             │    + User Payload           │
    │                             │◄────────────────────────────┤
    │                             │                             │
    │                             │ 5. Inject user into         │
    │                             │    request object           │
    │                             │                             │
    │                             │ 6. Execute Controller       │
    │                             │    Method                   │
    │                             │    @CurrentUser()           │
    │                             │    extracts user            │
    │                             │                             │
    │ 7. Response with Data       │                             │
    │◄────────────────────────────┤                             │
    │                             │                             │
```

---

## Credit Management Flow

### Character Creation (20 Credits)

```
┌────────┐                    ┌────────┐                    ┌────────┐
│ Mobile │                    │Backend │                    │  Mana  │
│  App   │                    │ (Nest) │                    │  Core  │
└───┬────┘                    └───┬────┘                    └───┬────┘
    │                             │                             │
    │ 1. Create Character Request │                             │
    │ POST /character/generate    │                             │
    │ { name, description }       │                             │
    ├────────────────────────────►│                             │
    │                             │                             │
    │                             │ 2. Pre-flight Check         │
    │                             │    validateCredits()        │
    │                             │    userId, "character_      │
    │                             │    creation", 20            │
    │                             ├────────────────────────────►│
    │                             │                             │
    │                             │                             │ 3. Check
    │                             │                             │    Balance
    │                             │                             │
    │                             │ 4. Validation Result        │
    │                             │ { hasCredits: true,         │
    │                             │   availableCredits: 100 }   │
    │                             │◄────────────────────────────┤
    │                             │                             │
    │                             │ 5. If hasCredits = false    │
    │                             │    Return error             │
    │◄────────────────────────────┤                             │
    │                             │                             │
    │ 6. Show "Buy Credits" Modal │                             │
    │                             │                             │
    │                             │ 7. If hasCredits = true     │
    │                             │    Proceed with creation    │
    │                             │    • Generate images        │
    │                             │    • Store in database      │
    │                             │                             │
    │                             │ 8. Consume Credits          │
    │                             │    consumeCredits()         │
    │                             │    userId, "character_      │
    │                             │    creation", 20,           │
    │                             │    "Created: Cat"           │
    │                             ├────────────────────────────►│
    │                             │                             │
    │                             │                             │ 9. Deduct
    │                             │                             │    Credits
    │                             │                             │
    │                             │ 10. Transaction Receipt     │
    │                             │ { transactionId,            │
    │                             │   remainingBalance: 80 }    │
    │                             │◄────────────────────────────┤
    │                             │                             │
    │ 11. Success Response        │                             │
    │ { data: { characterId,      │                             │
    │   images, ... } }           │                             │
    │◄────────────────────────────┤                             │
    │                             │                             │
```

### Story Creation (100 Credits)

```
Same flow as character creation, but with:
- operationType: "story_creation"
- amount: 100
- More expensive due to:
  * Story text generation
  * Multiple image generations (10 pages)
  * Translation to German
```

---

## Credit Operation Types in Storyteller

```typescript
// Defined in Storyteller
type StorytellerOperations =
  | 'character_creation' // 20 credits
  | 'story_creation'; // 100 credits

// Credit Costs
const CREDIT_COSTS = {
  character_creation: 20, // 3 image variants
  story_creation: 100, // 10-page story with images + translation
};
```

---

## Data Flow: Complete Example

### Creating a Story with Credits

1. **Frontend**: User fills story form

   ```typescript
   const createStory = async () => {
     const response = await fetchWithAuth('/story', {
       method: 'POST',
       body: JSON.stringify({
         characters: [characterId],
         storyDescription: 'A magical forest adventure',
         authorId: 'author-1',
         illustratorId: 'illustrator-1',
       }),
     });

     const data = await response.json();

     if (data.error === 'insufficient_credits') {
       navigation.navigate('PurchaseCredits', {
         required: 100,
         available: data.availableCredits,
       });
     }
   };
   ```

2. **Backend Controller**: Story creation endpoint

   ```typescript
   @Post()
   @UseGuards(AuthGuard)
   async createStory(
     @Body() dto: CreateStoryDto,
     @CurrentUser() user: JwtPayload,
   ) {
     // Pre-flight check
     const validation = await this.creditClient.validateCredits(
       user.sub,
       'story_creation',
       100,
     );

     if (!validation.hasCredits) {
       throw new BadRequestException({
         error: 'insufficient_credits',
         requiredCredits: 100,
         availableCredits: validation.availableCredits,
       });
     }

     // Create story
     const result = await this.storyService.createStory({
       userId: user.sub,
       characterId: dto.characters[0],
       storyDescription: dto.storyDescription,
     });

     // Consume credits
     await this.creditClient.consumeCredits(
       user.sub,
       'story_creation',
       100,
       `Created story: ${result.storyData.title}`,
       { storyId: result.storyData.id },
     );

     return result;
   }
   ```

3. **Mana Core**: Processes credit operations
   - Validates user has sufficient credits
   - Deducts credits from user's balance
   - Records transaction in ledger
   - Returns transaction ID and new balance
   - Tracks operation by app ID

---

## Security Architecture

### Token Security

```
┌─────────────────────────────────────────────────────────┐
│                    Token Structure                      │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Access Token (appToken):                              │
│  • JWT format                                           │
│  • Short-lived (15 minutes)                             │
│  • Contains: { sub, email, role, exp, iat }            │
│  • Used for API authentication                          │
│  • Stored in SecureStorage (mobile)                     │
│                                                         │
│  Refresh Token:                                         │
│  • Long-lived (30 days)                                 │
│  • Used to get new access token                         │
│  • Single-use (rotated on refresh)                      │
│  • Device-specific                                      │
│  • Stored in SecureStorage (mobile)                     │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### AuthGuard Protection

```typescript
// All routes under @UseGuards(AuthGuard) are protected:

✅ Validates JWT signature
✅ Checks token expiration
✅ Extracts user payload
✅ Injects user into request
✅ Returns 401 if invalid

// Usage:
@Controller('character')
@UseGuards(AuthGuard)  // ← Protects all routes in controller
export class CharacterController {
  @Get()
  getCharacters(@CurrentUser() user: JwtPayload) {
    // user is automatically available here
  }
}
```

---

## Database Integration (Supabase RLS)

### Row Level Security with JWT

Storyteller uses Supabase with Row Level Security (RLS). The `@UserToken()` decorator extracts the raw JWT for RLS:

```typescript
@Get()
async getCharacters(
  @CurrentUser() user: JwtPayload,  // Validated user
  @UserToken() token: string,       // Raw JWT for RLS
) {
  // Pass token to Supabase client
  const characters = await this.supabase
    .from('characters')
    .select('*')
    .eq('user_id', user.sub)
    .setAuth(token);  // RLS enforces user_id match

  return { data: characters };
}
```

**Why Both Decorators?**

- `@CurrentUser()`: Validated user data for business logic
- `@UserToken()`: Raw JWT for database RLS enforcement

---

## Environment Configuration

### Backend `.env`

```env
# Mana Core (Required)
MANA_SERVICE_URL=https://mana-core-middleware-111768794939.europe-west3.run.app
APP_ID=8d2f5ddb-e251-4b3b-8802-84022a7ac77f
MANA_SUPABASE_SECRET_KEY=your-service-key

# Application
NODE_ENV=development
PORT=3002

# Database (Supabase)
MAERCHENZAUBER_SUPABASE_URL=your-supabase-url
MAERCHENZAUBER_SUPABASE_ANON_KEY=your-anon-key
```

### Frontend `.env`

```env
# Backend URL
EXPO_PUBLIC_STORYTELLER_BACKEND_URL=http://localhost:3002

# For production:
# EXPO_PUBLIC_STORYTELLER_BACKEND_URL=https://your-api.com
```

---

## Key Takeaways

### What Mana Core Provides

1. **Authentication System**
   - ✅ Email/password sign-in/sign-up
   - ✅ Google OAuth integration
   - ✅ Apple Sign-in integration
   - ✅ JWT token generation and validation
   - ✅ Token refresh mechanism
   - ✅ Multi-device management

2. **Credit Management**
   - ✅ Balance tracking per user
   - ✅ Pre-flight validation
   - ✅ Transaction recording
   - ✅ Operation type tracking
   - ✅ App-level tracking
   - ✅ Metadata support

3. **Developer Experience**
   - ✅ Simple module configuration
   - ✅ Guards for route protection
   - ✅ Decorators for data extraction
   - ✅ TypeScript support
   - ✅ Error handling utilities
   - ✅ Debug logging

### What You Need to Implement

1. **Application Logic**
   - Define operation types
   - Set credit costs
   - Implement business logic
   - Handle errors

2. **Frontend Integration**
   - Token storage
   - API client with auto-refresh
   - Error handling UI
   - Purchase flow (if needed)

3. **Testing**
   - Unit tests with mocked services
   - Integration tests
   - End-to-end flows

---

## Performance Considerations

### Token Caching

- Frontend caches tokens in SecureStorage
- Token validation is fast (local check + remote if needed)
- Refresh only when needed (5-minute buffer)

### Credit Operations

- Pre-flight validation is lightweight
- Consumption happens after success
- No blocking during operations

### Best Practices

1. Always validate credits BEFORE expensive operations
2. Consume credits AFTER successful operations
3. Handle `InsufficientCreditsException` gracefully
4. Log all credit transactions for audit

---

## Next Steps

After understanding the architecture:

1. **Review the Integration Guide**: See `MANA_CORE_INTEGRATION_GUIDE.md`
2. **Follow the Checklist**: Use `MANA_CORE_INTEGRATION_CHECKLIST.md`
3. **Study the Code**: Examine Storyteller's implementation
4. **Test Thoroughly**: Ensure all flows work correctly
5. **Monitor in Production**: Track usage and errors

---

## Questions?

- **Full Guide**: `MANA_CORE_INTEGRATION_GUIDE.md`
- **Checklist**: `MANA_CORE_INTEGRATION_CHECKLIST.md`
- **Mana Docs**: https://docs.mana-core.com
- **GitHub**: https://github.com/Memo-2023/mana-core-nestjs-package
