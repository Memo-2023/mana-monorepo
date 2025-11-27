# Memoro API Documentation

This document provides information on how to use the Memoro API endpoints from the frontend application.

## Authentication

All endpoints require authentication. The frontend should include a valid JWT token in the Authorization header:

```
Authorization: Bearer <jwt-token>
```

## Spaces API

### Get All Memoro Spaces

Retrieves all spaces for the authenticated user that belong to the Memoro app.

**Request:**

```
GET /api/memoro/spaces
```

**Response:**

```json
{
	"spaces": [
		{
			"id": "606b60a8-505a-4044-857a-ad412d8bff33",
			"name": "My Memoro Space",
			"owner_id": "2c94b4c5-c73e-4e6f-8db0-bec797f37548",
			"app_id": "973da0c1-b479-4dac-a1b0-ed09c72caca8",
			"roles": {
				"members": {
					"2c94b4c5-c73e-4e6f-8db0-bec797f37548": {
						"role": "owner",
						"added_at": "2025-05-07T19:43:09Z",
						"added_by": "2c94b4c5-c73e-4e6f-8db0-bec797f37548"
					}
				}
			},
			"credits": 0,
			"created_at": "2025-05-07T19:43:09Z",
			"updated_at": "2025-05-07T19:43:09Z",
			"memo_count": 5
		}
	]
}
```

### Get Memoro Space Details

Retrieves detailed information about a specific Memoro space.

**Request:**

```
GET /api/memoro/spaces/:spaceId
```

**Response:**

```json
{
	"space": {
		"id": "606b60a8-505a-4044-857a-ad412d8bff33",
		"name": "My Memoro Space",
		"credits": 0,
		"owner_id": "2c94b4c5-c73e-4e6f-8db0-bec797f37548",
		"app_id": "973da0c1-b479-4dac-a1b0-ed09c72caca8",
		"roles": {
			"members": {
				"2c94b4c5-c73e-4e6f-8db0-bec797f37548": {
					"role": "owner",
					"added_at": "2025-05-07T19:43:09Z",
					"added_by": "2c94b4c5-c73e-4e6f-8db0-bec797f37548"
				}
			}
		},
		"created_at": "2025-05-07T19:43:09Z",
		"updated_at": "2025-05-07T19:43:09Z",
		"apps": {
			"name": "Memoro",
			"slug": "memoro"
		}
	},
	"creditSummary": {
		// Credit usage summary information
	},
	"recentTransactions": [
		// Recent credit transactions
	]
}
```

### Create a Memoro Space

Creates a new space within the Memoro app.

**Request:**

```
POST /api/memoro/spaces
Content-Type: application/json

{
  "name": "New Memoro Space"
}
```

**Response:**

```json
{
	"success": true,
	"message": "Memoro space created successfully",
	"spaceId": "606b60a8-505a-4044-857a-ad412d8bff33"
}
```

## Memo Space Relationships

### Get All Memos for a Space

Retrieves all memos that belong to a specific Memoro space.

**Request:**

```
GET /api/memoro/spaces/:spaceId/memos
```

**Response:**

```json
{
	"memos": [
		{
			"id": "8f7ec3d1-5591-4a5c-9bdc-32c8c6a10a3a",
			"title": "My First Memo",
			"user_id": "2c94b4c5-c73e-4e6f-8db0-bec797f37548",
			"source": {},
			"style": {},
			"is_pinned": false,
			"is_archived": false,
			"is_public": false,
			"metadata": {},
			"created_at": "2025-05-07T20:15:23Z",
			"updated_at": "2025-05-07T20:15:23Z"
		},
		{
			"id": "a1b2c3d4-e5f6-4a5c-9bdc-32c8c6a10a3a",
			"title": "Another Memo",
			"user_id": "2c94b4c5-c73e-4e6f-8db0-bec797f37548",
			"source": {},
			"style": {},
			"is_pinned": true,
			"is_archived": false,
			"is_public": false,
			"metadata": {},
			"created_at": "2025-05-08T10:30:15Z",
			"updated_at": "2025-05-08T10:30:15Z"
		}
	]
}
```

### Link a Memo to a Space

Associates a memo with a Memoro space.

**Request:**

```
POST /api/memoro/spaces/memos/link
Content-Type: application/json

{
  "memoId": "8f7ec3d1-5591-4a5c-9bdc-32c8c6a10a3a",
  "spaceId": "606b60a8-505a-4044-857a-ad412d8bff33"
}
```

**Response:**

```json
{
	"success": true,
	"message": "Memo linked to space successfully"
}
```

### Unlink a Memo from a Space

Removes the association between a memo and a Memoro space.

**Request:**

```
DELETE /api/memoro/spaces/memos/unlink
Content-Type: application/json

{
  "memoId": "8f7ec3d1-5591-4a5c-9bdc-32c8c6a10a3a",
  "spaceId": "606b60a8-505a-4044-857a-ad412d8bff33"
}
```

**Response:**

```json
{
	"success": true,
	"message": "Memo unlinked from space successfully"
}
```

## Error Handling

All endpoints return appropriate HTTP status codes:

- `200 OK`: Request succeeded
- `400 Bad Request`: Invalid input (missing fields, invalid data)
- `401 Unauthorized`: Missing or invalid authentication
- `403 Forbidden`: User does not have permission to access the resource
- `404 Not Found`: Resource not found
- `500 Internal Server Error`: Server-side error

Error responses include a message explaining the issue:

```json
{
	"statusCode": 400,
	"message": "Memo ID and Space ID are required",
	"error": "Bad Request"
}
```

## Frontend Integration Example

Here's an example of how to call these endpoints from a frontend application using fetch:

```javascript
// Get all Memoro spaces
async function getMemoroSpaces() {
	const response = await fetch('/api/memoro/spaces', {
		method: 'GET',
		headers: {
			Authorization: `Bearer ${userToken}`,
			'Content-Type': 'application/json',
		},
	});

	if (!response.ok) {
		const error = await response.json();
		throw new Error(error.message || 'Failed to fetch spaces');
	}

	return await response.json();
}

// Get all memos for a specific space
async function getSpaceMemos(spaceId) {
	const response = await fetch(`/api/memoro/spaces/${spaceId}/memos`, {
		method: 'GET',
		headers: {
			Authorization: `Bearer ${userToken}`,
			'Content-Type': 'application/json',
		},
	});

	if (!response.ok) {
		const error = await response.json();
		throw new Error(error.message || 'Failed to fetch space memos');
	}

	return await response.json();
}

// Link a memo to a space
async function linkMemoToSpace(memoId, spaceId) {
	const response = await fetch('/api/memoro/spaces/memos/link', {
		method: 'POST',
		headers: {
			Authorization: `Bearer ${userToken}`,
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({ memoId, spaceId }),
	});

	if (!response.ok) {
		const error = await response.json();
		throw new Error(error.message || 'Failed to link memo to space');
	}

	return await response.json();
}

// Unlink a memo from a space
async function unlinkMemoFromSpace(memoId, spaceId) {
	const response = await fetch('/api/memoro/spaces/memos/unlink', {
		method: 'DELETE',
		headers: {
			Authorization: `Bearer ${userToken}`,
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({ memoId, spaceId }),
	});

	if (!response.ok) {
		const error = await response.json();
		throw new Error(error.message || 'Failed to unlink memo from space');
	}

	return await response.json();
}
```
