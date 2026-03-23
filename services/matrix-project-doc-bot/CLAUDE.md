# Matrix Project Doc Bot - Claude Code Guidelines

## Overview

Matrix Project Doc Bot collects photos, voice notes, and text for projects and generates blog posts. GDPR-compliant replacement for telegram-project-doc-bot.

## Tech Stack

- **Framework**: NestJS 10
- **Matrix**: matrix-bot-sdk
- **Database**: Drizzle ORM + PostgreSQL
- **Storage**: S3 (MinIO)
- **AI**: OpenAI (Whisper for transcription, GPT-4o-mini for generation)

## Commands

```bash
pnpm install
pnpm start:dev        # Development with hot reload
pnpm build            # Production build
pnpm type-check       # TypeScript check
pnpm db:push          # Push schema to database
pnpm db:studio        # Open Drizzle Studio
```

## Matrix Commands

| Command | Description |
|---------|-------------|
| `!new [Name]` | Create new project |
| `!projects` | List all projects |
| `!switch [ID]` | Switch to project |
| `!status` | Show project status |
| `!archive` | Archive current project |
| `!generate` | Generate blog post (casual) |
| `!generate [style]` | Generate with specific style |
| `!styles` | Show available styles |
| `!export` | Export last generation |

## Media Handling

- **Photos**: Saved to S3, stored in database
- **Voice**: Saved to S3, transcribed via Whisper
- **Text**: Stored directly in database

## Blog Styles

| Style | Description |
|-------|-------------|
| `casual` | Friendly, personal blog post |
| `technical` | Detailed technical report |
| `tutorial` | Step-by-step guide |
| `social` | Short social media post |
| `story` | Storytelling format |

## Environment Variables

```env
PORT=3313

# Matrix
MATRIX_HOMESERVER_URL=http://localhost:8008
MATRIX_ACCESS_TOKEN=syt_xxx
MATRIX_ALLOWED_USERS=@user:mana.how
MATRIX_STORAGE_PATH=./data/bot-storage.json

# Database
DATABASE_URL=postgresql://postgres:password@localhost:5432/project_doc_bot

# S3 Storage
S3_ENDPOINT=http://localhost:9000
S3_REGION=us-east-1
S3_ACCESS_KEY=minioadmin
S3_SECRET_KEY=minioadmin
S3_BUCKET=project-doc-bot

# OpenAI
OPENAI_API_KEY=sk-xxx
OPENAI_MODEL=gpt-4o-mini
OPENAI_WHISPER_MODEL=whisper-1
```

## Database Schema

```sql
-- projects table
CREATE TABLE projects (
  id UUID PRIMARY KEY,
  matrix_user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- project_items table
CREATE TABLE project_items (
  id UUID PRIMARY KEY,
  project_id UUID REFERENCES projects(id),
  type TEXT NOT NULL,  -- photo, voice, text
  content TEXT,
  media_url TEXT,
  media_mxc_url TEXT,
  duration INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);

-- generations table
CREATE TABLE generations (
  id UUID PRIMARY KEY,
  project_id UUID REFERENCES projects(id),
  style TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
```

## Health Check

```bash
curl http://localhost:3313/health
```
