<!--
  PageShell — Shared card wrapper for pages in a carousel.
  Provides: header, five preset widths, maximized mode.
  Used by workbench (AppPage) and todo (TodoPage).
-->
<script lang="ts">
	import { _ } from 'svelte-i18n';
	import { onMount } from 'svelte';
	import {
		X,
		CornersOut,
		CornersIn,
		CaretLeft,
		CaretRight,
		ArrowsOutLineHorizontal,
		Question,
	} from '@mana/shared-icons';
	import type { Snippet, Component } from 'svelte';
	import { PAGE_WIDTH_PRESETS, nearestPresetIndex } from './width-presets';

	interface Props {
		widthPx: number;
		maximized?: boolean;
		onClose: () => void;
		onMinimize?: () => void;
		onMaximize?: () => void;
		onResize?: (widthPx: number) => void;
		onMoveLeft?: () => void;
		onMoveRight?: () => void;
		onHelp?: () => void;
		helpOpen?: boolean;
		// Default header
		title?: string;
		titleHref?: string;
		color?: string;
		icon?: Component;
		onContextMenu?: (e: MouseEvent) => void;
		// Snippet overrides
		header_left?: Snippet;
		badge?: Snippet;
		toolbar?: Snippet;
		children: Snippet;
	}

	let {
		widthPx,
		maximized = false,
		onClose,
		onMaximize,
		onResize,
		onMoveLeft,
		onMoveRight,
		onHelp,
		helpOpen = false,
		onContextMenu,
		title = '',
		titleHref,
		color = '#6B7280',
		icon: IconComponent,
		header_left,
		badge,
		toolbar,
		children,
	}: Props = $props();

	// Escape exits maximized mode
	onMount(() => {
		function onKeydown(e: KeyboardEvent) {
			if (e.key === 'Escape' && maximized && onMaximize) {
				e.preventDefault();
				e.stopPropagation();
				onMaximize();
			}
		}
		window.addEventListener('keydown', onKeydown);
		return () => window.removeEventListener('keydown', onKeydown);
	});

	let widthMenuOpen = $state(false);
	let widthBtnEl = $state<HTMLButtonElement | null>(null);

	const activePresetIdx = $derived(nearestPresetIndex(widthPx));

	function selectWidth(px: number) {
		widthMenuOpen = false;
		onResize?.(px);
	}

	function handleWidthBtnKey(e: KeyboardEvent) {
		if (e.key === 'Escape' && widthMenuOpen) {
			e.preventDefault();
			widthMenuOpen = false;
			widthBtnEl?.focus();
		}
	}
</script>

