# Memoro Service - New Signup Implementation Plan

## Overview

This plan outlines the steps to integrate the Memoro backend service with the new Mana Core authentication system that includes dynamic email branding and enhanced device tracking.

## Current State Analysis

### Existing Implementation
- **Location**: `src/auth-proxy/auth-proxy.service.ts`
- **Current App ID**: `973da0c1-b479-4dac-a1b0-ed09c72caca8` (in .env)
- **Mana Core App ID**: `edde080c-3882-46bd-9867-72bdf3cbd99c` (in mana-core config)
- **Current Flow**: Simple proxy to Mana Core with redirect URL override

### Current Signup Code (Line 111-118)
```typescript
async signup(payload: any) {
  // Add custom redirect URL for Memoro
  const enhancedPayload = {
    ...payload,
    redirectUrl: 'https://memoro.ai/de/welcome/'
  };
  return this.proxyPost('/auth/signup', enhancedPayload);
}
```

### Issues to Address
1. ❌ No TypeScript types/interfaces (uses `any`)
2. ❌ App ID mismatch between .env and mana-core config
3. ❌ Missing logo metadata for custom branding
4. ❌ No validation of required fields (deviceInfo)
5. ❌ No DTO classes for request/response

---

## Implementation Plan

### Phase 1: Create TypeScript Interfaces & DTOs

#### 1.1 Device Info Interface
**File**: `src/auth-proxy/dto/device-info.dto.ts`

```typescript
import { IsString, IsEnum, IsOptional } from 'class-validator';

export enum DeviceType {
  WEB = 'web',
  IOS = 'ios',
  ANDROID = 'android',
  DESKTOP = 'desktop',
}

export class DeviceInfoDto {
  @IsString()
  deviceId: string;

  @IsString()
  deviceName: string;

  @IsEnum(DeviceType)
  deviceType: DeviceType;

  @IsOptional()
  @IsString()
  userAgent?: string;
}
```

#### 1.2 Signup Request DTO
**File**: `src/auth-proxy/dto/signup-request.dto.ts`

```typescript
import { IsEmail, IsString, MinLength, ValidateNested, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';
import { DeviceInfoDto } from './device-info.dto';

export class SignupRequestDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  password: string;

  @ValidateNested()
  @Type(() => DeviceInfoDto)
  deviceInfo: DeviceInfoDto;

  @IsOptional()
  metadata?: {
    [key: string]: any;
  };

  @IsOptional()
  @IsString()
  redirectUrl?: string;
}
```

#### 1.3 Signup Response Interface
**File**: `src/auth-proxy/interfaces/signup-response.interface.ts`

```typescript
export interface SignupResponse {
  message: string;
  confirmationRequired: boolean;
  manaToken?: string;
  appToken?: string;
  refreshToken?: string;
  deviceId?: string;
  user: {
    id: string;
    email: string;
    created_at?: string;
  };
}
```

#### 1.4 Auth Metadata Interface
**File**: `src/auth-proxy/interfaces/auth-metadata.interface.ts`

```typescript
export interface AuthMetadata {
  logoUrl?: string;
  userName?: string;
  [key: string]: any;
}
```

---

### Phase 2: Update Environment Configuration

#### 2.1 Verify App ID
**Action**: Check which App ID is correct
- Option A: Update `.env` to use `edde080c-3882-46bd-9867-72bdf3cbd99c` (from mana-core)
- Option B: Update mana-core config to use `973da0c1-b479-4dac-a1b0-ed09c72caca8`

**Recommendation**: Use the App ID that's configured in mana-core (`edde080c-3882-46bd-9867-72bdf3cbd99c`)

#### 2.2 Add Logo Configuration
**File**: `.env`

```bash
# Add to .env
MEMORO_LOGO_FILENAME=memoro-logo.svg
```

**File**: `env.example`
```bash
# Add to env.example
MEMORO_LOGO_FILENAME=memoro-logo.svg
```

---

### Phase 3: Update Auth Proxy Service

#### 3.1 Enhanced Signup Method
**File**: `src/auth-proxy/auth-proxy.service.ts`

