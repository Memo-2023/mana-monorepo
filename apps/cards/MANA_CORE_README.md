# Mana Core Integration Documentation

Complete documentation for integrating the `@mana-core/nestjs-integration` package into your NestJS application, based on the Storyteller project implementation.

## 📚 Documentation Overview

This documentation suite includes four comprehensive guides:

### 1. **This File** - Quick Start & Overview
Start here for a high-level understanding and quick reference.

### 2. **[Integration Guide](./MANA_CORE_INTEGRATION_GUIDE.md)** - Complete Implementation Guide
📖 **70+ pages** of detailed step-by-step instructions covering:
- Installation and setup
- Backend integration with code examples
- Frontend integration (React Native/Expo)
- Credit management implementation
- Error handling patterns
- Testing strategies
- Troubleshooting common issues

**Use this when**: You're implementing Mana Core for the first time or need detailed explanations.

### 3. **[Integration Checklist](./MANA_CORE_INTEGRATION_CHECKLIST.md)** - Step-by-Step Checklist
✅ **Actionable checklist** with checkboxes covering:
- Prerequisites verification
- Backend integration steps
- Frontend integration steps
- Testing checklist
- Production deployment
- Post-integration verification

**Use this when**: You want a quick reference while implementing or to verify nothing was missed.

### 4. **[Architecture Guide](./MANA_CORE_ARCHITECTURE.md)** - Visual Architecture & Data Flow
🎨 **Visual diagrams and architecture** explaining:
- System architecture
- Authentication flows
- Credit management flows
- Data flow examples
- Security architecture
- Database integration

**Use this when**: You need to understand how everything fits together or explain it to your team.

---

## 🚀 Quick Start

### What is Mana Core?

Mana Core is a centralized authentication and credit management system that provides:
- **Authentication**: Email/password, Google OAuth, Apple Sign-in
- **JWT Token Management**: Automatic validation, refresh, and multi-device support
- **Credit System**: Pre-flight validation, consumption tracking, and billing
- **Guards & Decorators**: Easy-to-use NestJS integration

### How Storyteller Uses It

| Feature | Implementation | Credits |
|---------|---------------|---------|
| **User Authentication** | Email/password + OAuth | Free |
| **Character Creation** | AI image generation (3 variants) | 20 credits |
| **Story Creation** | 10-page illustrated story + translation | 100 credits |
| **Protected Routes** | All character/story endpoints | Via AuthGuard |

### Integration Time

- **Basic Setup**: 1-2 hours
- **Full Integration**: 4-8 hours
- **With Testing**: 1-2 days

---

## 📦 Installation

```bash
# Backend
cd backend
npm install git+https://github.com/Memo-2023/mana-core-nestjs-package.git
```

---

## ⚙️ Configuration

### 1. Environment Variables

**Backend `.env`**:
```env
MANA_SERVICE_URL=https://mana-core-middleware-111768794939.europe-west3.run.app
APP_ID=your-app-id
MANA_SUPABASE_SECRET_KEY=your-service-key
NODE_ENV=development
PORT=3002
```

**Frontend `.env`**:
```env
EXPO_PUBLIC_STORYTELLER_BACKEND_URL=http://localhost:3002
```

### 2. Module Setup

**`backend/src/app.module.ts`**:
```typescript
import { ManaModule } from '@mana-core/nestjs-integration';

@Module({
  imports: [
    ManaModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        manaServiceUrl: 'https://mana-core-middleware-111768794939.europe-west3.run.app',
        appId: '8d2f5ddb-e251-4b3b-8802-84022a7ac77f',
        serviceKey: configService.get('MANA_SUPABASE_SECRET_KEY'),
        debug: configService.get('NODE_ENV') === 'development',
      }),
      inject: [ConfigService],
    }),
  ],
})
export class AppModule {}
```

---

## 🔐 Authentication Example

### Backend Controller

```typescript
import {
  AuthGuard,
  CurrentUser,
  CreditClientService,
} from '@mana-core/nestjs-integration';

@Controller('character')
@UseGuards(AuthGuard)  // Protect all routes
export class CharacterController {
  constructor(
    private readonly creditClient: CreditClientService,
  ) {}

  @Get()
  async getCharacters(@CurrentUser() user: JwtPayload) {
    // user.sub = user ID
    // user.email = user email
    return { data: await this.getCharactersForUser(user.sub) };
  }
}
```

### Frontend API Client

```typescript
import { tokenManager } from './tokenManager';

export async function fetchWithAuth(endpoint: string, options = {}) {
  const token = await tokenManager.getValidToken();

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      ...options.headers,
      'Authorization': `Bearer ${token}`,
    },
  });

  if (response.status === 401) {
    await tokenManager.refreshToken();
    // Retry...
  }

  return response;
}

// Usage
const response = await fetchWithAuth('/character');
const data = await response.json();
```

