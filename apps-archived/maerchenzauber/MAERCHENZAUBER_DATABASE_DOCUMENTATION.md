# Märchenzauber Database Documentation

## Project Information

- **Project Name**: Maerchenzauber
- **Project ID**: dyywxrmonxoiojsjmymc
- **Region**: eu-central-1
- **Status**: ACTIVE_HEALTHY
- **Database Host**: db.dyywxrmonxoiojsjmymc.supabase.co
- **Postgres Version**: 15.8.1.079
- **Created**: 2025-04-29T21:43:53.3429Z

## Database Schema Overview

The Märchenzauber database is designed to support a storytelling application with character creation and story generation capabilities. It uses a custom JWT authentication system alongside standard Supabase auth.

## Tables

### 1. `characters`

Stores user-created characters for storytelling.

| Column                         | Type        | Default              | Nullable | Description                    |
| ------------------------------ | ----------- | -------------------- | -------- | ------------------------------ |
| `id`                           | uuid        | uuid_generate_v4()   | NO       | Primary key                    |
| `user_id`                      | text        | -                    | NO       | User identifier (custom JWT)   |
| `name`                         | varchar     | -                    | NO       | Character name                 |
| `original_description`         | text        | -                    | NO       | Original character description |
| `character_description_prompt` | text        | -                    | NO       | AI prompt for character        |
| `image_url`                    | text        | -                    | NO       | Character image URL            |
| `source_image_url`             | text        | -                    | YES      | Original source image          |
| `is_animal`                    | boolean     | false                | YES      | Whether character is an animal |
| `animal_type`                  | varchar     | 'unspecified animal' | YES      | Type of animal if applicable   |
| `images_data`                  | jsonb       | '[]'::jsonb          | YES      | JSON array of image data       |
| `created_at`                   | timestamptz | now()                | NO       | Creation timestamp             |
| `updated_at`                   | timestamptz | now()                | NO       | Last update timestamp          |

**Indexes:**

- `characters_pkey` (PRIMARY KEY on id)
- `characters_user_id_id_key` (UNIQUE on user_id, id)
- `idx_characters_user_id` (on user_id)
- `idx_characters_images_data` (GIN index on images_data)

**Relationships:**

- Referenced by `stories.character_id`
- Referenced by `errors.character_id`

### 2. `stories`

Stores generated stories with their associated characters and content.

| Column            | Type        | Default              | Nullable | Description                   |
| ----------------- | ----------- | -------------------- | -------- | ----------------------------- |
| `id`              | uuid        | uuid_generate_v4()   | NO       | Primary key                   |
| `user_id`         | text        | -                    | NO       | User identifier (custom JWT)  |
| `title`           | varchar     | -                    | YES      | Story title                   |
| `story_prompt`    | text        | -                    | NO       | Prompt used to generate story |
| `story_text`      | text        | -                    | YES      | Generated story content       |
| `is_animal_story` | boolean     | false                | YES      | Whether it's an animal story  |
| `animal_type`     | varchar     | 'unspecified animal' | YES      | Type of animal if applicable  |
| `character_id`    | uuid        | -                    | YES      | Reference to character        |
| `character_name`  | varchar     | -                    | YES      | Character name (denormalized) |
| `used_settings`   | jsonb       | -                    | YES      | Settings used for generation  |
| `characters_data` | jsonb       | '[]'::jsonb          | YES      | JSON array of character data  |
| `pages_data`      | jsonb       | '[]'::jsonb          | YES      | JSON array of page data       |
| `created_at`      | timestamptz | now()                | NO       | Creation timestamp            |
| `updated_at`      | timestamptz | now()                | NO       | Last update timestamp         |

**Indexes:**

- `stories_pkey` (PRIMARY KEY on id)
- `stories_user_id_id_key` (UNIQUE on user_id, id)
- `idx_stories_user_id` (on user_id)
- `idx_stories_character_id` (on character_id)
- `idx_stories_characters_data` (GIN index on characters_data)
- `idx_stories_pages_data` (GIN index on pages_data)

**Foreign Keys:**

- `character_id` → `characters.id`

### 3. `creators`

Stores information about story and illustration creators (admin-managed).

