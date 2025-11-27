# Mana Core Integration Checklist

Use this checklist when integrating `@mana-core/nestjs-integration` into a new NestJS project.

## Prerequisites ✓

- [ ] NestJS v10+ application set up
- [ ] `@nestjs/config` installed
- [ ] Node.js v18+ and npm/yarn
- [ ] Mana Core credentials obtained:
  - [ ] `MANA_SERVICE_URL`
  - [ ] `APP_ID`
  - [ ] `MANA_SUPABASE_SECRET_KEY` (service key)

---

## Backend Integration Steps

### 1. Installation

- [ ] Install the package:

  ```bash
  npm install git+https://github.com/Memo-2023/mana-core-nestjs-package.git
  ```

- [ ] Verify in `package.json`:
  ```json
  "@mana-core/nestjs-integration": "git+https://github.com/..."
  ```

### 2. Environment Configuration

- [ ] Create/update `.env` file:

  ```env
  MANA_SERVICE_URL=https://your-mana-instance.com
  APP_ID=your-app-id
  MANA_SUPABASE_SECRET_KEY=your-service-key
  NODE_ENV=development
  ```

- [ ] Add to `.env.example` (for team reference)

- [ ] Add `.env` to `.gitignore`

### 3. Module Configuration

- [ ] Import `ManaCoreModule` in `app.module.ts`

- [ ] Configure with `forRootAsync()`:

  ```typescript
  ManaCoreModule.forRootAsync({
    imports: [ConfigModule],
    useFactory: (configService: ConfigService) => ({
      manaServiceUrl: 'your-mana-url',
      appId: 'your-app-id',
      serviceKey: configService.get('MANA_SUPABASE_SECRET_KEY'),
      debug: configService.get('NODE_ENV') === 'development',
    }),
    inject: [ConfigService],
  });
  ```

- [ ] Test backend starts without errors

### 4. Protect Routes with AuthGuard

- [ ] Import `AuthGuard` in controller:

  ```typescript
  import { AuthGuard } from '@mana-core/nestjs-integration';
  ```

- [ ] Apply to controller or route:

  ```typescript
  @Controller('protected')
  @UseGuards(AuthGuard)
  export class ProtectedController {}
  ```

- [ ] Test: Verify 401 without token

### 5. Extract User Information

- [ ] Import `@CurrentUser()` decorator:

  ```typescript
  import { CurrentUser } from '@mana-core/nestjs-integration';
  ```

- [ ] Use in route handlers:

  ```typescript
  @Get('profile')
  async getProfile(@CurrentUser() user: JwtPayload) {
    return { userId: user.sub, email: user.email };
  }
  ```

- [ ] Test: Verify user data is extracted correctly

### 6. Integrate Credit System

- [ ] Inject `CreditClientService`:

  ```typescript
  constructor(private creditClient: CreditClientService) {}
  ```

- [ ] Add pre-flight credit validation:

  ```typescript
  const validation = await this.creditClient.validateCredits(userId, 'operation_type', creditCost);
  ```

- [ ] Add credit consumption after success:

  ```typescript
  await this.creditClient.consumeCredits(
    userId,
    'operation_type',
    creditCost,
    'Description',
    metadata
  );
  ```

- [ ] Handle `InsufficientCreditsException`:

  ```typescript
  import { InsufficientCreditsException } from '@mana-core/nestjs-integration';
  ```

- [ ] Test: Verify credits are deducted

### 7. (Optional) Custom Token Decorator

- [ ] Create `@UserToken()` decorator for RLS:

  ```typescript
  // decorators/user.decorator.ts
  export const UserToken = createParamDecorator((_data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }
    return request.token;
  });
  ```

- [ ] Use for database RLS:
  ```typescript
  @Get()
  async getData(
    @CurrentUser() user: JwtPayload,
    @UserToken() token: string,
  ) {
    return await this.db.query(userId, token);
  }
  ```

---

## Frontend Integration Steps

### 1. Configure API Base URL

- [ ] Create `.env` file:

  ```env
  EXPO_PUBLIC_STORYTELLER_BACKEND_URL=http://localhost:3002
  ```

- [ ] Create API utility (`utils/api.ts`):
  ```typescript
  export const API_BASE_URL = process.env.EXPO_PUBLIC_BACKEND_URL;
  ```

### 2. Create Auth Service

- [ ] Create `services/authService.ts`