<div class="page-shell" class:maximized style="width: {maximized ? '100%' : `${widthPx}px`};">
	<!-- Header with window actions -->
	<div class="page-header" oncontextmenu={onContextMenu} role="banner">
		<div class="header-left">
			{#if header_left}
				{@render header_left()}
			{:else}
				{#if IconComponent}
					<span class="header-icon">
						<IconComponent size={28} weight="bold" />
					</span>
				{:else}
					<span class="color-dot" style="background-color: {color}"></span>
				{/if}
				{#if titleHref}
					<a
						class="page-title page-title-link"
						href={titleHref}
						target="_blank"
						rel="noopener noreferrer"
						onclick={(e) => e.stopPropagation()}
						title={`${title} in neuem Tab öffnen`}
					>
						{title}
					</a>
				{:else}
					<span class="page-title">{title}</span>
				{/if}
			{/if}
			{#if badge}
				{@render badge()}
			{/if}
		</div>
		<div class="window-actions">
			{#if onHelp}
				<button
					class="window-btn"
					class:window-btn-active={helpOpen}
					onclick={(e) => {
						e.stopPropagation();
						onHelp();
					}}
					title="Info"
				>
					<Question size={22} weight="bold" />
				</button>
			{/if}
			{#if onMoveLeft}
				<button
					class="window-btn"
					onclick={(e) => {
						e.stopPropagation();
						onMoveLeft();
					}}
					title="Nach links"
				>
					<CaretLeft size={24} weight="bold" />
				</button>
			{/if}
			{#if onMoveRight}
				<button
					class="window-btn"
					onclick={(e) => {
						e.stopPropagation();
						onMoveRight();
					}}
					title="Nach rechts"
				>
					<CaretRight size={24} weight="bold" />
				</button>
			{/if}
			{#if onResize && !maximized}
				<div class="width-picker-wrapper">
					<button
						bind:this={widthBtnEl}
						class="window-btn"
						onclick={(e) => {
							e.stopPropagation();
							widthMenuOpen = !widthMenuOpen;
						}}
						onkeydown={handleWidthBtnKey}
						aria-haspopup="menu"
						aria-expanded={widthMenuOpen}
						title="Breite ändern"
					>
						<ArrowsOutLineHorizontal size={22} weight="bold" />
					</button>
					{#if widthMenuOpen}
						<!-- svelte-ignore a11y_click_events_have_key_events -->
						<!-- svelte-ignore a11y_no_static_element_interactions -->
						<div class="width-menu-backdrop" onclick={() => (widthMenuOpen = false)}></div>
						<div class="width-menu" role="menu">
							{#each PAGE_WIDTH_PRESETS as preset, idx (preset.widthPx)}
								<button
									class="width-opt"
									class:active={idx === activePresetIdx}
									role="menuitemradio"
									aria-checked={idx === activePresetIdx}
									title={preset.description}
									onclick={(e) => {
										e.stopPropagation();
										selectWidth(preset.widthPx);
									}}
								>
									<span class="width-opt-label">{preset.label}</span>
									<span class="width-opt-px">{preset.widthPx}px</span>
								</button>
							{/each}
						</div>
					{/if}
				</div>
			{/if}
			{#if onMaximize}
				<button
					class="window-btn"
					onclick={(e) => {
						e.stopPropagation();
						onMaximize();
					}}
					title={maximized ? 'Verkleinern' : 'Maximieren'}
				>
					{#if maximized}<CornersIn size={24} weight="bold" />{:else}<CornersOut
							size={24}
							weight="bold"
						/>{/if}
				</button>
			{/if}
			<button
				class="window-btn window-btn-close"
				onclick={(e) => {
					e.stopPropagation();
					onClose();
				}}
				title={$_('common.close')}
			>
				<X size={24} weight="bold" />
			</button>
		</div>
	</div>

	<!-- Optional toolbar (e.g. PageEditBar) -->
	{#if toolbar}
		{@render toolbar()}
	{/if}

	<!-- Body -->
	<div class="page-body">
		{@render children()}
	</div>
</div>

<style>
	/* P5: theme-token migration. The workbench paper card now follows the
	   active theme variant, incl. a per-theme paper-grain texture applied
	   via background-blend-mode (more robust than a ::before overlay +
	   mix-blend-mode + opacity combo, which had invisibility issues in
	   dark mode and stacking-context quirks). CSS vars come from
	   applyThemeToDocument() in @mana/shared-theme — swap one line in
	   THEME_DEFINITIONS to change the texture for a whole theme. */
	.page-shell {
		flex: 0 0 auto;
		/* Default page height fills the viewport between the workbench
		   top padding and the bottom chrome (pill nav + tag strip +
		   bottom bar). Two CSS vars cascade from the layout's <main>:
		    - --bottom-chrome-height reacts to pill-nav collapse, tag
		      strip visibility and bottom-bar mount state
		    - --workbench-reserved-y collapses the py-* wrapper padding
		      plus a small buffer into a single "non-chrome vertical"
		      number so this calc doesn't have to mirror DOM padding
		   `dvh` accounts for mobile Safari's retractable address bar.
		   An inline `height: {px}px` style from the resize-drag prop
		   overrides this value (same specificity rule as before). */
		height: calc(100dvh - var(--bottom-chrome-height, 80px) - var(--workbench-reserved-y, 2.5rem));
		min-height: 320px;
		max-width: calc(100vw - 2rem);
		background-color: hsl(var(--color-card));
		background-image: var(--paper-texture, none);
		background-size: var(--paper-size, 240px 240px);
		background-repeat: repeat;
		background-blend-mode: var(--paper-blend-mode, multiply);
		/* Soft black border — 12% in light mode, bumped to 28% in dark
		   mode (see :global(.dark) override below) where a low-alpha
		   black would otherwise vanish into the background. */
		border: 2px solid hsl(0 0% 0% / 0.12);
		border-radius: 1.25rem;
		box-shadow:
			0 8px 24px hsl(0 0% 0% / 0.12),
			0 3px 8px hsl(0 0% 0% / 0.08);
		display: flex;
		flex-direction: column;
		animation: fadeIn 0.25s ease-out;
		overflow: hidden;
		position: relative;
	}
	/* Dark-mode border needs more alpha to stay visible against the
	   dark card background. */
	:global(.dark) .page-shell {
		border-color: hsl(0 0% 0% / 0.28);
	}

	/* A11y: users who asked for reduced transparency/contrast drop the
	   texture entirely — solid card only. */
	@media (prefers-contrast: more) {
		.page-shell {
			background-image: none;
		}
	}
	.page-shell.maximized {
		position: fixed;
		inset: 0;
		z-index: 95;
		width: 100% !important;
		max-width: none;
		height: 100dvh !important;
		min-height: 100dvh;
		border-radius: 0;
		border: none;
		box-shadow: none;
		animation: fadeInScale 0.2s ease-out;
	}
	@keyframes fadeInScale {
		from {
			opacity: 0.8;
			transform: scale(0.97);
		}
		to {
			opacity: 1;
			transform: scale(1);
		}
	}
	@keyframes fadeIn {
		from {
			opacity: 0;
			transform: translateX(20px);
		}
		to {
			opacity: 1;
			transform: translateX(0);
		}
	}

	/* Header */
	.page-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0.5rem 0.75rem;
	}
	.header-left {
		display: flex;
		align-items: center;
		gap: 0.3rem;
	}
	.header-icon {
		flex-shrink: 0;
		display: flex;
		align-items: center;
		color: hsl(var(--color-foreground));
	}
	.color-dot {
		width: 0.625rem;
		height: 0.625rem;
		border-radius: 9999px;
		flex-shrink: 0;
	}
	.page-title {
		font-size: 0.95rem;
		font-weight: 600;
		color: hsl(var(--color-foreground));
		transform: translateY(1px);
	}
	a.page-title-link {
		text-decoration: none;
		cursor: pointer;
		transition: color 0.15s;
	}
	a.page-title-link:hover {
		color: hsl(var(--color-primary));
		text-decoration: underline;
	}

	.window-actions {
		display: flex;
		align-items: center;
		gap: 0.25rem;
		flex-shrink: 0;
	}
	.window-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 28px;
		height: 28px;
		border-radius: 50%;
		border: none;
		background: transparent;
		color: hsl(var(--color-muted-foreground));
		cursor: pointer;
		transition: all 0.15s;
	}
	.window-btn:hover {
		background: hsl(var(--color-surface-hover));
		color: hsl(var(--color-foreground));
	}
	.window-btn-close:hover {
		background: hsl(var(--color-error) / 0.15);
		color: hsl(var(--color-error));
	}

	/* Body */
	.page-body {
		flex: 1;
		overflow-y: auto;
		min-height: 200px;
	}
	.maximized .page-header {
		max-width: 48rem;
		margin-inline: auto;
		width: 100%;
	}
	.maximized .page-body {
		max-width: 48rem;
		margin-inline: auto;
		width: 100%;
	}

	.window-btn-active {
		background: hsl(var(--color-primary) / 0.12);
		color: hsl(var(--color-primary));
	}

	/* Width picker */
	.width-picker-wrapper {
		position: relative;
		display: inline-flex;
	}
	.width-menu-backdrop {
		position: fixed;
		inset: 0;
		z-index: 50;
		background: transparent;
	}
	.width-menu {
		position: absolute;
		top: calc(100% + 0.375rem);
		right: 0;
		z-index: 60;
		display: flex;
		flex-direction: column;
		min-width: 10rem;
		padding: 0.25rem;
		border-radius: 0.5rem;
		background: hsl(var(--color-card));
		border: 1px solid hsl(var(--color-border));
		box-shadow: 0 8px 24px rgba(0, 0, 0, 0.18);
	}
	.width-opt {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.75rem;
		padding: 0.5rem 0.625rem;
		border: none;
		background: transparent;
		border-radius: 0.375rem;
		font-size: 0.8125rem;
		color: hsl(var(--color-foreground));
		cursor: pointer;
		text-align: left;
		transition: background 0.1s;
	}
	.width-opt:hover {
		background: hsl(var(--color-surface-hover, var(--color-muted)));
	}
	.width-opt.active {
		background: hsl(var(--color-primary) / 0.12);
		color: hsl(var(--color-primary));
	}
	.width-opt-label {
		font-weight: 600;
	}
	.width-opt-px {
		font-variant-numeric: tabular-nums;
		font-size: 0.6875rem;
		color: hsl(var(--color-muted-foreground));
	}
</style>
