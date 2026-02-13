# Gift Code System

User-generated gift codes for sharing credits across the Mana ecosystem.

## Overview

Users can create gift codes to share credits with others. The system supports various modes:

| Type | Description |
|------|-------------|
| `simple` | Single-use, one recipient |
| `personalized` | Restricted to specific email/Matrix ID |
| `split` | Divided into portions (e.g., 100 credits / 5 = 20 each) |
| `first_come` | First N users get full amount |
| `riddle` | Requires correct answer to redeem |

## API Endpoints

Base URL: `/api/v1/gifts`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/:code` | - | Get gift code info (public preview) |
| POST | `/` | JWT | Create new gift code |
| POST | `/:code/redeem` | JWT | Redeem a gift code |
| GET | `/me/created` | JWT | List codes you created |
| GET | `/me/received` | JWT | List gifts you received |
| DELETE | `/:id` | JWT | Cancel code & refund unclaimed |

## Usage Examples

### Create Gift Code

```bash
curl -X POST "https://auth.mana.how/api/v1/gifts" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "credits": 100,
    "message": "Happy Birthday!",
    "type": "simple"
  }'
```

**Response:**
```json
{
  "id": "uuid",
  "code": "ABC123",
  "url": "https://mana.how/g/ABC123",
  "totalCredits": 100,
  "creditsPerPortion": 100,
  "totalPortions": 1,
  "type": "simple",
  "expiresAt": "2026-05-14T00:00:00Z"
}
```

### Create Split Gift (5 portions)

```bash
curl -X POST "https://auth.mana.how/api/v1/gifts" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "credits": 100,
    "type": "split",
    "portions": 5,
    "message": "Share this with friends!"
  }'
```

Each recipient gets 20 credits (100 / 5).

### Create Riddle Gift

```bash
curl -X POST "https://auth.mana.how/api/v1/gifts" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "credits": 50,
    "type": "riddle",
    "riddleQuestion": "What is the capital of Germany?",
    "riddleAnswer": "Berlin"
  }'
```

### Get Gift Info (Public)

```bash
curl "https://auth.mana.how/api/v1/gifts/ABC123"
```

**Response:**
```json
{
  "code": "ABC123",
  "type": "simple",
  "status": "active",
  "creditsPerPortion": 100,
  "totalPortions": 1,
  "remainingPortions": 1,
  "message": "Happy Birthday!",
  "hasRiddle": false,
  "isPersonalized": false,
  "expiresAt": "2026-05-14T00:00:00Z",
  "creatorName": "John Doe"
}
```

### Redeem Gift Code

```bash
curl -X POST "https://auth.mana.how/api/v1/gifts/ABC123/redeem" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{}'
```

For riddle gifts, include the answer:
```bash
curl -X POST "https://auth.mana.how/api/v1/gifts/ABC123/redeem" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"answer": "Berlin"}'
```

**Response:**
```json
{
  "success": true,
  "creditsReceived": 100,
  "newBalance": 250,
  "message": "Happy Birthday!"
}
```

## Matrix Bot Commands

### German
```
!geschenk 50                    # Simple gift
!geschenk 100 /5                # Split into 5 portions
!geschenk 50 ?="Berlin"         # With riddle
!geschenk 50 "Viel Spass!"      # With message
!einloesen ABC123               # Redeem code
!einloesen ABC123 Berlin        # Redeem with riddle answer
!meine-geschenke                # List your gifts
```

### English
```
!gift 50
!gift 100 /5
!gift 50 ?="Berlin"
!redeem ABC123
!my-gifts
```

## Database Schema

### Tables

**gifts.gift_codes**
- `id` - UUID primary key
- `code` - Unique 6-char code (e.g., "ABC123")
- `short_url` - Full URL (e.g., "mana.how/g/ABC123")
- `creator_id` - FK to auth.users
- `total_credits` - Reserved amount
- `credits_per_portion` - Credits per redemption
- `total_portions` - Number of portions
- `claimed_portions` - Portions already redeemed
- `type` - simple|personalized|split|first_come|riddle
- `status` - active|depleted|expired|cancelled|refunded
- `target_email` - For personalized gifts
- `target_matrix_id` - For personalized gifts
- `riddle_question` - Question text
- `riddle_answer_hash` - bcrypt hash of answer
- `message` - Optional message
- `expires_at` - Expiration timestamp
- `reservation_transaction_id` - FK to credits.transactions

**gifts.gift_redemptions**
- `id` - UUID primary key
- `gift_code_id` - FK to gift_codes
- `redeemer_user_id` - FK to auth.users
- `status` - success|failed_wrong_answer|failed_wrong_user|...
- `credits_received` - Amount credited
- `portion_number` - Which portion was claimed
- `credit_transaction_id` - FK to credits.transactions
- `source_app_id` - 'matrix-bot', 'web', etc.

### Transaction Types

Credits schema includes gift-related transaction types:
- `gift_reserve` - Credits reserved when creating gift
- `gift_release` - Credits returned when cancelling gift
- `gift_receive` - Credits received when redeeming gift

## Integration Points

### Web Apps (SvelteKit)
```typescript
// Fetch gift info
const response = await fetch(`/api/v1/gifts/${code}`);
const giftInfo = await response.json();

// Redeem
const result = await fetch(`/api/v1/gifts/${code}/redeem`, {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${token}` },
  body: JSON.stringify({ answer: riddleAnswer })
});
```

### Matrix Bots
```typescript
import { GiftService } from '@manacore/bot-services';
import { handleGiftCommand } from '@manacore/matrix-bot-common';

// In bot command handler
if (isGiftCommand(command)) {
  return handleGiftCommand(this, roomId, userId, command, args);
}
```

### Mobile Apps (Expo)
Same REST API, use fetch or axios with JWT token.

## Security

- Gift codes use 6-char alphanumeric codes (no ambiguous chars)
- Riddle answers are bcrypt hashed
- Row-level locking prevents race conditions
- Credits are reserved atomically when creating gifts
- Personalized gifts verify email or Matrix ID

## Configuration

Environment variables:
```env
# Base URL for short links
APP_BASE_URL=https://mana.how
```

Gift code rules (hardcoded):
```typescript
const GIFT_CODE_RULES = {
  minCredits: 1,
  maxCredits: 10000,
  maxPortions: 100,
  maxMessageLength: 500,
  maxRiddleQuestionLength: 200,
  defaultExpirationDays: 90,
};
```
