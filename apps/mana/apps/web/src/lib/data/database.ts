/**
 * Unified Dexie Database — Single IndexedDB for all Mana apps.
 *
 * All collections from all app modules are registered in one database.
 * Table names that collide across apps are prefixed (e.g., pictureTags, storageTags).
 *
 * Sync routing (which table belongs to which appId, which tables are renamed
 * for the backend) lives in `module-registry.ts`. Each module owns its own
 * `module.config.ts` and the registry aggregates them — so adding a new
 * module is one file edit, not three.
 *
 * Schema migrations (db.version(N).stores()) intentionally remain hardcoded
 * here because they are versioned snapshots that must never change after
 * shipping — they are not derived from the registry.
 */

import Dexie, { type EntityTable } from 'dexie';
import { trackFirstContent } from '$lib/stores/funnel-tracking';
import { fire as fireTrigger } from '$lib/triggers/registry';
import { checkInlineSuggestion } from '$lib/triggers/inline-suggest';
import { getEffectiveUserId } from './current-user';
import { isQuotaError, notifyQuotaExceeded } from './quota-detect';
import {
	SYNC_APP_MAP,
	TABLE_TO_SYNC_NAME,
	TABLE_TO_APP,
	SYNC_NAME_TO_TABLE,
	toSyncName,
	fromSyncName,
} from './module-registry';

// Re-export the registry-derived maps so existing consumers
// (sync.ts, quota.ts, guest-migration.ts, etc.) keep working unchanged.
export {
	SYNC_APP_MAP,
	TABLE_TO_SYNC_NAME,
	TABLE_TO_APP,
	SYNC_NAME_TO_TABLE,
	toSyncName,
	fromSyncName,
};

// ─── Database ──────────────────────────────────────────────

export const db = new Dexie('mana');

