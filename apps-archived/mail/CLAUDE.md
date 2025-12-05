# Mail Project Guide

## Project Structure

```
apps/mail/
├── apps/
│   ├── backend/      # NestJS API server (@mail/backend) - Port 3017
│   ├── landing/      # Astro marketing landing page (@mail/landing)
│   ├── web/          # SvelteKit web application (@mail/web) - Port 5186
│   └── mobile/       # Expo/React Native mobile app (@mail/mobile)
├── packages/
│   └── shared/       # Shared types, utils, configs (@mail/shared)
└── package.json
```

## Commands

### Root Level (from monorepo root)

```bash
pnpm mail:dev                       # Run all mail apps
pnpm dev:mail:mobile                # Start mobile app
pnpm dev:mail:web                   # Start web app
pnpm dev:mail:landing               # Start landing page
pnpm dev:mail:backend               # Start backend server
pnpm dev:mail:app                   # Start web + backend together
```

### Mobile App (apps/mail/apps/mobile)

```bash
pnpm dev                         # Start Expo dev server
pnpm ios                         # Run on iOS simulator
pnpm android                     # Run on Android emulator
```

### Backend (apps/mail/apps/backend)

```bash
pnpm dev                         # Start with hot reload
pnpm build                       # Build for production
pnpm start:prod                  # Start production server
pnpm db:push                     # Push schema to database
pnpm db:studio                   # Open Drizzle Studio
```

### Web App (apps/mail/apps/web)

```bash
pnpm dev                         # Start dev server
pnpm build                       # Build for production
pnpm preview                     # Preview production build
```

### Landing Page (apps/mail/apps/landing)

```bash
pnpm dev                         # Start dev server
pnpm build                       # Build for production
```

## Technology Stack

- **Mobile**: React Native 0.81 + Expo SDK 54, NativeWind, Expo Router, Zustand
- **Web**: SvelteKit 2.x, Svelte 5 (runes mode), Tailwind CSS
- **Landing**: Astro 5.x, Tailwind CSS
- **Backend**: NestJS 10, Drizzle ORM, PostgreSQL
- **Email**: ImapFlow, Nodemailer, Google APIs, Microsoft Graph
- **AI**: Google Gemini API
- **Types**: TypeScript 5.x

## Architecture

### Email Providers

| Provider | Protocol | Library |
|----------|----------|---------|
| IMAP/SMTP | Standard | imapflow, nodemailer |
| Gmail | OAuth 2.0 | googleapis |
| Outlook | OAuth 2.0 | @microsoft/microsoft-graph-client |

### Backend API Endpoints

#### Accounts
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/accounts` | GET | List email accounts |
| `/api/v1/accounts` | POST | Add IMAP account |
| `/api/v1/accounts/:id` | GET | Get account details |
| `/api/v1/accounts/:id` | PATCH | Update account |
| `/api/v1/accounts/:id` | DELETE | Remove account |
| `/api/v1/accounts/:id/sync` | POST | Trigger sync |
| `/api/v1/accounts/:id/test` | POST | Test connection |
| `/api/v1/accounts/:id/default` | POST | Set as default |

#### OAuth
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/oauth/google/init` | POST | Start Gmail OAuth |
| `/api/v1/oauth/google/callback` | GET | Gmail callback |
| `/api/v1/oauth/microsoft/init` | POST | Start Outlook OAuth |
| `/api/v1/oauth/microsoft/callback` | GET | Outlook callback |

#### Folders
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/folders` | GET | List all folders |
| `/api/v1/folders` | POST | Create folder |
| `/api/v1/folders/:id` | GET | Get folder |
| `/api/v1/folders/:id` | PATCH | Update folder |
| `/api/v1/folders/:id` | DELETE | Delete folder |
| `/api/v1/folders/:id/hide` | POST | Toggle hide folder |

#### Emails
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/emails` | GET | List emails |
| `/api/v1/emails/search` | GET | Search emails |
| `/api/v1/emails/:id` | GET | Get email |
| `/api/v1/emails/:id` | PATCH | Update flags |
| `/api/v1/emails/:id` | DELETE | Delete email |
| `/api/v1/emails/:id/move` | POST | Move to folder |
| `/api/v1/emails/batch` | POST | Batch operations |
| `/api/v1/emails/:id/thread` | GET | Get email thread |

#### Compose
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/drafts` | GET | List drafts |
| `/api/v1/drafts` | POST | Create draft |
| `/api/v1/drafts/:id` | GET | Get draft |
| `/api/v1/drafts/:id` | PATCH | Update draft |
| `/api/v1/drafts/:id` | DELETE | Delete draft |
| `/api/v1/drafts/:id/send` | POST | Send draft |
| `/api/v1/send` | POST | Send directly |
| `/api/v1/emails/:id/reply` | POST | Create reply draft |
| `/api/v1/emails/:id/reply-all` | POST | Create reply-all draft |
| `/api/v1/emails/:id/forward` | POST | Create forward draft |

#### Attachments
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/emails/:emailId/attachments` | GET | List email attachments |
| `/api/v1/attachments/:id` | GET | Get attachment |
| `/api/v1/attachments` | POST | Create attachment record |
| `/api/v1/attachments/:id` | DELETE | Delete attachment |
| `/api/v1/attachments/upload-url` | POST | Get presigned upload URL |
| `/api/v1/attachments/:id/download` | GET | Get download URL |
| `/api/v1/attachments/:id/complete` | POST | Mark upload complete |

