<script lang="ts">
	import type { Snippet } from 'svelte';
	import {
		Warning,
		CalendarBlank,
		CalendarDots,
		CheckCircle,
		CaretDown,
	} from '@manacore/shared-icons';

	interface Props {
		title: string;
		count: number;
		icon?: 'warning' | 'today' | 'upcoming' | 'completed';
		variant?: 'default' | 'warning' | 'success';
		defaultOpen?: boolean;
		children: Snippet;
	}

	let { title, count, icon, variant = 'default', defaultOpen = true, children }: Props = $props();
	let isOpen = $state(defaultOpen);

	// Icon colors based on variant
	const iconColors = {
		default: 'text-muted-foreground',
		warning: 'text-red-500',
		success: 'text-green-600 dark:text-green-500',
	};

	// Header text colors
	const headerColors = {
		default: 'text-foreground',
		warning: 'text-red-600 dark:text-red-400',
		success: 'text-green-700 dark:text-green-400',
	};
</script>

<div class="section mb-3">
	<button
		type="button"
		onclick={() => (isOpen = !isOpen)}
		class="section-header glass-pill w-full flex items-center gap-3 px-4 py-3 rounded-full cursor-pointer transition-all duration-200"
	>
		<!-- Icon -->
		<span class="icon-wrapper {iconColors[variant]}">
			{#if icon === 'warning'}
				<Warning size={20} weight="bold" />
			{:else if icon === 'today'}
				<CalendarBlank size={20} weight="bold" />
			{:else if icon === 'upcoming'}
				<CalendarDots size={20} weight="bold" />
			{:else if icon === 'completed'}
				<CheckCircle size={20} weight="bold" />
			{/if}
		</span>

		<!-- Title -->
		<span class="title font-semibold {headerColors[variant]}">{title}</span>

		<!-- Count -->
		<span class="count text-sm text-muted-foreground">({count})</span>

		<!-- Chevron -->
		<span
			class="chevron ml-auto text-muted-foreground transition-transform duration-200"
			class:rotate-180={isOpen}
		>
			<CaretDown size={18} weight="bold" />
		</span>
	</button>

	{#if isOpen}
		<div class="section-content mt-3 pl-1">
			{@render children()}
		</div>
	{/if}
</div>

<style>
	/* Glass pill effect matching PillNavigation */
	.glass-pill {
		background: rgba(255, 255, 255, 0.85);
		backdrop-filter: blur(12px);
		-webkit-backdrop-filter: blur(12px);
		border: 1px solid rgba(0, 0, 0, 0.1);
		box-shadow:
			0 4px 6px -1px rgba(0, 0, 0, 0.1),
			0 2px 4px -1px rgba(0, 0, 0, 0.06);
		position: relative;
		z-index: 1;
	}

	:global(.dark) .glass-pill {
		background: rgba(255, 255, 255, 0.12);
		border: 1px solid rgba(255, 255, 255, 0.15);
	}

	.glass-pill:hover {
		background: rgba(255, 255, 255, 0.95);
		border-color: rgba(0, 0, 0, 0.15);
		transform: translateY(-1px);
		box-shadow:
			0 10px 15px -3px rgba(0, 0, 0, 0.1),
			0 4px 6px -2px rgba(0, 0, 0, 0.05);
	}

	:global(.dark) .glass-pill:hover {
		background: rgba(255, 255, 255, 0.2);
		border-color: rgba(255, 255, 255, 0.25);
	}

	.icon-wrapper {
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
	}

	.section-content {
		animation: slideDown 0.2s ease-out;
	}

	@keyframes slideDown {
		from {
			opacity: 0;
			transform: translateY(-8px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}
</style>
