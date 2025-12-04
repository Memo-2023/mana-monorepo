# WTFigure Backend Architecture

This document provides an overview of the Supabase backend architecture for the WTFigure application.

## Database Structure

The WTFigure database consists of the following tables in the public schema:

### 1. Prompts Table

Stores templates for generating action figures.

| Column Name | Data Type | Nullable | Description |
|-------------|-----------|----------|-------------|
| id | bigint | NO | Primary key, auto-incrementing |
| name | character varying | YES | Name of the prompt template |
| template | text | YES | The actual prompt template content |
| created_at | timestamp with time zone | NO | Creation timestamp |
| updated_at | timestamp with time zone | YES | Last update timestamp |

### 2. Rarity Table

Defines rarity levels for action figures.

| Column Name | Data Type | Nullable | Description |
|-------------|-----------|----------|-------------|
| id | bigint | NO | Primary key, auto-incrementing |
| name | character varying | YES | Name of the rarity level (e.g., Common, Rare, Epic) |
| details | jsonb | YES | Additional details about the rarity level |
| created_at | timestamp with time zone | NO | Creation timestamp |
| updated_at | timestamp with time zone | YES | Last update timestamp |

### 3. Themes Table

Defines themes for action figures.

| Column Name | Data Type | Nullable | Description |
|-------------|-----------|----------|-------------|
| id | bigint | NO | Primary key, auto-incrementing |
| name | character varying | YES | Name of the theme |
| details | jsonb | YES | Additional details about the theme |
| created_at | timestamp with time zone | NO | Creation timestamp |
| updated_at | timestamp with time zone | YES | Last update timestamp |

## Edge Functions

### Static Image Generator

**Endpoint**: `/static-image-generator`

This edge function generates AI-created action figure images using OpenAI's image generation API.

**Functionality**:
- Accepts parameters for customizing the action figure (subject, theme, rarity)
- Generates a product-shot style image of an action figure in packaging
- Uploads the generated image to Supabase Storage
- Returns the public URL and metadata for the generated image

**Key Features**:
- Integrates with OpenAI for image generation
- Supports custom prompts based on themes and rarities
- Stores generated images in Supabase Storage
- Handles error cases gracefully

**Implementation Details**:
- Uses OpenAI's image generation and editing capabilities
- Dynamically constructs prompts based on the subject, theme, and rarity
- Generates unique filenames for each image
- Uploads images to the 'figures' storage bucket
- Returns structured metadata along with the image URL

## Authentication

The WTFigure app uses Supabase Authentication with the following features:
- Email/password authentication
- Session persistence using AsyncStorage
- Protected routes requiring authentication

## Storage

The application uses Supabase Storage with the following buckets:
- `figures`: Stores AI-generated action figure images

## Environment Configuration

The application connects to Supabase using the following environment variables:
- `EXPO_PUBLIC_SUPABASE_URL`: The URL of your Supabase project
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`: The anonymous API key for client-side access

## Integration with Frontend

The WTFigure frontend is a React Native Expo application that:
- Displays action figures in horizontal and vertical layouts
- Supports light/dark theme switching
- Provides user authentication flows
- Allows creation of custom action figures

The frontend connects to this Supabase backend using the Supabase JavaScript client.
