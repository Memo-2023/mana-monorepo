import type { VisibilityLevel } from './types';

/**
 * Default visibility for newly-created records — always 'space'.
 *
 * Why not 'private' for personal spaces even though the original plan
 * read "personal → private": it would fight the existing 2-tier
 * visibility filter in `apps/mana/apps/web/src/lib/data/scope/
 * visibility.ts`, which treats `'private'` records as "only the author
 * sees them, even inside the same space". That's the semantic the
 * broader codebase already depends on — queries like `useAllTasks()`
 * apply it at read time. Stamping `'private'` as the default here
 * causes records to disappear from module sub-routes during auth
 * bootstrap (authorId stamped with the guest-sentinel, later filtered
 * out once the real user id resolves).
 *
 * In a personal space there's only one member, so 'space' and 'private'
 * are equivalent in effect — both mean "only you see it". In
 * multi-member spaces, 'space' means "fellow members can see it"
 * which is the desired default for collaboration. Users who want a
 * genuine "draft, hide from fellow members" state flip explicitly
 * to `'private'` via the VisibilityPicker.
 *
 * The parameter is retained for forward-compatibility — a future
 * space type (e.g. 'restricted' invite-only) might want a different
 * default without changing every call site.
 */
export function defaultVisibilityFor(_spaceType: string | null | undefined): VisibilityLevel {
	return 'space';
}
