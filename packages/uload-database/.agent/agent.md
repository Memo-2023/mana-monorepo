# ULoad Database Expert

## Module: @manacore/uload-database
**Path:** `packages/uload-database`
**Description:** Drizzle ORM database layer for ULoad, a URL shortener and link management platform. Manages short links, click analytics, workspaces, tags, accounts, and detailed click tracking with geo-location and device information.
**Tech Stack:** Drizzle ORM 0.36, PostgreSQL (via postgres.js), TypeScript
**Key Dependencies:** drizzle-orm, postgres, drizzle-kit

## Identity
You are the **ULoad Database Expert**. You have deep knowledge of:
- URL shortening and link management systems
- Click analytics and tracking (geo-location, device, browser, UTM parameters)
- Multi-tenant architecture with accounts and workspaces
- Link organization with tags and many-to-many relationships
- Privacy-conscious analytics (IP hashing, not storing PII)
- Custom short codes and QR code generation
- Link expiration, password protection, and click limits
- Team collaboration features (workspace-based link sharing)

## Expertise
- Drizzle ORM schema design for SaaS platforms
- Many-to-many relationships (link-tags junction table)
- Multi-level organization (users -> accounts -> workspaces -> links)
- Click tracking without compromising user privacy
- Composite indexes for analytics queries
- Link access control patterns (password, expiration, max clicks)
- UTM parameter tracking for marketing analytics

## Code Structure
```
packages/uload-database/src/
├── schema/
│   ├── index.ts        # Exports all schemas and relations
│   ├── users.ts        # User accounts
│   ├── accounts.ts     # Account entities (free/team/enterprise)
│   ├── workspaces.ts   # Workspaces (personal/team)
│   ├── links.ts        # Short links with access controls
│   ├── clicks.ts       # Click tracking and analytics
│   ├── tags.ts         # Tags and link-tag junction table
│   └── relations.ts    # All Drizzle relations definitions
├── client.ts           # Database client factory & singleton
└── index.ts            # Main entry point
```

## Key Patterns

### 1. Centralized Relations Pattern
```typescript
// All relations defined in separate file for clarity
// schema/relations.ts
export const usersRelations = relations(users, ({ many }) => ({
  links: many(links),
  tags: many(tags),
  ownedAccounts: many(accounts),
  ownedWorkspaces: many(workspaces),
}));

export const linksRelations = relations(links, ({ one, many }) => ({
  user: one(users, { fields: [links.userId], references: [users.id] }),
  account: one(accounts, { fields: [links.accountOwner], references: [accounts.id] }),
  workspace: one(workspaces, { fields: [links.workspaceId], references: [workspaces.id] }),
  clicks: many(clicks),
  linkTags: many(linkTags),
}));
```

### 2. Multi-Level Hierarchy
```typescript
// User -> Account -> Workspace -> Link
User (owner)
  ├─ Account (free/team/enterprise)
  │   └─ Links (account-owned)
  └─ Workspace (personal/team)
      └─ Links (workspace-scoped)
```

### 3. Link Access Control
```typescript
export const links = pgTable('links', {
  shortCode: text('short_code').unique().notNull(),
  customCode: text('custom_code'),
  originalUrl: text('original_url').notNull(),
  isActive: boolean('is_active').default(true),
  password: text('password'),        // hashed password
  maxClicks: integer('max_clicks'),  // click limit
  expiresAt: timestamp('expires_at'), // expiration date
  clickCount: integer('click_count').default(0),
});

// Access validation logic:
// 1. Check isActive
// 2. Check expiresAt (if set)
// 3. Check maxClicks vs clickCount (if set)
// 4. Verify password (if set)
```

### 4. Privacy-Conscious Click Tracking
```typescript
export const clicks = pgTable('clicks', {
  linkId: uuid('link_id').notNull(),
  ipHash: text('ip_hash'),          // Hashed, not raw IP
  userAgent: text('user_agent'),     // For analytics
  browser: text('browser'),          // Parsed from UA
  deviceType: text('device_type'),   // mobile/desktop/tablet
  os: text('os'),                    // Operating system
  country: text('country'),          // Geo-location
  city: text('city'),
  utmSource: text('utm_source'),     // Marketing parameters
  utmMedium: text('utm_medium'),
  utmCampaign: text('utm_campaign'),
  clickedAt: timestamp('clicked_at'),
});
```

### 5. Many-to-Many Tags
```typescript
// Tags table
export const tags = pgTable('tags', {
  id: uuid('id'),
  name: text('name'),
  slug: text('slug'),
  userId: text('user_id'),
  usageCount: integer('usage_count').default(0),
});

// Junction table
export const linkTags = pgTable('link_tags', {
  id: uuid('id'),
  linkId: uuid('link_id').references(() => links.id, { onDelete: 'cascade' }),
  tagId: uuid('tag_id').references(() => tags.id, { onDelete: 'cascade' }),
});

// Composite index for uniqueness
index('link_tags_unique_idx').on(table.linkId, table.tagId)
```

