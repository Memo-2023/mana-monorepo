<script lang="ts">
	import type { PillDropdownItem } from './types';
	import { phosphorIcons } from './phosphor-icon-map';
	import Pill from './Pill.svelte';

	interface Props {
		/** Items to render as pills in the bar */
		items: PillDropdownItem[];
		/** Label shown at the start of the bar (title of the opened dropdown) */
		label?: string;
		/** Icon rendered next to the label */
		icon?: string;
		/** Use 'static' when inside a flex container (bottom-stack pattern). */
		positioning?: 'fixed' | 'static';
	}

	let { items, label, icon, positioning = 'static' }: Props = $props();

	// A render element is either a single item, a divider/section-label, or a
	// group of items that share the same `group` id (rendered as a segmented
	// toggle pill).
	type RenderElement =
		| { kind: 'item'; id: string; item: PillDropdownItem }
		| { kind: 'divider'; id: string }
		| { kind: 'section-label'; id: string; label: string }
		| { kind: 'group'; id: string; items: PillDropdownItem[] };

	const renderElements = $derived.by<RenderElement[]>(() => {
		const out: RenderElement[] = [];
		// Track groups already emitted so we only render each once.
		const emittedGroups = new Set<string>();

		// First flatten submenus, then collect groups.
		const flat: PillDropdownItem[] = [];
		for (const item of items) {
			if (item.submenu && item.submenu.length > 0) {
				flat.push({ id: `${item.id}-section`, label: item.label, divider: true });
				for (const child of item.submenu) flat.push(child);
			} else {
				flat.push(item);
			}
		}

		for (const item of flat) {
			if (item.divider) {
				const hasLabel = !!item.label;
				out.push(
					hasLabel
						? { kind: 'section-label', id: item.id, label: item.label }
						: { kind: 'divider', id: item.id }
				);
			} else if (item.group) {
				if (!emittedGroups.has(item.group)) {
					emittedGroups.add(item.group);
					const grouped = flat.filter((i) => i.group === item.group);
					out.push({ kind: 'group', id: `group-${item.group}`, items: grouped });
				}
			} else {
				out.push({ kind: 'item', id: item.id, item });
			}
		}
		return out;
	});

	function handleClick(item: PillDropdownItem, event: MouseEvent) {
		if (item.disabled || item.divider) return;
		item.onClick?.(event);
	}
</script>

