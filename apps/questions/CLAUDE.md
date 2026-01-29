# Questions App

AI-powered research assistant that collects user questions and performs comprehensive research using the mana-search microservice.

## Overview

- **Backend Port**: 3011
- **Web Port**: 5111
- **Technology**: NestJS + Drizzle ORM + PostgreSQL + SvelteKit
- **Search**: mana-search microservice (SearXNG)

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Questions App                             │
│   Collections │ Questions │ Research │ Answers │ Sources    │
└─────────────────────────┬───────────────────────────────────┘
                          ▼
┌─────────────────────────────────────────────────────────────┐
│              mana-search (Port 3021)                         │
│   Search API │ Extract API │ Redis Cache                    │
└─────────────────────────┬───────────────────────────────────┘
                          ▼
┌─────────────────────────────────────────────────────────────┐
│              SearXNG (Port 8080)                             │
│   Google │ Bing │ arXiv │ Wikipedia │ GitHub │ ...          │
└─────────────────────────────────────────────────────────────┘
```

## Quick Start

```bash
# 1. Start infrastructure (PostgreSQL, Redis, mana-search dependencies)
pnpm docker:up

# 2. Start everything (auth, search, backend, web):
pnpm dev:questions:full

# Or start components individually:
pnpm dev:questions:backend  # Just backend (port 3011)
pnpm dev:questions:web      # Just web (port 5111)
pnpm dev:search:full        # Just search service (port 3021)
```

## Web App

The SvelteKit web app provides:

- **Question Management**: Create, edit, and organize questions
- **Collection Organization**: Group questions into collections with colors/icons
- **Research Interface**: Start research and view results with sources
- **Source Viewer**: Explore extracted content from web sources
- **Dark Mode**: Full theme support

## API Endpoints

### Collections

```bash
POST   /api/v1/collections          # Create collection
GET    /api/v1/collections          # List collections
GET    /api/v1/collections/:id      # Get collection
PUT    /api/v1/collections/:id      # Update collection
DELETE /api/v1/collections/:id      # Delete collection
POST   /api/v1/collections/reorder  # Reorder collections
```

### Questions

```bash
POST   /api/v1/questions            # Create question
GET    /api/v1/questions            # List questions (with filters)
GET    /api/v1/questions/:id        # Get question
PUT    /api/v1/questions/:id        # Update question
DELETE /api/v1/questions/:id        # Delete question
PUT    /api/v1/questions/:id/status # Update status
```

### Research

```bash
POST   /api/v1/research/start               # Start research
GET    /api/v1/research/question/:id        # Get results for question
GET    /api/v1/research/:id                 # Get research result
GET    /api/v1/research/health/search       # Check search service
```

### Answers

```bash
POST   /api/v1/answers                      # Create answer
GET    /api/v1/answers/question/:id         # List answers for question
GET    /api/v1/answers/question/:id/accepted # Get accepted answer
GET    /api/v1/answers/:id                  # Get answer
PUT    /api/v1/answers/:id                  # Update answer
POST   /api/v1/answers/:id/rate             # Rate answer
POST   /api/v1/answers/:id/accept           # Accept answer
DELETE /api/v1/answers/:id                  # Delete answer
```

### Sources

```bash
GET    /api/v1/sources/research/:id  # Sources by research result
GET    /api/v1/sources/question/:id  # All sources for question
GET    /api/v1/sources/:id           # Get source
GET    /api/v1/sources/:id/content   # Get source content
```

## Research Depths

| Depth | Sources | Extraction | Categories |
|-------|---------|------------|------------|
| `quick` | 5 | No | general |
| `standard` | 15 | Yes | general, news |
| `deep` | 30 | Yes | general, news, science, it |

## Database Schema

```sql
-- Collections for organizing questions
collections (id, user_id, name, description, color, icon, sort_order, ...)

-- User questions
questions (id, user_id, collection_id, title, description, status, priority, tags, ...)

-- Research results from mana-search
research_results (id, question_id, summary, key_points, follow_up_questions, ...)

-- Extracted sources from search
sources (id, research_result_id, url, title, snippet, extracted_content, ...)

-- AI-generated answers
answers (id, question_id, research_result_id, content, rating, is_accepted, ...)
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | 3011 | Backend port |
| `DATABASE_URL` | - | PostgreSQL connection |
| `MANA_CORE_AUTH_URL` | http://localhost:3001 | Auth service URL |
| `MANA_SEARCH_URL` | http://localhost:3021 | Search service URL |
| `MANA_SEARCH_TIMEOUT` | 30000 | Search timeout (ms) |
| `DEV_BYPASS_AUTH` | false | Skip auth in dev |
| `DEV_USER_ID` | - | User ID when auth bypassed |

## Development Commands

```bash
# Backend only
pnpm dev:questions:backend

# Type checking
cd apps/questions/apps/backend && pnpm type-check

# Database
cd apps/questions/apps/backend
pnpm drizzle-kit generate  # Generate migrations
pnpm drizzle-kit push      # Push schema to DB
pnpm drizzle-kit studio    # Open Drizzle Studio
```

## Testing the API

```bash
# Create a collection
curl -X POST http://localhost:3011/api/v1/collections \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"name": "Tech Research", "color": "#6366f1"}'

# Create a question
curl -X POST http://localhost:3011/api/v1/questions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"title": "What are the best practices for TypeScript?", "researchDepth": "standard"}'

# Start research
curl -X POST http://localhost:3011/api/v1/research/start \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"questionId": "uuid-here", "depth": "standard"}'
```