// Single canonical schema. The pre-launch cleanup collapsed historical
// versions 1–10 into this one block — see docs/PRE_LAUNCH_CLEANUP.md for
// rationale. After the system goes live, any further schema change MUST
// be added as a new `db.version(N)` block; never edit this one.
db.version(1).stores({
	// ─── Sync Infrastructure (local-only, NOT in SYNC_APP_MAP) ───
	_pendingChanges: '++id, appId, collection, recordId, createdAt',
	_syncMeta: '[appId+collection]',
	_eventsTombstones: 'id, token, attempts, createdAt',
	_activity:
		'++id, createdAt, appId, collection, recordId, op, [appId+createdAt], [collection+recordId], userId',

	// ─── Core / Mana (appId: 'mana') ───
	userSettings: 'id, key',
	dashboardConfigs: 'id',
	workbenchScenes: 'id, order',
	automations: 'id, sourceApp, targetApp, enabled, [sourceApp+sourceCollection]',

	// ─── Todo (appId: 'todo') ───
	// `scheduledBlockId` is the link to the unified timeBlocks table.
	tasks:
		'id, dueDate, isCompleted, priority, order, projectId, scheduledBlockId, [isCompleted+order], [projectId+order]',
	todoProjects: 'id, order, isArchived, isDefault',
	taskLabels: 'id, taskId, labelId', // junction to globalTags (labelId = tagId)
	reminders: 'id, taskId',
	boardViews: 'id, order, groupBy',

	// ─── Calendar (appId: 'calendar') ───
	// Scheduling fields (startDate / endDate / allDay) live on the linked
	// timeBlocks row, not on `events` itself — see time-blocks/service.ts.
	calendars: 'id, isDefault, isVisible',
	events: 'id, calendarId, timeBlockId',
	eventTags: 'id, eventId, tagId, [eventId+tagId]',

	// ─── Contacts (appId: 'contacts') ───
	contacts: 'id, firstName, lastName, email, company, isFavorite, isArchived',
	contactTags: 'id, contactId, tagId, [contactId+tagId]',

	// ─── Chat (appId: 'chat') ───
	conversations: 'id, isArchived, isPinned, spaceId, templateId, updatedAt',
	messages: 'id, conversationId, sender, [conversationId+sender]',
	chatTemplates: 'id, isDefault',
	conversationTags: 'id, conversationId, tagId, [conversationId+tagId]',

	// ─── Picture (appId: 'picture') ───
	images: 'id, isFavorite, isPublic, isArchived, prompt, updatedAt',
	boards: 'id, isPublic',
	boardItems: 'id, boardId, itemType, zIndex, [boardId+zIndex]',
	imageTags: 'id, imageId, tagId, [imageId+tagId]', // junction to globalTags

	// ─── Cards (appId: 'cards') ───
	cardDecks: 'id, isPublic',
	cards: 'id, deckId, difficulty, nextReview, order, [deckId+order]',
	deckTags: 'id, deckId, tagId, [deckId+tagId]',

	// ─── Who (appId: 'who') ───
	// LLM character-guessing game. whoGames holds one row per session
	// (status, deck, character id, message count); whoMessages holds the
	// chat scrollback. Standard plaintext index pattern: id, FK, status,
	// timestamps for sort/filter; content + revealedName encrypted.
	whoGames: 'id, status, deckId, startedAt, finishedAt, [status+startedAt]',
	whoMessages: 'id, gameId, sender, createdAt, [gameId+createdAt]',

	// ─── Zitare (appId: 'zitare') ───
	zitareFavorites: 'id, quoteId',
	zitareLists: 'id',
	zitareListTags: 'id, listId, tagId, [listId+tagId]',

	// ─── Music (appId: 'music') ───
	songs: 'id, artist, album, genre, favorite, title, updatedAt',
	mukkePlaylists: 'id, name, updatedAt',
	playlistSongs: 'id, playlistId, songId, sortOrder, [playlistId+sortOrder]',
	mukkeProjects: 'id, title, songId',
	markers: 'id, beatId, type, sortOrder',
	songTags: 'id, songId, tagId, [songId+tagId]',

	// ─── Storage (appId: 'storage') ───
	files: 'id, parentFolderId, mimeType, isFavorite, isDeleted, name',
	storageFolders: 'id, parentFolderId, path, depth, isFavorite, isDeleted',
	fileTags: 'id, fileId, tagId, [fileId+tagId]', // junction to globalTags

	// ─── Presi (appId: 'presi') ───
	presiDecks: 'id, isPublic, updatedAt',
	slides: 'id, deckId, order, [deckId+order]',
	presiDeckTags: 'id, deckId, tagId, [deckId+tagId]',

	// ─── Inventar (appId: 'inventar') ───
	invCollections: 'id, order, templateId',
	invItems: 'id, collectionId, locationId, categoryId, status, name, [collectionId+order]',
	invLocations: 'id, parentId, path, depth, order',
	invCategories: 'id, parentId, order',
	invItemTags: 'id, itemId, tagId, [itemId+tagId]',

	// ─── Photos (appId: 'photos') ───
	albums: 'id, isAutoGenerated, name',
	albumItems: 'id, albumId, mediaId, sortOrder, [albumId+sortOrder]',
	photoFavorites: 'id, mediaId',
	photoMediaTags: 'id, mediaId, tagId, [mediaId+tagId]', // junction to globalTags

	// ─── SkillTree (appId: 'skilltree') ───
	skills: 'id, branch, parentId, level',
	activities: 'id, skillId, timestamp',
	achievements: 'id, key, unlockedAt',
	skillTags: 'id, skillId, tagId, [skillId+tagId]',

	// ─── CityCorners (appId: 'citycorners') ───
	cities: 'id, slug, country, name',
	ccLocations: 'id, cityId, category, name',
	ccFavorites: 'id, locationId',
	ccLocationTags: 'id, locationId, tagId, [locationId+tagId]',

	// ─── Times (appId: 'times') ───
	// Like calendar events, time entries store their scheduling on the
	// linked timeBlocks row, not on the row itself.
	timeClients: 'id, order, isArchived, shortCode',
	timeProjects: 'id, clientId, isArchived, isBillable, guildId, visibility, order',
	timeEntries: 'id, projectId, clientId, timeBlockId, guildId, visibility',
	timeTemplates: 'id, usageCount, lastUsedAt, projectId',
	timeSettings: 'id',
	timeAlarms: 'id, enabled, time',
	timeCountdownTimers: 'id, status',
	timeWorldClocks: 'id, sortOrder, timezone',
	entryTags: 'id, entryId, tagId, [entryId+tagId]',

	// ─── Context (appId: 'context') ───
	contextSpaces: 'id, pinned, prefix',
	documents: 'id, spaceId, type, pinned, title, [spaceId+type], updatedAt',
	documentTags: 'id, documentId, tagId, [documentId+tagId]',

	// ─── Questions (appId: 'questions') ───
	qCollections: 'id, sortOrder, isDefault',
	questions: 'id, collectionId, status, priority, [collectionId+status]',
	answers: 'id, questionId, isAccepted',
	questionTags: 'id, questionId, tagId, [questionId+tagId]',

	// ─── NutriPhi (appId: 'nutriphi') ───
	meals: 'id, date, mealType, [date+mealType]',
	goals: 'id',
	nutriFavorites: 'id, mealType, usageCount',
	mealTags: 'id, mealId, tagId, [mealId+tagId]',

	// ─── Planta (appId: 'planta') ───
	plants: 'id, isActive, healthStatus',
	plantPhotos: 'id, plantId, isPrimary, [plantId+isPrimary]',
	wateringSchedules: 'id, plantId, nextWateringAt',
	wateringLogs: 'id, plantId, wateredAt',
	plantTags: 'id, plantId, tagId, [plantId+tagId]',

	// ─── uLoad (appId: 'uload') ───
	links: 'id, shortCode, isActive, folderId, order, clickCount, [folderId+order], [isActive+order]',
	uloadTags: 'id, slug, name',
	uloadFolders: 'id, order',
	linkTags: 'id, linkId, tagId, [linkId+tagId]',

	// ─── Calc (appId: 'calc') ───
	calculations: 'id, mode',
	savedFormulas: 'id, mode, name',

	// ─── Moodlit (appId: 'moodlit') ───
	moods: 'id, name, animation, isDefault',
	sequences: 'id, name',
	moodTags: 'id, moodId, tagId, [moodId+tagId]',

	// ─── Memoro (appId: 'memoro') ───
	memos: 'id, processingStatus, isArchived, isPinned, language, [isArchived+createdAt]',
	memories: 'id, memoId',
	memoTags: 'id, memoId, tagId', // junction to globalTags
	memoroSpaces: 'id, ownerId',
	spaceMembers: 'id, spaceId, userId',
	memoSpaces: 'id, memoId, spaceId',

	// ─── Guides (appId: 'guides') ───
	guides: 'id, category, difficulty, collectionId, tags',
	sections: 'id, guideId, order',
	steps: 'id, guideId, sectionId, order, [guideId+order]',
	guideCollections: 'id',
	runs: 'id, guideId, startedAt, completedAt',
	guideTags: 'id, guideId, tagId, [guideId+tagId]',

	// ─── Playground (appId: 'playground') ───
	// No persistent data — stateless LLM playground

	// ─── Habits (appId: 'habits') ───
	habits: 'id, order, isArchived, color',
	habitLogs: 'id, habitId, timeBlockId, [habitId+timeBlockId]',

	// ─── Dreams (appId: 'dreams') ───
	dreams: 'id, dreamDate, mood, isLucid, isPinned, isArchived, updatedAt',
	dreamSymbols: 'id, name, count, updatedAt',
	dreamTags: 'id, dreamId, tagId, [dreamId+tagId]',

	// ─── Cycles (appId: 'cycles') ───
	cycles: 'id, startDate, endDate, isPredicted, isArchived, updatedAt',
	cycleDayLogs: 'id, logDate, cycleId, flow, [cycleId+logDate]',
	cycleSymptoms: 'id, name, category, count, updatedAt',

	// ─── Social Events (appId: 'events') ───
	// `socialEvents` is named distinctly to avoid colliding with calendar.events.
	socialEvents: 'id, status, timeBlockId, hostContactId, isPublished, [status+createdAt]',
	eventGuests: 'id, eventId, contactId, rsvpStatus, [eventId+rsvpStatus], [eventId+contactId]',
	eventInvitations: 'id, eventId, guestId, channel, [eventId+guestId]',
	// Bring-list ("wer bringt was?") — assignedGuestId points at a local
	// guest the host picked manually; claimedByName is set by a public
	// RSVP visitor who reserved the item from the share-link page.
	eventItems: 'id, eventId, assignedGuestId, done, order, [eventId+order], [eventId+done]',

	// ─── Notes (appId: 'notes') ───
	notes: 'id, isPinned, isArchived, color, title, updatedAt',
	noteTags: 'id, noteId, tagId, [noteId+tagId]',

	// ─── Finance (appId: 'finance') ───
	transactions: 'id, type, categoryId, date, amount, [date+type], [categoryId+date]',
	financeCategories: 'id, type, order',
	budgets: 'id, categoryId, month, [month+categoryId]',

	// ─── Places (appId: 'places') ───
	places: 'id, name, category, isFavorite, isArchived, latitude, longitude',
	locationLogs: 'id, placeId, timestamp, [placeId+timestamp]',
	placeTags: 'id, placeId, tagId, [placeId+tagId]',

	// ─── Playground (appId: 'playground') ───
	// Saved system-prompt snippets. `name` IS encrypted but no .where('name')
	// call site exists — same rationale as files.name / places.name above.
	playgroundSnippets: 'id, isPinned, order, [isPinned+order]',

	// ─── TimeBlocks (appId: 'timeblocks') — unified time model ───
	// Cross-cutting scheduling table that calendar events, time entries,
	// habit logs and scheduled tasks all project into. See PROD_READINESS
	// notes in time-blocks/service.ts for the design rationale.
	timeBlocks:
		'id, startDate, kind, type, sourceModule, sourceId, parentBlockId, [sourceModule+sourceId], [type+startDate], [kind+startDate], [parentBlockId+recurrenceDate]',
	timeBlockTags: 'id, blockId, tagId, [blockId+tagId]',

	// ─── Shared: Global Tags (appId: 'tags') ───
	globalTags: 'id, name, groupId',
	tagGroups: 'id',

	// ─── Shared: Links (appId: 'links') ───
	manaLinks: 'id, sourceAppId, sourceRecordId, targetAppId, targetRecordId',
});

