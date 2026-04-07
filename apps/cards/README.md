# Cards

A deck management system with Mana authentication and credit system integration.

## Features

- 🔐 **Mana Authentication** - Complete auth system with JWT tokens, device tracking, and automatic token refresh
- ⚡ **Credit System** - Mana-based billing for operations (10 mana to create a deck, 5 for AI features, etc.)
- 📱 **React Native/Expo** - Cross-platform mobile app (iOS, Android, Web)
- 🚀 **NestJS Backend** - Type-safe API with AuthGuard protection
- 💾 **Supabase** - Database and real-time features
- 🎨 **NativeWind** - Tailwind CSS for React Native styling

## Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn
- Expo CLI (`npm install -g expo-cli`)
- Supabase account
- Mana credentials (APP_ID, SERVICE_KEY)

### Backend Setup

1. **Navigate to backend directory**:
   ```bash
   cd backend
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure environment variables**:
   ```bash
   cp .env.example .env
   ```

   Edit `.env` and add your credentials:
   ```env
   # Mana
   MANA_SERVICE_URL=https://mana-middleware-111768794939.europe-west3.run.app
   APP_ID=your-app-id-from-mana-core
   SERVICE_KEY=your-service-key-from-mana-core  # Required for credits

   # Supabase
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_KEY=your-service-key

   # Server
   NODE_ENV=development
   PORT=8080
   ```

4. **Start the backend**:
   ```bash
   npm run start:dev
   ```

   Backend will be available at `http://localhost:8080`

### Frontend Setup

1. **Navigate to mobile app directory**:
   ```bash
   cd apps/mobile
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure environment**:
   ```bash
   cp .env.example .env
   ```

   Edit `.env`:
   ```env
   # Supabase
   EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

   # Backend API
   EXPO_PUBLIC_API_URL=http://localhost:8080  # For local development
   # EXPO_PUBLIC_API_URL=https://your-production-backend.com  # For production
   ```

4. **Start Expo**:
   ```bash
   npm start
   ```

5. **Run on platform**:
   - Press `i` for iOS simulator
   - Press `a` for Android emulator
   - Press `w` for web browser

## Architecture

```
┌─────────────────────┐
│   Mobile App        │  React Native + Expo
│   (Frontend)        │  - Authentication UI
│                     │  - Credit balance display
│                     │  - Deck management
└──────────┬──────────┘
           │ HTTPS/JSON
           │ Bearer Token Auth
           ▼
┌─────────────────────┐
│   Backend API       │  NestJS
│                     │  - AuthGuard protection
│                     │  - Credit validation
│                     │  - Business logic
└──────────┬──────────┘
           │
           ├─────────────────────┐
           │                     │
           ▼                     ▼
┌─────────────────┐   ┌──────────────────┐
│  Mana      │   │  Supabase        │
│  - Auth         │   │  - Database      │
│  - Credits      │   │  - Storage       │
│  - Transactions │   │  - Real-time     │
└─────────────────┘   └──────────────────┘
```

## Credit System

Cards uses **Mana** as its credit currency. Operations cost credits:

| Operation | Cost |
|-----------|------|
| Create Deck | 10 mana |
| Create Card | 2 mana |
| AI Card Generation | 5 mana |
| Export Deck | 3 mana |

### How it Works

1. **Pre-flight Validation**: Backend checks if user has enough credits
2. **Operation**: Performs the requested operation (create deck, etc.)
3. **Consumption**: Deducts credits only if operation succeeds
4. **Response**: Returns success + credits used

### Frontend Integration

The frontend automatically handles insufficient credits with a modal:

```typescript
import { useInsufficientCredits } from '../hooks/useInsufficientCredits';
import { InsufficientCreditsModal } from '../components/InsufficientCreditsModal';

