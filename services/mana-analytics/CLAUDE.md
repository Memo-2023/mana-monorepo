# mana-analytics

Feedback and analytics service. Extracted from mana-core-auth.

## Port: 3064

## API Endpoints (JWT auth)

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/v1/feedback` | Submit feedback |
| GET | `/api/v1/feedback/public` | List public feedback |
| GET | `/api/v1/feedback/me` | My feedback |
| POST | `/api/v1/feedback/:id/vote` | Upvote |
| DELETE | `/api/v1/feedback/:id/vote` | Remove vote |
| DELETE | `/api/v1/feedback/:id` | Delete my feedback |

## Database: `mana_analytics`

Tables: user_feedback, feedback_votes

## Environment Variables

```env
PORT=3064
DATABASE_URL=postgresql://manacore:devpassword@localhost:5432/mana_analytics
MANA_AUTH_URL=http://localhost:3001
MANA_LLM_URL=http://localhost:3025
```