#### Labels
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/labels` | GET | List labels |
| `/api/v1/labels` | POST | Create label |
| `/api/v1/labels/:id` | GET | Get label |
| `/api/v1/labels/:id` | PATCH | Update label |
| `/api/v1/labels/:id` | DELETE | Delete label |
| `/api/v1/labels/email/:emailId` | GET | Get email labels |
| `/api/v1/labels/email/:emailId/add` | POST | Add labels to email |
| `/api/v1/labels/email/:emailId/remove` | POST | Remove labels from email |
| `/api/v1/labels/email/:emailId/set` | POST | Set email labels |

#### Sync
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/sync/accounts/:accountId` | POST | Sync account |
| `/api/v1/sync/accounts/:accountId/folders/:folderId` | POST | Sync folder |
| `/api/v1/sync/emails/:emailId/fetch` | POST | Fetch full email |

#### AI
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/emails/:id/summarize` | POST | AI summary |
| `/api/v1/emails/:id/suggest-replies` | POST | Smart reply |
| `/api/v1/emails/:id/categorize` | POST | Auto-categorize |

### Database Schema

**email_accounts** - Email account configurations
- `id` (UUID) - Primary key
- `user_id` (VARCHAR) - User reference
- `name`, `email` (VARCHAR) - Display name and email address
- `provider` (VARCHAR) - gmail, outlook, imap
- `imap_host`, `imap_port`, `smtp_host`, `smtp_port` - Server settings
- `encrypted_password` (TEXT) - Encrypted credentials
- `access_token`, `refresh_token` (TEXT) - OAuth tokens
- `sync_state` (JSONB) - Provider-specific sync state
- `created_at`, `updated_at` (TIMESTAMP)

**folders** - Email folders
- `id` (UUID) - Primary key
- `account_id` (UUID) - Account reference
- `name`, `type`, `path` (VARCHAR) - Folder info
- `unread_count`, `total_count` (INTEGER)

**emails** - Email messages
- `id` (UUID) - Primary key
- `account_id`, `folder_id`, `thread_id` (UUID) - References
- `message_id` (VARCHAR) - RFC 2822 Message-ID
- `subject`, `from_address`, `from_name` (VARCHAR/TEXT)
- `to_addresses`, `cc_addresses` (JSONB) - Recipients
- `body_plain`, `body_html` (TEXT) - Content
- `is_read`, `is_starred`, `has_attachments` (BOOLEAN)
- `ai_summary`, `ai_category`, `ai_priority` (VARCHAR/TEXT)

**attachments** - Email attachments
- `id` (UUID) - Primary key
- `email_id` (UUID) - Email reference
- `filename`, `mime_type`, `size` - File info
- `storage_key` (VARCHAR) - S3 storage key

**labels** - Custom labels
- `id` (UUID) - Primary key
- `name`, `color` (VARCHAR)

**drafts** - Email drafts
- `id` (UUID) - Primary key
- `account_id` (UUID) - Account reference
- `subject`, `body_html` (TEXT)
- `to_addresses`, `cc_addresses` (JSONB)
- `scheduled_at` (TIMESTAMP)

### Environment Variables

#### Backend (.env)
```env
NODE_ENV=development
PORT=3017
DATABASE_URL=postgresql://manacore:devpassword@localhost:5432/mail
MANA_CORE_AUTH_URL=http://localhost:3001
CORS_ORIGINS=http://localhost:5173,http://localhost:5186,http://localhost:8081

# OAuth
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=http://localhost:3017/api/v1/oauth/google/callback
MICROSOFT_CLIENT_ID=
MICROSOFT_CLIENT_SECRET=
MICROSOFT_REDIRECT_URI=http://localhost:3017/api/v1/oauth/microsoft/callback

# AI
GOOGLE_GENAI_API_KEY=

# Encryption
ENCRYPTION_KEY=your-32-byte-encryption-key

# Queue (optional)
REDIS_URL=redis://localhost:6379
```

#### Mobile (.env)
```env
EXPO_PUBLIC_BACKEND_URL=http://localhost:3017
EXPO_PUBLIC_MANA_CORE_AUTH_URL=http://localhost:3001
```

#### Web (.env)
```env
PUBLIC_BACKEND_URL=http://localhost:3017
PUBLIC_MANA_CORE_AUTH_URL=http://localhost:3001
```

## AI Features

### Summarization
- 1-2 sentence email summary
- Focus on action items and key information
- Uses Google Gemini API

### Smart Reply
- 3 reply suggestions per email
- Different tones (positive, neutral, declining)
- Context-aware responses

### Auto-Categorization
Categories:
- `work` - Work-related emails
- `personal` - Personal communications
- `newsletter` - Newsletters/subscriptions
- `transactional` - Receipts, confirmations
- `promotional` - Marketing emails

## Code Style Guidelines

- **TypeScript**: Strict typing with interfaces
- **Mobile**: Functional components with hooks, Zustand for state
- **Web**: Svelte 5 runes mode (`$state`, `$derived`, `$effect`)
- **Styling**: Tailwind CSS / NativeWind
- **Formatting**: Prettier with project config

## Important Notes

1. **Authentication**: Uses Mana Core Auth (JWT in Authorization header)
2. **Database**: PostgreSQL with Drizzle ORM
3. **Port**: Backend runs on port 3017, Web on port 5186 by default
4. **Storage**: Uses MinIO/S3 for attachments via @manacore/shared-storage
5. **Encryption**: IMAP passwords are encrypted at rest
6. **Multi-Account**: Each user can have multiple email accounts
