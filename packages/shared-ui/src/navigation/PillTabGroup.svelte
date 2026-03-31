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
