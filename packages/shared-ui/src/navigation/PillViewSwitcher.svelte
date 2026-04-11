<script lang="ts">
	import { tick } from 'svelte';
	import { CalendarBlank, List, GridFour, ClipboardText, ListChecks } from '@mana/shared-icons';

	export interface ViewOption {
		/** Unique identifier */
		id: string;
		/** Display label */
		label: string;
		/** Optional icon name */
		icon?: string;
		/** Optional tooltip */
		title?: string;
		/** Whether this option is disabled */
		disabled?: boolean;
	}

	interface Props {
		/** Available view options */
		options: ViewOption[];
		/** Currently selected view id */
		value: string;
		/** Called when view changes */
		onChange: (id: string) => void;
		/** Embedded mode - no background/border, for use inside a parent bar */
		embedded?: boolean;
	}

	let { options, value, onChange, embedded = false }: Props = $props();

	let containerRef = $state<HTMLDivElement | null>(null);
	let indicatorStyle = $state('');

	// Update indicator position when value changes
	$effect(() => {
		if (containerRef && value) {
			tick().then(updateIndicator);
		}
	});

	function updateIndicator() {
		if (!containerRef) return;

		const activeButton = containerRef.querySelector(`[data-id="${value}"]`) as HTMLButtonElement;
		if (activeButton) {
			const containerRect = containerRef.getBoundingClientRect();
			const buttonRect = activeButton.getBoundingClientRect();

			const left = buttonRect.left - containerRect.left;
			const width = buttonRect.width;

			indicatorStyle = `left: ${left}px; width: ${width}px;`;
		}
	}

	function handleClick(optionId: string, disabled?: boolean) {
		if (!disabled) {
			onChange(optionId);
		}
	}

	// Map icon names to Phosphor components
	const phosphorIcons: Record<string, any> = {
		day: CalendarBlank,
		week: List,
		month: GridFour,
		year: ClipboardText,
		agenda: ListChecks,
		list: List,
		grid: GridFour,
		calendar: CalendarBlank,
	};
</script>

<div
	class="pill-view-switcher"
	class:glass-pill={!embedded}
	class:embedded-switcher={embedded}
	bind:this={containerRef}
>
	<!-- Sliding indicator -->
	<div class="sliding-indicator" style={indicatorStyle}></div>

	<!-- Options -->
	{#each options as option}
		<button
			data-id={option.id}
			onclick={() => handleClick(option.id, option.disabled)}
			class="switcher-btn"
			class:active={value === option.id}
			class:disabled={option.disabled}
			title={option.title || option.label}
			disabled={option.disabled}
		>
			{#if option.icon && phosphorIcons[option.icon]}
				{@const IconComponent = phosphorIcons[option.icon]}
				<IconComponent size={16} class="switcher-icon" />
			{/if}
			<span class="switcher-label">{option.label}</span>
		</button>
	{/each}
</div>

<style>
	.pill-view-switcher {
		position: relative;
		display: inline-flex;
		align-items: center;
		padding: 0.1875rem;
		border-radius: 9999px;
		gap: 0.125rem;
	}

	.glass-pill {
		background: hsl(var(--color-card));
		border: 1px solid hsl(var(--color-border));
		box-shadow:
			0 1px 2px hsl(0 0% 0% / 0.05),
			0 2px 6px hsl(0 0% 0% / 0.04);
	}

	/* Embedded mode - no background/border */
	.embedded-switcher {
		background: transparent;
		border: none;
		box-shadow: none;
		padding: 0;
		gap: 0;
	}

	/* Sliding indicator */
	.sliding-indicator {
		position: absolute;
		top: 0;
		bottom: 0;
		border-radius: 9999px;
		background: hsl(var(--color-primary) / 0.15);
		box-shadow: 0 1px 3px hsl(var(--color-foreground) / 0.1);
		transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
		z-index: 0;
	}

	.switcher-btn {
		position: relative;
		z-index: 1;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.25rem;
		padding: 0.5rem 0.875rem;
		background: transparent;
		border: none;
		border-radius: 9999px;
		cursor: pointer;
		color: hsl(var(--color-muted-foreground));
		font-size: 0.875rem;
		font-weight: 500;
		white-space: nowrap;
		transition: color 0.15s ease;
	}

	.switcher-btn:hover:not(.disabled) {
		color: hsl(var(--color-foreground));
	}

	.switcher-btn.active {
		color: hsl(var(--color-primary));
	}

	.switcher-btn.disabled {
		opacity: 0.4;
		cursor: not-allowed;
	}

	.switcher-label {
		line-height: 1;
	}
</style>