---

## 💳 Credit Management Example

### Backend: Validate & Consume Credits

```typescript
@Post('generate')
async generateCharacter(
  @Body() dto: CreateCharacterDto,
  @CurrentUser() user: JwtPayload,
) {
  // 1. Pre-flight validation
  const validation = await this.creditClient.validateCredits(
    user.sub,
    'character_creation',
    20,
  );

  if (!validation.hasCredits) {
    return {
      error: 'insufficient_credits',
      requiredCredits: 20,
      availableCredits: validation.availableCredits,
    };
  }

  // 2. Perform expensive operation
  const character = await this.createCharacter(dto);

  // 3. Consume credits after success
  await this.creditClient.consumeCredits(
    user.sub,
    'character_creation',
    20,
    `Created character: ${character.name}`,
    { characterId: character.id },
  );

  return { data: character };
}
```

### Frontend: Handle Credit Errors

```typescript
const response = await fetchWithAuth('/character/generate', {
  method: 'POST',
  body: JSON.stringify({ name, description }),
});

const data = await response.json();

if (data.error === 'insufficient_credits') {
  // Show purchase modal
  navigation.navigate('PurchaseCredits', {
    required: data.requiredCredits,
    available: data.availableCredits,
  });
  return;
}

// Success
console.log('Character created:', data.data);
```

---

## 🔑 Key Features

### 1. AuthGuard

Protects routes automatically:

```typescript
@Controller('protected')
@UseGuards(AuthGuard)  // All routes require authentication
export class ProtectedController {}
```

### 2. @CurrentUser() Decorator

Extracts authenticated user:

```typescript
// Get entire user
@Get('profile')
getProfile(@CurrentUser() user: JwtPayload) {
  return { id: user.sub, email: user.email };
}

// Get specific field
@Get('id')
getUserId(@CurrentUser('sub') userId: string) {
  return { userId };
}
```

### 3. Credit Client Service

Manages credits:

```typescript
// Validate before operation
const validation = await this.creditClient.validateCredits(
  userId,
  'operation_type',
  amount,
);

// Consume after success
await this.creditClient.consumeCredits(
  userId,
  'operation_type',
  amount,
  'Description',
  metadata,
);

// Check balance
const balance = await this.creditClient.getCreditBalance(userId);
```

---

## 📊 Storyteller Credit Costs

| Operation | Cost | What's Included |
|-----------|------|-----------------|
| **Character Creation** | 20 credits | 3 AI-generated image variants |
| **Story Creation** | 100 credits | 10-page illustrated story + German translation |

---

## 🎯 Authentication Flow

```
Mobile App (React Native)
    │
    │ 1. Sign In (email, password, deviceInfo)
    ▼
Backend (NestJS)
    │
    │ 2. Forward to Mana Core
    ▼
Mana Core Service
    │
    │ 3. Validate & Generate Tokens
    ▼
Backend
    │
    │ 4. Return { appToken, refreshToken }
    ▼
Mobile App
    │
    │ 5. Store in SecureStorage
    │ 6. Use appToken for API calls
    │ 7. Auto-refresh when expired
```

---

## 🛡️ Security Features

- ✅ **JWT-based authentication**
- ✅ **Token expiration** (15 minutes for access, 30 days for refresh)
- ✅ **Automatic token refresh** (5-minute buffer)
- ✅ **Multi-device support** with device tracking
- ✅ **Secure token storage** (SecureStorage on mobile)
- ✅ **Row Level Security** (RLS) support for Supabase

---

## 📝 Code Examples

### Sign In

**Backend** (Auto-provided by Mana Core):
```
POST /auth/signin
{
  "email": "user@example.com",
  "password": "password123",
  "deviceInfo": { ... }
}
```

**Frontend**:
```typescript
const result = await authService.signIn(email, password);
if (result.success) {
  navigation.navigate('Home');
} else {
  showError(result.error);
}
```

### Protected Route

```typescript
@Get('stories')
@UseGuards(AuthGuard)
async getStories(@CurrentUser() user: JwtPayload) {
  return await this.storyService.getStoriesForUser(user.sub);
}
```

### Credit Validation

```typescript
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
```

---

## 🧪 Testing

### Mock Credit Client

```typescript
{
  provide: CreditClientService,
  useValue: {
    validateCredits: jest.fn().mockResolvedValue({
      hasCredits: true,
      availableCredits: 100,
    }),
    consumeCredits: jest.fn().mockResolvedValue({
      success: true,
    }),
  },
}
```

### Test Protected Routes

```typescript
it('should require authentication', () => {
  return request(app.getHttpServer())
    .get('/character')
    .expect(401);
});

it('should return data with valid token', () => {
  return request(app.getHttpServer())
    .get('/character')
    .set('Authorization', `Bearer ${validToken}`)
    .expect(200);
});
```