// ─── Sync Routing ──────────────────────────────────────────
// SYNC_APP_MAP, TABLE_TO_SYNC_NAME, TABLE_TO_APP, SYNC_NAME_TO_TABLE,
// toSyncName() and fromSyncName() are now derived from per-module
// `module.config.ts` files via `module-registry.ts` (re-exported above).
// To register a new sync table: edit that module's config — no edits in
// this file are needed.

// ─── Change Tracking via Dexie Hooks ─────────────────────────
// Automatically records pending changes for every write to sync-relevant tables.
// This means module stores (taskTable.add(), etc.) don't need manual trackChange() calls.

/**
 * Tables that are currently having server changes applied. Hooks for tables
 * in this set skip pending-change tracking (sync loop guard) — but writes to
 * OTHER tables continue tracking normally, so a user typing into chat while
 * todo is syncing no longer silently drops the chat write.
 *
 * Replaces a single global boolean that previously caused a cross-app race:
 * one app's apply could swallow another app's writes for the duration.
 */
const _applyingTables = new Set<string>();

/**
 * Marks one or more tables as "currently applying server changes".
 * Returned dispose function MUST be called (use try/finally) to clear them.
 */
export function beginApplyingTables(tables: Iterable<string>): () => void {
	const added: string[] = [];
	for (const t of tables) {
		if (!_applyingTables.has(t)) {
			_applyingTables.add(t);
			added.push(t);
		}
	}
	return () => {
		for (const t of added) _applyingTables.delete(t);
	};
}

