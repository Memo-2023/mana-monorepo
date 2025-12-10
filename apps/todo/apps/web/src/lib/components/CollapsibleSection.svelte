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
		class="section-header w-full flex items-center gap-2 py-2 cursor-pointer transition-all duration-200"
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
	.section-header:hover {
		opacity: 0.7;
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