### 6. Account Plan Types
```typescript
planType: text('plan_type', { enum: ['free', 'team', 'enterprise'] }).default('free')

// Plan features:
// - free: Single user, basic features
// - team: Multiple users, workspace collaboration
// - enterprise: Advanced analytics, custom branding
```

## Integration Points

### Used By
- ULoad backend (NestJS) - link CRUD and redirection
- Analytics service - click tracking and reporting
- QR code generation service - visual link sharing
- UTM tracking service - marketing campaign analytics

### Depends On
- `drizzle-orm` - ORM and query builder
- `postgres` - PostgreSQL client
- `drizzle-kit` - Migration tools
- External: IP geolocation API, QR code generator

### Environment Variables
- `DATABASE_URL` or `ULOAD_DATABASE_URL` - PostgreSQL connection string

## Database Schema Overview

### Core Tables

1. **users** - User accounts
   - id (text), email, name, avatarUrl
   - emailVerified, createdAt, updatedAt

2. **accounts** - Account entities for billing/plans
   - id, name, owner (user FK)
   - isActive, planType (free/team/enterprise)
   - settings (JSONB) - account-level configuration
   - createdAt, updatedAt

3. **workspaces** - Workspaces for organizing links
   - id, name, slug (unique)
   - type (personal/team)
   - owner (user FK)
   - createdAt, updatedAt

4. **links** - Short links with full features
   - **Identification**
     - shortCode (unique, auto-generated)
     - customCode (user-defined)
     - originalUrl

   - **Organization**
     - userId, accountOwner, workspaceId
     - title, description

   - **Access Control**
     - isActive (soft delete)
     - password (hashed)
     - maxClicks (limit)
     - expiresAt (expiration)

   - **Analytics**
     - clickCount (incremented)
     - tags (JSONB array)

   - **Marketing**
     - utmSource, utmMedium, utmCampaign
     - qrCodeUrl (generated)

   - **Timestamps**
     - createdAt, updatedAt

5. **clicks** - Click event tracking
   - linkId (FK with cascade delete)
   - **Privacy-Safe Data**
     - ipHash (SHA256, not raw IP)
     - userAgent, browser, deviceType, os
     - country, city (from IP lookup)
     - referer (referrer URL)
   - **Marketing Data**
     - utmSource, utmMedium, utmCampaign
   - **Timestamps**
     - clickedAt, createdAt

6. **tags** - Link tags/labels
   - name, slug, color, icon
   - userId (owner)
   - isPublic (shared tags)
   - usageCount (popularity)
   - createdAt, updatedAt

7. **link_tags** - Many-to-many junction
   - linkId (FK cascade delete)
   - tagId (FK cascade delete)
   - Unique constraint on (linkId, tagId)

## Migration Workflow

```bash
# Generate migration from schema changes
pnpm db:generate

# Apply migrations to database
pnpm db:migrate

# Push schema directly (dev only, skips migrations)
pnpm db:push

# Open Drizzle Studio for GUI exploration
pnpm db:studio

# Reset database (wipes all data)
pnpm db:reset

# Test connection
pnpm db:test
```

## Common Queries

### Create Short Link
```typescript
import { getDb, links } from '@manacore/uload-database';

const db = getDb();

// Generate unique short code (service layer logic)
const shortCode = generateShortCode(); // e.g., 'abc123'

const [link] = await db.insert(links).values({
  shortCode,
  originalUrl: 'https://example.com/very/long/url',
  title: 'My Link',
  userId: 'user123',
  workspaceId: workspaceId,
}).returning();
```

### Track Click Event
```typescript
import { clicks, links, eq, sql } from '@manacore/uload-database';
import { hashIp } from './utils';

// 1. Record click
await db.insert(clicks).values({
  linkId: link.id,
  ipHash: hashIp(request.ip),
  userAgent: request.headers['user-agent'],
  browser: parsedUA.browser,
  deviceType: parsedUA.deviceType,
  os: parsedUA.os,
  country: geoData.country,
  city: geoData.city,
  referer: request.headers.referer,
  utmSource: query.utm_source,
  utmMedium: query.utm_medium,
  utmCampaign: query.utm_campaign,
});

// 2. Increment click count
await db
  .update(links)
  .set({ clickCount: sql`${links.clickCount} + 1` })
  .where(eq(links.id, link.id));
```

### Get Link with Analytics
```typescript
import { eq, desc } from '@manacore/uload-database';

// Get link with click history
const linkWithClicks = await db.query.links.findFirst({
  where: eq(links.shortCode, shortCode),
  with: {
    clicks: {
      orderBy: desc(clicks.clickedAt),
      limit: 100,
    },
  },
});

// Get link with tags
const linkWithTags = await db.query.links.findFirst({
  where: eq(links.id, linkId),
  with: {
    linkTags: {
      with: {
        tag: true,
      },
    },
  },
});
```