/** True when a write to `tableName` should bypass the pending-change hook. */
export function isApplyingTable(tableName: string): boolean {
	return _applyingTables.has(tableName);
}

const pendingChangesTable = db.table('_pendingChanges');

/**
 * Fire-and-forget pending-change writer that surfaces quota errors via the
 * QUOTA_EVENT bus. Without this wrapper, a full IndexedDB would silently
 * swallow the change-tracking entry while the user-visible write succeeded
 * — meaning the user types something, sees it, and the edit never syncs.
 *
 * The Dexie creating/updating hook itself is synchronous and cannot await
 * a recovery, so we just dispatch the event and let the UI / sync engine
 * decide what to do (e.g. surface a toast, run cleanupTombstones).
 *
 * IMPORTANT: Dexie hooks fire inside the calling write's implicit transaction
 * which only includes the user-facing table (e.g. `tasks`). Writing to
 * `_pendingChanges` from there hits `NotFoundError: object store not in
 * scope`. We defer the write to a microtask so it runs in a fresh
 * transaction after the user's commit lands.
 *
 * After the row lands, `pendingChangeListener` (set by sync.ts at startup)
 * is invoked with the change's appId so the unified sync engine can push
 * immediately. Without that listener, pending rows would only ever drain
 * on the next page reload via drainLeftoverPending.
 */
