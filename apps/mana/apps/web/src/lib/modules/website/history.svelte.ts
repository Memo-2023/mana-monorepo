/**
 * Editor-scoped undo/redo.
 *
 * Session-only history — lives as long as the EditorView component is
 * mounted on a given page, cleared on page switch and unmount. Stores a
 * `(undo, redo)` pair per user action so both directions are replayable.
 * Does not persist across reloads and does not survive cross-device
 * editing (LWW sync wins in the unlikely conflict case — the editor is
 * practically single-user per session).
 *
 * Why session-only: users expect Cmd+Z to wind back their current work
 * session, not to act as a historical audit log. Cross-session undo
 * would need Before-snapshots in `_events` and a redo cursor, which is a
 * much larger design (see "Option B" in the plan discussion).
 *
 * The history object is passed down via Svelte context — components that
 * need history-aware mutations (BlockInspector, InsertPalette wiring)
 * call `getEditorHistory()` and route through its wrapped methods. The
 * raw `blocksStore` methods remain available as a fallback for non-editor
 * surfaces where no history is mounted.
 */

import { getContext, setContext } from 'svelte';
import { requireBlockSpec } from '@mana/website-blocks';
import { websiteBlocksTable } from './collections';
import type { LocalWebsiteBlock } from './types';
import { blocksStore, type AddBlockInput } from './stores/blocks.svelte';

interface HistoryEntry {
	label: string;
	undo: () => Promise<void>;
	redo: () => Promise<void>;
}

export interface EditorHistory {
	readonly canUndo: boolean;
	readonly canRedo: boolean;
	readonly undoLabel: string | null;
	readonly redoLabel: string | null;

	clear(): void;
	undo(): Promise<void>;
	redo(): Promise<void>;

	addBlock(input: AddBlockInput): Promise<LocalWebsiteBlock>;
	updateBlockProps(id: string, patch: Record<string, unknown>): Promise<void>;
	deleteBlock(id: string): Promise<void>;
	moveBlockUp(id: string): Promise<void>;
	moveBlockDown(id: string): Promise<void>;
}

const HISTORY_CONTEXT_KEY = Symbol('website-editor-history');

export function createEditorHistory(limit = 100): EditorHistory {
	let undoStack = $state<HistoryEntry[]>([]);
	let redoStack = $state<HistoryEntry[]>([]);

	function push(entry: HistoryEntry) {
		undoStack.push(entry);
		if (undoStack.length > limit) undoStack.shift();
		// Any fresh action branches off the redo timeline.
		redoStack = [];
	}

	return {
		get canUndo() {
			return undoStack.length > 0;
		},
		get canRedo() {
			return redoStack.length > 0;
		},
		get undoLabel() {
			return undoStack[undoStack.length - 1]?.label ?? null;
		},
		get redoLabel() {
			return redoStack[redoStack.length - 1]?.label ?? null;
		},

		clear() {
			undoStack = [];
			redoStack = [];
		},

		async undo() {
			const entry = undoStack[undoStack.length - 1];
			if (!entry) return;
			try {
				await entry.undo();
				undoStack.pop();
				redoStack.push(entry);
			} catch (err) {
				// Keep the entry on the stack so the user can retry; the most
				// likely failure is a Zod revalidation error where the old
				// props no longer fit a changed schema.
				console.error('[website/history] undo failed', err);
			}
		},

		async redo() {
			const entry = redoStack[redoStack.length - 1];
			if (!entry) return;
			try {
				await entry.redo();
				redoStack.pop();
				undoStack.push(entry);
			} catch (err) {
				console.error('[website/history] redo failed', err);
			}
		},

		async addBlock(input) {
			const block = await blocksStore.addBlock(input);
			const spec = requireBlockSpec(block.type);
			const snapshot = { ...block };
			push({
				label: `${spec.label} hinzufügen`,
				undo: () => blocksStore.deleteBlock(block.id),
				redo: async () => {
					await blocksStore.restoreBlock(snapshot);
				},
			});
			return block;
		},

		async updateBlockProps(id, patch) {
			const before = await websiteBlocksTable.get(id);
			if (!before) return;
			const prevProps = before.props;
			await blocksStore.updateBlockProps(id, patch);
			const after = await websiteBlocksTable.get(id);
			if (!after) return;
			const nextProps = after.props;
			const spec = requireBlockSpec(before.type);
			push({
				label: `${spec.label} ändern`,
				undo: () => blocksStore.setBlockProps(id, prevProps),
				redo: () => blocksStore.setBlockProps(id, nextProps),
			});
		},

		async deleteBlock(id) {
			const snapshot = await websiteBlocksTable.get(id);
			if (!snapshot) return;
			const spec = requireBlockSpec(snapshot.type);
			await blocksStore.deleteBlock(id);
			push({
				label: `${spec.label} löschen`,
				undo: async () => {
					await blocksStore.restoreBlock(snapshot);
				},
				redo: () => blocksStore.deleteBlock(id),
			});
		},

		async moveBlockUp(id) {
			const before = await websiteBlocksTable.get(id);
			if (!before) return;
			const prevOrder = before.order;
			await blocksStore.moveBlockUp(id);
			const after = await websiteBlocksTable.get(id);
			// Silent no-op at the boundary — don't record an entry.
			if (!after || after.order === prevOrder) return;
			const nextOrder = after.order;
			push({
				label: 'Block verschieben',
				undo: () => blocksStore.setBlockOrder(id, prevOrder),
				redo: () => blocksStore.setBlockOrder(id, nextOrder),
			});
		},

		async moveBlockDown(id) {
			const before = await websiteBlocksTable.get(id);
			if (!before) return;
			const prevOrder = before.order;
			await blocksStore.moveBlockDown(id);
			const after = await websiteBlocksTable.get(id);
			if (!after || after.order === prevOrder) return;
			const nextOrder = after.order;
			push({
				label: 'Block verschieben',
				undo: () => blocksStore.setBlockOrder(id, prevOrder),
				redo: () => blocksStore.setBlockOrder(id, nextOrder),
			});
		},
	};
}

export function setEditorHistoryContext(history: EditorHistory): void {
	setContext(HISTORY_CONTEXT_KEY, history);
}

export function getEditorHistoryContext(): EditorHistory | null {
	return getContext<EditorHistory | null>(HISTORY_CONTEXT_KEY) ?? null;
}
