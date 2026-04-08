/**
 * useDetailEntity — shared plumbing for inline-editable DetailView screens.
 *
 * Encodes the boilerplate every Mana module's DetailView shares:
 *   liveQuery → optional decrypt → reset on id change → focused/confirmDelete state
 *   → delete-with-undo via toastStore.
 *
 * The consumer keeps its own per-field `$state` variables and form template;
 * this helper just removes the ~50 lines of repeated wiring.
 *
 * @example
 * ```svelte
 * <script lang="ts">
 *   import { useDetailEntity } from '$lib/data/detail-entity.svelte';
 *
 *   let { params, goBack }: ViewProps = $props();
 *   let editName = $state('');
 *
 *   const detail = useDetailEntity<LocalFile>({
 *     id: () => params.fileId as string,
 *     table: 'files',
 *     decrypt: true,
 *     onLoad: (file) => { editName = file.name; },
 *   });
 *
 *   async function saveField() {
 *     detail.blur();
 *     await filesStore.renameFile(detail.entity!.id, editName.trim());
 *   }
 * </script>
 *
 * <input bind:value={editName} onfocus={detail.focus} onblur={saveField} />
 * <button onclick={() => detail.deleteWithUndo({
 *   label: 'Datei gelöscht',
 *   delete: () => filesStore.deleteFile(detail.entity!.id),
 *   goBack,
 * })}>Löschen</button>
 * ```
 */

import { liveQuery } from 'dexie';
import { onDestroy } from 'svelte';
import { db } from './database';
import { decryptRecord } from './crypto';
import { toastStore } from '@mana/shared-ui/toast';

export interface DetailEntityOptions<T> {
	/** Reactive getter for the entity id (driven by `params.someId`). */
	id: () => string | undefined;
	/** Dexie table name. Required unless `loader` is provided. */
	table?: string;
	/** When true, the loaded record is run through `decryptRecord` (only used with `table`). */
	decrypt?: boolean;
	/**
	 * Custom loader for cross-table joins or other non-trivial fetches.
	 * If provided, takes precedence over `table` + `decrypt`.
	 * Receives the current id; should return the assembled record (or null).
	 */
	loader?: (id: string) => Promise<T | null>;
	/**
	 * Called whenever a fresh entity is loaded AND no input is currently
	 * focused. Use this to populate per-field `$state` variables.
	 */
	onLoad?: (entity: T) => void;
}

export interface DeleteWithUndoOptions {
	/** Toast label, e.g. "Datei gelöscht". */
	label: string;
	/** Performs the soft-delete (typically a store call). */
	delete: () => Promise<void>;
	/** Navigation back, called after the delete resolves. */
	goBack: () => void;
}

export interface DetailEntityHandle<T> {
	readonly entity: T | null;
	readonly loading: boolean;
	readonly focused: boolean;
	readonly confirmDelete: boolean;
	focus: () => void;
	blur: () => void;
	askDelete: () => void;
	cancelDelete: () => void;
	deleteWithUndo: (opts: DeleteWithUndoOptions) => Promise<void>;
}

export function useDetailEntity<T extends { id?: string }>(
	opts: DetailEntityOptions<T>
): DetailEntityHandle<T> {
	let entity = $state<T | null>(null);
	let loading = $state(true);
	let focused = $state(false);
	let confirmDelete = $state(false);

	let unsubscribe: (() => void) | null = null;

	$effect(() => {
		const id = opts.id();
		// Reset transient UI state on every id change.
		confirmDelete = false;
		focused = false;
		entity = null;
		loading = true;

		if (unsubscribe) {
			unsubscribe();
			unsubscribe = null;
		}
		if (!id) {
			loading = false;
			return;
		}

		const obs = liveQuery(async () => {
			if (opts.loader) {
				return await opts.loader(id);
			}
			if (!opts.table) {
				throw new Error('useDetailEntity requires either `table` or `loader`');
			}
			const raw = await db.table<T>(opts.table).get(id);
			if (!raw) return null;
			if (opts.decrypt) {
				// clone before decrypt so the IDB-cached row stays ciphertext
				return (await decryptRecord(opts.table, { ...raw })) as T;
			}
			return raw;
		});
		const sub = obs.subscribe((val) => {
			entity = val ?? null;
			loading = false;
			if (val && !focused) {
				opts.onLoad?.(val);
			}
		});
		unsubscribe = () => sub.unsubscribe();
	});

	onDestroy(() => {
		if (unsubscribe) unsubscribe();
	});

	return {
		get entity() {
			return entity;
		},
		get loading() {
			return loading;
		},
		get focused() {
			return focused;
		},
		get confirmDelete() {
			return confirmDelete;
		},
		focus: () => {
			focused = true;
		},
		blur: () => {
			focused = false;
		},
		askDelete: () => {
			confirmDelete = true;
		},
		cancelDelete: () => {
			confirmDelete = false;
		},
		async deleteWithUndo({ label, delete: doDelete, goBack }: DeleteWithUndoOptions) {
			const id = opts.id();
			if (!id) return;
			await doDelete();
			goBack();
			if (opts.table) {
				toastStore.undo(label, () => {
					db.table(opts.table!).update(id, {
						deletedAt: undefined,
						updatedAt: new Date().toISOString(),
					});
				});
			} else {
				// Custom loader: consumer must provide its own undo via the toast directly.
				toastStore.undo(label, () => {});
			}
		},
	};
}