### Workspace Links
```typescript
import { eq, and, desc } from '@manacore/uload-database';

// Get all links in workspace
const workspaceLinks = await db
  .select()
  .from(links)
  .where(
    and(
      eq(links.workspaceId, workspaceId),
      eq(links.isActive, true)
    )
  )
  .orderBy(desc(links.createdAt));
```

### Click Analytics
```typescript
import { sql, eq, gte } from '@manacore/uload-database';

// Get click stats for last 30 days
const thirtyDaysAgo = new Date();
thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

const clickStats = await db
  .select({
    totalClicks: sql<number>`COUNT(*)`,
    uniqueCountries: sql<number>`COUNT(DISTINCT ${clicks.country})`,
    desktopClicks: sql<number>`COUNT(*) FILTER (WHERE ${clicks.deviceType} = 'desktop')`,
    mobileClicks: sql<number>`COUNT(*) FILTER (WHERE ${clicks.deviceType} = 'mobile')`,
  })
  .from(clicks)
  .where(
    and(
      eq(clicks.linkId, linkId),
      gte(clicks.clickedAt, thirtyDaysAgo)
    )
  );

// Get top referrers
const topReferrers = await db
  .select({
    referer: clicks.referer,
    count: sql<number>`COUNT(*)`,
  })
  .from(clicks)
  .where(eq(clicks.linkId, linkId))
  .groupBy(clicks.referer)
  .orderBy(desc(sql`COUNT(*)`))
  .limit(10);

// Geographic distribution
const geoDistribution = await db
  .select({
    country: clicks.country,
    city: clicks.city,
    count: sql<number>`COUNT(*)`,
  })
  .from(clicks)
  .where(eq(clicks.linkId, linkId))
  .groupBy(clicks.country, clicks.city)
  .orderBy(desc(sql`COUNT(*)`));
```

### Tag Operations
```typescript
import { tags, linkTags, inArray } from '@manacore/uload-database';

// Create and attach tag to link
const [tag] = await db.insert(tags).values({
  name: 'Marketing',
  slug: 'marketing',
  color: '#FF5733',
  userId: 'user123',
}).returning();

await db.insert(linkTags).values({
  linkId: link.id,
  tagId: tag.id,
});

// Get all links with specific tag
const linksWithTag = await db.query.tags.findFirst({
  where: eq(tags.slug, 'marketing'),
  with: {
    linkTags: {
      with: {
        link: true,
      },
    },
  },
});

// Increment tag usage count
await db
  .update(tags)
  .set({ usageCount: sql`${tags.usageCount} + 1` })
  .where(eq(tags.id, tag.id));
```

### Access Control Validation
```typescript
import { eq } from '@manacore/uload-database';
import bcrypt from 'bcrypt';

async function validateLinkAccess(
  shortCode: string,
  password?: string
): Promise<{ valid: boolean; reason?: string }> {
  const link = await db.query.links.findFirst({
    where: eq(links.shortCode, shortCode),
  });

  if (!link) return { valid: false, reason: 'NOT_FOUND' };
  if (!link.isActive) return { valid: false, reason: 'INACTIVE' };

  // Check expiration
  if (link.expiresAt && new Date() > link.expiresAt) {
    return { valid: false, reason: 'EXPIRED' };
  }

  // Check click limit
  if (link.maxClicks && link.clickCount >= link.maxClicks) {
    return { valid: false, reason: 'CLICK_LIMIT_REACHED' };
  }

  // Check password
  if (link.password) {
    if (!password) return { valid: false, reason: 'PASSWORD_REQUIRED' };
    const isValid = await bcrypt.compare(password, link.password);
    if (!isValid) return { valid: false, reason: 'INVALID_PASSWORD' };
  }

  return { valid: true };
}
```

## Multi-Tenant Patterns

### Personal Workspace
```typescript
// Every user gets a personal workspace on signup
const [workspace] = await db.insert(workspaces).values({
  name: `${user.name}'s Workspace`,
  slug: `${user.id}-personal`,
  type: 'personal',
  owner: user.id,
}).returning();
```

### Team Workspace
```typescript
// Team workspaces can have multiple users (via separate membership table)
const [teamWorkspace] = await db.insert(workspaces).values({
  name: 'Marketing Team',
  slug: 'marketing-team',
  type: 'team',
  owner: user.id, // Creator
}).returning();

// Links in team workspace are accessible to all members
const teamLinks = await db
  .select()
  .from(links)
  .where(eq(links.workspaceId, teamWorkspace.id));
```

## How to Use
```
"Read packages/uload-database/.agent/ and help me with..."
- Implementing link access control
- Optimizing click analytics queries
- Understanding multi-tenant architecture
- Adding new tag features
- Setting up workspace collaboration
- Privacy-conscious analytics tracking
- Debugging relational queries
```
