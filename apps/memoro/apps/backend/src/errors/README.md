# Standardized Error Handling

This directory contains standardized error handling utilities for the memoro-service.

## InsufficientCreditsException

A custom exception class for handling insufficient credit scenarios with consistent error responses.

### Features

- **HTTP Status Code**: 402 Payment Required
- **Standardized Error Format**: Includes required credits, available credits, credit type, and operation details
- **Type Safety**: Strongly typed error data structure
- **Consistent Responses**: All insufficient credit errors follow the same format

### Usage

```typescript
import { InsufficientCreditsException } from '../errors/insufficient-credits.error';

// Throw when insufficient credits detected
throw new InsufficientCreditsException({
  requiredCredits: 100,
  availableCredits: 50,
  creditType: 'user', // or 'space'
  operation: 'transcription',
  spaceId: 'space-uuid' // optional
});
```

### Error Response Format

```json
{
  "statusCode": 402,
  "error": "InsufficientCredits",
  "message": "Insufficient user credits. Required: 100, Available: 50",
  "details": {
    "requiredCredits": 100,
    "availableCredits": 50,
    "creditType": "user",
    "operation": "transcription",
    "spaceId": null
  }
}
```

### Helper Functions

- `createInsufficientCreditsError()`: Factory function to create the exception
- `isInsufficientCreditsError()`: Type guard to check if an error is an insufficient credits error
- `extractCreditInfoFromError()`: Extract credit information from various error types

## Global Exception Filter

The `HttpExceptionFilter` in `/filters/http-exception.filter.ts` ensures all exceptions are properly formatted and InsufficientCreditsException returns the correct 402 status code.

## Migration Notes

All credit-consuming endpoints have been updated to use this standardized error handling:
- Transcription endpoints
- Question memo processing
- Memo combination
- All credit consumption operations

Legacy `ForbiddenException` and `BadRequestException` for insufficient credits have been replaced with `InsufficientCreditsException`.