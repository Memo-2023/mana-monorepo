/**
 * Tiling Tree — Pure Functions
 *
 * Immutable tree operations for the tiling layout.
 * Every mutation returns a new tree to trigger Svelte 5 reactivity.
 */

import type { TileNode, TileLeaf, TileSplit } from '$lib/types/tiling';
import type { WidgetType } from '$lib/types/dashboard';

export function generateId(): string {
	return crypto.randomUUID().slice(0, 8);
}

/** Deep clone a tree node. */
export function cloneTree(node: TileNode): TileNode {
	return structuredClone(node);
}

/** Collect all leaf nodes in depth-first order. */
export function collectLeaves(node: TileNode): TileLeaf[] {
	if (node.type === 'leaf') return [node];
	return [...collectLeaves(node.first), ...collectLeaves(node.second)];
}

/** Find a node by ID. */
export function findNode(root: TileNode, id: string): TileNode | null {
	if (root.id === id) return root;
	if (root.type === 'leaf') return null;
	return findNode(root.first, id) ?? findNode(root.second, id);
}

/** Find the parent split and child key for a given node ID. */
export function findParent(root: TileNode, id: string): [TileSplit, 'first' | 'second'] | null {
	if (root.type === 'leaf') return null;
	if (root.first.id === id) return [root, 'first'];
	if (root.second.id === id) return [root, 'second'];
	return findParent(root.first, id) ?? findParent(root.second, id);
}

/** Split a leaf into two panels. Returns a new tree. */
export function splitLeaf(
	root: TileNode,
	leafId: string,
	direction: 'horizontal' | 'vertical',
	newWidgetType: WidgetType
): TileNode {
	const tree = cloneTree(root);
	const node = findNode(tree, leafId);
	if (!node || node.type !== 'leaf') return tree;

	const newSplit: TileSplit = {
		type: 'split',
		id: generateId(),
		direction,
		ratio: 0.5,
		first: { ...node },
		second: {
			type: 'leaf',
			id: generateId(),
			widgetType: newWidgetType,
		},
	};

	return replaceNode(tree, leafId, newSplit);
}

/** Remove a leaf. Its sibling takes the parent's place. Returns null if tree becomes empty. */
export function removeLeaf(root: TileNode, leafId: string): TileNode | null {
	if (root.type === 'leaf') {
		return root.id === leafId ? null : root;
	}

	const tree = cloneTree(root);
	const parent = findParent(tree, leafId);
	if (!parent) return tree;

	const [parentNode, childKey] = parent;
	const siblingKey = childKey === 'first' ? 'second' : 'first';
	const sibling = parentNode[siblingKey];

	// Replace parent with sibling in the grandparent
	const grandparent = findParent(tree, parentNode.id);
	if (!grandparent) {
		// Parent is root — sibling becomes new root
		return sibling;
	}

	const [grandNode, grandKey] = grandparent;
	grandNode[grandKey] = sibling;
	return tree;
}

/** Swap widget types between two leaves. Returns a new tree. */
export function swapLeaves(root: TileNode, leafIdA: string, leafIdB: string): TileNode {
	const tree = cloneTree(root);
	const a = findNode(tree, leafIdA);
	const b = findNode(tree, leafIdB);
	if (!a || !b || a.type !== 'leaf' || b.type !== 'leaf') return tree;

	const temp = a.widgetType;
	a.widgetType = b.widgetType;
	b.widgetType = temp;
	return tree;
}

/** Update the split ratio. Returns a new tree. */
export function updateRatio(root: TileNode, splitId: string, ratio: number): TileNode {
	const tree = cloneTree(root);
	const node = findNode(tree, splitId);
	if (!node || node.type !== 'split') return tree;

	node.ratio = Math.max(0.1, Math.min(0.9, ratio));
	return tree;
}

/** Change the widget type of a leaf. Returns a new tree. */
export function setLeafWidget(root: TileNode, leafId: string, widgetType: WidgetType): TileNode {
	const tree = cloneTree(root);
	const node = findNode(tree, leafId);
	if (!node || node.type !== 'leaf') return tree;

	node.widgetType = widgetType;
	return tree;
}

/** Replace a node by ID with a new node. */
function replaceNode(root: TileNode, targetId: string, replacement: TileNode): TileNode {
	if (root.id === targetId) return replacement;
	if (root.type === 'leaf') return root;

	return {
		...root,
		first: replaceNode(root.first, targetId, replacement),
		second: replaceNode(root.second, targetId, replacement),
	};
}