---

## 🚨 Common Issues

| Issue | Solution |
|-------|----------|
| **401 Unauthorized** | Check token expiration, verify service key |
| **Credit validation fails** | Verify service key, check user balance |
| **Token refresh not working** | Verify device info is sent, check backend URL |
| **Module not found** | Re-install package from GitHub |

See [Integration Guide](./MANA_CORE_INTEGRATION_GUIDE.md#troubleshooting) for detailed troubleshooting.

---

## 📖 Documentation Structure

```
MANA_CORE_README.md                    ← You are here (Quick start)
    │
    ├── MANA_CORE_INTEGRATION_GUIDE.md  ← Complete guide (read first)
    │   ├── Installation
    │   ├── Backend Integration
    │   ├── Frontend Integration
    │   ├── Credit Management
    │   ├── Error Handling
    │   ├── Testing
    │   └── Troubleshooting
    │
    ├── MANA_CORE_INTEGRATION_CHECKLIST.md  ← Step-by-step checklist
    │   ├── Prerequisites ✓
    │   ├── Backend Steps ✓
    │   ├── Frontend Steps ✓
    │   ├── Testing ✓
    │   └── Deployment ✓
    │
    └── MANA_CORE_ARCHITECTURE.md       ← Visual architecture & flows
        ├── System Architecture
        ├── Authentication Flow
        ├── Credit Management Flow
        ├── Security Architecture
        └── Data Flow Examples
```

---

## 🎓 Learning Path

### For New Integrations

1. **Read**: [Integration Guide](./MANA_CORE_INTEGRATION_GUIDE.md) (Overview + Installation)
2. **Understand**: [Architecture Guide](./MANA_CORE_ARCHITECTURE.md) (System design)
3. **Implement**: Follow [Checklist](./MANA_CORE_INTEGRATION_CHECKLIST.md)
4. **Study**: Review Storyteller code examples
5. **Test**: Verify all flows work
6. **Deploy**: Production configuration

### For Understanding Existing Implementation

1. **Review**: [Architecture Guide](./MANA_CORE_ARCHITECTURE.md)
2. **Trace**: Follow authentication and credit flows
3. **Explore**: Study Storyteller controllers
4. **Reference**: Use [Integration Guide](./MANA_CORE_INTEGRATION_GUIDE.md) for details

---

## 📊 Key Files in Storyteller

### Backend

| File | Purpose |
|------|---------|
| `backend/src/app.module.ts` | Mana Core module configuration |
| `backend/src/character/character.controller.ts` | AuthGuard + Credit usage example |
| `backend/src/story/story.controller.ts` | Credit validation + consumption |
| `backend/src/decorators/user.decorator.ts` | Custom @UserToken() for RLS |

### Frontend

| File | Purpose |
|------|---------|
| `mobile/src/utils/api.ts` | API client with auto-refresh |
| `mobile/src/services/authService.ts` | Sign-in, sign-up, sign-out |
| `mobile/src/services/tokenManager.ts` | Token management |

---

## 🔗 Resources

- **Mana Core Package**: https://github.com/Memo-2023/mana-core-nestjs-package
- **Mana Core Docs**: https://docs.mana-core.com
- **NestJS Docs**: https://docs.nestjs.com
- **Storyteller Source**: This repository

---

## 💡 Best Practices

1. ✅ **Always validate credits BEFORE expensive operations**
2. ✅ **Consume credits AFTER successful operations**
3. ✅ **Handle insufficient credits gracefully in UI**
4. ✅ **Use AuthGuard for all protected routes**
5. ✅ **Enable debug logging during development**
6. ✅ **Store tokens securely (SecureStorage)**
7. ✅ **Implement automatic token refresh**
8. ✅ **Test authentication and credit flows thoroughly**

---

## ❓ Support

### Getting Help

1. **Documentation**: Check all four documentation files
2. **Code Examples**: Study Storyteller implementation
3. **Mana Core Docs**: https://docs.mana-core.com
4. **GitHub Issues**: https://github.com/Memo-2023/mana-core-nestjs-package/issues

### Contributing

If you find issues or improvements in this documentation:
1. Create a pull request
2. Open an issue
3. Contact the team

---

## ✨ Summary

This documentation provides everything you need to integrate Mana Core into your NestJS application:

- **Complete integration guide** with step-by-step instructions
- **Actionable checklist** to track progress
- **Visual architecture diagrams** to understand the system
- **Real code examples** from Storyteller
- **Troubleshooting guides** for common issues

**Start with**: [Integration Guide](./MANA_CORE_INTEGRATION_GUIDE.md)

**Use while implementing**: [Checklist](./MANA_CORE_INTEGRATION_CHECKLIST.md)

**Reference for architecture**: [Architecture Guide](./MANA_CORE_ARCHITECTURE.md)

Good luck with your integration! 🚀