- [ ] Implement sign-in:

  ```typescript
  signIn: async (email: string, password: string) => {
    const deviceInfo = await getDeviceInfo();
    const response = await fetch(`${BACKEND_URL}/auth/signin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, deviceInfo }),
    });
    const data = await response.json();
    await storeTokens(data.appToken, data.refreshToken);
  };
  ```

- [ ] Implement sign-up

- [ ] Implement sign-out

- [ ] Test: Verify tokens are stored securely

### 3. Create Token Manager

- [ ] Create `services/tokenManager.ts`

- [ ] Implement `getValidToken()`:

  ```typescript
  getValidToken: async () => {
    let token = await storage.getItem('appToken');
    if (isExpiringSoon(token)) {
      await this.refreshToken();
      token = await storage.getItem('appToken');
    }
    return token;
  };
  ```

- [ ] Implement `refreshToken()`:

  ```typescript
  refreshToken: async () => {
    const refreshToken = await storage.getItem('refreshToken');
    const deviceInfo = await getDeviceInfo();
    const response = await fetch(`${BACKEND_URL}/auth/refresh`, {
      method: 'POST',
      body: JSON.stringify({ refreshToken, deviceInfo }),
    });
    const data = await response.json();
    await storeTokens(data.appToken, data.refreshToken);
  };
  ```

- [ ] Test: Verify automatic refresh works

### 4. Create Authenticated API Client

- [ ] Create `fetchWithAuth()` function:

  ```typescript
  export async function fetchWithAuth(endpoint: string, options = {}) {
    const token = await tokenManager.getValidToken();
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        ...options.headers,
        Authorization: `Bearer ${token}`,
      },
    });

    if (response.status === 401) {
      await tokenManager.refreshToken();
      // Retry request
    }

    return response;
  }
  ```

- [ ] Test: Verify authenticated requests work

### 5. Handle Credit Errors

- [ ] Create error handling utility:

  ```typescript
  export function isInsufficientCreditsError(error: any) {
    return error?.error === 'insufficient_credits';
  }
  ```

- [ ] Handle in UI:

  ```typescript
  if (data.error === 'insufficient_credits') {
    showPurchaseCreditsModal({
      required: data.requiredCredits,
      available: data.availableCredits,
    });
  }
  ```

- [ ] Test: Verify error is displayed correctly

### 6. Device Management

- [ ] Create `utils/deviceManager.ts`:

  ```typescript
  export class DeviceManager {
    static async getDeviceInfo() {
      return {
        deviceId: await getOrCreateDeviceId(),
        deviceName: Platform.OS,
        deviceType: Platform.OS as 'ios' | 'android' | 'web',
        userAgent: getUserAgent(),
      };
    }
  }
  ```

- [ ] Include in auth requests

- [ ] Test: Verify device info is sent

---

## Testing Steps

### Backend Tests

- [ ] Create unit tests with mocked services:

  ```typescript
  {
    provide: CreditClientService,
    useValue: {
      validateCredits: jest.fn().mockResolvedValue({
        hasCredits: true,
      }),
      consumeCredits: jest.fn(),
    },
  }
  ```

- [ ] Create integration tests with real Mana Core module

- [ ] Test credit validation flow

- [ ] Test insufficient credits error

- [ ] Run tests: `npm run test`

### Frontend Tests

- [ ] Test authentication flow

- [ ] Test token refresh

- [ ] Test authenticated API calls

- [ ] Test credit error handling

- [ ] Run tests: `npm run test`

---

## Production Deployment

### Backend

- [ ] Set production environment variables:

  ```env
  MANA_SERVICE_URL=https://production-mana.com
  APP_ID=production-app-id
  MANA_SUPABASE_SECRET_KEY=production-key
  NODE_ENV=production
  ```

- [ ] Disable debug logging (`debug: false`)

- [ ] Test health endpoint

- [ ] Deploy and monitor logs

### Frontend

- [ ] Update `.env` for production:

  ```env
  EXPO_PUBLIC_BACKEND_URL=https://your-api.com
  ```

- [ ] Build production bundle

- [ ] Test authentication flow

- [ ] Test API calls

- [ ] Deploy to stores (iOS/Android) or web

---

## Post-Integration Verification

- [ ] Sign-up flow works end-to-end

- [ ] Sign-in flow works end-to-end

- [ ] Token refresh works automatically

- [ ] Protected routes require authentication

- [ ] Credit validation prevents operations

- [ ] Credit consumption records transactions

- [ ] Insufficient credits error handled gracefully

- [ ] Sign-out clears tokens

- [ ] Multi-device support works

---

## Documentation

- [ ] Update README with Mana Core setup instructions

- [ ] Document custom operation types and credit costs

- [ ] Add environment variable documentation

- [ ] Create troubleshooting guide

- [ ] Document API endpoints

---

## Common Issues Checklist

If something doesn't work, check:

- [ ] Environment variables are set correctly
- [ ] Backend is running and accessible
- [ ] Service key is configured (for credit operations)
- [ ] Tokens are being stored and retrieved correctly
- [ ] Token expiration is being checked
- [ ] Device info is being sent with auth requests
- [ ] CORS is configured (if using web frontend)
- [ ] Network requests are not being blocked
- [ ] Debug logging is enabled for troubleshooting

---

## Support Resources

- **Full Integration Guide**: See `MANA_CORE_INTEGRATION_GUIDE.md`
- **Mana Core Docs**: https://docs.mana-core.com
- **GitHub Issues**: https://github.com/Memo-2023/mana-core-nestjs-package/issues
- **Example Code**: Check Storyteller project for working implementation

---

## Integration Complete! 🎉

Once all items are checked, your application is fully integrated with Mana Core.

**Estimated Time**: 2-4 hours for basic integration, 1-2 days for complete implementation with testing.

**Next Steps**:

1. Define your operation types and credit costs
2. Implement purchase flow for credits
3. Add analytics and monitoring
4. Set up role-based access control (if needed)
