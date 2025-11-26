# Spaces Feature Documentation

## Overview

Spaces in Memoro allow users to organize their memories and memos into logical containers. This feature provides a way to categorize content, manage access, and facilitate organization of user data.

## Architecture

The Spaces feature uses a centralized approach for data management with fast local access:

1. **Express Backend API**: Serves as the source of truth for space management
2. **Memoro App (Client)**: Interfaces with the Express Backend API
3. **Supabase Database**: Used by both the Express Backend and the app for data storage and retrieval

This architecture allows the app to perform operations through the Express Backend API, which then directly updates the Supabase database. This ensures a single source of truth while still enabling fast data access.

## Implementation Details

### Database Schema

In Memoro's local Supabase database:

```sql
-- Spaces table
CREATE TABLE public.spaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  color TEXT DEFAULT '#4CAF50',
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Junction table linking memos to spaces
CREATE TABLE public.memo_spaces (
  memo_id UUID NOT NULL REFERENCES public.memos(id) ON DELETE CASCADE,
  space_id UUID NOT NULL REFERENCES public.spaces(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (memo_id, space_id)
);
```

The schema includes foreign key constraints to ensure referential integrity between the spaces, memos, and user tables.

### API Integration

The app integrates with the Memoro API:

1. **API Endpoints**:
   - `GET /api/memoro/spaces` - List all spaces for the authenticated user
   - `GET /api/memoro/spaces/:id` - Get space details
   - `POST /api/memoro/spaces` - Create a new space
   - `PUT /api/memoro/spaces/:id` - Update a space
   - `DELETE /api/memoro/spaces/:id` - Delete a space
   - `GET /api/memoro/spaces/:spaceId/memos` - Get all memos for a specific space
   - `POST /api/memoro/spaces/memos/link` - Link a memo to a space
   - `DELETE /api/memoro/spaces/memos/unlink` - Unlink a memo from a space

### Space-Memo Relationship

Spaces can contain multiple memos, and memos can belong to multiple spaces. This is a many-to-many relationship implemented through the `memo_spaces` junction table. The API provides specific endpoints to manage these relationships:

- **Retrieving memos in a space**: Using `GET /api/memoro/spaces/:spaceId/memos`
- **Linking a memo to a space**: Using `POST /api/memoro/spaces/memos/link`
- **Unlinking a memo from a space**: Using `DELETE /api/memoro/spaces/memos/unlink`

### Data Structures

The Space interface reflects the updated API response structure:

```typescript
export interface Space {
  id: string;
  name: string;
  description?: string;
  memoCount?: number;
  isDefault?: boolean;
  color?: string;
  created_at?: string;
  updated_at?: string;
  owner_id?: string;
  app_id?: string;
  credits?: number;
  roles?: {
    members: {
      [userId: string]: {
        role: string;
        added_at: string;
        added_by: string;
      };
    };
  };
  apps?: {
    name: string;
    slug: string;
  };
}
```

And the Memo interface for space-specific memos:

```typescript
export interface Memo {
  id: string;
  title: string;
  user_id: string;
  source?: any;
  style?: any;
  is_pinned?: boolean;
  is_archived?: boolean;
  is_public?: boolean;
  metadata?: any;
  created_at?: string;
  updated_at?: string;
}
```

### Authentication

Custom JWT-based authentication is used throughout:

1. User authenticates with the Memoro middleware (mana-core)
2. JWT token contains a `sub` claim with the user ID
3. This token is used for all API requests
4. All API endpoints require a valid JWT token

### Client Implementation

The app uses:
- `spaceService.ts`: Service for space operations, including memo management
- `useSpaces.ts`: Hook for React components
- `SpaceContext.tsx`: Context provider for the app
- `SpacesScreen.tsx`: Main UI for space management
- `[id].tsx`: Space detail view showing space info and all associated memos

## User Interface

The Spaces UI includes:

### Spaces List Screen
- List of spaces with customizable colors
- Create/edit/delete functionality
- Space selection for filtering memos
- Visual indication of the active space

### Space Detail Screen
- Shows space details (name, description, color, etc.)
- Displays all memos associated with the space
- Supports adding new memos to the space
- Handles error cases gracefully with retry mechanisms

## Error Handling

The system handles several error cases:
- Network failures during API requests
- Authentication errors
- Permission issues
- Database constraints

Error handling improvements:
- Error messages are properly displayed in the UI
- Retry mechanisms for failed requests
- Cleanup functions to prevent memory leaks and state updates after component unmount
- Mock data support for development/testing

### Error Handling Example

The Space detail view implements robust error handling:

```typescript
// Error handling for memo loading
useEffect(() => {
  // Create a flag to prevent state updates after unmount
  let isMounted = true;
  
  const fetchSpaceMemos = async () => {
    if (!id) return;

    try {
      setLoadingMemos(true);
      setMemosError(null);
      
      // Fetch memos for this space
      const memos = await spaceContext.getSpaceMemos(id);
      
      // Only update state if component is still mounted
      if (isMounted) {
        setSpaceMemos(memos);
      }
      
    } catch (err) {
      console.error('Error fetching space memos:', err);
      
      // Only update state if component is still mounted
      if (isMounted) {
        setMemosError('Failed to load memos for this space');
      }
    } finally {
      // Only update state if component is still mounted
      if (isMounted) {
        setLoadingMemos(false);
      }
    }
  };

  fetchSpaceMemos();
  
  // Cleanup function to prevent state updates after unmount
  return () => {
    isMounted = false;
  };
}, [id]);
```

UI for error states:
```jsx
{loadingMemos ? (
  <LoadingIndicator />
) : memosError ? (
  <ErrorView 
    message={memosError}
    onRetry={() => {
      setLoadingMemos(true);
      setMemosError(null);
      // Re-render triggers the useEffect again
    }}
  />
) : (
  <MemoList memos={spaceMemos} spaceId={id} />
)}
```

## Development and Testing Support

The implementation includes development aids:

```typescript
// Mock data support for development
async getSpaceMemos(spaceId: string): Promise<Memo[]> {
  // For development/testing, use mock data if API is not available
  const USE_MOCK_DATA = process.env.EXPO_PUBLIC_USE_MOCK_DATA === 'true';
  
  if (USE_MOCK_DATA) {
    console.debug('Using mock data for space memos');
    return [];
  }
  
  // Regular API call implementation
  // ...
}
```

## Navigation

Navigation between spaces-related screens:
- From spaces list to space detail view via `router.push(`/(protected)/(space)/${spaceId}`)`
- Add memo to space via navigation to memo creation with space ID in params
- Back to spaces list via built-in back navigation

## Future Enhancements

Potential improvements for the spaces feature:
1. **Offline Support**: Caching space data for offline use
2. **Batch Operations**: Moving multiple memos between spaces
3. **Advanced Filtering**: Filter memos by multiple spaces or other criteria
4. **Space Sharing**: Allowing users to share spaces with other users
5. **Nested Spaces**: Implementing hierarchical space organization

## Maintenance and Troubleshooting

Common issues and solutions:

1. **API Communication Errors**: Check console logs for detailed error messages
2. **Authentication Issues**: Verify JWT token format and claims
3. **Performance Concerns**: Monitor API call performance
4. **Mock Data**: Use `EXPO_PUBLIC_USE_MOCK_DATA=true` for testing without API