```typescript
import { SignupRequestDto } from './dto/signup-request.dto';
import { SignupResponse } from './interfaces/signup-response.interface';
import { AuthMetadata } from './interfaces/auth-metadata.interface';

export class AuthProxyService {
  private memoroLogoFilename: string;

  constructor(
    private httpService: HttpService,
    private configService: ConfigService,
  ) {
    this.manaServiceUrl = this.configService.get<string>('MANA_SERVICE_URL', 'http://localhost:3000');
    this.memoroAppId = this.configService.get<string>('MEMORO_APP_ID');
    this.memoroLogoFilename = this.configService.get<string>('MEMORO_LOGO_FILENAME', 'memoro-logo.svg');
  }

  async signup(payload: SignupRequestDto): Promise<SignupResponse> {
    // Validate device info is present
    if (!payload.deviceInfo) {
      throw new HttpException(
        'Device information is required for signup',
        HttpStatus.BAD_REQUEST
      );
    }

    // Prepare metadata with logo for custom email branding
    const metadata: AuthMetadata = {
      ...payload.metadata,
      logoUrl: this.memoroLogoFilename, // Just the filename
    };

    // Enhanced payload with Memoro-specific branding
    const enhancedPayload = {
      email: payload.email,
      password: payload.password,
      deviceInfo: payload.deviceInfo,
      metadata,
      redirectUrl: payload.redirectUrl || 'https://memoro.ai/de/welcome/',
    };

    console.log('[AuthProxy] Signup with enhanced payload:', {
      email: enhancedPayload.email,
      hasDeviceInfo: !!enhancedPayload.deviceInfo,
      logoUrl: metadata.logoUrl,
      redirectUrl: enhancedPayload.redirectUrl,
    });

    return this.proxyPost('/auth/signup', enhancedPayload);
  }
}
```

---

### Phase 4: Update Auth Proxy Controller

#### 4.1 Add Validation Pipe
**File**: `src/auth-proxy/auth-proxy.controller.ts`

```typescript
import {
  Controller,
  Post,
  Get,
  Body,
  Headers,
  HttpCode,
  HttpException,
  HttpStatus,
  UsePipes,
  ValidationPipe
} from '@nestjs/common';
import { SignupRequestDto } from './dto/signup-request.dto';
import { SignupResponse } from './interfaces/signup-response.interface';

@Controller('auth')
export class AuthProxyController {
  constructor(private readonly authProxyService: AuthProxyService) {}

  @Post('signup')
  @UsePipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true
  }))
  async signup(@Body() payload: SignupRequestDto): Promise<SignupResponse> {
    return this.authProxyService.signup(payload);
  }

  // Other methods remain similar but can be typed
  @Post('signin')
  async signin(@Body() payload: any) {
    // Validate device info
    if (!payload.deviceInfo) {
      throw new HttpException(
        'Device information is required for signin',
        HttpStatus.BAD_REQUEST
      );
    }
    return this.authProxyService.signin(payload);
  }
}
```

---

### Phase 5: Install Required Dependencies

```bash
cd memoro-service
npm install class-validator class-transformer
```

---

### Phase 6: Testing

#### 6.1 Unit Tests
**File**: `src/auth-proxy/auth-proxy.service.spec.ts`

Add tests for:
- ✅ Signup with valid deviceInfo
- ✅ Signup includes logo metadata
- ✅ Signup includes redirect URL
- ✅ Error when deviceInfo is missing

#### 6.2 Integration Tests

**Test 1: Signup with All Fields**
```bash
curl -X POST http://localhost:3001/auth/signup \
  -H 'Content-Type: application/json' \
  -d '{
    "email": "test@memoro.ai",
    "password": "Test123456!",
    "deviceInfo": {
      "deviceId": "web-test-device-1",
      "deviceName": "Chrome on MacBook",
      "deviceType": "web",
      "userAgent": "Mozilla/5.0..."
    }
  }'
```

**Expected Response:**
```json
{
  "message": "Sign up successful. Please check your email to confirm your account.",
  "confirmationRequired": true,
  "user": {
    "id": "...",
    "email": "test@memoro.ai"
  }
}
```

