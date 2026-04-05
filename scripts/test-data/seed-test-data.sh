#!/bin/bash
# Seed Test Data
#
# Seeds databases with consistent test data for integration and E2E tests.
# Uses predetermined UUIDs and data to ensure reproducible tests.
#
# Usage:
#   ./scripts/test-data/seed-test-data.sh [service]
#
# Examples:
#   ./scripts/test-data/seed-test-data.sh              # Seed all services
#   ./scripts/test-data/seed-test-data.sh auth         # Seed auth only
#   ./scripts/test-data/seed-test-data.sh chat         # Seed chat only

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

SERVICE_FILTER=${1:-"all"}

echo -e "${GREEN}Seeding test data...${NC}"

# Configuration
export NODE_ENV="test"
export DATABASE_URL_TEMPLATE="postgresql://mana:devpassword@localhost:5432"

# Seed auth service
seed_auth() {
  echo -e "\n${GREEN}Seeding mana-auth...${NC}"

  export DATABASE_URL="${DATABASE_URL_TEMPLATE}/mana_auth"

  cd services/mana-auth

  # Run migrations
  pnpm run db:push

  # Create test users using Node.js script
  node -e "
    const { db } = require('./src/db/connection');
    const { users, accounts, creditBalances } = require('./src/db/schema/auth.schema');
    const bcrypt = require('bcrypt');

    async function seedTestUsers() {
      console.log('Creating test users...');

      // Deterministic test user IDs
      const testUsers = [
        {
          id: '00000000-0000-0000-0000-000000000001',
          email: 'test-user-1@example.com',
          name: 'Test User 1',
          password: 'TestPassword123!',
        },
        {
          id: '00000000-0000-0000-0000-000000000002',
          email: 'test-user-2@example.com',
          name: 'Test User 2',
          password: 'TestPassword123!',
        },
        {
          id: '00000000-0000-0000-0000-000000000003',
          email: 'admin@example.com',
          name: 'Admin User',
          password: 'AdminPassword123!',
          role: 'admin',
        },
      ];

      for (const user of testUsers) {
        try {
          // Check if user exists
          const existing = await db.select().from(users).where(eq(users.email, user.email)).limit(1);

          if (existing.length > 0) {
            console.log(\`User \${user.email} already exists, skipping\`);
            continue;
          }

          // Hash password
          const hashedPassword = await bcrypt.hash(user.password, 10);

          // Insert user
          await db.insert(users).values({
            id: user.id,
            email: user.email,
            name: user.name,
            emailVerified: true,
            role: user.role || 'user',
          });

          // Insert credential account
          await db.insert(accounts).values({
            id: \`\${user.id}-credential\`,
            userId: user.id,
            accountId: user.id,
            providerId: 'credential',
            password: hashedPassword,
          });

          // Initialize credit balance
          await db.insert(creditBalances).values({
            userId: user.id,
            balance: 0,
            freeCreditsRemaining: 150,
            dailyFreeCredits: 5,
          });

          console.log(\`Created test user: \${user.email}\`);
        } catch (error) {
          console.error(\`Error creating user \${user.email}:\`, error);
        }
      }

      console.log('Test users seeded successfully');
      process.exit(0);
    }

    seedTestUsers().catch(console.error);
  "

  cd ../..
}

# Seed chat service
seed_chat() {
  echo -e "\n${GREEN}Seeding chat...${NC}"

  export DATABASE_URL="${DATABASE_URL_TEMPLATE}/chat"

  cd apps/chat/apps/backend

  # Run migrations
  if grep -q "db:push" package.json; then
    pnpm run db:push
  fi

  # Seed AI models
  if grep -q "db:seed" package.json; then
    pnpm run db:seed
  fi

  cd ../../../..
}

# Seed todo service
seed_todo() {
  echo -e "\n${GREEN}Seeding todo...${NC}"

  export DATABASE_URL="${DATABASE_URL_TEMPLATE}/todo"

  cd apps/todo/apps/backend

  if grep -q "db:push" package.json; then
    pnpm run db:push
  fi

  if grep -q "db:seed" package.json; then
    pnpm run db:seed
  fi

  cd ../../../..
}

# Seed calendar service
seed_calendar() {
  echo -e "\n${GREEN}Seeding calendar...${NC}"

  export DATABASE_URL="${DATABASE_URL_TEMPLATE}/calendar"

  cd apps/calendar/apps/backend

  if grep -q "db:push" package.json; then
    pnpm run db:push
  fi

  if grep -q "db:seed" package.json; then
    pnpm run db:seed
  fi

  cd ../../../..
}

# Seed contacts service
seed_contacts() {
  echo -e "\n${GREEN}Seeding contacts...${NC}"

  export DATABASE_URL="${DATABASE_URL_TEMPLATE}/contacts"

  cd apps/contacts/apps/backend

  if grep -q "db:push" package.json; then
    pnpm run db:push
  fi

  if grep -q "db:seed" package.json; then
    pnpm run db:seed
  fi

  cd ../../../..
}

# Execute seeding based on filter
case "$SERVICE_FILTER" in
  "all")
    seed_auth
    seed_chat
    seed_todo
    seed_calendar
    seed_contacts
    ;;
  "auth")
    seed_auth
    ;;
  "chat")
    seed_chat
    ;;
  "todo")
    seed_todo
    ;;
  "calendar")
    seed_calendar
    ;;
  "contacts")
    seed_contacts
    ;;
  *)
    echo -e "${RED}Unknown service: $SERVICE_FILTER${NC}"
    echo "Available services: all, auth, chat, todo, calendar, contacts"
    exit 1
    ;;
esac

echo -e "\n${GREEN}✓ Test data seeded successfully!${NC}"
