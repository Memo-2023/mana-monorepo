# PocketBase → PostgreSQL + Drizzle ORM Migration Guide

## ✅ Migration Status

- **Infrastructure:** ✅ Complete
- **Database Schema:** ✅ Complete (13 tables)
- **Test Route:** ✅ Complete (`/api/check-username`)
- **Remaining Routes:** 🔄 In Progress (~25 files)

---

## 📊 Database Schema

All 13 tables successfully migrated:

```
✅ users (21 columns) - User profiles with external auth support
✅ links (21 columns) - Short links with analytics
✅ clicks (15 columns) - Click analytics tracking
✅ accounts (8 columns) - Business/team accounts
✅ workspaces (7 columns) - Team workspaces
✅ tags (10 columns) - Link categorization
✅ link_tags (4 columns) - Link-to-tag junction table
✅ notifications (10 columns) - In-app notifications
✅ shared_access (8 columns) - Team member access
✅ pending_invitations (9 columns) - Email invitations
✅ feature_requests (8 columns) - Feature voting
✅ feature_votes (4 columns) - Vote tracking
✅ folders (5 columns) - Link organization
```

---

## 🔄 Migration Pattern: PocketBase → Drizzle

### Example: `/api/check-username`

#### **Before (PocketBase):**

```typescript
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url, locals }) => {
  const username = url.searchParams.get('username');

  try {
    // PocketBase query
    const existingUser = await locals.pb
      .collection('users')
      .getFirstListItem(`username="${username}"`);

    return json({ available: false });
  } catch (err) {
    // Not found = available
    return json({ available: true });
  }
};
```

#### **After (Drizzle ORM):**

```typescript
import { json } from '@sveltejs/kit';
import { users } from '$lib/db/schema';
import { eq } from 'drizzle-orm';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url, locals }) => {
  const username = url.searchParams.get('username');

  // Drizzle query
  const [existingUser] = await locals.db
    .select()
    .from(users)
    .where(eq(users.username, username))
    .limit(1);

  if (!existingUser) {
    return json({ available: true });
  }

  return json({ available: false });
};
```

---

## 📚 Common Query Patterns

### 1. **Simple SELECT (Find One)**

```typescript
// PocketBase
const user = await locals.pb.collection('users').getFirstListItem(`email="${email}"`);

// Drizzle
const [user] = await locals.db
  .select()
  .from(users)
  .where(eq(users.email, email))
  .limit(1);
```

### 2. **SELECT with Multiple Conditions**

```typescript
// PocketBase
const links = await locals.pb.collection('links').getList(1, 50, {
  filter: `user_id="${userId}" && is_active=true`,
  sort: '-created'
});

// Drizzle
import { and, desc } from 'drizzle-orm';

const linksData = await locals.db
  .select()
  .from(links)
  .where(and(
    eq(links.userId, userId),
    eq(links.isActive, true)
  ))
  .orderBy(desc(links.createdAt))
  .limit(50);
```

### 3. **INSERT**

```typescript
// PocketBase
const newLink = await locals.pb.collection('links').create({
  short_code: 'abc123',
  original_url: 'https://example.com',
  user_id: userId
});

// Drizzle
const [newLink] = await locals.db
  .insert(links)
  .values({
    shortCode: 'abc123',
    originalUrl: 'https://example.com',
    userId: userId
  })
  .returning();
```

### 4. **UPDATE**

```typescript
// PocketBase
await locals.pb.collection('links').update(linkId, {
  is_active: false
});

// Drizzle
await locals.db
  .update(links)
  .set({
    isActive: false,
    updatedAt: new Date()
  })
  .where(eq(links.id, linkId));
```

### 5. **DELETE**

```typescript
// PocketBase
await locals.pb.collection('links').delete(linkId);

// Drizzle
await locals.db
  .delete(links)
  .where(eq(links.id, linkId));
```

### 6. **COUNT**

```typescript
// PocketBase
const result = await locals.pb.collection('links').getList(1, 1, {
  filter: `user_id="${userId}"`
});
const count = result.totalItems;

// Drizzle
import { count } from 'drizzle-orm';

const [{ count: linkCount }] = await locals.db
  .select({ count: count() })
  .from(links)
  .where(eq(links.userId, userId));
```

### 7. **JOIN (Relations)**

```typescript
// PocketBase
const links = await locals.pb.collection('links').getList(1, 50, {
  expand: 'user'
});

// Drizzle
const linksWithUsers = await locals.db
  .select({
    link: links,
    user: users
  })
  .from(links)
  .leftJoin(users, eq(links.userId, users.id))
  .limit(50);
```

### 8. **Transactions**

```typescript
// PocketBase - No native transactions

// Drizzle
await locals.db.transaction(async (tx) => {
  // Insert click
  await tx.insert(clicks).values({
    linkId: link.id,
    ipHash: hashIp(ip)
  });

  // Increment click count
  await tx
    .update(links)
    .set({ clickCount: sql`${links.clickCount} + 1` })
    .where(eq(links.id, link.id));
});
```

### 9. **LIKE Search**

```typescript
// PocketBase
const links = await locals.pb.collection('links').getList(1, 50, {
  filter: `title~"${searchTerm}"`
});

// Drizzle
import { ilike } from 'drizzle-orm';

const linksData = await locals.db
  .select()
  .from(links)
  .where(ilike(links.title, `%${searchTerm}%`))
  .limit(50);
```