**Test 2: Check Email Branding**
- Email should show Memoro logo
- Email should use yellow color scheme (#F8D62B)
- Email should show German/English taglines
- Email should include Memoro features

**Test 3: Missing DeviceInfo (Should Fail)**
```bash
curl -X POST http://localhost:3001/auth/signup \
  -H 'Content-Type: application/json' \
  -d '{
    "email": "test@memoro.ai",
    "password": "Test123456!"
  }'
```

**Expected:** 400 Bad Request with validation error

---

### Phase 7: Documentation

#### 7.1 Update README
**File**: `README.md`

Add section:
```markdown
## Authentication

Memoro uses the Mana Core authentication system with custom branding.

### Signup Flow

When users sign up via Memoro:
1. Frontend calls `/auth/signup` with email, password, and device info
2. Memoro backend adds Memoro logo metadata
3. Mana Core creates account and sends branded email
4. User confirms email and can log in

See [docs/AUTH_INTEGRATION.md](./docs/AUTH_INTEGRATION.md) for details.
```

#### 7.2 Create Integration Doc
**File**: `docs/AUTH_INTEGRATION.md`

Document:
- How Memoro integrates with Mana Core
- Required environment variables
- Device info requirements
- Custom branding flow
- Error handling

---

## Migration Checklist

### Pre-Deployment
- [ ] Verify App ID is correct in both services
- [ ] Upload `memoro-logo.svg` to Mana Core Supabase bucket
- [ ] Update `.env` with correct `MEMORO_APP_ID`
- [ ] Add `MEMORO_LOGO_FILENAME=memoro-logo.svg` to `.env`
- [ ] Install dependencies: `class-validator`, `class-transformer`
- [ ] Run tests locally

### Code Changes
- [ ] Create DTOs in `src/auth-proxy/dto/`
- [ ] Create interfaces in `src/auth-proxy/interfaces/`
- [ ] Update `auth-proxy.service.ts` with new signup method
- [ ] Update `auth-proxy.controller.ts` with validation
- [ ] Add unit tests
- [ ] Update documentation

### Deployment
- [ ] Deploy to staging environment
- [ ] Test signup flow end-to-end
- [ ] Verify email branding looks correct
- [ ] Check device tracking works
- [ ] Deploy to production
- [ ] Monitor for errors

### Post-Deployment
- [ ] Verify production signup emails show Memoro branding
- [ ] Test all auth flows (signin, google, apple)
- [ ] Update frontend to include deviceInfo if not already
- [ ] Document any issues/learnings

---

## Timeline Estimate

- **Phase 1-2** (Types & Config): 1 hour
- **Phase 3-4** (Service & Controller): 2 hours
- **Phase 5** (Dependencies): 15 minutes
- **Phase 6** (Testing): 2 hours
- **Phase 7** (Documentation): 1 hour

**Total**: ~6-7 hours

---

## Risk Assessment

### Low Risk
✅ Adding types/interfaces (backward compatible)
✅ Adding logo metadata (optional field)
✅ Documentation updates

### Medium Risk
⚠️ Changing App ID (requires coordination)
⚠️ Adding validation (could break existing clients)

### Mitigation
- Test thoroughly in staging
- Deploy during low-traffic period
- Have rollback plan ready
- Monitor error rates after deployment

---

## Questions to Resolve

1. **App ID**: Which App ID should be used?
   - Current in memoro-service: `973da0c1-b479-4dac-a1b0-ed09c72caca8`
   - Current in mana-core: `edde080c-3882-46bd-9867-72bdf3cbd99c`

2. **Breaking Changes**: Should we enforce validation immediately or phase it in?
   - Option A: Enforce now (could break old clients)
   - Option B: Log warnings first, enforce later

3. **Logo Location**: Is `memoro-logo.svg` already uploaded to satellites-logos bucket?

---

## Success Criteria

✅ Signup creates account successfully
✅ Email shows Memoro branding (yellow, logo, features)
✅ DeviceInfo is properly tracked
✅ All auth tests pass
✅ No breaking changes to existing clients
✅ Documentation is complete
✅ Production deployment successful
