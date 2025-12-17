# Calendar App Agent Team

This directory contains role-based agent files for the Calendar application.

## Structure

```
.agent/
├── team.md              # Team overview and module description
├── memory.md            # Auto-updated implementation notes
├── team/
│   ├── product-owner.md # User stories, feature prioritization
│   ├── architect.md     # System design, recurrence logic, sync
│   ├── senior-dev.md    # Complex features, RRULE, code review
│   ├── developer.md     # Feature implementation, CRUD operations
│   ├── security.md      # Auth, sharing permissions, encryption
│   └── qa-lead.md       # Testing strategy, edge cases, quality gates
└── README.md            # This file
```

## How to Use

Invoke a specific role by referencing them in your prompt:

```
"As the Product Owner for calendar, help me prioritize..."
"As the Architect for calendar, design the sync architecture..."
"As the Senior Developer for calendar, review this recurrence logic..."
"As the Developer for calendar, implement event editing..."
"As the Security Engineer for calendar, audit sharing permissions..."
"As the QA Lead for calendar, design test cases for timezone handling..."
```

## Team Focus Areas

- **Product Owner**: User needs, calendar UX, feature prioritization
- **Architect**: Database schema, RRULE design, sync protocols, Svelte 5 runes
- **Senior Developer**: Complex features, recurrence parsing, timezone handling
- **Developer**: CRUD operations, UI components, API endpoints
- **Security Engineer**: JWT auth, sharing tokens, permission enforcement, encryption
- **QA Lead**: Edge cases, DST testing, recurrence validation, E2E tests

## Calendar-Specific Knowledge

All team members understand:
- RFC 5545 RRULE format for recurring events
- Timezone handling with date-fns
- Calendar sharing permission hierarchy (read < write < admin)
- External calendar sync with CalDAV/iCal
- Svelte 5 runes mode ($state, $derived, $effect)
- Multi-language i18n (DE, EN, FR, ES, IT)
- NestJS backend patterns with Result types
- Drizzle ORM queries and schema design