let pendingChangeListener: ((appId: string) => void) | null = null;

export function setPendingChangeListener(fn: ((appId: string) => void) | null): void {
	pendingChangeListener = fn;
}

function trackPendingChange(table: string, change: Record<string, unknown>): void {
	// setTimeout (not queueMicrotask) is required: Dexie binds the active
	// transaction to the current Zone via Promise scheduling, and a microtask
	// is still considered "inside" the transaction. setTimeout(0) breaks out
	// completely so the new add() spawns its own implicit transaction.
	setTimeout(() => {
		pendingChangesTable
			.add(change)
			.then(() => {
				const appId = change.appId;
				if (typeof appId === 'string' && pendingChangeListener) {
					pendingChangeListener(appId);
				}
			})
			.catch((err: unknown) => {
				if (isQuotaError(err)) {
					notifyQuotaExceeded({ table, op: 'pending-change', cleaned: 0, recovered: false });
				} else {
					console.error('[mana-sync] failed to record pending change:', err);
				}
			});
	}, 0);
}

/**
 * Append a row to the local activity log. Fire-and-forget, deferred via
 * setTimeout for the same reason as `trackPendingChange` (Dexie hook is
 * inside the user's transaction; we need a fresh one).
 *
 * Lives here in database.ts (rather than activity.ts) so it can share
 * the same `db` reference without causing an import cycle. The
 * `getRecentActivity` / `pruneActivityLog` read+cleanup APIs live in
 * activity.ts.
 *
 * Errors are swallowed: the activity log is a debugging convenience,
 * not load-bearing data, and surfacing the same QuotaError twice (once
 * for the real write, once for the activity row) would just spam the
 * user via the quota toast.
 */
function trackActivity(
	appId: string,
	collection: string,
	recordId: string,
	op: 'insert' | 'update' | 'delete'
): void {
	const row = {
		appId,
		collection,
		recordId,
		op,
		createdAt: new Date().toISOString(),
		userId: getEffectiveUserId(),
	};
	setTimeout(() => {
		db.table('_activity')
			.add(row)
			.catch(() => {
				/* best-effort, see jsdoc */
			});
	}, 0);
}

