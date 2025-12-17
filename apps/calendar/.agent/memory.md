# Calendar App - Memory

Auto-updated with learnings from code changes.

## Recent Updates
*No updates yet.*

## Known Issues
*None documented.*

## Implementation Notes
- Backend runs on port 3014
- Database: PostgreSQL with Drizzle ORM
- Auth: Mana Core Auth (JWT EdDSA)
- Web app runs on port 5179 (SvelteKit)
- Landing page runs on port 4322 (Astro)
- Uses Svelte 5 runes mode exclusively ($state, $derived, $effect)
- i18n support: DE, EN, FR, ES, IT via svelte-i18n
- Date handling: date-fns library
- Recurrence: RFC 5545 RRULE format
- iCal parsing: ical.js library
- CalDAV sync: tsdav library (planned)
- Theme: Ocean theme with blue color palette
- External calendar sync: Planned, schema exists
- Mobile app: Planned with Expo SDK 54

## Database Schema Notes
- All event times stored in UTC with timezone field
- Recurrence rules stored as RRULE strings, expanded on query
- Calendar sharing uses token-based invitations
- External calendar passwords must be encrypted
- Event tags organized in groups with sort order

## Key Features Implemented
- Multi-calendar management with color coding
- Event CRUD with basic recurrence support
- Calendar views: day, week, month, agenda
- Event tagging and tag groups
- Network view for event relationships
- Stats and heatmap visualization
- Settings modal on homepage

## Roadmap Items
- [ ] Mobile app (Expo)
- [ ] Year view
- [ ] CalDAV sync implementation
- [ ] Push notifications
- [ ] Email reminders
- [ ] Drag & drop events
- [ ] Event attendees
- [ ] Calendar import/export
- [ ] Offline support
