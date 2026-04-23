# Visibility — Adding Visibility Control to a Module

How to adopt the unified visibility/privacy system for a module. Applies to every public-capable module (see `docs/plans/visibility-system.md` for the full list).

## TL;DR

Adding visibility control needs edits in **five places**:

1. **Dexie + mana-sync schema** — add `visibility`, `unlistedToken`, `visibilityChangedAt`, `visibilityChangedBy` columns
2. **`types.ts`** — add `visibility: VisibilityLevel` to the local record type + converter
3. **`stores/*.svelte.ts`** — add `setVisibility()` method + stamp default on create
4. **Detail-View `.svelte`** — drop `<VisibilityPicker>` into the header
5. **Embed resolver (if applicable)** — gate on `canEmbedOnWebsite`

Legacy `isPublic` flags are migrated in the same PR: `isPublic=true → visibility='public'`, else `'private'`.

## Architecture

```
┌──────────────────────────────────────────────────────────┐
│ @mana/shared-privacy                                      │
│   VisibilityLevel = 'private'|'space'|'unlisted'|'public' │
│   VisibilityLevelSchema   (zod)                           │
│   defaultVisibilityFor(spaceType)                         │
│   canEmbedOnWebsite / isReachableByLink / …  (predicates) │
│   generateUnlistedToken()                                 │
│   <VisibilityPicker>                                      │
└───────────┬─────────────────────────────────┬────────────┘
            │                                 │
   ┌────────▼────────┐              ┌─────────▼──────────────┐
   │ Module stores    │              │ website/embeds.ts       │
   │  - setVisibility │              │  - filter by predicate  │
   │  - default on    │              │  - decrypt + inline     │
   │    create        │              │    matching records     │
   └──────────────────┘              └─────────────────────────┘
            │
   ┌────────▼────────────┐
   │ Detail-View          │
   │  <VisibilityPicker   │
   │    level={...}       │
   │    onChange={...} /> │
   └──────────────────────┘
```

`visibility` stays **plaintext** (not in the encryption registry) so RLS predicates and publish resolvers can read it without the user's master key.

## Step-by-step

### 1. Schema

**Dexie** — bump the module's table in `apps/mana/apps/web/src/lib/data/database.ts` (soft-migration):

```ts
// v{N+1}: add visibility
{
  version: N + 1,
  stores: {
    myTable: 'id, spaceId, visibility, createdAt, …',  // add visibility to indexes if you'll query on it
  },
  upgrade: async (tx) => {
    await tx.table('myTable').toCollection().modify((r) => {
      r.visibility = 'private';
    });
  },
}
```

**Postgres** — add columns to the mana-sync schema for this module (find the drizzle schema under `services/mana-sync/` or the per-module schema in `apps/api/`):

```sql
alter table <schema>.<table>
  add column visibility text not null default 'private',
  add column unlisted_token text,
  add column visibility_changed_at timestamptz,
  add column visibility_changed_by text;
```

Partial index for the common embed query:

```sql
create index <table>_public_idx on <schema>.<table> (space_id)
  where visibility = 'public';
```

### 2. Local types

```ts
// types.ts
import type { VisibilityLevel } from '@mana/shared-privacy';

export interface LocalMyRecord {
	id: string;
	// ... existing fields ...
	visibility: VisibilityLevel;
	unlistedToken?: string;
	visibilityChangedAt?: string;
	visibilityChangedBy?: string;
}
```

Update `toMyRecord()` converter in `queries.ts` to forward the fields.

### 3. Store

