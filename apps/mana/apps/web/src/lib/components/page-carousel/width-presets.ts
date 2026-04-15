/**
 * Five width presets for cards in a PageCarousel.
 *
 * The workbench used to offer free-form drag-to-resize on both axes.
 * Height was near-universally ignored (pages scroll) and width-drag
 * produced odd pixel values nobody cared to revisit. Replacing that
 * with a small discrete set removes decision fatigue and guarantees
 * cards fit the carousel gap + grid cleanly on every viewport.
 */

export interface PageWidthPreset {
	/** Stable identifier stored in the `widthPx` field of WorkbenchSceneApp. */
	widthPx: number;
	/** Short label shown in the picker. */
	label: string;
	/** Tooltip / aria-label. */
	description: string;
}

export const PAGE_WIDTH_PRESETS: readonly PageWidthPreset[] = [
	{ widthPx: 340, label: 'XS', description: 'Sehr schmal — für Info-Widgets' },
	{ widthPx: 440, label: 'S', description: 'Schmal — für Listen' },
	{ widthPx: 540, label: 'M', description: 'Normal' },
	{ widthPx: 720, label: 'L', description: 'Breit — für Editoren' },
	{ widthPx: 960, label: 'XL', description: 'Sehr breit — für Boards' },
] as const;

export const DEFAULT_PAGE_WIDTH = 540;

/**
 * Snap an arbitrary pixel value (from a legacy drag-resize row or a
 * viewport default) to the nearest preset. Used by the picker to
 * highlight the active entry, and as a safety clamp when old Dexie
 * rows with `widthPx: 823` need to pick an "active" indicator.
 */
export function nearestPresetIndex(widthPx: number | undefined): number {
	if (widthPx === undefined) {
		return PAGE_WIDTH_PRESETS.findIndex((p) => p.widthPx === DEFAULT_PAGE_WIDTH);
	}
	let bestIdx = 0;
	let bestDelta = Infinity;
	PAGE_WIDTH_PRESETS.forEach((p, i) => {
		const delta = Math.abs(p.widthPx - widthPx);
		if (delta < bestDelta) {
			bestDelta = delta;
			bestIdx = i;
		}
	});
	return bestIdx;
}