<div class="dropdown-bar-wrapper" class:static={positioning === 'static'}>
	<div class="dropdown-bar-container">
		{#if label}
			<Pill {icon} {label} disabled class="bar-label" />
		{/if}

		{#each renderElements as el (el.id)}
			{#if el.kind === 'divider'}
				<div class="bar-divider"></div>
			{:else if el.kind === 'section-label'}
				<div class="bar-section-label">{el.label}</div>
			{:else if el.kind === 'group'}
				<!-- Segmented toggle pill. If any label in the group is longer
					 than 10 chars the group shows icon+label; otherwise icon-only
					 (e.g. the Light/Dark/System triple). -->
				{@const showLabels = el.items.some((i) => (i.label?.length ?? 0) > 10)}
				<div class="segmented-toggle glass-pill" class:with-labels={showLabels}>
					{#each el.items as gi (gi.id)}
						<button
							type="button"
							class="segmented-btn"
							class:active={gi.active}
							class:has-progress={gi.progress != null}
							disabled={gi.disabled}
							onclick={(e) => handleClick(gi, e)}
							title={gi.label}
						>
							{#if gi.progress != null}
								<svg class="progress-ring-inline" viewBox="0 0 20 20">
									<circle class="progress-bg" cx="10" cy="10" r="8" />
									<circle
										class="progress-fill"
										cx="10"
										cy="10"
										r="8"
										stroke-dasharray={8 * 2 * Math.PI}
										stroke-dashoffset={8 * 2 * Math.PI * (1 - gi.progress)}
									/>
								</svg>
							{:else if gi.icon && phosphorIcons[gi.icon]}
								{@const GIcon = phosphorIcons[gi.icon]}
								<GIcon size={20} weight="bold" class="segmented-icon" />
							{/if}
							{#if showLabels}
								<span class="segmented-label">{gi.label}</span>
							{/if}
						</button>
					{/each}
				</div>
			{:else}
				{@const item = el.item}
				<Pill
					icon={item.imageUrl ? undefined : item.icon}
					label={item.label}
					active={item.active}
					primary={item.primary}
					danger={item.danger}
					disabled={item.disabled}
					onclick={(e) => handleClick(item, e)}
					title={item.label}
				>
					{#snippet leading()}
						{#if item.imageUrl}
							<img src={item.imageUrl} alt="" class="bar-img" />
						{/if}
					{/snippet}
				</Pill>
			{/if}
		{/each}
	</div>
</div>

<style>
	.dropdown-bar-wrapper {
		display: flex;
		flex-direction: column;
		align-items: stretch;
		justify-content: center;
		pointer-events: none;
		/* Matches tags/tabbar/quickinput slot (see bottomChromeHeight in (app)/+layout.svelte). */
		height: 64px;
	}

	.dropdown-bar-wrapper.static {
		position: relative;
	}

	.dropdown-bar-container {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		pointer-events: auto;
		width: fit-content;
		max-width: 100%;
		margin-left: auto;
		margin-right: auto;
		padding: 0 2rem;
		overflow-x: auto;
		scrollbar-width: none;
		-ms-overflow-style: none;
		mask-image: linear-gradient(
			to right,
			transparent 0%,
			black 2rem,
			black calc(100% - 2rem),
			transparent 100%
		);
		-webkit-mask-image: linear-gradient(
			to right,
			transparent 0%,
			black 2rem,
			black calc(100% - 2rem),
			transparent 100%
		);
	}

	.dropdown-bar-container::-webkit-scrollbar {
		display: none;
	}

	/* .bar-label override: muted background, non-interactive */
	:global(.bar-label) {
		opacity: 1 !important;
		cursor: default !important;
		background: hsl(var(--color-muted, var(--color-card))) !important;
		font-weight: 600 !important;
	}

	.bar-divider {
		width: 1px;
		height: 1.5rem;
		background: hsl(var(--color-border));
		flex-shrink: 0;
		margin: 0 0.125rem;
	}

	.bar-section-label {
		display: inline-flex;
		align-items: center;
		padding: 0 0.5rem;
		font-size: 0.6875rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: hsl(var(--color-muted-foreground));
		flex-shrink: 0;
		white-space: nowrap;
	}

	.bar-img {
		width: 16px;
		height: 16px;
		border-radius: 4px;
		object-fit: cover;
	}

	/* Segmented toggle pill (e.g. Light / Dark / System three-way) */
	.segmented-toggle {
		display: inline-flex;
		align-items: center;
		gap: 0.25rem;
		padding: 0.25rem;
		height: 44px;
		border-radius: 9999px;
		border: 1px solid hsl(var(--color-border));
		background: hsl(var(--color-card));
		box-shadow:
			0 1px 2px hsl(0 0% 0% / 0.05),
			0 2px 6px hsl(0 0% 0% / 0.04);
		flex-shrink: 0;
	}

	.segmented-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 34px;
		height: 34px;
		padding: 0;
		border: none;
		background: transparent;
		border-radius: 9999px;
		cursor: pointer;
		color: hsl(var(--color-foreground));
		transition: all 0.15s;
	}

	.segmented-btn:hover:not(.active):not(:disabled) {
		background: hsl(var(--color-surface-hover, var(--color-muted)));
	}

	.segmented-btn.active {
		background: color-mix(
			in srgb,
			var(--pill-primary-color, var(--color-primary-500, #6366f1)) 20%,
			white 80%
		);
	}

	:global(.dark) .segmented-btn.active {
		background: color-mix(
			in srgb,
			var(--pill-primary-color, var(--color-primary-500, #6366f1)) 30%,
			transparent 70%
		);
	}

	.segmented-btn :global(.segmented-icon) {
		width: 1.25rem;
		height: 1.25rem;
	}

	/* When the group shows labels, give the buttons more padding */
	.segmented-toggle.with-labels .segmented-btn {
		gap: 0.375rem;
		padding: 0.375rem 0.625rem;
	}

	.segmented-label {
		font-size: 0.75rem;
		font-weight: 500;
		white-space: nowrap;
	}

	/* Inline progress ring (replaces icon when downloading) */
	.progress-ring-inline {
		width: 20px;
		height: 20px;
		transform: rotate(-90deg);
		flex-shrink: 0;
	}

	.progress-bg {
		fill: none;
		stroke: hsl(var(--color-border));
		stroke-width: 2;
	}

	.progress-fill {
		fill: none;
		stroke: var(--pill-primary-color, var(--color-primary-500, #6366f1));
		stroke-width: 2.5;
		stroke-linecap: round;
		transition: stroke-dashoffset 0.3s ease;
	}

	.segmented-btn.has-progress {
		position: relative;
	}
</style>
