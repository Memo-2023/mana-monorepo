import { writable, derived } from 'svelte/store';
import type { Memo } from '$lib/types/memo.types';

export type SplitDirection = 'vertical' | 'horizontal' | 'none';

export interface Tab {
	id: string;
	memoId: string;
	memo: Memo | null;
	audioUrl: string | null;
	isActive: boolean;
}

export interface Split {
	id: string;
	direction: SplitDirection;
	tabs: Tab[];
	activeTabId: string | null;
}

interface TabState {
	splits: Split[];
	activeSplitId: string | null;
}

function createTabStore() {
	const { subscribe, set, update } = writable<TabState>({
		splits: [],
		activeSplitId: null,
	});

	return {
		subscribe,

		// Initialize with first memo
		init: (memo: Memo, audioUrl: string | null = null) => {
			const tabId = crypto.randomUUID();
			const splitId = crypto.randomUUID();

			set({
				splits: [
					{
						id: splitId,
						direction: 'none',
						tabs: [
							{
								id: tabId,
								memoId: memo.id,
								memo,
								audioUrl,
								isActive: true,
							},
						],
						activeTabId: tabId,
					},
				],
				activeSplitId: splitId,
			});
		},

		// Open memo in new tab in active split
		openTab: (memo: Memo, audioUrl: string | null = null) => {
			update((state) => {
				if (!state.activeSplitId) return state;

				const splitIndex = state.splits.findIndex((s) => s.id === state.activeSplitId);
				if (splitIndex === -1) return state;

				const split = state.splits[splitIndex];

				// Check if memo is already open in this split
				const existingTab = split.tabs.find((t) => t.memoId === memo.id);
				if (existingTab) {
					// Just activate the existing tab
					return {
						...state,
						splits: state.splits.map((s, i) =>
							i === splitIndex
								? {
										...s,
										tabs: s.tabs.map((t) => ({
											...t,
											isActive: t.id === existingTab.id,
										})),
										activeTabId: existingTab.id,
									}
								: s
						),
					};
				}

				// Create new tab
				const newTab: Tab = {
					id: crypto.randomUUID(),
					memoId: memo.id,
					memo,
					audioUrl,
					isActive: true,
				};

				return {
					...state,
					splits: state.splits.map((s, i) =>
						i === splitIndex
							? {
									...s,
									tabs: [...s.tabs.map((t) => ({ ...t, isActive: false })), newTab],
									activeTabId: newTab.id,
								}
							: s
					),
				};
			});
		},

		// Open memo in new split
		openInSplit: (memo: Memo, direction: SplitDirection, audioUrl: string | null = null) => {
			update((state) => {
				const newTabId = crypto.randomUUID();
				const newSplitId = crypto.randomUUID();

				const newSplit: Split = {
					id: newSplitId,
					direction,
					tabs: [
						{
							id: newTabId,
							memoId: memo.id,
							memo,
							audioUrl,
							isActive: true,
						},
					],
					activeTabId: newTabId,
				};

				return {
					...state,
					splits: [...state.splits, newSplit],
					activeSplitId: newSplitId,
				};
			});
		},

		// Activate a tab
		activateTab: (splitId: string, tabId: string) => {
			update((state) => ({
				...state,
				splits: state.splits.map((split) =>
					split.id === splitId
						? {
								...split,
								tabs: split.tabs.map((tab) => ({
									...tab,
									isActive: tab.id === tabId,
								})),
								activeTabId: tabId,
							}
						: split
				),
				activeSplitId: splitId,
			}));
		},

		// Close a tab
		closeTab: (splitId: string, tabId: string) => {
			update((state) => {
				const splitIndex = state.splits.findIndex((s) => s.id === splitId);
				if (splitIndex === -1) return state;

				const split = state.splits[splitIndex];
				const tabIndex = split.tabs.findIndex((t) => t.id === tabId);
				if (tabIndex === -1) return state;

				const newTabs = split.tabs.filter((t) => t.id !== tabId);

				// If no tabs left, remove the split
				if (newTabs.length === 0) {
					const newSplits = state.splits.filter((s) => s.id !== splitId);
					return {
						splits: newSplits,
						activeSplitId: newSplits.length > 0 ? newSplits[0].id : null,
					};
				}

				// If closed tab was active, activate the next one
				let newActiveTabId = split.activeTabId;
				if (tabId === split.activeTabId) {
					const nextIndex = Math.min(tabIndex, newTabs.length - 1);
					newActiveTabId = newTabs[nextIndex].id;
					newTabs[nextIndex].isActive = true;
				}

				return {
					...state,
					splits: state.splits.map((s, i) =>
						i === splitIndex
							? {
									...s,
									tabs: newTabs,
									activeTabId: newActiveTabId,
								}
							: s
					),
				};
			});
		},

		// Close a split
		closeSplit: (splitId: string) => {
			update((state) => {
				const newSplits = state.splits.filter((s) => s.id !== splitId);
				return {
					splits: newSplits,
					activeSplitId:
						state.activeSplitId === splitId && newSplits.length > 0
							? newSplits[0].id
							: state.activeSplitId,
				};
			});
		},

		// Update memo data in tab (for real-time updates)
		updateMemo: (memoId: string, memo: Memo) => {
			update((state) => ({
				...state,
				splits: state.splits.map((split) => ({
					...split,
					tabs: split.tabs.map((tab) => (tab.memoId === memoId ? { ...tab, memo } : tab)),
				})),
			}));
		},

		// Clear all tabs
		clear: () => {
			set({
				splits: [],
				activeSplitId: null,
			});
		},
	};
}

export const tabs = createTabStore();

// Derived store for active tab
export const activeTab = derived(tabs, ($tabs) => {
	if (!$tabs.activeSplitId) return null;

	const activeSplit = $tabs.splits.find((s) => s.id === $tabs.activeSplitId);
	if (!activeSplit || !activeSplit.activeTabId) return null;

	return activeSplit.tabs.find((t) => t.id === activeSplit.activeTabId) || null;
});
