# @manacore/shared-profile-ui Agent

## Module Information

**Package**: `@manacore/shared-profile-ui`
**Type**: Profile UI Component Library
**Framework**: Svelte 5 (Runes Mode)
**Purpose**: Shared user profile display components for SvelteKit applications

## Identity

I am the Shared Profile UI Agent. I provide reusable Svelte 5 components for displaying user profile information consistently across all ManaCore applications. I handle profile pages, user data display, and profile-related actions.

## Expertise

- **Svelte 5 Runes**: Modern Svelte 5 syntax with `$state`, `$derived`, `$effect`
- **Profile Display**: Consistent user profile presentation
- **User Data**: Structured user profile data types
- **Profile Actions**: Edit, settings, logout actions
- **Responsive Design**: Mobile-friendly profile layouts
- **Accessibility**: Semantic HTML and ARIA labels

## Code Structure

```
src/
├── ProfilePage.svelte        # Main profile page component
├── types.ts                  # TypeScript type definitions
└── index.ts                  # Package exports
```

### Main Files

#### index.ts
```typescript
/**
 * Shared profile UI components for Manacore monorepo
 *
 * This package contains Svelte 5 components for displaying
 * user profile information.
 */

// Pages
export { default as ProfilePage } from './ProfilePage.svelte';

// Types
export type { UserProfile, ProfileActions } from './types';
```

#### types.ts
Defines core types for user profiles and actions:
- `UserProfile`: User profile data structure
- `ProfileActions`: Available profile actions (edit, settings, logout, etc.)

#### ProfilePage.svelte
Complete profile page component with:
- User avatar/photo display
- Profile information (name, email, bio, etc.)
- Profile actions (edit, settings)
- Responsive layout
- Customizable slots for additional content

## Key Patterns

### ProfilePage Component

```svelte
<script lang="ts">
  import { ProfilePage } from '@manacore/shared-profile-ui';
  import type { UserProfile, ProfileActions } from '@manacore/shared-profile-ui';

  const profile: UserProfile = {
    id: '123',
    name: 'Jane Doe',
    email: 'jane@example.com',
    avatar: '/avatars/jane.jpg',
    bio: 'Software developer and designer',
    createdAt: new Date('2024-01-01'),
  };

  const actions: ProfileActions = {
    onEdit: () => console.log('Edit profile'),
    onSettings: () => console.log('Open settings'),
    onLogout: () => console.log('Logout'),
  };
</script>

<ProfilePage {profile} {actions} />
```

### Custom Profile Display

```svelte
<script lang="ts">
  import { ProfilePage } from '@manacore/shared-profile-ui';
  import type { UserProfile } from '@manacore/shared-profile-ui';

  const profile: UserProfile = {
    id: '123',
    name: 'Jane Doe',
    email: 'jane@example.com',
    avatar: '/avatars/jane.jpg',
  };
</script>

<ProfilePage {profile}>
  <!-- Additional content slot -->
  <div slot="extra">
    <h3>Recent Activity</h3>
    <ul>
      <li>Logged in today</li>
      <li>Updated profile yesterday</li>
    </ul>
  </div>
</ProfilePage>
```

### Profile with Actions

```svelte
<script lang="ts">
  import { ProfilePage } from '@manacore/shared-profile-ui';
  import { goto } from '$app/navigation';

  let profile = $state({
    id: '123',
    name: 'Jane Doe',
    email: 'jane@example.com',
  });

  function handleEdit() {
    goto('/profile/edit');
  }

  function handleSettings() {
    goto('/settings');
  }

  function handleLogout() {
    // Logout logic
  }
</script>

<ProfilePage
  {profile}
  actions={{
    onEdit: handleEdit,
    onSettings: handleSettings,
    onLogout: handleLogout,
  }}
/>
```

## Integration Points

### Dependencies

This package has minimal dependencies:
- Svelte 5 components only
- May use shared-ui components internally

### Peer Dependencies

- **svelte**: ^5.0.0

### Used By

- User profile pages in all SvelteKit applications
- Account settings pages
- User directory/listing pages
- Admin user management interfaces

### Integration with Auth

```svelte
<script lang="ts">
  import { ProfilePage } from '@manacore/shared-profile-ui';
  import type { UserProfile } from '@manacore/shared-profile-ui';
  import { page } from '$app/stores';

  // Get user from auth context
  const user = $derived($page.data.user);

  const profile: UserProfile = $derived({
    id: user.id,
    name: user.name,
    email: user.email,
    avatar: user.avatar,
  });
</script>

<ProfilePage {profile} />
```

### Integration with shared-ui

```svelte
<script lang="ts">
  import { ProfilePage } from '@manacore/shared-profile-ui';
  import { Button, Card } from '@manacore/shared-ui';
  import { PencilSimple } from '@manacore/shared-icons';

  let profile = $state({
    id: '123',
    name: 'Jane Doe',
    email: 'jane@example.com',
  });
</script>

<Card>
  <ProfilePage {profile}>
    <div slot="actions">
      <Button variant="primary" onclick={() => console.log('Edit')}>
        <PencilSimple size={16} />
        Edit Profile
      </Button>
    </div>
  </ProfilePage>
</Card>
```

## How to Use

### Installation

This package is internal to the monorepo:

```json
{
  "dependencies": {
    "@manacore/shared-profile-ui": "workspace:*"
  }
}
```

### Basic Usage

