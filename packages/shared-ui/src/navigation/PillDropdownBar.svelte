<script lang="ts">
	import type { PillDropdownItem } from './types';
	import {
		Archive,
		Bell,
		Buildings,
		CalendarBlank,
		CaretDown,
		ChartBar,
		ChatCircle,
		Check,
		CheckCircle,
		CheckSquare,
		Clock,
		Cloud,
		Columns,
		Compass,
		CreditCard,
		File,
		FileText,
		Fire,
		Folder,
		Gear,
		Gift,
		Globe,
		GridFour,
		Heart,
		House,
		Key,
		List,
		MagnifyingGlass,
		Microphone,
		Moon,
		MusicNote,
		MusicNotes,
		Palette,
		Playlist,
		Plus,
		Question,
		Robot,
		Scales,
		ShareFat,
		ShareNetwork,
		Shield,
		SignOut,
		Sparkle,
		Spiral,
		Sun,
		Tag,
		Target,
		Timer,
		Trash,
		Tray,
		Upload,
		User,
		Users,
		Waveform,
	} from '@mana/shared-icons';

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const phosphorIcons: Record<string, any> = {
		home: House,
		users: Users,
		user: User,
		tag: Tag,
		heart: Heart,
		settings: Gear,
		chat: ChatCircle,
		'help-circle': Question,
		help: Question,
		'share-2': ShareNetwork,
		bell: Bell,
		clock: Clock,
		timer: Timer,
		target: Target,
		globe: Globe,
		inbox: Tray,
		check: Check,
		checkCircle: CheckCircle,
		'check-square': CheckSquare,
		plus: Plus,
		columns: Columns,
		kanban: Columns,
		mic: Microphone,
		calendar: CalendarBlank,
		folder: Folder,
		archive: Archive,
		upload: Upload,
		music: MusicNote,
		document: File,
		chart: ChartBar,
		'bar-chart-3': ChartBar,
		search: MagnifyingGlass,
		list: List,
		compass: Compass,
		moon: Moon,
		sun: Sun,
		logout: SignOut,
		chevronDown: CaretDown,
		menu: List,
		fire: Fire,
		grid: GridFour,
		gridSmall: GridFour,
		palette: Palette,
		creditCard: CreditCard,
		building: Buildings,
		scale: Scales,
		robot: Robot,
		key: Key,
		shield: Shield,
		gift: Gift,
		'music-notes': MusicNotes,
		playlist: Playlist,
		waveform: Waveform,
		'file-text': FileText,
		sparkle: Sparkle,
		sparkles: Sparkle,
		spiral: Spiral,
		share: ShareFat,
		trash: Trash,
		cloud: Cloud,
	};

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
			<div class="bar-label glass-pill">
				{#if icon && phosphorIcons[icon]}
					{@const IconComponent = phosphorIcons[icon]}
					<IconComponent size={16} />
				{/if}
				<span>{label}</span>
			</div>
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
								<GIcon size={16} class="segmented-icon" />
							{/if}
							{#if showLabels}
								<span class="segmented-label">{gi.label}</span>
							{/if}
						</button>
					{/each}
				</div>
			{:else}
				{@const item = el.item}
				<button
					type="button"
					class="bar-pill glass-pill"
					class:active={item.active}
					class:primary={item.primary}
					class:danger={item.danger}
					disabled={item.disabled}
					onclick={(e) => handleClick(item, e)}
					title={item.label}
				>
					{#if item.imageUrl}
						<img src={item.imageUrl} alt="" class="bar-img" />
					{:else if item.icon && phosphorIcons[item.icon]}
						{@const IconComponent = phosphorIcons[item.icon]}
						<IconComponent size={16} />
					{/if}
					<span>{item.label}</span>
				</button>
			{/if}
		{/each}
	</div>
</div>

<style>
	.dropdown-bar-wrapper {
		display: flex;
		flex-direction: column;
		align-items: stretch;
		pointer-events: none;
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
		padding: 0.5rem 2rem;
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

	.bar-pill {
		display: inline-flex;
		align-items: center;
		gap: 0.375rem;
		padding: 0.5rem 0.875rem;
		border-radius: 9999px;
		font-size: 0.8125rem;
		font-weight: 500;
		white-space: nowrap;
		border: 1px solid hsl(var(--color-border));
		background: hsl(var(--color-card));
		color: hsl(var(--color-foreground));
		cursor: pointer;
		flex-shrink: 0;
		transition: all 0.15s ease;
		box-shadow:
			0 1px 2px hsl(0 0% 0% / 0.05),
			0 2px 6px hsl(0 0% 0% / 0.04);
	}

	.bar-pill:hover:not(:disabled) {
		background: hsl(var(--color-surface-hover, var(--color-card)));
		transform: translateY(-1px);
	}

	.bar-pill:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.bar-pill.active {
		background: color-mix(
			in srgb,
			var(--pill-primary-color, var(--color-primary-500, #f8d62b)) 20%,
			white 80%
		);
		border-color: var(--pill-primary-color, var(--color-primary-500, rgba(248, 214, 43, 0.5)));
		color: #1a1a1a;
	}

	:global(.dark) .bar-pill.active {
		background: color-mix(
			in srgb,
			var(--pill-primary-color, var(--color-primary-500, #f8d62b)) 30%,
			transparent 70%
		);
		color: var(--pill-primary-color, var(--color-primary-500, #f8d62b));
	}

	.bar-pill.primary {
		background: var(--pill-primary-color, var(--color-primary-500, #6366f1));
		border-color: transparent;
		color: white;
	}

	.bar-pill.danger {
		color: #dc2626;
	}

	:global(.dark) .bar-pill.danger {
		color: #ef4444;
	}

	.bar-label {
		display: inline-flex;
		align-items: center;
		gap: 0.375rem;
		padding: 0.5rem 0.875rem;
		border-radius: 9999px;
		font-size: 0.8125rem;
		font-weight: 600;
		white-space: nowrap;
		border: 1px solid hsl(var(--color-border));
		background: hsl(var(--color-muted, var(--color-card)));
		color: hsl(var(--color-foreground));
		flex-shrink: 0;
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
		padding: 0.375rem;
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
		width: 1rem;
		height: 1rem;
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
