<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		/** Position of toolbar: 'top' or 'bottom' (default: 'top') */
		position?: 'top' | 'bottom';
		/** Top offset on desktop when position='top' (default: '70px' - below PillNav) */
		topOffset?: string;
		/** Bottom offset on desktop when position='bottom' (default: '70px' - above PillNav) */
		bottomOffset?: string;
		/** Bottom offset on mobile (default: '70px' - above PillNav) */
		mobileBottomOffset?: string;
		/** Content to render inside the toolbar */
		children: Snippet;
	}

	let {
		position = 'top',
		topOffset = '70px',
		bottomOffset = '70px',
		mobileBottomOffset = '70px',
		children,
	}: Props = $props();
</script>

<div
	class="pill-toolbar"
	class:position-bottom={position === 'bottom'}
	style="--toolbar-top-offset: {topOffset}; --toolbar-bottom-offset: {bottomOffset}; --toolbar-mobile-bottom-offset: {mobileBottomOffset};"
>
	<div class="toolbar-bar glass-pill">
		{@render children()}
	</div>
</div>

<style>
	.pill-toolbar {
		position: fixed;
		top: var(--toolbar-top-offset, 70px);
		left: 0;
		right: 0;
		z-index: 999;
		padding: 0.375rem 1rem;
		pointer-events: none;
		display: flex;
		justify-content: center;
	}

	/* Bottom position */
	.pill-toolbar.position-bottom {
		top: auto;
		bottom: var(--toolbar-bottom-offset, 70px);
	}

	/* Mobile: always position above bottom nav */
	@media (max-width: 768px) {
		.pill-toolbar {
			top: auto;
			bottom: calc(var(--toolbar-mobile-bottom-offset, 70px) + env(safe-area-inset-bottom, 0px));
		}
	}

	/* Single unified bar */
	.toolbar-bar {
		display: flex;
		align-items: center;
		gap: 0.25rem;
		padding: 0.25rem;
		pointer-events: auto;
		max-width: 100%;
		overflow-x: auto;
		scrollbar-width: none;
	}

	.toolbar-bar::-webkit-scrollbar {
		display: none;
	}

	.glass-pill {
		background: rgba(255, 255, 255, 0.85);
		backdrop-filter: blur(12px);
		-webkit-backdrop-filter: blur(12px);
		border: 1px solid rgba(0, 0, 0, 0.1);
		box-shadow:
			0 4px 6px -1px rgba(0, 0, 0, 0.1),
			0 2px 4px -1px rgba(0, 0, 0, 0.06);
		border-radius: 9999px;
	}

	:global(.dark) .glass-pill {
		background: rgba(255, 255, 255, 0.12);
		border: 1px solid rgba(255, 255, 255, 0.15);
	}
</style>