```ts
// stores/my.svelte.ts
import {
	VisibilityLevelSchema,
	defaultVisibilityFor,
	generateUnlistedToken,
	type VisibilityLevel,
} from '@mana/shared-privacy';
import { emitDomainEvent } from '$lib/data/events';
import { activeSpace } from '$lib/stores/space.svelte';

export const myStore = {
	async createRecord(input: CreateInput) {
		const now = new Date().toISOString();
		const record: LocalMyRecord = {
			id: crypto.randomUUID(),
			// ...
			visibility: defaultVisibilityFor(activeSpace.current?.type),
			createdAt: now,
			updatedAt: now,
		};
		await myTable.add(record);
		return record;
	},

	async setVisibility(id: string, next: VisibilityLevel) {
		const existing = await myTable.get(id);
		if (!existing) throw new Error(`Record ${id} not found`);
		const before = existing.visibility;
		if (before === next) return;

		const now = new Date().toISOString();
		const patch: Partial<LocalMyRecord> = {
			visibility: next,
			visibilityChangedAt: now,
			visibilityChangedBy: currentUserId(),
			updatedAt: now,
		};
		// Mint a fresh token on first transition to unlisted; wipe on leaving.
		if (next === 'unlisted' && !existing.unlistedToken) {
			patch.unlistedToken = generateUnlistedToken();
		} else if (next !== 'unlisted' && existing.unlistedToken) {
			patch.unlistedToken = undefined;
		}
		await myTable.update(id, patch);

		emitDomainEvent('VisibilityChanged', '<appId>', '<collection>', id, {
			recordId: id,
			collection: '<collection>',
			before,
			after: next,
		});
	},
};
```

Register the `VisibilityChanged` event type in `apps/mana/apps/web/src/lib/data/events/catalog.ts` once (not per-module); the payload comes from `@mana/shared-privacy`.

### 4. Detail-view UI

```svelte
<script lang="ts">
	import { VisibilityPicker, type VisibilityLevel } from '@mana/shared-privacy';
	import { myStore } from '../stores/my.svelte';
	import type { MyRecord } from '../types';

	let { record }: { record: MyRecord } = $props();

	async function onVisibilityChange(next: VisibilityLevel) {
		await myStore.setVisibility(record.id, next);
	}
</script>

<header>
	<h1>{record.title}</h1>
	<VisibilityPicker level={record.visibility} onChange={onVisibilityChange} />
</header>
```

For list views, show a small lock/globe icon next to items whose visibility differs from the space default. `VISIBILITY_METADATA[level].icon` gives the Phosphor icon name.

### 5. Embed resolver (only for public-embeddable modules)

```ts
// apps/mana/apps/web/src/lib/modules/website/embeds.ts
import { canEmbedOnWebsite } from '@mana/shared-privacy';

async function resolveMyModule(props): Promise<EmbedItem[]> {
	let records = await db.table('myTable').toArray();
	records = records.filter((r) => !r.deletedAt && canEmbedOnWebsite(r.visibility ?? 'private'));
	// User filters (tags, status, date window) stack ON TOP — never replace.
	// ...
	const decrypted = await decryptRecords('myTable', records);
	return decrypted.map(toEmbedItem);
}
```

Register the new source in `packages/website-blocks/src/moduleEmbed/schema.ts` under `EmbedSourceSchema`.

### 6. Legacy `isPublic` migration (if your module had one)

In the same PR that adds visibility:

```ts
// Dexie upgrade step
await tx
	.table('myTable')
	.toCollection()
	.modify((r) => {
		r.visibility = r.isPublic === true ? 'public' : 'private';
		delete r.isPublic;
	});
```

And the corresponding Postgres migration:

```sql
update <schema>.<table> set visibility = 'public' where is_public = true;
alter table <schema>.<table> drop column is_public;
```

## Checklist before PR

- [ ] Dexie schema bumped, upgrade step migrates existing rows to `'private'` (or maps `isPublic`)
- [ ] Postgres migration adds `visibility`, `unlisted_token`, `visibility_changed_at`, `visibility_changed_by`
- [ ] Partial index on `(space_id) where visibility = 'public'` (if module is embeddable)
- [ ] `visibility` **not** added to the encryption registry
- [ ] Default on create via `defaultVisibilityFor(space.type)`
- [ ] Store has `setVisibility()` + emits `VisibilityChanged`
- [ ] `<VisibilityPicker>` in the detail view
- [ ] Embed resolver (if applicable) gates on `canEmbedOnWebsite`
- [ ] Tests: store `setVisibility` flips correctly; resolver filters out non-public records
- [ ] `validate:all` passes

## Reference

- Plan + rationale: [`docs/plans/visibility-system.md`](../../docs/plans/visibility-system.md)
- Package: `packages/shared-privacy/`
