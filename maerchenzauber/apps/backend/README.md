# storyteller-backend

## Authentication

This application uses Supabase for authentication, following a multi-Supabase architecture:

1. A central auth Supabase instance ("mana") handles user authentication
2. An application-specific Supabase instance ("maerchenzauber") handles application data
3. The NestJS backend serves as a token exchange middleware and application server

### Setup Requirements

You need to set up two Supabase instances:
1. **mana** - Central authentication service
2. **maerchenzauber** - Application-specific database

See `auth.md` for detailed setup instructions and database schema.

### Environment Variables

Configure the following environment variables (see `.env.example`):
- `MANA_SUPABASE_URL` - URL of the central auth Supabase instance
- `MANA_SUPABASE_ANON_KEY` - Anon key for the central auth Supabase
- `MANA_JWT_SECRET` - JWT secret for verifying tokens from the central auth
- `MAERCHENZAUBER_SUPABASE_URL` - URL of the application Supabase instance
- `MAERCHENZAUBER_SUPABASE_ANON_KEY` - Anon key for the application Supabase
- `MAERCHENZAUBER_JWT_SECRET` - JWT secret for signing tokens for the application Supabase
- `APP_ID` - Application identifier (default: "8d2f5ddb-e251-4b3b-8802-84022a7ac77f")

## Build and Deploy

gcloud config set project storyteller-a1fde

build it and deploy it to cloud run

gcloud builds submit --tag gcr.io/storyteller-a1fde/storyteller-api:v1.5.7

after sucesfull build it shows something like this

gcr.io/storyteller-a1fde/storyteller-api:v1.5.7


then run

gcloud run deploy storyteller-api \
  --image gcr.io/storyteller-a1fde/storyteller-api:v1.5.7 \
  --region=us-central1 \
  --platform=managed \
  --allow-unauthenticated


currently deployed: gcr.io/storyteller-a1fde/storyteller-api:v1.5.7


## Testing Request

curl -X POST http://localhost:3000/story \
-H "Content-Type: application/json" \
-d '{
  "characters": ["7d800d18-dcb4-4a48-addf-c6a6a88dd7ed"],
  "storyDescription": "A fun adventure story about friendship and courage",
  "illustratorId": "QsqH9Cyds24rRbAYf6zT",
  "authorId": "fKMNQsgKojozOHTnjAbs"
}'

