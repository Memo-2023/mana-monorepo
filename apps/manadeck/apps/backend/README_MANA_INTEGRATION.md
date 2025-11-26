# ManaDeck Backend with Mana Core Integration

## Overview

This is the NestJS backend for ManaDeck, integrated with the Mana Core authentication system. It provides a secure API for the ManaDeck mobile application with centralized authentication, user management, and database operations.

## Architecture

```
Mobile App (React Native/Expo)
    ↓ API requests
Backend Service (NestJS + @mana-core/nestjs-integration)
    ↓ Proxy auth requests
Mana Core Middleware (Central Auth Service)
    ↓ User management
Supabase (Database & Storage)
```

## Features

- ✅ Mana Core authentication integration
- ✅ Protected and public API endpoints
- ✅ Supabase database integration with RLS
- ✅ Health check endpoints
- ✅ CORS configuration for mobile app
- ✅ Docker containerization
- ✅ Google Cloud Run deployment ready

## Project Structure

```
backend/
├── src/
│   ├── config/
│   │   └── validation.schema.ts    # Environment variable validation
│   ├── controllers/
│   │   ├── api.controller.ts       # Protected API endpoints
│   │   ├── public.controller.ts    # Public endpoints
│   │   └── health.controller.ts    # Health checks
│   ├── services/
│   │   └── supabase.service.ts     # Database operations
│   ├── app.controller.ts           # Default app controller
│   ├── app.module.ts               # Main application module
│   ├── app.service.ts              # Default app service
│   └── main.ts                     # Application entry point
├── .env                            # Environment variables
├── .env.example                    # Example environment file
├── Dockerfile                      # Docker configuration
├── cloudbuild.yaml                # Google Cloud Build config
└── package.json                   # Dependencies and scripts
```

## Prerequisites

- Node.js 18+
- NPM or Yarn
- Mana Core Middleware running (locally or deployed)
- Supabase project with configured database

## Installation

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Edit .env with your configuration
```

## Configuration

### Required Environment Variables

```bash
# Server Configuration
NODE_ENV=development
PORT=8080

# Mana Core Configuration
MANA_SERVICE_URL=http://localhost:3000  # URL to Mana Core Middleware
APP_ID=your-app-id                      # Your app's UUID
SERVICE_KEY=your-service-key            # Optional service key
SIGNUP_REDIRECT_URL=https://yourapp.com/welcome

# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-key   # Optional for admin operations

# JWT Configuration
JWT_SECRET=your-jwt-secret

# CORS Configuration
FRONTEND_URL=http://localhost:8081
```

## Available Endpoints

### Authentication (Proxied by ManaCoreModule)
- `POST /auth/signin` - Email/password sign-in
- `POST /auth/signup` - User registration
- `POST /auth/google-signin` - Google OAuth
- `POST /auth/apple-signin` - Apple OAuth
- `POST /auth/refresh` - Token refresh
- `POST /auth/logout` - User logout
- `POST /auth/forgot-password` - Password reset
- `POST /auth/validate` - Token validation
- `GET /auth/credits` - Get user credits
- `GET /auth/devices` - Get user devices

### Protected API Endpoints (Requires Authentication)
- `GET /v1/api/profile` - Get user profile
- `GET /v1/api/decks` - Get user's decks
- `POST /v1/api/decks` - Create a new deck
- `PUT /v1/api/decks/:id` - Update a deck
- `DELETE /v1/api/decks/:id` - Delete a deck
- `GET /v1/api/cards` - Get user's cards
- `POST /v1/api/cards` - Create a new card
- `GET /v1/api/stats` - Get user statistics

### Public Endpoints
- `GET /v1/public/featured-decks` - Get featured decks (personalized if authenticated)
- `GET /v1/public/leaderboard` - Get leaderboard
- `GET /v1/public/deck-templates` - Get deck templates
- `GET /v1/public/announcements` - Get announcements
- `GET /v1/public/health` - Basic health check
- `GET /v1/public/version` - API version info

### Health Checks
- `GET /health` - Comprehensive health check
- `GET /health/ready` - Readiness probe
- `GET /health/live` - Liveness probe

## Development

```bash
# Start development server with watch mode
npm run start:dev

# Start production server
npm run start:prod

# Run tests
npm test

# Run linting
npm run lint

# Build the application
npm run build
```

## Testing the Integration

1. **Start Mana Core Middleware** (if running locally):
```bash
cd ../mana-core-middleware
npm run start:dev
```

2. **Start the Backend**:
```bash
npm run start:dev
```

3. **Test Health Check**:
```bash
curl http://localhost:8080/health
```

4. **Test Public Endpoint**:
```bash
curl http://localhost:8080/v1/public/version
```

5. **Test Authentication**:
```bash
# Sign up
curl -X POST http://localhost:8080/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'

# Sign in
curl -X POST http://localhost:8080/auth/signin \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

6. **Test Protected Endpoint**:
```bash
# Use the token from signin response
curl http://localhost:8080/v1/api/profile \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Docker

### Build Docker Image
```bash
docker build -t manadeck-backend .
```

### Run Docker Container
```bash
docker run -p 8080:8080 --env-file .env manadeck-backend
```

## Deployment

### Google Cloud Run

1. **Build and push to Container Registry**:
```bash
gcloud builds submit --config cloudbuild.yaml
```

2. **Or deploy directly**:
```bash
gcloud run deploy manadeck-backend \
  --source . \
  --region us-central1 \
  --allow-unauthenticated
```

## Mobile App Integration

Update your React Native app to use the backend:

1. **Update API configuration**:
```javascript
// utils/api.js
const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8080';
```

2. **Use auth endpoints**:
```javascript
// Sign in
const response = await fetch(`${API_URL}/auth/signin`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, password }),
});
```

3. **Use protected endpoints**:
```javascript
// Get profile
const response = await fetch(`${API_URL}/v1/api/profile`, {
  headers: {
    'Authorization': `Bearer ${token}`
  },
});
```

## Security Considerations

- Always use HTTPS in production
- Keep SERVICE_KEY secure and never expose it
- Regularly rotate JWT_SECRET
- Use environment-specific configurations
- Enable rate limiting on auth endpoints
- Implement proper CORS policies
- Use Supabase RLS for data security

## Troubleshooting

### "App verification failed"
- Verify APP_ID matches the one registered with Mana Core
- Check MANA_SERVICE_URL is correct and accessible

### "Token expired" errors
- Ensure token refresh is implemented in the mobile app
- Check token expiration settings in Mana Core

### "CORS errors" in mobile app
- Update FRONTEND_URL in .env
- Verify CORS configuration in main.ts

### "Cannot connect to Mana Core"
- Ensure Mana Core Middleware is running
- Check network connectivity
- Verify MANA_SERVICE_URL is correct

## Next Steps

1. **Database Setup**: Create tables in Supabase for decks, cards, etc.
2. **RLS Policies**: Implement Row-Level Security in Supabase
3. **Testing**: Add unit and integration tests
4. **Monitoring**: Set up logging and monitoring
5. **CI/CD**: Configure automated deployment pipeline
6. **Documentation**: Generate API documentation with Swagger

## Support

For issues or questions:
- Check the Mana Core documentation
- Review the integration guides
- Contact the development team