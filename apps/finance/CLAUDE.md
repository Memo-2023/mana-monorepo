# Finance Project Guide

## Overview

**Finance** is a personal finance and budget tracking application for the ManaCore ecosystem. It supports multi-currency accounts, expense/income tracking, budgets, reports, and prepares for future bank synchronization.

| App | Port | URL |
|-----|------|-----|
| Backend | 3019 | http://localhost:3019 |
| Web App | 5189 | http://localhost:5189 |
| Landing Page | 4324 | http://localhost:4324 |

## Project Structure

```
apps/finance/
├── apps/
│   ├── backend/      # NestJS API server (@finance/backend)
│   ├── web/          # SvelteKit web application (@finance/web)
│   ├── mobile/       # Expo React Native app (@finance/mobile)
│   └── landing/      # Astro marketing landing page (@finance/landing)
├── packages/
│   └── shared/       # Shared types, utils, constants (@finance/shared)
├── package.json
└── CLAUDE.md
```

## Commands

### Root Level (from monorepo root)

```bash
# All apps
pnpm finance:dev              # Run all finance apps

# Individual apps
pnpm dev:finance:backend      # Start backend server (port 3019)
pnpm dev:finance:web          # Start web app (port 5189)
pnpm dev:finance:mobile       # Start mobile app
pnpm dev:finance:landing      # Start landing page (port 4324)
pnpm dev:finance:app          # Start web + backend together

# Database
pnpm finance:db:push          # Push schema to database
pnpm finance:db:studio        # Open Drizzle Studio
pnpm finance:db:seed          # Seed initial data (default categories)
```

### Backend (apps/finance/apps/backend)

```bash
pnpm dev                      # Start with hot reload
pnpm build                    # Build for production
pnpm start:prod               # Start production server
pnpm db:push                  # Push schema to database
pnpm db:studio                # Open Drizzle Studio
pnpm db:seed                  # Seed initial data
```

### Web App (apps/finance/apps/web)

```bash
pnpm dev                      # Start dev server (port 5189)
pnpm build                    # Build for production
pnpm preview                  # Preview production build
```

## Technology Stack

| Layer | Technology |
|-------|------------|
| **Backend** | NestJS 10, Drizzle ORM, PostgreSQL |
| **Web** | SvelteKit 2.x, Svelte 5 (runes mode), Tailwind CSS 4 |
| **Mobile** | Expo, React Native, NativeWind |
| **Landing** | Astro 5.x, Tailwind CSS |
| **Auth** | Mana Core Auth (JWT) |
| **Charts** | Chart.js with svelte-chartjs |
| **i18n** | svelte-i18n (DE, EN) |
| **Dates** | date-fns |

## Core Features

1. **Accounts** - Multiple accounts (checking, savings, credit card, cash, investment)
2. **Categories** - Income/expense categories with colors and icons
3. **Transactions** - Full CRUD with filtering, search, recurring support
4. **Budgets** - Monthly budget limits per category with alerts
5. **Transfers** - Move money between accounts
6. **Reports** - Dashboard, monthly summaries, trends, category breakdown
7. **Multi-Currency** - Support for multiple currencies with exchange rates
8. **Bank Sync (Prepared)** - Architecture ready for Plaid/GoCardless integration

## Views

| View | Route | Description |
|------|-------|-------------|
| **Dashboard** | `/` | Overview with totals, budget progress, recent transactions |
| **Transactions** | `/transactions` | All transactions with filters |
| **Accounts** | `/accounts` | Account list and management |
| **Account Detail** | `/accounts/[id]` | Account transactions and details |
| **Categories** | `/categories` | Category management |
| **Budgets** | `/budgets` | Budget setup and tracking |
| **Reports** | `/reports` | Report overview |
| **Monthly Report** | `/reports/monthly` | Monthly income/expense breakdown |
| **Trends** | `/reports/trends` | Spending trends over time |
| **Settings** | `/settings` | User preferences, currency, locale |

