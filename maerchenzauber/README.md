# Storyteller Project

A magical storytelling application that creates personalized children's stories with AI-generated characters and illustrations.

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and **pnpm 9+**
- Install pnpm: `npm install -g pnpm`
- Supabase account and project
- Mana Core account for authentication
- AI API keys (Azure OpenAI, Gemini, Replicate)

### Local Development Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd storyteller-project
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Environment Configuration**

   Create `.env` files in both backend and mobile apps:

   **Backend (`apps/backend/.env`)**:
   ```env
   # Server Configuration
   NODE_ENV=development
   PORT=3002

   # Mana Core Configuration
   MANA_SERVICE_URL=https://mana-core-middleware-dev-55965480161.europe-west3.run.app
   APP_ID=6c12c767-1f96-461c-b2df-93d5f9c0f063
   SERVICE_KEY=your-service-key
   SIGNUP_REDIRECT_URL=http://localhost:8081

   # Supabase Configuration
   MAERCHENZAUBER_SUPABASE_URL=your-supabase-url
   MAERCHENZAUBER_SUPABASE_ANON_KEY=your-supabase-anon-key
   MAERCHENZAUBER_SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

   # AI Services
   MAERCHENZAUBER_AZURE_OPENAI_ENDPOINT=your-azure-endpoint
   MAERCHENZAUBER_AZURE_OPENAI_KEY=your-azure-key
   MAERCHENZAUBER_GOOGLE_GENAI_API_KEY=your-gemini-key
   MAERCHENZAUBER_REPLICATE_API_KEY=your-replicate-token

   # Storage
   MAERCHENZAUBER_STORAGE_BUCKET=maerchenzauber
   ```

   **Mobile (`apps/mobile/.env`)**:
   ```env
   # For local development
   EXPO_PUBLIC_STORYTELLER_BACKEND_URL=http://localhost:3002

   # For production
   # EXPO_PUBLIC_STORYTELLER_BACKEND_URL=https://storyteller-backend-111768794939.europe-west3.run.app

   # Required for expo-router
   EXPO_ROUTER_APP_ROOT=app
   ```

4. **Start the services**

   You'll need two terminal windows:

   **Terminal 1 - Backend:**
   ```bash
   cd apps/backend
   npm run dev
   ```
   The backend will start on http://localhost:3002

   **Terminal 2 - Mobile:**
   ```bash
   cd apps/mobile
   npm run dev
   ```
   The Expo development server will start on http://localhost:8081

5. **Access the application**
   - iOS Simulator: Press `i` in the Expo terminal
   - Android Emulator: Press `a` in the Expo terminal
   - Physical device: Scan the QR code with Expo Go app
   - Web browser: Press `w` (experimental)

## 📱 Testing on Physical Devices

### iOS Physical Device
1. Find your computer's IP address:
   ```bash
   ifconfig | grep "inet " | grep -v 127.0.0.1
   ```

2. Update `apps/mobile/.env`:
   ```env
   EXPO_PUBLIC_STORYTELLER_BACKEND_URL=http://YOUR_IP_ADDRESS:3002
   ```

3. Restart the mobile app and scan the QR code with Expo Go

### Android Physical Device
1. Make sure your device and computer are on the same network
2. Follow the same steps as iOS

## 🏗️ Project Structure

```
storyteller-project/
├── apps/
│   ├── backend/          # NestJS backend API
│   │   ├── src/
│   │   │   ├── auth/     # Authentication proxy
│   │   │   ├── character/# Character management
│   │   │   ├── story/    # Story generation
│   │   │   ├── core/     # Core services & prompts
│   │   │   ├── health/   # Health checks
│   │   │   ├── credits/  # Credits management
│   │   │   ├── settings/ # User settings
│   │   │   └── supabase/ # Database integration
│   │   └── ...
│   ├── mobile/           # React Native Expo app
│   │   ├── app/          # App routes (expo-router)
│   │   ├── src/          # Source code
│   │   │   ├── components/
│   │   │   ├── services/
│   │   │   ├── hooks/
│   │   │   └── utils/
│   │   └── ...
│   ├── landing/          # Astro landing page
│   └── web/              # SvelteKit web app
├── packages/
│   └── shared-types/     # Shared TypeScript types
└── turbo.json           # Turborepo configuration
```

## 🛠️ Available Scripts

### Root Level (Turborepo)
- `pnpm run dev` - Start all services in development mode
- `pnpm run build` - Build all applications
- `pnpm run clean` - Clean all node_modules and build artifacts
- `pnpm run type-check` - Run TypeScript checks on all packages
- `pnpm run lint` - Lint all packages
- `pnpm run format` - Format code with Prettier

### Backend (`apps/backend/`)
- `pnpm run dev` - Start in watch mode (port 3002)
- `pnpm run build` - Build for production
- `pnpm run start:prod` - Start production build
- `pnpm run test` - Run tests
- `pnpm run test:watch` - Run tests in watch mode
- `pnpm run test:cov` - Run tests with coverage
- `pnpm run lint` - Lint backend code

### Mobile (`apps/mobile/`)
- `pnpm run dev` - Start Expo development server
- `pnpm run ios` - Run on iOS simulator
- `pnpm run android` - Run on Android emulator
- `pnpm run web` - Run in web browser
- `pnpm run build` - Create production build
- `pnpm run preview` - Preview production build

### Landing Page (`apps/landing/`)
- `pnpm run dev` - Start Astro dev server
- `pnpm run build` - Build static site
- `pnpm run preview` - Preview production build

### Web App (`apps/web/`)
- `pnpm run dev` - Start SvelteKit dev server
- `pnpm run build` - Build production bundle
- `pnpm run preview` - Preview production build

## 🔧 Troubleshooting

### Backend Issues

