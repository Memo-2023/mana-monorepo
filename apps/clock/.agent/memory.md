# Clock App - Memory

Auto-updated with learnings from code changes.

## Recent Updates
*No updates yet.*

## Known Issues
*None documented.*

## Implementation Notes
- Backend runs on port 3017
- Database: PostgreSQL with Drizzle ORM
- Auth: Mana Core Auth (JWT EdDSA)
- Time storage: UTC in database, convert to user timezone on frontend
- Sync features: Alarms, Timers, World Clocks, Presets
- Local-only features: Stopwatch, Pomodoro (no backend sync)
- Clock faces: 20+ customizable designs
- Life clock: Visualization of time/life progress
- i18n: Support for DE, EN, FR, ES, IT
- Theme: Amber/Orange (#f59e0b) as primary color

## Clock Face Types
- Classic, Modern, Minimalist, Elegant, Retro
- LCD, Flip, Binary, Matrix, Neon
- Railway, Nautical, Industrial, Vintage
- Gradient, Bauhaus, Radar, Sporty, Typewriter, Terminal

## Database Schema Notes
- `alarms.time`: Stored as TIME type (HH:MM:SS)
- `alarms.repeat_days`: Array of integers [0-6] for weekdays
- `timers.status`: Enum (idle, running, paused, finished)
- `world_clocks.sort_order`: User-controlled display order
- `presets.settings`: JSONB for flexible configuration
