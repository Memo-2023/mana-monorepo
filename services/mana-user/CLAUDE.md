# mana-user

User preferences, tags, and storage service. Extracted from mana-core-auth.

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Runtime** | Bun |
| **Framework** | Hono |
| **Database** | PostgreSQL + Drizzle ORM |
| **Auth** | JWT validation via JWKS from mana-core-auth |

## Port: 3062

## Quick Start

```bash
bun run dev         # Start with hot reload
bun run db:push     # Push schema to DB
bun run db:studio   # Open Drizzle Studio
```

## API Endpoints (all JWT auth)

### Tags (`/api/v1/tags`)
| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | List user's tags |
| POST | `/` | Create tag |
| PUT | `/:id` | Update tag |
| DELETE | `/:id` | Delete tag |
| POST | `/defaults` | Create default tags |
| POST | `/resolve` | Batch resolve by IDs |

### Tag Groups (`/api/v1/tag-groups`)
| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | List user's groups |
| POST | `/` | Create group |
| PUT | `/:id` | Update group |
| DELETE | `/:id` | Delete group |

### Tag Links (`/api/v1/tag-links`)
| Method | Path | Description |
|--------|------|-------------|
| GET | `/entity?appId=&entityId=` | Get tags for entity |
| POST | `/` | Create link |
| POST | `/sync` | Sync all links for entity |
| GET | `/query?appId=&tagId=` | Query links |
| DELETE | `/:id` | Delete link |

### Settings (`/api/v1/settings`)
| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | Get user settings |
| PUT | `/global` | Update global settings |
| PUT | `/app/:appId` | Update app-specific override |
| PUT | `/device/:deviceId` | Update device-specific settings |

## Database: `mana_user`

Tables: tags, tag_groups, tag_links, user_settings

## Environment Variables

```env
PORT=3062
DATABASE_URL=postgresql://manacore:devpassword@localhost:5432/mana_user
MANA_CORE_AUTH_URL=http://localhost:3001
CORS_ORIGINS=http://localhost:5173
```