**Backend won't start:**
- Check if port 3002 is available: `lsof -i :3002`
- Kill existing process: `kill -9 $(lsof -t -i:3002)`
- Verify all environment variables are set correctly
- Check database connections (Supabase, Mana Core)

**SupabaseProvider dependency error:**
- Ensure CommonModule is imported in AppModule
- Check that all modules are properly exported

### Mobile App Issues

**Can't connect to backend:**
- Ensure backend is running on port 3002
- Check `EXPO_PUBLIC_STORYTELLER_BACKEND_URL` in `.env`
- For physical devices, use computer's IP address instead of localhost
- Check firewall settings allow connections on port 3002

**Metro bundler issues:**
- Clear cache: `npx expo start -c`
- Reset Metro bundler: `npx expo start --clear`
- Delete node_modules and reinstall: `rm -rf node_modules && npm install`

**Expo development server issues:**
- Kill existing Expo processes: `pkill -f "expo start"`
- Check port 8081 availability: `lsof -i :8081`
- Try different port: `npx expo start --port 8082`

### Landing Page Issues

**Build errors with @rolldown/pluginutils:**
```bash
cd apps/landing
npm install @rolldown/pluginutils
```

### General Issues

**TypeScript errors:**
- Build all packages: `pnpm run build` from root
- Check types: `pnpm run type-check`
- Ensure VSCode uses workspace TypeScript version

**Dependency issues:**
- Clear all caches: `pnpm run clean`
- Reinstall: `rm -rf node_modules pnpm-lock.yaml && pnpm install`
- Update dependencies: `pnpm update`

## 📊 Health Monitoring

### Backend Health Check
```bash
# Full health check
curl http://localhost:3002/health | jq

# Readiness check (for deployments)
curl http://localhost:3002/health/ready | jq

# Liveness check (for container orchestration)
curl http://localhost:3002/health/live | jq
```

Expected healthy response:
```json
{
  "status": "healthy",
  "timestamp": "2025-01-09T21:16:58.017Z",
  "duration": 213,
  "services": [
    {
      "name": "supabase",
      "status": "healthy",
      "responseTime": 146
    },
    {
      "name": "mana-service",
      "status": "healthy",
      "responseTime": 67
    },
    {
      "name": "ai-services",
      "status": "healthy",
      "responseTime": 0,
      "metadata": {
        "gemini": "configured",
        "replicate": "configured"
      }
    }
  ],
  "version": "0.0.1",
  "environment": "development"
}
```

## 🚢 Deployment

### Backend Deployment (Google Cloud Run)

1. **Build Docker image:**
   ```bash
   cd apps/backend
   docker build -t storyteller-backend .
   ```

2. **Test locally:**
   ```bash
   docker run -p 3002:3002 --env-file .env storyteller-backend
   ```

3. **Deploy to Cloud Run:**
   ```bash
   gcloud builds submit --tag gcr.io/PROJECT_ID/storyteller-backend
   gcloud run deploy storyteller-backend \
     --image gcr.io/PROJECT_ID/storyteller-backend \
     --region europe-west3 \
     --platform managed \
     --allow-unauthenticated \
     --set-env-vars-from-file .env.production
   ```

### Mobile Deployment (EAS Build)

1. **Configure EAS:**
   ```bash
   cd apps/mobile
   eas build:configure
   ```

2. **Build for iOS:**
   ```bash
   eas build --platform ios --profile production
   ```

3. **Build for Android:**
   ```bash
   eas build --platform android --profile production
   ```

4. **Submit to stores:**
   ```bash
   eas submit --platform ios
   eas submit --platform android
   ```

## 🔐 Security

- Never commit `.env` files
- Use environment-specific configurations
- Rotate API keys regularly
- Use least-privilege principle for service accounts
- Enable CORS only for trusted origins
- Implement rate limiting in production

## 📝 API Documentation

The backend exposes the following main endpoints:

### Authentication
- `POST /auth/signin` - Sign in with email/password
- `POST /auth/signup` - Create new account
- `POST /auth/google-signin` - Sign in with Google
- `POST /auth/apple-signin` - Sign in with Apple
- `POST /auth/refresh` - Refresh access token
- `POST /auth/logout` - Log out user

### Characters
- `GET /character` - Get user's characters
- `GET /character/:id` - Get specific character
- `POST /character/generate-images` - Generate character images
- `POST /character/generate-animal` - Generate animal character
- `PUT /character/:id` - Update character
- `DELETE /character/:id` - Delete character

### Stories
- `GET /story` - Get user's stories
- `GET /story/:id` - Get specific story
- `POST /story` - Create new story
- `POST /story/animal` - Create animal story
- `PUT /story/:id` - Update story
- `DELETE /story/:id` - Delete story

### Settings
- `GET /settings/user` - Get user settings
- `PUT /settings/user` - Update user settings
- `GET /settings/app` - Get app configuration
- `GET /settings/features` - Get feature flags
- `GET /settings/creators` - Get available creators
- `GET /settings/languages` - Get supported languages
- `GET /settings/themes` - Get available themes

### Credits
- `GET /credits/balance` - Get credit balance
- `GET /credits/history` - Get transaction history
- `POST /credits/check` - Check credit availability
- `POST /credits/consume` - Consume credits
- `GET /credits/packages` - Get available packages

## 🤝 Contributing

1. Create a feature branch: `git checkout -b feature/amazing-feature`
2. Make your changes
3. Run tests: `npm run test`
4. Lint code: `npm run lint`
5. Format code: `npm run format`
6. Commit: `git commit -m 'Add amazing feature'`
7. Push: `git push origin feature/amazing-feature`
8. Open a Pull Request

## 📧 Support

For issues and questions, please contact the development team or create an issue in the repository.

## 📄 License

Private repository - All rights reserved