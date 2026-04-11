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
		z-index: 50;
		padding: 0.375rem 1rem;
		pointer-events: none;
		display: flex;
		justify-content: center;
	}

	/* Bottom position */
	.pill-toolbar.position-bottom {
		top: auto;
		bottom: var(--toolbar-bottom-offset, 70px);
		transition: bottom 0.3s ease;
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
		overflow: visible;
	}

	.glass-pill {
		background: hsl(var(--color-card));
		border: 1px solid hsl(var(--color-border));
		box-shadow:
			0 1px 2px hsl(0 0% 0% / 0.05),
			0 2px 6px hsl(0 0% 0% / 0.04);
		border-radius: 9999px;
	}
</style>