```svelte
<script lang="ts">
  import { ProfilePage } from '@manacore/shared-profile-ui';
  import type { UserProfile, ProfileActions } from '@manacore/shared-profile-ui';

  const profile: UserProfile = {
    id: 'user-123',
    name: 'John Smith',
    email: 'john@example.com',
    avatar: 'https://example.com/avatars/john.jpg',
    bio: 'Full-stack developer passionate about web technologies',
    location: 'San Francisco, CA',
    website: 'https://johnsmith.dev',
    createdAt: new Date('2023-01-15'),
  };

  const actions: ProfileActions = {
    onEdit: () => {
      console.log('Navigate to edit profile');
    },
    onSettings: () => {
      console.log('Navigate to settings');
    },
    onLogout: async () => {
      console.log('Logout user');
    },
  };
</script>

<ProfilePage {profile} {actions} />
```

### With SvelteKit Page Data

```svelte
<!-- src/routes/profile/+page.svelte -->
<script lang="ts">
  import { ProfilePage } from '@manacore/shared-profile-ui';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();

  const profile = $derived({
    id: data.user.id,
    name: data.user.name,
    email: data.user.email,
    avatar: data.user.avatar,
    bio: data.user.bio,
    createdAt: new Date(data.user.createdAt),
  });

  const actions = {
    onEdit: () => {
      // Navigate to edit page
    },
    onSettings: () => {
      // Navigate to settings
    },
    onLogout: async () => {
      // Handle logout
    },
  };
</script>

<ProfilePage {profile} {actions} />
```

### Extending with Custom Content

```svelte
<script lang="ts">
  import { ProfilePage } from '@manacore/shared-profile-ui';
  import { Card } from '@manacore/shared-ui';

  let profile = $state({
    id: '123',
    name: 'Jane Doe',
    email: 'jane@example.com',
  });
</script>

<ProfilePage {profile}>
  <!-- Add custom sections using slots -->
  <div slot="stats">
    <Card>
      <h3>Statistics</h3>
      <p>Posts: 42</p>
      <p>Followers: 1,234</p>
    </Card>
  </div>

  <div slot="activity">
    <Card>
      <h3>Recent Activity</h3>
      <ul>
        <li>Posted a new article</li>
        <li>Updated profile picture</li>
      </ul>
    </Card>
  </div>
</ProfilePage>
```

### Type-Safe Profile Updates

```svelte
<script lang="ts">
  import { ProfilePage } from '@manacore/shared-profile-ui';
  import type { UserProfile } from '@manacore/shared-profile-ui';

  let profile = $state<UserProfile>({
    id: '123',
    name: 'Jane Doe',
    email: 'jane@example.com',
  });

  async function updateProfile(updates: Partial<UserProfile>) {
    // API call to update profile
    const response = await fetch('/api/profile', {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });

    if (response.ok) {
      profile = { ...profile, ...updates };
    }
  }

  const actions = {
    onEdit: () => updateProfile({ name: 'Jane Smith' }),
  };
</script>

<ProfilePage {profile} {actions} />
```

## Best Practices

1. **Use Type Definitions**: Always import and use `UserProfile` and `ProfileActions` types
2. **Svelte 5 Runes**: Use `$state`, `$derived`, and `$props` for reactive data
3. **Minimal Data**: Only pass necessary profile data to components
4. **Action Handlers**: Provide clear action handlers for profile operations
5. **Loading States**: Handle loading states when fetching profile data
6. **Error Handling**: Gracefully handle missing or invalid profile data
7. **Avatar Fallbacks**: Provide fallback for missing avatar images
8. **Privacy**: Respect user privacy settings for profile visibility
9. **Responsive Design**: Ensure profile displays well on all screen sizes
10. **Accessibility**: Use semantic HTML and proper ARIA labels

## Type Definitions

### UserProfile

```typescript
interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  bio?: string;
  location?: string;
  website?: string;
  phone?: string;
  createdAt?: Date;
  updatedAt?: Date;
  // Add custom fields as needed
  [key: string]: any;
}
```

### ProfileActions

```typescript
interface ProfileActions {
  onEdit?: () => void;
  onSettings?: () => void;
  onLogout?: () => void | Promise<void>;
  onDelete?: () => void | Promise<void>;
  // Add custom actions as needed
  [key: string]: (() => void | Promise<void>) | undefined;
}
```

## Component Slots

### ProfilePage Slots

- **default**: Additional content below profile information
- **header**: Custom header content
- **actions**: Custom action buttons
- **stats**: Statistics or metrics section
- **activity**: Recent activity section
- **extra**: Any additional custom content

## Common Use Cases

1. **User Profile Page**: Display logged-in user's profile
2. **Public Profile**: Show public user profile to other users
3. **Admin User View**: Admin interface for viewing user details
4. **Account Settings**: Part of account settings interface
5. **User Directory**: Profile cards in user listing
6. **Team Members**: Display team member profiles

## Integration Examples

### With Authentication

```svelte
<script lang="ts">
  import { ProfilePage } from '@manacore/shared-profile-ui';
  import { getContext } from 'svelte';

  const auth = getContext('auth');
  const profile = $derived(auth.user);
</script>

{#if profile}
  <ProfilePage {profile} />
{:else}
  <p>Loading profile...</p>
{/if}
```

### With API Data

```svelte
<script lang="ts">
  import { ProfilePage } from '@manacore/shared-profile-ui';
  import type { UserProfile } from '@manacore/shared-profile-ui';

  let profile = $state<UserProfile | null>(null);
  let loading = $state(true);

  async function loadProfile() {
    const response = await fetch('/api/profile');
    profile = await response.json();
    loading = false;
  }

  $effect(() => {
    loadProfile();
  });
</script>

{#if loading}
  <p>Loading...</p>
{:else if profile}
  <ProfilePage {profile} />
{:else}
  <p>Profile not found</p>
{/if}
```