/**
 * Hidden field on every synced record holding per-field LWW timestamps.
 * Not indexed, not sent to the server in pending-change payloads.
 */
export const FIELD_TIMESTAMPS_KEY = '__fieldTimestamps';

function isInternalKey(key: string): boolean {
	return key === 'id' || key === FIELD_TIMESTAMPS_KEY;
}

for (const [appId, tables] of Object.entries(SYNC_APP_MAP)) {
	for (const tableName of tables) {
		const table = db.table(tableName);

		table.hook('creating', function (_primKey, obj) {
			if (_applyingTables.has(tableName)) return;
			const now = new Date().toISOString();

			// Auto-stamp the active user. Module stores never set userId themselves,
			// preventing accidental impersonation and removing all hardcoded
			// 'guest'/'local' fallbacks scattered across query files.
			const objRecord = obj as Record<string, unknown>;
			if (objRecord.userId === undefined || objRecord.userId === null) {
				objRecord.userId = getEffectiveUserId();
			}

			// Stamp every real field with the create-time so future LWW comparisons
			// have a baseline. Mutates obj in place — Dexie persists the mutation.
			const ft: Record<string, string> = {};
			for (const key of Object.keys(obj)) {
				if (isInternalKey(key)) continue;
				ft[key] = now;
			}
			objRecord[FIELD_TIMESTAMPS_KEY] = ft;

			// Build payload for pending-change WITHOUT the internal timestamp map
			const { [FIELD_TIMESTAMPS_KEY]: _omit, ...dataForSync } = obj as Record<string, unknown>;

			trackPendingChange(tableName, {
				appId,
				collection: tableName,
				recordId: obj.id,
				op: 'insert',
				data: dataForSync,
				createdAt: now,
			});
			trackActivity(appId, tableName, obj.id, 'insert');
			trackFirstContent(appId);
			fireTrigger(appId, tableName, 'insert', { ...dataForSync });
			// Defer cross-table reads outside the Dexie hook's transaction scope
			const objCopy = { ...dataForSync };
			setTimeout(() => {
				checkInlineSuggestion(appId, tableName, objCopy).then((sug) => {
					if (sug)
						window.dispatchEvent(new CustomEvent('mana:automation-suggest', { detail: sug }));
				});
			}, 0);
		});

		table.hook('updating', function (modifications, primKey, obj) {
			if (_applyingTables.has(tableName)) return undefined;
			const now = new Date().toISOString();
			const fields: Record<string, { value: unknown; updatedAt: string }> = {};

			// userId is immutable after creation. Silently strip any attempt to
			// reassign it from a local update so a buggy or malicious caller can
			// never re-parent records to a different user.
			const mods = modifications as Record<string, unknown>;
			if ('userId' in mods) delete mods.userId;

			// Merge field timestamps: keep existing, overwrite for each modified field
			const existingFT =
				((obj as Record<string, unknown>)[FIELD_TIMESTAMPS_KEY] as
					| Record<string, string>
					| undefined) ?? {};
			const newFT: Record<string, string> = { ...existingFT };

			for (const [key, value] of Object.entries(modifications)) {
				if (isInternalKey(key)) continue;
				fields[key] = { value, updatedAt: now };
				newFT[key] = now;
			}

			const op = (modifications as Record<string, unknown>).deletedAt ? 'delete' : 'update';
			trackPendingChange(tableName, {
				appId,
				collection: tableName,
				recordId: primKey as string,
				op,
				fields,
				deletedAt: (modifications as Record<string, unknown>).deletedAt as string | undefined,
				createdAt: now,
			});
			trackActivity(appId, tableName, primKey as string, op);
			fireTrigger(appId, tableName, op, modifications as Record<string, unknown>);

			// Returning an object from a Dexie 'updating' hook merges it into the
			// modifications applied to the record — use this to persist the new
			// per-field timestamps alongside the user's update.
			return { [FIELD_TIMESTAMPS_KEY]: newFT };
		});
	}
}