| Column                   | Type        | Default            | Nullable | Description               |
| ------------------------ | ----------- | ------------------ | -------- | ------------------------- |
| `id`                     | uuid        | uuid_generate_v4() | NO       | Primary key               |
| `creator_id`             | varchar     | -                  | NO       | Unique creator identifier |
| `name`                   | varchar     | -                  | NO       | Creator name              |
| `type`                   | varchar     | -                  | NO       | 'illustrator' or 'author' |
| `system_prompt`          | text        | -                  | NO       | AI system prompt          |
| `description`            | text        | -                  | NO       | Creator description       |
| `profile_picture`        | text        | -                  | YES      | Profile picture URL       |
| `extra_prompt_beginning` | text        | -                  | YES      | Additional prompt prefix  |
| `extra_prompt_end`       | text        | -                  | YES      | Additional prompt suffix  |
| `created_at`             | timestamptz | now()              | NO       | Creation timestamp        |
| `updated_at`             | timestamptz | now()              | NO       | Last update timestamp     |

**Indexes:**

- `creators_pkey` (PRIMARY KEY on id)
- `creators_creator_id_key` (UNIQUE on creator_id)

**Constraints:**

- CHECK: `type` must be either 'illustrator' or 'author'

### 4. `errors`

Logs errors that occur during character creation or story generation.

| Column          | Type        | Default            | Nullable | Description                |
| --------------- | ----------- | ------------------ | -------- | -------------------------- |
| `id`            | uuid        | uuid_generate_v4() | NO       | Primary key                |
| `user_id`       | text        | -                  | NO       | User identifier            |
| `story_id`      | uuid        | -                  | YES      | Related story ID           |
| `character_id`  | uuid        | -                  | YES      | Related character ID       |
| `error_type`    | varchar     | -                  | NO       | Type of error              |
| `error_details` | jsonb       | -                  | NO       | Detailed error information |
| `created_at`    | timestamptz | now()              | NO       | Error timestamp            |

**Indexes:**

- `errors_pkey` (PRIMARY KEY on id)
- `idx_errors_user_id` (on user_id)
- `idx_errors_story_id` (on story_id)
- `idx_errors_character_id` (on character_id)

**Foreign Keys:**

- `story_id` → `stories.id`
- `character_id` → `characters.id`

### 5. `story_logbooks`

Comprehensive logs of the story creation process including all AI prompts, responses, and timing data.

| Column              | Type        | Default           | Nullable | Description                                      |
| ------------------- | ----------- | ----------------- | -------- | ------------------------------------------------ |
| `id`                | uuid        | gen_random_uuid() | NO       | Primary key                                      |
| `story_id`          | uuid        | -                 | NO       | Related story ID                                 |
| `user_id`           | uuid        | -                 | NO       | User identifier                                  |
| `character_ids`     | uuid[]      | '{}'              | YES      | Array of character IDs used in story             |
| `start_time`        | timestamptz | -                 | NO       | Story creation start time                        |
| `end_time`          | timestamptz | -                 | YES      | Story creation end time                          |
| `total_duration_ms` | integer     | -                 | YES      | Total duration in milliseconds                   |
| `success`           | boolean     | false             | YES      | Whether creation was successful                  |
| `environment`       | text        | 'production'      | YES      | Environment (development/production)             |
| `entries`           | jsonb       | '[]'::jsonb       | NO       | Array of log entries with prompts/responses      |
| `metadata`          | jsonb       | '{}'::jsonb       | NO       | Additional metadata (characters, settings, etc.) |
| `summary`           | text        | -                 | YES      | Human-readable summary of the creation process   |
| `created_at`        | timestamptz | now()             | YES      | Log creation timestamp                           |
| `updated_at`        | timestamptz | now()             | YES      | Last update timestamp                            |

**Indexes:**

- `story_logbooks_pkey` (PRIMARY KEY on id)
- `idx_story_logbooks_story_id` (on story_id)
- `idx_story_logbooks_user_id` (on user_id)
- `idx_story_logbooks_character_ids` (GIN index on character_ids)
- `idx_story_logbooks_created_at` (on created_at DESC)
- `idx_story_logbooks_success` (on success)

**JSONB Structure:**

**entries** array contains objects with:

```json
{
  "timestamp": "ISO 8601 timestamp",
  "step": "step_name",
  "type": "prompt|response|error|info|character|illustration",
  "data": {}, // Context-specific data
  "duration": 1234 // Optional, in milliseconds
}
```

**metadata** object contains:

```json
{
  "storyTitle": "string",
  "characters": [{
    "id": "uuid",
    "name": "string",
    "description": "string",
    "isAnimal": boolean,
    "animalType": "string"
  }],
  "storyDescription": "string",
  "language": "string",
  "authorId": "uuid",
  "illustratorId": "uuid",
  "pageCount": number,
  "imageCount": number,
  "success": boolean,
  "errors": []
}
```

## Database Functions

### Authentication & Authorization Functions

1. **`auth_is_admin()`**
   - Returns: `boolean`
   - Checks if current user has admin privileges

2. **`authenticate_custom_jwt(jwt_token text)`**
   - Returns: `json`
   - Validates and authenticates custom JWT tokens

3. **`current_user_id()`**
   - Returns: `text`
   - Gets current user ID from auth context or JWT claims

4. **`current_user_uuid()`**
   - Returns: `uuid`
   - Gets current user UUID from auth context

5. **`user_owns_resource(resource_user_id text)`**
   - Returns: `boolean`
   - Checks if current user owns a specific resource

### Utility Functions

6. **`debug_jwt_context()`**
   - Returns: `json`
   - Debugging function to inspect JWT context

7. **`get_current_user_context()`**
   - Returns: `json`
   - Gets complete current user context information

8. **`set_request_user_id(user_id uuid/text)`**
   - Returns: `void`
   - Sets the request user ID (overloaded for uuid and text)

### Data Operation Functions

9. **`execute_as_user(p_token text, p_operation text, p_params jsonb)`**
   - Returns: `jsonb`
   - Executes operations on behalf of a user with proper authentication

10. **`create_test_character(p_user_id text, p_name text, p_description text, p_prompt text, p_image_url text)`**
    - Returns: `jsonb`
    - Creates a test character (likely for testing purposes)

## Row Level Security (RLS) Policies

### Characters Table

- **Users can view own characters**: SELECT where `user_id` matches current user
- **Users can insert own characters**: INSERT where `user_id` matches current user
- **Users can update own characters**: UPDATE where `user_id` matches current user
- **Users can delete own characters**: DELETE where `user_id` matches current user
- **Service role full access**: Full access for service_role

### Stories Table

- **Users can view own stories**: SELECT where `user_id` matches current user
- **Users can insert own stories**: INSERT where `user_id` matches current user
- **Users can update own stories**: UPDATE where `user_id` matches current user
- **Users can delete own stories**: DELETE where `user_id` matches current user
- **Service role full access**: Full access for service_role

### Creators Table

- **All users can view creators**: SELECT for all authenticated users
- **Admins can insert creators**: INSERT only for admins
- **Admins can update creators**: UPDATE only for admins
- **Admins can delete creators**: DELETE only for admins
- **Service role full access**: Full access for service_role

### Errors Table

- **Users can insert errors**: Any authenticated user can log errors
- **Admins can view errors**: SELECT only for admins
- **Admins can update errors**: UPDATE only for admins
- **Admins can delete errors**: DELETE only for admins
- **Service role full access**: Full access for service_role

### Story Logbooks Table

- **Service role full access**: Full access for service_role (backend handles auth via Mana Core)

## Enabled Extensions

### Core Extensions

- `uuid-ossp` (v1.1): UUID generation
- `pgcrypto` (v1.3): Cryptographic functions
- `pg_stat_statements` (v1.10): Query performance tracking
- `pgjwt` (v0.2.0): JWT handling for PostgreSQL

### GraphQL & Vault

- `pg_graphql` (v1.5.11): GraphQL support
- `supabase_vault` (v0.3.1): Supabase Vault for secrets management

## Migration History

The database has undergone 43 migrations, primarily focused on:

1. Custom JWT authentication implementation
2. RLS policy refinements for security
3. Storage integration with custom auth
4. Performance optimizations
5. Security enhancements

Key migration themes:

- Initial custom JWT verification setup (20250501)
- RLS policies for JWT authentication (20250501)
- Auth helper functions implementation (20250705)
- Storage RLS policies with custom JWT support (20250705)
- Performance and security optimizations (20250706-20250712)
- Story logbooks table for comprehensive creation tracking (20250910)