function MyScreen() {
  const insufficientCredits = useInsufficientCredits();

  const handleAction = async () => {
    try {
      await post('/api/decks', data);
    } catch (error) {
      // Automatically shows modal if insufficient credits
      insufficientCredits.handleCreditError(error);
    }
  };

  return (
    <>
      <Button onPress={handleAction} />
      <InsufficientCreditsModal {...insufficientCredits} />
    </>
  );
}
```

**Full documentation**: See [CREDIT_SYSTEM.md](./CREDIT_SYSTEM.md)

## API Endpoints

### Authentication (via Mana)

- `POST /v1/auth/signin` - Sign in
- `POST /v1/auth/signup` - Sign up
- `POST /v1/auth/refresh` - Refresh token
- `POST /v1/auth/logout` - Sign out

### Protected Endpoints (require Bearer token)

- `GET /api/profile` - Get user profile + credit balance
- `GET /api/credits/balance` - Get credit balance
- `GET /api/decks` - List user's decks
- `POST /api/decks` - Create deck (costs 10 mana)
- `PUT /api/decks/:id` - Update deck
- `DELETE /api/decks/:id` - Delete deck
- `GET /api/cards` - List cards
- `POST /api/cards` - Create card (costs 2 mana)

### Public Endpoints

- `GET /public/health` - Health check
- `GET /public/version` - API version
- `GET /public/featured-decks` - Featured decks (optional auth)

## Project Structure

```
cards/
├── backend/                    # NestJS backend
│   ├── src/
│   │   ├── config/
│   │   │   ├── credit-operations.ts   # Credit costs & operation types
│   │   │   └── validation.schema.ts   # Environment validation
│   │   ├── controllers/
│   │   │   ├── api.controller.ts      # Protected endpoints
│   │   │   ├── public.controller.ts   # Public endpoints
│   │   │   └── health.controller.ts   # Health checks
│   │   ├── services/
│   │   │   └── supabase.service.ts    # Supabase integration
│   │   ├── app.module.ts              # Main module (Mana config)
│   │   └── main.ts                    # Entry point
│   ├── .env                    # Environment variables
│   └── package.json
│
├── apps/
│   ├── mobile/                # React Native/Expo app
│   ├── web/                   # Web app
│   └── landing/               # Landing page
│   ├── app/                    # Expo Router screens
│   │   ├── (tabs)/            # Tab navigation
│   │   └── _layout.tsx        # Root layout
│   ├── components/
│   │   └── InsufficientCreditsModal.tsx   # Credit error modal
│   ├── services/
│   │   ├── authService.ts     # Authentication
│   │   ├── tokenManager.ts    # Token refresh & management
│   │   └── creditService.ts   # Credit operations
│   ├── hooks/
│   │   └── useInsufficientCredits.ts  # Credit error handling
│   ├── types/
│   │   ├── auth.ts            # Auth types
│   │   └── credits.ts         # Credit types
│   ├── utils/
│   │   ├── apiClient.ts       # Authenticated API client
│   │   └── deviceManager.ts   # Device info
│   ├── examples/
│   │   └── DeckCreationExample.tsx    # Usage example
│   ├── .env                   # Environment variables
│   └── package.json
│
├── CREDIT_SYSTEM.md           # Credit system documentation
├── MANA_CORE_INTEGRATION_GUIDE.md
├── MANA_CORE_INTEGRATION_CHECKLIST.md
├── MANA_CORE_ARCHITECTURE.md
├── MANA_CORE_README.md
└── README.md                  # This file
```

## Development

### Backend

```bash
cd backend

# Development with hot reload
npm run start:dev

# Build for production
npm run build

# Run production build
npm run start:prod

# Linting
npm run lint

# Tests
npm run test
```

### Frontend

```bash
cd apps/mobile

# Start Expo dev server
npm start

# Run on iOS
npm run ios

# Run on Android
npm run android

# Run on web
npm run web

# Linting & formatting
npm run lint
npm run format