### 10. **Aggregation**

```typescript
// PocketBase - Limited aggregation support

// Drizzle
import { count, sum, avg } from 'drizzle-orm';

const stats = await locals.db
  .select({
    totalClicks: count(clicks.id),
    uniqueCountries: sql<number>`count(DISTINCT ${clicks.country})`,
    avgClicksPerLink: avg(links.clickCount)
  })
  .from(clicks)
  .leftJoin(links, eq(clicks.linkId, links.id))
  .where(eq(links.userId, userId));
```

---

## 🔑 Key Differences

### **1. Error Handling**

**PocketBase:**
- Throws on not found (requires try/catch)
- Limited error types

**Drizzle:**
- Returns empty array `[]` on not found
- More granular error handling

### **2. Naming Conventions**

**PocketBase:**
- Snake case: `user_id`, `is_active`, `created`

**Drizzle:**
- Camel case: `userId`, `isActive`, `createdAt`

### **3. Relations**

**PocketBase:**
- `expand` parameter for relations

**Drizzle:**
- Explicit `leftJoin` / `innerJoin`
- More control over query structure

### **4. Timestamps**

**PocketBase:**
- Auto-managed `created` and `updated`

**Drizzle:**
- Manual: `createdAt: timestamp('created_at').defaultNow()`
- Must update `updatedAt` manually

---

## 🚀 Migration Checklist for Each Route

1. **Import Drizzle Schema & Operators**
   ```typescript
   import { users, links, clicks } from '$lib/db/schema';
   import { eq, and, desc, count } from 'drizzle-orm';
   ```

2. **Replace `locals.pb` with `locals.db`**
   ```typescript
   // Before: locals.pb.collection('users')
   // After:  locals.db.select().from(users)
   ```

3. **Convert Filter Syntax**
   ```typescript
   // Before: filter: `user_id="${userId}" && is_active=true`
   // After:  where(and(eq(links.userId, userId), eq(links.isActive, true)))
   ```

4. **Handle Empty Results**
   ```typescript
   // Before: try/catch for not found
   // After:  if (!result || result.length === 0)
   ```

5. **Update Naming Convention**
   ```typescript
   // Before: short_code, user_id, is_active
   // After:  shortCode, userId, isActive
   ```

6. **Add `.returning()` for Inserts**
   ```typescript
   const [newRecord] = await locals.db
     .insert(links)
     .values({...})
     .returning();  // ← Important!
   ```

7. **Test Thoroughly**
   - Test with existing data
   - Test with missing data
   - Test edge cases

---

## 📝 Routes to Migrate

### **High Priority (Core Functionality)**

- [ ] `src/routes/w/[workspace]/[...code]/+page.server.ts` - Link redirect with click tracking
- [ ] `src/routes/(app)/my/links/+page.server.ts` - Link management CRUD
- [ ] `src/routes/(app)/my/tags/+page.server.ts` - Tag management
- [ ] `src/routes/(app)/settings/+page.server.ts` - User settings
- [ ] `src/routes/p/[username]/+page.server.ts` - Public profile

### **Medium Priority (Features)**

- [ ] `src/routes/(app)/settings/team/+page.server.ts` - Team management
- [ ] `src/routes/(app)/settings/workspaces/+page.server.ts` - Workspace management
- [ ] `src/routes/api/vote/+server.ts` - Feature voting
- [ ] `src/routes/register/+page.server.ts` - User registration
- [ ] `src/routes/login/+page.server.ts` - User login

### **Low Priority (Admin/Testing)**

- [ ] `src/routes/api/test-pb/+server.ts` - Can be removed
- [ ] `src/routes/api/verify/+server.ts` - Email verification

---

## 🧪 Testing Strategy

### **1. Unit Tests**

Create test files for each migrated route:

```typescript
// src/routes/api/check-username/+server.test.ts
import { describe, it, expect } from 'vitest';
import { GET } from './+server';

describe('/api/check-username', () => {
  it('returns available for new usernames', async () => {
    // Test implementation
  });
});
```

### **2. Database Seeding**

```sql
-- Insert test data
INSERT INTO users (email, username, name) VALUES
  ('test1@example.com', 'testuser1', 'Test User 1'),
  ('test2@example.com', 'testuser2', 'Test User 2');

INSERT INTO links (short_code, original_url, user_id) VALUES
  ('test123', 'https://example.com', (SELECT id FROM users WHERE username='testuser1'));
```

### **3. Manual Testing Checklist**

- [ ] Create new link
- [ ] Update existing link
- [ ] Delete link
- [ ] Click tracking
- [ ] Tag management
- [ ] User profile updates
- [ ] Team invitations

---

## 🎯 Next Steps

1. **Migrate High Priority Routes** - Start with link redirect and management
2. **Implement External Auth** - Replace PocketBase auth with external provider
3. **Remove PocketBase Code** - Delete `backend/`, `pb_hooks/`, `pocketbase` binary
4. **Update Documentation** - Update CLAUDE.md and README
5. **Deploy to Production** - Push to Hetzner VPS

---

## 📞 Support

If you encounter issues during migration:

1. Check this guide for common patterns
2. Review the test route: `/api/check-username`
3. Consult Drizzle ORM docs: https://orm.drizzle.team/
4. Check PostgreSQL logs: `npm run docker:logs`

---

**Last Updated:** 2025-11-19
**Migration Progress:** ~5% Complete (1 of ~25 routes)