## Security Advisories

### Warnings

1. **Function Search Path Mutable** (SECURITY)
   - Function `public.execute_as_user` has a mutable search_path
   - [Remediation Guide](https://supabase.com/docs/guides/database/database-linter?lint=0011_function_search_path_mutable)

2. **Auth OTP Long Expiry** (SECURITY)
   - OTP expiry is set to more than an hour
   - Recommendation: Set to less than an hour
   - [Security Best Practices](https://supabase.com/docs/guides/platform/going-into-prod#security)

### Performance Issues

1. **RLS Performance** (PERFORMANCE)
   - Multiple RLS policies re-evaluate `current_setting()` or `auth.<function>()` for each row
   - Affected tables: `stories`, `characters`, `errors`
   - Solution: Replace `auth.<function>()` with `(select auth.<function>())`
   - [Performance Guide](https://supabase.com/docs/guides/database/postgres/row-level-security#call-functions-with-select)

2. **Unused Indexes** (INFO)
   - Several indexes have never been used and could be removed:
     - `idx_errors_user_id`
     - `idx_errors_story_id`
     - `idx_characters_images_data`
     - `idx_stories_pages_data`
     - `idx_stories_characters_data`

## TypeScript Types

The database includes generated TypeScript types for all tables and functions, providing type-safe access from client applications. Key types include:

```typescript
// Table row types
type Character = {
  id: string;
  user_id: string;
  name: string;
  original_description: string;
  character_description_prompt: string;
  image_url: string;
  source_image_url: string | null;
  is_animal: boolean | null;
  animal_type: string | null;
  images_data: Json | null;
  created_at: string;
  updated_at: string;
};

type Story = {
  id: string;
  user_id: string;
  title: string | null;
  story_prompt: string;
  story_text: string | null;
  is_animal_story: boolean | null;
  animal_type: string | null;
  character_id: string | null;
  character_name: string | null;
  used_settings: Json | null;
  characters_data: Json | null;
  pages_data: Json | null;
  created_at: string;
  updated_at: string;
};

type Creator = {
  id: string;
  creator_id: string;
  name: string;
  type: string;
  system_prompt: string;
  description: string;
  profile_picture: string | null;
  extra_prompt_beginning: string | null;
  extra_prompt_end: string | null;
  created_at: string;
  updated_at: string;
};

type Error = {
  id: string;
  user_id: string;
  story_id: string | null;
  character_id: string | null;
  error_type: string;
  error_details: Json;
  created_at: string;
};

type StoryLogbook = {
  id: string;
  story_id: string;
  user_id: string;
  character_ids: string[] | null;
  start_time: string;
  end_time: string | null;
  total_duration_ms: number | null;
  success: boolean | null;
  environment: string | null;
  entries: Json;
  metadata: Json;
  summary: string | null;
  created_at: string | null;
  updated_at: string | null;
};
```

## Development Recommendations

### Immediate Actions Required

1. **Fix Function Security**: Update `execute_as_user` function to set search_path
2. **Reduce OTP Expiry**: Configure OTP to expire within 1 hour
3. **Optimize RLS Policies**: Update policies to use subqueries for better performance

### Performance Optimizations

1. **Review Unused Indexes**: Consider removing unused GIN indexes on JSONB columns
2. **RLS Query Optimization**: Implement suggested RLS performance improvements

### Best Practices

1. **Use TypeScript Types**: Leverage generated types for type-safe database access
2. **Monitor Query Performance**: Use `pg_stat_statements` to track slow queries
3. **Regular Security Audits**: Run security advisors regularly after schema changes
4. **Test with Custom JWT**: Ensure all features work with custom JWT authentication

## Authentication Architecture

The system supports dual authentication methods:

1. **Standard Supabase Auth**: Using `auth.uid()`
2. **Custom JWT**: Using JWT claims from request headers

All RLS policies use `COALESCE` to support both authentication methods, prioritizing:

1. Supabase auth UID
2. Custom JWT claims (`sub` field)
3. Fallback to `current_user_id()` function

This architecture allows flexibility in authentication while maintaining security through consistent RLS policies.
