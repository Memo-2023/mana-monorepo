# Update Story Page Text API

## Endpoint

```
PATCH /story/:id/pages/:pageNumber
```

## Description

Allows authenticated users to update the text content of a specific page within their story. The endpoint supports updating both English and German text while preserving other page properties like illustrations and images.

## Authentication

Requires valid JWT token via `@UseGuards(AuthGuard)`.

## Authorization

- User must own the story to update it
- Returns `403 Forbidden` if attempting to update another user's story
- Returns `404 Not Found` if story doesn't exist

## Request Parameters

### URL Parameters

- `id` (string, required): The UUID of the story
- `pageNumber` (number, required): The page number to update (1-indexed)

### Request Body

```typescript
{
  pageNumber: number;        // Must match URL parameter
  storyText?: string;        // Optional: New English text
  storyTextGerman?: string;  // Optional: New German text
}
```

**Note:** At least one of `storyText` or `storyTextGerman` should be provided.

## Example Request

```bash
curl -X PATCH \
  http://localhost:3002/story/abc-123-def-456/pages/2 \
  -H 'Authorization: Bearer YOUR_JWT_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "pageNumber": 2,
    "storyTextGerman": "Es war einmal ein kleiner Hase, der durch den Wald hüpfte."
  }'
```

## Success Response

**Code:** `200 OK`

```json
{
  "data": {
    "id": "abc-123-def-456",
    "title": "Der kleine Hase",
    "pages_data": [
      {
        "page_number": 1,
        "story_text": "Once upon a time...",
        "illustration_description": "A forest scene",
        "image_url": "https://...",
        "blur_hash": "..."
      },
      {
        "page_number": 2,
        "story_text": "Es war einmal ein kleiner Hase, der durch den Wald hüpfte.",
        "illustration_description": "A bunny hopping",
        "image_url": "https://...",
        "blur_hash": "..."
      }
      // ... more pages
    ],
    "updated_at": "2025-01-15T10:30:00.000Z"
  },
  "message": "Page 2 updated successfully"
}
```

## Error Responses

### Story Not Found
**Code:** `404 NOT FOUND`
```json
{
  "statusCode": 404,
  "message": "Story not found",
  "error": "Not Found"
}
```

### Permission Denied
**Code:** `403 FORBIDDEN`
```json
{
  "statusCode": 403,
  "message": "You do not have permission to edit this story",
  "error": "Forbidden"
}
```

### Page Not Found
**Code:** `400 BAD REQUEST`
```json
{
  "statusCode": 400,
  "message": "Page 99 not found",
  "error": "Bad Request"
}
```

### Page Number Mismatch
**Code:** `400 BAD REQUEST`
```json
{
  "statusCode": 400,
  "message": "Page number in URL does not match page number in request body",
  "error": "Bad Request"
}
```

### Invalid Story Data
**Code:** `400 BAD REQUEST`
```json
{
  "statusCode": 400,
  "message": "Story has no pages to update",
  "error": "Bad Request"
}
```

## Implementation Details

### Data Flow

1. **Authorization Check**: Verifies user owns the story via RLS
2. **Validation**: Ensures page number is valid and exists
3. **Update Logic**: Updates only the specified page's text fields
4. **Database Update**: Saves updated `pages_data` JSONB field
5. **Response**: Returns updated story with new timestamp

### Field Behavior

- If only `storyText` is provided: Updates only English text
- If only `storyTextGerman` is provided: Updates only German text
- If both are provided: German text takes precedence (overwrites)
- Other fields (image_url, illustration_description, blur_hash, page_number) remain unchanged

### Immutability

The service creates a new pages array rather than mutating the original, ensuring data integrity.

## Code Files

- **Controller**: `/backend/src/story/story.controller.ts` - `updateStoryPageText` method
- **Service**: `/backend/src/story/story.service.ts` - `updateStoryPageText` method
- **DTO**: `/backend/src/story/dto/update-story-page.dto.ts` - Validation schemas
- **Tests**: `/backend/src/story/test/update-story-page.spec.ts` - Unit tests

## Related Endpoints

- `GET /story/:id` - Get story by ID
- `PUT /story/:id` - Update entire story
- `DELETE /story/:id` - Delete story
- `POST /story` - Create new story
