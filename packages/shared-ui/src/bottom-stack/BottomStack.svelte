<script lang="ts">
	/**
	 * BottomStack — offset coordinator for the fixed bottom bar stack.
	 *
	 * Stack order (bottom → top):
	 *   QuickInputBar (always at bottom, fixed offset)
	 *   → PillNav (above input bar)
	 *     → TagStrip (above PillNav)
	 *       → children (e.g. MinimizedTabs)
	 *         → top (e.g. NotificationBar)
	 *
	 * Computes and exposes offsets for each layer so apps don't
	 * need manual pixel arithmetic. Renders "middle" and "top"
	 * content at the correct positions.
	 */
	import type { Snippet } from 'svelte';

	interface Props {
		/** Height of the QuickInputBar in px (default: 72) */
		inputBarHeight?: number;
		/** Is PillNav currently visible? */
		pillNavVisible?: boolean;
		/** Height of PillNav in px (default: 68) */
		pillNavHeight?: number;
		/** Is TagStrip currently visible? */
		tagStripVisible?: boolean;
		/** Height of TagStrip in px (default: 50) */
		tagStripHeight?: number;
		/** Content rendered above TagStrip (e.g. MinimizedTabs) */
		children?: Snippet;
		/** Content rendered at the very top (e.g. NotificationBar) */
		top?: Snippet;
		/** Computed bottom offset for PillNav (bind this) */
		pillNavOffset?: string;
		/** Computed bottom offset for TagStrip (bind this) */
		tagStripOffset?: string;
		/** Computed bottom offset for FAB (bind this) */
		fabOffset?: string;
	}

	let {
		inputBarHeight = 72,
		pillNavVisible = false,
		pillNavHeight = 68,
		tagStripVisible = false,
		tagStripHeight = 50,
		children,
		top,
		pillNavOffset = $bindable('0px'),
		tagStripOffset = $bindable('72px'),
		fabOffset = $bindable('20px'),
	}: Props = $props();

	const BASE = 16;

	// PillNav sits above the InputBar
	let pillNavBottom = $derived(inputBarHeight);

	// TagStrip sits above PillNav (only when PillNav is visible)
	let tagStripBottom = $derived(inputBarHeight + (pillNavVisible ? pillNavHeight : 0));

	// Middle content sits above all fixed bars
	let aboveFixedBars = $derived(
		inputBarHeight +
			(pillNavVisible ? pillNavHeight : 0) +
			(pillNavVisible && tagStripVisible ? tagStripHeight : 0)
	);

	// Measure middle and top content heights
	let middleHeight = $state(0);
	let topHeight = $state(0);

	// Top content sits above middle
	let topBottom = $derived(aboveFixedBars + middleHeight);

	// FAB should be above everything
	let fabBottom = $derived(BASE + 4 + aboveFixedBars + middleHeight + topHeight);

	// Sync bindable outputs
	$effect(() => {
		pillNavOffset = `${pillNavBottom}px`;
	});
	$effect(() => {
		tagStripOffset = `${tagStripBottom}px`;
	});
	$effect(() => {
		fabOffset = `${fabBottom}px`;
	});
</script>

{#if children}
	<div
		class="bottom-stack-layer"
		style="bottom: calc({aboveFixedBars}px + env(safe-area-inset-bottom, 0px))"
		bind:clientHeight={middleHeight}
	>
		{@render children()}
	</div>
{/if}

{#if top}
	<div
		class="bottom-stack-layer"
		style="bottom: calc({topBottom}px + env(safe-area-inset-bottom, 0px))"
		bind:clientHeight={topHeight}
	>
		{@render top()}
	</div>
{/if}

<style>
	.bottom-stack-layer {
		position: fixed;
		left: 50%;
		transform: translateX(-50%);
		z-index: 1001;
		display: flex;
		justify-content: center;
		padding: 0.25rem 0;
	}
</style>