# Build with EAS
npm run build:dev      # Development build
npm run build:preview  # Preview build
npm run build:prod     # Production build
```

## Environment Variables

### Backend Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `MANA_SERVICE_URL` | Mana service URL | `https://mana-middleware-*.run.app` |
| `APP_ID` | Your app ID from Mana | `cea4bfc6-a4de-4e17-91e2-54275940156e` |
| `SERVICE_KEY` | Service key for credit operations | Get from Mana |
| `SUPABASE_URL` | Supabase project URL | `https://abc.supabase.co` |
| `SUPABASE_ANON_KEY` | Supabase anonymous key | Your anon key |
| `PORT` | Backend port | `8080` |

### Frontend Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `EXPO_PUBLIC_SUPABASE_URL` | Supabase project URL | `https://abc.supabase.co` |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key | Your anon key |
| `EXPO_PUBLIC_API_URL` | Backend API URL | `http://localhost:8080` |

## Testing

### Backend Testing

The backend includes example tests in `backend/src/app.controller.spec.ts`. To add credit system tests:

```typescript
import { CreditClientService } from '@mana-core/nestjs-integration/services';

// Mock in test setup
{
  provide: CreditClientService,
  useValue: {
    validateCredits: jest.fn().mockResolvedValue({
      hasCredits: true,
      availableCredits: 100,
    }),
    consumeCredits: jest.fn(),
  },
}
```

### Manual Testing

1. **Test authentication**:
   ```bash
   # Sign up
   curl -X POST http://localhost:8080/v1/auth/signup \
     -H "Content-Type: application/json" \
     -d '{"email":"test@example.com","password":"password123","username":"testuser"}'

   # Sign in
   curl -X POST http://localhost:8080/v1/auth/signin \
     -H "Content-Type: application/json" \
     -d '{"email":"test@example.com","password":"password123"}'
   ```

2. **Test protected endpoint**:
   ```bash
   export TOKEN="your-jwt-token-from-signin"

   curl -H "Authorization: Bearer $TOKEN" \
     http://localhost:8080/api/profile
   ```

3. **Test credit system**:
   ```bash
   # Check balance
   curl -H "Authorization: Bearer $TOKEN" \
     http://localhost:8080/api/credits/balance

   # Create deck (costs 10 mana)
   curl -X POST http://localhost:8080/api/decks \
     -H "Authorization: Bearer $TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"name":"My Deck","description":"Test deck"}'
   ```

## Troubleshooting

### Backend won't start

- Check all environment variables are set
- Verify Mana credentials are correct
- Check if port 8080 is available

### Credits not working

- Ensure `SERVICE_KEY` is set in backend `.env`
- Check backend logs for credit validation errors
- Verify user has credits in Mana dashboard

### Frontend can't connect to backend

- Check `EXPO_PUBLIC_API_URL` is correct
- For Android emulator, use `http://10.0.2.2:8080` instead of `localhost`
- Verify backend is running

### Token refresh fails

- Check device info is being sent with refresh requests
- Verify refresh token is stored correctly
- Check network connectivity

## Documentation

- **[Credit System](./CREDIT_SYSTEM.md)** - Complete credit system documentation
- **[Mana Integration Guide](./MANA_CORE_INTEGRATION_GUIDE.md)** - Step-by-step integration
- **[Integration Checklist](./MANA_CORE_INTEGRATION_CHECKLIST.md)** - Checkboxes for tracking
- **[Architecture Guide](./MANA_CORE_ARCHITECTURE.md)** - System architecture and flows
- **[Mana README](./MANA_CORE_README.md)** - Quick reference
- **[Example Implementation](./apps/mobile/examples/DeckCreationExample.tsx)** - Working code example

## Resources

- [Mana Documentation](https://docs.mana-core.com)
- [Mana NestJS Package](https://github.com/Memo-2023/mana-core-nestjs-package)
- [Expo Documentation](https://docs.expo.dev)
- [NestJS Documentation](https://docs.nestjs.com)
- [Supabase Documentation](https://supabase.com/docs)

## License

Private project - All rights reserved

## Support

For issues related to:
- **Mana**: https://github.com/Memo-2023/mana-core-nestjs-package/issues
- **This project**: Contact the development team
