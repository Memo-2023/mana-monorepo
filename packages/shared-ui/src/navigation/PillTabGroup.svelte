<script lang="ts">
	import type { PillTabOption } from './types';
	import {
		List,
		Columns,
		Tag,
		Heart,
		House,
		Gear,
		GridFour,
		Clock,
		Timer,
		Target,
		CalendarBlank,
		Fire,
		MagnifyingGlass,
		CheckSquare,
		Funnel,
	} from '@manacore/shared-icons';

	// Map icon names to Phosphor components
	const phosphorIcons: Record<string, any> = {
		list: List,
		columns: Columns,
		kanban: Columns,
		tag: Tag,
		heart: Heart,
		home: House,
		settings: Gear,
		grid: GridFour,
		clock: Clock,
		timer: Timer,
		target: Target,
		calendar: CalendarBlank,
		fire: Fire,
		search: MagnifyingGlass,
		'check-square': CheckSquare,
		filter: Funnel,
	};

	interface Props {
		/** Tab options to display */
		options: PillTabOption[];
		/** Currently selected tab id */
		value: string;
		/** Called when selection changes */
		onChange: (id: string) => void;
		/** Optional section label */
		sectionLabel?: string;
		/** Primary color for active state */
		primaryColor?: string;
		/** Called on right-click (context menu) - receives click coordinates */
		onContextMenu?: (x: number, y: number) => void;
	}

	let { options, value, onChange, sectionLabel, primaryColor, onContextMenu }: Props = $props();

	function handleContextMenu(event: MouseEvent) {
		if (onContextMenu) {
			event.preventDefault();
			onContextMenu(event.clientX, event.clientY);
		}
	}

	// Icon SVG paths (same as PillNavigation)
	const icons: Record<string, string> = {
		list: 'M4 6h16M4 10h16M4 14h16M4 18h16',
		grid: 'M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zM14 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z',
		gridSmall:
			'M4 5a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM10 5a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 01-1 1h-2a1 1 0 01-1-1V5zM16 5a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 01-1 1h-2a1 1 0 01-1-1V5zM4 11a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1v-2zM10 11a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 01-1 1h-2a1 1 0 01-1-1v-2zM16 11a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 01-1 1h-2a1 1 0 01-1-1v-2z',
		heart:
			'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z',
		star: 'M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z',
		clock: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
		fire: 'M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z',
		trending: 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6',
		single: 'M4 6h16M4 12h16M4 18h16',
		calendar:
			'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
		'check-square':
			'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4',
	};

	function getIconPath(name: string): string {
		return icons[name] || '';
	}

	function handleClick(optionId: string, disabled?: boolean) {
		if (!disabled) {
			onChange(optionId);
		}
	}
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div class="pill-tab-group" oncontextmenu={handleContextMenu}>
	<div
		class="tab-container glass-pill"
		style={primaryColor ? `--pill-primary-color: ${primaryColor}` : ''}
	>
		{#each options as option, index}
			{#if index > 0}
				<div class="tab-divider"></div>
			{/if}
			<button
				onclick={() => handleClick(option.id, option.disabled)}
				class="tab-btn"
				class:active={value === option.id}
				class:disabled={option.disabled}
				title={option.title || option.label}
				disabled={option.disabled}
			>
				{#if option.icon}
					{#if option.iconSvg}
						{@html option.iconSvg}
					{:else if phosphorIcons[option.icon]}
						{@const IconComponent = phosphorIcons[option.icon]}
						<IconComponent size={18} class="tab-icon" />
					{:else}
						<svg class="tab-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d={getIconPath(option.icon)}
							/>
						</svg>
					{/if}
				{/if}
				{#if option.label}
					<span class="tab-label">{option.label}</span>
				{/if}
			</button>
		{/each}
	</div>
</div>

<style>
	.pill-tab-group {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.tab-container {
		display: flex;
		align-items: center;
		padding: 0;
		gap: 0;
		border-radius: 9999px;
	}

	/* Glass effect */
	.glass-pill {
		background: rgba(255, 255, 255, 0.85);
		backdrop-filter: blur(12px);
		-webkit-backdrop-filter: blur(12px);
		border: 1px solid rgba(0, 0, 0, 0.1);
		box-shadow:
			0 4px 6px -1px rgba(0, 0, 0, 0.1),
			0 2px 4px -1px rgba(0, 0, 0, 0.06);
	}

	:global(.dark) .glass-pill {
		background: rgba(255, 255, 255, 0.12);
		border: 1px solid rgba(255, 255, 255, 0.15);
	}

	.tab-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.375rem;
		padding: 0.5rem 0.75rem;
		background: transparent;
		border: none;
		cursor: pointer;
		color: #6b7280;
		transition: all 0.2s;
		flex: 1;
	}

	:global(.dark) .tab-btn {
		color: #9ca3af;
	}

	.tab-btn:first-child {
		border-radius: 9999px 0 0 9999px;
	}

	.tab-btn:last-child {
		border-radius: 0 9999px 9999px 0;
	}

	.tab-btn:only-child {
		border-radius: 9999px;
	}

	.tab-btn:hover:not(.disabled) {
		background: rgba(0, 0, 0, 0.05);
		color: #374151;
	}

	:global(.dark) .tab-btn:hover:not(.disabled) {
		background: rgba(255, 255, 255, 0.1);
		color: #f3f4f6;
	}

	.tab-btn.active {
		background: color-mix(
			in srgb,
			var(--pill-primary-color, var(--color-primary-500, #3b82f6)) 20%,
			white 80%
		);
		color: var(--pill-primary-color, var(--color-primary-500, #3b82f6));
	}

	:global(.dark) .tab-btn.active {
		background: color-mix(
			in srgb,
			var(--pill-primary-color, var(--color-primary-500, #3b82f6)) 30%,
			transparent 70%
		);
		color: var(--pill-primary-color, var(--color-primary-500, #3b82f6));
	}

	.tab-btn.disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.tab-divider {
		width: 1px;
		height: 1rem;
		background: rgba(0, 0, 0, 0.1);
		flex-shrink: 0;
	}

	:global(.dark) .tab-divider {
		background: rgba(255, 255, 255, 0.15);
	}

	.tab-icon {
		width: 1.125rem;
		height: 1.125rem;
		flex-shrink: 0;
	}

	.tab-label {
		font-size: 0.8125rem;
		font-weight: 500;
		white-space: nowrap;
	}
</style>