## API Endpoints

### Accounts

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/accounts` | GET | List user's accounts |
| `/api/v1/accounts` | POST | Create account |
| `/api/v1/accounts/:id` | GET | Get account details |
| `/api/v1/accounts/:id` | PUT | Update account |
| `/api/v1/accounts/:id` | DELETE | Delete account |
| `/api/v1/accounts/:id/archive` | POST | Archive/unarchive |
| `/api/v1/accounts/totals` | GET | Get totals by currency |
| `/api/v1/accounts/reorder` | PUT | Reorder accounts |

### Categories

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/categories` | GET | List categories (filter: type) |
| `/api/v1/categories` | POST | Create category |
| `/api/v1/categories/:id` | PUT | Update category |
| `/api/v1/categories/:id` | DELETE | Delete category |
| `/api/v1/categories/seed` | POST | Seed default categories |

### Transactions

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/transactions` | GET | Query transactions (filters) |
| `/api/v1/transactions` | POST | Create transaction |
| `/api/v1/transactions/:id` | GET | Get transaction details |
| `/api/v1/transactions/:id` | PUT | Update transaction |
| `/api/v1/transactions/:id` | DELETE | Delete transaction |
| `/api/v1/transactions/recent` | GET | Recent transactions |

**Query Parameters:**
- `accountId` - Filter by account
- `categoryId` - Filter by category
- `type` - income/expense
- `startDate`, `endDate` - Date range
- `minAmount`, `maxAmount` - Amount range
- `search` - Search description/payee
- `isPending` - Pending only
- `isRecurring` - Recurring only
- `limit`, `offset` - Pagination

### Budgets

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/budgets` | GET | List budgets |
| `/api/v1/budgets` | POST | Create/update budget |
| `/api/v1/budgets/:id` | PUT | Update budget |
| `/api/v1/budgets/:id` | DELETE | Delete budget |
| `/api/v1/budgets/month/:year/:month` | GET | Budgets with spending |
| `/api/v1/budgets/copy` | POST | Copy from previous month |

### Transfers

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/transfers` | GET | List transfers |
| `/api/v1/transfers` | POST | Create transfer |
| `/api/v1/transfers/:id` | PUT | Update transfer |
| `/api/v1/transfers/:id` | DELETE | Delete transfer |

### Reports

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/reports/dashboard` | GET | Dashboard aggregations |
| `/api/v1/reports/monthly-summary` | GET | Monthly income/expense |
| `/api/v1/reports/category-breakdown` | GET | Spending by category |
| `/api/v1/reports/trends` | GET | Trends over time |
| `/api/v1/reports/cash-flow` | GET | Cash flow analysis |

## Database Schema

### accounts
- `id` (UUID) - Primary key
- `user_id` (UUID) - Owner
- `name` (VARCHAR) - Account name
- `type` (VARCHAR) - checking/savings/credit_card/cash/investment/loan
- `balance` (DECIMAL) - Current balance
- `currency` (VARCHAR) - Currency code (EUR, USD, etc.)
- `color`, `icon` - Display options
- `is_archived` - Soft delete
- `include_in_total` - Include in dashboard totals

### categories
- `id` (UUID) - Primary key
- `user_id` (UUID) - Owner
- `name` (VARCHAR) - Category name
- `type` (VARCHAR) - income/expense
- `parent_id` (UUID) - For subcategories
- `color`, `icon` - Display options
- `is_system` - Default categories
- `is_archived` - Soft delete

### transactions
- `id` (UUID) - Primary key
- `user_id` (UUID) - Owner
- `account_id` (UUID) - FK to accounts
- `category_id` (UUID) - FK to categories
- `type` (VARCHAR) - income/expense
- `amount` (DECIMAL) - Transaction amount
- `currency` (VARCHAR) - Currency code
- `date` (DATE) - Transaction date
- `description` (TEXT) - Description
- `payee` (VARCHAR) - Payee/payer name
- `is_recurring` (BOOLEAN) - Recurring flag
- `recurrence_rule` (JSONB) - Recurrence pattern
- `is_pending` (BOOLEAN) - Pending flag
- `tags` (JSONB) - Tag array

