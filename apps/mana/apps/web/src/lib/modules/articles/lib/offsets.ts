/**
 * Highlight offset resolution.
 *
 * We persist each highlight as a `{ startOffset, endOffset }` pair of
 * plain-text character offsets into the Reader's root. "Plain text" here
 * is the concatenation of all text nodes in document order — i.e. the
 * value of `root.textContent` — so `<p>Hello <strong>world</strong></p>`
 * has the offsets `H=0, e=1, …, w=6, o=7, …`. <br>, <img>, and block
 * boundaries contribute zero characters, which matches `textContent`'s
 * behaviour and the user's mental model of "what did I actually select?"
 *
 * Storing offsets into the rendered DOM (as opposed to the article's raw
 * `content` field) means we don't have to reconcile Readability's
 * whitespace normalisation with the browser's. On re-open we walk the
 * same DOM and find the node for each offset.
 *
 * The context-snippet fields on `LocalHighlight` (`contextBefore`,
 * `contextAfter`) are populated here for re-anchor purposes in later
 * milestones (when the article is re-extracted and the offsets drift).
 */

const CONTEXT_CHARS = 40;

export interface TextOffsetPair {
	start: number;
	end: number;
}

/**
 * A single contiguous text-node slice between `start` and `end` offsets.
 * Used when wrapping a multi-node range into highlight spans.
 */
export interface TextSlice {
	node: Text;
	/** inclusive offset inside this text node */
	start: number;
	/** exclusive offset inside this text node */
	end: number;
}

/**
 * Resolve a DOM Range to plain-text offsets relative to `root`.
 *
 * Returns null if the range is collapsed, not inside the root, or
 * crosses element boundaries we can't map (shouldn't happen for normal
 * user selections inside the reader body).
 */
export function rangeToTextOffsets(range: Range, root: Element): TextOffsetPair | null {
	if (range.collapsed) return null;
	if (!root.contains(range.startContainer) || !root.contains(range.endContainer)) {
		return null;
	}

	let start = -1;
	let end = -1;
	let offset = 0;

	const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
	let node: Node | null = walker.nextNode();
	while (node) {
		const text = node as Text;
		const length = text.data.length;

		if (text === range.startContainer) {
			start = offset + Math.min(range.startOffset, length);
		}
		if (text === range.endContainer) {
			end = offset + Math.min(range.endOffset, length);
			break;
		}
		offset += length;
		node = walker.nextNode();
	}

	// Edge case: range boundaries are element nodes (e.g. the user
	// triple-clicked a paragraph). Fall back to the first/last text
	// descendant so we still get something saveable.
	if (start === -1) start = descendantOffset(root, range.startContainer, range.startOffset);
	if (end === -1) end = descendantOffset(root, range.endContainer, range.endOffset);

	if (start < 0 || end < 0 || end <= start) return null;
	return { start, end };
}

function descendantOffset(root: Element, container: Node, offset: number): number {
	// Element-container ranges report offset in terms of child *nodes*, not
	// characters. Translate by summing textContent of siblings before the
	// child index.
	if (container.nodeType === Node.TEXT_NODE) {
		// Already a text node but wasn't hit in the main walk — find its absolute offset.
		let total = 0;
		const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
		let n: Node | null = walker.nextNode();
		while (n) {
			if (n === container) return total + Math.min(offset, (n as Text).data.length);
			total += (n as Text).data.length;
			n = walker.nextNode();
		}
		return total;
	}
	const childIndex = Math.min(offset, container.childNodes.length);
	let total = textLengthBefore(root, container, childIndex);
	return total;
}

function textLengthBefore(root: Element, container: Node, childIndex: number): number {
	const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
	let total = 0;
	let n: Node | null = walker.nextNode();
	while (n) {
		// Stop once we're past the target child.
		if (isDescendantAtIndexOrLater(container, childIndex, n)) return total;
		total += (n as Text).data.length;
		n = walker.nextNode();
	}
	return total;
}

function isDescendantAtIndexOrLater(container: Node, index: number, candidate: Node): boolean {
	// Walk up from candidate until we hit a direct child of container.
	let node: Node | null = candidate;
	while (node && node.parentNode !== container) {
		node = node.parentNode;
	}
	if (!node) return false;
	const idx = Array.prototype.indexOf.call(container.childNodes, node);
	return idx >= index;
}

/**
 * Resolve `{ start, end }` plain-text offsets back into a list of
 * contiguous text-node slices, suitable for wrapping in highlight
 * spans. Multi-paragraph selections yield multiple slices, one per
 * text node touched.
 */
export function textOffsetsToSlices(root: Element, start: number, end: number): TextSlice[] {
	const slices: TextSlice[] = [];
	if (end <= start) return slices;

	let offset = 0;
	const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
	let node: Node | null = walker.nextNode();
	while (node) {
		const text = node as Text;
		const length = text.data.length;
		const nodeStart = offset;
		const nodeEnd = offset + length;

		if (nodeEnd > start && nodeStart < end) {
			slices.push({
				node: text,
				start: Math.max(0, start - nodeStart),
				end: Math.min(length, end - nodeStart),
			});
		}

		if (nodeEnd >= end) break;
		offset = nodeEnd;
		node = walker.nextNode();
	}
	return slices;
}

export interface SelectionSnapshot {
	start: number;
	end: number;
	text: string;
	contextBefore: string | null;
	contextAfter: string | null;
}

/**
 * Package a user Range into everything we need to persist a highlight:
 * offsets, selected text, and ~40 chars of surrounding context for
 * later re-anchor attempts.
 */
export function extractSelectionSnapshot(range: Range, root: Element): SelectionSnapshot | null {
	const offsets = rangeToTextOffsets(range, root);
	if (!offsets) return null;

	const whole = root.textContent ?? '';
	const text = whole.slice(offsets.start, offsets.end).trim();
	if (!text) return null;

	const before = whole.slice(Math.max(0, offsets.start - CONTEXT_CHARS), offsets.start) || null;
	const after = whole.slice(offsets.end, offsets.end + CONTEXT_CHARS) || null;

	return {
		start: offsets.start,
		end: offsets.end,
		text,
		contextBefore: before,
		contextAfter: after,
	};
}
