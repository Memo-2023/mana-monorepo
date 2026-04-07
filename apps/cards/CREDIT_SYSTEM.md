# Cards Credit System

This document explains how the Mana credit system is integrated into Cards.

## Overview

Cards uses **Mana** as its credit currency to charge for operations like deck creation, card generation, and AI features. The credit system is powered by [Mana](https://github.com/Memo-2023/mana-core-nestjs-package), which provides:

- Credit validation before operations
- Credit consumption after successful operations
- Real-time balance tracking
- Transaction history
- App-level usage tracking

## Credit Costs

| Operation | Cost (Mana) | Description |
|-----------|-------------|-------------|
| Deck Creation | 10 | Create a new deck |
| Card Creation | 2 | Add a single card to a deck |
| AI Card Generation | 5 | Generate a card using AI |
| Deck Export | 3 | Export a deck to various formats |

These costs are defined in `backend/src/config/credit-operations.ts`.

## Architecture

```
┌─────────────┐
│   Frontend  │
│ (React Native)
└─────┬───────┘
      │ 1. Create Deck Request
      │    POST /api/decks
      │    { name, description }
      ▼
┌─────────────┐
│   Backend   │
│   (NestJS)  │
├─────────────┤
│ API         │  2. Validate Credits (10 mana)
│ Controller  │     ├─ Has credits? → Continue
│             │     └─ No credits? → Return 400
│             │
│             │  3. Create Deck (business logic)
│             │
│             │  4. Consume Credits (10 mana)
│             │
│             │  5. Return Success + Credits Used
└─────┬───────┘
      │
      ▼
┌─────────────┐
│  Mana  │  - Validate balance
│   Service   │  - Deduct credits
│             │  - Record transaction
└─────────────┘
```

## Backend Integration

### 1. Service Key Configuration

The backend needs a service key from Mana to perform credit operations.

**backend/.env**:
```env
SERVICE_KEY=your-service-key-from-mana-core
```

**backend/src/app.module.ts**:
```typescript
ManaModule.forRootAsync({
  imports: [ConfigModule],
  useFactory: (configService: ConfigService) => ({
    serviceKey: configService.get<string>('SERVICE_KEY', ''),
    // ... other config
  }),
  inject: [ConfigService],
})
```

### 2. Credit Operations

**backend/src/config/credit-operations.ts**:
```typescript
export enum CreditOperationType {
  DECK_CREATION = 'deck_creation',
  CARD_CREATION = 'card_creation',
  // Add more as needed
}

export const CREDIT_COSTS: Record<CreditOperationType, number> = {
  [CreditOperationType.DECK_CREATION]: 10,
  [CreditOperationType.CARD_CREATION]: 2,
};
```

### 3. Controller Implementation

**backend/src/controllers/api.controller.ts**:
```typescript
import { CreditClientService } from '@mana-core/nestjs-integration/services';
import { CreditOperationType, getCreditCost } from '../config/credit-operations';

@Controller('api')
@UseGuards(AuthGuard)
export class ApiController {
  constructor(private readonly creditClient: CreditClientService) {}

  @Post('decks')
  async createDeck(@CurrentUser() user: any, @Body() deckData: any) {
    const operationType = CreditOperationType.DECK_CREATION;
    const creditCost = getCreditCost(operationType);

    // 1. Validate credits BEFORE operation
    const validation = await this.creditClient.validateCredits(
      user.id,
      operationType,
      creditCost,
    );

    if (!validation.hasCredits) {
      throw new BadRequestException({
        error: 'insufficient_credits',
        message: `Insufficient mana. Required: ${creditCost}, Available: ${validation.availableCredits}`,
        requiredCredits: creditCost,
        availableCredits: validation.availableCredits,
      });
    }

    // 2. Perform the operation
    const newDeck = await this.createDeckInDatabase(deckData);

    // 3. Consume credits AFTER success
    await this.creditClient.consumeCredits(
      user.id,
      operationType,
      creditCost,
      `Created deck: ${deckData.name}`,
      { deckId: newDeck.id },
    );

    return { success: true, deck: newDeck, creditsUsed: creditCost };
  }
}
```

### 4. Credit Balance Endpoint

Get user's current credit balance:

```typescript
@Get('credits/balance')
async getCreditBalance(@CurrentUser() user: any) {
  const balance = await this.creditClient.getCreditBalance(user.id);
  return {
    userId: user.id,
    balance: balance.balance || 0,
    currency: 'mana',
  };
}
```

## Frontend Integration

### 1. Types

**apps/mobile/types/credits.ts**:
```typescript
export interface InsufficientCreditsError {
  error: 'insufficient_credits';
  message: string;
  requiredCredits: number;
  availableCredits: number;
  operation?: string;
}

export function isInsufficientCreditsError(error: any): boolean {
  return error && error.error === 'insufficient_credits';
}
```

### 2. Credit Service

**apps/mobile/services/creditService.ts**:
```typescript
export const creditService = {
  async getBalance(): Promise<number> {
    const response = await get(`${API_URL}/api/credits/balance`);
    return response.balance || 0;
  },
};
```

### 3. Insufficient Credits Modal

**apps/mobile/components/InsufficientCreditsModal.tsx**:

A pre-built modal component that displays:
- Required vs available credits
- Shortfall amount
- "Get More Mana" button (optional)
- Cancel button

### 4. Hook for Easy Integration

**apps/mobile/hooks/useInsufficientCredits.ts**:
```typescript
export function useInsufficientCredits() {
  // ... state management

  return {
    visible,
    requiredCredits,
    availableCredits,
    operation,
    handleCreditError, // Automatically shows modal for credit errors
    hideInsufficientCredits,
  };
}
```

### 5. Usage Example

**In any screen that creates a deck**:
```typescript
import { useInsufficientCredits } from '../hooks/useInsufficientCredits';
import { InsufficientCreditsModal } from '../components/InsufficientCreditsModal';
import { creditService } from '../services/creditService';

function DeckCreationScreen() {
  const [creditBalance, setCreditBalance] = useState(0);
  const insufficientCredits = useInsufficientCredits();

  // Load balance
  useEffect(() => {
    creditService.getBalance().then(setCreditBalance);
  }, []);

  const handleCreateDeck = async () => {
    try {
      const response = await post('/api/decks', deckData);
      Alert.alert('Success', `Deck created! ${response.creditsUsed} mana used.`);

      // Refresh balance
      const newBalance = await creditService.getBalance();
      setCreditBalance(newBalance);
    } catch (error) {
      // Automatically shows modal if it's a credit error
      if (!insufficientCredits.handleCreditError(error)) {
        // Handle other errors
        Alert.alert('Error', error.message);
      }
    }
  };

  return (
    <View>
      {/* Show balance */}
      <Text>Your Mana: {creditBalance} ⚡</Text>

      {/* Create deck button */}
      <Button title="Create Deck (10 mana)" onPress={handleCreateDeck} />

      {/* Insufficient credits modal */}
      <InsufficientCreditsModal
        visible={insufficientCredits.visible}
        requiredCredits={insufficientCredits.requiredCredits}
        availableCredits={insufficientCredits.availableCredits}
        operation={insufficientCredits.operation}
        onClose={insufficientCredits.hideInsufficientCredits}
        onPurchase={() => {/* Navigate to purchase */}}
      />
    </View>
  );
}
```

## Error Handling

### Backend Error Response

When a user has insufficient credits:

```json
{
  "error": "insufficient_credits",
  "message": "Insufficient mana. Required: 10, Available: 5",
  "requiredCredits": 10,
  "availableCredits": 5,
  "operation": "Create a new deck"
}
```

Status code: **400 Bad Request**

### Frontend Error Handling

The `useInsufficientCredits` hook automatically detects credit errors:

```typescript
const insufficientCredits = useInsufficientCredits();

try {
  await createDeck();
} catch (error) {
  // Returns true if it was a credit error (modal shown automatically)
  const wasCreditError = insufficientCredits.handleCreditError(error);

  if (!wasCreditError) {
    // Handle other errors
    Alert.alert('Error', error.message);
  }
}
```

## Testing

### Manual Testing Steps

1. **Check credit balance**:
   ```bash
   curl -H "Authorization: Bearer $TOKEN" \
     https://cards-backend-111768794939.europe-west3.run.app/api/credits/balance
   ```

2. **Create deck with sufficient credits**:
   ```bash
   curl -X POST \
     -H "Authorization: Bearer $TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"name":"Test Deck","description":"Testing"}' \
     https://cards-backend-111768794939.europe-west3.run.app/api/decks
   ```

3. **Create deck with insufficient credits**:
   - Repeat step 2 until balance is < 10
   - Should return 400 with `insufficient_credits` error

### Unit Testing

Mock the `CreditClientService` in tests:

```typescript
{
  provide: CreditClientService,
  useValue: {
    validateCredits: jest.fn().mockResolvedValue({
      hasCredits: true,
      availableCredits: 100,
    }),
    consumeCredits: jest.fn().mockResolvedValue({
      success: true,
      transactionId: 'txn_123',
    }),
  },
}
```

## Best Practices

### ✅ DO

1. **Always validate BEFORE the operation**
   ```typescript
   const validation = await creditClient.validateCredits(...);
   if (!validation.hasCredits) throw error;

   // Then do the operation
   const result = await performOperation();

   // Then consume
   await creditClient.consumeCredits(...);
   ```

2. **Consume AFTER success**
   - Only consume credits if the operation succeeds
   - This prevents charging users for failed operations

3. **Include metadata in consumption**
   ```typescript
   await creditClient.consumeCredits(
     userId,
     operationType,
     cost,
     'Human-readable description',
     { deckId, deckName } // Useful for audit logs
   );
   ```

4. **Refresh balance after operations**
   - Show users their updated balance
   - Prevents confusion about remaining credits

### ❌ DON'T

1. **Don't consume without validation**
   ```typescript
   // BAD: What if they don't have credits?
   await performOperation();
   await creditClient.consumeCredits(...);
   ```

2. **Don't consume before the operation**
   ```typescript
   // BAD: They'll be charged even if operation fails
   await creditClient.consumeCredits(...);
   await performOperation();
   ```

3. **Don't hardcode credit costs**
   ```typescript
   // BAD
   const cost = 10;

   // GOOD
   const cost = getCreditCost(CreditOperationType.DECK_CREATION);
   ```

## Adding New Billable Operations

To add a new operation (e.g., "AI Card Description"):

### 1. Backend

**backend/src/config/credit-operations.ts**:
```typescript
export enum CreditOperationType {
  // ... existing
  AI_CARD_DESCRIPTION = 'ai_card_description',
}

export const CREDIT_COSTS: Record<CreditOperationType, number> = {
  // ... existing
  [CreditOperationType.AI_CARD_DESCRIPTION]: 3,
};
```

### 2. Controller

```typescript
@Post('cards/:id/generate-description')
async generateDescription(@CurrentUser() user: any, @Param('id') cardId: string) {
  const operationType = CreditOperationType.AI_CARD_DESCRIPTION;
  const cost = getCreditCost(operationType);

  // Validate
  const validation = await this.creditClient.validateCredits(user.id, operationType, cost);
  if (!validation.hasCredits) throw insufficientCreditsError;

  // Perform
  const description = await this.aiService.generateDescription(cardId);

  // Consume
  await this.creditClient.consumeCredits(
    user.id,
    operationType,
    cost,
    `Generated description for card ${cardId}`,
    { cardId, description: description.substring(0, 50) }
  );

  return { description, creditsUsed: cost };
}
```

### 3. Frontend

Use the same pattern as deck creation - the modal and hooks work for all operations automatically!

## Troubleshooting

### "Service key not configured" error

**Problem**: Credits operations fail with authentication error.

**Solution**: Add `SERVICE_KEY` to your `.env` file:
```env
SERVICE_KEY=your-actual-service-key-from-mana-core
```

### Credits not being deducted

**Problem**: Operations succeed but credits don't decrease.

**Check**:
1. Is `consumeCredits()` being called?
2. Is it being called AFTER the operation succeeds?
3. Check backend logs for errors

### Frontend not showing insufficient credits modal

**Problem**: Users get an error but modal doesn't appear.

**Check**:
1. Is `useInsufficientCredits` hook being used?
2. Is `handleCreditError()` being called in the catch block?
3. Is `InsufficientCreditsModal` component rendered with hook props?

## Resources

- [Mana Documentation](https://docs.mana-core.com)
- [Mana NestJS Package](https://github.com/Memo-2023/mana-core-nestjs-package)
- [Integration Guide](./MANA_CORE_INTEGRATION_GUIDE.md)
- [Example Implementation](./apps/mobile/examples/DeckCreationExample.tsx)