### budgets
- `id` (UUID) - Primary key
- `user_id` (UUID) - Owner
- `category_id` (UUID) - FK to categories (null = overall)
- `month`, `year` (INTEGER) - Budget period
- `amount` (DECIMAL) - Budget limit
- `alert_threshold` (DECIMAL) - Alert at percentage
- `rollover_enabled` (BOOLEAN) - Carry unused budget

### transfers
- `id` (UUID) - Primary key
- `user_id` (UUID) - Owner
- `from_account_id`, `to_account_id` (UUID) - Account references
- `amount` (DECIMAL) - Transfer amount
- `date` (DATE) - Transfer date

### exchange_rates
- `id` (UUID) - Primary key
- `from_currency`, `to_currency` (VARCHAR) - Currency pair
- `rate` (DECIMAL) - Exchange rate
- `date` (DATE) - Rate date

### user_settings
- `id` (UUID) - Primary key
- `user_id` (UUID) - Owner
- `default_currency` (VARCHAR) - Default currency
- `locale` (VARCHAR) - User locale
- `date_format` (VARCHAR) - Preferred date format

### connected_accounts (Bank Sync Preparation)
- `id` (UUID) - Primary key
- `user_id` (UUID) - Owner
- `account_id` (UUID) - FK to accounts
- `provider` (VARCHAR) - plaid/gocardless/etc.
- `external_id` (VARCHAR) - Provider account ID
- `status` (VARCHAR) - active/disconnected/error
- `last_sync_at` (TIMESTAMP) - Last sync time
- `metadata` (JSONB) - Provider-specific data

## Environment Variables

### Backend (.env)

```env
NODE_ENV=development
PORT=3019
DATABASE_URL=postgresql://manacore:devpassword@localhost:5432/finance
MANA_CORE_AUTH_URL=http://localhost:3001
CORS_ORIGINS=http://localhost:5173,http://localhost:5189,http://localhost:8081
```

### Web (.env)

```env
PUBLIC_BACKEND_URL=http://localhost:3019
PUBLIC_MANA_CORE_AUTH_URL=http://localhost:3001
```

## Default Categories (Seeded)

### Expense
- Lebensmittel (Groceries) - green
- Restaurant (Dining) - orange
- Transport - blue
- Wohnen (Housing) - purple
- Versicherungen (Insurance) - gray
- Gesundheit (Health) - red
- Unterhaltung (Entertainment) - pink
- Shopping - yellow
- Bildung (Education) - indigo
- Reisen (Travel) - cyan
- Abonnements (Subscriptions) - violet
- Sonstiges (Other) - gray

### Income
- Gehalt (Salary) - green
- Nebeneinkommen (Side Income) - blue
- Investitionen (Investments) - purple
- Geschenke (Gifts) - pink
- Sonstiges (Other) - gray

## Code Style Guidelines

- **TypeScript**: Strict typing with interfaces
- **Web**: Svelte 5 runes mode (`$state`, `$derived`, `$effect`)
- **Styling**: Tailwind CSS with CSS variables
- **Formatting**: Prettier with project config
- **i18n**: All UI text in locale files
- **Currency**: Always use DECIMAL(15,2) for money

## Important Notes

1. **Authentication**: Uses Mana Core Auth (JWT in Authorization header)
2. **Database**: PostgreSQL with Drizzle ORM (port 5432)
3. **Ports**: Backend=3019, Web=5189, Landing=4324
4. **Multi-Currency**: Exchange rates table for conversions
5. **Bank Sync**: Architecture prepared, implementation deferred
6. **Balance Updates**: Transactions automatically update account balances
