# PostHog Analytics Implementation

This document outlines all the analytics events being tracked in the Storyteller app using PostHog.

## Event Categories

### Authentication Events

#### Login/Registration

- `auth_attempt`
  - Properties:
    - `method`: "email"
    - `type`: "login" | "register"
    - `email_domain`: string

- `auth_success`
  - Properties:
    - `method`: "email"
    - `type`: "login" | "register"
    - `email_domain`: string

- `auth_error`
  - Properties:
    - `method`: "email"
    - `type`: "login" | "register"
    - `error`: string
    - `email_domain`: string

#### Password Reset

- `password_reset_requested`
  - Properties:
    - `email_provided`: boolean

- `password_reset_success`
  - Properties:
    - `email_domain`: string

#### Logout

- `user_logout_attempt`
- `user_logout_success`
- `user_logout_error`
  - Properties:
    - `error`: string

### Session Events

- `session_started`
  - Properties:
    - `device_type`: string
    - `screen_size`: { width: number, height: number }
    - `user_id`: string
    - `is_new_user`: boolean

- `session_ended`
  - Properties:
    - `session_duration`: number (seconds)
    - `user_id`: string

### Story Reading Events

#### Core Story Events

- `story_started`
  - Properties:
    - `story_id`: string
    - `story_title`: string
    - `character_name`: string
    - `total_slides`: number

- `story_slide_viewed`
  - Properties:
    - `story_id`: string
    - `story_title`: string
    - `character_name`: string
    - `slide_number`: number
    - `total_slides`: number

- `story_ended`
  - Properties:
    - `story_id`: string
    - `story_title`: string
    - `character_name`: string

- `story_restarted`
  - Properties:
    - `story_id`: string
    - `story_title`: string
    - `character_name`: string

### Character Creation Events

#### Page Events

- `character_creation_page_viewed`

#### Core Character Events

- `character_creation_started`
  - Properties:
    - `has_image`: boolean
    - `ethnicity`: string
    - `gender`: string
    - `age_range`: "adult" | "minor"

- `character_created_successfully`
  - Properties:
    - `character_id`: string

#### Image Upload Flow

- `character_image_upload_started`
  - Triggered when user initiates image upload process

- `character_image_permission_denied`
  - Triggered when user denies photo library access

- `character_image_selected`
  - Triggered when user successfully selects an image

#### Manual Creation

- `character_creation_manual_started`
  - Triggered when user chooses to create character without image

#### Performance Events

- `character_analysis_performance`
  - Properties:
    - `duration_seconds`: number
    - `success`: boolean

- `character_analysis_success`
  - Properties:
    - `detected_characteristics`: string[]

- `character_analysis_error`
  - Properties:
    - `error`: string
    - `image_size`: number

### Story Creation Events

#### Page Events

- `story_creation_page_viewed`

#### Core Story Events

- `story_creation_started`
  - Properties:
    - `character_id`: string
    - `character_name`: string
    - `story_length`: number

- `story_created_successfully`
  - Properties:
    - `character_id`: string
    - `character_name`: string
    - `story_length`: number

#### Character Selection

- `character_selected_for_story`
  - Properties:
    - `character_id`: string
    - `character_name`: string

#### Error Events

- `story_creation_error`
  - Properties:
    - `error`: string
      - Possible values:
        - `"empty_story"`
        - `"no_character_selected"`
        - `"unknown_error"`
        - Or specific error message from API/backend
    - `character_id`: string (if available)

## Using This Data

### Key Metrics to Track

1. User Engagement and Retention
   - Session duration and frequency
   - Feature usage patterns
   - Onboarding completion rate
   - User return rate (via `onboarding_reopened`)
   - Track feature adoption through `feature_toggle`

2. Authentication and User Flow
   - Login/registration success rates
   - Password reset frequency
   - Session durations
   - Onboarding completion funnel

3. Character Creation Success Rate
   - Compare `character_creation_started` vs `character_created_successfully`
   - Monitor distribution of manual vs. image-based creation
   - Track image analysis performance

4. Story Creation Success Rate
   - Compare `story_creation_started` vs `story_created_successfully`
   - Monitor average story length
   - Track story generation performance

5. User Engagement
   - Track character reuse through `character_selected_for_story`
   - Monitor character creation methods (image vs. manual)
   - Analyze session frequency and duration

6. Error Analysis
   - Monitor frequency and types of errors through `story_creation_error`
   - Track permission issues through `character_image_permission_denied`
   - Analyze authentication failures
   - Monitor API performance issues

### PostHog Dashboard Suggestions

1. User Journey Dashboard
   - Authentication success rates by type (login/register)
   - Session duration trends over time
   - Onboarding completion funnel
   - Feature adoption rates
   - User retention curves

2. Authentication & Security Dashboard
   - Login success/failure rates
   - Password reset frequency
   - Error distribution by type
   - Session duration patterns
   - Device/platform distribution

3. Story Reading Dashboard
   - Story completion rates
   - Average time spent per slide
   - Most engaging story sections
   - Story restart frequency
   - Overall story engagement metrics

4. Character Creation Dashboard
   - Success rate funnel
   - Image vs. manual creation distribution
   - Character demographics distribution
   - Image analysis performance metrics
   - Error rate by step

5. Story Creation Dashboard
   - Success rate funnel
   - Story generation performance trends
   - Average story length trends
   - Most used characters
   - Error rate and distribution

6. Performance Monitoring Dashboard
   - API response times
   - Story generation duration
   - Image analysis duration
   - Error rates by endpoint
   - Client-side performance metrics

7. User Engagement Dashboard
   - Active users (daily/weekly/monthly)
   - Session frequency and duration
   - Feature usage heatmap
   - Characters per user
   - Stories per character
   - Onboarding completion rates

### Onboarding Events

- `onboarding_started`

- `onboarding_step_completed`
  - Properties:
    - `step_number`: number
    - `time_spent`: number (seconds)
    - `slide_title`: string

- `onboarding_skipped`
  - Properties:
    - `skipped_at_slide`: number
    - `total_slides`: number

- `onboarding_completed`
  - Properties:
    - `total_slides_viewed`: number
    - `total_time`: number (seconds)

- `onboarding_ended`
  - Properties:
    - `total_time`: number (seconds)
    - `completed_slides`: number
    - `completed`: boolean

- `onboarding_reopened`
  - Properties:
    - `user_age_days`: number

### Performance Events

- `story_generation_performance`
  - Properties:
    - `duration_seconds`: number
    - `story_length`: number
    - `success`: boolean

### Feature Usage Events

- `feature_toggle`
  - Properties:
    - `feature`: string (e.g., "debug_borders")
    - `enabled`: boolean
  - Stories per character
  - Session duration
  - Return rate

## Implementation Details

The analytics are implemented using the `usePostHog` custom hook located in `src/hooks/usePostHog.ts`. This hook automatically:

1. Initializes PostHog tracking
2. Identifies users when they log in
3. Provides a consistent interface for event tracking across the app

### Usage Example

```typescript
import { usePostHog } from '../src/hooks/usePostHog';

function YourComponent() {
	const posthog = usePostHog();

	const handleAction = () => {
		posthog?.capture('event_name', {
			property1: 'value1',
			property2: 'value2',
		});
	};
}
```
